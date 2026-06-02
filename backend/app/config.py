from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Default to a local SQLite database file named 'inventory.db' in the backend directory.
    # In Docker/Production, this will be overridden by the DATABASE_URL environment variable (pointing to PostgreSQL).
    DATABASE_URL: str = "sqlite:///./inventory.db"

    class Config:
        # Pydantic will search for a .env file to load variables from.
        env_file = ".env"
        # If the env file is missing, it won't crash and will use the defaults.
        env_file_encoding = "utf-8"

# Instantiating settings so we can import 'settings' in other parts of our application.
settings = Settings()
