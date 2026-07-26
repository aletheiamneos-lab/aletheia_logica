from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import FileResponse

from .auth_service import get_admin_user, get_current_user
from .bac_student_reports_service import (
    create_bac_student_report,
    get_bac_student_report,
    get_bac_student_report_for_user,
    get_bac_student_report_pdf_path,
    get_bac_student_report_pdf_path_for_user,
    list_bac_student_reports,
)
from .pdf_service import build_content_disposition
from .report_email_service import send_report_email

router = APIRouter(prefix="/bac/student-reports", tags=["bac-student-reports"])


def _download_name(report: dict, pdf_path: Path) -> str:
    student = str(report.get("studentName") or "elev").replace(" ", "_")
    return f"raport_bac_{student}_{report.get('id') or pdf_path.stem}.pdf"


@router.post("")
def create_report(
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return create_bac_student_report(current_user, payload)


@router.get("/admin")
def admin_reports(current_user: dict = Depends(get_admin_user)) -> list[dict]:
    return list_bac_student_reports(current_user)


@router.get("/admin/{report_id}")
def admin_report(report_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    return get_bac_student_report(current_user, report_id)


@router.get("/admin/{report_id}/pdf")
def admin_report_pdf(report_id: str, current_user: dict = Depends(get_admin_user)):
    report = get_bac_student_report(current_user, report_id)
    pdf_path = get_bac_student_report_pdf_path(current_user, report_id)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        headers={"Content-Disposition": build_content_disposition(_download_name(report, pdf_path))},
    )


@router.get("/{report_id}/pdf")
def own_report_pdf(report_id: str, current_user: dict = Depends(get_current_user)):
    report = get_bac_student_report_for_user(current_user, report_id)
    pdf_path = get_bac_student_report_pdf_path_for_user(current_user, report_id)
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        headers={"Content-Disposition": build_content_disposition(_download_name(report, pdf_path))},
    )


@router.post("/admin/{report_id}/email")
def admin_report_email(report_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    report = get_bac_student_report(current_user, report_id)
    student_email = report.get("studentEmail") or report.get("student_email") or ""
    if not student_email:
        raise HTTPException(status_code=422, detail="Raportul BAC nu are email de elev salvat.")
    pdf_path = get_bac_student_report_pdf_path(current_user, report_id)
    return send_report_email(student_email, report, pdf_path)
