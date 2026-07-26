from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from .auth_service import (
    change_admin_password,
    create_student_session,
    create_admin_session,
    create_teacher_session,
    get_admin_user,
    get_current_user,
    logout_session,
)
from .supabase_service import find_allowed_student, update_allowed_student
from .schemas import (
    ChangeTeacherPasswordRequest,
    StudentLoginRequest,
    TeacherLoginRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/student-login")
def student_login(payload: StudentLoginRequest) -> dict:
    allowed_student = find_allowed_student(payload.email)
    if allowed_student is None:
        raise HTTPException(
            status_code=403,
            detail="Acces neautorizat, contactează profesorul",
        )
    if allowed_student["is_blocked"]:
        raise HTTPException(status_code=403, detail="Acces blocat de profesor")
    return create_student_session(payload.name, payload.email)


@router.get("/student-access")
def student_access_status(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != "student":
        return {"should_logout": False}

    allowed_student = find_allowed_student(current_user.get("email", ""))
    reason = None
    force_logout_requested = bool(allowed_student and allowed_student["force_logout"])
    if force_logout_requested:
        update_allowed_student(allowed_student["id"], {"force_logout": False})

    if allowed_student is None:
        reason = "Acces neautorizat, contactează profesorul"
    elif allowed_student["is_blocked"]:
        reason = "Acces blocat de profesor"
    elif force_logout_requested:
        reason = "Sesiunea a fost inchisa de profesor"

    if reason:
        logout_session(current_user["session_id"])
        return {"should_logout": True, "reason": reason}
    return {"should_logout": False}


@router.post("/teacher-login")
def teacher_login(payload: TeacherLoginRequest) -> dict:
    return create_teacher_session(payload.password)


@router.post("/admin-login")
def admin_login(payload: TeacherLoginRequest) -> dict:
    return create_admin_session(payload.password)


@router.get("/session")
def current_session(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user


@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)) -> dict:
    logout_session(current_user["session_id"])
    return {"message": "Sesiunea a fost inchisa."}


@router.post("/change-password")
def update_teacher_password(
    payload: ChangeTeacherPasswordRequest,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return change_admin_password(
        current_user["session_id"],
        payload.current_password,
        payload.new_password,
    )
