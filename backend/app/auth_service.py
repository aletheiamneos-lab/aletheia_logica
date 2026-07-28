from __future__ import annotations

import base64
import hashlib
import os
import secrets
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import Header, HTTPException

from .supabase_service import get_server_supabase

DEFAULT_ADMIN_PASSWORD = "NihilSineDeo"
SESSION_HEADER_NAME = "X-Logica-Session"
PASSWORD_SETTING_KEY = "teacher_password_hash"
ACTIVE_SESSION_WINDOW_MINUTES = 30


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _http_error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


def _normalize_name(value: str) -> str:
    return " ".join(value.strip().split())


def normalize_student_key(first_name: str, last_name: str) -> str:
    return f"{_normalize_name(last_name).casefold()}::{_normalize_name(first_name).casefold()}"


def compute_initials(first_name: str, last_name: str) -> str:
    parts = [part for part in [_normalize_name(first_name), _normalize_name(last_name)] if part]
    initials = "".join(part[0] for part in parts if part)
    return initials.upper()[:2] or "??"


def resolve_unique_student_email(display_name: str) -> str:
    normalized_name = _normalize_name(display_name)
    if not normalized_name:
        return ""

    rows = (
        get_server_supabase()
        .table("auth_sessions")
        .select("email,display_name,last_seen_at")
        .eq("role", "student")
        .order("last_seen_at", desc=True)
        .execute()
        .data
        or []
    )

    emails_by_key = {}
    for row in rows:
        if _normalize_name(str(row.get("display_name") or "")).casefold() != normalized_name.casefold():
            continue
        email = str(row["email"] or "").strip()
        if email:
            emails_by_key.setdefault(email.casefold(), email)
    if len(emails_by_key) != 1:
        return ""
    return next(iter(emails_by_key.values()))


def _serialize_session(row: dict) -> dict:
    normalized_role = "admin" if row["role"] == "teacher" else row["role"]
    login_at = row["created_at"]
    return {
        "id": row["id"],
        "session_id": row["id"],
        "sessionId": row["id"],
        "role": normalized_role,
        "first_name": row.get("first_name") or "",
        "firstName": row.get("first_name") or "",
        "last_name": row.get("last_name") or "",
        "lastName": row.get("last_name") or "",
        "display_name": row["display_name"],
        "displayName": row["display_name"],
        "initials": row["initials"],
        "email": row.get("email") or "",
        "loginAt": login_at,
        "created_at": row["created_at"],
        "last_seen_at": row["last_seen_at"],
    }


def _encode_password_hash(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return "$".join(
        [
            "pbkdf2_sha256",
            base64.urlsafe_b64encode(salt).decode("ascii"),
            base64.urlsafe_b64encode(digest).decode("ascii"),
        ]
    )


def _verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, salt_encoded, digest_encoded = encoded_hash.split("$", 2)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    salt = base64.urlsafe_b64decode(salt_encoded.encode("ascii"))
    expected_digest = base64.urlsafe_b64decode(digest_encoded.encode("ascii"))
    candidate_digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return secrets.compare_digest(candidate_digest, expected_digest)


def get_setting(key: str) -> str | None:
    rows = (
        get_server_supabase()
        .table("app_settings")
        .select("value")
        .eq("key", key)
        .limit(1)
        .execute()
        .data
        or []
    )
    return str(rows[0]["value"]) if rows else None


def set_setting(key: str, value: str) -> None:
    get_server_supabase().table("app_settings").upsert(
        {"key": key, "value": value, "updated_at": utc_now_iso()},
        on_conflict="key",
    ).execute()


def verify_teacher_password(password: str) -> bool:
    stored_hash = get_setting(PASSWORD_SETTING_KEY)
    if not stored_hash:
        return password == DEFAULT_ADMIN_PASSWORD
    return _verify_password(password, stored_hash)


def create_student_session(name: str, email: str) -> dict:
    normalized_name = _normalize_name(name)
    normalized_email = email.strip().casefold()
    name_parts = normalized_name.split()
    normalized_first_name = " ".join(name_parts[:-1]) if len(name_parts) > 1 else normalized_name
    normalized_last_name = name_parts[-1] if len(name_parts) > 1 else ""

    if not normalized_name or not normalized_email:
        raise _http_error(422, "Emailul si numele sunt obligatorii.")

    session_id = str(uuid.uuid4())
    created_at = utc_now_iso()

    get_server_supabase().table("auth_sessions").insert(
        {
            "id": session_id,
            "role": "student",
            "first_name": normalized_first_name,
            "last_name": normalized_last_name,
            "display_name": normalized_name,
            "initials": compute_initials(normalized_first_name, normalized_last_name),
            "created_at": created_at,
            "last_seen_at": created_at,
            "is_active": True,
            "email": normalized_email,
        }
    ).execute()

    return get_session(session_id)


def create_admin_session(password: str) -> dict:
    if not verify_teacher_password(password):
        raise _http_error(401, "Parola adminului este incorecta.")

    session_id = str(uuid.uuid4())
    created_at = utc_now_iso()

    get_server_supabase().table("auth_sessions").insert(
        {
            "id": session_id,
            "role": "admin",
            "first_name": "",
            "last_name": "",
            "display_name": "Admin",
            "initials": "AD",
            "created_at": created_at,
            "last_seen_at": created_at,
            "is_active": True,
            "email": "",
        }
    ).execute()

    return get_session(session_id)


def create_teacher_session(password: str) -> dict:
    return create_admin_session(password)


def get_session(session_id: str) -> dict:
    rows = (
        get_server_supabase()
        .table("auth_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows:
        raise _http_error(401, "Sesiunea nu este valida sau a expirat.")

    return _serialize_session(rows[0])


def touch_session(session_id: str) -> dict:
    session = get_session(session_id)
    updated_last_seen = utc_now_iso()
    rows = (
        get_server_supabase()
        .table("auth_sessions")
        .update({"last_seen_at": updated_last_seen})
        .eq("id", session_id)
        .eq("is_active", True)
        .execute()
        .data
        or []
    )
    if not rows:
        raise _http_error(401, "Sesiunea nu este valida sau a expirat.")
    return _serialize_session(rows[0])


def logout_session(session_id: str) -> None:
    get_server_supabase().table("auth_sessions").update(
        {"is_active": False, "last_seen_at": utc_now_iso()}
    ).eq("id", session_id).execute()


def change_teacher_password(session_id: str, current_password: str, new_password: str) -> dict:
    session = touch_session(session_id)

    if session["role"] != "admin":
        raise _http_error(403, "Doar adminul poate modifica parola.")

    if not verify_teacher_password(current_password):
        raise _http_error(400, "Parola curenta nu este corecta.")

    normalized_new_password = new_password.strip()
    if len(normalized_new_password) < 8:
        raise _http_error(400, "Parola noua trebuie sa aiba cel putin 8 caractere.")

    set_setting(PASSWORD_SETTING_KEY, _encode_password_hash(normalized_new_password))
    return {"message": "Parola adminului a fost actualizata."}


def change_admin_password(session_id: str, current_password: str, new_password: str) -> dict:
    return change_teacher_password(session_id, current_password, new_password)


def list_active_student_sessions() -> list[dict]:
    rows = (
        get_server_supabase()
        .table("auth_sessions")
        .select("*")
        .eq("role", "student")
        .eq("is_active", True)
        .order("last_seen_at", desc=True)
        .execute()
        .data
        or []
    )

    return [_serialize_session(row) for row in rows]


def get_optional_session_id(
    x_logica_session: Annotated[str | None, Header(alias=SESSION_HEADER_NAME)] = None,
) -> str | None:
    return x_logica_session


def get_current_user(
    x_logica_session: Annotated[str | None, Header(alias=SESSION_HEADER_NAME)] = None,
) -> dict:
    if not x_logica_session:
        raise _http_error(401, "Autentificarea este necesara.")
    return touch_session(x_logica_session)


def get_admin_user(
    x_logica_session: Annotated[str | None, Header(alias=SESSION_HEADER_NAME)] = None,
) -> dict:
    session = get_current_user(x_logica_session)
    if session["role"] != "admin":
        raise _http_error(403, "Zona este disponibila doar in modul admin.")
    return session


def get_teacher_user(
    x_logica_session: Annotated[str | None, Header(alias=SESSION_HEADER_NAME)] = None,
) -> dict:
    return get_admin_user(x_logica_session)
