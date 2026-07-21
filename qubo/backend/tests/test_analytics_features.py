import unittest
from datetime import date

from app.services.analytics import AnalyticsService
from app.services.quiz import QuizLibraryService
from app.services.report import ProgressReportService


class AnalyticsFeatureTests(unittest.TestCase):
    def test_prediction_is_bounded_and_uses_recent_activity(self):
        without_study = AnalyticsService._calculate_prediction([40, 50, 60], 0)
        with_study = AnalyticsService._calculate_prediction([40, 50, 60], 150)
        self.assertGreater(with_study, without_study)
        self.assertGreaterEqual(with_study, 0)
        self.assertLessEqual(with_study, 100)

    def test_review_schedule_resets_after_low_score(self):
        result = QuizLibraryService._calculate_review_schedule(35, 2.5, 12, 4, date(2026, 7, 17))
        self.assertEqual(result["repetitions"], 0)
        self.assertEqual(result["interval_days"], 1)
        self.assertEqual(result["next_review_date"], "2026-07-18")

    def test_review_schedule_expands_after_success(self):
        result = QuizLibraryService._calculate_review_schedule(90, 2.5, 6, 2, date(2026, 7, 17))
        self.assertEqual(result["repetitions"], 3)
        self.assertEqual(result["interval_days"], 15)

    def test_progress_report_is_a_nonempty_pdf(self):
        pdf = ProgressReportService.render(
            {"username": "student", "full_name": "Sample Student", "school": "Sample School", "form_level": "Form 5", "target_grade": "A"},
            [{
                "subject_name": "Mathematics",
                "study_minutes": 180,
                "quizzes_completed": 3,
                "overall_mastery": 76,
                "learning_velocity": 4.5,
                "latest_prediction": {"predicted_score": 72, "is_warning": False},
            }],
            [{"session_date": "2026-07-17T10:00:00+00:00", "subject_name": "Mathematics", "topic_name": "Quadratic equations", "duration_minutes": 50}],
            [{"subject_name": "Mathematics", "topic_name": "Quadratic equations", "next_review_date": "2026-07-23", "interval_days": 6, "last_score": 80}],
            "en",
            "17 July 2026, 18:00",
        )
        self.assertTrue(pdf.startswith(b"%PDF"))
        self.assertGreater(len(pdf), 3000)


if __name__ == "__main__":
    unittest.main()
