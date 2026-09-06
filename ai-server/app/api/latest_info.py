import json
import logging

import pymysql
from fastapi import APIRouter
from google import genai
from google.genai import types
from tavily import TavilyClient

from app.core.config import settings

router = APIRouter(prefix="/api/latest-info", tags=["latest-info"])
logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3.6-flash"

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
    "badge": "기사 카테고리 (예: 공기업 채용 동향, AI·IT 채용 트렌드, 대기업 채용 소식, 노동시장 동향, 취업 전략 등 중 적합한 것)",
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

SEARCH_QUERIES = [
    "한국 취업 채용 공고 뉴스 2026년 5월",
    "공기업 대기업 채용 일정 2026년",
    "한국 IT 개발자 스타트업 채용 2026",
    "한국 취업 시장 노동시장 동향 2026",
]

RELEVANCE_KEYWORDS = ["채용", "취업", "구인", "구직", "공고", "지원", "입사", "신입", "경력", "직무", "인턴"]


def get_db_connection():
    return pymysql.connect(
        host=settings.db_host,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


def save_to_db(data: dict):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO latest_info
                   (title, sub_title, ai_summary_3lines, ai_full_summary, ai_today_brief, ai_action)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (
                    data["title"],
                    data["sub_title"],
                    data["ai_summary_3lines"],
                    json.dumps(data["ai_full_summary"], ensure_ascii=False),
                    data["ai_today_brief"],
                    json.dumps(data["ai_action"], ensure_ascii=False),
                ),
            )
        conn.commit()
    finally:
        conn.close()


async def fetch_and_save():
    logger.info("Starting latest info fetch job")
    saved = 0

    seen_titles: set[str] = set()
    articles: list[dict] = []

    for query in SEARCH_QUERIES:
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
                content = r.get("content", "") + r.get("raw_content", "")
                combined = title + content
                is_relevant = any(kw in combined for kw in RELEVANCE_KEYWORDS)
                if title not in seen_titles and is_relevant:
                    seen_titles.add(title)
                    articles.append(r)
        except Exception as e:
            logger.error(f"Tavily search failed for '{query}': {e}")

    from datetime import date
    today = date.today().strftime("%Y년 %m월 %d일")

    for article in articles[:10]:
        try:
            content = (article.get("raw_content") or article.get("content", ""))[:3000]
            prompt = f"오늘 날짜: {today}\n\n" + ARTICLE_PROMPT.format(
                title=article.get("title", ""),
                content=content,
            )
            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    temperature=0.4,
                ),
            )
            data = json.loads(response.text)
            save_to_db(data)
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
