import os
from pathlib import Path

from dotenv import dotenv_values

APP_TITLE = "Аким на 5 часов"
CORS_OPTIONS = {
    "allow_origins": ["*"],
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
DEFAULT_MODEL = "gpt-4o-mini"
AI_TIMEOUT_SECONDS = 15.0
ENV_FILE = Path(__file__).with_name(".env")


def get_setting(name: str) -> str | None:
    if name in os.environ:
        return os.environ[name] or None

    file_value = dotenv_values(ENV_FILE).get(name)
    return file_value if file_value else None
