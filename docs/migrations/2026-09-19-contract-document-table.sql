-- 계약서 분석 결과 저장 테이블. 기존 member 테이블 생성 후 실행.
-- 업로드 후 RETENTION_HOURS(2시간)가 지난 레코드는 ContractCleanupScheduler가 자동 삭제한다.
CREATE TABLE IF NOT EXISTS contract_document (
    contract_id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    ocr_result LONGTEXT,
    analysis_result LONGTEXT,
    risk_items TEXT,
    required_items TEXT,
    analysis_report LONGTEXT,
    net_salary_calc TEXT,
    confirm_questions TEXT,
    uploaded_at DATETIME(6) NOT NULL,
    analyzed_at DATETIME(6),
    PRIMARY KEY (contract_id),
    KEY idx_contract_document_member (member_id),
    KEY idx_contract_document_uploaded_at (uploaded_at),
    CONSTRAINT fk_contract_document_member FOREIGN KEY (member_id) REFERENCES member(member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
