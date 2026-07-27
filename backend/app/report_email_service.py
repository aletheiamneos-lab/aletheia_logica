from __future__ import annotations

import logging
import math
import os
import smtplib
import subprocess
import uuid
from dataclasses import dataclass
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import HTTPException
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"
EMAIL_TEMPLATE_NAME = "report_email.html.jinja2"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE_CANDIDATES = [PROJECT_ROOT / ".env", PROJECT_ROOT / "backend" / ".env"]
EMAIL_CARD_WIDTH = 808
EMAIL_CARD_HEIGHT = 1264
EMAIL_CARD_CID = "logic-report-card"
EDGE_SCALE_FACTOR = 2
LOGGER = logging.getLogger("uvicorn.error")


def _error(status_code: int, detail: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail=detail)


@dataclass(frozen=True)
class SmtpSettings:
    host: str
    port: int
    username: str
    password: str
    sender: str
    use_ssl: bool
    use_starttls: bool


def _build_template_environment() -> Environment:
    return Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(enabled_extensions=("html", "xml", "jinja2")),
    )


def _bool_env(name: str, default: bool) -> bool:
    raw_value = _read_config_value(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _load_env_file_values() -> dict[str, str]:
    loaded_values: dict[str, str] = {}

    for env_path in ENV_FILE_CANDIDATES:
        if not env_path.exists():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            normalized_key = key.strip()
            normalized_value = value.strip().strip('"').strip("'")
            if normalized_key:
                loaded_values[normalized_key] = normalized_value

    return loaded_values


def _read_config_value(name: str) -> str | None:
    direct_value = os.getenv(name)
    if direct_value is not None:
        return direct_value

    return _load_env_file_values().get(name)


def load_smtp_settings() -> SmtpSettings:
    gmail_address = (_read_config_value("LOGICA_GMAIL_ADDRESS") or "").strip()
    gmail_app_password = (_read_config_value("LOGICA_GMAIL_APP_PASSWORD") or "").strip()

    host = (_read_config_value("LOGICA_SMTP_HOST") or "").strip()
    port_value = (_read_config_value("LOGICA_SMTP_PORT") or "587").strip() or "587"
    username = (_read_config_value("LOGICA_SMTP_USERNAME") or "").strip()
    password = (_read_config_value("LOGICA_SMTP_PASSWORD") or "").strip()
    sender = (_read_config_value("LOGICA_SMTP_FROM") or "").strip() or username
    use_ssl = _bool_env("LOGICA_SMTP_USE_SSL", False)
    use_starttls = _bool_env("LOGICA_SMTP_STARTTLS", not use_ssl)

    if not host and gmail_address and gmail_app_password:
        host = "smtp.gmail.com"
        port_value = "587"
        username = gmail_address
        password = gmail_app_password
        sender = gmail_address
        use_ssl = False
        use_starttls = True

    LOGGER.info(
        "[Email config] gmail_address_configured=%s gmail_app_password_configured=%s "
        "smtp_host_configured=%s resolved_host=%s resolved_port=%s username_configured=%s "
        "sender_configured=%s ssl=%s starttls=%s",
        bool(gmail_address),
        bool(gmail_app_password),
        bool((_read_config_value("LOGICA_SMTP_HOST") or "").strip()),
        host or "<missing>",
        port_value,
        bool(username),
        bool(sender),
        use_ssl,
        use_starttls,
    )

    if not host:
        raise _error(
            500,
            "Trimiterea emailului nu este configurata. Pentru Gmail gratis, completeaza `backend/.env` cu `LOGICA_GMAIL_ADDRESS` si `LOGICA_GMAIL_APP_PASSWORD`.",
        )

    try:
        port = int(port_value)
    except ValueError as error:
        raise _error(500, "LOGICA_SMTP_PORT nu este valid.") from error

    if not sender:
        raise _error(500, "Trimiterea emailului nu este configurata. Lipseste LOGICA_SMTP_FROM.")

    if username and not password:
        raise _error(500, "Trimiterea emailului nu este configurata. Lipseste LOGICA_SMTP_PASSWORD.")

    return SmtpSettings(
        host=host,
        port=port,
        username=username,
        password=password,
        sender=sender,
        use_ssl=use_ssl,
        use_starttls=use_starttls,
    )


def _format_completed_at(value: str | None) -> str:
    if not value:
        return "-"

    try:
        parsed_value = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return str(value)

    month_names = {
        1: "ianuarie",
        2: "februarie",
        3: "martie",
        4: "aprilie",
        5: "mai",
        6: "iunie",
        7: "iulie",
        8: "august",
        9: "septembrie",
        10: "octombrie",
        11: "noiembrie",
        12: "decembrie",
    }
    localized = parsed_value.astimezone()
    return (
        f"{localized.day} {month_names.get(localized.month, localized.month)} "
        f"{localized.year}, {localized.hour:02d}:{localized.minute:02d}"
    )


def _nested_value(payload: dict, *path: str):
    value = payload
    for key in path:
        if not isinstance(value, dict) or key not in value:
            return None
        value = value[key]
    return value


def _first_present(payload: dict, *paths: tuple[str, ...]):
    for path in paths:
        value = _nested_value(payload, *path)
        if value is not None and value != "":
            return value
    return None


def _normalized_report_email_data(report_payload: dict) -> dict:
    student_name = _first_present(
        report_payload,
        ("studentName",),
        ("student_name",),
        ("candidateName",),
        ("candidate_name",),
        ("studentDisplayName",),
        ("student_display_name",),
        ("student", "displayName"),
        ("student", "display_name"),
        ("student", "name"),
    )
    test_name = _first_present(
        report_payload,
        ("testTitle",),
        ("test_title",),
        ("examTitle",),
        ("exam_title",),
        ("testName",),
        ("test_name",),
        ("test", "title"),
        ("test", "name"),
        ("title",),
    )
    completed_at = _first_present(
        report_payload,
        ("submittedAt",),
        ("submitted_at",),
        ("finalizedAt",),
        ("finalized_at",),
        ("completedAt",),
        ("completed_at",),
        ("submittedAtLabel",),
        ("submitted_at_label",),
        ("finalizedAtLabel",),
        ("finalized_at_label",),
        ("date",),
    )
    score_value = _first_present(
        report_payload,
        ("score_percentage",),
        ("scorePercent",),
        ("percentage",),
        ("percent",),
        ("score", "percentage"),
        ("score", "percent"),
        ("result", "scorePercent"),
        ("result", "percentage"),
    )

    if score_value is None:
        correct_count = _first_present(
            report_payload,
            ("correctCount",),
            ("correct_count",),
            ("score", "correctCount"),
        )
        total_questions = _first_present(
            report_payload,
            ("totalQuestions",),
            ("total_questions",),
            ("totalItems",),
            ("total_items",),
            ("score", "totalQuestions"),
        )
        try:
            score_value = (
                float(correct_count) / float(total_questions) * 100
                if float(total_questions) > 0
                else 0
            )
        except (TypeError, ValueError):
            score_value = 0

    try:
        score = max(0, min(100, int(round(float(score_value)))))
    except (TypeError, ValueError):
        score = 0

    return {
        "student_name": str(student_name or "-"),
        "test_name": str(test_name or "-"),
        "completed_at": _format_completed_at(str(completed_at)) if completed_at else "-",
        "score": score,
    }


def render_report_email_visual_html(report_payload: dict, pdf_file_name: str) -> str:
    report_data = _normalized_report_email_data(report_payload)
    score = report_data["score"]
    radius = 104
    circumference = 2 * math.pi * radius
    offset = circumference - (score / 100) * circumference
    template = _build_template_environment().get_template(EMAIL_TEMPLATE_NAME)
    return template.render(
        student_name=report_data["student_name"],
        test_name=report_data["test_name"],
        completed_at=report_data["completed_at"],
        score=score,
        score_circumference=f"{circumference:.2f}",
        score_offset=f"{offset:.2f}",
        pdf_file_name=pdf_file_name,
    )


def _resolve_edge_executable() -> Path:
    configured_path = (_read_config_value("LOGICA_EDGE_PATH") or "").strip()
    candidates = []
    if configured_path:
        candidates.append(Path(configured_path))

    program_files_x86 = Path(os.environ.get("PROGRAMFILES(X86)", "C:/Program Files (x86)"))
    program_files = Path(os.environ.get("PROGRAMFILES", "C:/Program Files"))
    local_app_data = Path(os.environ.get("LOCALAPPDATA", ""))

    candidates.extend(
        [
            program_files_x86 / "Microsoft" / "Edge" / "Application" / "msedge.exe",
            program_files / "Microsoft" / "Edge" / "Application" / "msedge.exe",
            local_app_data / "Microsoft" / "Edge" / "Application" / "msedge.exe",
        ]
    )

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise _error(
        500,
        "Nu am gasit Microsoft Edge pentru randarea template-ului email. Instaleaza Edge sau seteaza `LOGICA_EDGE_PATH`.",
    )


def _capture_visual_card_png(report_payload: dict, pdf_file_name: str) -> bytes:
    edge_path = _resolve_edge_executable()
    html_content = render_report_email_visual_html(report_payload, pdf_file_name)

    with TemporaryDirectory(prefix="logic-email-card-") as temp_dir:
        temp_path = Path(temp_dir)
        html_path = temp_path / "report-email-card.html"
        screenshot_path = temp_path / "report-email-card.png"
        html_path.write_text(html_content, encoding="utf-8")

        command = [
            str(edge_path),
            "--headless=new",
            "--disable-gpu",
            "--hide-scrollbars",
            "--no-first-run",
            "--no-default-browser-check",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=1500",
            "--default-background-color=00000000",
            f"--window-size={EMAIL_CARD_WIDTH},{EMAIL_CARD_HEIGHT}",
            f"--force-device-scale-factor={EDGE_SCALE_FACTOR}",
            f"--screenshot={screenshot_path}",
            html_path.as_uri(),
        ]

        try:
            subprocess.run(
                command,
                check=True,
                capture_output=True,
                timeout=60,
            )
        except subprocess.CalledProcessError as error:
            stderr = error.stderr.decode("utf-8", errors="ignore").strip()
            raise _error(
                500,
                f"Template-ul email nu a putut fi randat in Edge: {stderr or 'eroare necunoscuta'}.",
            ) from error
        except subprocess.TimeoutExpired as error:
            raise _error(500, "Randarea template-ului email a depasit timpul maxim permis.") from error

        if not screenshot_path.exists():
            raise _error(500, "Fisierul imagine al template-ului email nu a fost generat.")

        return screenshot_path.read_bytes()


def render_report_email_html(card_cid: str = EMAIL_CARD_CID) -> str:
    return f"""<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Platforma de Logică - Raport elev</title>
</head>
<body style="margin:0;background:transparent;padding:0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;background:transparent;">
    <tr>
      <td align="center" style="padding:0;">
        <img
          src="cid:{card_cid}"
          width="{EMAIL_CARD_WIDTH}"
          alt="Raport elev Platforma de Logică"
          style="display:block;width:{EMAIL_CARD_WIDTH}px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;"
        />
      </td>
    </tr>
  </table>
</body>
</html>"""


def _build_plain_text(report_payload: dict, pdf_file_name: str) -> str:
    report_data = _normalized_report_email_data(report_payload)
    return (
        "Buna ziua,\n\n"
        "Atasat gasiti raportul complet al testului de logica.\n\n"
        f"Elev: {report_data['student_name']}\n"
        f"Test: {report_data['test_name']}\n"
        f"Data completarii: {report_data['completed_at']}\n"
        f"Scor final: {report_data['score']}%\n"
        f"Fisier PDF atasat: {pdf_file_name}\n\n"
        "Cu respect,\nPlatforma de Logica"
    )


def _send_smtp_message(settings: SmtpSettings, message: EmailMessage) -> None:
    recipients = ", ".join(str(value) for value in message.get_all("To", []))
    attachment_count = sum(1 for part in message.walk() if part.get_content_disposition() == "attachment")
    LOGGER.info(
        "[Email SMTP] START host=%s port=%s sender=%s recipients=%s ssl=%s starttls=%s attachments=%s",
        settings.host,
        settings.port,
        settings.sender,
        recipients or "<missing>",
        settings.use_ssl,
        settings.use_starttls,
        attachment_count,
    )
    try:
        if settings.use_ssl:
            LOGGER.info("[Email SMTP] CONNECT_SSL host=%s port=%s", settings.host, settings.port)
            with smtplib.SMTP_SSL(settings.host, settings.port, timeout=30) as smtp:
                if settings.username:
                    LOGGER.info("[Email SMTP] LOGIN username=%s", settings.username)
                    smtp.login(settings.username, settings.password)
                LOGGER.info("[Email SMTP] SEND subject=%s", message.get("Subject", ""))
                smtp.send_message(message)
        else:
            LOGGER.info("[Email SMTP] CONNECT host=%s port=%s", settings.host, settings.port)
            with smtplib.SMTP(settings.host, settings.port, timeout=30) as smtp:
                smtp.ehlo()
                if settings.use_starttls:
                    LOGGER.info("[Email SMTP] STARTTLS")
                    smtp.starttls()
                    smtp.ehlo()
                if settings.username:
                    LOGGER.info("[Email SMTP] LOGIN username=%s", settings.username)
                    smtp.login(settings.username, settings.password)
                LOGGER.info("[Email SMTP] SEND subject=%s", message.get("Subject", ""))
                smtp.send_message(message)
        LOGGER.info(
            "[Email SMTP] SUCCESS recipients=%s subject=%s attachments=%s",
            recipients or "<missing>",
            message.get("Subject", ""),
            attachment_count,
        )
    except smtplib.SMTPException as error:
        LOGGER.exception(
            "[Email SMTP] ERROR type=%s recipients=%s message=%s",
            type(error).__name__,
            recipients or "<missing>",
            error,
        )
        raise _error(502, f"Emailul nu a putut fi trimis: {error}") from error
    except OSError as error:
        LOGGER.exception(
            "[Email SMTP] ERROR type=%s recipients=%s message=%s",
            type(error).__name__,
            recipients or "<missing>",
            error,
        )
        raise _error(502, f"Serverul SMTP nu a putut fi contactat: {error}") from error


def send_report_email(
    recipient_email: str,
    report_payload: dict,
    pdf_path: Path | None = None,
    *,
    pdf_bytes: bytes | None = None,
    pdf_file_name: str | None = None,
) -> dict:
    LOGGER.info(
        "[Report email] PREPARE report_id=%s recipient=%s source=%s",
        report_payload.get("id") or report_payload.get("reportId") or report_payload.get("attemptId") or "<missing>",
        recipient_email.strip() or "<missing>",
        "bytes" if pdf_bytes is not None else "path",
    )
    settings = load_smtp_settings()
    if not recipient_email.strip():
        raise _error(400, "Elevul nu are o adresa de email salvata.")
    if pdf_bytes is None and (pdf_path is None or not pdf_path.exists()):
        raise _error(404, "PDF-ul raportului nu este disponibil local.")

    attachment_name = pdf_file_name or (pdf_path.name if pdf_path is not None else "raport_elev.pdf")
    attachment_bytes = pdf_bytes if pdf_bytes is not None else pdf_path.read_bytes()
    card_png = _capture_visual_card_png(report_payload, attachment_name)
    card_cid = f"{EMAIL_CARD_CID}-{uuid.uuid4().hex}"
    report_data = _normalized_report_email_data(report_payload)
    message = EmailMessage()
    message["Subject"] = f"Raport test logica - {report_data['test_name']}"
    message["From"] = settings.sender
    message["To"] = recipient_email.strip()
    message.set_content(_build_plain_text(report_payload, attachment_name))
    message.add_alternative(render_report_email_html(card_cid), subtype="html")
    html_part = message.get_payload()[-1]
    html_part.add_related(
        card_png,
        maintype="image",
        subtype="png",
        cid=f"<{card_cid}>",
        disposition="inline",
        filename=f"{card_cid}.png",
    )
    message.add_attachment(
        attachment_bytes,
        maintype="application",
        subtype="pdf",
        filename=attachment_name,
    )

    _send_smtp_message(settings, message)
    LOGGER.info(
        "[Report email] SUCCESS report_id=%s recipient=%s file=%s",
        report_payload.get("id") or report_payload.get("reportId") or report_payload.get("attemptId") or "<missing>",
        recipient_email.strip(),
        attachment_name,
    )

    return {
        "ok": True,
        "recipient_email": recipient_email.strip(),
        "pdf_file_name": attachment_name,
        "subject": message["Subject"],
    }


def send_reports_email(recipient_email: str, deliveries: list[dict]) -> dict:
    LOGGER.info(
        "[Report email bulk] PREPARE recipient=%s reports=%s",
        recipient_email.strip() or "<missing>",
        len(deliveries),
    )
    settings = load_smtp_settings()
    normalized_recipient = recipient_email.strip()
    if not normalized_recipient:
        raise _error(400, "Elevul nu are o adresa de email salvata.")
    if not deliveries:
        raise _error(400, "Nu exista rapoarte selectate pentru aceasta adresa.")

    attachments = []
    for delivery in deliveries:
        pdf_path_value = delivery.get("pdf_path")
        pdf_path = Path(pdf_path_value) if pdf_path_value else None
        pdf_bytes = delivery.get("pdf_bytes")
        pdf_name = delivery.get("pdf_file_name") or (pdf_path.name if pdf_path is not None else "raport_elev.pdf")
        if pdf_bytes is None and (pdf_path is None or not pdf_path.exists()):
            raise _error(404, f"PDF-ul {pdf_name} nu este disponibil local.")
        attachments.append(
            {
                "path": pdf_path,
                "bytes": pdf_bytes,
                "name": pdf_name,
                "report": delivery["report"],
            }
        )

    primary_attachment = attachments[0]
    primary_report = primary_attachment["report"]
    card_png = _capture_visual_card_png(primary_report, primary_attachment["name"])
    card_cid = f"{EMAIL_CARD_CID}-{uuid.uuid4().hex}"
    message = EmailMessage()
    message["Subject"] = (
        f"Rapoarte teste logica - {len(attachments)} fisiere"
        if len(attachments) > 1
        else f"Raport test logica - {_normalized_report_email_data(primary_report)['test_name']}"
    )
    message["From"] = settings.sender
    message["To"] = normalized_recipient

    report_lines = []
    for attachment in attachments:
        report_data = _normalized_report_email_data(attachment["report"])
        report_lines.append(
            f"- {report_data['test_name']} | {report_data['completed_at']} | "
            f"scor {report_data['score']}% | {attachment['name']}"
        )
    message.set_content(
        "Buna ziua,\n\n"
        "Atasat gasiti rapoartele selectate din Platforma de Logica.\n\n"
        + "\n".join(report_lines)
        + "\n\nCu respect,\nPlatforma de Logica"
    )
    message.add_alternative(render_report_email_html(card_cid), subtype="html")
    html_part = message.get_payload()[-1]
    html_part.add_related(
        card_png,
        maintype="image",
        subtype="png",
        cid=f"<{card_cid}>",
        disposition="inline",
        filename=f"{card_cid}.png",
    )

    for attachment in attachments:
        message.add_attachment(
            attachment["bytes"] if attachment["bytes"] is not None else attachment["path"].read_bytes(),
            maintype="application",
            subtype="pdf",
            filename=attachment["name"],
        )

    _send_smtp_message(settings, message)
    LOGGER.info(
        "[Report email bulk] SUCCESS recipient=%s reports=%s",
        normalized_recipient,
        len(attachments),
    )
    return {
        "ok": True,
        "recipient_email": normalized_recipient,
        "pdf_file_names": [attachment["name"] for attachment in attachments],
        "attachments_count": len(attachments),
        "subject": message["Subject"],
    }
