-- Migration: latest_info 카테고리 정규화 컬럼 추가
-- Date: 2026-09-20
-- 배경: ai_full_summary.badge가 AI가 생성하는 자유 텍스트라 "IT 채용 동향" /
-- "AI·IT 채용 트렌드" 처럼 의미가 같은 카테고리가 중복 생성되는 문제가 있어,
-- 필터링용 고정 카테고리(5종)를 별도 컬럼으로 분리함.

ALTER TABLE latest_info
    ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT '기타';

-- 기존 데이터 백필 (badge 텍스트 → 고정 카테고리 매핑)
UPDATE latest_info SET category = '공기업 채용 동향'
    WHERE JSON_UNQUOTE(JSON_EXTRACT(ai_full_summary, '$.badge')) LIKE '%공기업%';
UPDATE latest_info SET category = '대기업 채용 소식'
    WHERE JSON_UNQUOTE(JSON_EXTRACT(ai_full_summary, '$.badge')) LIKE '%대기업%';
UPDATE latest_info SET category = 'IT·스타트업 채용 트렌드'
    WHERE JSON_UNQUOTE(JSON_EXTRACT(ai_full_summary, '$.badge')) LIKE '%IT%'
       OR JSON_UNQUOTE(JSON_EXTRACT(ai_full_summary, '$.badge')) LIKE '%스타트업%';
UPDATE latest_info SET category = '노동시장 동향'
    WHERE JSON_UNQUOTE(JSON_EXTRACT(ai_full_summary, '$.badge')) LIKE '%노동시장%';
UPDATE latest_info SET category = '취업 전략'
    WHERE JSON_UNQUOTE(JSON_EXTRACT(ai_full_summary, '$.badge')) LIKE '%취업 전략%'
       OR JSON_UNQUOTE(JSON_EXTRACT(ai_full_summary, '$.badge')) LIKE '%취업전략%';
