package com.nextstep.backend.common.util;

import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SecurityUtil {

    private final MemberRepository memberRepository;

    /**
     * SecurityContext에서 현재 로그인 사용자의 memberId를 반환.
     * 토큰 없이 호출 시 IllegalStateException → GlobalExceptionHandler가 403으로 변환.
     */
    /** 비로그인 시 null 반환 (북마크 표시 등 선택적 인증에 사용) */
    public Long getCurrentMemberIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return memberRepository.findByUsername(auth.getName())
                .map(m -> m.getMemberId())
                .orElse(null);
    }

    public Long getCurrentMemberId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        String username = auth.getName();
        return memberRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("회원 정보를 찾을 수 없습니다."))
                .getMemberId();
    }
}