from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# 1. Determine connection arguments. SQLite requires check_same_thread=False
# because FastAPI endpoints can execute across multiple threads.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# 2. Create the Database Engine
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args=connect_args
)

# 3. Create a SessionLocal class.
# Each instance of SessionLocal will be a database session.
# autocommit=False ensures we control when transactions are committed.
# autoflush=False prevents automatic flushing of changes before we're ready.
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# 4. Create declarative Base class.
# Our SQLAlchemy models will inherit from this Base.
Base = declarative_base()

# 5. Dependency helper function to get a DB session.
# This yields a DB session to a FastAPI endpoint, then closes it when the request is done.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
