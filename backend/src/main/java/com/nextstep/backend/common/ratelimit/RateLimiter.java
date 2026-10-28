package com.nextstep.backend.common.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 간단한 요청 횟수 제한 (서버 메모리 기반, 슬라이딩 윈도우).
 * 비용이 드는 AI 호출·외부 메일 발송의 남용을 막는 용도. 서버 재시작 시 기록은 초기화된다.
 */
@Component
public class RateLimiter {

    private static final long MAX_WINDOW_MILLIS = Duration.ofDays(1).toMillis();

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    /** window 안에 max회 미만이면 이번 요청을 기록하고 통과, 아니면 429 */
    public void acquire(String key, int max, Duration window, String message) {
        if (!isAllowed(key, max, window)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, message);
        }
        record(key);
    }

    /** 기록하지 않고 통과 가능 여부만 확인 (여러 제한을 모두 확인한 뒤 한꺼번에 기록할 때 사용) */
    public boolean isAllowed(String key, int max, Duration window) {
        Deque<Long> q = hits.get(key);
        if (q == null) return max > 0;
        long from = System.currentTimeMillis() - window.toMillis();
        synchronized (q) {
            return q.stream().filter(t -> t > from).count() < max;
        }
    }

    public void record(String key) {
        Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            q.addLast(System.currentTimeMillis());
        }
    }

    /** 가장 최근 기록 1건 취소 — 요청이 실패해 사용자에게 결과를 주지 못했을 때 횟수를 돌려준다 */
    public void refund(String key) {
        Deque<Long> q = hits.get(key);
        if (q == null) return;
        synchronized (q) {
            q.pollLast();
        }
    }

    /** 하루 넘은 기록 정리 (메모리 누수 방지) */
    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void cleanup() {
        long from = System.currentTimeMillis() - MAX_WINDOW_MILLIS;
        hits.entrySet().removeIf(e -> {
            Deque<Long> q = e.getValue();
            synchronized (q) {
                while (!q.isEmpty() && q.peekFirst() <= from) q.pollFirst();
                return q.isEmpty();
            }
        });
    }

    /**
     * 요청자 IP. 배포 환경에서는 Nginx가 넣어 주는 X-Real-IP를 우선 사용한다
     * (X-Forwarded-For 첫 값은 클라이언트가 임의로 넣을 수 있어 제한 우회에 쓰일 수 있음).
     */
    public static String clientIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        return (realIp != null && !realIp.isBlank()) ? realIp.trim() : request.getRemoteAddr();
    }
}
