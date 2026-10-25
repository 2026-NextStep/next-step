package com.nextstep.backend.contract.service;

import com.nextstep.backend.contract.dto.ContractAnalysisResponse;
import com.nextstep.backend.contract.entity.ContractDocument;

public interface ContractAnalysisProvider {
    ContractAnalysisResponse analyze(ContractDocument contract, byte[] fileBytes, String mimeType);
}