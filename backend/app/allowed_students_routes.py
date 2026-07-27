from __future__ import annotations

from fastapi import APIRouter, Depends

from .auth_service import get_admin_user
from .schemas import (
    AllowedStudentCreateRequest,
    AllowedStudentPatchRequest,
    AllowedStudentsBulkBlockRequest,
)
from .supabase_service import (
    add_allowed_student,
    delete_allowed_student,
    list_allowed_students,
    update_all_allowed_students,
    update_allowed_student,
)

router = APIRouter(prefix="/admin/allowed-students", tags=["allowed-students"])


@router.get("")
def read_allowed_students(_: dict = Depends(get_admin_user)) -> dict:
    return {"students": list_allowed_students()}


@router.post("", status_code=201)
def create_allowed_student(
    payload: AllowedStudentCreateRequest,
    _: dict = Depends(get_admin_user),
) -> dict:
    return add_allowed_student(payload.email, payload.name)


@router.patch("")
def patch_all_allowed_students(
    payload: AllowedStudentsBulkBlockRequest,
    _: dict = Depends(get_admin_user),
) -> dict:
    students = update_all_allowed_students(payload.is_blocked)
    return {
        "students": students,
        "updated_count": len(students),
        "is_blocked": payload.is_blocked,
    }


@router.patch("/{student_id}")
def patch_allowed_student(
    student_id: str,
    payload: AllowedStudentPatchRequest,
    _: dict = Depends(get_admin_user),
) -> dict:
    changes = payload.model_dump(exclude_none=True)
    return update_allowed_student(student_id, changes)


@router.delete("/{student_id}")
def remove_allowed_student(
    student_id: str,
    _: dict = Depends(get_admin_user),
) -> dict:
    delete_allowed_student(student_id)
    return {"message": "Adresa a fost stearsa."}
