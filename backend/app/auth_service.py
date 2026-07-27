from __future__ import annotations

import base64
import hashlib
import os
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import Header, HTTPException

from .database import get_connection

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

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT email
            FROM auth_sessions
            WHERE role = 'student'
              AND lower(trim(display_name)) = lower(trim(?))
              AND trim(COALESCE(email, '')) <> ''
            ORDER BY last_seen_at DESC
            """,
            (normalized_name,),
        ).fetchall()

    emails_by_key = {}
    for row in rows:
        email = str(row["email"] or "").strip()
        if email:
            emails_by_key.setdefault(email.casefold(), email)
    if len(emails_by_key) != 1:
        return ""
    return next(iter(emails_by_key.values()))


def _serialize_session(row: sqlite3.Row) -> dict:
    normalized_role = "admin" if row["role"] == "teacher" else row["role"]
    login_at = row["created_at"]
    return {
        "id": row["id"],
        "session_id": row["id"],
        "sessionId": row["id"],
        "role": normalized_role,
        "first_name": row["first_name"] or "",
        "firstName": row["first_name"] or "",
        "last_name": row["last_name"] or "",
        "lastName": row["last_name"] or "",
        "display_name": row["display_name"],
        "displayName": row["display_name"],
        "initials": row["initials"],
        "email": row["email"] or "",
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
    with get_connection() as connection:
        row = connection.execute(
            "SELECT value FROM app_settings WHERE key = ?",
            (key,),
        ).fetchone()
    return row["value"] if row else None


def set_setting(key: str, value: str) -> None:
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO app_settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at
            """,
            (key, value, utc_now_iso()),
        )
        connection.commit()


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

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO auth_sessions (
                id, role, first_name, last_name, display_name, initials,
                created_at, last_seen_at, is_active, email
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
            """,
            (
                session_id,
                "student",
                normalized_first_name,
                normalized_last_name,
                normalized_name,
                compute_initials(normalized_first_name, normalized_last_name),
                created_at,
                created_at,
                normalized_email,
            ),
        )
        connection.commit()

    return get_session(session_id)


def create_admin_session(password: str) -> dict:
    if not verify_teacher_password(password):
        raise _http_error(401, "Parola adminului este incorecta.")

    session_id = str(uuid.uuid4())
    created_at = utc_now_iso()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO auth_sessions (
                id, role, first_name, last_name, display_name, initials,
                created_at, last_seen_at, is_active
            )
            VALUES (?, ?, '', '', ?, ?, ?, ?, 1)
            """,
            (
                session_id,
                "admin",
                "Admin",
                "AD",
                created_at,
                created_at,
            ),
        )
        connection.commit()

    return get_session(session_id)


def create_teacher_session(password: str) -> dict:
    return create_admin_session(password)


def get_session(session_id: str) -> dict:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM auth_sessions
            WHERE id = ? AND is_active = 1
            """,
            (session_id,),
        ).fetchone()

    if row is None:
        raise _http_error(401, "Sesiunea nu este valida sau a expirat.")

    return _serialize_session(row)


def touch_session(session_id: str) -> dict:
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT *
            FROM auth_sessions
            WHERE id = ? AND is_active = 1
            """,
            (session_id,),
        ).fetchone()

        if row is None:
            raise _http_error(401, "Sesiunea nu este valida sau a expirat.")

        updated_last_seen = utc_now_iso()
        connection.execute(
            "UPDATE auth_sessions SET last_seen_at = ? WHERE id = ?",
            (updated_last_seen, session_id),
        )
        connection.commit()

    session = _serialize_session(row)
    session["last_seen_at"] = updated_last_seen
    return session


def logout_session(session_id: str) -> None:
    with get_connection() as connection:
        connection.execute(
            "UPDATE auth_sessions SET is_active = 0, last_seen_at = ? WHERE id = ?",
            (utc_now_iso(), session_id),
        )
        connection.commit()


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
    return {"message": "Parola adminului a fost actualizata local."}


def change_admin_password(session_id: str, current_password: str, new_password: str) -> dict:
    return change_teacher_password(session_id, current_password, new_password)


def list_active_student_sessions() -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM auth_sessions
            WHERE role = 'student' AND is_active = 1
            ORDER BY last_seen_at DESC
            """
        ).fetchall()

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
