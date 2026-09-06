import asyncio
import logging
from contextlib import asynccontextmanager

import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analyze import router as analyze_router
from app.api.job_analysis import router as job_analysis_router
from app.api.job_posting import router as job_posting_router
from app.api.job_posting import sync_job_postings
from app.api.latest_info import router as latest_info_router
from app.api.latest_info import fetch_and_save as fetch_latest_info
from app.core.config import validate_config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def sync_latest_info():
    asyncio.run(fetch_latest_info())


KST = pytz.timezone("Asia/Seoul")
scheduler = BackgroundScheduler(timezone=KST)
scheduler.add_job(
    sync_job_postings,
    trigger=CronTrigger(hour=0, minute=0, timezone=KST),
    id="sync_job_postings",
    replace_existing=True,
)
scheduler.add_job(
    sync_latest_info,
    trigger=CronTrigger(hour=0, minute=5, timezone=KST),
    id="sync_latest_info",
    replace_existing=True,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("NextStep AI 서버 시작 중...")
    validate_config()
    logger.info("환경 변수 로드 완료 — 서버 준비됨")
    scheduler.start()
    job_next_run = scheduler.get_job("sync_job_postings").next_run_time
    info_next_run = scheduler.get_job("sync_latest_info").next_run_time
    logger.info(f"채용공고 동기화 스케줄러 시작 — 다음 실행: {job_next_run}")
    logger.info(f"취업정보 수집 스케줄러 시작 — 다음 실행: {info_next_run}")
    yield
    scheduler.shutdown()
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
app.include_router(job_posting_router)
app.include_router(latest_info_router)


@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "nextstep-ai"}


@app.get("/health")
def health_check() -> dict:
    return {"status": "healthy"}