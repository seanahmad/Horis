from starlette.config import Config
from databases import DatabaseURL

__all__ = ("DEBUG", "MODEL_FILE")

config = Config(".env")
DEBUG = config("DEBUG", bool, False)
MODEL_FILE = config("MODEL_FILE", str)
HORSES_DB_URL = config("HORSES_DB_URL", DatabaseURL)
