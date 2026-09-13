import json
import logging
import re
from typing import Literal

from google import genai
from google.genai import errors, types
from pydantic import BaseModel, Field

from app.core.config import settings
from app.schemas.analysis import BasicInfoSchema, KeyClause, PrecautionSchema, Risk, SalaryBreakdownSchema

logger = logging.getLogger(__name__)

MAX_OCR_CHARS = 3500

_HANGUL = re.compile(r'[가-힣]')
_ALPHA  = re.compile(r'[A-Za-z]')


class _ContractAnalysis(BaseModel):
    """Gemini 구조화 출력용 내부 모델. 외부 API 응답 형식에는 노출하지 않는다."""

    summary: str
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    risk_score: int = Field(ge=0, le=100)
    basic_info: BasicInfoSchema | None = None
    salary_breakdown: SalaryBreakdownSchema | None = None
    key_clauses: list[KeyClause] = Field(default_factory=list, max_length=3)
    risks: list[Risk] = Field(default_factory=list, max_length=3)
    precautions: list[PrecautionSchema] = Field(default_factory=list, max_length=3)
    questions_for_recruiter: list[str] = Field(default_factory=list, max_length=3)
    recommendations: list[str] = Field(default_factory=list, max_length=3)


def _strip_english_lines(text: str) -> str:
    """한영 병기 계약서에서 영문 라인을 제거한다.
    한글이 없고 알파벳이 3자 이상인 라인만 제거하므로 한국어 정보는 손실 없이 유지된다.
    """
    if not text:
        return text
    kept = []
    for line in text.split('\n'):
        stripped = line.strip()
        if not stripped:
            kept.append(line)
            continue
        if not _HANGUL.search(stripped) and len(_ALPHA.findall(stripped)) >= 3:
            continue
        kept.append(line)
    return '\n'.join(kept)

_SYSTEM_PROMPT = """당신은 한국 노동법 전문가입니다. 근로계약서를 분석하여 사회초년생이 이해하기 쉽게 설명합니다.

⚠️ 환각 방지 규칙 (반드시 준수):
- 계약서 텍스트에 실제로 적혀있는 내용만 분석할 것.
- 추측·가정·일반론으로 위험을 만들어내지 말 것.
- 긍정적/중립적 조항을 부정적으로 왜곡하지 말 것 (예: "제한하지 않음"을 "제한할 수 있다"로 해석 금지).
- 위험 항목이 적으면 risks를 1~2개 또는 빈 배열로 둘 것. 억지로 채우지 말 것.
- clause_reference에는 계약서 원문 조항 번호/항목명만 적을 것.

[위험도 분류 기준]
HIGH (상) — risk_score 70~100. 다음 중 하나라도 해당하면 HIGH:
- 최저임금 미달 (시급 환산 시 당해연도 최저임금 미만)
- 임금 지급일 임의 변경·감액 가능 조항 ("회사 사정에 따라 임금을 감액할 수 있다" 등)
- 법정 근로시간 초과 강제 또는 연장·휴일근로수당 미지급
- 4대 보험 미가입 명시 또는 가입 회피 조항
- 퇴직금 미지급 또는 1년 이상 근속에도 퇴직금 산정 제외
- 근로자에게 일방적·전액 손해배상 책임 부과
- 과도한 위약금·신원보증금·교육비 반환 조항
- 퇴사 후 2년 초과 또는 보상 없는 경업금지·전직금지
- "언제든 해고 가능" 등 자의적 해고 조항
- 연차유급휴가 부여 거부 또는 사용 제한

MEDIUM (중) — risk_score 40~69. 법 위반은 아니나 불리하거나 분쟁 소지가 있는 경우:
- 수습기간 중 임금이 본채용의 90% 미만이거나 수습기간 3개월 초과
- 근무지·업무 내용을 근로자 동의 없이 일방적으로 변경 가능
- 포괄임금제로 연장근로수당 산정 내역이 불명확
- 인사평가·징계 절차가 추상적
- 합리적 범위(1~2년, 동종업계 한정)의 경업금지

LOW (하) — risk_score 0~39. 법정 기준 충족, 표준적 운영 사항:
- 표준 근무시간(주 40시간, 1일 8시간), 법정 연차·휴게 보장
- 4대 보험 가입 명시, 공휴일 겹침 시 전일/익일 지급

[전체 위험도 집계 규칙] — 임의 완화 금지
1. risks 배열에 HIGH 항목 1개라도 있으면 → overall risk_level = "HIGH"
2. HIGH 없고 MEDIUM 2개 이상이면 → overall risk_level = "HIGH"
3. HIGH 없고 MEDIUM 1개면 → overall risk_level = "MEDIUM"
4. HIGH·MEDIUM 모두 없으면 → overall risk_level = "LOW"
risk_score: HIGH → 70~100, MEDIUM → 40~69, LOW → 0~39.
HIGH 조항이 많을수록 100에 가깝게, MEDIUM만 소수면 40에 가깝게 산정.

⚠️ HIGH 기준에 해당하면 보수적으로 "중"으로 낮추지 말 것. "법 위반 소지가 있다"고 판단되면 HIGH다.

일반 규칙:
- 모르는 정보는 null (추측 금지).
- description/reason은 2문장 이내로 간결하게.
- key_clauses, risks, precautions, questions_for_recruiter 각 최대 3개.
- summary는 100자 이내로 작성할 것.
- basic_info.company_name에는 사업체명·회사명만, employer_name에는 사업주·대표이사 성명만 적을 것.
- 계약서에 수습기간이 없으면 probation_period는 null 대신 반드시 "없음"으로 적을 것.
- salary_breakdown에는 원문에서 확인한 세전 월급 gross_salary와 추출 근거 note만 작성할 것.
- 연봉만 있으면 12로 나누고 시급제면 209를 곱하되, 불확실하면 gross_salary는 null로 둘 것.
- 4대보험·소득세·실수령액은 Spring Boot가 계산하므로 모델이 직접 계산하지 말 것."""


async def analyze_contract(ocr_text: str) -> dict:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY가 설정되지 않았습니다")

    original_len = len(ocr_text)
    ocr_text = _strip_english_lines(ocr_text)
    stripped_len = len(ocr_text)
    if original_len != stripped_len:
        logger.info("영문 라인 제거 — %d자 → %d자 (제거: %d자)", original_len, stripped_len, original_len - stripped_len)

    if len(ocr_text) > MAX_OCR_CHARS:
        truncated = ocr_text[:MAX_OCR_CHARS] + "\n...(이하 생략)"
        logger.info("OCR 텍스트 %d자 → %d자로 잘림", stripped_len, MAX_OCR_CHARS)
    else:
        truncated = ocr_text
        logger.info("OCR 텍스트 %d자 (한도 내, 자르지 않음)", stripped_len)

    user_prompt = (
        "아래 계약서에 실제로 적혀있는 내용만 분석하세요. 원문에 없는 위험을 만들지 말고, "
        "위험 항목이 적으면 risks 배열을 1~2개만 만들거나 비워도 됩니다. 각 risks 항목의 "
        "severity와 전체 risk_level은 시스템 지침의 분류 및 집계 규칙을 그대로 적용하세요.\n\n"
        f"{truncated}"
    )

    try:
        async with genai.Client(api_key=settings.gemini_api_key).aio as client:
            response = await client.models.generate_content(
                model=settings.gemini_model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=_SYSTEM_PROMPT,
                    max_output_tokens=2400,
                    thinking_config=types.ThinkingConfig(thinking_level="low"),
                    response_mime_type="application/json",
                    response_schema=_ContractAnalysis,
                ),
            )

        raw = response.text
        if not raw:
            raise RuntimeError("Gemini 응답이 비어있습니다")

        usage = response.usage_metadata
        if usage:
            logger.info(
                "Gemini 토큰 사용 — 입력: %s, 출력: %s, 합계: %s",
                usage.prompt_token_count,
                usage.candidates_token_count,
                usage.total_token_count,
            )

        parsed = json.loads(raw)
        if not isinstance(parsed, dict):
            raise RuntimeError("Gemini 응답 JSON이 객체 형식이 아닙니다")
        return parsed
    except json.JSONDecodeError as e:
        logger.error("Gemini 응답 JSON 파싱 실패. raw=%s", raw[:500] if raw else "None")
        raise RuntimeError("Gemini 응답 JSON 파싱에 실패했습니다") from e
    except RuntimeError:
        raise
    except errors.APIError as e:
        logger.error("Gemini API 호출 실패 — code=%s", getattr(e, "code", "unknown"))
        raise RuntimeError("Gemini API 호출에 실패했습니다") from e
    except Exception as e:
        logger.exception("Gemini 계약서 분석 중 예상하지 못한 오류")
        raise RuntimeError("Gemini 계약서 분석 중 오류가 발생했습니다") from e
