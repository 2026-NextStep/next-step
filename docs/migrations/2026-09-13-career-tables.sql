-- Career 사용자별 역량 및 프로젝트 경험. 기존 member 테이블 생성 후 실행.
-- 역량명은 앞뒤 공백 제거 후 저장하며, 동일 회원의 대소문자 구분 없는 중복을 금지한다.
CREATE TABLE IF NOT EXISTS member_skill (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    name VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    proficiency VARCHAR(20) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_member_skill_name (member_id, name),
    KEY idx_member_skill_member (member_id),
    CONSTRAINT fk_member_skill_member FOREIGN KEY (member_id) REFERENCES member(member_id),
    CONSTRAINT chk_member_skill_proficiency CHECK (proficiency IN ('BEGINNER', 'BASIC', 'INTERMEDIATE', 'ADVANCED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_experience (
    id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    technologies VARCHAR(500),
    description VARCHAR(5000),
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_project_experience_member (member_id),
    CONSTRAINT fk_project_experience_member FOREIGN KEY (member_id) REFERENCES member(member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

