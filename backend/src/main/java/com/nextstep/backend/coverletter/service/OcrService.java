package com.nextstep.backend.coverletter.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class OcrService {

    /**
     * PDF 파일에서 텍스트를 추출합니다.
     * @param file 업로드된 PDF 파일
     * @return 추출된 텍스트
     */
    public String extractText(MultipartFile file) throws Exception {

        // PDFBox 3.x → Loader.loadPDF() 사용
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {

            if (document.isEncrypted()) {
                throw new RuntimeException("암호화된 PDF는 지원하지 않습니다.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            if (text == null || text.trim().isEmpty()) {
                throw new RuntimeException(
                        "텍스트를 추출할 수 없습니다. 이미지 기반 PDF이거나 텍스트가 없습니다."
                );
            }

            return text.trim();
        }
    }
}
