-- Migration: community / coverletter 테이블 생성
-- Date: 2026-06-06
-- Branch: feature/seohyun
-- 출처: origin/master (팀원1 엔티티 기반) → JPA SpringPhysicalNamingStrategy 적용

-- ────────────────────────────────────────────────────────────────
-- 1. post  (커뮤니티 게시글)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    category      VARCHAR(255),
    title         VARCHAR(255),
    content       LONGTEXT,
    job           VARCHAR(255),
    writer        VARCHAR(255),
    writer_role   VARCHAR(255),
    created_at    DATETIME,
    views         INT          NOT NULL DEFAULT 0,
    likes         INT          NOT NULL DEFAULT 0,
    comment_count INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────
-- 2. comment  (게시글 댓글)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comment (
    id          BIGINT  NOT NULL AUTO_INCREMENT,
    content     TEXT,
    writer      VARCHAR(255),
    writer_role VARCHAR(255),
    created_at  DATETIME,
    post_id     BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id)
        REFERENCES post (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────
-- 3. bookmark  (커뮤니티 즐겨찾기)
--    post_id 는 Long 컬럼 — FK 없음 (Bookmark 엔티티 설계 반영)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmark (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    username   VARCHAR(255),
    post_id    BIGINT,
    created_at DATETIME,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────
-- 4. resume  (자기소개서)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resume (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    username    VARCHAR(255),
    title       VARCHAR(255),
    company     VARCHAR(255),
    position    VARCHAR(255),
    description TEXT,
    status      VARCHAR(255),
    content     LONGTEXT,
    created_at  DATETIME,
    updated_at  DATETIME,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────────
-- 5. resume_question  (자기소개서 문항)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resume_question (
    id              BIGINT NOT NULL AUTO_INCREMENT,
    question_number INT,
    question        TEXT,
    answer          LONGTEXT,
    resume_id       BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_rq_resume FOREIGN KEY (resume_id)
        REFERENCES resume (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
