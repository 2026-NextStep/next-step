package com.nextstep.backend.community.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String writer;

    // 작성 당시의 멘토/멘티 값. 화면에는 쓰지 않고(조회할 때 현재 역할을 다시 찾아서 보여줌) 기록용으로만 남겨 둔다.
    private String writerRole;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "post_id")
    private Post post;

    // 대댓글이면 부모 댓글의 id, 일반 댓글이면 null.
    // 외래키(FK) 없이 숫자 컬럼으로만 둔다. 게시글을 지울 때 댓글들이 한꺼번에 삭제되는데,
    // 부모-자식 FK가 있으면 삭제 순서에 따라 오류가 날 수 있기 때문이다. (Bookmark.postId 와 같은 방식)
    @Column(name = "parent_id")
    private Long parentId;

    // 답글이 달린 댓글을 지웠을 때 true. 목록에서는 "삭제된 댓글입니다"로 보이고 답글은 그대로 남는다.
    @Column(nullable = false)
    private boolean deleted = false;
}