package com.nextstep.backend.community.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 카테고리: 자소서 / 면접 / 기업 질문 / 자유 게시판
    private String category;

    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    // 직종: IT·개발 / 디자인 / 마케팅·홍보 / 기획·전략 / 회계·재무 / 기타
    private String job;

    private String writer;

    private String writerRole; // ← 추가: 멘토 / 멘티 / null

    private LocalDateTime createdAt;

    // 조회수
    private int views = 0;

    // 추천수
    private int likes = 0;

    // 댓글수 (댓글순 정렬용)
    private int commentCount = 0;

    @OneToMany(
            mappedBy = "post",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Comment> comments = new ArrayList<>();
}
