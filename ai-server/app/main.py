import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analyze import router as analyze_router
from app.api.job_analysis import router as job_analysis_router
from app.api.latest_info import router as latest_info_router
from app.core.config import validate_config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("NextStep AI 서버 시작 중...")
    validate_config()
    logger.info("환경 변수 로드 완료 — 서버 준비됨")
    yield
    logger.info("NextStep AI 서버 종료")


app = FastAPI(
    title="NextStep AI Server",
    description="근로계약서 분석 AI 서버",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api/v1")
app.include_router(job_analysis_router)
app.include_router(latest_info_router)


@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "nextstep-ai"}


@app.get("/health")
def health_check() -> dict:
    return {"status": "healthy"}