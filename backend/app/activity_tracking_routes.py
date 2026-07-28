from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from .activity_tracking_service import (
    get_admin_activity_overview,
    get_admin_activity_student_detail,
    get_admin_activity_students,
    identify_student,
    save_test_progress,
    start_test_session,
    submit_test_session,
    track_link_open,
)
from .auth_service import get_admin_user, get_current_user
from .schemas import (
    ActivityLinkOpenRequest,
    ActivityStudentIdentifyRequest,
    ActivityTestProgressRequest,
    ActivityTestStartRequest,
    ActivityTestSubmitRequest,
)

router = APIRouter(prefix="/activity", tags=["activity"])


def _authenticated_student_payload(
    payload: dict,
    current_user: dict,
    request: Request,
    *,
    record_event: bool,
) -> dict:
    session_id = str(payload.get("session_id") or "").strip()
    identity = identify_student(
        {
            "session_id": session_id,
            "name": current_user.get("display_name") or "Elev",
            "email": current_user.get("email") or "",
        },
        request if record_event else None,
        record_event=record_event,
    )
    return {
        **payload,
        "student_id": identity["student_id"],
    }


@router.post("/track/link-open")
def activity_track_link_open(payload: ActivityLinkOpenRequest, request: Request) -> dict:
    return track_link_open(payload.model_dump(), request)


@router.post("/students/identify")
def activity_identify_student(payload: ActivityStudentIdentifyRequest, request: Request) -> dict:
    return identify_student(payload.model_dump(), request)


@router.post("/tests/start")
def activity_start_test(
    payload: ActivityTestStartRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "student":
        return {"ok": True, "ignored": True}
    resolved_payload = _authenticated_student_payload(
        payload.model_dump(),
        current_user,
        request,
        record_event=True,
    )
    return start_test_session(resolved_payload)


@router.post("/tests/progress")
def activity_save_progress(
    payload: ActivityTestProgressRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "student":
        return {"ok": True, "ignored": True}
    resolved_payload = _authenticated_student_payload(
        payload.model_dump(),
        current_user,
        request,
        record_event=False,
    )
    return save_test_progress(resolved_payload)


@router.post("/tests/submit")
def activity_submit_test(
    payload: ActivityTestSubmitRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "student":
        return {"ok": True, "ignored": True}
    resolved_payload = _authenticated_student_payload(
        payload.model_dump(),
        current_user,
        request,
        record_event=False,
    )
    return submit_test_session(resolved_payload)


@router.get("/admin/overview")
def activity_admin_overview(current_user: dict = Depends(get_admin_user)) -> dict:
    return get_admin_activity_overview(current_user)


@router.get("/admin/students")
def activity_admin_students(current_user: dict = Depends(get_admin_user)) -> list[dict]:
    return get_admin_activity_students(current_user)


@router.get("/admin/students/{student_id}")
def activity_admin_student_detail(
    student_id: int,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return get_admin_activity_student_detail(current_user, student_id)
