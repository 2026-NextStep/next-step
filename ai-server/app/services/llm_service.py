"""
JSON 응답 생성 공용 헬퍼: Gemini 우선, 실패 시 OpenAI(gpt-4o-mini)로 폴백 (LLM_PRIMARY=openai면 반대 순서).

Gemini 무료 티어는 모델당 하루 20회라 금방 소진되므로,
RESOURCE_EXHAUSTED를 한 번 받으면 그날은 Gemini를 건너뛰고 바로 OpenAI를 사용한다.
"""
import json
import logging
from datetime import date

from google import genai
from google.genai import types
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3.6-flash"
OPENAI_MODEL = "gpt-4o-mini"

_gemini = genai.Client(api_key=settings.gemini_api_key)
_openai = OpenAI(api_key=settings.openai_api_key)
_gemini_exhausted_on: date | None = None


def _gemini_json(prompt: str, system: str, temperature: float) -> dict:
    response = _gemini.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            temperature=temperature,
        ),
    )
    return json.loads(response.text)


def _openai_json(prompt: str, system: str, temperature: float) -> dict:
    response = _openai.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=temperature,
    )
    return json.loads(response.choices[0].message.content)


def generate_json(prompt: str, system: str, temperature: float = 0.4) -> dict:
    # LLM_PRIMARY=openai 이면 OpenAI를 먼저 쓰고 실패 시 Gemini로 넘어간다.
    # (배포 서버에서는 Gemini 무료 한도를 자소서 AI Agent용으로 남겨 두기 위해 openai로 설정)
    if settings.llm_primary == "openai":
        try:
            return _openai_json(prompt, system, temperature)
        except Exception as e:
            logger.warning(f"OpenAI 호출 실패 → Gemini 폴백: {e}")
            return _gemini_json(prompt, system, temperature)

    global _gemini_exhausted_on
    if _gemini_exhausted_on != date.today():
        try:
            return _gemini_json(prompt, system, temperature)
        except Exception as e:
            if "RESOURCE_EXHAUSTED" in str(e):
                _gemini_exhausted_on = date.today()
                logger.warning("Gemini 일일 한도 소진 — 오늘은 OpenAI만 사용")
            else:
                logger.warning(f"Gemini 호출 실패 → OpenAI 폴백: {e}")
    return _openai_json(prompt, system, temperature)
