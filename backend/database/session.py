import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Look for a DATABASE_URL environment variable. Default to SQLite if not found.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./school.db")

# 2. Only apply "check_same_thread" if we are actually using SQLite
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()