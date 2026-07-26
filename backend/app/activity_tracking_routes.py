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


@router.post("/track/link-open")
def activity_track_link_open(payload: ActivityLinkOpenRequest, request: Request) -> dict:
    return track_link_open(payload.model_dump(), request)


@router.post("/students/identify")
def activity_identify_student(payload: ActivityStudentIdentifyRequest) -> dict:
    return identify_student(payload.model_dump())


@router.post("/tests/start")
def activity_start_test(
    payload: ActivityTestStartRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "student":
        return {"ok": True, "ignored": True}
    return start_test_session(payload.model_dump())


@router.post("/tests/progress")
def activity_save_progress(
    payload: ActivityTestProgressRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "student":
        return {"ok": True, "ignored": True}
    return save_test_progress(payload.model_dump())


@router.post("/tests/submit")
def activity_submit_test(
    payload: ActivityTestSubmitRequest,
    current_user: dict = Depends(get_current_user),
) -> dict:
    if current_user["role"] != "student":
        return {"ok": True, "ignored": True}
    return submit_test_session(payload.model_dump())


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
