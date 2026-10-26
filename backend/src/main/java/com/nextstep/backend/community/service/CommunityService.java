package com.nextstep.backend.community.service;

import com.nextstep.backend.community.dto.*;
import com.nextstep.backend.community.entity.Comment;
import com.nextstep.backend.community.entity.Post;
import com.nextstep.backend.community.repository.CommentRepository;
import com.nextstep.backend.community.repository.PostLikeRepository;
import com.nextstep.backend.community.repository.PostRepository;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final PostRepository    postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository  memberRepository;
    private final PostViewService   postViewService;
    private final PostLikeRepository postLikeRepository;

    // 게시글 작성
    public PostResponseDto createPost(PostRequest request) {
        Post post = new Post();
        post.setCategory(request.getCategory());
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setJob(request.getJob());
        post.setWriter(request.getWriter());
        post.setCreatedAt(LocalDateTime.now());

        // 작성자 role + profileImage 조회
        var memberOpt = memberRepository.findByNickname(request.getWriter());
        memberOpt.ifPresent(m -> post.setWriterRole(m.getRole()));
        PostResponseDto dto = new PostResponseDto(postRepository.save(post));
        memberOpt.ifPresent(m -> dto.setWriterProfileImage(m.getProfileImage()));
        return dto;
    }

    // 게시글 목록 조회
    public PostListResponseDto getPosts(
            String category, String sort,
            String keyword,  String job,
            int page,        int size
    ) {
        Sort sortObj = switch (sort == null ? "최신순" : sort) {
            case "인기순" -> Sort.by("likes").descending();
            case "조회순" -> Sort.by("views").descending();
            case "댓글순" -> Sort.by("commentCount").descending();
            default       -> Sort.by("createdAt").descending();
        };

        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<Post> postPage = postRepository.findWithFilters(
                category, keyword, job, pageable
        );

        // 글에 저장돼 있는 옛날 역할 대신, 작성자의 "현재" 역할(마이페이지에서 바꾼 값)을 보여준다.
        Map<String, Member> members = loadMembers(
                postPage.getContent().stream().map(Post::getWriter).toList()
        );

        List<PostResponseDto> posts = postPage.getContent()
                .stream()
                .map(post -> {
                    PostResponseDto dto = new PostResponseDto(post);
                    Member writer = members.get(post.getWriter());
                    if (writer != null) dto.setWriterRole(writer.getRole());
                    return dto;
                })
                .toList();

        return new PostListResponseDto(
                posts,
                postPage.getTotalElements(),
                postPage.getTotalPages(),
                page
        );
    }

    // 게시글 상세 조회 (조회수 증가 + 댓글 포함)
    // viewerKey: 조회한 사람을 구분하는 값. 같은 사람은 같은 글의 조회수를 하루에 한 번만 올린다.
    // memberId: 로그인한 회원 번호 (비로그인이면 null). 이 회원이 좋아요를 눌렀는지 함께 내려준다.
    @Transactional
    public PostDetailResponseDto getPost(Long id, String viewerKey, Long memberId) {
        if (!postRepository.existsById(id)) {
            throw new NoSuchElementException("게시글을 찾을 수 없습니다.");
        }

        // 조회수 먼저 처리한 뒤 글을 읽어야, 화면에 올라간 숫자가 바로 보인다.
        postViewService.countView(id, viewerKey);

        Post post = postRepository.findById(id).orElseThrow();

        PostDetailResponseDto dto = new PostDetailResponseDto(post);
        dto.setLiked(memberId != null && postLikeRepository.existsByPostIdAndMemberId(id, memberId));

        // 글쓴이 + 댓글 작성자를 한 번에 조회 (배치)
        List<String> nicknames = new ArrayList<>();
        nicknames.add(post.getWriter());
        dto.getComments().forEach(c -> {
            if (!c.isDeleted()) nicknames.add(c.getWriter());
        });
        Map<String, Member> members = loadMembers(nicknames);

        // 글쓴이: 현재 역할 + 프로필 이미지
        Member author = members.get(post.getWriter());
        if (author != null) {
            dto.setWriterRole(author.getRole());
            dto.setWriterProfileImage(author.getProfileImage());
        }

        // 댓글 작성자: 현재 역할 + 프로필 이미지 (삭제된 댓글은 제외)
        dto.getComments().forEach(c -> {
            if (c.isDeleted()) return;
            Member m = members.get(c.getWriter());
            if (m != null) {
                c.setWriterRole(m.getRole());
                c.setWriterProfileImage(m.getProfileImage());
            }
        });

        return dto;
    }

    // 좋아요: 한 사람이 한 글에 한 번만 누를 수 있다.
    // 아직 안 눌렀으면 좋아요(+1), 이미 눌렀으면 취소(-1). 누른 기록은 post_like 에 남긴다.
    // 돌려주는 값: { likes: 현재 좋아요 수, liked: 이 사람이 지금 좋아요를 누른 상태인지 }
    @Transactional
    public Map<String, Object> toggleLike(Long postId, Long memberId) {
        if (!postRepository.existsById(postId)) {
            throw new NoSuchElementException("게시글을 찾을 수 없습니다.");
        }

        boolean liked;
        if (postLikeRepository.deleteByPair(postId, memberId) > 0) {
            postLikeRepository.decrement(postId);        // 이미 눌렀던 사람 → 좋아요 취소
            liked = false;
        } else if (postLikeRepository.insertIgnore(postId, memberId) > 0) {
            postLikeRepository.increment(postId);        // 처음 누른 사람 → 좋아요
            liked = true;
        } else {
            liked = true;                                // 동시에 두 번 눌려 다른 요청이 먼저 기록한 경우: 이미 좋아요 상태
        }

        int likes = postRepository.findById(postId).orElseThrow().getLikes();
        return Map.of("likes", likes, "liked", liked);
    }

    // 댓글 작성 (parentId 가 있으면 대댓글)
    @Transactional
    public CommentResponseDto addComment(Long postId, CommentRequest request) {
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("댓글 내용을 입력해 주세요.");
        }

        Post post = postRepository.findById(postId).orElseThrow();

        Comment comment = new Comment();
        comment.setContent(request.getContent().trim());
        comment.setWriter(request.getWriter());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setPost(post);

        // 대댓글: 같은 게시글의 "일반 댓글"에만 달 수 있다 (한 단계까지만)
        if (request.getParentId() != null) {
            Comment parent = commentRepository.findById(request.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("답글을 달 댓글을 찾을 수 없습니다."));
            if (parent.getPost() == null || !parent.getPost().getId().equals(postId)) {
                throw new IllegalArgumentException("다른 게시글의 댓글에는 답글을 달 수 없습니다.");
            }
            if (parent.isDeleted()) {
                throw new IllegalArgumentException("삭제된 댓글에는 답글을 달 수 없습니다.");
            }
            if (parent.getParentId() != null) {
                throw new IllegalArgumentException("답글에는 다시 답글을 달 수 없습니다.");
            }
            comment.setParentId(parent.getId());
        }

        // 댓글 작성자 role + profileImage 조회
        var commentMemberOpt = memberRepository.findByNickname(request.getWriter());
        commentMemberOpt.ifPresent(m -> comment.setWriterRole(m.getRole()));

        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        CommentResponseDto commentDto = new CommentResponseDto(commentRepository.save(comment));
        commentMemberOpt.ifPresent(m -> commentDto.setWriterProfileImage(m.getProfileImage()));
        return commentDto;
    }

    // 게시글 삭제
    @Transactional
    public void deletePost(Long id) {
        Post post = postRepository.findById(id).orElseThrow();
        postRepository.delete(post);
    }

    // 댓글 삭제
    //  - 답글이 달린 댓글: 내용을 비우고 "삭제된 댓글입니다"로 자리만 남긴다 (답글은 유지)
    //  - 그 외(답글이 없는 댓글, 답글): 완전히 삭제한다
    //  - 마지막 답글을 지웠는데 부모가 이미 "삭제된 댓글"이면 부모도 함께 정리한다
    @Transactional
    public void deleteComment(Long postId, Long commentId) {
        Post post = postRepository.findById(postId).orElseThrow();
        Comment comment = commentRepository.findById(commentId).orElseThrow();

        if (comment.getPost() == null || !comment.getPost().getId().equals(postId)) {
            throw new IllegalArgumentException("해당 게시글의 댓글이 아닙니다.");
        }
        if (comment.isDeleted()) {
            return; // 이미 삭제 처리된 댓글
        }

        boolean hasReplies = comment.getParentId() == null
                && commentRepository.existsByParentId(comment.getId());

        // 댓글 수는 "보이는 댓글" 기준: 삭제 처리되는 댓글은 1 줄인다
        post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
        postRepository.save(post);

        if (hasReplies) {
            comment.setDeleted(true);
            comment.setContent("");
            commentRepository.save(comment);
            return;
        }

        Long parentId = comment.getParentId();
        commentRepository.delete(comment);

        if (parentId != null) {
            commentRepository.flush();
            commentRepository.findById(parentId).ifPresent(parent -> {
                if (parent.isDeleted() && !commentRepository.existsByParentId(parentId)) {
                    commentRepository.delete(parent);
                }
            });
        }
    }

    // ── 내부 헬퍼 ──────────────────────────────────────

    // 닉네임 목록으로 회원을 한 번에 조회해 { 닉네임: 회원 } 으로 돌려준다.
    private Map<String, Member> loadMembers(Collection<String> nicknames) {
        List<String> names = nicknames.stream()
                .filter(Objects::nonNull)
                .filter(n -> !n.isBlank())
                .distinct()
                .toList();
        if (names.isEmpty()) return Map.of();

        Map<String, Member> map = new HashMap<>();
        for (Member m : memberRepository.findAllByNicknameIn(names)) {
            map.put(m.getNickname(), m);
        }
        return map;
    }
}