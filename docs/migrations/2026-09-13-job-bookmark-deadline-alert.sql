-- Migration: job_bookmark 마감임박 알림 발송 여부 컬럼 추가
-- Date: 2026-09-13

ALTER TABLE job_bookmark
    ADD COLUMN deadline_alert_sent BOOLEAN NOT NULL DEFAULT FALSE;
