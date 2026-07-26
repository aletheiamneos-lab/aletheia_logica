from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from .auth_service import get_admin_user, get_current_user
from .integrated_tests_supabase_service import (
    build_default_test_questions,
    build_standard_test_template,
    create_integrated_test,
    export_centralized_results,
    get_integrated_attempt,
    get_integrated_test,
    get_live_monitor_snapshot,
    get_report_file_path,
    list_archive_entries,
    list_integrated_tests,
    list_teacher_results,
    publish_integrated_test,
    start_attempt,
    submit_attempt,
    update_attempt_progress,
    update_integrated_test,
    update_student_marker,
    update_teacher_comment,
)
from .pdf_service import (
    build_content_disposition,
)
from .schemas import (
    AttemptProgressRequest,
    AttemptStartRequest,
    IntegratedTestPayload,
    StudentMarkerUpdateRequest,
    TeacherCommentUpdateRequest,
)

router = APIRouter(prefix="/integrated-tests", tags=["integrated-tests"])


def _pdf_download_response(target_path: Path, file_name: str) -> FileResponse:
    return FileResponse(
        path=target_path,
        media_type="application/pdf",
        filename=file_name,
        headers={
            "Content-Disposition": build_content_disposition(file_name, "attachment"),
        },
    )


@router.get("")
def read_integrated_tests(current_user: dict = Depends(get_current_user)) -> list[dict]:
    return list_integrated_tests(current_user)


@router.get("/template")
def read_integrated_test_template(current_user: dict = Depends(get_admin_user)) -> dict:
    return {
        "questions": build_default_test_questions(),
        "standard_json_template": build_standard_test_template(),
    }


@router.post("")
def create_test(
    payload: IntegratedTestPayload,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return create_integrated_test(current_user, payload.model_dump())


@router.get("/{test_id}")
def read_integrated_test(test_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    return get_integrated_test(current_user, test_id)


@router.get("/{test_id}/answer-key")
def read_integrated_test_answer_key(
    test_id: str,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return get_integrated_test(current_user, test_id, include_answer_key=True)


@router.put("/{test_id}")
def update_test(
    test_id: str,
    payload: IntegratedTestPayload,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return update_integrated_test(current_user, test_id, payload.model_dump())


@router.post("/{test_id}/publish")
def publish_test(test_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    return publish_integrated_test(current_user, test_id)


@router.post("/attempts/start")
def create_attempt(
    payload: AttemptStartRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    return start_attempt(current_user, payload.test_id)


@router.put("/attempts/{attempt_id}/progress")
def save_attempt_progress(
    attempt_id: str,
    payload: AttemptProgressRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    return update_attempt_progress(current_user, attempt_id, payload.model_dump())


@router.get("/attempts/{attempt_id}")
def read_attempt(attempt_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    return get_integrated_attempt(current_user, attempt_id)


@router.post("/attempts/{attempt_id}/submit")
def finalize_attempt(attempt_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    return submit_attempt(current_user, attempt_id)


@router.get("/attempts/{attempt_id}/report")
def read_attempt_report(attempt_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    return get_attempt_report(current_user, attempt_id)


@router.put("/attempts/{attempt_id}/comment")
def save_teacher_comment(
    attempt_id: str,
    payload: TeacherCommentUpdateRequest,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return update_teacher_comment(current_user, attempt_id, payload.teacher_comment)


@router.get("/attempts/{attempt_id}/download/{file_kind}")
def download_attempt_file(
    attempt_id: str,
    file_kind: str,
    current_user: dict = Depends(get_current_user),
):
    if file_kind not in {"json", "html", "pdf"}:
        raise HTTPException(status_code=404, detail="Tipul de fisier cerut nu este disponibil.")

    if file_kind == "pdf":
        target_path = Path(get_report_file_path(current_user, attempt_id, "pdf"))
        return _pdf_download_response(target_path, target_path.name)

    target_path = Path(get_report_file_path(current_user, attempt_id, file_kind))
    media_type = {
        "json": "application/json",
        "html": "text/html",
    }[file_kind]
    return FileResponse(target_path, media_type=media_type, filename=target_path.name)


@router.post("/attempts/{attempt_id}/export/test-report-pdf")
def export_attempt_report_pdf(
    attempt_id: str,
    current_user: dict = Depends(get_admin_user),
):
    target_path = Path(get_report_file_path(current_user, attempt_id, "pdf"))
    return _pdf_download_response(target_path, target_path.name)


@router.get("/teacher/results")
def teacher_results(current_user: dict = Depends(get_admin_user)) -> list[dict]:
    return list_teacher_results(current_user)


@router.get("/teacher/live")
def teacher_live_monitor(current_user: dict = Depends(get_admin_user)) -> dict:
    return get_live_monitor_snapshot(current_user)


@router.get("/teacher/archive")
def teacher_archive(current_user: dict = Depends(get_admin_user)) -> list[dict]:
    return list_archive_entries(current_user)


@router.put("/teacher/markers/{student_key}")
def teacher_marker_update(
    student_key: str,
    payload: StudentMarkerUpdateRequest,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return update_student_marker(
        current_user,
        student_key,
        payload.marker_label,
        payload.accent_color,
    )


@router.get("/teacher/export/centralized")
def teacher_export_centralized(current_user: dict = Depends(get_admin_user)):
    target_path = Path(export_centralized_results(current_user))
    return FileResponse(target_path, media_type="text/csv", filename=target_path.name)
