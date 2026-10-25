package com.nextstep.backend.common.util;

public class RoleMapper {

    private RoleMapper() {}

    /**
     * 한글 또는 영문 role 입력을 DB 저장 형식(MENTOR/MENTEE/USER)으로 변환.
     * null 입력 시 "USER" 반환 (회원가입 기본값).
     * 마이페이지 수정에서 null 방어는 호출 측에서 처리.
     */
    public static String map(String input) {
        if (input == null) return "USER";
        switch (input) {
            case "멘토": case "MENTOR": return "MENTOR";
            case "멘티": case "MENTEE": return "MENTEE";
            case "해당 없음": case "USER": return "USER";
            default: return "USER";
        }
    }
}
