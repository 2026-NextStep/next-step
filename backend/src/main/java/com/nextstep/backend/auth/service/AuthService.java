package com.nextstep.backend.auth.service;

import com.nextstep.backend.auth.dto.LoginRequestDto;
import com.nextstep.backend.auth.dto.SignupRequestDto;
import com.nextstep.backend.common.util.RoleMapper;
import com.nextstep.backend.jwt.JwtUtil;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Value("${kakao.client-id}")
    private String kakaoClientId;

    @Value("${kakao.redirect-uri}")
    private String kakaoRedirectUri;

    /** 회원가입 — username/email/nickname 중복 체크 후 저장 */
    @Transactional
    public void signup(SignupRequestDto dto) {
        if (memberRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        if (memberRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        if (memberRepository.existsByNickname(dto.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        Member member = Member.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .nickname(dto.getNickname())
                .birthDate(dto.getBirthDate())
                .address(dto.getAddress())
                .addressDetail(dto.getAddressDetail())
                .desiredJob(dto.getDesiredJob())
                .role(RoleMapper.map(dto.getRole()))
                .provider("local")
                .build();

        memberRepository.save(member);
    }

    /** 일반 로그인 — 비밀번호 검증 후 JWT 반환 */
    public Map<String, Object> login(LoginRequestDto dto) {
        Member member = memberRepository.findByUsername(dto.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(dto.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String token = jwtUtil.generateToken(member.getUsername(), dto.isRememberMe(), Boolean.TRUE.equals(member.getIsAdmin()));

        return Map.of(
                "success",  true,
                "token",    token,
                "username", member.getUsername(),
                "nickname", member.getNickname()
        );
    }

    /** 카카오 로그인 — 인가코드로 사용자 정보 조회 후 JWT 반환
     *  팀원 버그 수정: JWT 토큰을 응답에 포함 */
    @Transactional
    public Map<String, Object> kakaoLogin(String code) {
        String accessToken = getKakaoAccessToken(code);
        return processKakaoUser(accessToken);
    }

    @SuppressWarnings("unchecked")
    private String getKakaoAccessToken(String code) {
        RestTemplate rt = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-type", "application/x-www-form-urlencoded;charset=utf-8");

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type",   "authorization_code");
        params.add("client_id",    kakaoClientId);
        params.add("redirect_uri", kakaoRedirectUri);
        params.add("code",         code);

        ResponseEntity<Map> response = rt.postForEntity(
                "https://kauth.kakao.com/oauth/token",
                new HttpEntity<>(params, headers),
                Map.class
        );
        return (String) response.getBody().get("access_token");
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> processKakaoUser(String accessToken) {
        RestTemplate rt = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);
        headers.add("Content-type",  "application/x-www-form-urlencoded;charset=utf-8");

        ResponseEntity<Map> response = rt.exchange(
                "https://kapi.kakao.com/v2/user/me",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        Map<String, Object> body       = response.getBody();
        String              providerId = String.valueOf(body.get("id"));

        Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");
        // 카카오 이메일 미동의 시 고유 fallback 이메일 사용 (UNIQUE NOT NULL 제약 준수)
        String email = (kakaoAccount != null && kakaoAccount.get("email") != null)
                ? (String) kakaoAccount.get("email")
                : "kakao_" + providerId + "@nextstep.local";

        Optional<Member> existing = memberRepository.findByProviderAndProviderId("kakao", providerId);

        Member member;
        if (existing.isPresent()) {
            member = existing.get();
        } else {
            member = Member.builder()
                    .username("kakao_" + providerId)
                    .password("")
                    .name("카카오회원")
                    .nickname("kakao_" + providerId)
                    .email(email)
                    .role("USER")
                    .provider("kakao")
                    .providerId(providerId)
                    .build();
            memberRepository.save(member);
        }

        String token = jwtUtil.generateToken(member.getUsername(), false, Boolean.TRUE.equals(member.getIsAdmin()));

        return Map.of(
                "success",  true,
                "token",    token,
                "username", member.getUsername(),
                "nickname", member.getNickname(),
                "provider", member.getProvider()
        );
    }
}