package com.nextstep.backend.contract.dto.fastapi;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FastApiKeyClause {
    private String title;
    private String content;
    private String importance;
}