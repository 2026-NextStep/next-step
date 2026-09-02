-- Migration: job/info 테이블 생성
-- Date: 2026-06-05
-- Branch: feature/seohyun

-- ────────────────────────────────────────────────────────────────
-- 1. job_posting_list
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_posting_list (
    posting_id      BIGINT       NOT NULL,
    company_name    VARCHAR(100) NOT NULL,
    job_title       VARCHAR(300) NOT NULL,
    status          VARCHAR(20)  DEFAULT NULL,
    employment_type VARCHAR(50),
    recruit_type    VARCHAR(50),
    work_location   VARCHAR(200),
    recruit_field   VARCHAR(200),
    start_date      DATE,
    end_date        DATE,
    view_count      INT          NOT NULL DEFAULT 0,
    scrap_count     INT          NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (posting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────────
-- 2. job_posting_detail
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_posting_detail (
    posting_id          BIGINT        NOT NULL,
    recruit_count       VARCHAR(50),
    education           VARCHAR(100),
    original_link       VARCHAR(1000),
    recruit_positions   JSON,
    qualification_items JSON,
    selection_steps     JSON,
    created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (posting_id),
    CONSTRAINT fk_jpd_posting FOREIGN KEY (posting_id)
        REFERENCES job_posting_list (posting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────────
-- 3. ai_posting_summary
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_posting_summary (
    summary_id           BIGINT       NOT NULL AUTO_INCREMENT,
    member_id            BIGINT,
    posting_id           BIGINT       NOT NULL,
    company_name         VARCHAR(200),
    job_title            VARCHAR(300),
    region               VARCHAR(100),
    start_date           DATE,
    end_date             DATE,
    overview             TEXT,
    key_info             TEXT,
    qualification_checklist TEXT,
    preference_score     TEXT,
    selection_process    TEXT,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (summary_id),
    INDEX idx_aps_posting_id (posting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────────
-- 4. latest_info
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS latest_info (
    info_id             BIGINT       NOT NULL AUTO_INCREMENT,
    title               VARCHAR(300) NOT NULL,
    sub_title           TEXT,
    ai_summary_3lines   TEXT,
    ai_full_summary     TEXT,
    ai_today_brief      TEXT,
    ai_action           TEXT,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (info_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
