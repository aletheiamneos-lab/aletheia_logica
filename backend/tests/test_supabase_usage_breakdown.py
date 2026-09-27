import unittest

from app.supabase_usage_breakdown import build_total_usage, table_category

MB = 1024 * 1024


class SupabaseTotalUsageTests(unittest.TestCase):
    def test_total_includes_database_and_storage_with_category_shares(self):
        usage = build_total_usage(
            {
                "database_size_bytes": 12 * MB,
                "storage_size_bytes": 8 * MB,
                "storage_objects_count": 5,
                "categories": {
                    "reports": {"bytes": 9 * MB, "files": 4},
                    "documents": {"bytes": 1 * MB, "files": 1},
                    "other": {"bytes": 0},
                    "system": {"bytes": 10 * MB},
                },
            }
        )
        self.assertEqual(usage["used_bytes"], 20 * MB)
        self.assertTrue(usage["exact_categories"])
        shares = {item["key"]: item["share_percent"] for item in usage["categories"]}
        self.assertEqual(shares, {"reports": 45.0, "documents": 5.0, "other": 0.0, "system": 50.0})
        self.assertEqual(usage["storage_files"], 5)

    def test_table_names_are_classified(self):
        self.assertEqual(table_category("bac_student_reports"), "reports")
        self.assertEqual(table_category("attempts"), "reports")
        self.assertEqual(table_category("test_activity"), "reports")
        self.assertEqual(table_category("questions"), "documents")
        self.assertEqual(table_category("tests"), "documents")
        self.assertEqual(table_category("allowed_students"), "other")
        self.assertEqual(table_category("auth_sessions"), "other")


if __name__ == "__main__":
    unittest.main()
