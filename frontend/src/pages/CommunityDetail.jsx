import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CommunityDetail.css";
import { getLoggedInUser } from "../utils/authUtils";

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

// ← 변경: "MENTOR" / "MENTEE" 영문값 처리
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
    const [bookmarked, setBookmarked]   = useState(false);
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading]         = useState(true);

    const currentUser = getLoggedInUser();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [id]);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res  = await fetch(
                    `http://localhost:8080/api/v1/community/post/${id}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                setPost(data);
                setComments(data.comments || []);
                setLikeCount(data.likes);
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

    const handleLike = async () => {
        if (liked) { setLikeCount((c) => c - 1); setLiked(false); return; }
        try {
            const res  = await fetch(
                `http://localhost:8080/api/v1/community/post/${id}/like`,
                { method: "POST", credentials: "include" }
            );
            const data = await res.json();
            setLikeCount(data.likes);
            setLiked(true);
        } catch (e) { console.error("추천 실패", e); }
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

    const handleComment = async () => {
        if (!commentText.trim()) return;
        try {
            const res = await fetch(
                `http://localhost:8080/api/v1/community/post/${id}/comment`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ content: commentText.trim(), writer: currentUser }),
                }
            );
            const newComment = await res.json();
            setComments((prev) => [...prev, newComment]);
            setCommentText("");
        } catch (e) { console.error("댓글 등록 실패", e); }
    };

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

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
        try {
            const res = await fetch(
                `http://localhost:8080/api/v1/community/post/${id}/comment/${commentId}`,
                { method: "DELETE", credentials: "include" }
            );
            if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
            else alert("댓글 삭제에 실패했습니다.");
        } catch (e) { console.error("댓글 삭제 실패", e); }
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
                            {post.writer === currentUser && (
                                <button className="cd-comment-action-btn cd-comment-action-btn--danger" onClick={handleDeletePost}>
                                    🗑 삭제
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

                        <h2 className="cd-comments-title">댓글 {comments.length}개</h2>

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
                                    <button className="cd-comment-submit" onClick={handleComment}>등록</button>
                                </div>
                            </div>
                        </div>

                        <div className="cd-comment-list">
                            {comments.map((comment) => (
                                <div key={comment.id} className="cd-comment-item">
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
                                                {comment.writer === currentUser ? (
                                                    <button
                                                        className="cd-comment-action-btn cd-comment-action-btn--danger"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                    >
                                                        삭제
                                                    </button>
                                                ) : (
                                                    <button className="cd-comment-action-btn cd-comment-action-btn--danger">
                                                        신고
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </section>

                </article>

            </main>

        </div>
    );
}
