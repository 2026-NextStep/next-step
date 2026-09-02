package com.nextstep.backend.contract.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024L;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");
    private static final String BASE_DIR = "uploads/contracts";

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("파일 크기는 10MB 이하여야 합니다");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("PDF, JPG, PNG 파일만 업로드 가능합니다");
        }

        String safeFilename = sanitizeFilename(originalFilename);
        String dateDir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String storedFilename = UUID.randomUUID() + "_" + safeFilename;

        String relativePath = BASE_DIR + "/" + dateDir + "/" + storedFilename;
        Path absoluteDirPath = Paths.get(System.getProperty("user.dir"), BASE_DIR, dateDir)
                .toAbsolutePath().normalize();
        try {
            Files.createDirectories(absoluteDirPath);
            Path absoluteFilePath = absoluteDirPath.resolve(storedFilename);
            file.transferTo(absoluteFilePath.toFile());
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다", e);
        }

        return relativePath;
    }

    public void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return;
        }
        Path absoluteFilePath = Paths.get(System.getProperty("user.dir"), filePath)
                .toAbsolutePath().normalize();
        try {
            boolean deleted = Files.deleteIfExists(absoluteFilePath);
            if (deleted) {
                log.info("파일 삭제 완료: {}", absoluteFilePath);
            } else {
                log.warn("삭제할 파일이 존재하지 않음: {}", absoluteFilePath);
            }
        } catch (IOException e) {
            log.error("파일 삭제 실패: {}", absoluteFilePath, e);
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) {
            return "unknown";
        }
        return filename.replaceAll("[\\\\/:\\*\\?\"<>|]", "_")
                       .replaceAll("\\.\\.", "_");
    }
}