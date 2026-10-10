package com.nextstep.backend.career.entity;

import com.nextstep.backend.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_skill", uniqueConstraints = @UniqueConstraint(name = "uq_member_skill_name", columnNames = {"member_id", "name"}),
        indexes = @Index(name = "idx_member_skill_member", columnList = "member_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 100, columnDefinition = "varchar(100) collate utf8mb4_unicode_ci")
    private String name;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Proficiency proficiency;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public MemberSkill(Member member, String name, Proficiency proficiency) {
        this.member = member;
        this.name = name;
        this.proficiency = proficiency;
    }

    public void update(String name, Proficiency proficiency) {
        if (name != null) this.name = name;
        if (proficiency != null) this.proficiency = proficiency;
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
