import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./CoverLetterEdit.css";

export default function CoverLetterEdit() {

    const { id } = useParams();

    const [title, setTitle]         = useState("");
    const [questions, setQuestions] = useState([]);
    const [aiAnswers, setAiAnswers] = useState({});  // { questionNumber: 수정내용 }
    const [feedback, setFeedback]   = useState("");
    const [loading, setLoading]     = useState(false);
    const [chat, setChat]           = useState("");
    const [pdfFile, setPdfFile]     = useState(null);
    const [ocrLoading, setOcrLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadResume();
    }, [id]);

    const loadResume = async () => {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/v1/resume/${id}`
            );
            if (response.status === 204 || !response.data) return;

            setTitle(response.data.title);
            setQuestions(response.data.questions || []);

            if (response.data.content) {
                try {
                    const parsed = JSON.parse(response.data.content);
                    if (typeof parsed === "object" && !Array.isArray(parsed)) {
                        setAiAnswers(parsed);
                    }
                } catch {
                    // JSON 아니면 무시
                }
            }
        } catch (error) {
            console.log("불러오기 실패:", error.message);
        }
    };

    // 저장
    const handleSave = async () => {
        try {
            await axios.patch(
                `http://localhost:8080/api/v1/resume/${id}/content`,
                { title, content: JSON.stringify(aiAnswers) }
            );
            alert("저장 완료!");
        } catch (error) {
            console.error(error);
            alert("저장 실패");
        }
    };

    // AI 채팅 (전체 내용 기반)
    const handleSend = async () => {
        if (!chat.trim()) return;
        const combinedContent = questions
            .map((q, i) => `[문항 ${i + 1}] ${q.question}\n${q.answer}`)
            .join("\n\n");
        if (!combinedContent.trim()) {
            alert("먼저 자기소개서 내용을 작성해주세요.");
            return;
        }
        try {
            setLoading(true);
            setFeedback("");
            const response = await axios.post(
                "http://localhost:8080/api/v1/ai/feedback",
                { content: combinedContent, request: chat }
            );
            setFeedback(response.data.feedback);
        } catch (error) {
            console.error(error);
            alert("AI 첨삭 실패");
        } finally {
            setLoading(false);
            setChat("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSend();
    };

    // OCR
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== "application/pdf") {
            alert("PDF 파일만 업로드할 수 있습니다.");
            e.target.value = "";
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            alert("파일 크기는 최대 20MB까지 가능합니다.");
            e.target.value = "";
            return;
        }
        setPdfFile(file);
        setOcrLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await axios.post(
                "http://localhost:8080/api/v1/ocr/extract",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            if (questions.length > 0) {
                setAiAnswers((prev) => ({
                    ...prev,
                    [questions[0].questionNumber]: response.data.text,
                }));
            }
            alert("PDF 텍스트 추출 완료!");
        } catch (error) {
            const msg = error.response?.data?.error || "텍스트 추출에 실패했습니다.";
            alert(msg);
        } finally {
            setOcrLoading(false);
        }
    };

    const handleFileRemove = () => {
        setPdfFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="cle-root">

            
            <div className="cle-layout">

                {/* ── 중앙 메인 ── */}
                <div className="cle-main">

                    <div className="cle-topbar">
                        <h1 className="cle-title">{title}</h1>
                        <div className="cle-top-actions">
                            <button className="cle-btn-export">⬇ 내보내기</button>
                            <button className="cle-btn-save" onClick={handleSave}>
                                💾 저장하기
                            </button>
                        </div>
                    </div>

                    {/* 문항별 섹션 */}
                    {questions.map((q, idx) => (
                        <div key={q.questionNumber} style={{ marginBottom: "8px" }}>

                            {/* 문항 제목 */}
                            <div style={{
                                fontWeight: "600",
                                fontSize: "13px",
                                marginBottom: "4px",
                                color: "#1e293b",
                                padding: "5px 10px",
                                background: "#f1f5f9",
                                borderRadius: "6px",
                                borderLeft: "3px solid #2563eb"
                            }}>
                                문항 {idx + 1}. {q.question}
                            </div>

                            <div className="cle-panels">

                                {/* 원본 텍스트 */}
                                <section className="cle-panel">
                                    <div className="cle-panel-header">
                                        <span className="cle-panel-title">원본 텍스트</span>
                                        <span className="cle-panel-sub">수정 불가</span>
                                    </div>
                                    <div className="cle-text-box" style={{ height: "50px", overflowY: "auto", fontSize: "13px" }}>
                                        {q.answer || "작성된 내용이 없습니다."}
                                    </div>
                                </section>

                                {/* 수정된 내용 */}
                                <section className="cle-panel">
                                    <div className="cle-panel-header">
                                        <span className="cle-panel-title cle-panel-title--blue">
                                            수정된 내용
                                        </span>
                                    </div>
                                    <textarea
                                        className="cle-edit-area"
                                        style={{ height: "50px", fontSize: "13px" }}
                                        placeholder="직접 수정하거나 오른쪽 AI 채팅을 활용하세요."
                                        value={aiAnswers[q.questionNumber] || ""}
                                        onChange={(e) =>
                                            setAiAnswers((prev) => ({
                                                ...prev,
                                                [q.questionNumber]: e.target.value,
                                            }))
                                        }
                                    />
                                </section>

                            </div>
                        </div>
                    ))}

                </div>

                {/* ── 오른쪽 AI 패널 (기존 유지) ── */}
                <aside className="cle-ai-panel">

                    <div className="cle-ai-title">
                        ✨ AI 첨삭 피드백
                    </div>

                    <div className="cle-ai-chat">
                        {loading ? (
                            <div className="cle-ai-bubble--loading">
                                ⏳ AI가 첨삭 중입니다...
                            </div>
                        ) : feedback ? (
                            <div className="ai-feedback-box">
                                <h3>AI 첨삭 피드백</h3>
                                <pre>{feedback}</pre>
                            </div>
                        ) : (
                            <div className="cle-ai-bubble-wrap">
                                <div className="cle-ai-avatar">🤖</div>
                                <div className="cle-ai-bubble">
                                    안녕하세요! 자소서 피드백을 도와드릴게요.
                                    어떤 부분을 수정하고 싶으신가요?
                                    <br /><br />
                                    현재 작성된 내용에서 구체적인 사례를 더 추가하거나,
                                    지원하시는 직무에 맞게 표현을 다듬는 것을 추천드려요.
                                    원하시는 방향을 말씀해주시면 맞춤형으로 수정해 드리겠습니다.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PDF 업로드 */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />

                    <div className="cle-upload-box">
                        <div className="cle-upload-cloud">☁</div>
                        <div className="cle-upload-title">PDF 파일 추가</div>
                        <div className="cle-upload-desc">
                            이력서, 포트폴리오 등 참고할 PDF 파일을<br />
                            업로드해주세요. (최대 20MB)
                        </div>
                        {ocrLoading ? (
                            <div style={{ textAlign: "center", padding: "8px", color: "#2563eb", fontSize: "13px" }}>
                                ⏳ 텍스트 추출 중...
                            </div>
                        ) : pdfFile ? (
                            <div className="cle-upload-file-row">
                                <span className="cle-upload-file-name">📄 {pdfFile.name}</span>
                                <button className="cle-upload-file-remove" onClick={handleFileRemove}>✕</button>
                            </div>
                        ) : (
                            <button className="cle-upload-btn" onClick={() => fileInputRef.current?.click()}>
                                파일 선택
                            </button>
                        )}
                    </div>

                    {/* 채팅 입력 */}
                    <div className="cle-chat-input-wrap">
                        <input
                            type="text"
                            className="cle-chat-input"
                            placeholder="AI에게 추가 요청사항을 입력하세요"
                            value={chat}
                            onChange={(e) => setChat(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading || ocrLoading}
                        />
                        <button
                            className="cle-send-btn"
                            onClick={handleSend}
                            disabled={loading || ocrLoading}
                        >
                            ➤
                        </button>
                    </div>

                </aside>

            </div>

        </div>
    );
}
