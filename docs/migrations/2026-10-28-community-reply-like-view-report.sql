-- Migration: 커뮤니티 대댓글·좋아요·조회수·신고 기능용 테이블/컬럼 추가
-- Date: 2026-10-28
-- 대상 커밋: 3ad268f (자소서 AI Agent, 커뮤니티 대댓글·신고·좋아요·조회수)
-- 엔티티(Comment, PostLike, PostView, Report) 기준 Hibernate 생성 DDL을 바탕으로 작성.
--
-- ※ 로컬에서 ddl-auto=update 등으로 이미 테이블이 생성된 PC는 실행하지 않아도 됨
--   (테이블은 IF NOT EXISTS라 괜찮지만, comment 컬럼 추가는 이미 있으면 "Duplicate column" 오류가 남)

-- ────────────────────────────────────────────────────────────────
-- 1. comment: 대댓글(parent_id), 답글 달린 댓글 삭제 표시(deleted)
--    parent_id는 FK 없이 숫자 컬럼으로만 둠 (게시글 삭제 시 댓글 일괄 삭제 순서 문제 방지)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE comment
    ADD COLUMN parent_id BIGINT NULL,
    ADD COLUMN deleted BIT(1) NOT NULL DEFAULT b'0';

-- ────────────────────────────────────────────────────────────────
-- 2. post_like: 게시글 좋아요 (회원당 게시글 1회)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_like (
    id        BIGINT NOT NULL AUTO_INCREMENT,
    post_id   BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_post_like_post_member UNIQUE (post_id, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────
-- 3. post_view: 게시글 조회수 중복 방지 (조회자 키당 하루 1회)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_view (
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    post_id        BIGINT      NOT NULL,
    viewer_key     VARCHAR(64) NOT NULL,
    last_view_date DATE        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_post_view_post_viewer UNIQUE (post_id, viewer_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────
-- 4. report: 게시글·댓글 신고 (신고자당 대상 1회)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    target_type       VARCHAR(20)  NOT NULL,
    target_id         BIGINT       NOT NULL,
    post_id           BIGINT       NULL,
    reporter_id       BIGINT       NOT NULL,
    reporter_nickname VARCHAR(50)  NULL,
    reported_nickname VARCHAR(255) NULL,
    reason            VARCHAR(30)  NOT NULL,
    detail            TEXT         NULL,
    status            VARCHAR(20)  NOT NULL,
    created_at        DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_report_reporter_target UNIQUE (reporter_id, target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
