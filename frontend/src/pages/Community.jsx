import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Community.css";
import { getLoggedInUser } from "../utils/authUtils";

const CATEGORIES = ["전체", "자소서", "면접", "기업 질문", "자유 게시판"];
const SORTS      = ["최신순", "인기순", "조회순", "댓글순"];
const JOBS       = ["직종 전체", "IT · 개발", "디자인", "마케팅 · 홍보", "기획 · 전략", "회계 · 재무", "기타"];

// ← 변경: "MENTOR" / "MENTEE" 영문값 처리
function RoleBadge({ role }) {
    if (!role || role === "USER") return null;
    const label = role === "MENTOR" ? "멘토" : role === "MENTEE" ? "멘티" : null;
    if (!label) return null;
    return (
        <span style={{
            fontSize: "10px", fontWeight: "700",
            padding: "1px 6px", borderRadius: "8px", marginLeft: "4px",
            background: role === "MENTOR" ? "#dcfce7" : "#dbeafe",
            color:      role === "MENTOR" ? "#16a34a" : "#2563eb",
        }}>
            {label}
        </span>
    );
}

export default function Community() {

    const [posts, setPosts]             = useState([]);
    const [totalCount, setTotalCount]   = useState(0);
    const [totalPages, setTotalPages]   = useState(1);
    const [currentPage, setCurrentPage] = useState(0);

    const [activeCategory, setActiveCategory] = useState("전체");
    const [activeSort, setActiveSort]         = useState("최신순");
    const [keyword, setKeyword]               = useState("");
    const [searchInput, setSearchInput]       = useState("");
    const [selectedJob, setSelectedJob]       = useState("");

    const [loadedKey, setLoadedKey] = useState("");   // 마지막으로 결과를 받아온 조건
    const [bookmarks, setBookmarks] = useState(new Set());

    const navigate    = useNavigate();
    const currentUser = getLoggedInUser();

    // 지금 화면이 보여줘야 할 조건. 이 조건으로 받아온 결과가 아직 없으면 "로딩 중"
    const requestKey = JSON.stringify([activeCategory, activeSort, keyword, selectedJob, currentPage]);
    const loading    = loadedKey !== requestKey;

    // 즐겨찾기 불러오기 (로그인한 경우에만)
    useEffect(() => {
        if (!currentUser) return undefined;
        let cancelled = false;

        const load = async () => {
            try {
                const res  = await fetch(
                    `http://localhost:8080/api/v1/community/bookmarks?username=${currentUser}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                if (!cancelled) setBookmarks(new Set(data.postIds));
            } catch (e) {
                console.error("즐겨찾기 로드 실패", e);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [currentUser]);

    // 게시글 목록 불러오기: 카테고리 / 정렬 / 검색어 / 직종 / 페이지가 바뀔 때마다 다시 불러온다
    useEffect(() => {
        let cancelled = false;
        const key = requestKey;

        const load = async () => {
            try {
                const params = new URLSearchParams({
                    category: activeCategory,
                    sort:     activeSort,
                    keyword:  keyword,
                    job:      selectedJob === "직종 전체" ? "" : selectedJob,
                    page:     String(currentPage),
                    size:     "10",
                });
                const res  = await fetch(
                    `http://localhost:8080/api/v1/community/posts?${params}`,
                    { credentials: "include" }
                );
                const data = await res.json();
                if (cancelled) return;   // 그 사이 조건이 또 바뀌었으면 이 결과는 버린다
                setPosts(data.posts ?? []);
                setTotalCount(data.totalCount ?? 0);
                setTotalPages(Math.max(1, data.totalPages ?? 1));
            } catch (e) {
                if (!cancelled) console.error("게시글 로드 실패", e);
            } finally {
                if (!cancelled) setLoadedKey(key);
            }
        };

        void load();
        return () => { cancelled = true; };
    }, [requestKey, activeCategory, activeSort, keyword, selectedJob, currentPage]);

    const handleBookmark = async (e, postId) => {
        e.stopPropagation();
        if (!currentUser) return;
        try {
            const res  = await fetch(
                `http://localhost:8080/api/v1/community/post/${postId}/bookmark?username=${currentUser}`,
                { method: "POST", credentials: "include" }
            );
            const data = await res.json();
            setBookmarks((prev) => {
                const next = new Set(prev);
                if (data.bookmarked) { next.add(postId); }
                else                 { next.delete(postId); }
                return next;
            });
        } catch (e) {
            console.error("즐겨찾기 실패", e);
        }
    };

    const handleSearch   = () => { setKeyword(searchInput);       setCurrentPage(0); };
    const handleJob      = (job)      => { setSelectedJob(job);        setCurrentPage(0); };
    const handleCategory = (category) => { setActiveCategory(category); setCurrentPage(0); };
    const handleSort     = (sort)     => { setActiveSort(sort);         setCurrentPage(0); };
    const handlePage     = (page)     => setCurrentPage(page);

    return (
        <div className="com-root">

            <main className="com-main">

                <div className="com-breadcrumb">홈 ＞ 커뮤니티</div>

                <div className="com-title-wrap">
                    <div>
                        <h1 className="com-title">커뮤니티</h1>
                        <p className="com-subtitle">
                            자소서, 면접 등 취업 준비생들과 다양한 정보를 공유해보세요.
                        </p>
                    </div>
                    <div className="com-stats">
                        <div className="com-stat-box">총 게시글 {totalCount.toLocaleString()}건</div>
                        <div className="com-stat-box">오늘 새글</div>
                    </div>
                </div>

                <section className="com-search-box">
                    <div className="com-search-row">
                        <input
                            className="com-search-input"
                            placeholder="관심있는 주제나 게시글 제목, 내용을 검색해보세요"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <select className="com-select" value={selectedJob} onChange={(e) => handleJob(e.target.value)}>
                            {JOBS.map((job) => <option key={job} value={job}>{job}</option>)}
                        </select>
                        <button className="com-search-btn" onClick={handleSearch}>검색</button>
                    </div>
                    <div className="com-category-wrap">
                        {CATEGORIES.map((category) => (
                            <button key={category}
                                    className={`com-category-btn${activeCategory === category ? " com-category-btn--active" : ""}`}
                                    onClick={() => handleCategory(category)}>
                                {category}
                            </button>
                        ))}
                    </div>
                </section>

                <div className="com-total">
                    <span>전체 게시글 <strong>{totalCount.toLocaleString()}</strong>건</span>
                    <div className="com-total-right">
                        <div className="com-sort-wrap">
                            {SORTS.map((sort) => (
                                <button key={sort}
                                        className={`com-sort-btn${activeSort === sort ? " com-sort-btn--active" : ""}`}
                                        onClick={() => handleSort(sort)}>
                                    {sort}
                                </button>
                            ))}
                        </div>
                        <button className="com-btn-write" onClick={() => navigate("/community/write")}>
                            ✏ 새 게시글 작성
                        </button>
                    </div>
                </div>

                <div className="com-table-wrap">
                    <table className="com-table">
                        <thead>
                        <tr>
                            <th>⭐</th>
                            <th>카테고리</th>
                            <th>제목</th>
                            <th>직종</th>
                            <th>작성자</th>
                            <th>작성일</th>
                            <th>조회</th>
                            <th>추천</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>로딩 중...</td></tr>
                        ) : posts.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: "center", padding: "40px" }}>게시글이 없습니다.</td></tr>
                        ) : (
                            posts.map((post) => (
                                <tr key={post.id}
                                    onClick={() => navigate(`/community/${post.id}`)}
                                    style={{ cursor: "pointer" }}>
                                    <td onClick={(e) => handleBookmark(e, post.id)}
                                        style={{ cursor: "pointer", fontSize: "15px" }}>
                                        {bookmarks.has(post.id) ? "⭐" : "☆"}
                                    </td>
                                    <td>
                                        <span className={`com-badge com-badge-${post.category}`}>
                                            {post.category}
                                        </span>
                                    </td>
                                    <td className="com-title-cell">
                                        {post.hot && <span className="com-hot">HOT</span>}
                                        {post.title}
                                        <span className="com-comments">[{post.commentCount}]</span>
                                    </td>
                                    <td>{post.job}</td>
                                    <td>
                                        {post.writer}
                                        <RoleBadge role={post.writerRole} />
                                    </td>
                                    <td>{post.createdAt}</td>
                                    <td>{post.views?.toLocaleString()}</td>
                                    <td>{post.likes}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="com-pagination">
                    <button className="com-page-btn" disabled={currentPage === 0}
                            onClick={() => handlePage(currentPage - 1)}>이전</button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i}
                                className={`com-page-btn${currentPage === i ? " com-page-btn--active" : ""}`}
                                onClick={() => handlePage(i)}>
                            {i + 1}
                        </button>
                    ))}
                    <button className="com-page-btn" disabled={currentPage >= totalPages - 1}
                            onClick={() => handlePage(currentPage + 1)}>다음</button>
                </div>

            </main>
        </div>
    );
}