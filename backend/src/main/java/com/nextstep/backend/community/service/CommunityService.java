package com.nextstep.backend.community.service;

import com.nextstep.backend.community.dto.*;
import com.nextstep.backend.community.entity.Comment;
import com.nextstep.backend.community.entity.Post;
import com.nextstep.backend.community.repository.CommentRepository;
import com.nextstep.backend.community.repository.PostRepository;
import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final PostRepository    postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository  memberRepository;

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

        List<PostResponseDto> posts = postPage.getContent()
                .stream()
                .map(PostResponseDto::new)
                .toList();

        return new PostListResponseDto(
                posts,
                postPage.getTotalElements(),
                postPage.getTotalPages(),
                page
        );
    }

    // 게시글 상세 조회 (조회수 증가 + 댓글 포함)
    @Transactional
    public PostDetailResponseDto getPost(Long id) {
        Post post = postRepository.findById(id).orElseThrow();
        post.setViews(post.getViews() + 1);
        postRepository.save(post);

        PostDetailResponseDto dto = new PostDetailResponseDto(post);

        // 게시글 작성자 profileImage
        memberRepository.findByNickname(post.getWriter())
                .ifPresent(m -> dto.setWriterProfileImage(m.getProfileImage()));

        // 댓글 작성자 profileImage 일괄 조회 (배치)
        if (!dto.getComments().isEmpty()) {
            List<String> writers = dto.getComments().stream()
                    .map(CommentResponseDto::getWriter).distinct().toList();
            Map<String, String> profileMap = memberRepository.findAllByNicknameIn(writers)
                    .stream()
                    .filter(m -> m.getProfileImage() != null)
                    .collect(Collectors.toMap(
                            m -> m.getNickname(),
                            m -> m.getProfileImage()
                    ));
            dto.getComments().forEach(c -> c.setWriterProfileImage(profileMap.get(c.getWriter())));
        }

        return dto;
    }

    // 추천 (likes + 1)
    @Transactional
    public int likePost(Long id) {
        Post post = postRepository.findById(id).orElseThrow();
        post.setLikes(post.getLikes() + 1);
        postRepository.save(post);
        return post.getLikes();
    }

    // 댓글 작성
    @Transactional
    public CommentResponseDto addComment(Long postId, CommentRequest request) {
        Post post = postRepository.findById(postId).orElseThrow();

        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setWriter(request.getWriter());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setPost(post);

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
    @Transactional
    public void deleteComment(Long postId, Long commentId) {
        Post post = postRepository.findById(postId).orElseThrow();
        Comment comment = commentRepository.findById(commentId).orElseThrow();
        post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
        postRepository.save(post);
        commentRepository.delete(comment);
    }
}
