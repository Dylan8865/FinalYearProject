from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.services.admin import AdminService
from app.services.resource import ResourceService


@patch("app.services.admin.get_supabase")
def test_admin_list_users_filters_correctly(mock_get_supabase):
    mock_table = MagicMock()
    mock_get_supabase.return_value.table.return_value = mock_table
    mock_select = mock_table.select.return_value
    mock_order = mock_select.order.return_value
    mock_order.execute.return_value.data = [{"id": "user1", "username": "student1"}]
    
    # Test without search
    result = AdminService.list_users()
    assert len(result) == 1
    assert result[0]["id"] == "user1"
    mock_order.or_.assert_not_called()

    # Test with search
    mock_or = mock_order.or_.return_value
    mock_or.execute.return_value.data = [{"id": "user2", "username": "search_user"}]
    result = AdminService.list_users("search")
    assert len(result) == 1
    assert result[0]["id"] == "user2"
    mock_order.or_.assert_called_once()
    assert "%search%" in mock_order.or_.call_args.args[0]


@patch("app.services.admin.get_supabase")
def test_admin_lock_user_audits_action(mock_get_supabase):
    mock_table = MagicMock()
    mock_get_supabase.return_value.table.return_value = mock_table
    
    # Setup for the update to succeed
    mock_table.update.return_value.eq.return_value.execute.return_value.data = [{"id": "user-to-lock"}]
    
    AdminService.set_lock("admin-id", "user-to-lock", locked=True, reason="Violation")
    
    # Verify update payload
    update_kwargs = mock_table.update.call_args.args[0]
    assert update_kwargs["locked_until"] is not None
    assert update_kwargs["failed_login_attempts"] == 5
    
    # Verify audit log was created
    mock_table.insert.assert_called_once()
    audit_payload = mock_table.insert.call_args.args[0]
    assert audit_payload["admin_id"] == "admin-id"
    assert audit_payload["action"] == "account_locked"
    assert audit_payload["target_user_id"] == "user-to-lock"
    assert audit_payload["reason"] == "Violation"


def test_admin_cannot_lock_self():
    with pytest.raises(HTTPException) as exc:
        AdminService.set_lock("admin-123", "admin-123", locked=True, reason="Self-lock")
    assert exc.value.status_code == 400
    assert "cannot lock their own account" in str(exc.value.detail).lower()


@patch("app.services.admin.get_supabase")
def test_admin_delete_content_removes_associations(mock_get_supabase):
    supabase = mock_get_supabase.return_value
    
    # Mock video fetch
    mock_video_table = MagicMock()
    supabase.table.return_value = mock_video_table
    
    def side_effect(table_name):
        mock = MagicMock()
        if table_name == "videos":
            mock.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [{"video_id": "vid-1", "uploaded_by": "educator-1"}]
        return mock
        
    supabase.table.side_effect = side_effect
    
    AdminService.delete_content("admin-id", "video", "vid-1")
    
    # Should have called delete on associated tables (e.g. content_shares, user_favourites)
    # The actual implementation deletes from 5 associated tables then the videos table itself
    assert supabase.table.call_count >= 6
    
    # Check audit log insert
    # Assuming 'admin_audit_logs' is one of the tables requested
    audit_calls = [c for c in supabase.table.call_args_list if c.args[0] == "admin_audit_logs"]
    assert len(audit_calls) > 0


@patch("app.services.admin.get_supabase")
def test_admin_delete_user_rejects_admin_deletion(mock_get_supabase):
    supabase = mock_get_supabase.return_value
    mock_table = MagicMock()
    supabase.table.return_value = mock_table
    
    # Mock finding an admin profile
    mock_table.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
        {"id": "other-admin", "role": "admin"}
    ]
    
    with pytest.raises(HTTPException) as exc:
        AdminService.delete_user("admin-123", "other-admin")
    
    assert exc.value.status_code == 403
    assert "must be managed manually" in str(exc.value.detail).lower()
