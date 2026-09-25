package com.nextstep.backend.career.dto;

import com.nextstep.backend.career.entity.ProjectExperience;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class ProjectExperienceResponse {
    private Long id;
    private String name;
    private String role;
    private String technologies;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProjectExperienceResponse from(ProjectExperience entity) {
        return ProjectExperienceResponse.builder()
                .id(entity.getId()).name(entity.getName())
                .role(entity.getRole()).technologies(entity.getTechnologies()).description(entity.getDescription())
                .createdAt(entity.getCreatedAt()).updatedAt(entity.getUpdatedAt()).build();
    }
}

