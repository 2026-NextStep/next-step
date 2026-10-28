package com.nextstep.backend.email.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final Map<String, VerificationInfo> codeStore = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    // 인증코드를 이 횟수만큼 틀리면 코드를 무효화한다 (6자리 코드 무차별 대입 방지)
    @Value("${email.verify.max-attempts:5}")
    private int maxAttempts;

    public enum VerifyResult { VERIFIED, WRONG_CODE, EXPIRED, LOCKED }

    public void sendVerificationCode(String email) {
        String code   = String.format("%06d", random.nextInt(1_000_000));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        codeStore.put(email, new VerificationInfo(code, expiry, new AtomicInteger()));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(email);
        message.setSubject("[NextStep] 이메일 인증코드");
        message.setText(
                "안녕하세요! NextStep 이메일 인증코드입니다.\n\n" +
                "인증코드: " + code + "\n\n" +
                "인증코드는 5분간 유효합니다.\n" +
                "본인이 요청하지 않은 경우 이 메일을 무시하세요."
        );
        mailSender.send(message);
    }

    public void sendDeadlineAlert(String email, String subject, String htmlBody) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(email);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    public VerifyResult verifyCode(String email, String code) {
        VerificationInfo info = codeStore.get(email);
        if (info == null) return VerifyResult.EXPIRED;
        if (LocalDateTime.now().isAfter(info.expiry())) {
            codeStore.remove(email);
            return VerifyResult.EXPIRED;
        }
        if (!info.code().equals(code)) {
            if (info.failCount().incrementAndGet() >= maxAttempts) {
                codeStore.remove(email);
                return VerifyResult.LOCKED;
            }
            return VerifyResult.WRONG_CODE;
        }
        codeStore.remove(email);
        return VerifyResult.VERIFIED;
    }

    private record VerificationInfo(String code, LocalDateTime expiry, AtomicInteger failCount) {}
}