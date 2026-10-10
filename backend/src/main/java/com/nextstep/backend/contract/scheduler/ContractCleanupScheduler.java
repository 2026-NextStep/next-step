package com.nextstep.backend.contract.scheduler;

import com.nextstep.backend.contract.entity.ContractDocument;
import com.nextstep.backend.contract.repository.ContractDocumentRepository;
import com.nextstep.backend.contract.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ContractCleanupScheduler {

    private final ContractDocumentRepository contractDocumentRepository;
    private final FileStorageService fileStorageService;

    private static final long RETENTION_HOURS = 2;

    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredContracts() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(RETENTION_HOURS);
        List<ContractDocument> expiredContracts = contractDocumentRepository.findByUploadedAtBefore(cutoff);

        for (ContractDocument contract : expiredContracts) {
            fileStorageService.deleteFile(contract.getFilePath());
            contractDocumentRepository.delete(contract);
        }

        log.info("만료된 계약서 정리 완료: {}건 삭제", expiredContracts.size());
    }
}
