package com.nextstep.backend.member.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "member")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "username", nullable = false, length = 50, unique = true)
    private String username;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "email", nullable = false, length = 100, unique = true)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "nickname", nullable = false, length = 50, unique = true)
    private String nickname;

    @Builder.Default
    @Column(name = "role", nullable = false, length = 20)
    private String role = "USER";

    @Column(name = "desired_job", length = 100)
    private String desiredJob;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "address_detail", length = 255)
    private String addressDetail;

    @Builder.Default
    @Column(name = "is_admin", nullable = false)
    private Boolean isAdmin = false;

    @Column(name = "provider", length = 20)
    private String provider;

    @Column(name = "provider_id", length = 100)
    private String providerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.role == null) {
            this.role = "USER";
        }
        if (this.isAdmin == null) {
            this.isAdmin = false;
        }
    }

    /**
     * 마이페이지에서 수정 가능한 기본 프로필 정보 일괄 변경.
     * username, password, memberId, createdAt, isAdmin은 변경 불가.
     * role은 별도 updateRole()로 변경 가능 (USER/MENTOR/MENTEE).
     */
    public void updateProfile(
            String nickname,
            String phone,
            String desiredJob,
            LocalDate birthDate,
            String address,
            String addressDetail
    ) {
        if (nickname != null) this.nickname = nickname;
        if (phone != null) this.phone = phone;
        if (desiredJob != null) this.desiredJob = desiredJob;
        if (birthDate != null) this.birthDate = birthDate;
        if (address != null) this.address = address;
        if (addressDetail != null) this.addressDetail = addressDetail;
    }

    /**
     * 멘토/멘티 역할 변경 (USER/MENTOR/MENTEE).
     * isAdmin은 변경 불가 — 이 메서드로 건드리지 말 것.
     */
    public void updateRole(String role) {
        this.role = role;
    }

    /**
     * 프로필 이미지 경로만 별도로 변경.
     * null을 명시적으로 전달하면 이미지 제거(기본 이미지로 복귀).
     */
    public void updateProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    /**
     * 비밀번호 변경. 호출 측에서 반드시 암호화된 값을 전달해야 함.
     */
    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }
}
