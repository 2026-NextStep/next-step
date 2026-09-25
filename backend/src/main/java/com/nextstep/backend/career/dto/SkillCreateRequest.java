package com.nextstep.backend.career.dto;

import com.nextstep.backend.career.entity.Proficiency;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SkillCreateRequest {
    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 100, message = "이름은 100자 이하여야 합니다.")
    private String name;
    @NotNull(message = "숙련도는 필수입니다.")
    private Proficiency proficiency;
}

