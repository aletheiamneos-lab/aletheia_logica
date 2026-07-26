from __future__ import annotations

import math
import re
import unicodedata
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


PAGE_W, PAGE_H = A4
MM = 72 / 25.4
MARGIN = 10 * MM
FOOTER_H = 14 * MM
CONTENT_BOTTOM = FOOTER_H + 8 * MM

TEAL = HexColor("#0B665F")
TEAL_DARK = HexColor("#084D49")
INK = HexColor("#103F3D")
TEXT = HexColor("#17353A")
MUTED = HexColor("#68716F")
LINE = HexColor("#DCE2DF")
GRID = HexColor("#D7DEDB")
SUCCESS = HexColor("#178451")
SUCCESS_BG = HexColor("#F5FBF7")
DANGER = HexColor("#E2483E")
DANGER_BG = HexColor("#FFF7F6")
UNANSWERED = HexColor("#7A7A7A")
UNANSWERED_BG = HexColor("#FAFAFA")
WHITE = colors.white

ZONE_ACCENT_HEX = [
    "#0B665F",
    "#E77716",
    "#2C7FC1",
    "#7351B6",
    "#C92439",
    "#2D8C8C",
    "#B36B32",
    "#4968A6",
    "#8B5A8C",
    "#8F3145",
]
ZONE_ACCENTS = [HexColor(value) for value in ZONE_ACCENT_HEX]

INTRO_TEXT = (
    "Raportul afișează doar rezultatul elevului. Pentru itemii greșiți apare varianta corectă, "
    "fără explicații sau rezolvare profesor."
)


def _resolve_fonts() -> tuple[str, str]:
    candidates = [
        (
            Path("C:/Windows/Fonts/georgia.ttf"),
            Path("C:/Windows/Fonts/georgiab.ttf"),
            "LogicaAdmitere-Georgia",
        ),
        (
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"),
            "LogicaAdmitere-DejaVuSerif",
        ),
        (
            Path("C:/Windows/Fonts/arial.ttf"),
            Path("C:/Windows/Fonts/arialbd.ttf"),
            "LogicaAdmitere-Arial",
        ),
    ]
    for regular_path, bold_path, family in candidates:
        if not regular_path.exists() or not bold_path.exists():
            continue
        regular_name = f"{family}-Regular"
        bold_name = f"{family}-Bold"
        try:
            if regular_name not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont(regular_name, str(regular_path)))
            if bold_name not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont(bold_name, str(bold_path)))
            return regular_name, bold_name
        except Exception:
            continue
    return "Helvetica", "Helvetica-Bold"


FONT_REGULAR, FONT_BOLD = _resolve_fonts()


def _clean(value) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\n", " ").replace("\r", " ")).strip()


def _identity(value) -> str:
    return "".join(
        char
        for char in unicodedata.normalize("NFD", _clean(value).lower())
        if unicodedata.category(char) != "Mn"
    )


def _coerce_int(value, fallback: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _clamp_percentage(value) -> int:
    try:
        numeric = int(round(float(value)))
    except (TypeError, ValueError):
        return 0
    return max(0, min(100, numeric))


def _format_duration(seconds) -> str:
    total = max(_coerce_int(seconds), 0)
    hours, remainder = divmod(total, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


def _format_date(report: dict) -> str:
    direct = _clean(report.get("date") or report.get("testDate") or report.get("test_date"))
    if direct:
        return direct
    raw = report.get("finalizedAt") or report.get("submittedAt") or report.get("submitted_at")
    if not raw:
        return "-"
    try:
        parsed = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
        return parsed.strftime("%d.%m.%Y")
    except ValueError:
        return str(raw)[:10]


def _performance_label(percentage: int) -> str:
    if percentage <= 20:
        return "Început"
    if percentage <= 50:
        return "În dezvoltare"
    if percentage <= 79:
        return "Bine"
    if percentage <= 99:
        return "Foarte bine"
    return "Excelent"


def _valid_hex(value, fallback: colors.Color) -> colors.Color:
    raw = str(value or "").strip()
    return HexColor(raw) if re.fullmatch(r"#[0-9A-Fa-f]{6}", raw) else fallback


def _split_long_word(word: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    chunks: list[str] = []
    current = ""
    for character in word:
        candidate = current + character
        if current and pdfmetrics.stringWidth(candidate, font_name, font_size) > max_width:
            chunks.append(current)
            current = character
        else:
            current = candidate
    if current:
        chunks.append(current)
    return chunks or [word]


def _wrap(text: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    words = _clean(text).split()
    if not words:
        return [""]
    lines: list[str] = []
    current = ""
    for original_word in words:
        word_parts = (
            _split_long_word(original_word, font_name, font_size, max_width)
            if pdfmetrics.stringWidth(original_word, font_name, font_size) > max_width
            else [original_word]
        )
        for word in word_parts:
            candidate = f"{current} {word}".strip()
            if current and pdfmetrics.stringWidth(candidate, font_name, font_size) > max_width:
                lines.append(current)
                current = word
            else:
                current = candidate
    if current:
        lines.append(current)
    return lines


def _draw_lines(
    pdf: canvas.Canvas,
    lines: list[str],
    x: float,
    y: float,
    font_name: str,
    font_size: float,
    leading: float,
    color=TEXT,
) -> float:
    pdf.setFont(font_name, font_size)
    pdf.setFillColor(color)
    for line in lines:
        pdf.drawString(x, y, line)
        y -= leading
    return y


def _draw_justified(
    pdf: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    font_size: float,
    leading: float,
) -> float:
    lines = _wrap(text, FONT_REGULAR, font_size, width)
    pdf.setFont(FONT_REGULAR, font_size)
    pdf.setFillColor(TEXT)
    for index, line in enumerate(lines):
        words = line.split()
        last_line = index == len(lines) - 1
        natural_width = pdfmetrics.stringWidth(line, FONT_REGULAR, font_size)
        extra_space = (width - natural_width) / max(len(words) - 1, 1)
        if last_line or len(words) < 3 or extra_space > 2.8:
            pdf.drawString(x, y, line)
        else:
            text_object = pdf.beginText(x, y)
            text_object.setFont(FONT_REGULAR, font_size)
            text_object.setFillColor(TEXT)
            text_object.setWordSpace(extra_space)
            text_object.textLine(line)
            pdf.drawText(text_object)
        y -= leading
    return y


def _answer_keys(value) -> list[str]:
    if isinstance(value, (list, tuple, set)):
        raw_values = list(value)
    else:
        raw_values = re.split(r"[+,;/\s]+", str(value or ""))
    keys: list[str] = []
    for raw_value in raw_values:
        key = _clean(raw_value).upper()
        if key and key not in keys:
            keys.append(key)
    return keys


def _normalize_options(options) -> list[dict]:
    rows: list[dict] = []
    if isinstance(options, dict):
        iterable = options.items()
    elif isinstance(options, list):
        iterable = [
            (
                option.get("key") or option.get("id") or option.get("value") or chr(65 + index),
                option.get("label") or option.get("text") or option.get("value") or "",
            )
            if isinstance(option, dict)
            else (chr(65 + index), option)
            for index, option in enumerate(options)
        ]
    else:
        iterable = []
    for key, label in iterable:
        normalized_key = _clean(key).upper()
        if normalized_key:
            rows.append({"key": normalized_key, "label": _clean(label)})
    return rows


def _question_view(question: dict, fallback_number: int) -> dict:
    selected_keys = _answer_keys(
        question.get("selected")
        or question.get("student_answer")
        or question.get("studentAnswer")
        or question.get("selectedAnswer")
    )
    correct_keys = _answer_keys(
        question.get("correct")
        or question.get("correct_answer")
        or question.get("correctAnswer")
    )
    status_identity = _identity(question.get("status"))
    is_answered = bool(selected_keys)
    if "fara raspuns" in status_identity or "necompletat" in status_identity:
        is_answered = False
    is_correct = "corect" in status_identity and "incorect" not in status_identity
    if "gres" in status_identity:
        is_correct = False
    if not status_identity and is_answered and correct_keys:
        is_correct = selected_keys == correct_keys

    options = _normalize_options(question.get("options") or question.get("option_rows"))
    selected_set = set(selected_keys)
    correct_set = set(correct_keys)
    for option in options:
        option["is_selected"] = option["key"] in selected_set
        option["is_correct"] = option["key"] in correct_set

    return {
        "number": question.get("number") or question.get("index") or fallback_number,
        "text": _clean(question.get("text") or question.get("question_text") or "Întrebare fără text"),
        "options": options,
        "selected_keys": selected_keys,
        "correct_keys": correct_keys,
        "selected_answer": " + ".join(selected_keys) if selected_keys else "—",
        "correct_answer": " + ".join(correct_keys) if correct_keys else "—",
        "is_answered": is_answered,
        "is_correct": is_correct,
        "explanation": question.get("explanation") or question.get("justification"),
    }


def _question_numbers_label(questions: list[dict]) -> str:
    numbers = [question.get("number") for question in questions]
    numeric_values: list[int] = []
    for number in numbers:
        try:
            numeric_values.append(int(number))
        except (TypeError, ValueError):
            numeric_values = []
            break
    if numeric_values and len(numeric_values) == len(numbers):
        consecutive = all(
            current == previous + 1
            for previous, current in zip(numeric_values, numeric_values[1:])
        )
        if consecutive:
            return (
                str(numeric_values[0])
                if len(numeric_values) == 1
                else f"{numeric_values[0]}–{numeric_values[-1]}"
            )
    compact = ", ".join(_clean(number) for number in numbers if _clean(number))
    return compact if len(compact) <= 48 else f"{len(questions)} întrebări"


def _normalize_report(source: dict) -> dict:
    raw_groups = source.get("groups") or source.get("zones") or source.get("review_sections") or []
    if not isinstance(raw_groups, list):
        raw_groups = []

    if not raw_groups:
        raw_questions = source.get("questions") if isinstance(source.get("questions"), list) else []
        grouped: dict[str, list] = {}
        for question in raw_questions:
            if not isinstance(question, dict):
                continue
            code = _clean(
                question.get("section")
                or question.get("zone")
                or question.get("zoneCode")
                or question.get("zone_code")
                or "C1"
            )
            grouped.setdefault(code, []).append(question)
        raw_groups = [
            {"code": code, "title": code, "questions": questions}
            for code, questions in grouped.items()
        ]

    groups: list[dict] = []
    question_position = 1
    for group_index, raw_group in enumerate(raw_groups):
        if not isinstance(raw_group, dict):
            continue
        raw_questions = raw_group.get("questions") or []
        questions = []
        for raw_question in raw_questions if isinstance(raw_questions, list) else []:
            if not isinstance(raw_question, dict):
                continue
            questions.append(_question_view(raw_question, question_position))
            question_position += 1
        if not questions:
            continue

        explicit_code = (
            raw_group.get("code")
            or raw_group.get("zoneCode")
            or raw_group.get("zone_code")
        )
        section_code = next(
            (
                raw_question.get("section")
                for raw_question in raw_questions
                if isinstance(raw_question, dict) and raw_question.get("section")
            ),
            None,
        )
        code = _clean(explicit_code or section_code or f"C{group_index + 1}")
        title = _clean(
            raw_group.get("title")
            or raw_group.get("label")
            or raw_group.get("name")
            or f"Cerința {group_index + 1}"
        )
        correct_count = sum(1 for question in questions if question["is_correct"])
        total = len(questions)
        accent = _valid_hex(
            raw_group.get("accent") or raw_group.get("color"),
            ZONE_ACCENTS[group_index % len(ZONE_ACCENTS)],
        )
        groups.append(
            {
                "code": code,
                "title": title,
                "shared_text": _clean(
                    raw_group.get("sharedText")
                    or raw_group.get("shared_text")
                    or raw_group.get("intro_text")
                ),
                "questions": questions,
                "correct": correct_count,
                "total": total,
                "percent": round((correct_count / total) * 100) if total else 0,
                "accent": accent,
                "numbers_label": _question_numbers_label(questions),
            }
        )

    questions = [question for group in groups for question in group["questions"]]
    derived_total = len(questions)
    derived_correct = sum(1 for question in questions if question["is_correct"])
    total = _coerce_int(
        source.get("totalQuestions")
        or source.get("total_questions")
        or source.get("question_count"),
        derived_total,
    )
    correct = _coerce_int(
        source.get("correctCount")
        or source.get("correct_count")
        or source.get("score"),
        derived_correct,
    )
    percentage_source = (
        source.get("scorePercent")
        if source.get("scorePercent") is not None
        else source.get("score_percentage")
        if source.get("score_percentage") is not None
        else source.get("percentage")
    )
    percentage = (
        _clamp_percentage(percentage_source)
        if percentage_source is not None
        else round((correct / total) * 100) if total else 0
    )
    duration = _clean(source.get("duration") or source.get("completion_time"))
    if not re.fullmatch(r"\d{1,3}:\d{2}:\d{2}", duration):
        duration = _format_duration(
            source.get("durationSeconds")
            or source.get("duration_seconds")
        )

    return {
        "student_name": _clean(
            source.get("studentName")
            or source.get("student_name")
            or source.get("candidateName")
            or source.get("candidate_name")
            or "Candidat"
        ),
        "test_title": _clean(
            source.get("testTitle")
            or source.get("test_title")
            or source.get("examTitle")
            or source.get("exam_title")
            or "Test de admitere"
        ),
        "date": _format_date(source),
        "duration": duration,
        "total": total,
        "correct": correct,
        "percentage": percentage,
        "performance": _clean(
            source.get("performanceLabel")
            or source.get("performance_label")
            or _performance_label(percentage)
        ),
        "groups": groups,
        "questions": questions,
    }


def _draw_header(pdf: canvas.Canvas, compact: bool = False) -> float:
    top_y = PAGE_H - 11 * MM
    pdf.setFillColor(TEAL_DARK)
    pdf.setFont(FONT_BOLD, 19 if compact else 26)
    pdf.drawString(MARGIN, top_y, "Logica")
    pdf.setFont(FONT_REGULAR, 8.5 if compact else 10.5)
    pdf.drawString(MARGIN, top_y - (4.7 if compact else 5.8) * MM, "by Aletheia")
    pdf.setFont(FONT_BOLD, 8.2)
    pdf.drawRightString(PAGE_W - MARGIN, top_y - 0.5 * MM, "TEST DE ADMITERE")
    rule_y = top_y - (8.2 if compact else 9.5) * MM
    pdf.setStrokeColor(TEAL_DARK)
    pdf.setLineWidth(0.7)
    pdf.line(MARGIN, rule_y, PAGE_W - MARGIN, rule_y)
    return rule_y


def _draw_footer(pdf: canvas.Canvas, page_number: int, page_count: int) -> None:
    pdf.setFillColor(TEAL_DARK)
    pdf.rect(0, 0, PAGE_W, FOOTER_H, fill=1, stroke=0)
    pdf.setFillColor(WHITE)
    pdf.setFont(FONT_BOLD, 9.5)
    pdf.drawString(MARGIN, 5.1 * MM, "Aletheia")
    brand_width = pdfmetrics.stringWidth("Aletheia", FONT_BOLD, 9.5)
    divider_x = MARGIN + brand_width + 5 * MM
    pdf.setStrokeColor(colors.Color(1, 1, 1, alpha=0.65))
    pdf.setLineWidth(0.5)
    pdf.line(divider_x, 3.4 * MM, divider_x, 10.6 * MM)
    pdf.setFillColor(WHITE)
    pdf.setFont(FONT_REGULAR, 8.3)
    pdf.drawString(divider_x + 5 * MM, 5.2 * MM, "Excelență prin evaluare")
    pdf.drawRightString(PAGE_W - MARGIN, 5.2 * MM, f"Pagina {page_number} din {page_count}")


def _draw_score_ring(
    pdf: canvas.Canvas,
    center_x: float,
    center_y: float,
    radius: float,
    score: int,
) -> None:
    pdf.setStrokeColor(HexColor("#E5E7E5"))
    pdf.setLineWidth(7.5)
    pdf.circle(center_x, center_y, radius, fill=0, stroke=1)
    if score > 0:
        pdf.setStrokeColor(TEAL)
        pdf.setLineCap(1)
        pdf.arc(
            center_x - radius,
            center_y - radius,
            center_x + radius,
            center_y + radius,
            90,
            -360 * min(max(score, 0), 100) / 100,
        )
        pdf.setLineCap(0)
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 19)
    pdf.drawCentredString(center_x, center_y - 6, f"{score}%")


def _draw_radar(
    pdf: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    height: float,
    groups: list[dict],
) -> None:
    if not groups:
        return
    axis_count = len(groups)
    center_x = x + width * 0.5
    center_y = y + height * 0.47
    radius = min(width, height) * (0.29 if axis_count > 6 else 0.32)

    def point(index: int, scale: float) -> tuple[float, float]:
        angle = math.pi / 2 - (2 * math.pi * index / axis_count)
        return (
            center_x + radius * scale * math.cos(angle),
            center_y + radius * scale * math.sin(angle),
        )

    pdf.setLineWidth(0.35)
    pdf.setStrokeColor(GRID)
    if axis_count >= 3:
        for level in (0.25, 0.5, 0.75, 1):
            grid_points = [point(index, level) for index in range(axis_count)]
            path = pdf.beginPath()
            path.moveTo(*grid_points[0])
            for grid_point in grid_points[1:]:
                path.lineTo(*grid_point)
            path.close()
            pdf.drawPath(path, stroke=1, fill=0)
    for index in range(axis_count):
        pdf.line(center_x, center_y, *point(index, 1))

    label_size = 6.3 if axis_count > 6 else 7
    for index, group in enumerate(groups):
        label_x, label_y = point(index, 1.22 if axis_count > 6 else 1.28)
        pdf.setFillColor(TEXT)
        pdf.setFont(FONT_BOLD, label_size)
        pdf.drawCentredString(label_x, label_y + 1, group["code"])
        if axis_count <= 6:
            short_title = group["title"] if len(group["title"]) <= 20 else f"{group['title'][:18]}…"
            pdf.setFont(FONT_REGULAR, 5.8)
            pdf.drawCentredString(label_x, label_y - 6, short_title)

    pdf.setFillColor(MUTED)
    pdf.setFont(FONT_REGULAR, 5.6)
    pdf.drawString(center_x + 3, center_y - 2, "0%")
    for level in (0.25, 0.5, 0.75, 1):
        level_x, level_y = point(0, level)
        pdf.drawString(level_x + 3, level_y - 2, f"{round(level * 100)}%")

    values = [
        point(index, max(0, min(100, group["percent"])) / 100)
        for index, group in enumerate(groups)
    ]
    pdf.setStrokeColor(TEAL)
    pdf.setLineWidth(1.5)
    if len(values) >= 3:
        polygon = pdf.beginPath()
        polygon.moveTo(*values[0])
        for value_point in values[1:]:
            polygon.lineTo(*value_point)
        polygon.close()
        pdf.setFillColor(colors.Color(11 / 255, 102 / 255, 95 / 255, alpha=0.24))
        pdf.drawPath(polygon, stroke=1, fill=1)
    elif len(values) == 2:
        pdf.line(*values[0], *values[1])
    pdf.setFillColor(TEAL)
    for value_x, value_y in values:
        pdf.circle(value_x, value_y, 2.1, fill=1, stroke=0)


def _status_style(question: dict) -> tuple[str, colors.Color, colors.Color]:
    if question["is_correct"]:
        return "CORECT", SUCCESS, SUCCESS_BG
    if question["is_answered"]:
        return "GREȘIT", DANGER, DANGER_BG
    return "FĂRĂ RĂSPUNS", UNANSWERED, UNANSWERED_BG


def _draw_status_pill(
    pdf: canvas.Canvas,
    question: dict,
    right_x: float,
    center_y: float,
    font_size: float = 6.5,
) -> None:
    label, color, background = _status_style(question)
    width = max(48, pdfmetrics.stringWidth(label, FONT_BOLD, font_size) + 14)
    height = 15
    pdf.setFillColor(background)
    pdf.setStrokeColor(color)
    pdf.setLineWidth(0.45)
    pdf.roundRect(right_x - width, center_y - height / 2, width, height, height / 2, fill=1, stroke=1)
    pdf.setFillColor(color)
    pdf.setFont(FONT_BOLD, font_size)
    pdf.drawCentredString(right_x - width / 2, center_y - 2.2, label)


def _draw_overview_rows(
    pdf: canvas.Canvas,
    groups: list[dict],
    top_y: float,
    max_rows: int | None = None,
) -> float:
    visible_groups = groups[:max_rows] if max_rows else groups
    row_h = 8.1 * MM
    y = top_y
    for group in visible_groups:
        bottom = y - row_h
        pdf.setStrokeColor(LINE)
        pdf.setLineWidth(0.45)
        pdf.roundRect(MARGIN, bottom, PAGE_W - 2 * MARGIN, row_h, 3, fill=0, stroke=1)
        badge_size = 7 * MM
        badge_x = MARGIN + 2.2 * MM
        badge_y = bottom + (row_h - badge_size) / 2
        pdf.setFillColor(group["accent"])
        pdf.roundRect(badge_x, badge_y, badge_size, badge_size, 2, fill=1, stroke=0)
        pdf.setFillColor(WHITE)
        pdf.setFont(FONT_BOLD, 8.5)
        pdf.drawCentredString(badge_x + badge_size / 2, badge_y + 6.7, group["code"])

        text_x = badge_x + badge_size + 3.2 * MM
        pdf.setFillColor(TEXT)
        pdf.setFont(FONT_BOLD, 7.1)
        pdf.drawString(text_x, bottom + 5 * MM, f"BLOC DE LUCRU – {group['title'].upper()}")
        pdf.setFillColor(MUTED)
        pdf.setFont(FONT_REGULAR, 6.4)
        question_label = (
            f"Întrebările {group['numbers_label']}"
            if group["numbers_label"] and not group["numbers_label"].endswith("întrebări")
            else f"{group['total']} întrebări"
        )
        pdf.drawString(text_x, bottom + 2.2 * MM, question_label)

        fraction_x = PAGE_W - MARGIN - 62 * MM
        percent_x = PAGE_W - MARGIN - 39 * MM
        pdf.setFillColor(TEXT)
        pdf.setFont(FONT_REGULAR, 8)
        pdf.drawCentredString(fraction_x, bottom + 3.9 * MM, f"{group['correct']} / {group['total']}")
        pdf.drawCentredString(percent_x, bottom + 3.9 * MM, f"{group['percent']}%")

        pill_right = PAGE_W - MARGIN - 4 * MM
        pill_width = 25 * MM
        pdf.setFillColor(SUCCESS_BG if group["correct"] else DANGER_BG)
        pdf.setStrokeColor(SUCCESS if group["correct"] else LINE)
        pdf.roundRect(
            pill_right - pill_width,
            bottom + 1.9 * MM,
            pill_width,
            4.6 * MM,
            3,
            fill=1,
            stroke=0,
        )
        pdf.setFillColor(SUCCESS if group["correct"] else DANGER)
        pdf.setFont(FONT_BOLD, 6.2)
        pdf.drawCentredString(
            pill_right - pill_width / 2,
            bottom + 3.45 * MM,
            f"{group['correct']} CORECTE",
        )
        y = bottom
    return y


def _draw_summary_page(
    pdf: canvas.Canvas,
    report: dict,
    page_count: int,
    overview_limit: int,
) -> None:
    header_y = _draw_header(pdf)
    title_y = header_y - 15 * MM
    pdf.setFillColor(INK)
    pdf.setFont(FONT_BOLD, 18)
    pdf.drawCentredString(PAGE_W / 2, title_y, "RAPORT FINALIZARE TEST")
    pdf.setFillColor(TEXT)
    title_lines = _wrap(report["test_title"], FONT_REGULAR, 11.2, 150 * MM)[:2]
    title_baseline = title_y - 7 * MM
    for line_index, line in enumerate(title_lines):
        pdf.setFont(FONT_REGULAR, 11.2)
        pdf.drawCentredString(PAGE_W / 2, title_baseline - line_index * 12, line)
    ornament_y = title_baseline - len(title_lines) * 4.4 * MM
    pdf.setStrokeColor(TEAL)
    pdf.setLineWidth(0.55)
    pdf.line(PAGE_W / 2 - 14 * MM, ornament_y, PAGE_W / 2 + 14 * MM, ornament_y)
    pdf.setFillColor(TEAL)
    diamond = pdf.beginPath()
    diamond.moveTo(PAGE_W / 2, ornament_y + 3)
    diamond.lineTo(PAGE_W / 2 + 3, ornament_y)
    diamond.lineTo(PAGE_W / 2, ornament_y - 3)
    diamond.lineTo(PAGE_W / 2 - 3, ornament_y)
    diamond.close()
    pdf.drawPath(diamond, fill=1, stroke=0)

    meta_y = ornament_y - 12 * MM
    label_x = MARGIN
    value_x = MARGIN + 34 * MM
    meta_items = [
        ("Nume candidat:", report["student_name"]),
        ("Data susținerii:", report["date"]),
        ("Număr întrebări:", str(report["total"])),
    ]
    for row_index, (label, value) in enumerate(meta_items):
        row_y = meta_y - row_index * 7 * MM
        pdf.setFillColor(TEXT)
        pdf.setFont(FONT_BOLD, 8.8)
        pdf.drawString(label_x, row_y, label)
        pdf.setFillColor(INK)
        pdf.setFont(FONT_REGULAR, 8.8)
        pdf.drawString(value_x, row_y, value)

    intro_x = PAGE_W - MARGIN - 76 * MM
    _draw_justified(pdf, INTRO_TEXT, intro_x, meta_y, 76 * MM, 8.2, 12)

    kpi_top = meta_y - 27 * MM
    kpi_bottom = kpi_top - 34 * MM
    kpi_width = (PAGE_W - 2 * MARGIN) / 4
    for index in range(1, 4):
        divider_x = MARGIN + index * kpi_width
        pdf.setStrokeColor(LINE)
        pdf.setLineWidth(0.55)
        pdf.line(divider_x, kpi_bottom + 3 * MM, divider_x, kpi_top - 3 * MM)
    centers = [MARGIN + (index + 0.5) * kpi_width for index in range(4)]

    _draw_score_ring(pdf, centers[0], (kpi_top + kpi_bottom) / 2 + 4 * MM, 12 * MM, report["percentage"])
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 7.1)
    pdf.drawCentredString(centers[0], kpi_bottom + 2.5 * MM, "SCOR OBȚINUT")

    pdf.setFillColor(TEAL_DARK)
    pdf.setFont(FONT_BOLD, 21)
    pdf.drawCentredString(
        centers[1],
        (kpi_top + kpi_bottom) / 2 + 2 * MM,
        f"{report['correct']} / {report['total']}",
    )
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 6.8)
    pdf.drawCentredString(centers[1], kpi_bottom + 4.3 * MM, "RĂSPUNSURI")
    pdf.drawCentredString(centers[1], kpi_bottom + 1.2 * MM, "CORECTE")

    pdf.setFillColor(TEAL_DARK)
    performance_size = 11.5 if len(report["performance"]) > 14 else 13
    pdf.setFont(FONT_BOLD, performance_size)
    pdf.drawCentredString(
        centers[2],
        (kpi_top + kpi_bottom) / 2 + 2 * MM,
        report["performance"],
    )
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 7.1)
    pdf.drawCentredString(centers[2], kpi_bottom + 2.5 * MM, "PERFORMANȚĂ")

    clock_center_y = (kpi_top + kpi_bottom) / 2 + 7 * MM
    pdf.setStrokeColor(TEXT)
    pdf.setLineWidth(1.2)
    pdf.circle(centers[3], clock_center_y, 4.2 * MM, fill=0, stroke=1)
    pdf.line(centers[3], clock_center_y, centers[3], clock_center_y + 2.4 * MM)
    pdf.line(centers[3], clock_center_y, centers[3] + 2.1 * MM, clock_center_y - 1.4 * MM)
    pdf.setFillColor(TEAL_DARK)
    pdf.setFont(FONT_BOLD, 13)
    pdf.drawCentredString(centers[3], clock_center_y - 10 * MM, report["duration"])
    pdf.setFillColor(TEXT)
    pdf.setFont(FONT_BOLD, 7.1)
    pdf.drawCentredString(centers[3], kpi_bottom + 2.5 * MM, "TIMP COMPLETARE")

    section_y = kpi_bottom - 8 * MM
    pdf.setFillColor(INK)
    pdf.setFont(FONT_BOLD, 13.5)
    pdf.drawString(MARGIN, section_y, "PERFORMANȚĂ PE ZONE")
    performance_bottom = section_y - 55 * MM
    radar_width = 82 * MM
    _draw_radar(pdf, MARGIN, performance_bottom, radar_width, 51 * MM, report["groups"])

    table_x = MARGIN + 94 * MM
    table_right = PAGE_W - MARGIN
    table_y = section_y - 7 * MM
    pdf.setFillColor(TEAL_DARK)
    pdf.setFont(FONT_BOLD, 7)
    pdf.drawString(table_x, table_y, "ZONĂ")
    pdf.drawRightString(table_right - 19 * MM, table_y, "CORECTE")
    pdf.drawRightString(table_right, table_y, "%")
    group_count = max(len(report["groups"]), 1)
    row_step_mm = min(8.2, max(5.1, 41 / group_count))
    row_font = 7.1 if group_count > 7 else 8.1
    table_y -= 6.8 * MM
    for group in report["groups"]:
        pdf.setFillColor(group["accent"])
        pdf.circle(table_x + 2.2, table_y + 2.4, 2.4, fill=1, stroke=0)
        pdf.setFillColor(TEXT)
        pdf.setFont(FONT_REGULAR, row_font)
        label = f"{group['code']}  {group['title']}"
        label_lines = _wrap(label, FONT_REGULAR, row_font, 42 * MM)
        pdf.drawString(table_x + 8, table_y, label_lines[0])
        pdf.drawRightString(table_right - 19 * MM, table_y, f"{group['correct']} / {group['total']}")
        pdf.drawRightString(table_right, table_y, f"{group['percent']}%")
        pdf.setStrokeColor(LINE)
        pdf.setLineWidth(0.35)
        pdf.line(table_x, table_y - 2.7 * MM, table_right, table_y - 2.7 * MM)
        table_y -= row_step_mm * MM

    review_y = performance_bottom - 2 * MM
    pdf.setFillColor(INK)
    pdf.setFont(FONT_BOLD, 13)
    pdf.drawString(MARGIN, review_y, "REVIZUIREA RĂSPUNSURILOR")
    _draw_overview_rows(pdf, report["groups"], review_y - 5 * MM, overview_limit)
    _draw_footer(pdf, 1, page_count)


def _draw_overview_continuation(
    pdf: canvas.Canvas,
    groups: list[dict],
    page_number: int,
    page_count: int,
) -> None:
    header_y = _draw_header(pdf, compact=True)
    title_y = header_y - 10 * MM
    pdf.setFillColor(INK)
    pdf.setFont(FONT_BOLD, 14)
    pdf.drawString(MARGIN, title_y, "REVIZUIREA RĂSPUNSURILOR")
    _draw_overview_rows(pdf, groups, title_y - 6 * MM)
    _draw_footer(pdf, page_number, page_count)


def _explanation_rows(explanation) -> list[str]:
    if isinstance(explanation, dict):
        keys = [
            ("step1", "Pasul 1"),
            ("step2", "Pasul 2"),
            ("step3", "Pasul 3"),
            ("conclusion", "Concluzie"),
        ]
        rows = [
            f"{label}: {_clean(explanation.get(key))}"
            for key, label in keys
            if _clean(explanation.get(key))
        ]
        known_keys = {key for key, _label in keys}
        rows.extend(
            f"{_clean(key)}: {_clean(value)}"
            for key, value in explanation.items()
            if key not in known_keys and _clean(value)
        )
        return rows
    if isinstance(explanation, list):
        return [_clean(row) for row in explanation if _clean(row)]
    return [_clean(explanation)] if _clean(explanation) else []


def _explanation_block_height(explanation_rows: list[list[str]]) -> float:
    if not explanation_rows:
        return 0
    return 10 + sum(len(lines) * 8 + 2 for lines in explanation_rows)


def _prepare_question(question: dict, available_width: float) -> dict:
    question_x_offset = 13 * MM
    question_width = available_width - question_x_offset - 29 * MM
    content_width = available_width - question_x_offset - 5 * MM
    question_lines = _wrap(question["text"], FONT_REGULAR, 8.1, question_width)
    option_rows = []
    for option in question["options"]:
        option_font = FONT_BOLD if option["is_correct"] else FONT_REGULAR
        option_lines = _wrap(
            f"{option['key']}. {option['label']}",
            option_font,
            7.35,
            content_width,
        )
        option_rows.append({**option, "lines": option_lines})

    feedback_lines = _wrap(
        f"Răspuns elev: {question['selected_answer']}",
        FONT_REGULAR,
        7.4,
        content_width,
    )
    correct_feedback_lines = []
    if not question["is_correct"]:
        correct_feedback_lines = _wrap(
            f"Varianta corectă: {question['correct_answer']}",
            FONT_REGULAR,
            7.4,
            content_width,
        )
    explanation_rows = [
        _wrap(row, FONT_REGULAR, 6.9, content_width)
        for row in _explanation_rows(question.get("explanation"))
    ]
    header_height = max(15 * MM, 13 + len(question_lines) * 9.5)
    base_height = (
        header_height
        + 9
        + sum(max(1, len(row["lines"])) * 8.4 + 2 for row in option_rows)
        + 8
        + len(feedback_lines) * 8.8
        + len(correct_feedback_lines) * 8.8
        + 11
    )
    return {
        **question,
        "question_lines": question_lines,
        "option_rows": option_rows,
        "feedback_lines": feedback_lines,
        "correct_feedback_lines": correct_feedback_lines,
        "explanation_rows": explanation_rows,
        "header_height": header_height,
        "base_card_height": max(base_height, 78),
        "card_height": max(base_height + _explanation_block_height(explanation_rows), 78),
    }


def _split_oversized_question(question: dict, max_height: float) -> list[dict]:
    if question["card_height"] <= max_height or not question["explanation_rows"]:
        return [question]

    base_height = question["base_card_height"]
    if base_height >= max_height:
        return [question]

    explanation_lines = [
        line
        for row_lines in question["explanation_rows"]
        for line in row_lines
    ]
    first_capacity = max(0, int((max_height - base_height - 10) // 10))
    first_lines = explanation_lines[:first_capacity]
    remaining_lines = explanation_lines[first_capacity:]
    fragments: list[dict] = [
        {
            **question,
            "explanation_rows": [[line] for line in first_lines],
            "card_height": max(
                base_height + _explanation_block_height([[line] for line in first_lines]),
                78,
            ),
        }
    ]

    continuation_header_height = 12 * MM
    continuation_fixed_height = continuation_header_height + 30
    continuation_capacity = max(1, int((max_height - continuation_fixed_height) // 10))
    while remaining_lines:
        fragment_lines = remaining_lines[:continuation_capacity]
        remaining_lines = remaining_lines[continuation_capacity:]
        explanation_rows = [[line] for line in fragment_lines]
        fragments.append(
            {
                **question,
                "is_continuation": True,
                "explanation_rows": explanation_rows,
                "header_height": continuation_header_height,
                "card_height": continuation_fixed_height + len(fragment_lines) * 10,
            }
        )
    return fragments


def _shared_text_height(shared_text: str, width: float) -> tuple[list[str], float]:
    if not shared_text:
        return [], 0
    lines = _wrap(shared_text, FONT_REGULAR, 7.1, width - 8 * MM)
    return lines, 7 * MM + len(lines) * 8.3


def _paginate_detail_pages(groups: list[dict]) -> list[dict]:
    pages: list[dict] = []
    available_width = PAGE_W - 2 * MARGIN
    available_height = PAGE_H - 42 * MM - CONTENT_BOTTOM
    for group in groups:
        prepared_questions = []
        for question in group["questions"]:
            prepared_questions.extend(
                _split_oversized_question(
                    _prepare_question(question, available_width),
                    available_height,
                )
            )
        shared_lines, shared_height = _shared_text_height(group["shared_text"], available_width)
        current: list[dict] = []
        used = shared_height
        first_page = True
        for question in prepared_questions:
            required = question["card_height"] + (8 if current else 0)
            if current and used + required > available_height:
                pages.append(
                    {
                        **group,
                        "questions": current,
                        "shared_lines": shared_lines if first_page else [],
                        "shared_height": shared_height if first_page else 0,
                    }
                )
                current = [question]
                used = question["card_height"]
                first_page = False
            else:
                current.append(question)
                used += required
        if current:
            pages.append(
                {
                    **group,
                    "questions": current,
                    "shared_lines": shared_lines if first_page else [],
                    "shared_height": shared_height if first_page else 0,
                }
            )
    return pages


def _draw_detail_card(pdf: canvas.Canvas, question: dict, y: float) -> float:
    x = MARGIN
    width = PAGE_W - 2 * MARGIN
    height = question["card_height"]
    bottom = y - height
    pdf.setStrokeColor(LINE)
    pdf.setLineWidth(0.55)
    pdf.roundRect(x, bottom, width, height, 4, fill=0, stroke=1)

    status_right = x + width - 8
    question_x = x + 13 * MM
    if question.get("is_continuation"):
        pdf.setFillColor(TEAL_DARK)
        pdf.circle(x + 7 * MM, y - 7 * MM, 3.4 * MM, fill=1, stroke=0)
        pdf.setFillColor(WHITE)
        pdf.setFont(FONT_BOLD, 7.4)
        pdf.drawCentredString(x + 7 * MM, y - 7.8 * MM, str(question["number"]))
        pdf.setFillColor(TEXT)
        pdf.setFont(FONT_BOLD, 8.1)
        pdf.drawString(question_x, y - 7.8 * MM, "Justificare (continuare)")
        _draw_status_pill(pdf, question, status_right, y - 7 * MM)

        divider_y = y - question["header_height"]
        pdf.setStrokeColor(LINE)
        pdf.line(question_x, divider_y, x + width, divider_y)
        cursor_y = divider_y - 10
        for row_lines in question["explanation_rows"]:
            cursor_y = _draw_lines(
                pdf,
                row_lines,
                question_x,
                cursor_y,
                FONT_REGULAR,
                6.9,
                8,
                TEXT,
            )
            cursor_y -= 2
        return bottom

    question_width = status_right - question_x - 29 * MM
    pdf.setFillColor(TEAL_DARK)
    pdf.circle(x + 7 * MM, y - 10 * MM, 3.4 * MM, fill=1, stroke=0)
    pdf.setFillColor(WHITE)
    pdf.setFont(FONT_BOLD, 7.4)
    pdf.drawCentredString(x + 7 * MM, y - 10.8 * MM, str(question["number"]))
    _draw_lines(
        pdf,
        _wrap(question["text"], FONT_REGULAR, 8.1, question_width),
        question_x,
        y - 7.8 * MM,
        FONT_REGULAR,
        8.1,
        9.5,
        TEXT,
    )
    _draw_status_pill(pdf, question, status_right, y - 10 * MM)

    divider_y = y - question["header_height"]
    pdf.setStrokeColor(LINE)
    pdf.line(question_x, divider_y, x + width, divider_y)
    cursor_y = divider_y - 10
    option_x = question_x
    for option in question["option_rows"]:
        option_color = TEXT
        option_font = FONT_REGULAR
        if option["is_correct"]:
            option_color = SUCCESS
            option_font = FONT_BOLD
        elif option["is_selected"] and not question["is_correct"]:
            option_color = DANGER
        cursor_y = _draw_lines(
            pdf,
            option["lines"],
            option_x,
            cursor_y,
            option_font,
            7.35,
            8.4,
            option_color,
        )
        cursor_y -= 2

    cursor_y -= 4
    pdf.setStrokeColor(LINE)
    pdf.setDash(1.5, 1.5)
    pdf.line(option_x, cursor_y, x + width - 5 * MM, cursor_y)
    pdf.setDash()
    cursor_y -= 9
    cursor_y = _draw_lines(
        pdf,
        question["feedback_lines"],
        option_x,
        cursor_y,
        FONT_REGULAR,
        7.4,
        8.8,
        TEXT,
    )
    if question["correct_feedback_lines"]:
        cursor_y = _draw_lines(
            pdf,
            question["correct_feedback_lines"],
            option_x,
            cursor_y,
            FONT_BOLD,
            7.4,
            8.8,
            SUCCESS,
        )

    if question["explanation_rows"]:
        cursor_y -= 3
        pdf.setFillColor(TEAL_DARK)
        pdf.setFont(FONT_BOLD, 6.8)
        pdf.drawString(option_x, cursor_y, "Justificare")
        cursor_y -= 9
        for row_lines in question["explanation_rows"]:
            cursor_y = _draw_lines(
                pdf,
                row_lines,
                option_x,
                cursor_y,
                FONT_REGULAR,
                6.9,
                8,
                TEXT,
            )
            cursor_y -= 2
    return bottom


def _draw_detail_page(
    pdf: canvas.Canvas,
    detail_page: dict,
    page_number: int,
    page_count: int,
) -> None:
    header_y = _draw_header(pdf, compact=True)
    title_y = header_y - 9 * MM
    pdf.setFillColor(INK)
    pdf.setFont(FONT_BOLD, 13.5)
    pdf.drawString(MARGIN, title_y, f"{detail_page['code']}. {detail_page['title']}")
    visible_numbers = _question_numbers_label(detail_page["questions"])
    pdf.setFillColor(MUTED)
    pdf.setFont(FONT_REGULAR, 7.5)
    pdf.drawRightString(PAGE_W - MARGIN, title_y, f"Întrebările {visible_numbers}")

    y = title_y - 6 * MM
    if detail_page["shared_lines"]:
        shared_height = detail_page["shared_height"]
        pdf.setFillColor(HexColor("#F7FAF9"))
        pdf.setStrokeColor(LINE)
        pdf.roundRect(
            MARGIN,
            y - shared_height,
            PAGE_W - 2 * MARGIN,
            shared_height,
            4,
            fill=1,
            stroke=1,
        )
        _draw_lines(
            pdf,
            detail_page["shared_lines"],
            MARGIN + 4 * MM,
            y - 5 * MM,
            FONT_REGULAR,
            7.1,
            8.3,
            TEXT,
        )
        y -= shared_height + 8
    for question in detail_page["questions"]:
        y = _draw_detail_card(pdf, question, y)
        y -= 8
    _draw_footer(pdf, page_number, page_count)


def build_admitere_pdf_report(source: dict, target) -> None:
    report = _normalize_report(source)
    detail_pages = _paginate_detail_pages(report["groups"])
    overview_limit = 5
    remaining_groups = report["groups"][overview_limit:]
    overview_pages = [
        remaining_groups[index : index + 10]
        for index in range(0, len(remaining_groups), 10)
    ]
    page_count = 1 + len(overview_pages) + len(detail_pages)

    if isinstance(target, Path):
        target.parent.mkdir(parents=True, exist_ok=True)
    canvas_target = str(target) if isinstance(target, Path) else target
    pdf = canvas.Canvas(canvas_target, pagesize=A4, pageCompression=1)
    pdf.setTitle(report["test_title"])
    pdf.setAuthor("Logica by Aletheia")
    pdf.setSubject("Raport finalizare test de admitere")
    _draw_summary_page(pdf, report, page_count, overview_limit)

    page_number = 2
    for overview_groups in overview_pages:
        pdf.showPage()
        _draw_overview_continuation(pdf, overview_groups, page_number, page_count)
        page_number += 1
    for detail_page in detail_pages:
        pdf.showPage()
        _draw_detail_page(pdf, detail_page, page_number, page_count)
        page_number += 1
    pdf.save()
