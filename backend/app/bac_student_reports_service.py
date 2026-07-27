from __future__ import annotations

import base64
import io
import json
import re
import unicodedata
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from .auth_service import resolve_unique_student_email
from .database import DATA_DIR

REPORT_ROOT = DATA_DIR / "archive" / "bac_student_reports"
REPORT_JSON_DIR = REPORT_ROOT / "json"
REPORT_PDF_DIR = REPORT_ROOT / "pdf"
REPORT_EXPORT_DIR = REPORT_ROOT / "exports"
TEACHER_SOLUTION_DIR = Path(__file__).resolve().parent / "teacher_solutions"
TEACHER_SOLUTION_PATH = TEACHER_SOLUTION_DIR / "bac_2025_model" / "teacher_solution.json"
FRONTEND_ZIP_DERIVED_DIR = Path(__file__).resolve().parents[2] / "frontend" / "src" / "data" / "exams" / "zipDerived"

PAGE_W, PAGE_H = A4
MARGIN = 38
TEXT = HexColor("#172033")
MUTED = HexColor("#64748b")
LINE = HexColor("#dbe3ee")
SURFACE = HexColor("#f8fafc")
NAVY = HexColor("#0f2747")
GREEN = HexColor("#047857")
RED = HexColor("#b91c1c")
AMBER = HexColor("#a16207")


def _resolve_fonts() -> tuple[str, str]:
    candidates = [
        (Path(r"C:\Windows\Fonts\arial.ttf"), Path(r"C:\Windows\Fonts\arialbd.ttf"), "Arial"),
        (Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"), "DejaVu"),
    ]
    for regular_path, bold_path, family in candidates:
        if not regular_path.exists() or not bold_path.exists():
            continue
        regular_name = f"BacReport-{family}-Regular"
        bold_name = f"BacReport-{family}-Bold"
        if regular_name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(regular_name, str(regular_path)))
        if bold_name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(bold_name, str(bold_path)))
        return regular_name, bold_name
    return "Helvetica", "Helvetica-Bold"


FONT_REGULAR, FONT_BOLD = _resolve_fonts()


def _resolve_serif_fonts() -> tuple[str, str]:
    candidates = [
        (Path(r"C:\Windows\Fonts\georgia.ttf"), Path(r"C:\Windows\Fonts\georgiab.ttf"), "Georgia"),
        (Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"), "DejaVuSerif"),
    ]
    for regular_path, bold_path, family in candidates:
        if not regular_path.exists() or not bold_path.exists():
            continue
        regular_name = f"BacReport-{family}-Regular"
        bold_name = f"BacReport-{family}-Bold"
        if regular_name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(regular_name, str(regular_path)))
        if bold_name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(bold_name, str(bold_path)))
        return regular_name, bold_name
    return "Times-Roman", "Times-Bold"


FONT_SERIF, FONT_SERIF_BOLD = _resolve_serif_fonts()


def _ensure_dirs() -> None:
    REPORT_JSON_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_PDF_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def _safe_component(value: str) -> str:
    normalized = re.sub(r"\s+", "_", str(value or "").strip())
    normalized = re.sub(r"[^A-Za-z0-9_\-]+", "", normalized)
    return normalized or "raport"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _as_list(value) -> list:
    return value if isinstance(value, list) else []


def _is_dict(value) -> bool:
    return isinstance(value, dict)


def _strip_diacritics(value: str) -> str:
    return "".join(
        char for char in unicodedata.normalize("NFD", str(value or ""))
        if unicodedata.category(char) != "Mn"
    )


def _normalize_answer(value) -> str:
    return re.sub(r"\s+", "", _strip_diacritics(str(value or "")).lower())


def _normalize_exam_key(value) -> str:
    return re.sub(r"[^a-z0-9]+", "", _strip_diacritics(str(value or "").lower()))


def _answer_map_source(value):
    if isinstance(value, dict):
        for key in ("correctAnswers", "answers", "statements", "truthValues", "correctAnswer"):
            source = value.get(key)
            if _is_automatic_answer_map(source):
                return source
        for key in ("items", "answers", "solutions"):
            source = value.get(key)
            if isinstance(source, list):
                return source
    return value


def _normalize_auto_answer_value(value):
    if isinstance(value, list):
        return [str(entry).strip() for entry in value if str(entry).strip()]
    if isinstance(value, dict):
        for key in ("variant", "letter", "value", "answer", "correctAnswer", "correctLetter"):
            if value.get(key) is not None:
                return _normalize_auto_answer_value(value.get(key))
        return ""
    return str(value or "").strip()


def _is_automatic_answer_value(value) -> bool:
    normalized = _normalize_auto_answer_value(value)
    if isinstance(normalized, list):
        return bool(normalized) and all(re.fullmatch(r"[A-Za-z]", entry) for entry in normalized)
    return bool(re.fullmatch(r"[A-Za-z]", normalized))


def _parse_answer_pairs(value) -> dict[str, object]:
    value = _answer_map_source(value)

    if isinstance(value, dict):
        direct_key = str(
            value.get("itemId") or value.get("id") or value.get("key") or value.get("label") or ""
        ).strip()
        direct_answer_source = (
            value.get("correctAnswer")
            if value.get("correctAnswer") is not None
            else value.get("correctLetter")
            if value.get("correctLetter") is not None
            else value.get("answer")
            if value.get("answer") is not None
            else value.get("value")
        )
        if direct_key and _is_automatic_answer_value(direct_answer_source):
            return {direct_key.lower(): _normalize_auto_answer_value(direct_answer_source)}

        pairs: dict[str, object] = {}
        for key, entry in value.items():
            key_text = str(key or "").strip().lower()
            entry_value = _normalize_auto_answer_value(entry)
            if key_text and _is_automatic_answer_value(entry):
                pairs[key_text] = entry_value
        return pairs

    pairs: dict[str, object] = {}
    for entry in _as_list(value):
        if isinstance(entry, (list, tuple)) and len(entry) >= 2:
            raw_key = str(entry[0] or "").strip()
            raw_answer = _normalize_auto_answer_value(entry[-1])
            if raw_key and _is_automatic_answer_value(entry[-1]):
                pairs[raw_key.lower()] = raw_answer
            continue

        if isinstance(entry, dict):
            nested_source = _answer_map_source(entry)
            if nested_source is not entry and isinstance(nested_source, dict):
                pairs.update(_parse_answer_pairs(nested_source))
                continue

            raw_key = str(entry.get("itemId") or entry.get("id") or entry.get("key") or entry.get("label") or "").strip()
            raw_answer_source = (
                entry.get("correctAnswer")
                if entry.get("correctAnswer") is not None
                else entry.get("correctLetter")
                if entry.get("correctLetter") is not None
                else entry.get("answer")
                if entry.get("answer") is not None
                else entry.get("value")
            )
            raw_answer = _normalize_auto_answer_value(raw_answer_source)
            if raw_key and _is_automatic_answer_value(raw_answer_source):
                pairs[raw_key.lower()] = raw_answer
            continue

        match = re.match(r"\s*([A-Za-z0-9_]+)\s*[-:.)]\s*([A-Za-z])\s*$", str(entry or ""))
        if match:
            pairs[match.group(1).lower()] = match.group(2)
    return pairs


def _is_automatic_answer_map(value) -> bool:
    if not isinstance(value, dict) or not value:
        return False

    wrapper_keys = {"variant", "letter", "value", "answer", "correctAnswer", "correctLetter"}
    if all(str(key) in wrapper_keys for key in value):
        return False

    for key, entry in value.items():
        key_text = str(key or "").strip()
        if not re.fullmatch(r"[A-Za-z]|\d+|(?:I|II|III)_[A-Za-z](?:_[A-Za-z0-9]+)*", key_text):
            return False
        if not _is_automatic_answer_value(entry):
            return False

    return True


def _answer_map_from_solution(solution: dict | None) -> dict | None:
    if not isinstance(solution, dict):
        return None
    correct_answers = solution.get("correctAnswers")
    if isinstance(correct_answers, dict):
        return correct_answers
    correct_fields = solution.get("correctFields")
    if isinstance(correct_fields, dict):
        return correct_fields
    answers = solution.get("answers")
    if _is_automatic_answer_map(answers):
        return answers
    correct_answer = solution.get("correctAnswer")
    if _is_automatic_answer_map(correct_answer):
        return correct_answer
    return None


def _normalized_answer_map(value: dict) -> dict[str, object]:
    return {str(key).strip().lower(): entry for key, entry in value.items() if str(key).strip()}


def _canonical_solution_entry(solution: dict) -> dict:
    entry = {**solution}
    if isinstance(entry.get("correctAnswer"), dict):
        if _is_automatic_answer_map(entry.get("correctAnswer")):
            entry["correctAnswers"] = entry.get("correctAnswer")
            entry.pop("correctAnswer", None)
        else:
            normalized = _normalize_auto_answer_value(entry.get("correctAnswer"))
            if normalized:
                entry["correctAnswer"] = normalized
    if "correctAnswer" not in entry and entry.get("correctLetter") is not None:
        entry["correctAnswer"] = entry.get("correctLetter")
    if "correctAnswers" not in entry and _is_automatic_answer_map(entry.get("answers")):
        entry["correctAnswers"] = entry.get("answers")
    return entry


def _index_backend_solution(solution: dict) -> dict[str, dict]:
    index: dict[str, dict] = {}
    for section in _as_list(solution.get("solutions")):
        for group in _as_list(section.get("groups")):
            for item in _as_list(group.get("items")):
                item_id = item.get("itemId")
                if item_id:
                    index[str(item_id)] = _canonical_solution_entry(item)
    return index


def _normalize_teacher_section_id(value) -> str:
    return re.sub(r"[^a-z0-9]+", "", _strip_diacritics(str(value or "").lower()))


def _teacher_section_aliases(section_id: str) -> set[str]:
    normalized = _normalize_teacher_section_id(section_id)
    aliases = {normalized}
    if normalized == "ia":
        aliases.update({"i", "s1a", "s1ia", "subjecti", "subiectuli"})
    elif normalized == "ib":
        aliases.update({"s1b", "s1ib", "subjectib", "subiectulib"})
    elif normalized.startswith("ii"):
        aliases.add("s2" + normalized[2:])
    elif normalized.startswith("iii"):
        aliases.add("s3" + normalized[3:])
    return aliases


def _infer_teacher_entry_section_id(entry: dict) -> str:
    direct = entry.get("section") or entry.get("sectionId") or entry.get("groupId") or entry.get("id")
    if direct:
        return str(direct).replace(".", "_")

    item_id = str(entry.get("itemId") or "")
    match = re.match(r"^(I|II|III)_([A-Za-z])", item_id)
    return f"{match.group(1)}_{match.group(2)}" if match else ""


def _append_teacher_candidate(candidates: list[object], entry, section_id: str) -> None:
    aliases = _teacher_section_aliases(section_id)

    if isinstance(entry, list):
        matching_items = [
            item
            for item in entry
            if isinstance(item, dict) and _normalize_teacher_section_id(_infer_teacher_entry_section_id(item)) in aliases
        ]
        if matching_items:
            candidates.append(matching_items)
        for item in entry:
            _append_teacher_candidate(candidates, item, section_id)
        return

    if not isinstance(entry, dict):
        return

    if _normalize_teacher_section_id(_infer_teacher_entry_section_id(entry)) in aliases:
        candidates.append(entry)

    for container_name in ("groups", "solutions", "items", "answers", "official_keys"):
        container = entry.get(container_name)
        if isinstance(container, dict):
            for key, nested_entry in container.items():
                if _normalize_teacher_section_id(key) in aliases:
                    candidates.append(nested_entry)
                _append_teacher_candidate(candidates, nested_entry, section_id)
        elif isinstance(container, list):
            _append_teacher_candidate(candidates, container, section_id)


def _teacher_solution_candidates(solution: dict, section_id: str) -> list[object]:
    candidates: list[object] = []
    aliases = _teacher_section_aliases(section_id)

    group_id = _normalize_teacher_section_id(section_id)
    subject_one = (
        solution.get("subiectul_I")
        or solution.get("subiectulI")
        or solution.get("subject_I")
        or solution.get("subjectI")
    )
    if isinstance(subject_one, dict) and group_id in {"ia", "ib"}:
        for key in (("A", "I_A", "S1A", "answers") if group_id == "ia" else ("B", "I_B", "S1B")):
            if key in subject_one:
                candidates.append(subject_one[key])

    subject_three = (
        solution.get("subiectul_III")
        or solution.get("subiectulIII")
        or solution.get("subject_III")
        or solution.get("subjectIII")
    )
    if isinstance(subject_three, dict) and group_id == "iiic":
        for key in ("C", "III_C", "S3C"):
            if key in subject_three:
                candidates.append(subject_three[key])

    for container_name in ("answerKey", "answers", "items", "solutions", "official_keys"):
        container = solution.get(container_name)
        if isinstance(container, list):
            matching_items = [
                entry
                for entry in container
                if isinstance(entry, dict) and _normalize_teacher_section_id(_infer_teacher_entry_section_id(entry)) in aliases
            ]
            if matching_items:
                candidates.append(matching_items)
            for entry in container:
                _append_teacher_candidate(candidates, entry, section_id)
            continue

        if isinstance(container, dict):
            for key, entry in container.items():
                if _normalize_teacher_section_id(key) in aliases:
                    candidates.append(entry)
                _append_teacher_candidate(candidates, entry, section_id)

    sections = solution.get("sections")
    if isinstance(sections, dict):
        for key, entry in sections.items():
            if _normalize_teacher_section_id(key) in aliases:
                candidates.append(entry)
            _append_teacher_candidate(candidates, entry, section_id)
    elif isinstance(sections, list):
        for entry in sections:
            if not isinstance(entry, dict):
                continue
            if _normalize_teacher_section_id(entry.get("id")) in aliases:
                candidates.append(entry)
            _append_teacher_candidate(candidates, entry, section_id)
            solutions = entry.get("solutions")
            if isinstance(solutions, dict):
                for key, nested_entry in solutions.items():
                    if _normalize_teacher_section_id(key) in aliases:
                        candidates.append(nested_entry)
                    _append_teacher_candidate(candidates, nested_entry, section_id)

    return candidates


def _normalize_choice_answer_key(key: str) -> str:
    match = re.search(r"(\d+)$", str(key or ""))
    return match.group(1) if match else ""


def _normalize_truth_answer_key(key: str) -> str:
    match = re.search(r"([A-Za-z]|\d+)$", str(key or ""))
    return match.group(1).lower() if match else ""


def _index_choice_answers(index: dict[str, dict], source) -> None:
    for key, answer in _parse_answer_pairs(source).items():
        number = _normalize_choice_answer_key(key)
        if number:
            if isinstance(answer, list):
                index[f"I_A_{number}"] = {"correctAnswer": [str(entry).lower() for entry in answer]}
            else:
                index[f"I_A_{number}"] = {"correctAnswer": str(answer).lower()}


def _index_truth_answers(index: dict[str, dict], item_id: str, source) -> None:
    truth_answers = {
        normalized_key: str(value).upper()
        for key, value in _parse_answer_pairs(source).items()
        if (normalized_key := _normalize_truth_answer_key(key))
    }
    if truth_answers:
        existing_answers = index.get(item_id, {}).get("correctAnswers")
        merged_answers = {**existing_answers, **truth_answers} if isinstance(existing_answers, dict) else truth_answers
        index[item_id] = {"correctAnswers": merged_answers}


def _index_zip_teacher_solution(solution: dict) -> dict[str, dict]:
    index: dict[str, dict] = {}

    for source in _teacher_solution_candidates(solution, "I_A"):
        _index_choice_answers(index, source)

    for source in _teacher_solution_candidates(solution, "I_B"):
        _index_truth_answers(index, "I_B_AF", source)

    for source in _teacher_solution_candidates(solution, "III_C"):
        _index_truth_answers(index, "III_C", source)

    return index


def _solution_index_from_payload(payload: dict | None) -> dict[str, dict]:
    if not isinstance(payload, dict):
        return {}
    solution = payload.get("solution") if isinstance(payload.get("solution"), dict) else payload
    zip_index = _index_zip_teacher_solution(solution)
    backend_index = _index_backend_solution(solution)
    return {**zip_index, **backend_index}


def _solution_files() -> list[Path]:
    files = list(TEACHER_SOLUTION_DIR.glob("*/teacher_solution.json"))
    if FRONTEND_ZIP_DERIVED_DIR.exists():
        files.extend(FRONTEND_ZIP_DERIVED_DIR.glob("*TeacherSolution.json"))
    return files


def _infer_exam_id_from_report(report: dict) -> str:
    direct = report.get("examId") or report.get("exam_id")
    if direct:
        return str(direct)

    title = str(report.get("examTitle") or report.get("testTitle") or report.get("test_title") or "")
    normalized = _strip_diacritics(title).lower()
    year_match = re.search(r"\b(20\d{2})\b", normalized)
    if not year_match:
        return ""
    year = year_match.group(1)
    if "model" in normalized:
        return f"bac_logica_{year}_model"
    if "simulare" in normalized:
        return f"bac_logica_{year}_simulare"
    variant_match = re.search(r"\b(?:varianta|v)\s*([0-9]+)\b", normalized)
    if variant_match:
        return f"bac_logica_{year}_v{variant_match.group(1)}"
    return ""


def _exam_keys_from_payload(value: dict | None) -> set[str]:
    if not isinstance(value, dict):
        return set()

    keys = {
        _normalize_exam_key(value.get("examId")),
        _normalize_exam_key(value.get("exam_id")),
        _normalize_exam_key(value.get("id")),
        _normalize_exam_key(value.get("solutionId")),
        _normalize_exam_key(value.get("title")),
    }

    year = value.get("year")
    variant = _strip_diacritics(str(value.get("variant") or "")).lower()
    if year and variant:
        if "model" in variant:
            keys.add(_normalize_exam_key(f"bac_logica_{year}_model"))
        elif "simulare" in variant:
            keys.add(_normalize_exam_key(f"bac_logica_{year}_simulare"))
        elif variant_match := re.search(r"\b(?:varianta|v)?\s*([0-9]+)\b", variant):
            keys.add(_normalize_exam_key(f"bac_logica_{year}_v{variant_match.group(1)}"))

    searchable_text = _strip_diacritics(
        " ".join(
            str(value.get(key) or "")
            for key in ("id", "examId", "exam_id", "solutionId", "title", "source", "sourceBasis")
        )
    ).lower()
    if text_year_match := re.search(r"\b(20\d{2})\b", searchable_text):
        text_year = text_year_match.group(1)
        if "model" in searchable_text:
            keys.add(_normalize_exam_key(f"bac_logica_{text_year}_model"))
        elif "simulare" in searchable_text:
            keys.add(_normalize_exam_key(f"bac_logica_{text_year}_simulare"))
        elif text_variant_match := re.search(r"\b(?:varianta|v)[\s_-]*([0-9]+)\b", searchable_text):
            keys.add(_normalize_exam_key(f"bac_logica_{text_year}_v{text_variant_match.group(1)}"))

    return {key for key in keys if key}


def _load_solution_index_for_report(report: dict) -> dict[str, dict]:
    report_exam_key = _normalize_exam_key(_infer_exam_id_from_report(report))
    report_title_key = _normalize_exam_key(report.get("examTitle") or report.get("testTitle") or report.get("test_title"))
    fallback: dict[str, dict] = {}

    for path in _solution_files():
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue

        index = _solution_index_from_payload(payload)
        if not index:
            continue

        solution = payload.get("solution") if isinstance(payload.get("solution"), dict) else payload
        exam_keys: set[str] = set()
        for candidate in (
            payload,
            solution,
            payload.get("metadata"),
            payload.get("meta"),
            payload.get("examMeta"),
            solution.get("metadata") if isinstance(solution, dict) else None,
            solution.get("meta") if isinstance(solution, dict) else None,
            solution.get("examMeta") if isinstance(solution, dict) else None,
        ):
            exam_keys.update(_exam_keys_from_payload(candidate))

        if path == TEACHER_SOLUTION_PATH:
            fallback = index

        if (report_exam_key and report_exam_key in exam_keys) or (report_title_key and report_title_key in exam_keys):
            return index

    return fallback


def _solution_from_report_item(item: dict) -> dict | None:
    for key in ("correction", "solution"):
        value = item.get(key)
        if isinstance(value, dict) and (
            value.get("correctAnswer") is not None
            or value.get("correctLetter") is not None
            or isinstance(value.get("correctAnswers"), dict)
            or isinstance(value.get("correctFields"), dict)
            or _is_automatic_answer_map(value.get("answers"))
        ):
            return _canonical_solution_entry(value)
    return None


def _load_solution_index() -> dict[str, dict]:
    if not TEACHER_SOLUTION_PATH.exists():
        return {}
    try:
        solution = json.loads(TEACHER_SOLUTION_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}

    return _solution_index_from_payload(solution)


def _status_payload(status: str, earned: float = 0, max_points: float = 0) -> dict:
    labels = {
        "correct": "Corect",
        "incorrect": "Greșit",
        "missing": "Necompletat",
        "partial": "Parțial",
        "needs_review": "Verificare profesor",
    }
    return {
        "itemStatus": status,
        "item_status": status,
        "itemStatusLabel": labels.get(status, "Verificare profesor"),
        "item_status_label": labels.get(status, "Verificare profesor"),
        "earnedPoints": earned,
        "earned_points": earned,
        "maxPoints": max_points,
        "max_points": max_points,
    }


def _correct_answer_display(solution: dict | None) -> str:
    if not isinstance(solution, dict):
        return ""
    single_answer = solution.get("correctAnswer")
    if single_answer is None:
        single_answer = solution.get("correctLetter")
    if single_answer is not None:
        if isinstance(single_answer, list):
            answer = " / ".join(str(entry).upper() for entry in single_answer)
        else:
            answer = str(single_answer).upper()
        return f"Varianta corect\u0103: {answer}"
    correct_answers = _answer_map_from_solution(solution)
    if isinstance(correct_answers, dict):
        entries = [
            f"{key}) {', '.join(str(entry).upper() for entry in value) if isinstance(value, list) else str(value).upper()}"
            for key, value in correct_answers.items()
        ]
        return "R\u0103spunsuri corecte: " + "; ".join(entries)
    return ""


def _answer_is_missing(answer: dict) -> bool:
    if answer.get("isMissing") or answer.get("is_missing"):
        return True
    value = answer.get("value")
    if _is_dict(value):
        return not any(value.get(key) for key in ("uploadedFileName", "uploadedFileUrl", "png_export"))
    return not str(value or "").strip()


def _grade_item(item: dict, solution_index: dict[str, dict]) -> dict:
    solution = _solution_from_report_item(item) or solution_index.get(str(item.get("id") or ""))
    answers = _as_list(item.get("answers"))
    max_points = float(item.get("points") or solution.get("points") or 0) if solution else float(item.get("points") or 0)
    if not answers or all(_answer_is_missing(answer) for answer in answers):
        return {**_status_payload("missing", 0, max_points), "correctAnswerDisplay": "", "correct_answer_display": ""}
    if not solution:
        return {**_status_payload("needs_review", 0, max_points), "correctAnswerDisplay": "", "correct_answer_display": ""}

    single_expected = solution.get("correctAnswer")
    if single_expected is None:
        single_expected = solution.get("correctLetter")
    if single_expected is not None and len(answers) == 1:
        actual = answers[0].get("value")
        expected_values = single_expected if isinstance(single_expected, list) else [single_expected]
        is_correct = any(_normalize_answer(actual) == _normalize_answer(expected) for expected in expected_values)
        display = "" if is_correct else _correct_answer_display(solution)
        return {
            **_status_payload("correct" if is_correct else "incorrect", max_points if is_correct else 0, max_points),
            "correctAnswerDisplay": display,
            "correct_answer_display": display,
        }

    correct_answers = _answer_map_from_solution(solution)
    if isinstance(correct_answers, dict):
        normalized_correct_answers = _normalized_answer_map(correct_answers)
        total = len(normalized_correct_answers)
        correct = 0
        answered = 0
        for answer in answers:
            key = str(answer.get("key") or answer.get("fieldKey") or "").strip().lower()
            if not key:
                label = str(answer.get("label") or "")
                key_match = re.match(r"\s*([a-zA-Z])", label)
                key = key_match.group(1).lower() if key_match else ""
            if not key or key not in normalized_correct_answers:
                continue
            if not _answer_is_missing(answer):
                answered += 1
            expected_value = normalized_correct_answers.get(key)
            expected_values = expected_value if isinstance(expected_value, list) else [expected_value]
            if any(_normalize_answer(answer.get("value")) == _normalize_answer(expected) for expected in expected_values):
                correct += 1
        if answered == 0:
            return {**_status_payload("missing", 0, max_points), "correctAnswerDisplay": "", "correct_answer_display": ""}
        if correct == total:
            return {**_status_payload("correct", max_points, max_points), "correctAnswerDisplay": "", "correct_answer_display": ""}
        if correct > 0:
            earned = round(max_points * correct / max(total, 1), 2)
            display = _correct_answer_display(solution)
            return {**_status_payload("partial", earned, max_points), "correctAnswerDisplay": display, "correct_answer_display": display}
        display = _correct_answer_display(solution)
        return {**_status_payload("incorrect", 0, max_points), "correctAnswerDisplay": display, "correct_answer_display": display}

    return {**_status_payload("needs_review", 0, max_points), "correctAnswerDisplay": "", "correct_answer_display": ""}


def _grade_report_payload(report: dict) -> dict:
    solution_index = _load_solution_index_for_report(report) or _load_solution_index()
    sections = []
    correct_count = 0
    wrong_count = 0
    review_count = 0
    missing_count = 0
    earned_points = 0.0
    max_points = 0.0

    for section in _as_list(report.get("sections")):
        next_section = {**section, "items": []}
        for item in _as_list(section.get("items")):
            grade = _grade_item(item, solution_index)
            status = grade["itemStatus"]
            next_item = {**item, **grade}
            next_section["items"].append(next_item)
            earned_points += float(grade.get("earnedPoints") or 0)
            max_points += float(grade.get("maxPoints") or item.get("points") or 0)
            if status == "correct":
                correct_count += 1
            elif status in {"incorrect", "partial"}:
                wrong_count += 1
            elif status == "missing":
                missing_count += 1
            else:
                review_count += 1
        sections.append(next_section)

    score_percent = round((earned_points / max(max_points, 1)) * 100)
    return {
        **report,
        "sections": sections,
        "correctCount": correct_count,
        "correct_count": correct_count,
        "wrongCount": wrong_count,
        "wrong_count": wrong_count,
        "manualReviewCount": review_count,
        "manual_review_count": review_count,
        "missingCount": missing_count,
        "missing_count": missing_count,
        "earnedPoints": round(earned_points, 2),
        "earned_points": round(earned_points, 2),
        "maxPoints": round(max_points, 2),
        "max_points": round(max_points, 2),
        "scorePercent": score_percent,
        "score_percentage": score_percent,
    }


def _answer_text(value) -> str:
    if _is_dict(value):
        if value.get("uploadedFileName"):
            return f"Diagrama atașată: {value.get('uploadedFileName')}"
        if value.get("png_export") or value.get("uploadedFileUrl"):
            return "Diagrama completata pe canvas/upload"
        return "-"
    if isinstance(value, list):
        return ", ".join(str(entry) for entry in value)
    return str(value or "").strip() or "-"


def _status_color(status: str):
    if status == "correct":
        return GREEN
    if status in {"incorrect", "partial"}:
        return RED if status == "incorrect" else AMBER
    return MUTED


def _image_source(value) -> bytes | None:
    if not _is_dict(value):
        return None
    source = value.get("png_export") or value.get("uploadedFileUrl") or ""
    if not isinstance(source, str) or not source.startswith("data:image/"):
        return None
    try:
        _, encoded = source.split(",", 1)
        return base64.b64decode(encoded)
    except Exception:
        return None


def _wrap_lines(text: str, width: float, font_name: str, size: float) -> list[str]:
    paragraphs = str(text or "").replace("\r", "").split("\n")
    lines: list[str] = []
    for paragraph in paragraphs:
        words = paragraph.split()
        if not words:
            if lines:
                lines.append("")
            continue
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


def _fit_text(
    text: str,
    width: float,
    height: float,
    font_name: str = FONT_SERIF,
    max_size: float = 8.2,
    min_size: float = 4.5,
) -> tuple[list[str], float, float]:
    size = max_size
    hard_floor = min(min_size, 2.5)
    while size >= hard_floor:
        leading = size * 1.26
        lines = _wrap_lines(text, width, font_name, size)
        if len(lines) * leading <= height:
            return lines, size, leading
        size -= 0.25
    lines = _wrap_lines(text, width, font_name, hard_floor)
    return lines, hard_floor, hard_floor * 1.08


def _draw_fitted_text(
    pdf: canvas.Canvas,
    text: str,
    x: float,
    top: float,
    width: float,
    height: float,
    font_name: str = FONT_SERIF,
    max_size: float = 8.2,
    min_size: float = 4.5,
    color=TEXT,
) -> None:
    lines, size, leading = _fit_text(text, width, height, font_name, max_size, min_size)
    pdf.setFont(font_name, size)
    pdf.setFillColor(color)
    y = top - size
    for line in lines:
        pdf.drawString(x, y, line)
        y -= leading


def _draw_justified_text(
    pdf: canvas.Canvas,
    text: str,
    x: float,
    top: float,
    width: float,
    size: float = 8.2,
    leading: float = 12,
) -> None:
    lines = _wrap_lines(text, width, FONT_REGULAR, size)
    y = top
    pdf.setFillColor(TEXT)
    for index, line in enumerate(lines):
        words = line.split()
        text_object = pdf.beginText(x, y)
        text_object.setFont(FONT_REGULAR, size)
        if index < len(lines) - 1 and len(words) > 1:
            natural_width = stringWidth(line, FONT_REGULAR, size)
            spacing = (width - natural_width) / (len(words) - 1)
            if 0 <= spacing <= 2.4:
                text_object.setWordSpace(spacing)
        text_object.textLine(line)
        pdf.drawText(text_object)
        y -= leading


def _draw_page_background(pdf: canvas.Canvas) -> None:
    pdf.setFillColor(HexColor("#ffffff"))
    pdf.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)


def _exam_title(report: dict) -> str:
    title = str(report.get("examTitle") or report.get("testTitle") or "Examen BAC").strip()
    match = re.search(r"(20\d{2}).*?(?:varianta|grila)\s*(?:nr\.?\s*)?(\d+)", title, re.IGNORECASE)
    if match:
        return f"BAC Logică {match.group(1)} — Varianta {match.group(2)}"
    return title


def _duration_label(report: dict) -> str:
    raw_value = report.get("durationSeconds")
    if raw_value is None:
        raw_value = report.get("duration_seconds")
    try:
        seconds = max(0, int(float(raw_value or 0)))
    except (TypeError, ValueError):
        return str(raw_value or "—")
    if seconds <= 0:
        return "—"
    hours, remainder = divmod(seconds, 3600)
    minutes, remaining_seconds = divmod(remainder, 60)
    if hours:
        return f"{hours:02d}:{minutes:02d}:{remaining_seconds:02d}"
    return f"{minutes:02d}:{remaining_seconds:02d}"


def _status_details(item: dict) -> tuple[str, object]:
    status = str(item.get("itemStatus") or item.get("item_status") or "missing").lower()
    if status == "correct":
        return "CORECT", GREEN
    if status in {"incorrect", "partial"}:
        return "GREȘIT", RED
    if status == "needs_review":
        return "DE VERIFICAT", AMBER
    return "NECOMPLETAT", MUTED


def _answer_summary(item: dict, compact: bool = False) -> str:
    parts: list[str] = []
    for answer in _as_list(item.get("answers")):
        if answer.get("isMissing"):
            continue
        value = _answer_text(answer.get("value"))
        if value == "-":
            continue
        label = str(answer.get("label") or "Răspuns").strip()
        if compact and len(_as_list(item.get("answers"))) == 1:
            parts.append(f"Răspuns: {value}")
        else:
            parts.append(f"{label}: {value}")
    correct_display = str(item.get("correctAnswerDisplay") or item.get("correct_answer_display") or "").strip()
    if correct_display:
        parts.append(correct_display)
    return ("  •  " if compact else "\n").join(parts)


def _item_content(item: dict, compact: bool = False) -> str:
    prompt = str(item.get("prompt") or "").strip()
    answer = _answer_summary(item, compact=compact)
    if not answer:
        return prompt
    separator = "  •  " if compact else "\n"
    return f"{prompt}{separator}{answer}".strip()


def _vertical_item_content(item: dict) -> str:
    return _item_content(item)


def _item_images(item: dict) -> list[bytes]:
    images: list[bytes] = []
    for answer in _as_list(item.get("answers")):
        image_bytes = _image_source(answer.get("value"))
        if image_bytes:
            images.append(image_bytes)
    return images


def _draw_item_images(
    pdf: canvas.Canvas,
    images: list[bytes],
    x: float,
    y: float,
    width: float,
    height: float,
) -> None:
    if not images or width <= 8 or height <= 8:
        return
    visible_images = images[:3]
    gap = 4
    tile_width = (width - gap * (len(visible_images) - 1)) / len(visible_images)
    for index, image_bytes in enumerate(visible_images):
        tile_x = x + index * (tile_width + gap)
        pdf.setFillColor(HexColor("#f7faf9"))
        pdf.setStrokeColor(HexColor("#d9e3e0"))
        pdf.roundRect(tile_x, y, tile_width, height, 3, fill=1, stroke=1)
        try:
            pdf.drawImage(
                ImageReader(io.BytesIO(image_bytes)),
                tile_x + 3,
                y + 3,
                width=max(2, tile_width - 6),
                height=max(2, height - 6),
                preserveAspectRatio=True,
                anchor="c",
                mask="auto",
            )
        except Exception:
            pdf.setFillColor(MUTED)
            pdf.setFont(FONT_REGULAR, 4.8)
            pdf.drawCentredString(tile_x + tile_width / 2, y + height / 2, "Diagramă indisponibilă")


def _completion_stats(report: dict) -> tuple[int, int, int]:
    items = [
        item
        for section in _as_list(report.get("sections"))
        for item in _as_list(section.get("items"))
    ]
    if items:
        total = len(items)
        answered = sum(
            1
            for item in items
            if any(not _answer_is_missing(answer) for answer in _as_list(item.get("answers")))
        )
    else:
        total = int(report.get("totalItems") or report.get("total_items") or 0)
        answered = int(report.get("answeredCount") or report.get("answered_count") or 0)
    percentage = round((answered / total) * 100) if total else 0
    return answered, total, percentage


def _draw_footer(pdf: canvas.Canvas, title: str, page_number: int) -> None:
    x_left = 42
    x_right = PAGE_W - 42
    pdf.setStrokeColor(HexColor("#0d5c59"))
    pdf.setLineWidth(0.65)
    pdf.line(x_left, 38, x_right, 38)
    pdf.setFont(FONT_REGULAR, 6.8)
    pdf.setFillColor(HexColor("#666666"))
    footer_title = title if stringWidth(title, FONT_REGULAR, 6.8) <= 360 else "Raport examen BAC"
    pdf.drawString(x_left, 25, footer_title)
    pdf.drawRightString(x_right, 25, f"Pagina {page_number} din 2")


def _draw_brand_header(pdf: canvas.Canvas) -> None:
    left = 42
    right = PAGE_W - 42
    pdf.setFillColor(HexColor("#0d5c59"))
    pdf.setFont(FONT_SERIF_BOLD, 22)
    pdf.drawString(left, PAGE_H - 46, "Logica")
    pdf.setFont(FONT_SERIF, 8.5)
    pdf.drawString(left + 57, PAGE_H - 59, "by A mentor")
    pdf.setFillColor(HexColor("#666666"))
    pdf.setFont(FONT_REGULAR, 8)
    pdf.drawRightString(right, PAGE_H - 49, "Raport examen BAC")
    pdf.setStrokeColor(HexColor("#b8c2bf"))
    pdf.setLineWidth(0.6)
    pdf.line(left, PAGE_H - 70, right, PAGE_H - 70)


def _draw_report_intro(pdf: canvas.Canvas, report: dict, title: str) -> None:
    left = 42
    divider_x = 396
    top = PAGE_H - 98
    pdf.setFont(FONT_BOLD, 8.2)
    pdf.setFillColor(HexColor("#0d5c59"))
    pdf.drawString(left, top, "RAPORT FINALIZARE BAC")
    _draw_fitted_text(pdf, title, left, top - 13, divider_x - left - 20, 35, FONT_SERIF_BOLD, 18, 12, HexColor("#111111"))
    pdf.setFont(FONT_SERIF, 9.5)
    pdf.setFillColor(TEXT)
    pdf.drawString(left, top - 59, "Elev:")
    pdf.setFont(FONT_SERIF_BOLD, 9.5)
    pdf.setFillColor(HexColor("#0d5c59"))
    pdf.drawString(left + 27, top - 59, str(report.get("studentName") or report.get("student_name") or "Elev"))
    pdf.setStrokeColor(HexColor("#c7cfcc"))
    pdf.setLineWidth(0.7)
    pdf.line(divider_x, top + 8, divider_x, top - 72)
    intro = (
        "Raportul prezintă gradul de completare, răspunsurile elevului și statusul fiecărui item. "
        "Pentru itemii greșiți apare și varianta corectă."
    )
    _draw_justified_text(pdf, intro, divider_x + 24, top + 1, PAGE_W - 42 - divider_x - 24, 8.1, 11.4)


def _draw_completion_ring(
    pdf: canvas.Canvas,
    center_x: float,
    center_y: float,
    answered: int,
    total: int,
    percentage: int,
) -> None:
    radius = 39
    pdf.setLineWidth(8)
    pdf.setStrokeColor(HexColor("#e6e7e4"))
    pdf.circle(center_x, center_y, radius, fill=0, stroke=1)
    pdf.setStrokeColor(HexColor("#0d5c59"))
    clamped_percentage = min(100, max(0, percentage))
    if clamped_percentage:
        pdf.arc(
            center_x - radius,
            center_y - radius,
            center_x + radius,
            center_y + radius,
            90,
            -360 * clamped_percentage / 100,
        )
    pdf.setFillColor(HexColor("#111111"))
    pdf.setFont(FONT_SERIF_BOLD, 18)
    pdf.drawCentredString(center_x, center_y + 3, f"{percentage}%")
    pdf.setFont(FONT_REGULAR, 6.8)
    pdf.drawCentredString(center_x, center_y - 13, "AI RĂSPUNS LA")
    pdf.setFont(FONT_BOLD, 6.8)
    pdf.drawCentredString(center_x, center_y - 23, f"{answered} DIN {total}")


def _draw_stats(pdf: canvas.Canvas, report: dict) -> None:
    left = 42
    right = PAGE_W - 42
    top = PAGE_H - 202
    height = 96
    pdf.setFillColor(HexColor("#ffffff"))
    pdf.setStrokeColor(HexColor("#d9dfdd"))
    pdf.setLineWidth(0.7)
    pdf.roundRect(left, top - height, right - left, height, 5, fill=1, stroke=1)
    widths = [142, 128, 128, right - left - 398]
    x = left
    for width in widths[:-1]:
        x += width
        pdf.line(x, top - height + 12, x, top - 12)
    answered, total, completion_percentage = _completion_stats(report)
    _draw_completion_ring(
        pdf,
        left + widths[0] / 2,
        top - height / 2,
        answered,
        total,
        completion_percentage,
    )
    metrics = [
        (report.get("correctCount", report.get("correct_count", 0)), "CORECTE", HexColor("#0d5c59")),
        (report.get("wrongCount", report.get("wrong_count", 0)), "GREȘITE", RED),
        (_duration_label(report), "TIMP COMPLETARE", HexColor("#0d5c59")),
    ]
    x = left + widths[0]
    for index, (value, label, color) in enumerate(metrics):
        width = widths[index + 1]
        center = x + width / 2
        pdf.setFillColor(color)
        pdf.setFont(FONT_SERIF_BOLD, 20 if index < 2 else 15)
        pdf.drawCentredString(center, top - 45, str(value))
        pdf.setFillColor(HexColor("#333333"))
        pdf.setFont(FONT_REGULAR, 6.8)
        pdf.drawCentredString(center, top - 65, label)
        x += width


def _draw_section_heading(pdf: canvas.Canvas, title: str, y: float) -> None:
    center = PAGE_W / 2
    pdf.setFont(FONT_SERIF_BOLD, 11.5)
    title_width = stringWidth(title.upper(), FONT_SERIF_BOLD, 11.5)
    pdf.setStrokeColor(HexColor("#b9c2bf"))
    pdf.setLineWidth(0.6)
    pdf.line(42, y + 3, center - title_width / 2 - 12, y + 3)
    pdf.line(center + title_width / 2 + 12, y + 3, PAGE_W - 42, y + 3)
    pdf.setFillColor(HexColor("#0d5c59"))
    pdf.drawCentredString(center, y, title.upper())


def _numeric_item(item: dict) -> bool:
    label = str(item.get("label") or "").strip()
    return bool(re.fullmatch(r"\d+", label) or re.fullmatch(r"I[._]A[._]\d+", label, re.IGNORECASE))


def _item_code(item: dict, compact: bool = False) -> str:
    label = str(item.get("label") or "").strip()
    identifier = str(item.get("id") or "").strip()
    if compact:
        numeric_match = re.search(r"(\d+)$", label)
        if numeric_match:
            return numeric_match.group(1)
    candidate = label if label and len(label) <= 12 and " " not in label else identifier
    return (candidate or label or "Item").replace("_", ".")


def _draw_compact_card(pdf: canvas.Canvas, item: dict, x: float, top: float, width: float, height: float) -> None:
    label = _item_code(item, compact=True)
    status_label, status_color = _status_details(item)
    pdf.setStrokeColor(HexColor("#e0e4e2"))
    pdf.setFillColor(HexColor("#ffffff"))
    pdf.roundRect(x, top - height, width, height, 4, fill=1, stroke=1)
    center_y = top - height / 2
    radius = min(10, max(7, height * 0.22))
    pdf.setFillColor(HexColor("#0d5c59"))
    pdf.circle(x + 22, center_y, radius, fill=1, stroke=0)
    pdf.setFillColor(HexColor("#ffffff"))
    pdf.setFont(FONT_BOLD, min(7.2, radius * 0.72))
    pdf.drawCentredString(x + 22, center_y - 2.5, label)
    status_width = 62
    pdf.setFillColor(status_color)
    pdf.setFont(FONT_BOLD, 5.8)
    pdf.drawRightString(x + width - 9, center_y - 2, status_label)
    text_x = x + 43
    text_width = width - 43 - status_width
    _draw_fitted_text(
        pdf,
        _item_content(item, compact=True),
        text_x,
        top - 7,
        text_width,
        height - 12,
        FONT_SERIF,
        7.4,
        4.5,
        HexColor("#202020"),
    )


def _draw_wide_card(pdf: canvas.Canvas, item: dict, x: float, top: float, width: float, height: float) -> None:
    label = _item_code(item)
    status_label, status_color = _status_details(item)
    images = _item_images(item)
    pdf.setStrokeColor(HexColor("#e0e4e2"))
    pdf.setFillColor(HexColor("#ffffff"))
    pdf.roundRect(x, top - height, width, height, 4, fill=1, stroke=1)
    pdf.setFillColor(HexColor("#0d5c59"))
    pdf.setFont(FONT_SERIF_BOLD, 10.5)
    pdf.drawString(x + 12, top - 20, label)
    pdf.setFillColor(status_color)
    pdf.setFont(FONT_BOLD, 6.3)
    pdf.drawRightString(x + width - 10, top - 20, status_label)
    content_x = x + 52
    image_width = min(174, max(66, len(images) * 58)) if images else 0
    content_width = width - 52 - 72 - image_width - (8 if images else 0)
    _draw_fitted_text(
        pdf,
        _item_content(item),
        content_x,
        top - 9,
        content_width,
        height - 14,
        FONT_SERIF,
        7.5,
        4.5,
        HexColor("#202020"),
    )
    if images:
        _draw_item_images(
            pdf,
            images,
            content_x + content_width + 8,
            top - height + 8,
            image_width,
            max(12, height - 34),
        )


def _draw_vertical_cards(
    pdf: canvas.Canvas,
    items: list[dict],
    top: float,
    bottom: float,
) -> None:
    if not items:
        return
    left = 42
    width = PAGE_W - 84
    gap = 4
    height = (top - bottom - gap * (len(items) - 1)) / len(items)
    current_top = top
    for item in items:
        status_label, status_color = _status_details(item)
        images = _item_images(item)
        pdf.setStrokeColor(HexColor("#e0e4e2"))
        pdf.setFillColor(HexColor("#ffffff"))
        pdf.roundRect(left, current_top - height, width, height, 4, fill=1, stroke=1)
        code_width = 52
        status_width = 78
        pdf.setStrokeColor(HexColor("#edf0ef"))
        pdf.line(left + code_width, current_top, left + code_width, current_top - height)
        pdf.setFillColor(HexColor("#0d5c59"))
        pdf.setFont(FONT_SERIF_BOLD, min(10.5, max(6.3, height * 0.16)))
        pdf.drawCentredString(left + code_width / 2, current_top - height / 2 - 3, _item_code(item))
        pdf.setFillColor(status_color)
        pdf.setFont(FONT_REGULAR, min(6.7, max(4.8, height * 0.11)))
        pdf.drawCentredString(left + width - status_width / 2, current_top - height / 2 - 2, status_label)
        text_x = left + code_width + 14
        image_width = min(150, max(62, len(images) * 54)) if images else 0
        text_width = width - code_width - status_width - 22 - image_width - (8 if images else 0)
        vertical_padding = min(9, max(3, height * 0.12))
        _draw_fitted_text(
            pdf,
            _vertical_item_content(item),
            text_x,
            current_top - vertical_padding,
            text_width,
            height - vertical_padding * 2,
            FONT_SERIF,
            min(7.8, max(3.8, height * 0.12)),
            2.8,
            HexColor("#202020"),
        )
        if images:
            _draw_item_images(
                pdf,
                images,
                text_x + text_width + 8,
                current_top - height + vertical_padding,
                image_width,
                max(8, height - vertical_padding * 2),
            )
        current_top -= height + gap


def _section_note(items: list[dict]) -> str:
    if items and all(_status_details(item)[0] == "NECOMPLETAT" for item in items):
        return "Toți itemii de mai jos sunt necompletați."
    return "Rezultatele sunt afișate pentru fiecare item în parte."


def _draw_page_one(pdf: canvas.Canvas, report: dict, title: str, section: dict) -> None:
    _draw_page_background(pdf)
    _draw_brand_header(pdf)
    _draw_report_intro(pdf, report, title)
    _draw_stats(pdf, report)
    _draw_section_heading(pdf, str(section.get("title") or "Subiectul I"), PAGE_H - 323)
    items = _as_list(section.get("items"))
    compact_items = [item for item in items if _numeric_item(item)]
    wide_items = [item for item in items if not _numeric_item(item)]
    grid_top = PAGE_H - 340
    wide_top = 294
    if compact_items:
        columns = 2
        rows = (len(compact_items) + columns - 1) // columns
        gap_x = 7
        gap_y = 5
        card_width = (PAGE_W - 84 - gap_x) / 2
        card_height = (grid_top - wide_top - 8 - gap_y * max(0, rows - 1)) / max(1, rows)
        for index, item in enumerate(compact_items):
            column = index // rows
            row = index % rows
            x = 42 + column * (card_width + gap_x)
            top = grid_top - row * (card_height + gap_y)
            _draw_compact_card(pdf, item, x, top, card_width, card_height)
    if wide_items:
        gap = 6
        bottom = 56
        height = (wide_top - bottom - gap * (len(wide_items) - 1)) / len(wide_items)
        current_top = wide_top
        for item in wide_items:
            _draw_wide_card(pdf, item, 42, current_top, PAGE_W - 84, height)
            current_top -= height + gap
    _draw_footer(pdf, title, 1)


def _draw_page_two(pdf: canvas.Canvas, title: str, section_two: dict, section_three: dict) -> None:
    _draw_page_background(pdf)
    items_two = _as_list(section_two.get("items"))
    items_three = _as_list(section_three.get("items"))
    total_items = max(1, len(items_two) + len(items_three))
    usable_card_height = 610
    section_two_height = usable_card_height * len(items_two) / total_items
    section_three_height = usable_card_height - section_two_height
    heading_two_y = PAGE_H - 54
    _draw_section_heading(pdf, str(section_two.get("title") or "Subiectul al II-lea"), heading_two_y)
    pdf.setFont(FONT_REGULAR, 7.2)
    pdf.setFillColor(HexColor("#333333"))
    pdf.drawCentredString(PAGE_W / 2, heading_two_y - 20, _section_note(items_two))
    cards_two_top = heading_two_y - 38
    cards_two_bottom = cards_two_top - section_two_height
    _draw_vertical_cards(pdf, items_two, cards_two_top, cards_two_bottom)
    heading_three_y = cards_two_bottom - 32
    _draw_section_heading(pdf, str(section_three.get("title") or "Subiectul al III-lea"), heading_three_y)
    pdf.setFont(FONT_REGULAR, 7.2)
    pdf.setFillColor(HexColor("#333333"))
    pdf.drawCentredString(PAGE_W / 2, heading_three_y - 20, _section_note(items_three))
    cards_three_top = heading_three_y - 38
    cards_three_bottom = max(56, cards_three_top - section_three_height)
    _draw_vertical_cards(pdf, items_three, cards_three_top, cards_three_bottom)
    _draw_footer(pdf, title, 2)


def _generate_pdf(report: dict, output_path: Path) -> None:
    sections = _as_list(report.get("sections"))
    section_one = sections[0] if len(sections) > 0 else {"title": "Subiectul I", "items": []}
    section_two = sections[1] if len(sections) > 1 else {"title": "Subiectul al II-lea", "items": []}
    section_three = sections[2] if len(sections) > 2 else {"title": "Subiectul al III-lea", "items": []}
    title = _exam_title(report)
    pdf = canvas.Canvas(str(output_path), pagesize=A4)
    pdf.setTitle(f"Raport BAC - {title}")
    pdf.setAuthor("Logica by A mentor")
    _draw_page_one(pdf, report, title, section_one)
    pdf.showPage()
    _draw_page_two(pdf, title, section_two, section_three)
    pdf.save()


def create_bac_student_report(current_user: dict, report: dict) -> dict:
    _ensure_dirs()
    report_id = str(uuid.uuid4())
    submitted_at = report.get("finalizedAt") or _now_iso()
    student_name = report.get("studentName") or current_user.get("display_name") or "Elev"
    graded_report = _grade_report_payload(report)
    payload = {
        **graded_report,
        "id": report_id,
        "reportId": report_id,
        "testType": "bac",
        "test_type": "bac",
        "status": "submitted",
        "statusLabel": "Finalizat",
        "submittedAt": submitted_at,
        "submitted_at": submitted_at,
        "studentName": student_name,
        "student_name": student_name,
        "studentFirstName": current_user.get("first_name", ""),
        "student_first_name": current_user.get("first_name", ""),
        "studentLastName": current_user.get("last_name", ""),
        "student_last_name": current_user.get("last_name", ""),
        "studentEmail": report.get("studentEmail") or report.get("student_email") or current_user.get("email") or "",
        "student_email": report.get("studentEmail") or report.get("student_email") or current_user.get("email") or "",
        "testTitle": report.get("examTitle") or "Exercițiu BAC 2025, Model",
        "test_title": report.get("examTitle") or "Exercițiu BAC 2025, Model",
        "scorePercent": graded_report.get("scorePercent", 0),
        "score_percentage": graded_report.get("score_percentage", 0),
        "correctCount": graded_report.get("correctCount", 0),
        "correct_count": graded_report.get("correct_count", 0),
        "wrongCount": graded_report.get("wrongCount", 0),
        "wrong_count": graded_report.get("wrong_count", 0),
        "durationSeconds": report.get("durationSeconds") or report.get("duration_seconds") or 0,
        "duration_seconds": report.get("duration_seconds") or report.get("durationSeconds") or 0,
        "uniqueCode": report_id,
        "unique_code": report_id,
    }
    json_path = REPORT_JSON_DIR / f"{report_id}.json"
    pdf_path = REPORT_PDF_DIR / f"{_safe_component(student_name)}_{report_id}.pdf"
    payload["reportJsonPath"] = str(json_path)
    payload["reportPdfPath"] = str(pdf_path)
    payload["report_json_path"] = str(json_path)
    payload["report_pdf_path"] = str(pdf_path)
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    _generate_pdf(payload, pdf_path)
    return payload


def _refresh_stored_report(path: Path, report: dict) -> dict:
    refreshed = _grade_report_payload(report)
    if refreshed == report:
        return report

    refreshed["reportJsonPath"] = str(path)
    refreshed["report_json_path"] = str(path)
    pdf_path_value = refreshed.get("reportPdfPath") or refreshed.get("report_pdf_path") or ""
    pdf_path = Path(pdf_path_value) if pdf_path_value else None
    if pdf_path is not None:
        refreshed["reportPdfPath"] = str(pdf_path)
        refreshed["report_pdf_path"] = str(pdf_path)
    path.write_text(json.dumps(refreshed, ensure_ascii=False, indent=2), encoding="utf-8")
    if pdf_path is not None:
        _generate_pdf(refreshed, pdf_path)
    return refreshed


def _backfill_stored_student_email(path: Path, report: dict) -> dict:
    existing_email = str(report.get("studentEmail") or report.get("student_email") or "").strip()
    if existing_email:
        return report
    resolved_email = resolve_unique_student_email(report.get("studentName") or report.get("student_name") or "")
    if not resolved_email:
        return report
    enriched = {**report, "studentEmail": resolved_email, "student_email": resolved_email}
    path.write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")
    return enriched


def list_bac_student_reports(current_user: dict) -> list[dict]:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Doar adminul poate vedea rapoartele BAC.")
    _ensure_dirs()
    reports = []
    for path in REPORT_JSON_DIR.glob("*.json"):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        reports.append(_backfill_stored_student_email(path, _refresh_stored_report(path, payload)))
    return sorted(reports, key=lambda entry: entry.get("submittedAt") or "", reverse=True)


def get_bac_student_report(current_user: dict, report_id: str) -> dict:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Doar adminul poate accesa rapoartele BAC.")
    path = REPORT_JSON_DIR / f"{report_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Raportul BAC nu există.")
    return _refresh_stored_report(path, json.loads(path.read_text(encoding="utf-8")))


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
    return _normalize_answer(left) == _normalize_answer(right)


def get_bac_student_report_for_user(current_user: dict, report_id: str) -> dict:
    path = REPORT_JSON_DIR / f"{report_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Raportul BAC nu există.")
    report = _refresh_stored_report(path, json.loads(path.read_text(encoding="utf-8")))
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
    raise HTTPException(status_code=403, detail="Poți descărca doar raportul tău BAC.")


def get_bac_student_report_pdf_path(current_user: dict, report_id: str) -> Path:
    report = get_bac_student_report(current_user, report_id)
    pdf_path = Path(report.get("reportPdfPath") or "")
    _generate_pdf(report, pdf_path)
    return pdf_path


def get_bac_student_report_pdf_path_for_user(current_user: dict, report_id: str) -> Path:
    report = get_bac_student_report_for_user(current_user, report_id)
    pdf_path = Path(report.get("reportPdfPath") or "")
    _generate_pdf(report, pdf_path)
    return pdf_path


def get_bac_student_report_email_delivery(current_user: dict, report_id: str) -> dict:
    report = get_bac_student_report(current_user, report_id)
    student_email = str(report.get("studentEmail") or report.get("student_email") or "").strip()
    if not student_email:
        student_email = resolve_unique_student_email(report.get("studentName") or report.get("student_name") or "")
        if student_email:
            report["studentEmail"] = student_email
            report["student_email"] = student_email
            (REPORT_JSON_DIR / f"{report_id}.json").write_text(
                json.dumps(report, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
    if not student_email or student_email.endswith("@local.invalid"):
        raise HTTPException(status_code=422, detail="Raportul BAC nu are email de elev salvat.")
    pdf_path = get_bac_student_report_pdf_path(current_user, report_id)
    return {
        "recipient_email": student_email,
        "report": report,
        "pdf_path": str(pdf_path),
        "pdf_file_name": pdf_path.name,
    }


def build_bac_student_reports_pdf_zip(current_user: dict, report_ids: list[str]) -> Path:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Doar adminul poate descarca arhive BAC.")
    _ensure_dirs()
    archive_path = REPORT_EXPORT_DIR / f"rapoarte_bac_{uuid.uuid4().hex[:10]}.zip"
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for index, report_id in enumerate(report_ids, start=1):
            report = get_bac_student_report(current_user, report_id)
            pdf_path = get_bac_student_report_pdf_path(current_user, report_id)
            archive.write(pdf_path, arcname=f"{index:03d}_{_safe_component(report.get('studentName') or 'elev')}_{pdf_path.name}")
    return archive_path


def delete_bac_student_reports(current_user: dict, report_ids: list[str]) -> dict:
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Doar adminul poate sterge rapoarte BAC.")
    _ensure_dirs()
    deleted_ids = []
    missing_ids = []
    removed_files = []

    for report_id in report_ids:
        try:
            normalized_id = str(uuid.UUID(report_id))
        except ValueError:
            missing_ids.append(report_id)
            continue

        json_path = REPORT_JSON_DIR / f"{normalized_id}.json"
        if not json_path.exists():
            missing_ids.append(report_id)
            continue

        report = json.loads(json_path.read_text(encoding="utf-8"))
        pdf_path_value = report.get("reportPdfPath") or report.get("report_pdf_path") or ""
        pdf_path = Path(pdf_path_value).resolve() if pdf_path_value else None
        pdf_root = REPORT_PDF_DIR.resolve()

        json_path.unlink()
        removed_files.append(str(json_path))
        if pdf_path is not None and pdf_path.is_relative_to(pdf_root) and pdf_path.is_file():
            pdf_path.unlink()
            removed_files.append(str(pdf_path))
        deleted_ids.append(normalized_id)

    if not deleted_ids:
        raise HTTPException(status_code=404, detail="Rapoartele BAC selectate nu mai exista.")
    return {
        "deleted_count": len(deleted_ids),
        "deleted_report_ids": deleted_ids,
        "not_found_report_ids": missing_ids,
        "removed_files_count": len(removed_files),
    }

