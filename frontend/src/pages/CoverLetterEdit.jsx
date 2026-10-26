import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./CoverLetterEdit.css";

const API = "http://localhost:8080/api/v1";

const SOURCE_ICON = {
    JOB_POSTING: "📋",
    REFERENCE_JD: "📄",
    REFERENCE_RESUME: "🙋",
    ORIGINAL: "✍️",
    RUBRIC: "📐",
};

const SOURCE_LABEL = {
    JOB_POSTING: "채용공고",
    REFERENCE_JD: "올린 JD 문서",
    REFERENCE_RESUME: "올린 이력서",
    ORIGINAL: "지원자 원문",
    RUBRIC: "평가 기준",
};

const AGENT_STEPS = [
    "공고 분석 (공고/JD 자료가 있을 때만)",
    "STAR 구조로 작성 (사실마다 근거 구절 제시)",
    "근거 대조 + 면접관 평가",
    "기준 미달 문항 자가수정 (최대 2회)",
];

const cardStyle = {
    background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px 18px",
};

// ── 작은 조각들 ──────────────────────────────────────────

function Pill({ ok, children }) {
    return (
        <span style={{
            fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", whiteSpace: "nowrap",
            background: ok ? "#dcfce7" : "#fef3c7", color: ok ? "#15803d" : "#b45309",
        }}>
            {children}
        </span>
    );
}

function SourceChip({ source }) {
    const label = `${SOURCE_ICON[source.type] ?? "📎"} ${source.title}`;
    const inner = (
        <>
            <span style={{ fontWeight: 700 }}>{label}</span>
            <span style={{ color: "#64748b", marginLeft: "6px" }}>
                {SOURCE_LABEL[source.type] ?? ""}{source.detail ? ` · ${source.detail}` : ""}
            </span>
        </>
    );
    const style = {
        display: "inline-block", fontSize: "12px", padding: "5px 10px", borderRadius: "8px",
        background: "#f1f5f9", color: "#334155", textDecoration: "none", lineHeight: 1.5,
    };
    return source.url
        ? <a href={source.url} target="_blank" rel="noreferrer" style={{ ...style, background: "#e0f2fe" }}>{inner} ↗</a>
        : <span style={style}>{inner}</span>;
}

function Score({ label, value, min }) {
    const ok = value >= min;
    return (
        <span title={`기준 ${min}점`} style={{ whiteSpace: "nowrap" }}>
            {label} <strong style={{ color: ok ? "#16a34a" : "#d97706" }}>{value}점</strong>
        </span>
    );
}

// 상단 검증 리포트: 기본은 한 줄 요약, "자세히"를 누르면 펼쳐진다
function ReportBar({ agent, open, onToggle }) {
    const { report, sources } = agent;
    const coreKeywords = report.keywords?.core ?? [];
    const preferred = report.keywords?.preferred ?? [];
    const evaluated = report.evaluated !== false;   // false 면 AI 혼잡으로 면접관 평가를 받지 못한 것

    return (
        <div style={{ ...cardStyle, background: "#f0f9ff", borderColor: "#bae6fd", padding: "10px 14px", marginBottom: "16px" }}>

            {/* 한 줄 요약 */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "13px", color: "#334155" }}>
                <span style={{ fontWeight: 800, color: "#0369a1", whiteSpace: "nowrap" }}>🛡 AI Agent 검증 리포트</span>

                {evaluated ? (
                    <>
                        <Score label="직무 연관성" value={report.jobRelevance} min={report.minRelevance} />
                        <Score label="문맥/완성도" value={report.completeness} min={report.minCompleteness} />
                    </>
                ) : (
                    <span style={{ color: "#b45309", fontWeight: 700 }}>⚠ 면접관 평가를 받지 못했어요 (AI 혼잡)</span>
                )}

                <span style={{ whiteSpace: "nowrap" }}>
                    근거 확인 <strong>{report.verifiedClaims}/{report.totalClaims}</strong>건
                </span>

                {evaluated && <Pill ok={report.passed}>{report.passed ? "✓ 기준 통과" : "⚠ 일부 미달"}</Pill>}
                <Pill ok={report.grounded}>{report.grounded ? "✓ 공고/JD 근거" : "공고 근거 없음"}</Pill>

                <button
                    onClick={onToggle}
                    style={{
                        marginLeft: "auto", border: "none", background: "transparent", color: "#0369a1",
                        fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap",
                    }}
                >
                    {open ? "접기 ▲" : "자세히 ▼"}
                </button>
            </div>

            {/* 자세한 내용 (기본은 접힘) */}
            {open && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #bae6fd" }}>

                    <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.7, marginBottom: "12px" }}>
                        💡 <strong>검증 근거 요약:</strong> {report.evidence}
                        {evaluated && (
                            <span style={{ color: "#94a3b8" }}>
                                {" "}(기준: 직무 연관성 {report.minRelevance}점, 문맥/완성도 {report.minCompleteness}점 이상)
                            </span>
                        )}
                    </div>

                    {(coreKeywords.length > 0 || preferred.length > 0) && (
                        <div style={{ marginBottom: "12px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                                핵심 역량 키워드 <span style={{ fontWeight: 400 }}>(✓ 자료에서 확인 / ~ AI 추정)</span>
                            </div>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {coreKeywords.map((k) => <KeywordChip key={`c-${k.text}`} k={k} strong />)}
                                {preferred.map((k) => <KeywordChip key={`p-${k.text}`} k={k} />)}
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                            📚 출처 <span style={{ fontWeight: 400 }}>— 이 평가와 근거에 실제로 사용한 자료만 표시합니다</span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {sources.map((s) => <SourceChip key={s.id} source={s} />)}
                        </div>
                    </div>

                    {report.rounds?.length > 0 && (
                        <div style={{ marginBottom: "12px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>🔁 에이전트 진행 기록</div>
                            <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#475569", lineHeight: 1.8 }}>
                                {report.rounds.map((r) => (
                                    <li key={r.round}>
                                        {r.note} — 직무 연관성 {r.jobRelevance} · 문맥/완성도 {r.completeness} · 통과 {r.passedCount}/{r.totalCount}문항
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {report.improvements?.length > 0 && (
                        <div style={{ marginBottom: "10px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 700, color: "#b45309", marginBottom: "6px" }}>
                                ⚠ 보완 필요 ({report.improvements.length}건)
                            </div>
                            <ul style={{
                                margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#475569", lineHeight: 1.8,
                                maxHeight: "180px", overflowY: "auto",
                            }}>
                                {report.improvements.map((m, i) => (
                                    <li key={i}><strong>문항 {m.questionNumber}</strong> {m.text}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.6 }}>
                        ※ 점수는 AI 면접관이 매긴 값입니다. 기준 통과 여부와 근거 확인(인용 구절이 원문에 실제로 있는지)은 서버가 직접 판단했습니다.
                    </div>
                </div>
            )}
        </div>
    );
}

function KeywordChip({ k, strong }) {
    return (
        <span
            title={k.verified ? `출처 ${k.sourceId}: "${k.quote}"` : "자료에서 근거를 찾지 못한 AI 추정 키워드"}
            style={{
                fontSize: "12px", padding: "3px 10px", borderRadius: "12px", fontWeight: strong ? 700 : 500,
                background: k.verified ? "#dcfce7" : "#f1f5f9", color: k.verified ? "#15803d" : "#64748b",
            }}
        >
            {k.verified ? "✓" : "~"} {k.text}
        </span>
    );
}

// 문항별 점수 + 근거 확인: 작은 한 줄, 근거 목록은 눌러야 보인다
function EvidencePanel({ q, sources, open, onToggle, stale }) {
    const total = q.claims.length;
    const verified = q.claims.filter((c) => c.verified).length;
    const sourceTitle = (id) => sources.find((s) => s.id === id)?.title ?? id;

    return (
        <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {q.evaluated === false ? (
                    <span style={{ color: "#b45309", fontWeight: 700 }}>평가 없음 (AI 혼잡)</span>
                ) : (
                    <>
                        <span style={{ fontWeight: 700, color: q.passed ? "#15803d" : "#b45309" }}>
                            {q.passed ? "✓ 기준 통과" : "⚠ 기준 미달"}
                        </span>
                        <span>직무 {q.jobRelevance} · 완성도 {q.completeness}</span>
                        {[["S", q.star.situation], ["T", q.star.task], ["A", q.star.action], ["R", q.star.result]].map(([name, ok]) => (
                            <span key={name} style={{ fontWeight: 700, color: ok ? "#15803d" : "#b91c1c" }}>
                                {name} {ok ? "✓" : "✗"}
                            </span>
                        ))}
                    </>
                )}
                {q.rewrites > 0 && <span>자가수정 {q.rewrites}회</span>}
                <button
                    onClick={onToggle}
                    style={{
                        border: "none", background: "transparent", color: "#0369a1", fontWeight: 700,
                        fontSize: "12px", cursor: "pointer", padding: 0,
                    }}
                >
                    🔎 근거 확인 ({verified}/{total}) {open ? "▲" : "▼"}
                </button>
            </div>

            {open && (
                <div style={{ marginTop: "8px", padding: "8px 12px", background: "#fafafa", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    {stale && (
                        <div style={{ color: "#b45309", marginBottom: "8px" }}>
                            ⚠ 수정된 내용을 직접 고쳤기 때문에, 아래 근거 확인은 AI가 쓴 원래 수정본 기준입니다.
                        </div>
                    )}
                    {total === 0 && <div>수정본이 근거로 제시한 사실이 없습니다.</div>}
                    {q.claims.map((c, i) => (
                        <div key={i} style={{ lineHeight: 1.7, padding: "6px 0", borderTop: i ? "1px dashed #e2e8f0" : "none" }}>
                            <div style={{ fontWeight: 700, color: "#1e293b" }}>
                                {c.verified ? "✓" : "⚠"} {c.text}
                            </div>
                            {c.verified ? (
                                <div style={{ color: "#475569" }}>
                                    출처: <strong>{sourceTitle(c.sourceId)}</strong> — “{c.quote}”
                                </div>
                            ) : (
                                <div style={{ color: "#b45309" }}>
                                    AI가 댄 근거 “{c.quote || "없음"}”을(를) 원문에서 찾지 못했습니다. 직접 확인해 주세요.
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── 화면 ────────────────────────────────────────────────

export default function CoverLetterEdit() {

    const { id } = useParams();

    const [title, setTitle]           = useState("");
    const [company, setCompany]       = useState("");
    const [position, setPosition]     = useState("");
    const [questions, setQuestions]   = useState([]);
    const [aiAnswers, setAiAnswers]   = useState({});  // { questionNumber: 수정된 내용 }
    const [feedback, setFeedback]     = useState(null); // { summary, comments: [{questionNumber, text}] }
    const [agent, setAgent]           = useState(null); // { report, questions, sources, aiRevised }
    const [openEvidence, setOpenEvidence] = useState({});
    const [reportOpen, setReportOpen] = useState(false);   // 검증 리포트 자세히 보기 (기본은 접힘)
    const [errorMsg, setErrorMsg]     = useState("");
    const [loading, setLoading]       = useState(false);
    const [elapsed, setElapsed]       = useState(0);
    const [chat, setChat]             = useState("");
    const [pdfFile, setPdfFile]       = useState(null);
    const [refText, setRefText]       = useState("");    // PDF에서 뽑은 문서 텍스트
    const [refType, setRefType]       = useState("JD");  // JD(채용공고) | RESUME(내 이력서)
    const [ocrLoading, setOcrLoading] = useState(false);
    const fileInputRef = useRef(null);

    // 불러오기
    useEffect(() => {
        let cancelled = false;

        const loadResume = async () => {
            try {
                const response = await axios.get(`${API}/resume/${id}`);
                if (cancelled) return;
                if (response.status === 204 || !response.data) return;

                setTitle(response.data.title);
                setCompany(response.data.company || "");
                setPosition(response.data.position || "");
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

        loadResume();
        return () => { cancelled = true; };
    }, [id]);

    // AI Agent 가 일하는 동안 경과 시간 표시
    useEffect(() => {
        if (!loading) return undefined;
        const startedAt = Date.now();
        const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
        return () => { clearInterval(timer); setElapsed(0); };
    }, [loading]);

    // 저장
    const handleSave = async () => {
        try {
            await axios.patch(
                `${API}/resume/${id}/content`,
                { title, content: JSON.stringify(aiAnswers) }
            );
            alert("저장 완료!");
        } catch (error) {
            console.error(error);
            alert("저장 실패");
        }
    };

    // 원본 복구: 수정된 내용을 원본 텍스트로 되돌림
    const handleRestore = (q) => {
        const current = (aiAnswers[q.questionNumber] || "").trim();
        if (
            current &&
            current !== (q.answer || "").trim() &&
            !window.confirm("지금 수정된 내용이 사라지고 원본으로 되돌아갑니다. 계속할까요?")
        ) {
            return;
        }
        setAiAnswers((prev) => ({ ...prev, [q.questionNumber]: q.answer || "" }));
    };

    // AI Agent: 공고 분석 → STAR 작성 → 면접관 평가 → 자가수정. 결과를 문항별 '수정된 내용'에 자동으로 채운다
    const handleSend = async () => {
        if (loading || ocrLoading) return;

        if (!questions.some((q) => (q.answer || "").trim())) {
            setFeedback(null);
            setAgent(null);
            setErrorMsg("첨삭할 답변이 없습니다. 먼저 자기소개서 내용을 작성해 주세요.");
            return;
        }

        // 이미 적어 둔 수정 내용이 있으면 덮어쓰기 전에 확인
        const hasEdits = questions.some((q) => (aiAnswers[q.questionNumber] || "").trim());
        if (hasEdits && !window.confirm("이미 작성된 '수정된 내용'이 AI 첨삭 결과로 바뀝니다. 계속할까요?")) {
            return;
        }

        try {
            setLoading(true);
            setFeedback(null);
            setErrorMsg("");

            const response = await axios.post(
                `${API}/ai/cover-letter/revise`,
                {
                    questions: questions.map((q) => ({
                        questionNumber: q.questionNumber,
                        question: q.question,
                        answer: q.answer || "",
                    })),
                    request: chat.trim(),
                    company,
                    position,
                    reference: refText,
                    referenceName: pdfFile ? pdfFile.name : "",
                    referenceType: refType,
                },
                { timeout: 180000 }  // 서버가 140초 안에 끝내도록 제한하므로, 그보다 조금 길게 기다린다
            );

            const data = response.data;
            const revisions = data.revisions || [];

            // 문항 번호에 맞춰 '수정된 내용'에 채우기
            const filled = {};
            revisions.forEach((r) => {
                if (r.revised && r.revised.trim()) {
                    filled[r.questionNumber] = r.revised;
                }
            });

            if (Object.keys(filled).length === 0) {
                setErrorMsg("AI가 수정안을 만들지 못했습니다. 요청을 조금 바꿔서 다시 시도해 주세요.");
                return;
            }

            setAiAnswers((prev) => ({ ...prev, ...filled }));
            setAgent({
                report: data.report,
                questions: data.questions || [],
                sources: data.sources || [],
                aiRevised: filled,
            });
            setOpenEvidence({});
            setReportOpen(false);
            setFeedback({
                summary: data.summary || "첨삭이 완료되었습니다.",
                comments: revisions
                    .filter((r) => r.comment)
                    .map((r) => ({ questionNumber: r.questionNumber, text: r.comment })),
            });
            setChat("");
        } catch (error) {
            console.error(error);
            setErrorMsg(
                error.response?.data?.message ||
                "현재 AI 서비스 이용자가 많아 지연되고 있습니다. 잠시 후 다시 시도해 주세요."
            );
        } finally {
            setLoading(false);
        }
    };

    // 한글 입력 중 Enter(글자 조합 확정)는 전송으로 처리하지 않는다
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
        }
    };

    // 참고 문서(PDF): 텍스트를 뽑아 두었다가 AI 첨삭 요청에 함께 보낸다
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== "application/pdf") {
            alert("PDF 파일만 업로드할 수 있습니다.");
            e.target.value = "";
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert("파일 크기는 최대 10MB까지 가능합니다.");
            e.target.value = "";
            return;
        }
        setOcrLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await axios.post(
                `${API}/ocr/extract`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            const text = (response.data.text || "").trim();
            if (!text) {
                alert("PDF에서 텍스트를 찾지 못했습니다. 이미지로 스캔된 PDF는 읽을 수 없어요.");
                e.target.value = "";
                return;
            }
            setPdfFile(file);
            setRefText(text);
        } catch (error) {
            const msg = error.response?.data?.error || "텍스트 추출에 실패했습니다.";
            alert(msg);
            e.target.value = "";
        } finally {
            setOcrLoading(false);
        }
    };

    const handleFileRemove = () => {
        setPdfFile(null);
        setRefText("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const questionResult = (qn) => agent?.questions.find((x) => x.questionNumber === qn);

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

                    {/* AI Agent 검증 리포트 + 출처 */}
                    {agent && <ReportBar agent={agent} open={reportOpen} onToggle={() => setReportOpen((o) => !o)} />}

                    {/* 문항별 섹션 */}
                    {questions.map((q, idx) => {
                        const revised = aiAnswers[q.questionNumber] || "";
                        const result = questionResult(q.questionNumber);
                        const stale = result && revised.trim() !== (agent.aiRevised[q.questionNumber] || "").trim();
                        return (
                            <div key={q.questionNumber} style={{ marginBottom: "20px" }}>

                                {/* 문항 제목 + 글자 수 */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontWeight: "600",
                                    fontSize: "13px",
                                    marginBottom: "8px",
                                    color: "#1e293b",
                                    padding: "8px 12px",
                                    background: "#f1f5f9",
                                    borderRadius: "6px",
                                    borderLeft: "3px solid #2563eb"
                                }}>
                                    <span>문항 {idx + 1}. {q.question}</span>
                                    <span style={{ fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>
                                        (글자 수: {revised.length.toLocaleString()} 자)
                                    </span>
                                </div>

                                <div className="cle-panels">

                                    {/* 원본 텍스트 */}
                                    <section className="cle-panel" style={{ height: "280px", minHeight: "280px" }}>
                                        <div className="cle-panel-header">
                                            <span className="cle-panel-title">원본 텍스트</span>
                                            <span className="cle-panel-sub">수정 불가</span>
                                        </div>
                                        <div className="cle-text-box" style={{ overflowY: "auto", fontSize: "13px" }}>
                                            {q.answer || "작성된 내용이 없습니다."}
                                        </div>
                                    </section>

                                    {/* 수정된 내용 */}
                                    <section className="cle-panel" style={{ height: "280px", minHeight: "280px" }}>
                                        <div className="cle-panel-header">
                                            <span className="cle-panel-title cle-panel-title--blue">
                                                수정된 내용 (직접 편집 가능)
                                            </span>
                                            <button
                                                onClick={() => handleRestore(q)}
                                                style={{
                                                    background: "#eef2f7",
                                                    color: "#64748b",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    padding: "4px 10px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                원본 복구
                                            </button>
                                        </div>
                                        <textarea
                                            className="cle-edit-area"
                                            style={{ fontSize: "13px" }}
                                            placeholder="AI 첨삭 요청 시 수정된 내용이 자동으로 이곳에 채워집니다. 직접 수정도 가능합니다."
                                            value={revised}
                                            onChange={(e) =>
                                                setAiAnswers((prev) => ({
                                                    ...prev,
                                                    [q.questionNumber]: e.target.value,
                                                }))
                                            }
                                        />
                                    </section>

                                </div>

                                {/* 문항별 점수 + 근거 확인 */}
                                {result && (
                                    <EvidencePanel
                                        q={result}
                                        sources={agent.sources}
                                        stale={stale}
                                        open={!!openEvidence[q.questionNumber]}
                                        onToggle={() => setOpenEvidence((prev) => ({ ...prev, [q.questionNumber]: !prev[q.questionNumber] }))}
                                    />
                                )}
                            </div>
                        );
                    })}

                </div>

                {/* ── 오른쪽 AI 패널 ── */}
                <aside className="cle-ai-panel">

                    <div className="cle-ai-title">
                        ✨ AI 첨삭 &amp; Agent 피드백
                    </div>

                    <div className="cle-ai-chat">
                        {loading ? (
                            <div className="cle-ai-bubble--loading">
                                ⏳ AI Agent가 일하는 중입니다...
                                <ol style={{ margin: "10px 0 0", paddingLeft: "18px", fontSize: "12px", fontWeight: 500, color: "#475569", lineHeight: 1.8 }}>
                                    {AGENT_STEPS.map((s) => <li key={s}>{s}</li>)}
                                </ol>
                                <div style={{ marginTop: "10px", fontSize: "12px", fontWeight: 500, color: "#64748b" }}>
                                    경과 {elapsed}초 · 보통 30초~2분, AI가 혼잡하면 최대 2분 20초쯤 걸려요
                                </div>
                            </div>
                        ) : errorMsg ? (
                            <div className="ai-feedback-box">
                                <h3>📌 AI 첨삭 상세 분석</h3>
                                <pre>{errorMsg}</pre>
                            </div>
                        ) : feedback ? (
                            <div className="ai-feedback-box">
                                <h3>📌 AI 첨삭 상세 분석</h3>
                                <pre>{feedback.summary}</pre>
                                {feedback.comments.length > 0 && (
                                    <>
                                        <h3 style={{ marginTop: "16px" }}>[문항별 수정 내용]</h3>
                                        <pre>
                                            {feedback.comments
                                                .map((c, i) => `${i + 1}. 문항 ${c.questionNumber}: ${c.text}`)
                                                .join("\n")}
                                        </pre>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="cle-ai-bubble-wrap">
                                <div className="cle-ai-avatar">🤖</div>
                                <div className="cle-ai-bubble">
                                    AI Agent가 공고 분석 → STAR 작성 → 면접관 평가 → 자가수정 순서로 첨삭하고,
                                    수정본의 근거와 출처를 함께 보여드려요.
                                    <br /><br />
                                    채용공고(JD)나 내 이력서 PDF를 올리면 그 자료를 근거로 사용합니다.
                                    원하는 방향을 입력하고 ➤ 를 누르세요. 입력 없이 보내면 전체 문항을 다듬어 드려요.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 참고 문서(PDF) 업로드 */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />

                    <div className="cle-upload-box">
                        <div className="cle-upload-cloud">☁</div>
                        <div className="cle-upload-title">참고 문서(PDF) 추가</div>

                        {/* 문서 종류: 어떤 자료로 쓰일지가 달라지고 출처에도 그대로 표시된다 */}
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center", margin: "6px 0 8px" }}>
                            {[["JD", "채용공고(JD)"], ["RESUME", "내 이력서"]].map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setRefType(value)}
                                    style={{
                                        fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "12px", cursor: "pointer",
                                        border: "1px solid " + (refType === value ? "#0b79ff" : "#d1d5db"),
                                        background: refType === value ? "#eff6ff" : "#fff",
                                        color: refType === value ? "#0b79ff" : "#64748b",
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="cle-upload-desc">
                            {refType === "JD"
                                ? <>채용공고 PDF는 직무 기준(핵심 역량)으로<br />사용합니다.</>
                                : <>이력서 PDF는 지원자 경험의 근거로<br />사용합니다.</>}
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
                            placeholder="AI에게 수정/보완 요청사항 입력..."
                            value={chat}
                            onChange={(e) => setChat(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading || ocrLoading}
                            maxLength={500}
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