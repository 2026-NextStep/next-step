package com.nextstep.backend.career.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProjectExperienceCreateRequest {
    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 100, message = "이름은 100자 이하여야 합니다.")
    private String name;
    @Size(max = 100, message = "역할은 100자 이하여야 합니다.")
    private String role;
    @Size(max = 500, message = "사용 기술은 500자 이하여야 합니다.")
    private String technologies;
    @Size(max = 5000, message = "설명은 5000자 이하여야 합니다.")
    private String description;
}
