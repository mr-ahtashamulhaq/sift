"""Apply database migrations to Supabase.

Usage:
  1. Supabase Dashboard → Project Settings → Database → Connection string (URI)
  2. Add to backend/.env:  DATABASE_URL=postgresql://postgres.[ref]:[password]@...
  3. Run:  python scripts/setup_db.py
"""
from pathlib import Path
import sys

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

try:
    import psycopg2
except ImportError:
    print("Install psycopg2: pip install psycopg2-binary")
    sys.exit(1)

from config import settings


def main() -> None:
    db_url = settings.database_url or __import__("os").environ.get("DATABASE_URL")
    if not db_url:
        print("Missing DATABASE_URL in backend/.env")
        print("Get it from Supabase → Project Settings → Database → Connection string")
        print("\nOr paste migrations/setup.sql into Supabase SQL Editor manually.")
        sys.exit(1)

    sql_path = Path(__file__).resolve().parents[1] / "migrations" / "setup.sql"
    sql = sql_path.read_text(encoding="utf-8")

    print(f"Connecting to Supabase ({settings.supabase_url})...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
        print("Database setup complete.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
