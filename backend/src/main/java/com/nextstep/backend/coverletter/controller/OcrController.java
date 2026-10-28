package com.nextstep.backend.coverletter.controller;

import com.nextstep.backend.common.ratelimit.RateLimiter;
import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.coverletter.service.OcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;
    private final SecurityUtil securityUtil;
    private final RateLimiter rateLimiter;

    // OCR은 GCP 비용이 들어 로그인 필수 + 회원당 하루 횟수 제한
    @Value("${ratelimit.ocr.per-day:20}")
    private int ocrPerDay;

    /**
     * PDF 파일을 업로드하면 텍스트를 추출해서 반환
     * POST /api/v1/ocr/extract
     */
    @PostMapping("/extract")
    public ResponseEntity<?> extractText(
            @RequestParam("file") MultipartFile file
    ) {
        Long memberId = securityUtil.getCurrentMemberId();  // 비로그인 시 403

        // PDF 파일 검증
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "파일이 비어있습니다."));
        }

        if (!"application/pdf".equals(file.getContentType())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "PDF 파일만 업로드 가능합니다."));
        }

        // 형식 검증을 통과한 요청만 횟수에 포함
        rateLimiter.acquire("ocr:" + memberId, ocrPerDay, Duration.ofDays(1),
                "오늘 PDF 텍스트 추출 횟수(" + ocrPerDay + "회)를 모두 사용했어요. 내일 다시 이용해 주세요.");

        try {
            String text = ocrService.extractText(file);
            return ResponseEntity.ok(Map.of("text", text));

        } catch (Exception e) {
            rateLimiter.refund("ocr:" + memberId);  // 읽을 수 없는 PDF 등 실패 시 횟수를 돌려준다
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
