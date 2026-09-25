# NextStep AI Server

근로계약서를 OCR로 파싱하고 LLM으로 위험 조항을 탐지하는 FastAPI 기반 분석 서버입니다.

## 기술 스택

- **FastAPI** — Python 웹 프레임워크
- **Python 3.12**
- **Google Document AI** — OCR (근로계약서 텍스트 추출)
- **Google Gemini** — 위험 조항 분석
- **python-dotenv** — 환경 변수 관리
- **Uvicorn** — ASGI 서버

## 폴더 구조

```text
ai-server/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점, CORS, 라우터 등록
│   ├── api/
│   │   ├── __init__.py
│   │   └── analyze.py       # POST /api/v1/analyze 엔드포인트
│   ├── services/
│   │   └── __init__.py      # Phase 2: OCR/GPT 비즈니스 로직
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── analysis.py      # Pydantic 요청/응답 모델
│   └── core/
│       ├── __init__.py
│       └── config.py        # 환경 변수 로드 및 검증
├── venv/                    # 가상환경 (git 제외)
├── gcp-credentials.json     # GCP 서비스 계정 키 (git 제외)
├── .env                     # 로컬 환경 변수 (git 제외)
├── .env.example             # 환경 변수 템플릿 (git 포함)
├── requirements.txt
└── README.md
```

## 환경 설정

**1. 가상환경 활성화**

```powershell
.\venv\Scripts\Activate.ps1
```

**2. 의존성 설치**

```powershell
pip install -r requirements.txt
```

**3. `.env` 파일 작성**

`.env.example`을 참고해서 `.env`를 작성합니다.

```text
OPENAI_API_KEY=다른_AI_기능에서_사용하는_기존_키
GEMINI_API_KEY=실제_Gemini_API_키
GEMINI_MODEL=gemini-3.5-flash
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json
GCP_PROJECT_ID=nextstep-ai-497817
GCP_PROCESSOR_ID=실제_Document_AI_프로세서_ID
GCP_LOCATION=us
```

**4. `gcp-credentials.json` 배치**

GCP 서비스 계정 키 파일을 `ai-server/gcp-credentials.json` 경로에 배치합니다.  
이 파일은 `.gitignore`에 포함되어 있으므로 절대 커밋하지 않습니다.

## 실행

```powershell
uvicorn app.main:app --reload --port 8000
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/` | 서버 상태 확인 |
| GET | `/health` | 헬스체크 |
| POST | `/api/v1/analyze` | 계약서 분석 (현재: mock 응답) |
| GET | `/docs` | Swagger UI |

### POST `/api/v1/analyze` 예시

**요청**: `multipart/form-data`로 PDF 파일 전송

**응답 (현재 Phase 1 — mock)**:
```json
{
  "message": "received",
  "filename": "contract.pdf",
  "size": 102400
}
```

> Google Document AI OCR → Google Gemini 분석 결과를 기존 응답 형식으로 반환합니다.

## 주의 사항

- `gcp-credentials.json`, `.env`, `venv/`는 git에 올리지 않습니다.
- Spring Boot(8080)와 Frontend(5173)에서의 요청을 CORS로 허용합니다.
