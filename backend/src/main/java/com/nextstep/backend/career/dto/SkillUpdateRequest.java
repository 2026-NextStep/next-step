package com.nextstep.backend.career.dto;

import com.nextstep.backend.career.entity.Proficiency;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SkillUpdateRequest {
    @Pattern(regexp = "(?sU).*\\S.*", message = "이름은 공백일 수 없습니다.")
    @Size(max = 100, message = "이름은 100자 이하여야 합니다.")
    private String name;

    private Proficiency proficiency;
}
