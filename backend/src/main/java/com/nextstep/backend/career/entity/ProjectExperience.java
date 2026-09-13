package com.nextstep.backend.career.entity;

import com.nextstep.backend.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_experience",
        indexes = @Index(name = "idx_project_experience_member", columnList = "member_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectExperience {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 100)
    private String name;
    @Column(length = 100)
    private String role;
    @Column(length = 500)
    private String technologies;
    @Column(length = 5000)
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public ProjectExperience(Member member, String name, String role, String technologies, String description) {
        this.member = member;
        this.name = name;
        this.role = role;
        this.technologies = technologies;
        this.description = description;
    }

    public void update(String name, String role, String technologies, String description) {
        if (name != null) this.name = name;
        if (role != null) this.role = role;
        if (technologies != null) this.technologies = technologies;
        if (description != null) this.description = description;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

