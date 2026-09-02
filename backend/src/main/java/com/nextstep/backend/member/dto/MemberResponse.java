package com.nextstep.backend.member.dto;

import com.nextstep.backend.member.entity.Member;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class MemberResponse {
    private Long memberId;
    private String username;
    private String name;
    private String email;
    private String phone;
    private String nickname;
    private String role;
    private String desiredJob;
    private String profileImage;
    private LocalDate birthDate;
    private String address;
    private String addressDetail;
    private LocalDateTime createdAt;
    private String provider;

    public static MemberResponse from(Member member) {
        return MemberResponse.builder()
                .memberId(member.getMemberId())
                .username(member.getUsername())
                .name(member.getName())
                .email(member.getEmail())
                .phone(member.getPhone())
                .nickname(member.getNickname())
                .role(member.getRole())
                .desiredJob(member.getDesiredJob())
                .profileImage(member.getProfileImage())
                .birthDate(member.getBirthDate())
                .address(member.getAddress())
                .addressDetail(member.getAddressDetail())
                .createdAt(member.getCreatedAt())
                .provider(member.getProvider())
                .build();
    }
}