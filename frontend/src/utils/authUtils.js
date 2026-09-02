const TOKEN_KEY    = "ns_access_token";
const PERSIST_KEY  = "ns_persist";
const USERNAME_KEY = "ns_saved_username";
const USER_KEY     = "ns_username"; // 로그인한 사용자 이름

// ── 토큰 저장 ──────────────────────────────────────────
export function saveToken(token, rememberMe) {
    localStorage.setItem(PERSIST_KEY, rememberMe ? "true" : "false");
    if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, token);
        sessionStorage.removeItem(TOKEN_KEY);
    } else {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem(TOKEN_KEY);
    }
}

// ── 토큰 조회 ──────────────────────────────────────────
export function getToken() {
    return localStorage.getItem(TOKEN_KEY)
        || sessionStorage.getItem(TOKEN_KEY)
        || null;
}

export function isPersistLogin() {
    return localStorage.getItem(PERSIST_KEY) === "true";
}

// ── 로그아웃 ───────────────────────────────────────────
export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PERSIST_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
}

// ── 아이디 저장 ────────────────────────────────────────
export function handleSaveId(username, saveId) {
    if (saveId) {
        localStorage.setItem(USERNAME_KEY, username);
    } else {
        localStorage.removeItem(USERNAME_KEY);
    }
}

export function getSavedUsername() {
    return localStorage.getItem(USERNAME_KEY) || "";
}

// ── 로그인한 사용자 정보 ───────────────────────────────
// 로그인 성공 시 nickname 저장
export function saveUserInfo(nickname) {
    localStorage.setItem(USER_KEY, nickname);
}

// 현재 로그인한 사용자 nickname 반환
export function getLoggedInUser() {
    return localStorage.getItem(USER_KEY) || "익명";
}

// ── 로그인 여부 (Header 컴포넌트용, 팀원 원본에 없으나 본인 프로젝트 필수) ──
export function isLoggedIn() {
    return !!getToken();
}