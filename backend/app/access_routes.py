from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .auth_service import create_admin_session, create_student_session
from .supabase_service import find_allowed_student
from .schemas import StudentLoginRequest, TeacherLoginRequest

router = APIRouter(tags=["access"])


@router.post("/login/student")
def login_student(payload: StudentLoginRequest) -> dict:
    allowed_student = find_allowed_student(payload.email)
    if allowed_student is None:
        raise HTTPException(
            status_code=403,
            detail="Acces neautorizat, contactează profesorul",
        )
    if allowed_student["is_blocked"]:
        raise HTTPException(status_code=403, detail="Acces blocat de profesor")
    return create_student_session(payload.name, payload.email)


@router.post("/login/admin")
def login_admin(payload: TeacherLoginRequest) -> dict:
    return create_admin_session(payload.password)
