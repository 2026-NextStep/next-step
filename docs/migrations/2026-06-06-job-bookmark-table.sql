-- job_bookmark 테이블: 채용공고 북마크 기능
CREATE TABLE IF NOT EXISTS job_bookmark (
    bookmark_id BIGINT       NOT NULL AUTO_INCREMENT,
    member_id   BIGINT       NOT NULL,
    posting_id  BIGINT       NOT NULL,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bookmark_id),
    UNIQUE KEY uq_member_posting (member_id, posting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
