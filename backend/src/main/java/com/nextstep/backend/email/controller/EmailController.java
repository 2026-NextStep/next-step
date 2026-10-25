package com.nextstep.backend.email.controller;

import com.nextstep.backend.email.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    /** 인증코드 발송 — POST /api/v1/email/send { "email": "user@gmail.com" } */
    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendCode(
            @RequestBody Map<String, String> body
    ) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "이메일을 입력해주세요."));
        }

        try {
            emailService.sendVerificationCode(email);
            return ResponseEntity.ok(Map.of("message", "인증코드가 발송되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "이메일 발송에 실패했습니다."));
        }
    }

    /** 인증코드 검증 — POST /api/v1/email/verify { "email": "...", "code": "123456" } */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyCode(
            @RequestBody Map<String, String> body
    ) {
        String email = body.get("email");
        String code  = body.get("code");

        boolean verified = emailService.verifyCode(email, code);

        if (verified) {
            return ResponseEntity.ok(Map.of(
                    "verified", true,
                    "message",  "이메일 인증이 완료되었습니다."
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "verified", false,
                    "message",  "인증코드가 올바르지 않거나 만료되었습니다."
            ));
        }
    }
}