package com.nextstep.backend.community.controller;

import com.nextstep.backend.community.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    // 즐겨찾기 토글
    // POST /api/v1/community/post/{id}/bookmark?username=닉네임
    @PostMapping("/post/{id}/bookmark")
    public ResponseEntity<Map<String, Boolean>> toggleBookmark(
            @PathVariable Long id,
            @RequestParam String username
    ) {
        boolean bookmarked = bookmarkService.toggle(username, id);
        return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
    }

    // 사용자 즐겨찾기 목록 조회
    // GET /api/v1/community/bookmarks?username=닉네임
    @GetMapping("/bookmarks")
    public ResponseEntity<Map<String, List<Long>>> getBookmarks(
            @RequestParam String username
    ) {
        List<Long> postIds = bookmarkService.getBookmarkedPostIds(username);
        return ResponseEntity.ok(Map.of("postIds", postIds));
    }
}
