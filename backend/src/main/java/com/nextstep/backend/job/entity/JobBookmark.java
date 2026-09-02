package com.nextstep.backend.job.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_bookmark",
       uniqueConstraints = @UniqueConstraint(columnNames = {"member_id", "posting_id"}))
public class JobBookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bookmark_id")
    private Long bookmarkId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "posting_id", nullable = false)
    private Long postingId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }

    public JobBookmark() {}

    public JobBookmark(Long memberId, Long postingId) {
        this.memberId  = memberId;
        this.postingId = postingId;
    }

    public Long getBookmarkId() { return bookmarkId; }
    public Long getMemberId()   { return memberId; }
    public Long getPostingId()  { return postingId; }
}
