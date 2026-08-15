import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.services.recommendation import RecommendationExplanationService
from app.services.resource import ResourceService
from app.services.video import VideoService


class _Query:
    def __init__(self, rows):
        self.rows = rows

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def execute(self):
        return SimpleNamespace(data=self.rows)


class _Supabase:
    def __init__(self, learning_style, events):
        self.tables = {
            "profiles": [{"learning_style": learning_style}],
            "user_resources": [],
            "learning_events": events,
        }

    def table(self, name):
        return _Query(self.tables[name])


class ResourceRecommendationTests(unittest.TestCase):
    models = [
        {
            "resource_id": "chemistry-model",
            "title": "Atomic Structure Model",
            "subject_name": "Chemistry",
            "topic_name": "Atomic structure",
            "learning_style_tag": "visual",
            "preview_model_url": "https://example.test/atom.glb",
        },
        {
            "resource_id": "biology-model",
            "title": "Cell Model",
            "subject_name": "Biology",
            "topic_name": "Cells",
            "learning_style_tag": "visual",
            "preview_model_url": "https://example.test/cell.glb",
        },
    ]
    videos = [
        {
            "video_id": "chemistry-video",
            "title": "Atomic Structure Explained",
            "subject_tag": "Chemistry",
            "youtube_url": "https://youtube.test/watch?v=chemistry",
        }
    ]

    @staticmethod
    def _weak_quiz_events():
        return [{
            "event_type": "quiz_completed",
            "metadata": {"subject_name": "Chemistry", "score_percent": 45},
        }]

    def _recommend(self, learning_style):
        supabase = _Supabase(learning_style, self._weak_quiz_events())
        with patch("app.services.resource.get_supabase", return_value=supabase), \
             patch.object(ResourceService, "list_3d_models", return_value=self.models), \
             patch.object(VideoService, "list_videos", return_value=self.videos), \
             patch.object(RecommendationExplanationService, "explain", side_effect=lambda _title, _subject, reason: reason):
            return ResourceService.recommend_3d_model("student-id")

    def test_weak_topic_recommends_a_video_for_an_auditory_student(self):
        recommendation = self._recommend("auditory")

        self.assertEqual(recommendation["target_type"], "video")
        self.assertEqual(recommendation["target_id"], "chemistry-video")
        self.assertIn("45%", recommendation["reason"])
        self.assertIn("auditory", recommendation["reason"])

    def test_weak_topic_recommends_a_matching_model_for_a_visual_student(self):
        recommendation = self._recommend("visual")

        self.assertEqual(recommendation["target_type"], "model")
        self.assertEqual(recommendation["target_id"], "chemistry-model")
        self.assertIn("45%", recommendation["reason"])

    def test_kinesthetic_student_gets_an_interactive_model_and_practice_goal(self):
        recommendation = self._recommend("kinesthetic")

        self.assertEqual(recommendation["target_type"], "model")
        self.assertEqual(recommendation["target_id"], "chemistry-model")
        self.assertIn("practice questions", recommendation["learning_goal"])


if __name__ == "__main__":
    unittest.main()
