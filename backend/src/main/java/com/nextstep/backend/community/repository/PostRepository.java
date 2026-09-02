package com.nextstep.backend.community.repository;

import com.nextstep.backend.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p WHERE " +
            "(:category IS NULL OR :category = '전체' OR p.category = :category) AND " +
            "(:keyword IS NULL OR :keyword = '' OR " +
            "  LOWER(p.title)   LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "  LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:job IS NULL OR :job = '' OR p.job = :job)")
    Page<Post> findWithFilters(
            @Param("category") String category,
            @Param("keyword")  String keyword,
            @Param("job")      String job,
            Pageable pageable
    );
}
