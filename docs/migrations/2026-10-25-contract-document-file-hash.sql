-- contract_document에 파일 해시 컬럼 추가. 활성 보존기간(RETENTION_HOURS) 내 동일 회원의
-- 동일 내용 재업로드를 감지해 AI 재분석 없이 기존 분석 결과로 연결하기 위함.
ALTER TABLE contract_document
    ADD COLUMN file_hash VARCHAR(64) NULL AFTER file_name;

CREATE INDEX idx_contract_document_member_hash_uploaded
    ON contract_document (member_id, file_hash, uploaded_at);
