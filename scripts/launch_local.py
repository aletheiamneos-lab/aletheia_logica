from __future__ import annotations

import argparse
import ast
import os
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"
DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000
PREFERRED_FILENAMES = {
    "main.py": 0,
    "app.py": 1,
    "server.py": 2,
}


def _is_fastapi_constructor(node: ast.AST) -> bool:
    if isinstance(node, ast.Name):
        return node.id == "FastAPI"
    if isinstance(node, ast.Attribute):
        return node.attr == "FastAPI"
    return False


def _extract_assignment_target(node: ast.AST) -> str | None:
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name):
                return target.id
        return None

    if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
        return node.target.id

    return None


def _extract_call_node(node: ast.AST) -> ast.Call | None:
    value = None
    if isinstance(node, ast.Assign):
        value = node.value
    elif isinstance(node, ast.AnnAssign):
        value = node.value

    return value if isinstance(value, ast.Call) else None


def _candidate_priority(file_path: Path) -> tuple[int, int, str]:
    return (
        PREFERRED_FILENAMES.get(file_path.name, len(PREFERRED_FILENAMES)),
        len(file_path.relative_to(BACKEND_DIR).parts),
        file_path.as_posix(),
    )


def detect_fastapi_import_string() -> str:
    candidates: list[tuple[tuple[int, int, str], Path, str]] = []

    for file_path in BACKEND_DIR.rglob("*.py"):
        if "__pycache__" in file_path.parts:
            continue

        source = file_path.read_text(encoding="utf-8", errors="ignore")
        if "FastAPI" not in source:
            continue

        try:
            tree = ast.parse(source, filename=str(file_path))
        except SyntaxError:
            continue

        for node in ast.walk(tree):
            target_name = _extract_assignment_target(node)
            call_node = _extract_call_node(node)

            if not target_name or not call_node or not _is_fastapi_constructor(call_node.func):
                continue

            candidates.append((_candidate_priority(file_path), file_path, target_name))

    if not candidates:
        raise RuntimeError("Nu am gasit niciun obiect FastAPI in backend.")

    _, file_path, attribute_name = min(candidates, key=lambda entry: entry[0])
    relative_module = file_path.relative_to(BACKEND_DIR).with_suffix("")
    module_name = ".".join(relative_module.parts)
    return f"{module_name}:{attribute_name}"


def build_uvicorn_command(import_string: str, host: str, port: int, reload_enabled: bool) -> list[str]:
    command = [
        sys.executable,
        "-m",
        "uvicorn",
        import_string,
        "--app-dir",
        str(BACKEND_DIR),
        "--host",
        host,
        "--port",
        str(port),
    ]

    if reload_enabled:
        command.extend(["--reload", "--reload-dir", str(BACKEND_DIR)])

    return command


def main() -> None:
    parser = argparse.ArgumentParser(description="Porneste backend-ul FastAPI local.")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--no-reload", action="store_true")
    parser.add_argument("--print-import-string", action="store_true")
    args = parser.parse_args()

    import_string = detect_fastapi_import_string()

    if args.print_import_string:
        print(import_string)
        return

    command = build_uvicorn_command(
        import_string=import_string,
        host=args.host,
        port=args.port,
        reload_enabled=not args.no_reload,
    )
    raise SystemExit(subprocess.call(command, cwd=str(PROJECT_ROOT), env=os.environ.copy()))


if __name__ == "__main__":
    main()
