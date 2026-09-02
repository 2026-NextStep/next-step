package com.nextstep.backend.contract.service;

import com.nextstep.backend.contract.dto.ContractAnalysisResponse;
import com.nextstep.backend.contract.dto.fastapi.FastApiAnalyzeResponse;
import com.nextstep.backend.contract.entity.ContractDocument;
import com.nextstep.backend.contract.mapper.ContractAnalysisMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ai.provider", havingValue = "fastapi", matchIfMissing = true)
public class FastApiAnalysisProvider implements ContractAnalysisProvider {

    private final WebClient aiWebClient;
    private final ContractAnalysisMapper mapper;

    @Value("${ai.fastapi.timeout-seconds:60}")
    private int timeoutSeconds;

    @Override
    public ContractAnalysisResponse analyze(ContractDocument contract, byte[] fileBytes, String mimeType) {
        try {
            MultiValueMap<String, HttpEntity<?>> parts = new LinkedMultiValueMap<>();

            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.parseMediaType(mimeType));
            fileHeaders.setContentDispositionFormData("file", contract.getFileName());

            parts.add("file", new HttpEntity<>(new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return contract.getFileName();
                }
            }, fileHeaders));

            FastApiAnalyzeResponse response = aiWebClient.post()
                    .uri("/api/v1/analyze")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(parts))
                    .retrieve()
                    .bodyToMono(FastApiAnalyzeResponse.class)
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .block();

            if (response == null || !response.isSuccess()) {
                throw new RuntimeException("FastAPI 분석 실패: 응답이 null이거나 success=false");
            }

            log.info("FastAPI 분석 완료 — contractId={}, riskLevel={}",
                    contract.getContractId(), response.getRiskLevel());
            return mapper.toAnalysisResponse(response, contract);

        } catch (WebClientResponseException e) {
            log.error("FastAPI 호출 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI 분석 서버 호출 실패: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("FastAPI 분석 중 예외 발생", e);
            throw new RuntimeException("AI 분석 실패: " + e.getMessage(), e);
        }
    }
}