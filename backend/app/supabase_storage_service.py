from __future__ import annotations

import logging
import os

from fastapi import HTTPException

from .supabase_service import get_server_supabase

LOGGER = logging.getLogger("uvicorn.error")
REPORTS_BUCKET = os.getenv("SUPABASE_REPORTS_BUCKET", "generated-reports").strip() or "generated-reports"


def upload_bytes(object_path: str, content: bytes, content_type: str, *, upsert: bool = True) -> str:
    normalized_path = object_path.strip().lstrip("/")
    if not normalized_path:
        raise ValueError("Calea obiectului Supabase Storage nu poate fi goala.")
    LOGGER.info(
        "[Supabase Storage] START operation=upload bucket=%s object=%s bytes=%s",
        REPORTS_BUCKET,
        normalized_path,
        len(content),
    )
    try:
        get_server_supabase().storage.from_(REPORTS_BUCKET).upload(
            path=normalized_path,
            file=content,
            file_options={
                "content-type": content_type,
                "upsert": "true" if upsert else "false",
            },
        )
    except Exception as error:
        LOGGER.exception(
            "[Supabase Storage] ERROR operation=upload bucket=%s object=%s",
            REPORTS_BUCKET,
            normalized_path,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Fisierul nu a putut fi salvat in Supabase Storage: {error}",
        ) from error
    LOGGER.info(
        "[Supabase Storage] SUCCESS operation=upload bucket=%s object=%s",
        REPORTS_BUCKET,
        normalized_path,
    )
    return normalized_path


def download_bytes(object_path: str) -> bytes:
    normalized_path = object_path.strip().lstrip("/")
    try:
        content = get_server_supabase().storage.from_(REPORTS_BUCKET).download(normalized_path)
    except Exception as error:
        LOGGER.exception(
            "[Supabase Storage] ERROR operation=download bucket=%s object=%s",
            REPORTS_BUCKET,
            normalized_path,
        )
        raise HTTPException(
            status_code=502,
            detail=f"Fisierul nu a putut fi citit din Supabase Storage: {error}",
        ) from error
    return bytes(content)


def remove_objects(object_paths: list[str]) -> None:
    normalized_paths = [path.strip().lstrip("/") for path in object_paths if path and path.strip()]
    if not normalized_paths:
        return
    try:
        get_server_supabase().storage.from_(REPORTS_BUCKET).remove(normalized_paths)
    except Exception as error:
        LOGGER.exception(
            "[Supabase Storage] ERROR operation=remove bucket=%s objects=%s",
            REPORTS_BUCKET,
            len(normalized_paths),
        )
        raise HTTPException(
            status_code=502,
            detail=f"Fisierele nu au putut fi sterse din Supabase Storage: {error}",
        ) from error
