/**
 * 백엔드 영문 role 값(MENTOR/MENTEE/USER)을 마이페이지 표시용 한글 라벨로 변환.
 * 역변환(한글 → 영문)은 백엔드 RoleMapper 한 곳에서만 처리.
 */
export const roleToLabel = (role) => {
    if (role === "MENTOR") return "멘토";
    if (role === "MENTEE") return "멘티";
    return "해당 없음";
};
