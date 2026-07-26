from __future__ import annotations

import argparse

try:
    from backend.app.database import initialize_database
except ModuleNotFoundError:
    from app.database import initialize_database


def main() -> None:
    parser = argparse.ArgumentParser(description="Inițializează și însămânțează baza de date SQLite.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Șterge baza de date existentă și recreează tabelele de la zero.",
    )
    args = parser.parse_args()

    db_path = initialize_database(reset=args.reset)
    print(f"Baza de date este pregatita la: {db_path}")


if __name__ == "__main__":
    main()
