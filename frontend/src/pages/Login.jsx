import { useState, useEffect } from "react";
import "./login.css";
import {
    saveToken,
    handleSaveId,
    getSavedUsername,
    saveUserInfo,
} from "../utils/authUtils";
import { login } from "../api/auth";

export default function NextStepLogin() {

    const [username, setUsername]     = useState("");
    const [password, setPassword]     = useState("");
    const [saveId, setSaveId]         = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors]         = useState({ username: false, password: false });
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading]       = useState(false);

    // 마운트 시: 저장된 아이디 복원
    useEffect(() => {
        const saved = getSavedUsername();
        if (saved) {
            setUsername(saved);
            setSaveId(true);
        }
    }, []);

    // 일반 로그인
    const handleSubmit = async (e) => {

        e.preventDefault();
        setLoginError("");

        const newErrors = {
            username: !username.trim(),
            password: !password.trim(),
        };
        setErrors(newErrors);
        if (newErrors.username || newErrors.password) return;

        setLoading(true);

        try {
            const data = await login({ username, password, rememberMe });

            if (data.success) {
                saveToken(data.token, rememberMe);

                saveUserInfo(data.nickname || data.username);

                handleSaveId(username, saveId);

                window.location.href = "/";

            } else {
                setLoginError(data.message);
            }

        } catch {
            setLoginError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    // 카카오 로그인
    const kakaoLogin = () => {
        window.location.href =
            "https://kauth.kakao.com/oauth/authorize" +
            "?client_id=f3880ae7a2f0e2cd93cf2896e5270a41" +
            "&redirect_uri=http://localhost:5173/oauth/kakao/callback" +
            "&response_type=code";
    };

    return (
        <div className="nsl-body">
            <main className="nsl-main">
                <div className="nsl-container">

                    {/* ── Left ── */}
                    <section className="nsl-left-section">
                        <div className="nsl-badge">
                            <span className="nsl-badge-text">커리어 연결 플랫폼</span>
                        </div>
                        <h1 className="nsl-heading1">
                            다음 단계로 가는
                            <br />
                            가장 빠른 로그인
                        </h1>
                        <p className="nsl-subtitle">
                            채용 정보 탐색부터 멘토링 연결까지,
                            필요한 기능을 한 번에 이용할 수 있도록
                            로그인 흐름을 더 간결하고 안정적으로 정리했습니다.
                        </p>
                        <ul className="nsl-feature-list">
                            {[
                                "아이디 저장과 로그인 유지로 반복 입력 최소화",
                                "카카오톡 간편 로그인으로 빠른 시작",
                                "아이디 찾기, 비밀번호 찾기 동선을 카드 안에 정리",
                            ].map((text, i) => (
                                <li key={i} className="nsl-feature-item">
                                    <div className="nsl-feature-number">
                                        <span className="nsl-feature-number-text">{i + 1}</span>
                                    </div>
                                    <span className="nsl-feature-text">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* ── Right ── */}
                    <section className="nsl-right-section">
                        <div className="nsl-login-card">
                            <div className="nsl-card-header">
                                <span className="nsl-card-label">로그인</span>
                                <h2 className="nsl-card-title">NextStep</h2>
                                <p className="nsl-card-subtitle">
                                    아이디와 비밀번호를 입력해 서비스를 이용하세요.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} noValidate>

                                {/* 아이디 */}
                                <div className="nsl-form-group">
                                    <label className="nsl-form-label" htmlFor="username">아이디</label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        className={`nsl-form-input${errors.username ? " nsl-form-input--error" : ""}`}
                                        placeholder="아이디를 입력하세요"
                                        autoComplete="username"
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(e.target.value);
                                            if (errors.username)
                                                setErrors((prev) => ({ ...prev, username: false }));
                                        }}
                                    />
                                    {errors.username && (
                                        <span className="nsl-error-message">아이디를 입력해주세요.</span>
                                    )}
                                </div>

                                {/* 비밀번호 */}
                                <div className="nsl-form-group">
                                    <label className="nsl-form-label" htmlFor="password">비밀번호</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className={`nsl-form-input${errors.password ? " nsl-form-input--error" : ""}`}
                                        placeholder="비밀번호를 입력하세요"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password)
                                                setErrors((prev) => ({ ...prev, password: false }));
                                        }}
                                    />
                                    {errors.password && (
                                        <span className="nsl-error-message">비밀번호를 입력해주세요.</span>
                                    )}
                                </div>

                                {/* 옵션 */}
                                <div className="nsl-options-row">
                                    <div className="nsl-checkbox-group">
                                        <CheckboxItem
                                            label="아이디 저장"
                                            checked={saveId}
                                            onChange={() => setSaveId(!saveId)}
                                        />
                                        <CheckboxItem
                                            label="로그인 유지"
                                            checked={rememberMe}
                                            onChange={() => setRememberMe(!rememberMe)}
                                        />
                                    </div>
                                </div>

                                {loginError && (
                                    <div className="nsl-login-error">{loginError}</div>
                                )}

                                <button type="submit" className="nsl-btn-login" disabled={loading}>
                                    {loading ? "로그인 중..." : "로그인"}
                                </button>

                                <div className="nsl-find-links">
                                    <a href="/find-id" className="nsl-find-link">아이디 찾기</a>
                                    <span className="nsl-find-divider">|</span>
                                    <a href="/find-password" className="nsl-find-link">비밀번호 찾기</a>
                                </div>
                            </form>

                            <div className="nsl-divider-section">
                                <div className="nsl-divider-line" />
                                <span className="nsl-divider-text">간편 로그인</span>
                                <div className="nsl-divider-line" />
                            </div>

                            <button type="button" className="nsl-btn-kakao" onClick={kakaoLogin}>
                                <div className="nsl-kakao-badge">
                                    <span className="nsl-kakao-badge-text">TALK</span>
                                </div>
                                <span className="nsl-kakao-text">카카오톡 로그인</span>
                            </button>

                            <div className="nsl-signup-row">
                                <a href="/signup" className="nsl-signup-link">
                                    계정이 없으신가요?{" "}
                                    <strong className="nsl-signup-strong">회원가입</strong>
                                </a>
                            </div>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}

function CheckboxItem({ label, checked, onChange }) {
    return (
        <label className="nsl-checkbox-item">
            <div
                className={`nsl-checkbox${checked ? " nsl-checkbox--checked" : ""}`}
                onClick={onChange}
            >
                {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                            d="M1 3.5L3.8 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </div>
            <span className="nsl-checkbox-label">{label}</span>
        </label>
    );
}