import json
from typing import Any

from fastapi import APIRouter, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/api/job", tags=["job"])

GEMINI_MODEL = "gemini-3.6-flash"

client = genai.Client(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = """당신은 공공기관 채용 공고 분석 전문가입니다.
채용 공고 데이터를 분석하여 구직자에게 유용한 정보를 정확한 JSON 형식으로만 반환합니다.
다른 텍스트나 마크다운 없이 JSON만 반환하세요."""

ANALYSIS_PROMPT = """다음 채용 공고를 분석하여 JSON으로 반환하세요.

채용 공고:
기관명: {org}
공고명: {title}
고용형태: {employmentType}
채용구분: {recruitType}
근무지역: {workLocation}
채용인원: {recruitCount}명
접수기간: {start} ~ {end}
학력조건: {education}
자격요건: {qualificationItems}
모집분야: {recruitPositions}
전형방법: {selectionSteps}

반환 형식 (JSON만, 다른 텍스트 없이):
{{
  "summary": ["핵심 요약 문장 1", "핵심 요약 문장 2", "핵심 요약 문장 3"],
  "coreSummary": "마감일과 채용 핵심 내용을 담은 한 문장 (예: 5월 1일 마감. 한국세라믹기술원이 경남 근무 전기안전관리자 무기계약직을 채용합니다.)",
  "companySub": "기관의 산하기관/부처 정보 (예: 과기정통부 산하, 알 수 없으면 빈 문자열)",
  "positionTitle": "구체적인 직종명 또는 채용 포지션명",
  "positionSub": "고용형태·채용구분 조합 (예: 무기계약직·공무직)",
  "locationSub": "근무 특이사항 (예: 대체인력 아님, 없으면 빈 문자열)",
  "deadlineSub": "총 접수 기간 일수 (예: 접수기간 15일)",
  "checklist": [
    {{
      "cat": "카테고리명 (예: 지원자격, 결격사유, 연령, 병역, 학력)",
      "items": ["체크 조건 1 (30자 이내, 간결하게)", "체크 조건 2", "체크 조건 3"]
    }}
  ],
  "warningText": "실제 지원자가 주의해야 할 경고 문구. 특별한 주의사항이 없으면 반드시 \"\"(빈 문자열)만 반환",
  "bonuses": [
    {{"label": "우대항목명", "sub": "부가설명 (없으면 빈 문자열)", "pct": "+X%"}}
  ],
  "steps": [
    {{"name": "전형단계명", "badge": "배수 또는 기타 정보", "desc": "단계 설명", "chips": ["평가항목1", "평가항목2"], "done": false}}
  ]
}}

checklist 규칙:
- 응시자격 항목을 카테고리(cat)별로 분리하세요.
- 각 카테고리의 items는 체크박스 하나씩에 해당하는 짧고 명확한 조건 문장 배열입니다.
- items 각 항목은 원문 복사 금지, 30자 이내로 핵심만 요약하세요.
- 결격사유 등 긴 법적 조항은 핵심 조건만 추출해 items 배열로 나열하세요 (예: ["금치산자·한정치산자 해당 없음", "금고형 집행 후 5년 경과", "성폭력 범죄 처벌 미해당"]).
- 비슷한 조건은 하나의 카테고리로 묶고, 조건 수가 많으면 상위 5개 이내로 추려주세요.
bonuses는 우대가산점 항목만 포함하세요 (없으면 빈 배열).
steps의 마지막 단계(최종합격/수습 등)는 done을 true로 설정하세요."""


class JobAnalysisRequest(BaseModel):
    job: dict[str, Any]


@router.post("/analyze")
async def analyze_job(req: JobAnalysisRequest):
    job = req.job

    prompt = ANALYSIS_PROMPT.format(
        org=job.get("org", ""),
        title=job.get("title", ""),
        employmentType=job.get("employmentType", ""),
        recruitType=job.get("recruitType", ""),
        workLocation=job.get("workLocation", ""),
        recruitCount=job.get("recruitCount", ""),
        start=job.get("start", ""),
        end=job.get("end", ""),
        education=job.get("education", ""),
        qualificationItems=job.get("qualificationItems", ""),
        recruitPositions=job.get("recruitPositions", ""),
        selectionSteps=job.get("selectionSteps", ""),
    )

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
