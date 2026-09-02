package com.nextstep.backend.community.service;

import com.nextstep.backend.community.dto.FavoritePostResponseDto;
import com.nextstep.backend.community.entity.Bookmark;
import com.nextstep.backend.community.repository.BookmarkRepository;
import com.nextstep.backend.community.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final PostRepository postRepository;

    // 즐겨찾기 토글 (있으면 삭제, 없으면 추가)
    @Transactional
    public boolean toggle(String username, Long postId) {
        if (bookmarkRepository.existsByUsernameAndPostId(username, postId)) {
            bookmarkRepository.findByUsernameAndPostId(username, postId)
                    .ifPresent(bookmarkRepository::delete);
            return false; // 즐겨찾기 해제
        } else {
            Bookmark bookmark = new Bookmark();
            bookmark.setUsername(username);
            bookmark.setPostId(postId);
            bookmark.setCreatedAt(LocalDateTime.now());
            bookmarkRepository.save(bookmark);
            return true;  // 즐겨찾기 추가
        }
    }

    // 사용자의 즐겨찾기 postId 목록
    public List<Long> getBookmarkedPostIds(String username) {
        return bookmarkRepository.findByUsername(username)
                .stream()
                .map(Bookmark::getPostId)
                .toList();
    }

    // 즐겨찾기한 게시글 상세 목록 (마이페이지용)
    public List<FavoritePostResponseDto> getFavoritePostDetails(String username) {
        List<Long> postIds = getBookmarkedPostIds(username);
        if (postIds.isEmpty()) return List.of();
        return postRepository.findAllById(postIds)
                .stream()
                .map(FavoritePostResponseDto::from)
                .toList();
    }
}
