from __future__ import annotations

import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app import library_settings_service


class LibrarySettingsTests(unittest.TestCase):
    def setUp(self):
        self.settings: dict[str, str] = {}
        self.get_setting_patch = patch.object(
            library_settings_service,
            "get_setting",
            side_effect=self.settings.get,
        )
        self.set_setting_patch = patch.object(
            library_settings_service,
            "set_setting",
            side_effect=lambda key, value: self.settings.__setitem__(key, value),
        )
        self.get_setting_patch.start()
        self.set_setting_patch.start()

    def tearDown(self):
        self.get_setting_patch.stop()
        self.set_setting_patch.stop()

    def test_all_documents_are_visible_by_default(self):
        response = library_settings_service.get_library_documents_visibility(
            {"role": "student"}
        )

        self.assertFalse(response["can_manage"])
        self.assertEqual(
            [document["document_id"] for document in response["documents"]],
            list(library_settings_service.LIBRARY_DOCUMENT_IDS),
        )
        self.assertTrue(
            all(
                document["is_visible_to_students"]
                for document in response["documents"]
            )
        )

    def test_hidden_document_is_removed_from_student_response_but_kept_for_admin(self):
        library_settings_service.update_library_document_visibility("lectia-2", False)

        student_response = library_settings_service.get_library_documents_visibility(
            {"role": "student"}
        )
        admin_response = library_settings_service.get_library_documents_visibility(
            {"role": "admin"}
        )

        self.assertNotIn(
            "lectia-2",
            [document["document_id"] for document in student_response["documents"]],
        )
        hidden_admin_document = next(
            document
            for document in admin_response["documents"]
            if document["document_id"] == "lectia-2"
        )
        self.assertFalse(hidden_admin_document["is_visible_to_students"])
        self.assertTrue(admin_response["can_manage"])

    def test_visibility_can_be_restored(self):
        library_settings_service.update_library_document_visibility(
            "manual-integral",
            False,
        )
        library_settings_service.update_library_document_visibility(
            "manual-integral",
            True,
        )

        student_response = library_settings_service.get_library_documents_visibility(
            {"role": "student"}
        )
        self.assertIn(
            "manual-integral",
            [document["document_id"] for document in student_response["documents"]],
        )

    def test_unknown_document_is_rejected(self):
        with self.assertRaises(HTTPException) as context:
            library_settings_service.update_library_document_visibility(
                "document-inexistent",
                False,
            )

        self.assertEqual(context.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
