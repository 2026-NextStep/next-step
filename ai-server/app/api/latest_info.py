import json
import logging
from datetime import date, datetime

import pymysql
from fastapi import APIRouter, HTTPException
from google import genai
from pydantic import BaseModel
from tavily import TavilyClient

from app.core.config import settings
from app.services.llm_service import generate_json

router = APIRouter(prefix="/api/latest-info", tags=["latest-info"])
logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3.6-flash"

CATEGORIES = ["공기업 채용 동향", "대기업 채용 소식", "IT·스타트업 채용 트렌드", "취업시장 동향", "취업 전략"]
DEFAULT_CATEGORY = "기타"

CATEGORY_KEYWORDS = {
    "공기업 채용 동향": ["공기업", "공공기관"],
    "대기업 채용 소식": ["대기업"],
    "IT·스타트업 채용 트렌드": ["IT", "AI", "스타트업", "개발자"],
    "취업시장 동향": ["노동시장", "고용시장", "노동 시장"],
    "취업 전략": ["취업 전략", "취업전략", "이력서", "면접"],
}

gemini_client = genai.Client(api_key=settings.gemini_api_key)
tavily_client = TavilyClient(api_key=settings.tavily_api_key)

SYSTEM_PROMPT = """당신은 구직자를 위한 취업 시장 분석 전문가입니다.
뉴스 기사를 분석하여 구직자에게 유용한 정보를 JSON 형식으로만 반환합니다.
반드시 유효한 JSON만 반환하고 다른 텍스트나 마크다운은 포함하지 마세요."""

ARTICLE_PROMPT = """다음 뉴스 기사를 분석하여 구직자를 위한 취업 정보로 정리해주세요.

뉴스 제목: {title}
뉴스 내용: {content}

다음 JSON 형식으로만 반환하세요:
{{
  "title": "구직자 관점에서 재구성한 기사 제목 (40자 이내)",
  "sub_title": "기사의 핵심을 구직자 관점에서 2-3문장으로 요약",
  "ai_summary_3lines": "오늘 이 정보가 구직자에게 왜 중요한지 2-3문장으로 설명",
  "ai_full_summary": {{
    "badge": "다음 5개 중 정확히 하나만 그대로 적을 것: {categories}",
    "header": "구직자가 먼저 확인해야 할 포인트",
    "bullets": ["핵심 포인트 1 (구체적이고 실용적으로)", "핵심 포인트 2", "핵심 포인트 3"]
  }},
  "ai_today_brief": "시장 흐름을 구직자 관점에서 2단락으로 분석. 단락은 \\n\\n으로 구분",
  "ai_action": {{
    "quote": "이 상황에서 구직자가 취해야 할 핵심 전략을 한 문장으로",
    "bullets": ["구체적인 행동 1", "구체적인 행동 2", "구체적인 행동 3"],
    "card_items": [
      {{"dot": "bg-blue-500", "label": "가장 먼저 할 일", "text": "구체적인 첫 번째 행동"}},
      {{"dot": "bg-orange-400", "label": "놓치기 쉬운 포인트", "text": "주의해야 할 점"}},
      {{"dot": "bg-green-500", "label": "함께 보면 좋은 정보", "text": "추가로 확인할 정보"}}
    ]
  }}
}}"""

def build_search_queries(today: date) -> list[str]:
    y, m = today.year, today.month
    return [
        f"한국 취업 채용 공고 뉴스 {y}년 {m}월",
        f"공기업 대기업 채용 일정 {y}년",
        f"한국 IT 개발자 스타트업 채용 {y}",
        f"한국 취업 시장 노동시장 동향 {y}",
    ]

RELEVANCE_KEYWORDS = ["채용", "취업", "구인", "구직", "공고", "지원", "입사", "신입", "경력", "직무", "인턴"]


def normalize_category(badge: str) -> str:
    if badge in CATEGORIES:
        return badge
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in (badge or "") for kw in keywords):
            return category
    return DEFAULT_CATEGORY


def get_db_connection():
    return pymysql.connect(
        host=settings.db_host,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def save_to_db(data: dict, created_at: datetime | None = None) -> bool:
    """같은 제목의 기사가 이미 있으면 저장하지 않고 False 반환."""
    category = normalize_category(data.get("ai_full_summary", {}).get("badge", ""))
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1 FROM latest_info WHERE title = %s LIMIT 1", (data["title"],))
            if cursor.fetchone():
                return False
            cursor.execute(
                """INSERT INTO latest_info
                   (title, sub_title, ai_summary_3lines, ai_full_summary, ai_today_brief, ai_action, category, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, COALESCE(%s, NOW()))""",
                (
                    data["title"],
                    data["sub_title"],
                    data["ai_summary_3lines"],
                    json.dumps(data["ai_full_summary"], ensure_ascii=False),
                    data["ai_today_brief"],
                    json.dumps(data["ai_action"], ensure_ascii=False),
                    category,
                    created_at,
                ),
            )
        conn.commit()
        return True
    finally:
        conn.close()


async def fetch_and_save():
    logger.info("Starting latest info fetch job")
    saved = 0

    seen_titles: set[str] = set()
    articles: list[dict] = []

    for query in build_search_queries(date.today()):
        try:
            result = tavily_client.search(
                query=query,
                search_depth="advanced",
                max_results=4,
                include_raw_content=True,
                days=3,
            )
            for r in result.get("results", []):
                title = r.get("title", "")
                content = (r.get("content") or "") + (r.get("raw_content") or "")
                combined = title + content
                is_relevant = any(kw in combined for kw in RELEVANCE_KEYWORDS)
                if title not in seen_titles and is_relevant:
                    seen_titles.add(title)
                    articles.append(r)
        except Exception as e:
            logger.error(f"Tavily search failed for '{query}': {e}")

    today = date.today().strftime("%Y년 %m월 %d일")

    for article in articles[:10]:
        try:
            content = (article.get("raw_content") or article.get("content", ""))[:3000]
            prompt = f"오늘 날짜: {today}\n\n" + ARTICLE_PROMPT.format(
                title=article.get("title", ""),
                content=content,
                categories=", ".join(CATEGORIES),
            )
            data = generate_json(prompt, SYSTEM_PROMPT, temperature=0.4)
            if not save_to_db(data):
                logger.info(f"Skipped duplicate: {data.get('title', '')}")
                continue
            saved += 1
            logger.info(f"Saved: {data.get('title', '')}")
        except Exception as e:
            logger.error(f"Error processing article '{article.get('title', '')}': {e}")

    logger.info(f"Fetch job done. Saved {saved} articles.")
    return saved


@router.post("/fetch")
async def trigger_fetch():
    count = await fetch_and_save()
    return {"saved": count, "message": f"{count}개 기사가 저장되었습니다."}


RECOMMEND_SYSTEM_PROMPT = """당신은 구직자 맞춤 취업 소식 큐레이터입니다.
구직자의 희망 직무(또는 현재 상황)를 보고, 주어진 기사 목록 중 가장 도움이 될 기사를 골라 JSON으로만 반환합니다."""

RECOMMEND_PROMPT = """구직자의 희망 직무/상황: {desired_job}

기사 목록 (id | 카테고리 | 제목 | 요약):
{articles}

위 목록에서 이 구직자에게 관련도가 높은 기사를 최대 {limit}개 골라, 관련도 높은 순으로 반환하세요.
- 반드시 목록에 있는 id만 사용하세요.
- 희망 직무가 약어·영문이면 의미를 해석하세요 (예: Dev → 개발자, PM → 기획자, HR → 인사).
- 희망 직무가 "학생", "구직 중"처럼 상황을 나타내면 그 상황에 맞는 기사를 고르세요.
- 직무와 직접 관련된 기사(같은 산업·직군·필요 역량)를 우선하고, 일반적인 시장 소식은 그 다음입니다.
- 같은 사건·주제를 다룬 기사는 하나만 고르세요. 서로 다른 주제로 다양하게 구성하세요.
- reason은 희망 직무와의 연결고리를 구체적으로 담은 30자 이내 한 문장으로, "~해요"체로 쓰세요.
  좋은 예: "개발 직군 신입 채용이 늘어난 IT 분야 소식이에요" / 나쁜 예: "채용 트렌드 정보입니다."
- 제목·요약에 없는 사실을 지어내지 마세요. 직무와 직접 관련된 기사가 부족하면 일반 소식을 고르되,
  reason도 사실대로 쓰세요 (예: "직무와 상관없이 하반기 공채 흐름을 볼 수 있어요").

다음 JSON 형식으로만 반환하세요:
{{"items": [{{"id": 123, "reason": "추천 이유"}}]}}"""


class RecommendArticle(BaseModel):
    id: int
    title: str
    sub_title: str | None = ""
    category: str | None = ""


class RecommendRequest(BaseModel):
    desired_job: str
    articles: list[RecommendArticle]
    limit: int = 4


@router.post("/recommend")
def recommend(req: RecommendRequest):
    if not req.articles:
        return {"items": []}

    lines = "\n".join(
        f"{a.id} | {a.category or ''} | {a.title} | {(a.sub_title or '')[:120]}" for a in req.articles
    )
    prompt = RECOMMEND_PROMPT.format(desired_job=req.desired_job, articles=lines, limit=req.limit)
    try:
        data = generate_json(prompt, RECOMMEND_SYSTEM_PROMPT, temperature=0.2)
    except Exception as e:
        logger.exception("맞춤 소식 추천 실패")
        raise HTTPException(status_code=502, detail=str(e))

    valid_ids = {a.id for a in req.articles}
    items, seen = [], set()
    for item in data.get("items", []):
        try:
            item_id = int(item.get("id"))
        except (TypeError, ValueError):
            continue
        if item_id in valid_ids and item_id not in seen:
            seen.add(item_id)
            items.append({"id": item_id, "reason": str(item.get("reason") or "")[:60]})
        if len(items) >= req.limit:
            break
    return {"items": items}
