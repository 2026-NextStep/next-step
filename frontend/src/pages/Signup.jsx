import { useState } from "react";
import "./signup.css";
import { signup, sendEmailCode, verifyEmailCode } from "../api/auth";

const subtitles = {
    1: "NextStep과 함께 새로운 커리어를 시작하세요",
    2: "다음 단계에서 기본 개인정보를 입력해주세요",
    3: "마지막 단계에서 추가 정보를 입력하고 가입을 완료해주세요",
};

const JOB_OPTIONS  = ["학생", "직장인", "프리랜서", "구직 중", "기타"];
const ROLE_OPTIONS = ["멘토", "멘티", "해당 없음"]; // ← 추가

export default function SignUp() {

    const [step, setStep] = useState(1);

    // Step 1
    const [username, setUsername]               = useState("");
    const [nickname, setNickname]               = useState("");
    const [password, setPassword]               = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");

    // Step 2
    const [name, setName]             = useState("");
    const [birthDate, setBirthDate]   = useState("");
    const [email, setEmail]           = useState("");
    const [phone, setPhone]           = useState("");

    // 이메일 인증
    const [verifyCode, setVerifyCode]               = useState("");
    const [emailVerified, setEmailVerified]         = useState(false);
    const [codeSent, setCodeSent]                   = useState(false);
    const [sendingCode, setSendingCode]             = useState(false);
    const [verifyingCode, setVerifyingCode]         = useState(false);
    const [emailMessage, setEmailMessage]           = useState("");
    const [emailMessageType, setEmailMessageType]   = useState("");

    // Step 3
    const [address, setAddress]               = useState("");
    const [addressDetail, setAddressDetail]   = useState("");
    const [desiredJob, setDesiredJob]         = useState("");
    const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
    const [role, setRole]                     = useState(""); // ← 추가

    const [errors, setErrors]           = useState({});
    const [loading, setLoading]         = useState(false);
    const [signupError, setSignupError] = useState("");

    // 인증코드 발송
    const handleSendCode = async () => {
        if (!email.trim()) {
            setErrors((prev) => ({ ...prev, email: "이메일을 입력해주세요." }));
            return;
        }
        setSendingCode(true);
        setEmailMessage("");
        try {
            await sendEmailCode(email);
            setCodeSent(true);
            setEmailMessage("인증코드가 발송되었습니다. 이메일을 확인해주세요.");
            setEmailMessageType("success");
        } catch {
            setEmailMessage("서버 연결에 실패했습니다.");
            setEmailMessageType("error");
        } finally {
            setSendingCode(false);
        }
    };

    // 인증코드 확인
    const handleVerifyCode = async () => {
        if (!verifyCode.trim()) return;
        setVerifyingCode(true);
        setEmailMessage("");
        try {
            const data = await verifyEmailCode(email, verifyCode);
            if (data.verified) {
                setEmailVerified(true);
                setEmailMessage("✅ 이메일 인증이 완료되었습니다.");
                setEmailMessageType("success");
            } else {
                setEmailMessage(data.message || "인증코드가 올바르지 않습니다.");
                setEmailMessageType("error");
            }
        } catch {
            setEmailMessage("서버 연결에 실패했습니다.");
            setEmailMessageType("error");
        } finally {
            setVerifyingCode(false);
        }
    };

    const validate = (currentStep) => {
        const newErrors = {};

        if (currentStep === 1) {
            if (!username.trim())        newErrors.username = "아이디를 입력해주세요.";
            if (!nickname.trim())        newErrors.nickname = "닉네임을 입력해주세요.";
            if (!password.trim())        newErrors.password = "비밀번호를 입력해주세요.";
            if (!passwordConfirm.trim()) {
                newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
            } else if (password !== passwordConfirm) {
                newErrors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
            }
        }

        if (currentStep === 2) {
            if (!name.trim())      newErrors.name      = "이름을 입력해주세요.";
            if (!birthDate.trim()) newErrors.birthDate = "생년월일을 입력해주세요.";
            if (!email.trim())     newErrors.email     = "이메일을 입력해주세요.";
            if (!phone.trim())     newErrors.phone     = "휴대폰 번호를 입력해주세요.";
            if (!emailVerified)    newErrors.emailVerified = "이메일 인증을 완료해주세요.";
        }

        if (currentStep === 3) {
            if (!address.trim())       newErrors.address       = "주소를 입력해주세요.";
            if (!addressDetail.trim()) newErrors.addressDetail = "상세 주소를 입력해주세요.";
            if (!desiredJob.trim())    newErrors.desiredJob    = "직업을 선택해주세요.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const goNext = () => {
        if (!validate(step)) return;
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const goPrev = () => {
        setStep((s) => s - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate(3)) return;

        setLoading(true);
        setSignupError("");

        try {
            await signup({
                username, password, nickname, name,
                birthDate, email, phone,
                address, addressDetail,
                desiredJob,
                role: role === "해당 없음" ? null : role, // ← 추가
            });

            alert("회원가입이 완료되었습니다!");
            window.location.href = "/login";
        } catch {
            setSignupError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const clearError = (field) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    return (
        <div className="su-body">
            <main className="su-main">
                <div className="su-top-bar" />

                <div className="su-page-header">
                    <h1 className="su-page-title">회원가입</h1>
                    <p className="su-page-subtitle">{subtitles[step]}</p>
                </div>

                {/* 스텝 인디케이터 */}
                <div className="su-steps">
                    {[
                        { num: 1, label: "계정 정보" },
                        { num: 2, label: "개인 정보" },
                        { num: 3, label: "추가 정보" },
                    ].map(({ num, label }) => {
                        const isCompleted = num < step;
                        const isActive    = num === step;
                        return (
                            <div key={num} className="su-step-wrapper">
                                <div className="su-step">
                                    <div className={`su-step-circle${isActive || isCompleted ? " su-step-circle--active" : ""}`}>
                                        {num}
                                    </div>
                                    <span className={`su-step-label${isActive || isCompleted ? " su-step-label--active" : ""}`}>
                                        {label}
                                    </span>
                                </div>
                                {num < 3 && (
                                    <div className={`su-step-line${isCompleted ? " su-step-line--completed" : ""}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                <form className="su-form-container" onSubmit={handleSubmit} noValidate>

                    {/* ── Step 1 ── */}
                    {step === 1 && (
                        <div>
                            <FormGroup label="아이디" htmlFor="username" error={errors.username}>
                                <input
                                    type="text" id="username"
                                    className={`su-form-input${errors.username ? " su-form-input--error" : ""}`}
                                    placeholder="아이디를 입력하세요"
                                    autoComplete="username"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); clearError("username"); }}
                                />
                            </FormGroup>

                            <FormGroup label="닉네임" htmlFor="nickname" error={errors.nickname}>
                                <input
                                    type="text" id="nickname"
                                    className={`su-form-input${errors.nickname ? " su-form-input--error" : ""}`}
                                    placeholder="닉네임을 입력하세요"
                                    value={nickname}
                                    onChange={(e) => { setNickname(e.target.value); clearError("nickname"); }}
                                />
                            </FormGroup>

                            <FormGroup label="비밀번호" htmlFor="password"
                                       hint="영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요."
                                       error={errors.password}
                            >
                                <input
                                    type="password" id="password"
                                    className={`su-form-input${errors.password ? " su-form-input--error" : ""}`}
                                    placeholder="비밀번호를 입력하세요"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                                />
                            </FormGroup>

                            <FormGroup label="비밀번호 확인" htmlFor="passwordConfirm" error={errors.passwordConfirm}>
                                <input
                                    type="password" id="passwordConfirm"
                                    className={`su-form-input${errors.passwordConfirm ? " su-form-input--error" : ""}`}
                                    placeholder="비밀번호를 다시 입력하세요"
                                    autoComplete="new-password"
                                    value={passwordConfirm}
                                    onChange={(e) => { setPasswordConfirm(e.target.value); clearError("passwordConfirm"); }}
                                />
                            </FormGroup>

                            <div className="su-btn-row">
                                <button type="button" className="su-btn-next su-btn-next--full" onClick={goNext}>다음</button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2 ── */}
                    {step === 2 && (
                        <div>
                            <FormGroup label="이름" htmlFor="name" error={errors.name}>
                                <input
                                    type="text" id="name"
                                    className={`su-form-input${errors.name ? " su-form-input--error" : ""}`}
                                    placeholder="이름을 입력하세요"
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); clearError("name"); }}
                                />
                            </FormGroup>

                            <FormGroup label="생년월일" htmlFor="birthDate" error={errors.birthDate}>
                                <input
                                    type="date" id="birthDate"
                                    className={`su-form-input${errors.birthDate ? " su-form-input--error" : ""}`}
                                    value={birthDate}
                                    onChange={(e) => { setBirthDate(e.target.value); clearError("birthDate"); }}
                                />
                            </FormGroup>

                            {/* 이메일 인증 */}
                            <div className="su-form-group">
                                <label className="su-form-label" htmlFor="email">이메일</label>
                                <p className="su-form-hint">인증코드를 받을 이메일 주소를 입력하세요.</p>

                                <div className="su-address-row">
                                    <input
                                        type="email" id="email"
                                        className={`su-form-input su-form-input--flex${errors.email ? " su-form-input--error" : ""}`}
                                        placeholder="이메일 주소를 입력하세요"
                                        value={email}
                                        disabled={emailVerified}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            clearError("email");
                                            setCodeSent(false);
                                            setEmailVerified(false);
                                            setEmailMessage("");
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="su-btn-select"
                                        onClick={handleSendCode}
                                        disabled={sendingCode || emailVerified}
                                    >
                                        {sendingCode ? "발송 중..." : codeSent ? "재발송" : "인증코드 발송"}
                                    </button>
                                </div>
                                {errors.email && <span className="su-error-message">{errors.email}</span>}

                                {codeSent && !emailVerified && (
                                    <div className="su-address-row" style={{ marginTop: "8px" }}>
                                        <input
                                            type="text"
                                            className="su-form-input su-form-input--flex"
                                            placeholder="인증코드 6자리 입력"
                                            maxLength={6}
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="su-btn-select"
                                            onClick={handleVerifyCode}
                                            disabled={verifyingCode}
                                        >
                                            {verifyingCode ? "확인 중..." : "인증 확인"}
                                        </button>
                                    </div>
                                )}

                                {emailMessage && (
                                    <span className="su-form-hint"
                                          style={{ color: emailMessageType === "success" ? "#16a34a" : "#dc2626" }}
                                    >
                                        {emailMessage}
                                    </span>
                                )}
                                {errors.emailVerified && (
                                    <span className="su-error-message">{errors.emailVerified}</span>
                                )}
                            </div>

                            <FormGroup label="휴대폰 번호" htmlFor="phone" error={errors.phone}>
                                <input
                                    type="tel" id="phone"
                                    className={`su-form-input${errors.phone ? " su-form-input--error" : ""}`}
                                    placeholder="휴대폰 번호를 입력하세요"
                                    value={phone}
                                    onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
                                />
                            </FormGroup>

                            <div className="su-btn-row">
                                <button type="button" className="su-btn-prev" onClick={goPrev}>이전</button>
                                <button type="button" className="su-btn-next" onClick={goNext}>다음</button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3 ── */}
                    {step === 3 && (
                        <div>
                            <FormGroup label="주소" htmlFor="address" error={errors.address}>
                                <input
                                    type="text" id="address"
                                    className={`su-form-input${errors.address ? " su-form-input--error" : ""}`}
                                    placeholder="도로명 주소를 입력하세요 (예: 서울시 강남구 테헤란로 123)"
                                    value={address}
                                    onChange={(e) => { setAddress(e.target.value); clearError("address"); }}
                                />
                            </FormGroup>

                            <FormGroup label="상세 주소" htmlFor="addressDetail" error={errors.addressDetail}>
                                <input
                                    type="text" id="addressDetail"
                                    className={`su-form-input${errors.addressDetail ? " su-form-input--error" : ""}`}
                                    placeholder="동, 호수 등 상세 주소를 입력하세요"
                                    value={addressDetail}
                                    onChange={(e) => { setAddressDetail(e.target.value); clearError("addressDetail"); }}
                                />
                            </FormGroup>

                            {/* 직업 */}
                            <div className="su-form-group">
                                <label className="su-form-label">직업</label>
                                <div className="su-address-row">
                                    <input
                                        type="text"
                                        className={`su-form-input su-form-input--flex${errors.desiredJob ? " su-form-input--error" : ""}${!desiredJob ? " su-form-input--placeholder" : ""}`}
                                        placeholder="직업을 선택하세요"
                                        readOnly
                                        value={desiredJob}
                                    />
                                    <button
                                        type="button"
                                        className="su-btn-select"
                                        onClick={() => setJobDropdownOpen((o) => !o)}
                                    >
                                        선택
                                    </button>
                                </div>
                                {errors.desiredJob && <span className="su-error-message">{errors.desiredJob}</span>}
                                {jobDropdownOpen && (
                                    <div className="su-job-dropdown">
                                        {JOB_OPTIONS.map((opt, i) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                className={`su-job-option${i < JOB_OPTIONS.length - 1 ? " su-job-option--bordered" : ""}`}
                                                onClick={() => {
                                                    setDesiredJob(opt);
                                                    setJobDropdownOpen(false);
                                                    clearError("desiredJob");
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* ← 추가: 멘토/멘티 선택 */}
                            <div className="su-form-group">
                                <label className="su-form-label">멘토/멘티 여부</label>
                                <p className="su-form-hint">커뮤니티에서 프로필 옆에 표시됩니다.</p>
                                <div className="su-purpose-group">
                                    {ROLE_OPTIONS.map((opt) => (
                                        <button key={opt} type="button"
                                                className={`su-btn-purpose${role === opt ? " su-btn-purpose--selected" : ""}`}
                                                onClick={() => setRole(opt)}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {signupError && (
                                <div className="su-signup-error">{signupError}</div>
                            )}

                            <div className="su-btn-row">
                                <button type="button" className="su-btn-prev" onClick={goPrev} disabled={loading}>이전</button>
                                <button type="submit" className="su-btn-next" disabled={loading}>
                                    {loading ? "처리 중..." : "가입 완료"}
                                </button>
                            </div>
                        </div>
                    )}

                </form>

                <div className="su-bottom-bar" />
            </main>
        </div>
    );
}

function FormGroup({ label, htmlFor, hint, error, children }) {
    return (
        <div className="su-form-group">
            <label className="su-form-label" htmlFor={htmlFor}>{label}</label>
            {children}
            {hint && <p className="su-form-hint">{hint}</p>}
            {error && <span className="su-error-message">{error}</span>}
        </div>
    );
}