import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SUPABASE_URL = os.getenv("SUPABASE_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fintech_kyc")

engine = create_engine(SUPABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
