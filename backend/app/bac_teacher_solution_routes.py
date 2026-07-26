from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from .auth_service import get_teacher_user

router = APIRouter(prefix="/bac/teacher-solutions", tags=["bac-teacher-solutions"])

TEACHER_SOLUTIONS_ROOT = Path(__file__).resolve().parent / "teacher_solutions"
DATA_ROOT = TEACHER_SOLUTIONS_ROOT / "bac_2025_model"
DATA_ROOT_2014_V4 = TEACHER_SOLUTIONS_ROOT / "bac_2014_v4"
DATA_ROOT_2015_V2 = TEACHER_SOLUTIONS_ROOT / "bac_2015_v2"
SUPPORTED_SOLUTIONS = {
    "2025-model": DATA_ROOT,
    "exercitiu-bac-2025-model": DATA_ROOT,
    "2014-v4": DATA_ROOT_2014_V4,
    "bac-2014-v4": DATA_ROOT_2014_V4,
    "exercitiu-bac-2014-v4": DATA_ROOT_2014_V4,
    "2015-v2": DATA_ROOT_2015_V2,
    "bac-2015-v2": DATA_ROOT_2015_V2,
    "exercitiu-bac-2015-v2": DATA_ROOT_2015_V2,
}


def _read_json(path: Path) -> dict:
    if not path.exists():
        raise HTTPException(status_code=404, detail="Rezolvarea profesorului nu este disponibila.")

    return json.loads(path.read_text(encoding="utf-8"))


@router.get("/{solution_slug}")
def read_teacher_solution(
    solution_slug: str,
    current_user: dict = Depends(get_teacher_user),
) -> dict:
    solution_dir = SUPPORTED_SOLUTIONS.get(solution_slug)
    if solution_dir is None:
        raise HTTPException(status_code=404, detail="Rezolvarea profesorului nu este disponibila.")

    solution = _read_json(solution_dir / "teacher_solution.json")
    diagram_contract = _read_json(solution_dir / "diagram_contract.json")

    return {
        "visibility": "teacher",
        "requested_by": current_user["role"],
        "solution": solution,
        "diagramContract": diagram_contract,
    }
