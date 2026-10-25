import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CoverLetterManage.css";
import { getLoggedInUser } from "../utils/authUtils";

export default function CoverLetterManage() {

    const navigate = useNavigate();

    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch]   = useState("");
    const [filter, setFilter]   = useState("전체");

    const filters = ["전체", "작성 완료", "임시 저장"];

    // 목록 불러오기
    useEffect(() => {
        const fetchLetters = async () => {
            try {
                const username = getLoggedInUser();
                const res  = await fetch(
                    `http://localhost:8080/api/v1/resume?username=${username}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                setLetters(data);
            } catch (e) {
                console.error("목록 로드 실패", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLetters();
    }, []);

    const filtered = letters.filter((l) => {
        const matchSearch =
            l.title?.includes(search) ||
            l.company?.includes(search) ||
            l.position?.includes(search);
        const matchFilter =
            filter === "전체" ||
            (filter === "작성 완료" && l.status === "완료") ||
            (filter === "임시 저장" && l.status === "임시");
        return matchSearch && matchFilter;
    });

    // 삭제
    const handleDelete = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(
                `http://localhost:8080/api/v1/resume/${id}`,
                { method: "DELETE", credentials: "include" }
            );
            if (res.ok) {
                setLetters((prev) => prev.filter((l) => l.id !== id));
            } else {
                alert("삭제에 실패했습니다.");
            }
        } catch (e) {
            console.error("삭제 실패", e);
            alert("서버 연결에 실패했습니다.");
        }
    };

    // PDF 다운로드
    const handleDownload = async (id, title) => {
        try {
            // 상세 데이터 불러오기 (문항 포함)
            const res  = await fetch(
                `http://localhost:8080/api/v1/resume/${id}`,
                { credentials: "include" }
            );
            const data = await res.json();

            // PDF용 HTML 생성
            const html = `
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8">
                    <title>${data.title}</title>
                    <style>
                        body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.8; }
                        h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                        .meta { color: #555; font-size: 14px; margin-bottom: 30px; }
                        .meta span { margin-right: 20px; }
                        .question { margin-bottom: 30px; }
                        .question-title { font-size: 15px; font-weight: bold; background: #f5f5f5; padding: 10px 14px; border-left: 4px solid #333; margin-bottom: 10px; }
                        .answer { font-size: 14px; padding: 0 14px; white-space: pre-wrap; }
                        .ai-section { margin-bottom: 30px; border: 1px solid #ddd; border-radius: 6px; padding: 16px; }
                        .ai-title { font-size: 15px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
                        .ai-content { font-size: 14px; white-space: pre-wrap; }
                        @media print { body { padding: 20px; } }
                    </style>
                </head>
                <body>
                    <h1>${data.title}</h1>
                    <div class="meta">
                        <span>🏢 ${data.company || ""}</span>
                        <span>💼 ${data.position || ""}</span>
                        <span>📄 작성일: ${data.createdAt || ""}</span>
                    </div>

                    ${data.content ? `
                    <div class="ai-section">
                        <div class="ai-title">✨ AI 첨삭 내용</div>
                        <div class="ai-content">${data.content}</div>
                    </div>
                    ` : ""}

                    ${(data.questions || []).map((q, i) => `
                    <div class="question">
                        <div class="question-title">[문항 ${i + 1}] ${q.question}</div>
                        <div class="answer">${q.answer || ""}</div>
                    </div>
                    `).join("")}
                </body>
                </html>
            `;

            // 새 창에서 프린트 (PDF 저장 가능)
            const printWindow = window.open("", "_blank");
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);

        } catch (e) {
            console.error("다운로드 실패", e);
            alert("다운로드에 실패했습니다.");
        }
    };

    return (

        <div className="clm-root">

            
            <main className="clm-main">

                <div className="clm-breadcrumb">
                    <span>📄</span>
                    <span>자기소개서 보관함</span>
                </div>

                <div className="clm-page-header">
                    <h1 className="clm-page-title">자기소개서 관리</h1>
                    <button
                        className="clm-btn-new"
                        onClick={() => navigate("/cover-letter/write")}
                    >
                        <span>+</span>
                        <span>새 자기소개서 작성</span>
                    </button>
                </div>

                <div className="clm-toolbar">
                    <div className="clm-search-wrap">
                        <span className="clm-search-icon">🔍</span>
                        <input
                            className="clm-search"
                            type="text"
                            placeholder="제목, 회사명, 직무명 검색"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="clm-filters">
                        {filters.map((f) => (
                            <button
                                key={f}
                                className={`clm-filter-btn${filter === f ? " clm-filter-btn--active" : ""}`}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button className="clm-sort-btn">
                        <span>↕</span>
                        <span>최신 수정순</span>
                    </button>
                </div>

                <div className="clm-list-section">
                    <div className="clm-list-header">
                        <span className="clm-list-title">자기소개서 목록</span>
                        <span className="clm-list-count">총 {filtered.length}개 문서</span>
                    </div>
                    <p className="clm-list-desc">
                        지원 기업과 직무 기준으로 구분해 두고
                        필요한 버전을 빠르게 수정할 수 있습니다.
                    </p>
                    <div className="clm-cards">
                        {loading ? (
                            <div className="clm-empty">로딩 중...</div>
                        ) : filtered.length === 0 ? (
                            <div className="clm-empty">검색 결과가 없습니다.</div>
                        ) : (
                            filtered.map((letter) => (
                                <LetterCard
                                    key={letter.id}
                                    letter={letter}
                                    onDelete={handleDelete}
                                    onDownload={handleDownload}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="clm-tips">
                    <div className="clm-tips-title">관리 팁</div>
                    <ul className="clm-tips-list">
                        <li>
                            지원 기업마다 문항 의도와 강조 포인트가
                            다르기 때문에 기본본 하나와 직무 맞춤형
                            여러 개를 분리해 관리하는 것이 좋습니다.
                        </li>
                        <li>
                            최종 제출 전에는 최근 수정일 기준으로 검토하고,
                            문항별 핵심 성과 수치가 빠지지 않았는지
                            다시 확인해 보세요.
                        </li>
                        <li>
                            완성된 문서는 PDF로 보관하고,
                            임시 저장 문서는 보완 메모를 남겨
                            다음 수정 시 바로 이어서 작업할 수 있도록
                            정리하는 방식이 효율적입니다.
                        </li>
                    </ul>
                </div>

            </main>

        </div>
    );
}

function LetterCard({ letter, onDelete, onDownload }) {

    const navigate = useNavigate();

    return (

        <div
            className="clm-card"
            onClick={() => navigate(`/cover-letter/${letter.id}`)}
            style={{ cursor: "pointer" }}
        >

            <div className="clm-card-top">
                <div className="clm-card-title-row">
                    <span className="clm-card-title">{letter.title}</span>
                    <span className={`clm-badge${
                        letter.status === "완료" ? " clm-badge--done" : " clm-badge--draft"
                    }`}>
                        {letter.status === "완료" ? "작성 완료" : "임시 저장"}
                    </span>
                </div>
                <div className="clm-card-meta">
                    <span>회사: <strong>{letter.company}</strong></span>
                    <span>직무: <strong>{letter.position}</strong></span>
                </div>
            </div>

            <p className="clm-card-desc">{letter.description}</p>

            <div className="clm-card-bottom">
                <div className="clm-card-dates">
                    <span>📄 작성일: {letter.createdAt}</span>
                    <span>🕐 수정일: {letter.updatedAt}</span>
                </div>
                <div className="clm-card-actions">
                    <button
                        className="clm-action-btn clm-action-btn--edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cover-letter/edit/${letter.id}`);
                        }}
                    >
                        ✏ AI 수정
                    </button>
                    <button
                        className="clm-action-btn clm-action-btn--download"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDownload(letter.id, letter.title);
                        }}
                    >
                        ⬇ 다운로드
                    </button>
                    <button
                        className="clm-action-btn clm-action-btn--delete"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(letter.id);
                        }}
                    >
                        🗑 삭제
                    </button>
                </div>
            </div>

        </div>
    );
}
