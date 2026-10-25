import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CoverLetterWrite.css";
import { getLoggedInUser } from "../utils/authUtils"; // ← 추가

const QUESTIONS = [
    {
        id: 1,
        question: "지원 동기와 입사 후 포부를 작성해 주세요.",
        hint: "기업을 선택한 이유, 직무 적합성, 입사 후 기여방향을 자연스럽게 연결해 보세요.",
        placeholder: "문항에 대한 답변을 작성하세요. 회사와 직무를 선택한 이유, 관련 경험, 입사 후 기여 계획을 중심으로 정리하면 좋습니다.",
        maxLength: 700,
    },
    {
        id: 2,
        question: "가장 도전적이었던 경험과 해결 과정을 작성해 주세요.",
        hint: "상황, 문제, 행동, 결과 순서로 구조화하면 읽기 쉬운 문장이 됩니다.",
        placeholder: "문제 상황과 본인의 역할을 분명히 적고, 해결 과정에서 사용한 방식과 결과를 수치로 제시해 보세요.",
        maxLength: 1000,
    },
    {
        id: 3,
        question: "협업 과정에서 배운 점과 본인의 강점을 설명해 주세요.",
        hint: "협업 상대, 갈등 또는 조율 포인트, 결과와 배운 점을 함께 적어 보세요.",
        placeholder: "협업 장면을 구체적으로 적고, 본인이 팀에 어떤 방식으로 기여했는지를 중심으로 작성하세요.",
        maxLength: 800,
    },
];

const GUIDE_TIPS = [
    "최근 프로젝트에서 만든 결과와 수치를 먼저 정리한 뒤 문항에 맞게 배치해보세요.",
    "불필요한 같은 경험을 반복하기보다 각 문항에 다른 경험이 드러나도록 분배하는 편이 좋습니다.",
    "초안 단계에서는 완성도보다 구조화에 우선하고, 마지막에 표현을 다듬어도 충분합니다.",
];

export default function CoverLetterWrite() {

    const navigate = useNavigate();

    const [title, setTitle]       = useState("");
    const [company, setCompany]   = useState("");
    const [position, setPosition] = useState("");
    const [summary, setSummary]   = useState("");
    const [answers, setAnswers]   = useState({ 1: "", 2: "", 3: "" });
    const [saving, setSaving]     = useState(false); // ← 추가

    const handleAnswerChange = (id, value) => {
        const q = QUESTIONS.find((q) => q.id === id);
        if (value.length <= q.maxLength) {
            setAnswers((prev) => ({ ...prev, [id]: value }));
        }
    };

    // ← handleSave를 API 연동으로 변경
    const handleSave = async (status) => {
        if (!title.trim()) {
            alert("문서 제목을 입력해주세요.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("http://localhost:8080/api/v1/resume", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    username:    getLoggedInUser(),
                    title,
                    company,
                    position,
                    description: summary,
                    status,       // "완료" or "임시"
                    questions: QUESTIONS.map((q) => ({
                        questionNumber: q.id,
                        question:       q.question,
                        answer:         answers[q.id],
                    })),
                }),
            });

            if (res.ok) {
                alert(status === "완료" ? "저장되었습니다!" : "임시 저장되었습니다!");
                navigate("/cover-letter");
            } else {
                alert("저장 실패");
            }
        } catch (e) {
            console.error(e);
            alert("서버 연결에 실패했습니다.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="clw-root">

            
            {/* ── 메인 ── */}
            <main className="clw-main">

                {/* 브레드크럼 */}
                <div className="clw-breadcrumb">
                    <span className="clw-breadcrumb-link" onClick={() => navigate("/")}>홈</span>
                    <span className="clw-breadcrumb-sep">›</span>
                    <span className="clw-breadcrumb-link" onClick={() => navigate("/cover-letter")}>자기소개서 관리</span>
                    <span className="clw-breadcrumb-sep">›</span>
                    <span>새 자기소개서 작성</span>
                </div>

                {/* 페이지 헤더 */}
                <div className="clw-page-header">
                    <span className="clw-page-tag">📝 자기소개서 에디터</span>
                    <h1 className="clw-page-title">새 자기소개서 작성</h1>
                    <p className="clw-page-desc">
                        지원 기업과 직무에 맞는 버전을 바로 작성할 수 있도록 문항별 작성 영역, 요약 정보, 진행도 패널을 한곳에 모아 정리한 화면입니다.
                    </p>
                </div>

                {/* 콘텐츠 레이아웃 */}
                <div className="clw-content">

                    {/* 왼쪽 - 에디터 */}
                    <div className="clw-editor">

                        {/* 기본 정보 */}
                        <div className="clw-section">
                            <div className="clw-section-title">기본 정보</div>
                            <p className="clw-section-desc">문서 제목과 지원 정보를 먼저 입력하면 이후 버전 관리가 쉬워집니다.</p>

                            <div className="clw-field">
                                <label className="clw-label">문서 제목</label>
                                <input
                                    className="clw-input"
                                    type="text"
                                    placeholder="예: 네이버 프론트엔드 개발자 자기소개서"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            <div className="clw-field-row">
                                <div className="clw-field">
                                    <label className="clw-label">지원 회사</label>
                                    <input
                                        className="clw-input"
                                        type="text"
                                        placeholder="회사명을 입력하세요"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                    />
                                </div>
                                <div className="clw-field">
                                    <label className="clw-label">지원 직무</label>
                                    <input
                                        className="clw-input"
                                        type="text"
                                        placeholder="직무명을 입력하세요"
                                        value={position}
                                        onChange={(e) => setPosition(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="clw-field">
                                <label className="clw-label">자기소개 요약</label>
                                <textarea
                                    className="clw-textarea clw-textarea--sm"
                                    placeholder="지원 동기와 강점을 2~3문장으로 요약해두면 문항별 작성 방향을 잡기 쉽습니다."
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 문항별 작성 */}
                        {QUESTIONS.map((q) => (
                            <div key={q.id} className="clw-section">
                                <div className="clw-question-header">
                                    <div className="clw-question-title">
                                        <span className="clw-question-num">{q.id}</span>
                                        <span className="clw-question-text">{q.question}</span>
                                    </div>
                                    <span className="clw-count">
                                        {answers[q.id].length} / {q.maxLength}
                                    </span>
                                </div>
                                <p className="clw-section-desc">{q.hint}</p>
                                <textarea
                                    className="clw-textarea clw-textarea--lg"
                                    placeholder={q.placeholder}
                                    value={answers[q.id]}
                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                />
                            </div>
                        ))}

                        {/* 저장 버튼 */}
                        <div className="clw-save-row">
                            <button
                                className="clw-btn-cancel"
                                onClick={() => navigate("/cover-letter")}
                            >
                                취소
                            </button>
                            {/* ← 임시 저장 버튼 추가 */}
                            <button
                                className="clw-btn-cancel"
                                onClick={() => handleSave("임시")}
                                disabled={saving}
                            >
                                📋 임시 저장
                            </button>
                            <button
                                className="clw-btn-save"
                                onClick={() => handleSave("완료")}
                                disabled={saving}
                            >
                                💾 저장
                            </button>
                        </div>

                    </div>

                    {/* 오른쪽 - 작성 가이드 */}
                    <aside className="clw-guide">
                        <div className="clw-guide-title">작성 가이드</div>
                        <ul className="clw-guide-list">
                            {GUIDE_TIPS.map((tip, i) => (
                                <li key={i} className="clw-guide-item">
                                    <span className="clw-guide-check">✓</span>
                                    <span className="clw-guide-text">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </aside>

                </div>
            </main>
        </div>
    );
}
