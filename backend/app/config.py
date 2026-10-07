from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./waterquality.db"
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ]

settings = Settings()
