# next-step

React, Spring Boot, FastAPI를 함께 사용하는 팀 프로젝트입니다.

## Project Structure

```text
next-step/
├─ frontend/   # React client
├─ backend/    # Spring Boot API server
├─ ai-server/  # FastAPI AI/Python server
└─ docs/       # Project documents
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
./gradlew bootRun
```

Windows PowerShell:

```powershell
cd backend
.\gradlew.bat bootRun
```

### AI Server

```bash
cd ai-server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Windows PowerShell:

```powershell
cd ai-server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

## Team Workflow

1. 최신 main 받기

```bash
git checkout main
git pull origin main
```

2. 작업 브랜치 만들기

```bash
git checkout -b feature/작업이름
```

예시:

```bash
git checkout -b feature/login-page
git checkout -b feature/user-api
git checkout -b fix/header-layout
```

3. 작업 후 커밋

```bash
git add .
git commit -m "Add login page"
```

4. GitHub에 브랜치 올리기

```bash
git push origin feature/작업이름
```

5. GitHub에서 Pull Request를 만들고 팀원 리뷰 후 main에 병합합니다.

## Rules

- main 브랜치에는 직접 push하지 않습니다.
- 기능 단위로 브랜치를 나눕니다.
- Pull Request 제목은 작업 내용을 짧게 씁니다.
- 충돌을 줄이기 위해 작업 전 항상 `git pull origin main`을 실행합니다.
- 비밀번호, API key, DB 접속 정보는 GitHub에 올리지 않습니다.
