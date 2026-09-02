package com.nextstep.backend.coverletter.controller;

import com.nextstep.backend.coverletter.service.OcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService ocrService;

    /**
     * PDF 파일을 업로드하면 텍스트를 추출해서 반환
     * POST /api/v1/ocr/extract
     */
    @PostMapping("/extract")
    public ResponseEntity<?> extractText(
            @RequestParam("file") MultipartFile file
    ) {
        // PDF 파일 검증
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "파일이 비어있습니다."));
        }

        if (!file.getContentType().equals("application/pdf")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "PDF 파일만 업로드 가능합니다."));
        }

        try {
            String text = ocrService.extractText(file);
            return ResponseEntity.ok(Map.of("text", text));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
