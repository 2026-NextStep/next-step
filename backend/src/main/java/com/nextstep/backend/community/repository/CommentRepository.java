package com.nextstep.backend.community.repository;

import com.nextstep.backend.community.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository
        extends JpaRepository<Comment, Long> {

    // 이 댓글에 달린 답글(대댓글)이 있는지
    boolean existsByParentId(Long parentId);
}