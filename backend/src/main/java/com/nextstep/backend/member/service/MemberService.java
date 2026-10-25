package com.nextstep.backend.member.service;

import com.nextstep.backend.common.util.RoleMapper;
import com.nextstep.backend.member.dto.MemberResponse;
import com.nextstep.backend.member.dto.MemberUpdateRequest;
import com.nextstep.backend.member.dto.PasswordChangeRequest;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    private static final long   MAX_PROFILE_SIZE  = 5 * 1024 * 1024L;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/jpg", "image/png");
    private static final String PROFILE_DIR        = "uploads/profile";

    /** 마이페이지 — 내 정보 조회 */
    public MemberResponse getMyInfo(Long memberId) {
        return MemberResponse.from(findMemberOrThrow(memberId));
    }

    /** 마이페이지 — 회원 정보 수정 (닉네임 변경 시 중복 검증) */
    @Transactional
    public MemberResponse updateMyInfo(Long memberId, MemberUpdateRequest request) {
        Member member = findMemberOrThrow(memberId);

        if (request.getNickname() != null
                && !request.getNickname().equals(member.getNickname())
                && memberRepository.existsByNickname(request.getNickname())) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        member.updateProfile(
                request.getNickname(),
                request.getPhone(),
                request.getDesiredJob(),
                request.getBirthDate(),
                request.getAddress(),
                request.getAddressDetail()
        );

        if (request.getRole() != null) {
            member.updateRole(RoleMapper.map(request.getRole()));
        }

        return MemberResponse.from(member);
    }

    /**
     * 마이페이지 — 비밀번호 변경.
     * password가 비어있는 경우(소셜 로그인 계정) 변경 불가.
     */
    @Transactional
    public void changePassword(Long memberId, PasswordChangeRequest request) {
        Member member = findMemberOrThrow(memberId);

        if (member.getPassword() == null || member.getPassword().isEmpty()) {
            throw new IllegalStateException("소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), member.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        member.changePassword(passwordEncoder.encode(request.getNewPassword()));
    }

    /** 마이페이지 — 닉네임 중복 확인 */
    public boolean isNicknameDuplicate(String nickname) {
        return memberRepository.existsByNickname(nickname);
    }

    /**
     * 마이페이지 — 프로필 이미지 업로드.
     * 파일 검증 → 저장 → 기존 이미지 삭제 → DB 경로 업데이트.
     */
    @Transactional
    public String uploadProfileImage(Long memberId, MultipartFile file) {
        // 파일 검증
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }
        if (file.getSize() > MAX_PROFILE_SIZE) {
            throw new IllegalArgumentException("이미지는 5MB 이하만 업로드 가능합니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("JPG, PNG 형식만 업로드 가능합니다.");
        }

        // 날짜별 저장 경로 생성
        String dateDir     = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String extension   = extractExtension(file.getOriginalFilename());
        String filename    = UUID.randomUUID() + "." + extension;
        String relativePath = "/" + PROFILE_DIR + "/" + dateDir + "/" + filename;

        Path absoluteDir  = Paths.get(System.getProperty("user.dir"), PROFILE_DIR, dateDir).toAbsolutePath().normalize();
        Path absoluteFile = absoluteDir.resolve(filename);

        try {
            Files.createDirectories(absoluteDir);
            file.transferTo(absoluteFile.toFile());
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 중 오류가 발생했습니다.", e);
        }

        // 기존 프로필 이미지 삭제
        Member member = findMemberOrThrow(memberId);
        deleteOldProfileImage(member.getProfileImage());

        // DB 경로 업데이트
        member.updateProfileImage(relativePath);

        return relativePath;
    }

    /**
     * 마이페이지 — 프로필 이미지 삭제.
     * 파일 삭제 후 DB 경로를 null로 초기화.
     * 이미 null이거나 파일이 없어도 예외 없이 처리.
     */
    @Transactional
    public void deleteProfileImage(Long memberId) {
        Member member = findMemberOrThrow(memberId);
        deleteOldProfileImage(member.getProfileImage());
        member.updateProfileImage(null);
    }

    private void deleteOldProfileImage(String oldPath) {
        if (oldPath == null || oldPath.isBlank() || !oldPath.startsWith("/" + PROFILE_DIR)) {
            return;
        }
        Path absolutePath = Paths.get(System.getProperty("user.dir"), oldPath).toAbsolutePath().normalize();
        try {
            Files.deleteIfExists(absolutePath);
        } catch (IOException e) {
            log.warn("기존 프로필 이미지 삭제 실패: {}", absolutePath, e);
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private Member findMemberOrThrow(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "회원을 찾을 수 없습니다. memberId=" + memberId));
    }
}