package com.nextstep.backend.contract.repository;

import com.nextstep.backend.contract.entity.ContractDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ContractDocumentRepository extends JpaRepository<ContractDocument, Long> {

    List<ContractDocument> findByMember_MemberIdOrderByUploadedAtDesc(Long memberId);

    List<ContractDocument> findByUploadedAtBefore(LocalDateTime cutoff);

    Optional<ContractDocument> findFirstByMember_MemberIdAndFileHashAndUploadedAtAfterOrderByUploadedAtDesc(
            Long memberId, String fileHash, LocalDateTime cutoff);
}
