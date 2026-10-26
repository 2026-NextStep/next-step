import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CommunityDetail.css";
import { getLoggedInUser, getToken } from "../utils/authUtils";
import axiosInstance from "../api/axiosInstance";

const REPORT_REASONS = ["욕설/비방", "광고/스팸", "개인정보 노출", "기타"];

function Avatar({ src, name, className }) {
    const [err, setErr] = useState(false);
    if (src && !err) {
        return (
            <img
                src={`http://localhost:8080${src}`}
                className={className}
                alt=""
                style={{ objectFit: "cover" }}
                onError={() => setErr(true)}
            />
        );
    }
    return <div className={className}>{name?.[0] ?? "?"}</div>;
}

// "MENTOR" / "MENTEE" 영문값 처리
function RoleBadge({ role }) {
    if (!role || role === "USER") return null;
    const label = role === "MENTOR" ? "멘토" : role === "MENTEE" ? "멘티" : null;
    if (!label) return null;
    return (
        <span style={{
            fontSize: "11px", fontWeight: "700",
            padding: "2px 8px", borderRadius: "10px", marginLeft: "6px",
            background: role === "MENTOR" ? "#dcfce7" : "#dbeafe",
            color:      role === "MENTOR" ? "#16a34a" : "#2563eb",
        }}>
            {label}
        </span>
    );
}

export default function CommunityDetail() {

    const { id }   = useParams();
    const navigate = useNavigate();

    const [post, setPost]               = useState(null);
    const [comments, setComments]       = useState([]);
    const [liked, setLiked]             = useState(false);
    const [likeCount, setLikeCount]     = useState(0);
    const [likeBusy, setLikeBusy]       = useState(false);  // 좋아요 요청 중 (연타 방지)
    const [bookmarked, setBookmarked]   = useState(false);
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading]         = useState(true);

    // 대댓글
    const [replyTo, setReplyTo]         = useState(null);   // 답글을 쓰는 중인 댓글 id
    const [replyText, setReplyText]     = useState("");
    const [posting, setPosting]         = useState(false);  // 댓글/답글 등록 중 (중복 클릭 방지)

    // 신고
    const [reportTarget, setReportTarget] = useState(null); // { type: "POST" | "COMMENT", id }
    const [reportReason, setReportReason] = useState("");
    const [reportDetail, setReportDetail] = useState("");
    const [reportError, setReportError]   = useState("");
    const [reporting, setReporting]       = useState(false);

    const currentUser = getLoggedInUser();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [id]);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // 로그인 토큰을 같이 보내야 서버가 "누가 봤는지" 알아서 사용자당 하루 1회만 조회수를 올린다
                const token = getToken();
                const res  = await fetch(
                    `http://localhost:8080/api/v1/community/post/${id}`,
                    {
                        credentials: "include",
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    }
                );
                const data = await res.json();
                setPost(data);
                setComments(data.comments || []);
                setLikeCount(data.likes);
                setLiked(!!data.liked);   // 서버가 기억하는 "내가 좋아요를 눌렀는지"
            } catch (e) {
                console.error("게시글 로드 실패", e);
            } finally {
                setLoading(false);
            }
        };

        const fetchBookmarkStatus = async () => {
            if (!currentUser) return;
            try {
                const res  = await fetch(
                    `http://localhost:8080/api/v1/community/bookmarks?username=${currentUser}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                setBookmarked(data.postIds.includes(Number(id)));
            } catch (e) {
                console.error("즐겨찾기 상태 로드 실패", e);
            }
        };

        fetchPost();
        fetchBookmarkStatus();
    }, [id]);

    // 좋아요: 한 사람이 한 글에 한 번만 (이미 눌렀으면 취소). 누른 기록은 서버가 가지고 있고,
    // 로그인 토큰으로 누구인지 확인하므로 토큰이 자동으로 붙는 axiosInstance 를 쓴다.
    const handleLike = async () => {
        if (likeBusy) return;
        setLikeBusy(true);
        try {
            const res = await axiosInstance.post(`/community/post/${id}/like`);
            setLikeCount(res.data.likes);
            setLiked(!!res.data.liked);
        } catch (e) {
            console.error("좋아요 실패", e);
            alert(e.response?.data?.message || "좋아요에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setLikeBusy(false);
        }
    };

    const handleBookmark = async () => {
        if (!currentUser) return;
        try {
            const res  = await fetch(
                `http://localhost:8080/api/v1/community/post/${id}/bookmark?username=${currentUser}`,
                { method: "POST", credentials: "include" }
            );
            const data = await res.json();
            setBookmarked(data.bookmarked);
        } catch (e) { console.error("즐겨찾기 실패", e); }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => alert("링크가 복사되었습니다!"))
            .catch(() => alert("복사 실패. URL을 직접 복사해주세요."));
    };

    // ── 댓글 / 대댓글 등록 ──────────────────────────────

    // 성공하면 서버가 돌려준 댓글을, 실패하면 null 을 돌려준다
    const submitComment = async (content, parentId) => {
        const res = await fetch(
            `http://localhost:8080/api/v1/community/post/${id}/comment`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ content, writer: currentUser, parentId: parentId ?? null }),
            }
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            alert(data?.message || "댓글 등록에 실패했습니다.");
            return null;
        }
        return data;
    };

    const handleComment = async () => {
        if (!commentText.trim() || posting) return;
        setPosting(true);
        try {
            const created = await submitComment(commentText.trim(), null);
            if (created) {
                setComments((prev) => [...prev, created]);
                setCommentText("");
            }
        } catch (e) { console.error("댓글 등록 실패", e); }
        finally { setPosting(false); }
    };

    const toggleReply = (commentId) => {
        setReplyTo((cur) => (cur === commentId ? null : commentId));
        setReplyText("");
    };

    const handleReply = async (parentId) => {
        if (!replyText.trim() || posting) return;
        setPosting(true);
        try {
            const created = await submitComment(replyText.trim(), parentId);
            if (created) {
                setComments((prev) => [...prev, created]);
                setReplyTo(null);
                setReplyText("");
            }
        } catch (e) { console.error("답글 등록 실패", e); }
        finally { setPosting(false); }
    };

    // ── 삭제 ────────────────────────────────────────────

    const handleDeletePost = async () => {
        if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(
                `http://localhost:8080/api/v1/community/post/${id}`,
                { method: "DELETE", credentials: "include" }
            );
            if (res.ok) { alert("삭제되었습니다."); navigate("/community"); }
            else alert("삭제에 실패했습니다.");
        } catch (e) { console.error("게시글 삭제 실패", e); }
    };

    // 서버와 같은 규칙으로 화면 목록을 정리한다 (조회할 때마다 조회수가 오르므로 다시 불러오지 않는다)
    //  - 답글이 달린 댓글: "삭제된 댓글입니다"로 자리만 남김
    //  - 그 외: 목록에서 제거. 마지막 답글을 지웠는데 부모가 삭제 표시 상태면 부모도 제거
    const removeCommentLocally = (commentId) => {
        setComments((prev) => {
            const target = prev.find((c) => c.id === commentId);
            if (!target) return prev;

            const hasReplies = target.parentId == null && prev.some((c) => c.parentId === commentId);
            if (hasReplies) {
                return prev.map((c) => c.id === commentId
                    ? { ...c, deleted: true, content: "삭제된 댓글입니다.", writer: "", writerRole: null, writerProfileImage: null }
                    : c);
            }

            let next = prev.filter((c) => c.id !== commentId);
            if (target.parentId != null) {
                const parent = next.find((c) => c.id === target.parentId);
                if (parent?.deleted && !next.some((c) => c.parentId === parent.id)) {
                    next = next.filter((c) => c.id !== parent.id);
                }
            }
            return next;
        });
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(
                `http://localhost:8080/api/v1/community/post/${id}/comment/${commentId}`,
                { method: "DELETE", credentials: "include" }
            );
            if (res.ok) removeCommentLocally(commentId);
            else alert("댓글 삭제에 실패했습니다.");
        } catch (e) { console.error("댓글 삭제 실패", e); }
    };

    // ── 신고 ────────────────────────────────────────────

    const openReport = (type, targetId) => {
        setReportTarget({ type, id: targetId });
        setReportReason("");
        setReportDetail("");
        setReportError("");
    };

    const closeReport = () => {
        if (!reporting) setReportTarget(null);
    };

    const submitReport = async () => {
        if (!reportReason) {
            setReportError("신고 사유를 선택해 주세요.");
            return;
        }
        if (reportReason === "기타" && !reportDetail.trim()) {
            setReportError("기타 사유를 입력해 주세요.");
            return;
        }

        setReporting(true);
        setReportError("");
        try {
            // 신고자는 로그인 토큰으로 확인하므로 토큰이 자동으로 붙는 axiosInstance 를 쓴다
            await axiosInstance.post("/community/report", {
                targetType: reportTarget.type,
                targetId:   reportTarget.id,
                reason:     reportReason,
                detail:     reportDetail.trim(),
            });
            setReportTarget(null);
            alert("신고가 접수되었습니다.");
        } catch (e) {
            console.error("신고 실패", e);
            setReportError(e.response?.data?.message || "신고에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        } finally {
            setReporting(false);
        }
    };

    // ── 댓글 목록 구성: 일반 댓글 아래에 그 답글을 묶는다 ──
    const commentIds    = new Set(comments.map((c) => c.id));
    const topLevel      = comments.filter((c) => c.parentId == null || !commentIds.has(c.parentId));
    const repliesOf     = (parentId) => comments.filter((c) => c.parentId === parentId);
    const visibleCount  = comments.filter((c) => !c.deleted).length;

    const renderComment = (comment, isReply) => {
        // 삭제 표시된 댓글: 내용만 "삭제된 댓글입니다"로 보여주고 아래 답글은 유지
        if (comment.deleted) {
            return (
                <div className="cd-comment-item">
                    <p className="cd-comment-text" style={{ color: "#9ca3af", fontStyle: "italic" }}>
                        삭제된 댓글입니다.
                    </p>
                </div>
            );
        }

        const mine = comment.writer === currentUser;

        return (
            <div className="cd-comment-item">
                <div className="cd-comment-row">
                    <Avatar src={comment.writerProfileImage} name={comment.writer} className="cd-avatar cd-avatar--sm" />
                    <div className="cd-comment-content">
                        <div className="cd-comment-header">
                            <span className="cd-comment-author">{comment.writer}</span>
                            <RoleBadge role={comment.writerRole} />
                            <span className="cd-comment-time">{comment.createdAt}</span>
                        </div>
                        <p className="cd-comment-text">{comment.content}</p>
                        <div className="cd-comment-actions">
                            {!isReply && (
                                <button
                                    className="cd-comment-action-btn"
                                    onClick={() => toggleReply(comment.id)}
                                >
                                    {replyTo === comment.id ? "답글 취소" : "답글"}
                                </button>
                            )}
                            {mine ? (
                                <button
                                    className="cd-comment-action-btn cd-comment-action-btn--danger"
                                    onClick={() => handleDeleteComment(comment.id)}
                                >
                                    삭제
                                </button>
                            ) : (
                                <button
                                    className="cd-comment-action-btn cd-comment-action-btn--danger"
                                    onClick={() => openReport("COMMENT", comment.id)}
                                >
                                    신고
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 답글 입력 */}
                {!isReply && replyTo === comment.id && (
                    <div className="cd-comment-input-wrap" style={{ marginTop: "10px", marginLeft: "44px" }}>
                        <div className="cd-avatar cd-avatar--sm">{currentUser?.[0]}</div>
                        <div className="cd-comment-input-box">
                            <textarea
                                className="cd-comment-textarea"
                                placeholder={`${comment.writer}님에게 답글을 남겨주세요.`}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                autoFocus
                            />
                            <div className="cd-comment-input-footer">
                                <button
                                    className="cd-comment-submit"
                                    onClick={() => handleReply(comment.id)}
                                    disabled={posting}
                                >
                                    답글 등록
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="cd-root"><main className="cd-main"><p className="cd-not-found">로딩 중...</p></main></div>
    );
    if (!post) return (
        <div className="cd-root"><main className="cd-main"><p className="cd-not-found">게시글을 찾을 수 없습니다.</p></main></div>
    );

    return (
        <div className="cd-root">

            <main className="cd-main">

                <div className="cd-breadcrumb">
                    <span className="cd-breadcrumb-link" onClick={() => navigate("/community")}>커뮤니티</span>
                    <span className="cd-breadcrumb-sep">›</span>
                    <span>{post.category}</span>
                </div>

                <article className="cd-article">

                    <h1 className="cd-title">{post.title}</h1>

                    <div className="cd-meta">
                        <div className="cd-author-wrap">
                            <Avatar src={post.writerProfileImage} name={post.writer} className="cd-avatar" />
                            <span className="cd-author-name">{post.writer}</span>
                            <RoleBadge role={post.writerRole} />
                        </div>
                        <div className="cd-meta-right">
                            <span className="cd-date">{post.createdAt}</span>
                            <span className="cd-views">조회 {post.views?.toLocaleString()}</span>
                            {post.writer === currentUser ? (
                                <button className="cd-comment-action-btn cd-comment-action-btn--danger" onClick={handleDeletePost}>
                                    🗑 삭제
                                </button>
                            ) : (
                                <button
                                    className="cd-comment-action-btn cd-comment-action-btn--danger"
                                    onClick={() => openReport("POST", post.id)}
                                >
                                    🚨 신고
                                </button>
                            )}
                        </div>
                    </div>

                    <hr className="cd-divider" />

                    <div className="cd-body">
                        {post.content?.split("\n").map((line, i) =>
                            line.trim() === "" ? <br key={i} /> : <p key={i}>{line}</p>
                        )}
                    </div>

                    <div className="cd-actions">
                        <button
                            className={`cd-action-btn${liked ? " cd-action-btn--liked" : ""}`}
                            onClick={handleLike}
                        >
                            <span>{liked ? "♥" : "♡"}</span>
                            <span>{likeCount}</span>
                        </button>
                        <button
                            className="cd-action-btn"
                            onClick={handleBookmark}
                            style={{ color: bookmarked ? "#f59e0b" : undefined }}
                        >
                            <span>{bookmarked ? "⭐" : "☆"}</span>
                            <span>{bookmarked ? "저장됨" : "즐겨찾기"}</span>
                        </button>
                        <button className="cd-action-btn" onClick={handleShare}>
                            <span>⎘</span>
                            <span>공유</span>
                        </button>
                    </div>

                    <hr className="cd-divider" />

                    <section className="cd-comments">

                        <h2 className="cd-comments-title">댓글 {visibleCount}개</h2>

                        <div className="cd-comment-input-wrap">
                            <div className="cd-avatar cd-avatar--sm">{currentUser?.[0]}</div>
                            <div className="cd-comment-input-box">
                                <textarea
                                    className="cd-comment-textarea"
                                    placeholder="바르고 고운 말을 사용하여 댓글을 남겨주세요."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <div className="cd-comment-input-footer">
                                    <button className="cd-comment-submit" onClick={handleComment} disabled={posting}>등록</button>
                                </div>
                            </div>
                        </div>

                        <div className="cd-comment-list">
                            {topLevel.map((comment) => (
                                <div key={comment.id}>
                                    {renderComment(comment, false)}

                                    {/* 답글: 들여쓰기 + 왼쪽 선으로 부모 댓글에 속해 있음을 표시 */}
                                    {repliesOf(comment.id).map((reply) => (
                                        <div
                                            key={reply.id}
                                            style={{ marginLeft: "44px", paddingLeft: "12px", borderLeft: "2px solid #e5e7eb" }}
                                        >
                                            {renderComment(reply, true)}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                    </section>

                </article>

            </main>

            {/* 신고 창 */}
            {reportTarget && (
                <div
                    onClick={closeReport}
                    style={{
                        position: "fixed", inset: 0, zIndex: 1000,
                        background: "rgba(0,0,0,0.45)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: "min(420px, 92vw)", background: "#fff", borderRadius: "14px",
                            padding: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                        }}
                    >
                        <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 800 }}>
                            {reportTarget.type === "POST" ? "게시글 신고" : "댓글 신고"}
                        </h3>
                        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
                            신고 사유를 선택해 주세요. 허위 신고는 제재될 수 있어요.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
                            {REPORT_REASONS.map((reason) => (
                                <label key={reason} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
                                    <input
                                        type="radio"
                                        name="report-reason"
                                        value={reason}
                                        checked={reportReason === reason}
                                        onChange={() => { setReportReason(reason); setReportError(""); }}
                                    />
                                    {reason}
                                </label>
                            ))}
                        </div>

                        <textarea
                            value={reportDetail}
                            onChange={(e) => setReportDetail(e.target.value)}
                            maxLength={500}
                            placeholder={reportReason === "기타" ? "신고 사유를 입력해 주세요. (필수)" : "추가로 알려주실 내용이 있다면 적어주세요. (선택)"}
                            style={{
                                width: "100%", boxSizing: "border-box", height: "90px", resize: "none",
                                border: "1px solid #d1d5db", borderRadius: "8px", padding: "10px",
                                fontSize: "13px", fontFamily: "inherit",
                            }}
                        />

                        {reportError && (
                            <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#dc2626" }}>{reportError}</p>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "18px" }}>
                            <button
                                onClick={closeReport}
                                disabled={reporting}
                                style={{
                                    padding: "9px 16px", borderRadius: "8px", border: "1px solid #d1d5db",
                                    background: "#fff", fontSize: "14px", cursor: "pointer",
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={submitReport}
                                disabled={reporting}
                                style={{
                                    padding: "9px 16px", borderRadius: "8px", border: "none",
                                    background: "#dc2626", color: "#fff", fontSize: "14px", fontWeight: 700,
                                    cursor: reporting ? "not-allowed" : "pointer", opacity: reporting ? 0.6 : 1,
                                }}
                            >
                                {reporting ? "접수 중..." : "신고하기"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}