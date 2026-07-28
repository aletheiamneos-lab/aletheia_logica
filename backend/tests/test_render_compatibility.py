from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import patch

from starlette.requests import Request

from app import (
    activity_tracking_routes,
    activity_tracking_service,
    admitere_student_reports_service,
    auth_service,
    bac_student_reports_service,
    learning_service,
    report_email_service,
    reporting_service,
    supabase_service,
    supabase_storage_service,
)


class FakeQuery:
    def __init__(self, client: "FakeSupabase", table_name: str):
        self.client = client
        self.table_name = table_name
        self.operation = "select"
        self.payload = None
        self.conflict_column = None
        self.filters = []
        self.orders = []
        self.row_limit = None

    @property
    def rows(self) -> list[dict]:
        return self.client.tables.setdefault(self.table_name, [])

    def select(self, *_args, **_kwargs):
        self.operation = "select"
        return self

    def insert(self, payload):
        self.operation = "insert"
        self.payload = payload
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = payload
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def upsert(self, payload, on_conflict=None):
        self.operation = "upsert"
        self.payload = payload
        self.conflict_column = on_conflict
        return self

    def eq(self, column, value):
        self.filters.append(lambda row, column=column, value=value: row.get(column) == value)
        return self

    def in_(self, column, values):
        expected = set(values)
        self.filters.append(lambda row, column=column, expected=expected: row.get(column) in expected)
        return self

    def is_(self, column, value):
        expected = None if value == "null" else value
        self.filters.append(lambda row, column=column, expected=expected: row.get(column) is expected)
        return self

    def order(self, column, desc=False):
        self.orders.append((column, desc))
        return self

    def limit(self, value):
        self.row_limit = int(value)
        return self

    def _matching_rows(self) -> list[dict]:
        rows = [row for row in self.rows if all(predicate(row) for predicate in self.filters)]
        for column, descending in reversed(self.orders):
            rows.sort(key=lambda row: row.get(column) or "", reverse=descending)
        return rows[: self.row_limit] if self.row_limit is not None else rows

    def _prepare_row(self, payload: dict) -> dict:
        row = dict(payload)
        if "id" not in row and self.table_name not in {"app_settings"}:
            row["id"] = self.client.next_id(self.table_name)
        return row

    def execute(self):
        if self.operation == "select":
            return SimpleNamespace(data=[dict(row) for row in self._matching_rows()])

        payloads = self.payload if isinstance(self.payload, list) else [self.payload]
        if self.operation == "insert":
            inserted = [self._prepare_row(payload) for payload in payloads]
            self.rows.extend(inserted)
            return SimpleNamespace(data=[dict(row) for row in inserted])

        if self.operation == "update":
            updated = []
            for row in self._matching_rows():
                row.update(self.payload)
                updated.append(dict(row))
            return SimpleNamespace(data=updated)

        if self.operation == "delete":
            deleted = self._matching_rows()
            for row in deleted:
                self.rows.remove(row)
            return SimpleNamespace(data=[dict(row) for row in deleted])

        upserted = []
        for payload in payloads:
            existing = next(
                (
                    row
                    for row in self.rows
                    if self.conflict_column and row.get(self.conflict_column) == payload.get(self.conflict_column)
                ),
                None,
            )
            if existing is None:
                existing = self._prepare_row(payload)
                self.rows.append(existing)
            else:
                existing.update(payload)
            upserted.append(dict(existing))
        return SimpleNamespace(data=upserted)


class FakeSupabase:
    def __init__(self):
        self.tables: dict[str, list[dict]] = {}
        self.storage = FakeStorage()

    def table(self, table_name: str) -> FakeQuery:
        return FakeQuery(self, table_name)

    def next_id(self, table_name: str) -> int:
        ids = [int(row["id"]) for row in self.tables.get(table_name, []) if "id" in row]
        return max(ids, default=0) + 1


class FakeBucket:
    def __init__(self, objects: dict[str, bytes]):
        self.objects = objects

    def upload(self, path, file, file_options=None):
        self.objects[path] = bytes(file)
        return {"path": path}

    def download(self, path):
        return self.objects[path]

    def remove(self, paths):
        for path in paths:
            self.objects.pop(path, None)
        return []


class FakeStorage:
    def __init__(self):
        self.buckets: dict[str, dict[str, bytes]] = {}

    def from_(self, bucket_name: str) -> FakeBucket:
        return FakeBucket(self.buckets.setdefault(bucket_name, {}))


class RenderCompatibilityTests(unittest.TestCase):
    def setUp(self):
        self.supabase = FakeSupabase()

    def test_teacher_password_persists_in_supabase_settings(self):
        with patch.object(auth_service, "get_server_supabase", return_value=self.supabase):
            session = auth_service.create_admin_session(auth_service.DEFAULT_ADMIN_PASSWORD)
            result = auth_service.change_teacher_password(
                session["session_id"],
                auth_service.DEFAULT_ADMIN_PASSWORD,
                "ParolaNoua123",
            )

            self.assertEqual(result["message"], "Parola adminului a fost actualizata.")
            self.assertTrue(auth_service.verify_teacher_password("ParolaNoua123"))
            self.assertFalse(auth_service.verify_teacher_password(auth_service.DEFAULT_ADMIN_PASSWORD))
            self.assertEqual(len(self.supabase.tables["app_settings"]), 1)

    def test_learning_progress_is_written_and_read_from_supabase(self):
        current_user = {
            "id": "11111111-1111-1111-1111-111111111111",
            "session_id": "11111111-1111-1111-1111-111111111111",
            "role": "student",
            "email": "elev@example.com",
            "first_name": "Elev",
            "last_name": "Test",
        }
        exercise = learning_service.EXERCISES[0]
        with patch.object(learning_service, "get_server_supabase", return_value=self.supabase):
            result = learning_service.submit_answer(
                exercise["id"],
                exercise["correct_answer"],
                current_user,
            )
            summary = learning_service.get_progress_summary(current_user)

        self.assertTrue(result["was_correct"])
        self.assertEqual(summary["number_solved"], 1)
        self.assertEqual(summary["number_correct"], 1)
        self.assertEqual(
            self.supabase.tables["learning_progress"][0]["owner_key"],
            "student:elev@example.com",
        )

    def test_activity_tracking_round_trip_uses_supabase(self):
        request = Request(
            {
                "type": "http",
                "method": "POST",
                "path": "/activity/track/link-open",
                "headers": [(b"user-agent", b"Mozilla/5.0 Chrome/140.0 Windows")],
                "client": ("127.0.0.1", 12345),
            }
        )
        admin = {"role": "admin"}
        with patch.object(
            activity_tracking_service,
            "get_server_supabase",
            return_value=self.supabase,
        ):
            activity_tracking_service.track_link_open(
                {"session_id": "public-session", "public_link_code": "main-public-link"},
                request,
            )
            identified = activity_tracking_service.identify_student(
                {
                    "session_id": "public-session",
                    "name": "Elev Test",
                    "class_name": "XII A",
                    "email": "elev@example.com",
                }
            )
            started = activity_tracking_service.start_test_session(
                {
                    "session_id": "public-session",
                    "student_id": identified["student_id"],
                    "test_id": "test-1",
                    "test_title": "Test local",
                }
            )
            activity_tracking_service.save_test_progress(
                {
                    "session_id": "public-session",
                    "student_id": identified["student_id"],
                    "test_session_id": started["test_session_id"],
                    "question_index": 2,
                    "answered_count": 3,
                    "total_questions": 10,
                    "event_type": "answer_saved",
                }
            )
            activity_tracking_service.submit_test_session(
                {
                    "session_id": "public-session",
                    "student_id": identified["student_id"],
                    "test_session_id": started["test_session_id"],
                    "score": 80,
                    "correct_answers": 8,
                    "wrong_answers": 2,
                    "total_questions": 10,
                }
            )
            overview = activity_tracking_service.get_admin_activity_overview(admin)
            detail = activity_tracking_service.get_admin_activity_student_detail(
                admin,
                identified["student_id"],
            )

        self.assertEqual(overview["identified_students"], 1)
        self.assertEqual(overview["completed_tests"], 1)
        self.assertEqual(detail["test_sessions"][0]["status"], "completed")
        self.assertEqual(detail["test_sessions"][0]["score"], 80)
        session_row = self.supabase.tables["activity_test_sessions"][0]
        self.assertEqual(session_row["correct_answers"], 8)
        self.assertEqual(session_row["wrong_answers"], 2)
        self.assertEqual(session_row["answered_count"], 10)
        self.assertEqual(session_row["progress_percent"], 100)

    def test_activity_tracking_recovers_from_a_deleted_cached_student(self):
        request = Request(
            {
                "type": "http",
                "method": "POST",
                "path": "/activity/tests/start",
                "headers": [(b"user-agent", b"Mozilla/5.0 Mobile Safari")],
                "client": ("127.0.0.1", 12345),
            }
        )
        current_user = {
            "role": "student",
            "display_name": "Elev Reconectat",
            "email": "elev.reconectat@example.com",
        }
        stale_payload = {
            "session_id": "cached-browser-session",
            "student_id": 999,
            "test_id": "test-reconnect",
            "test_title": "Test după ștergere",
        }

        with patch.object(
            activity_tracking_service,
            "get_server_supabase",
            return_value=self.supabase,
        ):
            resolved_payload = activity_tracking_routes._authenticated_student_payload(
                stale_payload,
                current_user,
                request,
                record_event=True,
            )
            started = activity_tracking_service.start_test_session(resolved_payload)

        self.assertNotEqual(resolved_payload["student_id"], 999)
        self.assertEqual(started["student_id"], resolved_payload["student_id"])
        self.assertEqual(len(self.supabase.tables["tracked_students"]), 1)
        self.assertEqual(len(self.supabase.tables["activity_link_activations"]), 1)
        self.assertEqual(len(self.supabase.tables["activity_test_sessions"]), 1)
        self.assertEqual(
            self.supabase.tables["activity_link_activations"][0]["student_id"],
            resolved_payload["student_id"],
        )

    def test_supabase_usage_indicator_uses_live_rows_not_allocated_space(self):
        class FakeRpc:
            def execute(self):
                return SimpleNamespace(
                    data={
                        "database_size_bytes": 100 * 1024 * 1024,
                        "public_tables_size_bytes": 20 * 1024 * 1024,
                        "active_data_size_bytes": 5 * 1024 * 1024,
                        "active_rows_count": 42,
                        "table_stats": {
                            "activity_test_sessions": {
                                "row_count": 2,
                                "active_data_size_bytes": 2048,
                            }
                        },
                    }
                )

        class FakeUsageSupabase:
            def rpc(self, function_name):
                self.function_name = function_name
                return FakeRpc()

        fake_usage_supabase = FakeUsageSupabase()
        with patch.object(
            supabase_service,
            "get_server_supabase",
            return_value=fake_usage_supabase,
        ):
            usage = supabase_service.get_supabase_database_usage()

        self.assertEqual(fake_usage_supabase.function_name, "get_database_usage")
        self.assertEqual(usage["active_rows_count"], 42)
        self.assertEqual(usage["usage_percent"], 1.0)
        self.assertEqual(usage["allocated_usage_percent"], 20.0)
        self.assertEqual(usage["measurement_basis"], "active_rows")

        FakeRpc.execute = lambda _self: SimpleNamespace(
            data={
                "database_size_bytes": 100 * 1024 * 1024,
                "public_tables_size_bytes": 20 * 1024 * 1024,
                "active_data_size_bytes": 0,
                "active_rows_count": 0,
            }
        )
        with patch.object(
            supabase_service,
            "get_server_supabase",
            return_value=fake_usage_supabase,
        ):
            empty_usage = supabase_service.get_supabase_database_usage()
        self.assertEqual(empty_usage["active_data_size_bytes"], 0)
        self.assertEqual(empty_usage["usage_percent"], 0.0)

    def test_email_with_inline_image_is_rendered_by_playwright_chromium(self):
        settings = report_email_service.SmtpSettings(
            host="localhost",
            port=2525,
            username="",
            password="",
            sender="noreply@example.com",
            use_ssl=False,
            use_starttls=False,
        )
        captured = {}

        def capture_message(_settings, message):
            captured["message"] = message

        with patch.object(
            report_email_service,
            "load_smtp_settings",
            return_value=settings,
        ), patch.object(
            report_email_service,
            "_send_smtp_message",
            side_effect=capture_message,
        ):
            result = report_email_service.send_report_email(
                "student@example.com",
                {
                    "id": "render-smoke",
                    "studentName": "Elev Test",
                    "testTitle": "Test Chromium",
                    "submittedAt": "2026-07-28T12:00:00+03:00",
                    "scorePercent": 87,
                },
                pdf_bytes=b"%PDF-1.4\n% test\n",
                pdf_file_name="raport-test.pdf",
            )

        message = captured["message"]
        inline_pngs = [
            part for part in message.walk() if part.get_content_type() == "image/png"
        ]
        pdfs = [
            part for part in message.walk() if part.get_content_type() == "application/pdf"
        ]
        self.assertTrue(result["ok"])
        self.assertEqual(len(inline_pngs), 1)
        self.assertTrue(inline_pngs[0].get_payload(decode=True).startswith(b"\x89PNG\r\n\x1a\n"))
        self.assertGreater(len(inline_pngs[0].get_payload(decode=True)), 10_000)
        self.assertEqual(len(pdfs), 1)
        self.assertEqual(pdfs[0].get_filename(), "raport-test.pdf")

    def test_bac_report_and_pdf_are_persisted_only_in_supabase(self):
        current_user = {
            "role": "student",
            "email": "elev@example.com",
            "display_name": "Elev Test",
            "first_name": "Elev",
            "last_name": "Test",
        }
        with patch.object(
            bac_student_reports_service, "get_server_supabase", return_value=self.supabase
        ), patch.object(
            supabase_storage_service, "get_server_supabase", return_value=self.supabase
        ):
            report = bac_student_reports_service.create_bac_student_report(
                current_user,
                {"examTitle": "BAC model", "sections": []},
            )
            stored_report, pdf_bytes, _file_name = (
                bac_student_reports_service.get_bac_student_report_pdf_for_user(
                    current_user, report["id"]
                )
            )

        self.assertEqual(len(self.supabase.tables["bac_student_reports"]), 1)
        self.assertEqual(stored_report["id"], report["id"])
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertTrue(report["reportPdfPath"].startswith("bac/"))

    def test_admitere_report_and_pdf_are_persisted_only_in_supabase(self):
        current_user = {
            "role": "student",
            "email": "elev@example.com",
            "display_name": "Elev Test",
            "first_name": "Elev",
            "last_name": "Test",
        }
        with patch.object(
            admitere_student_reports_service, "get_server_supabase", return_value=self.supabase
        ), patch.object(
            supabase_storage_service, "get_server_supabase", return_value=self.supabase
        ):
            report = admitere_student_reports_service.create_admitere_student_report(
                current_user,
                {
                    "testTitle": "Admitere model",
                    "totalQuestions": 1,
                    "correctCount": 1,
                    "groups": [],
                },
            )
            stored_report, pdf_bytes, _file_name = (
                admitere_student_reports_service.generate_admitere_student_report_pdf_for_user(
                    current_user, report["id"]
                )
            )

        self.assertEqual(len(self.supabase.tables["admitere_student_reports"]), 1)
        self.assertEqual(stored_report["id"], report["id"])
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))
        self.assertTrue(report["reportPdfPath"].startswith("admitere/"))

    def test_integrated_report_artifacts_are_persisted_in_supabase_storage(self):
        report = {
            "id": "22222222-2222-2222-2222-222222222222",
            "attemptId": "22222222-2222-2222-2222-222222222222",
            "studentName": "Elev Test",
            "testTitle": "Test integrat",
            "testSlug": "test-integrat",
            "submittedAt": "2026-07-28T12:00:00+03:00",
            "durationSeconds": 60,
            "questionRows": [],
        }
        with patch.object(
            supabase_storage_service, "get_server_supabase", return_value=self.supabase
        ):
            bundle = reporting_service.persist_report_bundle(report)

        objects = self.supabase.storage.buckets[supabase_storage_service.REPORTS_BUCKET]
        self.assertIn(bundle["json_path"], objects)
        self.assertIn(bundle["html_path"], objects)
        self.assertIn(bundle["pdf_path"], objects)
        self.assertTrue(objects[bundle["pdf_path"]].startswith(b"%PDF"))


if __name__ == "__main__":
    unittest.main()
