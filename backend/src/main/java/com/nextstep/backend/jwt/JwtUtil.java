package com.nextstep.backend.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private static final long DAY_MS        = 1000L * 60 * 60 * 24;
    private static final long REMEMBER_DAYS = 30;
    private static final long DEFAULT_DAYS  = 1;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** 토큰 생성. rememberMe=true → 30일 / false → 1일 */
    public String generateToken(String username, boolean rememberMe) {
        return generateToken(username, rememberMe, false);
    }

    public String generateToken(String username, boolean rememberMe, boolean isAdmin) {
        long expireMs = rememberMe
                ? REMEMBER_DAYS * DAY_MS
                : DEFAULT_DAYS  * DAY_MS;

        return Jwts.builder()
                .subject(username)
                .claim("isAdmin", isAdmin)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expireMs))
                .signWith(getKey())
                .compact();
    }

    /** 토큰에서 username 추출 */
    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /** 토큰에서 isAdmin 클레임 추출 */
    public boolean getIsAdmin(String token) {
        Object claim = parseClaims(token).get("isAdmin");
        return Boolean.TRUE.equals(claim);
    }

    /** 토큰 유효성 검증 */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}