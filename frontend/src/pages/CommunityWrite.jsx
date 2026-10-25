import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CommunityWrite.css";
import { getLoggedInUser } from "../utils/authUtils";

const CATEGORIES = ["카테고리 선택", "자소서", "면접", "기업 질문", "멘토링 게시판", "자유 게시판"];
const JOBS       = ["직종 선택", "IT · 개발", "디자인", "기획 · 전략", "마케팅 · 홍보", "회계 · 재무", "영업", "전체"];

export default function CommunityWrite() {

    const navigate  = useNavigate();
    const editorRef = useRef(null);

    const [category, setCategory]   = useState("카테고리 선택");
    const [job, setJob]             = useState("직종 선택");
    const [postTitle, setPostTitle] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const execCmd = (command, value = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
    };

    const handleSubmit = async () => {
        const content = editorRef.current?.innerText?.trim();

        if (category === "카테고리 선택") { alert("카테고리를 선택해주세요."); return; }
        if (job === "직종 선택")          { alert("직종을 선택해주세요."); return; }
        if (!postTitle.trim())            { alert("제목을 입력해주세요."); return; }
        if (!content)                     { alert("내용을 입력해주세요."); return; }

        setSubmitting(true);

        try {
            const res = await fetch("http://localhost:8080/api/v1/community/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    category,
                    title:   postTitle,
                    content,
                    job,
                    writer:  getLoggedInUser(), // 로그인한 사용자 닉네임
                }),
            });

            if (res.ok) {
                alert("게시글이 등록되었습니다!");
                navigate("/community");
            } else {
                alert("게시글 등록에 실패했습니다.");
            }
        } catch (e) {
            console.error("게시글 등록 오류", e);
            alert("서버 연결에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="cw-root">

            <main className="cw-main">
                <div className="cw-card">

                    <h1 className="cw-page-title">게시글 작성</h1>

                    {/* 카테고리 + 직종 */}
                    <div className="cw-row">
                        <div className="cw-field">
                            <label className="cw-label">카테고리 <span className="cw-required">*</span></label>
                            <div className="cw-select-wrap">
                                <select className="cw-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <span className="cw-select-arrow">﹀</span>
                            </div>
                        </div>
                        <div className="cw-field">
                            <label className="cw-label">직종 선택 <span className="cw-required">*</span></label>
                            <div className="cw-select-wrap">
                                <select className="cw-select" value={job} onChange={(e) => setJob(e.target.value)}>
                                    {JOBS.map((j) => <option key={j} value={j}>{j}</option>)}
                                </select>
                                <span className="cw-select-arrow">﹀</span>
                            </div>
                        </div>
                    </div>

                    {/* 제목 */}
                    <div className="cw-field cw-field--full">
                        <label className="cw-label">제목 <span className="cw-required">*</span></label>
                        <input
                            className="cw-input" type="text"
                            placeholder="게시글 제목을 입력해주세요."
                            value={postTitle}
                            onChange={(e) => setPostTitle(e.target.value)}
                        />
                    </div>

                    {/* 내용 에디터 */}
                    <div className="cw-field cw-field--full">
                        <label className="cw-label">내용 <span className="cw-required">*</span></label>
                        <div className="cw-editor-wrap">
                            <div className="cw-toolbar">
                                <div className="cw-toolbar-group">
                                    <button className="cw-tool-btn" title="굵게" onClick={() => execCmd("bold")}><strong>B</strong></button>
                                    <button className="cw-tool-btn" title="기울임" onClick={() => execCmd("italic")}><em>I</em></button>
                                    <button className="cw-tool-btn" title="밑줄" onClick={() => execCmd("underline")}><u>U</u></button>
                                </div>
                                <div className="cw-toolbar-divider" />
                                <div className="cw-toolbar-group">
                                    <button className="cw-tool-btn" onClick={() => execCmd("justifyLeft")}>≡</button>
                                    <button className="cw-tool-btn" onClick={() => execCmd("justifyCenter")}>☰</button>
                                    <button className="cw-tool-btn" onClick={() => execCmd("justifyRight")}>≣</button>
                                </div>
                                <div className="cw-toolbar-divider" />
                                <div className="cw-toolbar-group">
                                    <button className="cw-tool-btn" onClick={() => execCmd("insertUnorderedList")}>⁝≡</button>
                                    <button className="cw-tool-btn" onClick={() => execCmd("insertOrderedList")}>1≡</button>
                                </div>
                                <div className="cw-toolbar-divider" />
                                <div className="cw-toolbar-group">
                                    <button className="cw-tool-btn" onClick={() => { const url = prompt("이미지 URL:"); if (url) execCmd("insertImage", url); }}>🖼</button>
                                    <button className="cw-tool-btn" onClick={() => { const url = prompt("URL:"); if (url) execCmd("createLink", url); }}>🔗</button>
                                </div>
                            </div>
                            <div
                                ref={editorRef}
                                className="cw-editor"
                                contentEditable
                                suppressContentEditableWarning
                                data-placeholder="게시글 내용을 작성해주세요. 타인을 비방하거나 불쾌감을 주는 내용은 통보 없이 삭제될 수 있습니다."
                            />
                        </div>
                    </div>

                    {/* 하단 버튼 */}
                    <div className="cw-footer">
                        <button className="cw-btn-cancel" onClick={() => navigate("/community")}>
                            취소
                        </button>
                        <button className="cw-btn-submit" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? "등록 중..." : "작성 완료"}
                        </button>
                    </div>

                </div>
            </main>

        </div>
    );
}
