import asyncio
import logging

from google.cloud import documentai_v1 as documentai

from app.core.config import settings

logger = logging.getLogger(__name__)

SUPPORTED_MIME_TYPES = {"application/pdf", "image/jpeg", "image/png"}


def _process_document_sync(file_bytes: bytes, mime_type: str) -> str:
    """동기 Document AI 호출 — asyncio.to_thread로 감싸서 사용."""
    client = documentai.DocumentProcessorServiceClient()
    processor_name = (
        f"projects/{settings.gcp_project_id}"
        f"/locations/{settings.gcp_location}"
        f"/processors/{settings.gcp_processor_id}"
    )
    raw_document = documentai.RawDocument(content=file_bytes, mime_type=mime_type)
    request = documentai.ProcessRequest(name=processor_name, raw_document=raw_document)
    result = client.process_document(request=request)
    return result.document.text


async def extract_text(file_bytes: bytes, mime_type: str) -> str:
    try:
        text: str = await asyncio.to_thread(_process_document_sync, file_bytes, mime_type)
        logger.info("OCR 완료 — 추출 텍스트 길이: %d자", len(text))
        return text
    except Exception as e:
        raise RuntimeError(f"OCR 처리 실패: {e}") from e