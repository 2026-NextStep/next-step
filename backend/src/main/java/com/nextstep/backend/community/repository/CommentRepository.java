package com.nextstep.backend.community.repository;

import com.nextstep.backend.community.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository
        extends JpaRepository<Comment, Long> {
}
