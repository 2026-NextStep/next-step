package com.nextstep.backend.community.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 좋아요 기록. (글, 회원) 한 쌍당 한 줄만 있을 수 있어서 한 사람이 같은 글에 좋아요를 두 번 누를 수 없다.
 */
@Entity
@Table(
        name = "post_like",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_post_like_post_member",
                columnNames = {"post_id", "member_id"}
        )
)
@Getter
@Setter
public class PostLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;
}