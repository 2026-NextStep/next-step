package com.nextstep.backend.community.repository;

import com.nextstep.backend.community.entity.PostView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface PostViewRepository extends JpaRepository<PostView, Long> {

    // 이미 기록이 있고 마지막 조회일이 오늘 "이전"이면 오늘로 갱신한다. 갱신됐으면 1 (= 오늘 첫 조회)
    @Modifying
    @Query("update PostView v set v.lastViewDate = :today " +
            "where v.postId = :postId and v.viewerKey = :viewerKey and v.lastViewDate < :today")
    int touchIfBefore(@Param("postId") Long postId,
                      @Param("viewerKey") String viewerKey,
                      @Param("today") LocalDate today);

    // 기록이 아예 없으면 새로 넣는다. 넣었으면 1 (= 이 사람의 첫 조회), 이미 있으면 무시하고 0.
    // 동시에 같은 요청이 들어와도 (post_id, viewer_key) 유니크 제약 덕분에 한 번만 들어간다.
    @Modifying
    @Query(value = "INSERT IGNORE INTO post_view (post_id, viewer_key, last_view_date) " +
            "VALUES (:postId, :viewerKey, :today)", nativeQuery = true)
    int insertIgnore(@Param("postId") Long postId,
                     @Param("viewerKey") String viewerKey,
                     @Param("today") LocalDate today);

    // 조회수 +1 (읽고 더하고 저장하는 방식이 아니라 DB 에서 바로 더해서, 동시에 열어도 숫자가 틀어지지 않는다)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Post p set p.views = p.views + 1 where p.id = :postId")
    int incrementPostViews(@Param("postId") Long postId);
}