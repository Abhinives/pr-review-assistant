from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://postgres:abhi@localhost:5432/prreviewassistant"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()