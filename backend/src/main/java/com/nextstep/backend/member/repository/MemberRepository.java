package com.nextstep.backend.member.repository;

import com.nextstep.backend.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByUsername(String username);

    Optional<Member> findByEmail(String email);

    Optional<Member> findByNickname(String nickname);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    Optional<Member> findByProviderAndProviderId(String provider, String providerId);

    List<Member> findAllByNicknameIn(Collection<String> nicknames);
}
