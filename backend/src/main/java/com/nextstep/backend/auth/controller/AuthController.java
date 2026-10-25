package com.nextstep.backend.auth.controller;

import com.nextstep.backend.auth.dto.KakaoCodeDto;
import com.nextstep.backend.auth.dto.LoginRequestDto;
import com.nextstep.backend.auth.dto.SignupRequestDto;
import com.nextstep.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(
            @Valid @RequestBody SignupRequestDto dto
    ) {
        authService.signup(dto);
        return ResponseEntity.ok(Map.of("message", "회원가입이 완료되었습니다."));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody LoginRequestDto dto
    ) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @PostMapping("/kakao")
    public ResponseEntity<Map<String, Object>> kakaoLogin(
            @RequestBody KakaoCodeDto dto
    ) {
        return ResponseEntity.ok(authService.kakaoLogin(dto.getCode()));
    }
}