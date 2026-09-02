package com.nextstep.backend.contract.controller;

import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.contract.dto.ContractAnalysisResponse;
import com.nextstep.backend.contract.dto.ContractUploadResponse;
import com.nextstep.backend.contract.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
        return ResponseEntity.ok(contractService.getContractAnalysis(contractId));
    }

    @DeleteMapping("/{contractId}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long contractId) {
        contractService.deleteContract(contractId);
        return ResponseEntity.noContent().build();
    }
}