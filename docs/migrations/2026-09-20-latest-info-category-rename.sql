-- Migration: latest_info 카테고리명 변경 (노동시장 동향 -> 취업시장 동향)
-- Date: 2026-09-20

UPDATE latest_info SET category = '취업시장 동향' WHERE category = '노동시장 동향';
