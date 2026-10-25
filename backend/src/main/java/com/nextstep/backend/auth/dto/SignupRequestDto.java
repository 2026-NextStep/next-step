package com.nextstep.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class SignupRequestDto {

    @NotBlank(message = "아이디를 입력해주세요.")
    private String username;

    @NotBlank(message = "비밀번호를 입력해주세요.")
    private String password;

    @NotBlank(message = "닉네임을 입력해주세요.")
    private String nickname;

    @NotBlank(message = "이름을 입력해주세요.")
    private String name;

    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @NotBlank(message = "이메일을 입력해주세요.")
    private String email;

    private String phone;
    private LocalDate birthDate;   // 팀원 String → LocalDate (ISO-8601 "yyyy-MM-dd" 수신)
    private String address;
    private String addressDetail;
    private String desiredJob;
    private String role;           // 프론트에서 "멘토"/"멘티"/null, 서비스에서 영문 변환
}