from __future__ import annotations

import json
import math
import re
import unicodedata
import uuid
from io import BytesIO
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from .admitere_report_pdf import build_admitere_pdf_report
from .database import DATA_DIR

REPORT_ROOT = DATA_DIR / "archive" / "admitere_student_reports"
REPORT_JSON_DIR = REPORT_ROOT / "json"

PAGE_W, PAGE_H = A4
MARGIN = 28
TEXT = HexColor("#071A33")
MUTED = HexColor("#64748b")
LINE = HexColor("#E5E0D6")
ADMITERE_REPORT_TITLE = "Teste admitere"
INTEGRATED_REPORT_TITLE = "Teste integrate"
ADMITERE_PAGE_BG_HEX = "#F3EFE7"
INTEGRATED_PAGE_BG_HEX = "#EAF2F5"
PAGE_BG = HexColor(ADMITERE_PAGE_BG_HEX)
NAVY = HexColor("#071A33")
NAVY_SOFT = HexColor("#082A4D")
GOLD = HexColor("#C99A3D")
GOLD_SOFT = HexColor("#E7D3A3")
CREAM = HexColor("#EFE8DA")
WHITE = HexColor("#FFFFFF")
GREEN = HexColor("#2F9E44")
GREEN_SOFT = HexColor("#EAF7ED")
RED = HexColor("#E03131")
RED_SOFT = HexColor("#FDEAEA")
NEUTRAL_SOFT = HexColor("#F8FAFC")
BLUE_SOFT = HexColor("#EFF6FF")
REPORT_TEMPLATE = "aletheia-admitere"
REPORT_TEMPLATE_VERSION = "v2-dynamic"
QUESTION_HEADER_HEIGHT = 24
QUESTION_TEXT_TOP_GAP = 18
QUESTION_TEXT_LEADING = 10.2
QUESTION_AFTER_TEXT_GAP = 8
QUESTION_OPTION_GAP = 6
QUESTION_AFTER_OPTIONS_GAP = 11
QUESTION_BOTTOM_PADDING = 14
QUESTION_CARD_GAP = 8
QUESTION_OPTION_MIN_HEIGHT = 20
QUESTION_OPTION_VERTICAL_PADDING = 12
QUESTION_OPTION_LEADING = 7.6
QUESTION_EXPLANATION_TITLE_HEIGHT = 11
QUESTION_EXPLANATION_LINE_LEADING = 7.4
QUESTION_EXPLANATION_ROW_GAP = 2.4


def _resolve_fonts() -> tuple[str, str]:
    candidates = [
        (Path(r"C:\Windows\Fonts\arial.ttf"), Path(r"C:\Windows\Fonts\arialbd.ttf"), "Arial"),
        (
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
            "DejaVu",
        ),
    ]
    for regular_path, bold_path, family in candidates:
        if not regular_path.exists() or not bold_path.exists():
            continue
        regular_name = f"AdmitereReport-{family}-Regular"
        bold_name = f"AdmitereReport-{family}-Bold"
        if regular_name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(regular_name, str(regular_path)))
        if bold_name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(bold_name, str(bold_path)))
        return regular_name, bold_name
    return "Helvetica", "Helvetica-Bold"


FONT_REGULAR, FONT_BOLD = _resolve_fonts()


def _ensure_dirs() -> None:
    REPORT_JSON_DIR.mkdir(parents=True, exist_ok=True)


def _safe_component(value: str) -> str:
    normalized = re.sub(r"\s+", "_", str(value or "").strip())
    normalized = re.sub(r"[^A-Za-z0-9_\-]+", "", normalized)
    return normalized or "raport"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _as_list(value) -> list:
    return value if isinstance(value, list) else []


def _strip_diacritics(value: str) -> str:
    return "".join(
        char
        for char in unicodedata.normalize("NFD", str(value or ""))
        if unicodedata.category(char) != "Mn"
    )


def _pdf_text(value) -> str:
    return (
        _strip_diacritics(str(value or ""))
        .replace("„", '"')
        .replace("”", '"')
        .replace("“", '"')
        .replace("’", "'")
        .replace("–", "-")
        .replace("—", "-")
        .replace("…", "...")
        .replace("→", "->")
        .replace("≤", "<=")
        .replace("≥", ">=")
    )


def _normalize_identity(value: str) -> str:
    return re.sub(r"\s+", "", _strip_diacritics(str(value or "")).lower())


def _clamp_percentage(value) -> int:
    try:
        numeric_value = int(round(float(value)))
    except (TypeError, ValueError):
        return 0
    return max(0, min(100, numeric_value))


def _hex_color(value, fallback):
    raw_value = str(value or "").strip()
    if re.fullmatch(r"#[0-9A-Fa-f]{6}", raw_value):
        return HexColor(raw_value)
    return fallback


def _is_integrated_report(report: dict) -> bool:
    markers = " ".join(
        str(report.get(key) or "")
        for key in ["reportTemplate", "report_template", "reportFooterLabel", "testType", "test_type"]
    )
    return "integr" in _strip_diacritics(markers).lower()


def _default_report_title(report: dict) -> str:
    return INTEGRATED_REPORT_TITLE if _is_integrated_report(report) else ADMITERE_REPORT_TITLE


def _display_report_title(report: dict) -> str:
    raw_title = _pdf_text(report.get("reportTitle") or "").strip()
    normalized = _normalize_identity(raw_title)
    legacy_titles = {
        "raportevaluare",
        "raportevaluaretestgrila",
        "raportevaluaretestintegrat",
    }
    if not raw_title or normalized in legacy_titles:
        return _default_report_title(report)
    return raw_title


def _default_page_bg(report: dict):
    return HexColor(INTEGRATED_PAGE_BG_HEX) if _is_integrated_report(report) else PAGE_BG


def _default_footer_label(report: dict) -> str:
    return "teste integrate" if _is_integrated_report(report) else "teste admitere"


def _centered_baseline(font_name: str, font_size: float, center_y: float) -> float:
    ascent, descent = pdfmetrics.getAscentDescent(font_name, font_size)
    return center_y - (ascent + descent) / 2


def _first_wrapped_baseline(font_name: str, font_size: float, line_count: int, leading: float, center_y: float) -> float:
    ascent, descent = pdfmetrics.getAscentDescent(font_name, font_size)
    block_height = (ascent - descent) + max(0, line_count - 1) * leading
    return center_y + block_height / 2 - ascent


def _wrap_lines(text: str, width: float, size: float = 9, font_name: str = FONT_REGULAR) -> list[str]:
    content = re.sub(r"\s+", " ", _pdf_text(text).strip())
    if not content:
        return []

    words = content.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if not current or stringWidth(candidate, font_name, size) <= width:
            current = candidate
            continue
        lines.append(current)
        current = word
    if current:
        lines.append(current)
    return lines


def _draw_page_background(pdf: canvas.Canvas, page_number: int, page_bg=PAGE_BG, footer_label: str = "raport admitere") -> None:
    pdf.setFillColor(page_bg)
    pdf.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    pdf.setFont(FONT_REGULAR, 7)
    pdf.setFillColor(MUTED)
    pdf.drawCentredString(PAGE_W / 2, 16, _pdf_text(f"Aletheia | {footer_label} | {page_number}"))


def _ensure_page(pdf: canvas.Canvas, state: dict, y: float, height: float = 44) -> float:
    if y - height >= MARGIN + 18:
        return y
    pdf.showPage()
    state["page_number"] += 1
    _draw_page_background(pdf, state["page_number"], state.get("page_bg", PAGE_BG), state.get("footer_label", "raport admitere"))
    return PAGE_H - MARGIN


def _draw_wrapped(
    pdf: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    size: float = 9,
    leading: float | None = None,
    font_name: str = FONT_REGULAR,
    state: dict | None = None,
    color=TEXT,
) -> float:
    lines = _wrap_lines(text, width, size, font_name)
    if not lines:
        return y
    leading = leading or size * 1.38
    pdf.setFont(font_name, size)
    pdf.setFillColor(color)
    for line in lines:
        if state is not None:
            y = _ensure_page(pdf, state, y, leading + 6)
        pdf.drawString(x, y, line)
        y -= leading
    return y


def _draw_aletheia_mark(pdf: canvas.Canvas, center_x: float, y: float, height: float) -> None:
    width = height * 0.65
    x = center_x - width / 2
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(1.1)
    pdf.roundRect(x, y, width, height, 5, stroke=1, fill=0)
    pdf.line(x + width * 0.62, y + height, x + width, y + height * 0.74)
    pdf.line(x + width, y + height * 0.26, x + width * 0.68, y)
    pdf.setFont("Times-Roman", height * 0.54)
    pdf.setFillColor(GOLD)
    pdf.drawCentredString(center_x, y + height * 0.4, "L")


def _draw_section_title(pdf: canvas.Canvas, title: str, y: float) -> float:
    pdf.setFont("Times-Bold", 17)
    pdf.setFillColor(NAVY)
    title = _pdf_text(title).upper()
    title_width = stringWidth(title, "Times-Bold", 17)
    center_x = PAGE_W / 2
    line_y = y - 2
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.6)
    pdf.line(MARGIN, line_y, center_x - title_width / 2 - 18, line_y)
    pdf.line(center_x + title_width / 2 + 18, line_y, PAGE_W - MARGIN, line_y)
    pdf.setFillColor(GOLD)
    pdf.circle(center_x - title_width / 2 - 10, line_y, 2.2, stroke=0, fill=1)
    pdf.circle(center_x + title_width / 2 + 10, line_y, 2.2, stroke=0, fill=1)
    pdf.setFillColor(NAVY)
    pdf.drawCentredString(center_x, y - 8, title)
    return y - 23


def _draw_header(pdf: canvas.Canvas, report: dict, y: float) -> float:
    center_x = PAGE_W / 2
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.8)
    pdf.line(MARGIN, y - 11, center_x - 60, y - 11)
    pdf.line(center_x + 60, y - 11, PAGE_W - MARGIN, y - 11)
    pdf.setFillColor(GOLD)
    pdf.circle(center_x - 56, y - 11, 2.2, stroke=0, fill=1)
    pdf.circle(center_x + 56, y - 11, 2.2, stroke=0, fill=1)

    _draw_aletheia_mark(pdf, center_x, y - 43, 34)
    pdf.setFont(FONT_BOLD, 10)
    pdf.setFillColor(NAVY)
    pdf.drawCentredString(center_x, y - 57, "ALETHEIA")
    pdf.setFont(FONT_REGULAR, 6.4)
    pdf.setFillColor(GOLD)
    pdf.drawCentredString(center_x, y - 67, "EXCELENTA PRIN EVALUARE")

    pdf.setFont("Times-Bold", 25)
    pdf.setFillColor(NAVY)
    pdf.drawCentredString(center_x, y - 95, _display_report_title(report))
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.55)
    pdf.drawCentredString(center_x, y - 113, "◇")

    pdf.setFillColor(_hex_color(report.get("reportBackgroundColor"), _default_page_bg(report)))
    pdf.rect(center_x - 22, y - 121, 44, 18, stroke=0, fill=1)
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.55)
    pdf.line(center_x - 38, y - 111, center_x + 38, y - 111)

    metadata = [
        ("Nume candidat", report.get("studentName") or report.get("candidateName") or "Candidat"),
        ("Data sustinerii", report.get("date") or str(report.get("submittedAt") or "")[:10] or "-"),
        ("Test", report.get("testTitle") or "Test admitere"),
        ("Numar intrebari", report.get("totalQuestions") or 0),
    ]
    meta_top = y - 130
    meta_h = 35
    content_w = PAGE_W - MARGIN * 2
    col_w = content_w / 4
    pdf.setStrokeColor(GOLD)
    pdf.line(MARGIN, meta_top - meta_h, PAGE_W - MARGIN, meta_top - meta_h)
    for index, (label, value) in enumerate(metadata):
        x = MARGIN + index * col_w
        if index > 0:
            pdf.line(x, meta_top - 4, x, meta_top - meta_h + 4)
        pdf.setFont(FONT_REGULAR, 7.2)
        pdf.setFillColor(MUTED)
        pdf.drawString(x + 8, meta_top - 10, _pdf_text(label))
        pdf.setFont("Times-Bold", 8.8)
        pdf.setFillColor(NAVY)
        value_lines = _wrap_lines(value, col_w - 16, 8.8, "Times-Bold")[:2]
        for line_index, line in enumerate(value_lines):
            pdf.drawString(x + 8, meta_top - 22 - line_index * 9, _pdf_text(line))
    return meta_top - meta_h - 18


def _draw_header_clean(pdf: canvas.Canvas, report: dict, y: float) -> float:
    center_x = PAGE_W / 2
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.8)
    pdf.line(MARGIN, y - 11, center_x - 60, y - 11)
    pdf.line(center_x + 60, y - 11, PAGE_W - MARGIN, y - 11)
    pdf.setFillColor(GOLD)
    pdf.circle(center_x - 56, y - 11, 2.2, stroke=0, fill=1)
    pdf.circle(center_x + 56, y - 11, 2.2, stroke=0, fill=1)

    _draw_aletheia_mark(pdf, center_x, y - 43, 34)
    pdf.setFont(FONT_BOLD, 10)
    pdf.setFillColor(NAVY)
    pdf.drawCentredString(center_x, y - 57, "ALETHEIA")
    pdf.setFont(FONT_REGULAR, 6.4)
    pdf.setFillColor(GOLD)
    pdf.drawCentredString(center_x, y - 67, "EXCELENTA PRIN EVALUARE")

    pdf.setFont("Times-Bold", 25)
    pdf.setFillColor(NAVY)
    pdf.drawCentredString(center_x, y - 95, _display_report_title(report))
    pdf.setStrokeColor(GOLD)
    pdf.setLineWidth(0.55)
    pdf.line(center_x - 38, y - 111, center_x + 38, y - 111)

    metadata = [
        ("Nume candidat", report.get("studentName") or report.get("candidateName") or "Candidat"),
        ("Data sustinerii", report.get("date") or str(report.get("submittedAt") or "")[:10] or "-"),
        ("Test", report.get("testTitle") or "Test admitere"),
        ("Numar intrebari", report.get("totalQuestions") or 0),
    ]
    meta_top = y - 130
    meta_h = 35
    content_w = PAGE_W - MARGIN * 2
    col_w = content_w / 4
    pdf.setStrokeColor(GOLD)
    pdf.line(MARGIN, meta_top - meta_h, PAGE_W - MARGIN, meta_top - meta_h)
    for index, (label, value) in enumerate(metadata):
        x = MARGIN + index * col_w
        if index > 0:
            pdf.line(x, meta_top - 4, x, meta_top - meta_h + 4)
        pdf.setFont(FONT_REGULAR, 7.2)
        pdf.setFillColor(MUTED)
        pdf.drawString(x + 8, meta_top - 10, _pdf_text(label))
        pdf.setFont("Times-Bold", 8.8)
        pdf.setFillColor(NAVY)
        for line_index, line in enumerate(_wrap_lines(value, col_w - 16, 8.8, "Times-Bold")[:2]):
            pdf.drawString(x + 8, meta_top - 22 - line_index * 9, _pdf_text(line))
    return meta_top - meta_h - 18


def _performance_label(percentage: int) -> str:
    if percentage == 100:
        return "Excelent"
    if percentage >= 80:
        return "Foarte bine"
    if percentage >= 51:
        return "Satisfacator"
    if percentage >= 21:
        return "In dezvoltare"
    return "Inceput"


def _performance_stars(percentage: int) -> int:
    if percentage == 100:
        return 5
    if percentage >= 80:
        return 4
    if percentage >= 51:
        return 3
    if percentage >= 21:
        return 2
    return 1


def _draw_score_card(pdf: canvas.Canvas, x: float, y: float, width: float, height: float, report: dict) -> None:
    total_questions = int(report.get("totalQuestions") or 0)
    score = int(report.get("correctCount") or report.get("score") or 0)
    percentage = _clamp_percentage(report.get("scorePercent") or report.get("percentage"))
    pdf.setFillColor(NAVY)
    pdf.setStrokeColor(GOLD)
    pdf.roundRect(x, y - height, width, height, 7, fill=1, stroke=1)
    pdf.setFont(FONT_REGULAR, 8)
    pdf.setFillColor(GOLD)
    pdf.drawCentredString(x + width / 2, y - 17, "SCOR OBTINUT")
    pdf.setFont("Times-Bold", 27)
    pdf.drawRightString(x + width / 2 - 3, y - 39, str(score))
    pdf.setFont("Times-Bold", 16)
    pdf.setFillColor(WHITE)
    pdf.drawString(x + width / 2, y - 39, f"/ {total_questions}")
    pdf.setStrokeColor(GOLD)
    pdf.line(x + 18, y - 51, x + width - 18, y - 51)
    pdf.setFont(FONT_REGULAR, 7.2)
    pdf.setFillColor(GOLD)
    pdf.drawCentredString(x + width / 2, y - 65, "PERFORMANTA")
    pdf.setFont("Times-Bold", 11.5)
    pdf.drawCentredString(x + width / 2, y - 79, _pdf_text(_performance_label(percentage)))
    active_stars = _performance_stars(percentage)
    dot_start = x + width / 2 - 16
    dot_y = y - height + 10.5
    for index in range(5):
        pdf.setFillColor(GOLD if index < active_stars else NAVY_SOFT)
        pdf.setStrokeColor(GOLD)
        pdf.circle(dot_start + index * 8, dot_y, 1.8, stroke=1, fill=1)


def _draw_percentage_card(pdf: canvas.Canvas, x: float, y: float, width: float, height: float, percentage: int) -> None:
    pdf.setFillColor(WHITE)
    pdf.setStrokeColor(GOLD_SOFT)
    pdf.roundRect(x, y - height, width, height, 7, fill=1, stroke=1)
    cx = x + width / 2
    cy = y - height / 2
    pdf.setStrokeColor(CREAM)
    pdf.setLineWidth(8)
    pdf.circle(cx, cy, 28, stroke=1, fill=0)
    if percentage > 0:
        pdf.setStrokeColor(NAVY)
        pdf.setLineWidth(8)
        segments = max(6, int(percentage / 4))
        points = []
        start = -90
        end = start + percentage * 3.6
        for index in range(segments + 1):
            angle = math.radians(start + (end - start) * index / segments)
            points.append((cx + math.cos(angle) * 28, cy + math.sin(angle) * 28))
        for first, second in zip(points, points[1:]):
            pdf.line(first[0], first[1], second[0], second[1])
    pdf.setLineWidth(0.6)
    percentage_label = f"{percentage}%"
    percentage_font = 20.0
    while percentage_font > 15 and stringWidth(percentage_label, FONT_BOLD, percentage_font) > 41:
        percentage_font -= 0.5
    pdf.setFont(FONT_BOLD, percentage_font)
    pdf.setFillColor(NAVY)
    pdf.drawCentredString(cx, _centered_baseline(FONT_BOLD, percentage_font, cy), percentage_label)


def _draw_radar_card(pdf: canvas.Canvas, x: float, y: float, width: float, height: float, radar: list) -> None:
    pdf.setFillColor(WHITE)
    pdf.setStrokeColor(GOLD_SOFT)
    pdf.roundRect(x, y - height, width, height, 7, fill=1, stroke=1)
    axes = [(radar[index] if index < len(radar) and isinstance(radar[index], dict) else {}) for index in range(5)]
    cx = x + width / 2
    cy = y - height / 2 - 1
    radius = 29
    pdf.setStrokeColor(GOLD_SOFT)
    pdf.setLineWidth(0.45)
    for ring in range(1, 5):
        ring_radius = radius * ring / 4
        points = []
        for index in range(5):
            angle = -math.pi / 2 + index * math.tau / 5
            points.append((cx + math.cos(angle) * ring_radius, cy + math.sin(angle) * ring_radius))
        for first, second in zip(points, points[1:] + points[:1]):
            pdf.line(first[0], first[1], second[0], second[1])

    value_points = []
    for index, axis in enumerate(axes):
        angle = -math.pi / 2 + index * math.tau / 5
        label = _pdf_text(axis.get("axis") or f"C{index + 1}")
        value = _clamp_percentage(axis.get("value"))
        pdf.setFont(FONT_BOLD, 6.5)
        pdf.setFillColor(NAVY)
        pdf.drawCentredString(cx + math.cos(angle) * (radius + 11), cy + math.sin(angle) * (radius + 11) - 2, label)
        value_points.append((cx + math.cos(angle) * radius * value / 100, cy + math.sin(angle) * radius * value / 100))

    if len(value_points) >= 3:
        path = pdf.beginPath()
        path.moveTo(value_points[0][0], value_points[0][1])
        for point in value_points[1:]:
            path.lineTo(point[0], point[1])
        path.close()
        pdf.setFillColor(HexColor("#D8B56D"))
        pdf.setStrokeColor(GOLD)
        pdf.drawPath(path, stroke=1, fill=1)


def _draw_result_summary(pdf: canvas.Canvas, report: dict, y: float) -> float:
    y = _draw_section_title(pdf, "REZULTAT GENERAL", y)
    gap = 12
    card_width = (PAGE_W - MARGIN * 2 - gap * 2) / 3
    card_height = 96
    percentage = _clamp_percentage(report.get("scorePercent") or report.get("percentage"))
    _draw_score_card(pdf, MARGIN, y, card_width, card_height, report)
    _draw_percentage_card(pdf, MARGIN + card_width + gap, y, card_width, card_height, percentage)
    _draw_radar_card(pdf, MARGIN + (card_width + gap) * 2, y, card_width, card_height, _as_list(report.get("radar")))
    return y - card_height - 22


def _status_color(status: str):
    normalized = str(status or "").lower()
    if "corect" in normalized:
        return GREEN
    if "gres" in normalized or "gre" in normalized or "fara" in normalized:
        return RED
    return MUTED


def _format_explanation(explanation) -> list[str]:
    if isinstance(explanation, dict):
        labels = [
            ("step1", "Pasul 1"),
            ("step2", "Pasul 2"),
            ("step3", "Pasul 3"),
            ("conclusion", "Concluzie"),
        ]
        return [f"{label}: {explanation.get(key)}" for key, label in labels if explanation.get(key)]
    if explanation:
        return [str(explanation)]
    return []


def _question_status(question: dict) -> tuple[str, bool]:
    status = str(question.get("status") or "")
    normalized = status.lower()
    if "corect" in normalized:
        return status or "Corect", True
    selected = str(question.get("selected") or "")
    correct = str(question.get("correct") or "")
    return status or ("Corect" if selected and selected == correct else "Gresit"), bool(selected and selected == correct)


def _measure_question_card(question: dict, content_width: float) -> float:
    inner_width = content_width - 28
    question_lines = _wrap_lines(question.get("text") or "", inner_width, 8.6, FONT_BOLD)
    options = question.get("options") if isinstance(question.get("options"), dict) else {}
    option_keys = sorted(options.keys())
    option_heights = [
        max(
            QUESTION_OPTION_MIN_HEIGHT,
            QUESTION_OPTION_VERTICAL_PADDING
            + len(_wrap_lines(options.get(key) or "", inner_width - 34, 6.8)) * QUESTION_OPTION_LEADING,
        )
        for key in option_keys
    ]
    options_height = sum(option_heights)
    if len(option_heights) > 1:
        options_height += (len(option_heights) - 1) * QUESTION_OPTION_GAP
    explanation_rows = _format_explanation(question.get("explanation"))
    explanation_height = 0
    if explanation_rows:
        explanation_height = (
            QUESTION_AFTER_OPTIONS_GAP
            + QUESTION_EXPLANATION_TITLE_HEIGHT
            + sum(
                max(QUESTION_EXPLANATION_LINE_LEADING, len(_wrap_lines(row, inner_width, 6.7)) * QUESTION_EXPLANATION_LINE_LEADING)
                + QUESTION_EXPLANATION_ROW_GAP
                for row in explanation_rows
            )
        )
    content_height = (
        QUESTION_HEADER_HEIGHT
        + QUESTION_TEXT_TOP_GAP
        + len(question_lines) * QUESTION_TEXT_LEADING
        + QUESTION_AFTER_TEXT_GAP
        + options_height
        + explanation_height
        + QUESTION_BOTTOM_PADDING
    )
    return max(98, content_height)


def _draw_option(
    pdf: canvas.Canvas,
    key: str,
    label: str,
    x: float,
    y: float,
    width: float,
    height: float,
    selected: str,
    correct: str,
) -> None:
    is_selected = selected == key
    is_correct = correct == key
    fill = HexColor("#FFF8E8") if is_correct else WHITE if is_selected else NEUTRAL_SOFT
    border = GOLD if is_correct else GOLD_SOFT if is_selected else LINE
    badge_fill = GOLD if is_correct else NAVY if is_selected else WHITE
    badge_text = WHITE if is_correct or is_selected else NAVY
    pdf.setFillColor(fill)
    pdf.setStrokeColor(border)
    pdf.roundRect(x, y - height, width, height, 4, fill=1, stroke=1)
    pdf.setFillColor(badge_fill)
    pdf.setStrokeColor(border)
    pdf.circle(x + 9, y - height / 2, 6, stroke=1, fill=1)
    pdf.setFont(FONT_BOLD, 6.2)
    pdf.setFillColor(badge_text)
    pdf.drawCentredString(x + 9, y - height / 2 - 2, key)
    option_font_size = 6.8
    option_leading = QUESTION_OPTION_LEADING
    pdf.setFont(FONT_REGULAR, option_font_size)
    pdf.setFillColor(TEXT)
    lines = _wrap_lines(label, width - 24, option_font_size, FONT_REGULAR)
    start_y = _first_wrapped_baseline(FONT_REGULAR, option_font_size, len(lines), option_leading, y - height / 2)
    for index, line in enumerate(lines):
        pdf.drawString(x + 20, start_y - index * option_leading, _pdf_text(line))


def _draw_question_card(pdf: canvas.Canvas, question: dict, y: float, state: dict) -> float:
    content_width = PAGE_W - MARGIN * 2
    height = _measure_question_card(question, content_width)
    y = _ensure_page(pdf, state, y, height + 14)
    x = MARGIN
    inner_x = x + 14
    inner_width = content_width - 28
    status, is_correct = _question_status(question)
    is_unanswered = "fara" in _pdf_text(status).lower() or not str(question.get("selected") or "").strip()
    card_fill = WHITE
    header_fill = HexColor("#F8F1E2")
    card_border = GOLD_SOFT

    pdf.setFillColor(card_fill)
    pdf.setStrokeColor(card_border)
    pdf.roundRect(x, y - height, content_width, height, 6, fill=1, stroke=1)

    header_h = QUESTION_HEADER_HEIGHT
    pdf.setFillColor(header_fill)
    pdf.setStrokeColor(card_border)
    pdf.roundRect(x + 5, y - header_h - 5, content_width - 10, header_h, 5, fill=1, stroke=1)
    pdf.setFillColor(NAVY)
    pdf.circle(inner_x + 9, y - 17, 8.5, stroke=0, fill=1)
    pdf.setFont(FONT_BOLD, 7)
    pdf.setFillColor(WHITE)
    pdf.drawCentredString(inner_x + 9, y - 20, _pdf_text(question.get("number") or ""))

    status_color = GREEN if is_correct else MUTED if is_unanswered else RED
    pdf.setFillColor(WHITE)
    pdf.setStrokeColor(status_color)
    status_w = max(42, stringWidth(_pdf_text(status), FONT_BOLD, 7) + 18)
    status_x = x + content_width - status_w - 14
    pdf.roundRect(status_x, y - 23, status_w, 13, 4, fill=1, stroke=1)
    pdf.setFont(FONT_BOLD, 6.2)
    pdf.setFillColor(status_color)
    pdf.drawCentredString(status_x + status_w / 2, y - 19, _pdf_text(status))

    pdf.setFont(FONT_BOLD, 7.4)
    pdf.setFillColor(MUTED)
    pdf.drawString(inner_x + 26, y - 20, f"INTREBAREA {_pdf_text(question.get('number') or '')}")

    pdf.setFont(FONT_BOLD, 8.4)
    pdf.setFillColor(NAVY)
    question_lines = _wrap_lines(question.get("text") or "", inner_width, 8.6, FONT_BOLD)
    cursor_y = y - header_h - QUESTION_TEXT_TOP_GAP
    for line in question_lines:
        pdf.drawString(inner_x, cursor_y, _pdf_text(line))
        cursor_y -= QUESTION_TEXT_LEADING
    cursor_y -= QUESTION_AFTER_TEXT_GAP

    options = question.get("options") if isinstance(question.get("options"), dict) else {}
    option_keys = sorted(options.keys())
    option_width = inner_width
    selected = str(question.get("selected") or "")
    correct = str(question.get("correct") or "")
    for option_index, option_key in enumerate(option_keys):
        option_height = max(
            QUESTION_OPTION_MIN_HEIGHT,
            QUESTION_OPTION_VERTICAL_PADDING
            + len(_wrap_lines(options.get(option_key) or "", option_width - 34, 6.8)) * QUESTION_OPTION_LEADING,
        )
        _draw_option(pdf, option_key, str(options.get(option_key) or ""), inner_x, cursor_y, option_width, option_height, selected, correct)
        cursor_y -= option_height
        if option_index < len(option_keys) - 1:
            cursor_y -= QUESTION_OPTION_GAP

    explanation_lines = _format_explanation(question.get("explanation"))
    if explanation_lines:
        cursor_y -= QUESTION_AFTER_OPTIONS_GAP
        pdf.setFont(FONT_BOLD, 6.7)
        pdf.setFillColor(GOLD)
        pdf.drawString(inner_x, cursor_y, "Justificare")
        cursor_y -= QUESTION_EXPLANATION_TITLE_HEIGHT
        pdf.setFont(FONT_REGULAR, 6.4)
        pdf.setFillColor(TEXT)
        for explanation in explanation_lines:
            for line in _wrap_lines(explanation, inner_width, 6.7, FONT_REGULAR):
                pdf.drawString(inner_x, cursor_y, _pdf_text(line))
                cursor_y -= QUESTION_EXPLANATION_LINE_LEADING
            cursor_y -= QUESTION_EXPLANATION_ROW_GAP

    return y - height - QUESTION_CARD_GAP


def _draw_question_groups(pdf: canvas.Canvas, report: dict, y: float, state: dict) -> float:
    y = _draw_section_title(pdf, "REVIZUIREA RASPUNSURILOR", y)
    for group in _as_list(report.get("groups")):
        y = _ensure_page(pdf, state, y, 58)
        code = _pdf_text(group.get("code") or "")
        pdf.setFillColor(NAVY)
        pdf.circle(MARGIN + 16, y - 15, 12, stroke=0, fill=1)
        pdf.setFont(FONT_BOLD, 9)
        pdf.setFillColor(WHITE)
        pdf.drawCentredString(MARGIN + 16, y - 18, code)
        pdf.setFont(FONT_BOLD, 7)
        pdf.setFillColor(MUTED)
        range_label = f"Intrebarile {group.get('questionRange')}" if group.get("questionRange") else "Bloc de lucru"
        pdf.drawString(MARGIN + 38, y - 10, _pdf_text(range_label).upper())
        pdf.setFont("Times-Bold", 13)
        pdf.setFillColor(NAVY)
        pdf.drawString(MARGIN + 38, y - 26, _pdf_text(group.get("title") or "Cerinta"))
        y -= 42

        if group.get("sharedText"):
            shared_lines = _wrap_lines(str(group.get("sharedText") or ""), PAGE_W - MARGIN * 2 - 18, 7.2, FONT_REGULAR)
            box_height = max(24, 12 + len(shared_lines) * 9)
            y = _ensure_page(pdf, state, y, box_height + 8)
            pdf.setFillColor(WHITE)
            pdf.setStrokeColor(GOLD_SOFT)
            pdf.roundRect(MARGIN, y - box_height, PAGE_W - MARGIN * 2, box_height, 5, fill=1, stroke=1)
            pdf.setFont(FONT_REGULAR, 7.2)
            pdf.setFillColor(TEXT)
            for index, line in enumerate(shared_lines):
                pdf.drawString(MARGIN + 9, y - 13 - index * 9, _pdf_text(line))
            y -= box_height + 8

        for question in _as_list(group.get("questions")):
            y = _draw_question_card(pdf, question, y, state)
        y -= 8
    return y


def _draw_footer_brand(pdf: canvas.Canvas, y: float, state: dict) -> None:
    y = _ensure_page(pdf, state, y, 40)
    pdf.setStrokeColor(GOLD)
    pdf.line(MARGIN, y - 8, PAGE_W / 2 - 42, y - 8)
    pdf.line(PAGE_W / 2 + 42, y - 8, PAGE_W - MARGIN, y - 8)
    pdf.setFont(FONT_REGULAR, 9)
    pdf.setFillColor(GOLD)
    pdf.drawCentredString(PAGE_W / 2, y - 11, "made by Aletheia")


def _generate_pdf(report: dict, target) -> None:
    build_admitere_pdf_report(report, target)


def _current_user_display_name(current_user: dict) -> str:
    direct_name = current_user.get("display_name") or current_user.get("displayName")
    if direct_name:
        return str(direct_name).strip()
    return " ".join(
        str(part).strip()
        for part in [
            current_user.get("first_name") or current_user.get("firstName"),
            current_user.get("last_name") or current_user.get("lastName"),
        ]
        if part
    ).strip()


def _same_identity(left: str, right: str) -> bool:
    return _normalize_identity(left) == _normalize_identity(right)


def create_admitere_student_report(current_user: dict, report: dict) -> dict:
    _ensure_dirs()
    report_id = str(uuid.uuid4())
    submitted_at = report.get("finalizedAt") or _now_iso()
    student_name = report.get("studentName") or report.get("candidateName") or _current_user_display_name(current_user) or "Elev"
    score_percent = int(report.get("scorePercent") or report.get("percentage") or 0)
    correct_count = int(report.get("correctCount") or report.get("score") or 0)
    total_questions = int(report.get("totalQuestions") or 0)
    wrong_count = int(report.get("wrongCount") or max(total_questions - correct_count, 0))
    student_email = report.get("studentEmail") or report.get("student_email") or current_user.get("email") or ""

    payload = {
        **report,
        "id": report_id,
        "reportId": report_id,
        "testType": "admitere",
        "test_type": "admitere",
        "status": "submitted",
        "statusLabel": "Finalizat",
        "submittedAt": submitted_at,
        "submitted_at": submitted_at,
        "studentName": student_name,
        "student_name": student_name,
        "candidateName": report.get("candidateName") or student_name,
        "studentFirstName": current_user.get("first_name", ""),
        "student_first_name": current_user.get("first_name", ""),
        "studentLastName": current_user.get("last_name", ""),
        "student_last_name": current_user.get("last_name", ""),
        "studentEmail": student_email,
        "student_email": student_email,
        "testTitle": report.get("testTitle") or "Test Admitere",
        "test_title": report.get("testTitle") or "Test Admitere",
        "reportTitle": report.get("reportTitle") or ADMITERE_REPORT_TITLE,
        "report_title": report.get("reportTitle") or ADMITERE_REPORT_TITLE,
        "reportFooterLabel": report.get("reportFooterLabel") or "teste admitere",
        "report_footer_label": report.get("reportFooterLabel") or "teste admitere",
        "reportBackgroundColor": report.get("reportBackgroundColor") or ADMITERE_PAGE_BG_HEX,
        "report_background_color": report.get("reportBackgroundColor") or ADMITERE_PAGE_BG_HEX,
        "scorePercent": score_percent,
        "score_percentage": score_percent,
        "correctCount": correct_count,
        "correct_count": correct_count,
        "wrongCount": wrong_count,
        "wrong_count": wrong_count,
        "durationSeconds": int(report.get("durationSeconds") or 0),
        "duration_seconds": int(report.get("durationSeconds") or 0),
        "uniqueCode": report_id,
        "unique_code": report_id,
    }
    json_path = REPORT_JSON_DIR / f"{report_id}.json"
    download_name = build_admitere_student_report_filename(payload)
    payload["reportJsonPath"] = str(json_path)
    payload["report_json_path"] = str(json_path)
    payload["reportTemplate"] = REPORT_TEMPLATE
    payload["report_template"] = REPORT_TEMPLATE
    payload["reportTemplateVersion"] = REPORT_TEMPLATE_VERSION
    payload["report_template_version"] = REPORT_TEMPLATE_VERSION
    payload["reportPdfFileName"] = download_name
    payload["report_pdf_file_name"] = download_name
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def list_admitere_student_reports(current_user: dict) -> list[dict]:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Doar adminul poate vedea rapoartele Admitere.")
    _ensure_dirs()
    reports = []
    for path in REPORT_JSON_DIR.glob("*.json"):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        reports.append(payload)
    return sorted(reports, key=lambda entry: entry.get("submittedAt") or "", reverse=True)


def get_admitere_student_report(current_user: dict, report_id: str) -> dict:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Doar adminul poate accesa rapoartele Admitere.")
    path = REPORT_JSON_DIR / f"{report_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Raportul Admitere nu exista.")
    return json.loads(path.read_text(encoding="utf-8"))


def get_admitere_student_report_for_user(current_user: dict, report_id: str) -> dict:
    path = REPORT_JSON_DIR / f"{report_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Raportul Admitere nu exista.")
    report = json.loads(path.read_text(encoding="utf-8"))
    if current_user.get("role") in {"admin", "teacher"}:
        return report

    current_name = _current_user_display_name(current_user)
    report_names = [
        report.get("studentName") or report.get("student_name") or "",
        " ".join(
            str(part).strip()
            for part in [
                report.get("studentFirstName") or report.get("student_first_name"),
                report.get("studentLastName") or report.get("student_last_name"),
            ]
            if part
        ).strip(),
    ]
    if current_name and any(_same_identity(current_name, report_name) for report_name in report_names if report_name):
        return report
    raise HTTPException(status_code=403, detail="Poti descarca doar raportul tau de Admitere.")


def build_admitere_student_report_filename(report: dict) -> str:
    student = _safe_component(report.get("studentName") or report.get("student_name") or "elev")
    test = _safe_component(report.get("testTitle") or report.get("test_title") or "test_admitere")
    report_id = _safe_component(report.get("id") or report.get("reportId") or "raport")
    return f"raport_admitere_{student}_{test}_{report_id}.pdf"


def generate_admitere_student_report_pdf_bytes(report: dict) -> bytes:
    buffer = BytesIO()
    _generate_pdf(report, buffer)
    return buffer.getvalue()


def write_aletheia_report_pdf(report: dict, output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    buffer = BytesIO()
    _generate_pdf(report, buffer)
    output_path.write_bytes(buffer.getvalue())
    return output_path


def generate_admitere_student_report_pdf(current_user: dict, report_id: str) -> tuple[dict, bytes, str]:
    report = get_admitere_student_report(current_user, report_id)
    filename = report.get("reportPdfFileName") or report.get("report_pdf_file_name") or build_admitere_student_report_filename(report)
    return report, generate_admitere_student_report_pdf_bytes(report), filename


def generate_admitere_student_report_pdf_for_user(current_user: dict, report_id: str) -> tuple[dict, bytes, str]:
    report = get_admitere_student_report_for_user(current_user, report_id)
    filename = report.get("reportPdfFileName") or report.get("report_pdf_file_name") or build_admitere_student_report_filename(report)
    return report, generate_admitere_student_report_pdf_bytes(report), filename
