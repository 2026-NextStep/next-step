package com.nextstep.backend.community.repository;

import com.nextstep.backend.community.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    boolean existsByUsernameAndPostId(String username, Long postId);
    Optional<Bookmark> findByUsernameAndPostId(String username, Long postId);
    List<Bookmark> findByUsername(String username);
}
