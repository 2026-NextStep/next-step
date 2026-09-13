package com.nextstep.backend.career.dto;

import com.nextstep.backend.career.entity.MemberSkill;
import com.nextstep.backend.career.entity.Proficiency;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class SkillResponse {
    private Long id;
    private String name;
    private Proficiency proficiency;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SkillResponse from(MemberSkill entity) {
        return SkillResponse.builder()
                .id(entity.getId()).name(entity.getName())
                .proficiency(entity.getProficiency())
                .createdAt(entity.getCreatedAt()).updatedAt(entity.getUpdatedAt()).build();
    }
}

