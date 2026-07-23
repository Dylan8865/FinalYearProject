from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.services.auth import AuthService
from app.schemas.auth import StudyReminderPreferencesUpdate


@patch("app.services.auth.create_supabase_auth_client")
@patch("app.services.auth.get_supabase")
def test_deactivate_account_preserves_data_and_blocks_profile(mock_get_supabase, mock_auth_client):
    profile_table = MagicMock()
    mock_get_supabase.return_value.table.return_value = profile_table

    result = AuthService.deactivate_account(
        "user-id",
        "student@example.com",
        "Password1!",
    )

    mock_auth_client.return_value.auth.sign_in_with_password.assert_called_once()
    profile_table.update.assert_called_once()
    update = profile_table.update.call_args.args[0]
    assert update["is_active"] is False
    assert update["deactivated_at"]
    assert result["message"] == "Account deactivated successfully"


@patch("app.services.auth.create_supabase_auth_client")
@patch("app.services.auth.get_supabase")
def test_delete_account_removes_supabase_auth_user(mock_get_supabase, mock_auth_client):
    supabase = mock_get_supabase.return_value
    bucket = MagicMock()
    bucket.list.return_value = []
    supabase.storage.from_.return_value = bucket

    result = AuthService.delete_account(
        "user-id",
        "student@example.com",
        "Password1!",
    )

    mock_auth_client.return_value.auth.sign_in_with_password.assert_called_once()
    supabase.auth.admin.delete_user.assert_called_once_with("user-id")
    assert result["message"] == "Account and learning data deleted permanently"


@patch("app.services.auth.create_supabase_auth_client")
def test_account_action_rejects_incorrect_password(mock_auth_client):
    mock_auth_client.return_value.auth.sign_in_with_password.side_effect = RuntimeError("invalid login")

    with pytest.raises(HTTPException) as error:
        AuthService._verify_account_password("student@example.com", "wrong")

    assert error.value.status_code == 400
    assert error.value.detail == "Incorrect password"


@patch("app.services.auth.create_supabase_auth_client")
@patch("app.services.auth.get_supabase")
def test_clear_learning_history_preserves_profile_and_saved_quizzes(mock_get_supabase, mock_auth_client):
    supabase = mock_get_supabase.return_value
    table_mocks = {}

    def table_for(name):
        table = MagicMock()
        table.delete.return_value.eq.return_value.execute.return_value.data = []
        table_mocks[name] = table
        return table

    supabase.table.side_effect = table_for

    result = AuthService.clear_learning_history(
        "user-id",
        "student@example.com",
        "Password1!",
    )

    mock_auth_client.return_value.auth.sign_in_with_password.assert_called_once()
    assert "profiles" not in table_mocks
    assert "quizzes" not in table_mocks
    assert set(result["cleared"]) == {
        "exam_predictions",
        "quiz_attempts",
        "study_sessions",
        "performance_records",
        "spaced_repetition_schedule",
        "learning_events",
        "user_resources",
        "matches",
    }


@patch("app.services.auth.get_supabase")
def test_learning_style_scores_are_normalized_and_persisted(mock_get_supabase):
    profile_table = MagicMock()
    mock_get_supabase.return_value.table.return_value = profile_table

    result = AuthService.set_learning_style("user-id", 80, 40, 20)

    saved = profile_table.update.call_args.args[0]
    assert result["learning_style"] == "visual"
    assert result["scores"] == {"visual": 57, "auditory": 29, "kinesthetic": 14}
    assert saved["visual_score"] + saved["auditory_score"] + saved["kinesthetic_score"] == 100
    assert saved["learning_style_assessed_at"]


@patch.object(AuthService, "get_study_reminders")
@patch("app.services.auth.get_supabase")
def test_study_reminders_are_saved_as_profile_preferences(mock_get_supabase, mock_get_reminders):
    mock_get_reminders.return_value = {
        "daily_flashcards_enabled": True,
        "daily_flashcards_time": "19:15:00",
        "nightly_review_enabled": False,
        "nightly_review_time": "22:45:00",
        "reminder_timezone": "Asia/Kuala_Lumpur",
    }
    profile_table = MagicMock()
    mock_get_supabase.return_value.table.return_value = profile_table
    preferences = StudyReminderPreferencesUpdate(
        daily_flashcards_enabled=True,
        daily_flashcards_time="19:15",
        nightly_review_enabled=False,
        nightly_review_time="22:45",
    )

    result = AuthService.update_study_reminders("user-id", preferences)

    saved = profile_table.update.call_args.args[0]
    assert saved == {
        "daily_flashcards_enabled": True,
        "daily_flashcards_time": "19:15",
        "nightly_review_enabled": False,
        "nightly_review_time": "22:45",
    }
    assert result["reminder_timezone"] == "Asia/Kuala_Lumpur"
