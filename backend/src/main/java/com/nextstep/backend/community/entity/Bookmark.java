package com.nextstep.backend.community.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Bookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;        // 즐겨찾기한 사용자
    private Long   postId;          // 즐겨찾기한 게시글
    private LocalDateTime createdAt;
}
