package com.nextstep.backend.contract.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ContractUploadResponse {

    private Long contractId;
    private String fileName;
    private String message;
}