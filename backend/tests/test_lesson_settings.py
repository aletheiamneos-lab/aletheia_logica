from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app import lesson_settings_service


class LessonSettingsTests(unittest.TestCase):
    def setUp(self):
        self.settings: dict[str, str] = {}
        self.get_setting_patch = patch.object(
            lesson_settings_service,
            "get_setting",
            side_effect=self.settings.get,
        )
        self.set_setting_patch = patch.object(
            lesson_settings_service,
            "set_setting",
            side_effect=lambda key, value: self.settings.__setitem__(key, value),
        )
        self.get_setting_patch.start()
        self.set_setting_patch.start()

    def tearDown(self):
        self.get_setting_patch.stop()
        self.set_setting_patch.stop()

    def test_lessons_are_hidden_from_students_by_default(self):
        response = lesson_settings_service.get_lessons_visibility({"role": "student"})

        self.assertFalse(response["can_manage"])
        self.assertEqual(response["lessons"], [])

    def test_admin_sees_every_lesson_and_can_publish_one(self):
        admin_response = lesson_settings_service.get_lessons_visibility({"role": "admin"})
        self.assertTrue(admin_response["can_manage"])
        self.assertEqual(
            [lesson["lesson_id"] for lesson in admin_response["lessons"]],
            list(lesson_settings_service.LESSON_IDS),
        )

        lesson_settings_service.update_lesson_visibility(2, True)
        student_response = lesson_settings_service.get_lessons_visibility({"role": "student"})
        self.assertEqual(
            student_response["lessons"],
            [{"lesson_id": 2, "is_visible_to_students": True}],
        )

    def test_hidden_lesson_direct_access_is_rejected_for_student(self):
        with self.assertRaises(HTTPException) as context:
            lesson_settings_service.ensure_lesson_access(1, {"role": "student"})

        self.assertEqual(context.exception.status_code, 403)
        lesson_settings_service.ensure_lesson_access(1, {"role": "admin"})

    def test_unknown_lesson_is_rejected(self):
        with self.assertRaises(HTTPException) as context:
            lesson_settings_service.update_lesson_visibility(999, True)

        self.assertEqual(context.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
