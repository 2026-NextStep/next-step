package com.nextstep.backend.email.controller;

import com.nextstep.backend.common.ratelimit.RateLimiter;
import com.nextstep.backend.email.service.EmailService;
import com.nextstep.backend.email.service.EmailService.VerifyResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;
    private final RateLimiter rateLimiter;

    // 회원가입 전 단계라 로그인을 요구할 수 없으므로, 발송 횟수로 메일 폭탄·대량 발송을 막는다
    @Value("${ratelimit.email.cooldown-seconds:60}")
    private int cooldownSeconds;
    @Value("${ratelimit.email.per-day:5}")
    private int perEmailPerDay;
    @Value("${ratelimit.email.ip-per-hour:10}")
    private int perIpPerHour;
    @Value("${email.verify.max-attempts:5}")
    private int maxAttempts;

    /** 인증코드 발송 — POST /api/v1/email/send { "email": "user@gmail.com" } */
    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendCode(
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "이메일을 입력해주세요."));
        }

        String emailKey = "email:" + email.trim().toLowerCase(Locale.ROOT);
        String ipKey    = "email-ip:" + RateLimiter.clientIp(request);
        String limited = null;
        if (!rateLimiter.isAllowed(emailKey + ":cooldown", 1, Duration.ofSeconds(cooldownSeconds))) {
            limited = "인증코드는 " + cooldownSeconds + "초에 한 번만 받을 수 있어요. 잠시 후 다시 시도해주세요.";
        } else if (!rateLimiter.isAllowed(emailKey + ":day", perEmailPerDay, Duration.ofDays(1))) {
            limited = "오늘 이 이메일로 받을 수 있는 인증코드 횟수(" + perEmailPerDay + "회)를 넘었어요. 내일 다시 시도해주세요.";
        } else if (!rateLimiter.isAllowed(ipKey, perIpPerHour, Duration.ofHours(1))) {
            limited = "요청이 너무 많아요. 잠시 후 다시 시도해주세요.";
        }
        if (limited != null) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", limited));
        }

        try {
            emailService.sendVerificationCode(email);
            rateLimiter.record(emailKey + ":cooldown");
            rateLimiter.record(emailKey + ":day");
            rateLimiter.record(ipKey);
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

        VerifyResult result = emailService.verifyCode(email, code);

        if (result == VerifyResult.VERIFIED) {
            return ResponseEntity.ok(Map.of(
                    "verified", true,
                    "message",  "이메일 인증이 완료되었습니다."
            ));
        }
        String message = switch (result) {
            case LOCKED -> "인증코드를 " + maxAttempts + "회 틀려 코드가 무효화되었어요. 인증코드를 다시 받아주세요.";
            case WRONG_CODE -> "인증코드가 올바르지 않습니다.";
            default -> "인증코드가 올바르지 않거나 만료되었습니다.";
        };
        return ResponseEntity.badRequest().body(Map.of(
                "verified", false,
                "message",  message
        ));
    }
}
