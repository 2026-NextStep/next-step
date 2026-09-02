package com.nextstep.backend.member.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class MemberUpdateRequest {

    @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.")
    private String nickname;

    @Pattern(regexp = "^$|^010-\\d{4}-\\d{4}$", message = "전화번호 형식이 올바르지 않습니다.")
    private String phone;

    @Size(max = 100)
    private String desiredJob;

    private LocalDate birthDate;

    @Size(max = 255)
    private String address;

    @Size(max = 255)
    private String addressDetail;

    private String role;  // nullable — "멘토"/"멘티"/"해당 없음"/"MENTOR"/"MENTEE"/"USER" 허용. null이면 기존 role 유지.
}