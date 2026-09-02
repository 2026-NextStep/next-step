package com.nextstep.backend.contract.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FastApiRisk {

    private String type;
    private String description;
    private String reason;
    private String recommendation;
    private String severity;

    @JsonProperty("clause_reference")
    private String clauseReference;
}