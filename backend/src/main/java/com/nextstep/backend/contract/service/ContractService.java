package com.nextstep.backend.contract.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextstep.backend.contract.dto.ContractAnalysisResponse;
import com.nextstep.backend.contract.dto.ContractUploadResponse;
import com.nextstep.backend.contract.entity.ContractDocument;
import com.nextstep.backend.contract.repository.ContractDocumentRepository;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ContractService {

    private static final ConcurrentHashMap<Long, Object> ANALYSIS_LOCKS = new ConcurrentHashMap<>();

    private static final Map<String, String> EXT_TO_MIME = Map.of(
            "pdf",  "application/pdf",
            "jpg",  "image/jpeg",
            "jpeg", "image/jpeg",
            "png",  "image/png"
    );

    private final ContractDocumentRepository contractDocumentRepository;
    private final MemberRepository memberRepository;
    private final FileStorageService fileStorageService;
    private final ContractAnalysisProvider analysisProvider;
    private final ObjectMapper objectMapper;

    public ContractUploadResponse uploadContract(MultipartFile file, Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다"));

        String filePath = fileStorageService.storeFile(file);

        ContractDocument contract = ContractDocument.builder()
                .member(member)
                .filePath(filePath)
                .fileName(file.getOriginalFilename())
                .build();

        ContractDocument saved = contractDocumentRepository.save(contract);

        return ContractUploadResponse.builder()
                .contractId(saved.getContractId())
                .fileName(saved.getFileName())
                .message("업로드가 완료되었습니다")
                .build();
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ContractAnalysisResponse getContractAnalysis(Long contractId) {
        Object lock = ANALYSIS_LOCKS.computeIfAbsent(contractId, k -> new Object());
        synchronized (lock) {
            try {
                ContractDocument contract = contractDocumentRepository.findById(contractId)
                        .orElseThrow(() -> new IllegalArgumentException("계약서를 찾을 수 없습니다"));

                // 캐시 확인: 이미 분석된 결과가 있으면 DB에서 바로 반환
                if (contract.getAnalyzedAt() != null
                        && contract.getAnalysisResult() != null
                        && !contract.getAnalysisResult().isBlank()) {
                    log.info("캐시된 분석 결과 반환 — contractId={}", contractId);
                    try {
                        return objectMapper.readValue(contract.getAnalysisResult(), ContractAnalysisResponse.class);
                    } catch (JsonProcessingException e) {
                        log.error("캐시 역직렬화 실패, 재분석 진행 — contractId={}", contractId, e);
                    }
                }

                // 캐시 없음: FastAPI 호출
                byte[] fileBytes = readFileBytes(contract.getFilePath());
                String mimeType = resolveMimeType(contract.getFileName());

                log.info("FastAPI 분석 호출 — contractId={}, mimeType={}", contractId, mimeType);
                ContractAnalysisResponse result = analysisProvider.analyze(contract, fileBytes, mimeType);

                // 결과를 DB에 저장
                try {
                    contract.saveAnalysisResult(objectMapper.writeValueAsString(result));
                    contractDocumentRepository.save(contract);
                    log.info("분석 결과 DB 저장 완료 — contractId={}", contractId);
                } catch (JsonProcessingException e) {
                    log.error("분석 결과 JSON 직렬화 실패 — contractId={}", contractId, e);
                }

                return result;
            } finally {
                ANALYSIS_LOCKS.remove(contractId);
            }
        }
    }

    public void deleteContract(Long contractId) {
        ContractDocument contract = contractDocumentRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("계약서를 찾을 수 없습니다"));
        fileStorageService.deleteFile(contract.getFilePath());
        contractDocumentRepository.delete(contract);
        log.info("계약서 {} 삭제 완료", contractId);
    }

    private byte[] readFileBytes(String filePath) {
        Path absolutePath = Paths.get(System.getProperty("user.dir"), filePath)
                .toAbsolutePath().normalize();
        try {
            return Files.readAllBytes(absolutePath);
        } catch (IOException e) {
            throw new RuntimeException("계약서 파일을 읽을 수 없습니다: " + absolutePath, e);
        }
    }

    private String resolveMimeType(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "application/pdf";
        String ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        return EXT_TO_MIME.getOrDefault(ext, "application/pdf");
    }
}