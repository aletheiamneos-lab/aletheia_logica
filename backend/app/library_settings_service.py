from __future__ import annotations

import json

from fastapi import HTTPException

from .auth_service import get_setting, set_setting

LIBRARY_VISIBILITY_SETTING_KEY = "library_document_visibility_v1"
LIBRARY_DOCUMENT_IDS = (
    "lectia-1",
    "lectia-2",
    "lectia-3",
    "lectia-4",
    "lectia-5",
    "manual-integral",
)


def _default_visibility() -> dict[str, bool]:
    return {document_id: True for document_id in LIBRARY_DOCUMENT_IDS}


def _load_visibility() -> dict[str, bool]:
    visibility = _default_visibility()
    raw_value = get_setting(LIBRARY_VISIBILITY_SETTING_KEY)
    if not raw_value:
        return visibility

    try:
        stored_visibility = json.loads(raw_value)
    except (json.JSONDecodeError, TypeError):
        return visibility

    if not isinstance(stored_visibility, dict):
        return visibility

    for document_id in LIBRARY_DOCUMENT_IDS:
        stored_value = stored_visibility.get(document_id)
        if isinstance(stored_value, bool):
            visibility[document_id] = stored_value
    return visibility


def get_library_documents_visibility(current_user: dict) -> dict:
    visibility = _load_visibility()
    can_manage = current_user.get("role") == "admin"
    document_ids = (
        LIBRARY_DOCUMENT_IDS
        if can_manage
        else tuple(
            document_id
            for document_id in LIBRARY_DOCUMENT_IDS
            if visibility[document_id]
        )
    )

    return {
        "can_manage": can_manage,
        "documents": [
            {
                "document_id": document_id,
                "is_visible_to_students": visibility[document_id],
            }
            for document_id in document_ids
        ],
    }


def update_library_document_visibility(
    document_id: str,
    is_visible_to_students: bool,
) -> dict:
    if document_id not in LIBRARY_DOCUMENT_IDS:
        raise HTTPException(status_code=404, detail="Documentul din biblioteca nu exista.")

    visibility = _load_visibility()
    visibility[document_id] = is_visible_to_students
    set_setting(
        LIBRARY_VISIBILITY_SETTING_KEY,
        json.dumps(visibility, ensure_ascii=False, sort_keys=True),
    )
    return {
        "document_id": document_id,
        "is_visible_to_students": is_visible_to_students,
    }
