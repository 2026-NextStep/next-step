import json
import logging
import math
from datetime import date, timedelta

import pymysql
import requests

from fastapi import APIRouter, HTTPException

from app.core.config import settings

router = APIRouter(prefix="/api/job-postings", tags=["job-postings"])
logger = logging.getLogger(__name__)

FETCH_URL = "https://opendata.alio.go.kr/new/odaApiMng/recrutInquiryAjaxList.do"
PAGE_SIZE = 100

UPSERT_LIST_SQL = """
    INSERT INTO job_posting_list
        (posting_id, company_name, job_title, status,
         employment_type, recruit_type, work_location, recruit_field,
         start_date, end_date)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        job_title = VALUES(job_title),
        status = VALUES(status),
        employment_type = VALUES(employment_type),
        recruit_type = VALUES(recruit_type),
        work_location = VALUES(work_location),
        recruit_field = VALUES(recruit_field),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date)
"""

UPSERT_DETAIL_SQL = """
    INSERT INTO job_posting_detail
        (posting_id, recruit_count, education, original_link,
         recruit_positions, qualification_items, selection_steps)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
        recruit_count = VALUES(recruit_count),
        education = VALUES(education),
        original_link = VALUES(original_link),
        recruit_positions = VALUES(recruit_positions),
        qualification_items = VALUES(qualification_items),
        selection_steps = VALUES(selection_steps)
"""


def _get_db_connection():
    return pymysql.connect(
        host=settings.db_host,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        charset="utf8mb4",
    )


def _ymd(s) -> str | None:
    s = str(s).strip() if s else ""
    return f"{s[:4]}-{s[4:6]}-{s[6:]}" if len(s) == 8 and s.isdigit() else None


def _status(end_ymd) -> str:
    d = _ymd(end_ymd)
    if not d:
        return "접수중"
    end = date.fromisoformat(d)
    today = date.today()
    if end < today:
        return "마감"
    if end <= today + timedelta(days=7):
        return "마감임박"
    return "접수중"


def _fetch_page(page_no: int) -> dict:
    r = requests.post(
        FETCH_URL,
        data={"pageNo": str(page_no), "numOfRows": str(PAGE_SIZE), "ongoingYn": "Y"},
        timeout=30,
    )
    r.raise_for_status()
    return json.loads(r.content.decode("utf-8"))


def _row_list(item: dict) -> tuple:
    return (
        item.get("recrutPblntSn"),
        (item.get("instNm") or "")[:100],
        (item.get("recrutPbancTtl") or "")[:300],
        _status(item.get("pbancEndYmd")),
        (item.get("hireTypeNmLst") or "")[:50],
        (item.get("recrutSeNm") or "")[:50],
        (item.get("workRgnNmLst") or "")[:200],
        (item.get("ncsCdNmLst") or "")[:200],
        _ymd(item.get("pbancBgngYmd")),
        _ymd(item.get("pbancEndYmd")),
    )


def _row_detail(item: dict) -> tuple:
    qual_fields = [
        ("지원자격", item.get("aplyQlfcCn") or ""),
        ("결격사유", item.get("disqlfcRsn") or ""),
        ("우대조건", item.get("prefCondCn") or ""),
        ("우대사항", item.get("prefCn") or ""),
        ("전형방법", item.get("scrnprcdrMthdExpln") or ""),
    ]
    qual_items = [{"type": k, "content": v} for k, v in qual_fields if v]

    positions = {
        "ncs_fields": (item.get("ncsCdNmLst") or "").split(",") if item.get("ncsCdNmLst") else [],
        "total_count": item.get("recrutNope") or 0,
    }

    steps = item.get("steps") or []

    return (
        item.get("recrutPblntSn"),
        str(item.get("recrutNope") or "")[:50],
        (item.get("acbgCondNmLst") or "")[:100],
        (item.get("srcUrl") or "")[:1000],
        json.dumps(positions, ensure_ascii=False),
        json.dumps(qual_items, ensure_ascii=False) if qual_items else None,
        json.dumps(steps, ensure_ascii=False) if steps else None,
    )


def sync_job_postings() -> dict:
    logger.info("채용공고 동기화 시작")

    first = _fetch_page(1)
    total = first.get("data", {}).get("totalCount", 0)
    pages = math.ceil(total / PAGE_SIZE) if total else 0

    all_items: list[dict] = list(first.get("data", {}).get("result", []))
    for page in range(2, pages + 1):
        data = _fetch_page(page)
        all_items.extend(data.get("data", {}).get("result", []))

    all_items = [item for item in all_items if item.get("recrutPblntSn")]

    conn = _get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.executemany(UPSERT_LIST_SQL, [_row_list(item) for item in all_items])
            cursor.executemany(UPSERT_DETAIL_SQL, [_row_detail(item) for item in all_items])
        conn.commit()
    finally:
        conn.close()

    logger.info(f"채용공고 동기화 완료 - {len(all_items)}건 upsert")
    return {"total": len(all_items)}


@router.post("/sync", summary="채용공고 수동 동기화")
def trigger_sync():
    try:
        result = sync_job_postings()
        return {"status": "success", **result}
    except requests.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"외부 API 오류: {e}")
    except Exception as e:
        logger.exception("채용공고 동기화 실패")
        raise HTTPException(status_code=500, detail=str(e))
