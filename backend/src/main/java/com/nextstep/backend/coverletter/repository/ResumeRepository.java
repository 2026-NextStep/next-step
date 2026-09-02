package com.nextstep.backend.coverletter.repository;

import com.nextstep.backend.coverletter.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeRepository
        extends JpaRepository<Resume, Long> {

    // 특정 사용자의 자소서 목록 (최신순)
    List<Resume> findByUsernameOrderByUpdatedAtDesc(String username);
}
