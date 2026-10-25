import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CoverLetterDetail.css";
import axiosInstance from "../api/axiosInstance";

export default function CoverLetterDetail() {

    const { id }   = useParams();
    const navigate = useNavigate();

    const [letter, setLetter]               = useState(null);
    const [loading, setLoading]             = useState(true);
    const [openQuestions, setOpenQuestions] = useState(new Set());
    const [editingTitle, setEditingTitle]   = useState(false);
    const [title, setTitle]                 = useState("");
    const [answers, setAnswers]             = useState({});
    const [aiAnswers, setAiAnswers]         = useState({});
    const [saving, setSaving]               = useState(false);
    const [savingTitle, setSavingTitle]     = useState(false);
    const [sharing, setSharing]             = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res  = await fetch(
                    `http://localhost:8080/api/v1/resume/${id}`,
                    { credentials: "include" }
                );
                if (res.status === 204) return;
                const data = await res.json();
                setLetter(data);
                setTitle(data.title);

                const answerMap = {};
                (data.questions || []).forEach((q) => {
                    answerMap[q.questionNumber] = q.answer;
                });
                setAnswers(answerMap);

                // content에서 문항별 AI 답변 파싱
                if (data.content) {
                    try {
                        const parsed = JSON.parse(data.content);
                        if (typeof parsed === "object" && !Array.isArray(parsed)) {
                            setAiAnswers(parsed);
                        }
                    } catch {
                        // JSON 아니면 무시
                    }
                }
            } catch (e) {
                console.error("상세 로드 실패", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(
                `http://localhost:8080/api/v1/resume/${id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        username:    letter.username,
                        title,
                        company:     letter.company,
                        position:    letter.position,
                        description: letter.description,
                        status:      letter.status,
                        questions: (letter.questions || []).map((q) => ({
                            questionNumber: q.questionNumber,
                            question:       q.question,
                            answer:         answers[q.questionNumber] ?? q.answer,
                        })),
                    }),
                }
            );
            if (res.ok) {
                alert("저장되었습니다!");
            }
        } catch (e) {
            console.error("저장 실패", e);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTitle = async () => {
        setSavingTitle(true);
        try {
            const res = await fetch(
                `http://localhost:8080/api/v1/resume/${id}/content`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        title,
                        content: letter.content ?? "",
                    }),
                }
            );
            if (res.ok) setEditingTitle(false);
        } catch (e) {
            console.error("제목 저장 실패", e);
        } finally {
            setSavingTitle(false);
        }
    };

    // 커뮤니티 첨삭 요청: 이 자소서를 커뮤니티 '자소서' 카테고리에 글로 올린다.
    // 전화번호/이메일/주민등록번호는 서버가 가린 뒤 저장한다. 올린 사람은 로그인 토큰으로 확인하므로
    // 토큰이 자동으로 붙는 axiosInstance 를 쓴다.
    const handleShare = async () => {
        if (sharing) return;
        if (!window.confirm(
            "개인정보(전화번호, 이메일 등)가 자동 마스킹 처리된 후 커뮤니티에 첨삭 요청글로 등록됩니다. 공유하시겠습니까?"
        )) {
            return;
        }

        setSharing(true);
        try {
            const res = await axiosInstance.post(`/community/post/from-resume/${id}`);
            alert("커뮤니티에 첨삭 요청글이 등록되었습니다.");
            navigate(`/community/${res.data.id}`);
        } catch (e) {
            console.error("커뮤니티 공유 실패", e);
            alert(e.response?.data?.message || "커뮤니티 공유에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setSharing(false);
        }
    };

    const totalChars = Object.values(answers).reduce(
        (sum, a) => sum + (a?.length ?? 0), 0
    );

    const toggleQuestion = (qid) => {
        setOpenQuestions((prev) => {
            const next = new Set(prev);
            if (next.has(qid)) { next.delete(qid); } else { next.add(qid); }
            return next;
        });
    };

    if (loading) return (
        <div className="cld-root">            <main className="cld-main"><p className="cld-not-found">로딩 중...</p></main>
        </div>
    );

    if (!letter) return (
        <div className="cld-root">            <main className="cld-main"><p className="cld-not-found">자기소개서를 찾을 수 없습니다.</p></main>
        </div>
    );

    return (
        <div className="cld-root">


            <main className="cld-main">

                <div className="cld-breadcrumb">
                    <span className="cld-breadcrumb-link" onClick={() => navigate("/cover-letter")}>
                        자기소개서 관리
                    </span>
                    <span className="cld-breadcrumb-sep">›</span>
                    <span>{title}</span>
                </div>

                <article className="cld-article">

                    {/* 헤더 */}
                    <div className="cld-header">
                        <div className="cld-header-left">
                            {editingTitle ? (
                                <div className="cld-title-edit-wrap">
                                    <input
                                        className="cld-title-input"
                                        value={title}
                                        autoFocus
                                        onChange={(e) => setTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSaveTitle();
                                            if (e.key === "Escape") { setTitle(letter.title); setEditingTitle(false); }
                                        }}
                                    />
                                    <button className="cld-btn-primary" onClick={handleSaveTitle} disabled={savingTitle}
                                            style={{ padding: "6px 14px", fontSize: "14px" }}>
                                        {savingTitle ? "저장 중..." : "확인"}
                                    </button>
                                    <button className="cld-btn-outline"
                                            onClick={() => { setTitle(letter.title); setEditingTitle(false); }}
                                            style={{ padding: "6px 14px", fontSize: "14px" }}>
                                        취소
                                    </button>
                                </div>
                            ) : (
                                <div className="cld-title-wrap">
                                    <h1 className="cld-title">{title}</h1>
                                    <button className="cld-btn-outline" onClick={() => setEditingTitle(true)}
                                            style={{ padding: "6px 16px", fontSize: "14px" }}>
                                        수정
                                    </button>
                                </div>
                            )}
                            <div className="cld-meta">
                                <span className={`cld-badge${letter.status === "완료" ? " cld-badge--done" : " cld-badge--draft"}`}>
                                    {letter.status === "완료" ? "작성 완료" : "임시 저장"}
                                </span>
                                <span className="cld-meta-item">🏢 {letter.company}</span>
                                <span className="cld-meta-item">💼 {letter.position}</span>
                            </div>
                        </div>
                    </div>

                    {/* 날짜 + 통계 */}
                    <div className="cld-info-row">
                        <span>📄 작성일 {letter.createdAt}</span>
                        <span>🕐 수정일 {letter.updatedAt}</span>
                        <span>📝 총 {letter.questions?.length ?? 0}개 문항</span>
                        <span>🔤 총 {totalChars.toLocaleString()}자</span>
                    </div>

                    <hr className="cld-divider" />

                    {/* 문항 목록 */}
                    <div className="cld-questions">
                        {(letter.questions || []).map((q, idx) => {
                            const hasAi = !!aiAnswers[q.questionNumber];

                            return (
                                <div key={q.questionNumber} className="cld-question-block">

                                    <div
                                        className="cld-question-header"
                                        onClick={() => toggleQuestion(q.questionNumber)}
                                    >
                                        <div className="cld-question-left">
                                            <span className="cld-question-num">{idx + 1}</span>
                                            <span className="cld-question-text">{q.question}</span>
                                        </div>
                                        <div className="cld-question-right">
                                            {/* AI 수정 여부만 표시 */}
                                            {hasAi && (
                                                <span style={{
                                                    fontSize: "11px",
                                                    color: "#2563eb",
                                                    background: "#eff6ff",
                                                    padding: "2px 8px",
                                                    borderRadius: "10px",
                                                    marginRight: "8px",
                                                    fontWeight: "600"
                                                }}>
                                                    ✨ AI 수정 있음
                                                </span>
                                            )}
                                            <span className="cld-toggle-icon">
                                                {openQuestions.has(q.questionNumber) ? "▲" : "▼"}
                                            </span>
                                        </div>
                                    </div>

                                    {openQuestions.has(q.questionNumber) && (
                                        <div className="cld-answer">
                                            <div className="cld-answer-view">
                                                <div className="cld-answer-text">
                                                    {/* AI 수정본이 있으면 AI 내용만, 없으면 원본 */}
                                                    {(hasAi
                                                            ? aiAnswers[q.questionNumber]
                                                            : answers[q.questionNumber] ?? ""
                                                    ).split("\n").map((line, i) =>
                                                        line.trim() === ""
                                                            ? <br key={i} />
                                                            : <p key={i}>{line}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>

                    <hr className="cld-divider" />

                    {/* 하단 */}
                    <div className="cld-footer">
                        <button className="cld-btn-back" onClick={() => navigate("/cover-letter")}>
                            ← 목록으로
                        </button>
                        <div className="cld-footer-right">
                            <button className="cld-btn-primary" onClick={handleShare} disabled={sharing}>
                                📢 {sharing ? "등록 중..." : "커뮤니티 첨삭 요청"}
                            </button>
                            <button className="cld-btn-outline" onClick={() => navigate(`/cover-letter/edit/${letter.id}`)}>
                                ✏ 수정하기
                            </button>
                            <button className="cld-btn-primary" onClick={handleSave} disabled={saving}>
                                💾 저장하기
                            </button>
                        </div>
                    </div>

                </article>

            </main>

        </div>
    );
}