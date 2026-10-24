"""
최신정보(latest_info) 공백 기간 백필.

서버가 꺼져 있어 자정 스케줄러가 돌지 못한 기간을 채운다.
Tavily 뉴스 검색을 기간 단위로 나눠 호출하고, created_at은 기사의 실제 발행일로 저장한다.

사용법:
    python backfill_range.py 2026-09-21 2026-10-07 [--per-window 6] [--window-days 3]
"""
import argparse
from datetime import date, datetime, timedelta
from email.utils import parsedate_to_datetime

from app.api.latest_info import (
    ARTICLE_PROMPT,
    CATEGORIES,
    RELEVANCE_KEYWORDS,
    SYSTEM_PROMPT,
    build_search_queries,
    save_to_db,
    tavily_client,
)
from app.services.llm_service import generate_json


def published_at(article: dict, fallback: date) -> datetime:
    raw = article.get("published_date")
    if raw:
        try:
            # Tavily 뉴스: "Thu, 01 Oct 2026 01:21:37 GMT" (UTC) → KST naive
            return (parsedate_to_datetime(raw) + timedelta(hours=9)).replace(tzinfo=None)
        except (TypeError, ValueError):
            pass
    return datetime(fallback.year, fallback.month, fallback.day, 9, 0, 0)


def collect(start: date, end: date, seen: set[str]) -> list[dict]:
    articles: list[dict] = []
    for query in build_search_queries(start):
        try:
            result = tavily_client.search(
                query=query,
                topic="news",
                search_depth="advanced",
                max_results=8,
                include_raw_content=True,
                start_date=start.isoformat(),
                end_date=end.isoformat(),
            )
        except Exception as e:
            print(f"  검색 실패 '{query}': {e}", flush=True)
            continue
        for r in result.get("results", []):
            title = r.get("title", "")
            combined = title + (r.get("content") or "") + (r.get("raw_content") or "")
            if title and title not in seen and any(kw in combined for kw in RELEVANCE_KEYWORDS):
                seen.add(title)
                articles.append(r)
    return articles


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("start", type=date.fromisoformat)
    parser.add_argument("end", type=date.fromisoformat)
    parser.add_argument("--per-window", type=int, default=6)
    parser.add_argument("--window-days", type=int, default=3)
    args = parser.parse_args()

    seen: set[str] = set()
    total = 0
    win_start = args.start
    while win_start <= args.end:
        win_end = min(win_start + timedelta(days=args.window_days - 1), args.end)
        articles = collect(win_start, win_end, seen)
        print(f"=== {win_start} ~ {win_end}: 후보 {len(articles)}건 ===", flush=True)

        saved = 0
        for article in articles:
            if saved >= args.per_window:
                break
            created_at = published_at(article, win_start)
            if not (win_start <= created_at.date() <= win_end):
                continue
            try:
                content = (article.get("raw_content") or article.get("content") or "")[:3000]
                prompt = f"오늘 날짜: {created_at:%Y년 %m월 %d일}\n\n" + ARTICLE_PROMPT.format(
                    title=article.get("title", ""),
                    content=content,
                    categories=", ".join(CATEGORIES),
                )
                data = generate_json(prompt, SYSTEM_PROMPT)
                if not save_to_db(data, created_at):
                    print(f"  중복 건너뜀: {data.get('title', '')}", flush=True)
                    continue
                saved += 1
                print(f"  저장: {data.get('title', '')} ({created_at:%m-%d %H:%M})", flush=True)
            except Exception as e:
                print(f"  기사 처리 실패: {e}", flush=True)

        total += saved
        win_start = win_end + timedelta(days=1)

    print(f"백필 완료: 총 {total}건 저장", flush=True)


if __name__ == "__main__":
    main()
