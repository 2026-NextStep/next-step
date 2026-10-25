package com.nextstep.backend.community.service;

import com.nextstep.backend.community.repository.PostViewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * 조회수 중복 방지: 같은 사람은 같은 글의 조회수를 하루에 한 번만 올린다.
 * 하루의 기준은 한국 시간(자정)이다.
 */
@Service
@RequiredArgsConstructor
public class PostViewService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final PostViewRepository postViewRepository;

    /**
     * @return 이번 조회를 센 경우 true, 오늘 이미 센 사람이라 건너뛴 경우 false
     */
    @Transactional
    public boolean countView(Long postId, String viewerKey) {
        if (viewerKey == null || viewerKey.isBlank()) {
            return false;
        }

        LocalDate today = LocalDate.now(KST);

        // 1) 어제 이전에 본 기록이 있으면 오늘 날짜로 갱신 → 오늘 첫 조회
        // 2) 기록이 없으면 새로 기록 → 이 사람의 첫 조회
        // 둘 다 아니면(오늘 이미 봤으면) 세지 않는다. (|| 라서 1)이 성공하면 2)는 실행되지 않는다)
        boolean counted =
                postViewRepository.touchIfBefore(postId, viewerKey, today) > 0
                        || postViewRepository.insertIgnore(postId, viewerKey, today) > 0;

        if (counted) {
            postViewRepository.incrementPostViews(postId);
        }
        return counted;
    }
}