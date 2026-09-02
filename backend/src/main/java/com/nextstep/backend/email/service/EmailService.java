package com.nextstep.backend.email.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final Map<String, VerificationInfo> codeStore = new ConcurrentHashMap<>();

    public void sendVerificationCode(String email) {
        String code   = String.format("%06d", new Random().nextInt(1_000_000));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        codeStore.put(email, new VerificationInfo(code, expiry));

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

    public boolean verifyCode(String email, String code) {
        VerificationInfo info = codeStore.get(email);
        if (info == null) return false;
        if (LocalDateTime.now().isAfter(info.expiry())) {
            codeStore.remove(email);
            return false;
        }
        if (!info.code().equals(code)) return false;
        codeStore.remove(email);
        return true;
    }

    private record VerificationInfo(String code, LocalDateTime expiry) {}
}