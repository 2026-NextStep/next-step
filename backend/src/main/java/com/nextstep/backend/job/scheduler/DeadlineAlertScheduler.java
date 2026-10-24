package com.nextstep.backend.job.scheduler;

import com.nextstep.backend.job.service.DeadlineAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DeadlineAlertScheduler {

    private final DeadlineAlertService deadlineAlertService;

    @Scheduled(cron = "0 10 0 * * *", zone = "Asia/Seoul")
    public void runDailyDeadlineCheck() {
        int notified = deadlineAlertService.checkAndSendDeadlineAlerts();
        log.info("마감임박 알림 스케줄러 실행 완료 - {}명에게 발송", notified);
    }
}
