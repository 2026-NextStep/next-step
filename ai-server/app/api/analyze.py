import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas.analysis import (
    AnalyzeResponse, BasicInfoSchema, KeyClause, PrecautionSchema, Risk, SalaryBreakdownSchema,
)
from app.services import gpt_service, ocr_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analyze"])

ALLOWED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_contract(file: UploadFile = File(...)) -> AnalyzeResponse:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식: {file.content_type}. (application/pdf, image/jpeg, image/png만 허용)",
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"파일 크기 초과: {len(file_bytes) // 1024}KB (최대 10MB)",
        )

    logger.info("분석 시작 — 파일: %s (%d bytes)", file.filename, len(file_bytes))

    try:
        # Step 1: OCR
        logger.info("[1/2] OCR 호출 중...")
        ocr_text = await ocr_service.extract_text(file_bytes, file.content_type)

        if not ocr_text.strip():
            raise HTTPException(status_code=422, detail="텍스트 추출 실패: 파일에서 텍스트를 읽을 수 없습니다.")

        logger.info("[1/2] OCR 완료 — %d자 추출", len(ocr_text))
        logger.info("OCR 미리보기 (앞 100자): %s", ocr_text[:100])

        # Step 2: Gemini 분석
        logger.info("[2/2] Gemini 분석 호출 중...")
        analysis = await gpt_service.analyze_contract(ocr_text)
        logger.info(
            "[2/2] Gemini 분석 완료 — risk_level: %s, risk_score: %s",
            analysis.get("risk_level"),
            analysis.get("risk_score"),
        )

        basic_info_data = analysis.get("basic_info")
        salary_data = analysis.get("salary_breakdown")

        return AnalyzeResponse(
            success=True,
            ocr_text=ocr_text,
            summary=analysis.get("summary", ""),
            risk_level=analysis.get("risk_level", "MEDIUM"),
            risk_score=int(analysis.get("risk_score", 50)),
            key_clauses=[KeyClause(**c) for c in analysis.get("key_clauses", [])],
            risks=[Risk(**r) for r in analysis.get("risks", [])],
            recommendations=analysis.get("recommendations", []),
            basic_info=BasicInfoSchema(**basic_info_data) if basic_info_data else None,
            salary_breakdown=SalaryBreakdownSchema(**salary_data) if salary_data else None,
            precautions=[PrecautionSchema(**p) for p in analysis.get("precautions", [])],
            questions_for_recruiter=analysis.get("questions_for_recruiter", []),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("분석 중 오류 발생: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
