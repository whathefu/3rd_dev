# app/database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

Base = declarative_base()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    host = os.getenv("MARIADB_HOST", "127.0.0.1")
    port = os.getenv("MARIADB_PORT", "3306")
    name = os.getenv("MARIADB_DATABASE", "ai_go")
    user = os.getenv("MARIADB_USER", "app_user")
    pwd  = os.getenv("MARIADB_PASSWORD", "app_pass")
    db_url = f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{name}?charset=utf8mb4"

print("Database URL:", db_url)

engine = create_engine(db_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
