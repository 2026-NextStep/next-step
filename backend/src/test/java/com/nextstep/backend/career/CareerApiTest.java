package com.nextstep.backend.career;

import com.nextstep.backend.career.controller.CareerController;
import com.nextstep.backend.career.entity.*;
import com.nextstep.backend.career.repository.*;
import com.nextstep.backend.career.service.CareerService;
import com.nextstep.backend.common.exception.GlobalExceptionHandler;
import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CareerApiTest {
    private MemberSkillRepository skills;
    private ProjectExperienceRepository projects;
    private SecurityUtil security;
    private MockMvc mvc;
    private Member member;

    @BeforeEach
    void setUp() {
        skills = mock(MemberSkillRepository.class);
        projects = mock(ProjectExperienceRepository.class);
        MemberRepository members = mock(MemberRepository.class);
        // 실제 SecurityUtil을 사용해 SecurityContext의 username -> memberId 변환도 검증한다.
        security = new SecurityUtil(members);
        member = Member.builder().memberId(1L).username("user-a").build();
        when(members.findByUsername("user-a")).thenReturn(Optional.of(member));
        when(members.findById(1L)).thenReturn(Optional.of(member));
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("user-a", null, List.of()));
        CareerService service = new CareerService(skills, projects, members);
        mvc = MockMvcBuilders.standaloneSetup(new CareerController(service, security))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @org.junit.jupiter.api.AfterEach
    void cleanup() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    void skillCrudUsesAuthenticatedOwnerAndEnum() throws Exception {
        MemberSkill skill = MemberSkill.builder().member(member).name("React").proficiency(Proficiency.BASIC).build();
        ReflectionTestUtils.setField(skill, "id", 10L);
        when(skills.saveAndFlush(any())).thenAnswer(invocation -> {
            MemberSkill saved = invocation.getArgument(0);
            org.junit.jupiter.api.Assertions.assertEquals(1L, saved.getMember().getMemberId());
            org.junit.jupiter.api.Assertions.assertEquals("React", saved.getName());
            return skill;
        });
        mvc.perform(post("/api/v1/users/me/skills").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\" React \",\"proficiency\":\"BASIC\",\"memberId\":2}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.proficiency").value("BASIC"));
        when(skills.findByMember_MemberIdOrderByCreatedAtAscIdAsc(1L)).thenReturn(List.of(skill));
        mvc.perform(get("/api/v1/users/me/skills")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("React"));
        when(skills.findByIdAndMember_MemberId(10L, 1L)).thenReturn(Optional.of(skill));
        mvc.perform(patch("/api/v1/users/me/skills/10").contentType(MediaType.APPLICATION_JSON)
                .content("{\"proficiency\":\"ADVANCED\"}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("React")).andExpect(jsonPath("$.proficiency").value("ADVANCED"));
        mvc.perform(delete("/api/v1/users/me/skills/10")).andExpect(status().isNoContent());
        verify(skills).delete(skill);
    }

    @Test
    void projectCrudAndOptionalFieldClearing() throws Exception {
        ProjectExperience project = ProjectExperience.builder().member(member).name("Next Step")
                .role("developer").technologies("Java").description("project").build();
        ReflectionTestUtils.setField(project, "id", 20L);
        when(projects.saveAndFlush(any())).thenAnswer(invocation -> {
            ProjectExperience saved = invocation.getArgument(0);
            org.junit.jupiter.api.Assertions.assertEquals(1L, saved.getMember().getMemberId());
            return project;
        });
        mvc.perform(post("/api/v1/users/me/projects").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Next Step\"}")).andExpect(status().isOk());
        when(projects.findByMember_MemberIdOrderByCreatedAtAscIdAsc(1L)).thenReturn(List.of(project));
        mvc.perform(get("/api/v1/users/me/projects")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Next Step"));
        when(projects.findByIdAndMember_MemberId(20L, 1L)).thenReturn(Optional.of(project));
        mvc.perform(patch("/api/v1/users/me/projects/20").contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"\"}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("")).andExpect(jsonPath("$.name").value("Next Step"));
        mvc.perform(delete("/api/v1/users/me/projects/20")).andExpect(status().isNoContent());
        verify(projects).delete(project);
    }

    @ParameterizedTest
    @ValueSource(strings = {"skills", "projects"})
    void foreignAndMissingIdsHaveIdentical404(String resource) throws Exception {
        // B의 항목은 단순 ID 조회로는 존재해도 A의 소유권 조건에서는 조회되지 않는다.
        if (resource.equals("skills")) {
            when(skills.findById(99L)).thenReturn(Optional.of(MemberSkill.builder()
                    .member(Member.builder().memberId(2L).build()).name("B skill").proficiency(Proficiency.BASIC).build()));
        } else {
            when(projects.findById(99L)).thenReturn(Optional.of(ProjectExperience.builder()
                    .member(Member.builder().memberId(2L).build()).name("B project").build()));
        }
        for (long id : new long[]{99, 100}) {
            mvc.perform(patch("/api/v1/users/me/" + resource + "/" + id)
                    .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"changed\"}"))
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("항목을 찾을 수 없습니다."));
            mvc.perform(delete("/api/v1/users/me/" + resource + "/" + id))
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("항목을 찾을 수 없습니다."));
        }
        mvc.perform(get("/api/v1/users/me/" + resource)).andExpect(status().isOk()).andExpect(content().json("[]"));
        verify(skills, never()).findById(anyLong());
        verify(projects, never()).findById(anyLong());
        verify(skills, never()).delete(any());
        verify(projects, never()).delete(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"name\":\" \",\"proficiency\":\"BASIC\"}", "{\"name\":\"Java\"}",
            "{\"name\":\"Java\",\"proficiency\":\"고급\"}", "{\"name\":\"Java\",\"proficiency\":null}", "{"})
    void invalidSkillRequestsAre400(String body) throws Exception {
        mvc.perform(post("/api/v1/users/me/skills").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").exists());
        verify(skills, never()).saveAndFlush(any());
    }

    @Test
    void lengthsAndBlankPatchNamesAreRejected() throws Exception {
        for (String resource : List.of("skills", "projects")) {
            mvc.perform(post("/api/v1/users/me/" + resource).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"" + "x".repeat(101) + "\",\"proficiency\":\"BASIC\"}"))
                    .andExpect(status().isBadRequest());
            mvc.perform(patch("/api/v1/users/me/" + resource + "/1").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"  \"}")).andExpect(status().isBadRequest());
        }
        for (String field : List.of("role", "technologies", "description")) {
            int limit = field.equals("role") ? 100 : field.equals("technologies") ? 500 : 5000;
            String body = "{\"name\":\"project\",\"" + field + "\":\"" + "x".repeat(limit + 1) + "\"}";
            mvc.perform(post("/api/v1/users/me/projects").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
            mvc.perform(patch("/api/v1/users/me/projects/1").contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/v1/users/me/projects").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateSkillCreateAndRenameAre409() throws Exception {
        when(skills.existsByMember_MemberIdAndNameIgnoreCase(1L, "react")).thenReturn(true);
        mvc.perform(post("/api/v1/users/me/skills").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\" react \",\"proficiency\":\"BASIC\"}")).andExpect(status().isConflict());
        when(skills.findByIdAndMember_MemberId(10L, 1L)).thenReturn(Optional.of(MemberSkill.builder()
                .member(member).name("Java").proficiency(Proficiency.BASIC).build()));
        when(skills.existsByMember_MemberIdAndNameIgnoreCaseAndIdNot(1L, "react", 10L)).thenReturn(true);
        mvc.perform(patch("/api/v1/users/me/skills/10").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"react\"}")).andExpect(status().isConflict());
    }

    @Test
    void databaseConflictIs409() throws Exception {
        when(skills.saveAndFlush(any())).thenThrow(new org.springframework.dao.DataIntegrityViolationException("duplicate"));
        mvc.perform(post("/api/v1/users/me/skills").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"React\",\"proficiency\":\"BASIC\"}")).andExpect(status().isConflict());
    }

    @ParameterizedTest
    @ValueSource(strings = {"skills", "projects"})
    void unauthenticatedRequestsAre403(String resource) throws Exception {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        mvc.perform(get("/api/v1/users/me/" + resource)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/users/me/" + resource + "/1")).andExpect(status().isForbidden());
        verifyNoInteractions(skills, projects);
    }
}
