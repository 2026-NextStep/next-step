import { useEffect } from "react";
import { kakaoLogin } from "../api/auth";
import { saveToken, saveUserInfo } from "../utils/authUtils";

function KakaoCallback() {

    useEffect(() => {

        // 이미 사용한 code인지 확인
        const alreadyUsed = sessionStorage.getItem("kakao_code_used");

        if (alreadyUsed) {
            console.log("이미 사용된 인가코드");
            return;
        }

        // URL에서 code 추출
        const code = new URL(window.location.href).searchParams.get("code");

        console.log("인가코드:", code);

        // code 없으면 종료
        if (!code) {
            alert("인가코드가 없습니다.");
            return;
        }

        // code 사용 처리
        sessionStorage.setItem("kakao_code_used", "true");

        // Spring Boot 서버로 전달 (axiosInstance 사용 — 포트 8080, /api/v1)
        kakaoLogin(code)
            .then((data) => {
                console.log("카카오 로그인 결과:", data);

                if (data.success) {
                    // 토큰 저장 (팀원 원본 누락 버그 수정)
                    saveToken(data.token);
                    saveUserInfo(data.nickname || data.username);

                    // 로그인 성공 시 초기화
                    sessionStorage.removeItem("kakao_code_used");

                    alert("카카오 로그인 성공");

                    window.location.href = "/";
                }
            })
            .catch((err) => {
                console.error(err);
                sessionStorage.removeItem("kakao_code_used");
                alert("서버 오류");
            });

    }, []);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                fontSize: "20px",
                fontWeight: "bold",
            }}
        >
            카카오 로그인 처리중...
        </div>
    );
}

export default KakaoCallback;