from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import Response

from .admitere_student_reports_service import (
    create_admitere_student_report,
    get_admitere_student_report,
    generate_admitere_student_report_pdf,
    generate_admitere_student_report_pdf_for_user,
    generate_admitere_student_report_pdf_bytes,
    list_admitere_student_reports,
)
from .auth_service import get_admin_user, get_current_user
from .pdf_service import build_content_disposition
from .report_email_service import send_report_email

router = APIRouter(prefix="/admitere/student-reports", tags=["admitere-student-reports"])


def _pdf_response(pdf_bytes: bytes, download_name: str) -> Response:
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": build_content_disposition(download_name),
            "Cache-Control": "no-store",
        },
    )


@router.post("")
def create_report(
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return create_admitere_student_report(current_user, payload)


@router.get("/admin")
def admin_reports(current_user: dict = Depends(get_admin_user)) -> list[dict]:
    return list_admitere_student_reports(current_user)


@router.get("/admin/{report_id}")
def admin_report(report_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    return get_admitere_student_report(current_user, report_id)


@router.get("/admin/{report_id}/pdf")
def admin_report_pdf(report_id: str, current_user: dict = Depends(get_admin_user)):
    _report, pdf_bytes, download_name = generate_admitere_student_report_pdf(current_user, report_id)
    return _pdf_response(pdf_bytes, download_name)


@router.get("/{report_id}/pdf")
def own_report_pdf(report_id: str, current_user: dict = Depends(get_current_user)):
    _report, pdf_bytes, download_name = generate_admitere_student_report_pdf_for_user(current_user, report_id)
    return _pdf_response(pdf_bytes, download_name)


@router.post("/admin/{report_id}/email")
def admin_report_email(report_id: str, current_user: dict = Depends(get_admin_user)) -> dict:
    report = get_admitere_student_report(current_user, report_id)
    student_email = report.get("studentEmail") or report.get("student_email") or ""
    if not student_email:
        raise HTTPException(status_code=422, detail="Raportul Admitere nu are email de elev salvat.")
    pdf_bytes = generate_admitere_student_report_pdf_bytes(report)
    pdf_file_name = report.get("reportPdfFileName") or report.get("report_pdf_file_name") or f"raport_admitere_{report_id}.pdf"
    return send_report_email(student_email, report, pdf_bytes=pdf_bytes, pdf_file_name=pdf_file_name)
