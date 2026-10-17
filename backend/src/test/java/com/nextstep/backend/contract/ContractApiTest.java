package com.nextstep.backend.contract;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextstep.backend.common.exception.GlobalExceptionHandler;
import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.contract.controller.ContractController;
import com.nextstep.backend.contract.dto.ContractAnalysisResponse;
import com.nextstep.backend.contract.entity.ContractDocument;
import com.nextstep.backend.contract.repository.ContractDocumentRepository;
import com.nextstep.backend.contract.service.ContractAnalysisProvider;
import com.nextstep.backend.contract.service.ContractService;
import com.nextstep.backend.contract.service.FileStorageService;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ContractApiTest {

    private ContractDocumentRepository contracts;
    private FileStorageService fileStorageService;
    private MemberRepository members;
    private MockMvc mvc;
    private Member owner;

    @BeforeEach
    void setUp() {
        contracts = mock(ContractDocumentRepository.class);
        members = mock(MemberRepository.class);
        fileStorageService = mock(FileStorageService.class);
        ContractAnalysisProvider analysisProvider = mock(ContractAnalysisProvider.class);
        // 실제 SecurityUtil을 사용해 SecurityContext의 username -> memberId 변환도 검증한다.
        SecurityUtil security = new SecurityUtil(members);

        owner = Member.builder().memberId(1L).username("user-a").nickname("nick-a").build();
        when(members.findByUsername("user-a")).thenReturn(Optional.of(owner));
        when(members.findById(1L)).thenReturn(Optional.of(owner));
        authenticateAs("user-a");

        ContractService service = new ContractService(contracts, members, fileStorageService, analysisProvider, new ObjectMapper());
        mvc = MockMvcBuilders.standaloneSetup(new ContractController(service, security))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @AfterEach
    void cleanup() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String username) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(username, null, List.of()));
    }

    private ContractDocument contractOf(Member member, Long contractId) throws Exception {
        ContractDocument contract = ContractDocument.builder()
                .member(member).filePath("uploads/contracts/x.pdf").fileName("x.pdf").build();
        ReflectionTestUtils.setField(contract, "contractId", contractId);
        contract.saveAnalysisResult(new ObjectMapper().writeValueAsString(
                ContractAnalysisResponse.builder().id(contractId).fileName("x.pdf").overallRiskLevel("LOW").build()));
        return contract;
    }

    @Test
    void ownerCanViewOwnContractAnalysis() throws Exception {
        when(contracts.findById(10L)).thenReturn(Optional.of(contractOf(owner, 10L)));

        mvc.perform(get("/api/v1/contracts/10/analysis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallRiskLevel").value("LOW"));
    }

    @Test
    void viewingAnotherMembersContractIs403() throws Exception {
        Member otherOwner = Member.builder().memberId(2L).username("user-b").nickname("nick-b").build();
        when(contracts.findById(20L)).thenReturn(Optional.of(contractOf(otherOwner, 20L)));

        mvc.perform(get("/api/v1/contracts/20/analysis"))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerCanDeleteOwnContract() throws Exception {
        ContractDocument contract = contractOf(owner, 10L);
        when(contracts.findById(10L)).thenReturn(Optional.of(contract));

        mvc.perform(delete("/api/v1/contracts/10")).andExpect(status().isNoContent());

        verify(fileStorageService).deleteFile(contract.getFilePath());
        verify(contracts).delete(contract);
    }

    @Test
    void deletingAnotherMembersContractIs403() throws Exception {
        Member otherOwner = Member.builder().memberId(2L).username("user-b").nickname("nick-b").build();
        ContractDocument contract = contractOf(otherOwner, 20L);
        when(contracts.findById(20L)).thenReturn(Optional.of(contract));

        mvc.perform(delete("/api/v1/contracts/20")).andExpect(status().isForbidden());

        verify(fileStorageService, never()).deleteFile(any());
        verify(contracts, never()).delete(any());
    }

    @Test
    void unauthenticatedViewAndDeleteAre403() throws Exception {
        SecurityContextHolder.clearContext();

        mvc.perform(get("/api/v1/contracts/10/analysis")).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/contracts/10")).andExpect(status().isForbidden());

        verifyNoInteractions(contracts);
    }

    @Test
    void uploadSucceedsForAuthenticatedMember() throws Exception {
        when(fileStorageService.storeFile(any())).thenReturn("uploads/contracts/20260101/abc_resume.pdf");
        when(contracts.save(any())).thenAnswer(invocation -> {
            ContractDocument saved = invocation.getArgument(0);
            ReflectionTestUtils.setField(saved, "contractId", 30L);
            return saved;
        });

        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", "dummy".getBytes());

        mvc.perform(multipart("/api/v1/contracts/analyze").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contractId").value(30))
                .andExpect(jsonPath("$.fileName").value("resume.pdf"));
    }
}
