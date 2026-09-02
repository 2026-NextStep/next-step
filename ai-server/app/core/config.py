import logging
import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


@dataclass
class Settings:
    openai_api_key: str = field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    gcp_project_id: str = field(default_factory=lambda: os.getenv("GCP_PROJECT_ID", ""))
    gcp_location: str = field(default_factory=lambda: os.getenv("GCP_LOCATION", "us"))
    gcp_processor_id: str = field(default_factory=lambda: os.getenv("GCP_PROCESSOR_ID", ""))
    google_application_credentials: str = field(
        default_factory=lambda: os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "./gcp-credentials.json")
    )
    tavily_api_key: str = field(default_factory=lambda: os.getenv("TAVILY_API_KEY", ""))
    db_host: str = field(default_factory=lambda: os.getenv("DB_HOST", "localhost"))
    db_user: str = field(default_factory=lambda: os.getenv("DB_USER", "root"))
    db_password: str = field(default_factory=lambda: os.getenv("DB_PASSWORD", ""))
    db_name: str = field(default_factory=lambda: os.getenv("DB_NAME", "nextstep"))


settings = Settings()

_REQUIRED: dict[str, str] = {
    "OPENAI_API_KEY": settings.openai_api_key,
    "GCP_PROJECT_ID": settings.gcp_project_id,
    "GCP_PROCESSOR_ID": settings.gcp_processor_id,
    "GOOGLE_APPLICATION_CREDENTIALS": settings.google_application_credentials,
}


def validate_config() -> None:
    missing = [key for key, val in _REQUIRED.items() if not val]
    if missing:
        raise RuntimeError(
            f"필수 환경 변수 누락: {', '.join(missing)}\n"
            ".env 파일을 확인하세요. (.env.example 참고)"
        )

    logger.info("OPENAI_API_KEY                 : 로드됨")
    logger.info("GOOGLE_APPLICATION_CREDENTIALS : %s", settings.google_application_credentials)
    logger.info("GCP_PROJECT_ID                 : %s", settings.gcp_project_id)
    logger.info("GCP_PROCESSOR_ID               : 로드됨")
    logger.info("GCP_LOCATION                   : %s", settings.gcp_location)