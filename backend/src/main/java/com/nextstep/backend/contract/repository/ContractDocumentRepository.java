package com.nextstep.backend.contract.repository;

import com.nextstep.backend.contract.entity.ContractDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContractDocumentRepository extends JpaRepository<ContractDocument, Long> {

    List<ContractDocument> findByMember_MemberIdOrderByUploadedAtDesc(Long memberId);
}
