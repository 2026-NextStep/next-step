import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from google.genai import errors

from app.core.config import settings
from app.services.gpt_service import analyze_contract


class _FakeAsyncClient:
    def __init__(self, response):
        self.models = SimpleNamespace(generate_content=self._generate_content)
        self._response = response

    async def _generate_content(self, **_kwargs):
        return self._response

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None


class _FakeClient:
    def __init__(self, response):
        self.aio = _FakeAsyncClient(response)


class ContractGeminiServiceTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.original_api_key = settings.gemini_api_key
        settings.gemini_api_key = "test-key"

    def tearDown(self):
        settings.gemini_api_key = self.original_api_key

    async def test_missing_api_key_is_reported_without_calling_gemini(self):
        settings.gemini_api_key = ""

        with self.assertRaisesRegex(RuntimeError, "GEMINI_API_KEY"):
            await analyze_contract("contract text")

    async def test_valid_json_keeps_existing_analysis_shape(self):
        expected = {
            "summary": "summary",
            "risk_level": "LOW",
            "risk_score": 10,
            "basic_info": None,
            "salary_breakdown": None,
            "key_clauses": [],
            "risks": [],
            "precautions": [],
            "questions_for_recruiter": [],
            "recommendations": [],
        }
        response = SimpleNamespace(text=json.dumps(expected), usage_metadata=None)

        with patch("app.services.gpt_service.genai.Client", return_value=_FakeClient(response)):
            result = await analyze_contract("contract text")

        self.assertEqual(result, expected)

    async def test_empty_response_is_handled(self):
        response = SimpleNamespace(text="", usage_metadata=None)

        with patch("app.services.gpt_service.genai.Client", return_value=_FakeClient(response)):
            with self.assertRaisesRegex(RuntimeError, "응답이 비어있습니다"):
                await analyze_contract("contract text")

    async def test_invalid_json_is_handled(self):
        response = SimpleNamespace(text="not-json", usage_metadata=None)

        with patch("app.services.gpt_service.genai.Client", return_value=_FakeClient(response)):
            with self.assertRaisesRegex(RuntimeError, "JSON 파싱"):
                await analyze_contract("contract text")

    async def test_gemini_api_failure_is_handled(self):
        api_error = errors.ClientError(429, {"error": {"message": "rate limited"}})

        with patch("app.services.gpt_service.genai.Client", side_effect=api_error):
            with self.assertRaisesRegex(RuntimeError, "Gemini API 호출에 실패했습니다"):
                await analyze_contract("contract text")


if __name__ == "__main__":
    unittest.main()
