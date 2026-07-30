from __future__ import annotations

from fastapi import APIRouter, Depends

from .auth_service import get_admin_user, get_current_user
from .library_settings_service import (
    get_library_documents_visibility,
    update_library_document_visibility,
)
from .schemas import (
    LibraryDocumentVisibility,
    LibraryDocumentsVisibilityResponse,
    LibraryDocumentVisibilityUpdate,
)

router = APIRouter(prefix="/library-settings", tags=["library-settings"])


@router.get("/documents", response_model=LibraryDocumentsVisibilityResponse)
def read_library_documents_visibility(
    current_user: dict = Depends(get_current_user),
) -> dict:
    return get_library_documents_visibility(current_user)


@router.patch("/documents/{document_id}", response_model=LibraryDocumentVisibility)
def change_library_document_visibility(
    document_id: str,
    payload: LibraryDocumentVisibilityUpdate,
    current_user: dict = Depends(get_admin_user),
) -> dict:
    return update_library_document_visibility(
        document_id,
        payload.is_visible_to_students,
    )
