from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# For SQLite, enable WAL mode to support high-concurrency without locking errors
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    from app import models
    Base.metadata.create_all(bind=engine)
    
    # Enable WAL mode in SQLite for concurrent reads and writes
    if "sqlite" in settings.DATABASE_URL:
        with engine.connect() as conn:
            conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
            conn.exec_driver_sql("PRAGMA synchronous=NORMAL;")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
