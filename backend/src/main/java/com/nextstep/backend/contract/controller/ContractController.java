package com.nextstep.backend.contract.controller;

import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.contract.dto.ContractAnalysisResponse;
import com.nextstep.backend.contract.dto.ContractUploadResponse;
import com.nextstep.backend.contract.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;
    private final SecurityUtil securityUtil;

    @PostMapping("/analyze")
    public ResponseEntity<ContractUploadResponse> upload(@RequestParam("file") MultipartFile file) {
        ContractUploadResponse response = contractService.uploadContract(file, securityUtil.getCurrentMemberId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{contractId}/analysis")
    public ResponseEntity<ContractAnalysisResponse> getAnalysis(@PathVariable Long contractId) {
        return ResponseEntity.ok(contractService.getContractAnalysis(contractId, securityUtil.getCurrentMemberId()));
    }

    @DeleteMapping("/{contractId}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long contractId) {
        contractService.deleteContract(contractId, securityUtil.getCurrentMemberId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/active")
    public ResponseEntity<Map<String, Long>> getActiveContract() {
        return contractService.getActiveContractId(securityUtil.getCurrentMemberId())
                .map(contractId -> ResponseEntity.ok(Map.of("contractId", contractId)))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}