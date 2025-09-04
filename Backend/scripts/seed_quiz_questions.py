import csv, os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.models.quiz import QuizQuestion

load_dotenv()
engine = create_engine(os.getenv("DB_URL"), pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def main(csv_path: str):
    db = SessionLocal()
    try:
        with open(csv_path, "r", encoding="utf-8") as f:
            rows = list(csv.DictReader(f))
        inserted = 0
        for r in rows:
            q = QuizQuestion(
                question=r["question"].strip(),
                option_a=r["option_a"].strip(),
                option_b=r["option_b"].strip(),
                option_c=r["option_c"].strip(),
                option_d=r["option_d"].strip(),
                answer=r["answer"].strip().upper(),
                explanation=(r.get("explanation") or None),
                law_reference=(r.get("law_reference") or None),
                level=(r.get("level") or "easy").strip(),
                
                
                )

            db.add(q); inserted += 1
        db.commit()
        print(f"Inserted: {inserted}")
    finally:
        db.close()

if __name__ == "__main__":
    csv_path = os.environ.get("CSV_PATH", "data/quiz_seed.csv")
    if not os.path.exists(csv_path):
        raise SystemExit(f"CSV not found: {csv_path}")
    main(csv_path)
