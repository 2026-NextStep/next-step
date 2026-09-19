package com.nextstep.backend.job.controller;

import com.nextstep.backend.job.service.DeadlineAlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class DeadlineAlertController {

    private final DeadlineAlertService deadlineAlertService;

    @PostMapping("/deadline-check")
    public Map<String, Object> triggerDeadlineCheck() {
        int notified = deadlineAlertService.checkAndSendDeadlineAlerts();
        return Map.of("notifiedMembers", notified);
    }
}
