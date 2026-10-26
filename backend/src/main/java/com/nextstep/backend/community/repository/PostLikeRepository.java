package com.nextstep.backend.community.repository;

import com.nextstep.backend.community.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    // 이 회원이 이 글에 좋아요를 눌렀는지
    boolean existsByPostIdAndMemberId(Long postId, Long memberId);

    // 좋아요 취소: 지운 줄 수(1이면 눌러 둔 상태였음, 0이면 아니었음)
    @Modifying
    @Query("delete from PostLike l where l.postId = :postId and l.memberId = :memberId")
    int deleteByPair(@Param("postId") Long postId, @Param("memberId") Long memberId);

    // 좋아요 기록: 새로 넣었으면 1, 이미 있으면 무시하고 0.
    // 동시에 같은 요청이 들어와도 (post_id, member_id) 유니크 제약 덕분에 한 번만 들어간다.
    @Modifying
    @Query(value = "INSERT IGNORE INTO post_like (post_id, member_id) VALUES (:postId, :memberId)", nativeQuery = true)
    int insertIgnore(@Param("postId") Long postId, @Param("memberId") Long memberId);

    // 글의 좋아요 수 +1 / -1 (읽고 더하고 저장하는 방식이 아니라 DB 에서 바로 계산해서, 동시에 눌러도 숫자가 틀어지지 않는다)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Post p set p.likes = p.likes + 1 where p.id = :postId")
    int increment(@Param("postId") Long postId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Post p set p.likes = case when p.likes > 0 then p.likes - 1 else 0 end where p.id = :postId")
    int decrement(@Param("postId") Long postId);
}