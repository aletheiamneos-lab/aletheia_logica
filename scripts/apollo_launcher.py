from __future__ import annotations

import subprocess
from pathlib import Path

try:
    import tkinter as tk
    from tkinter import messagebox
except Exception:  # pragma: no cover - tkinter may be unavailable in some Python installs
    tk = None
    messagebox = None


PROJECT_ROOT = Path(__file__).resolve().parents[1]
START_SCRIPT = PROJECT_ROOT / "start-local.bat"


def show_error(message: str) -> None:
    if tk is None or messagebox is None:
        return

    root = tk.Tk()
    root.withdraw()
    messagebox.showerror("Apollo", message)
    root.destroy()


def main() -> int:
    if not START_SCRIPT.exists():
        show_error(f"Nu gasesc launcherul local: {START_SCRIPT}")
        return 1

    creation_flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    result = subprocess.run(
        ["cmd.exe", "/c", str(START_SCRIPT)],
        cwd=PROJECT_ROOT,
        creationflags=creation_flags,
        check=False,
    )

    if result.returncode != 0:
        show_error(
            "Pornirea aplicatiei nu a reusit complet. Verifica ferestrele backend/frontend sau ruleaza start-local.bat.",
        )

    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
