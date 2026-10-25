package com.nextstep.backend.community.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 글 조회 기록. (글, 조회한 사람) 한 쌍당 한 줄만 두고 "마지막으로 조회수를 올린 날짜"만 갱신한다.
 * 하루에 한 번만 조회수를 올리기 위한 장부이고, 날마다 줄이 쌓이지는 않는다.
 *
 * viewer_key
 *   - 로그인한 사용자: "M:회원번호"
 *   - 로그인하지 않은 사용자: "A:접속 IP"
 */
@Entity
@Table(
        name = "post_view",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_post_view_post_viewer",
                columnNames = {"post_id", "viewer_key"}
        )
)
@Getter
@Setter
public class PostView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "viewer_key", nullable = false, length = 64)
    private String viewerKey;

    @Column(name = "last_view_date", nullable = false)
    private LocalDate lastViewDate;
}