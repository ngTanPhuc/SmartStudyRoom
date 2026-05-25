package com.aiot.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AutoRuleScheduler {
    private final AutoRuleService autoRuleService;

    @Scheduled(fixedDelay = 5000)
    public void run() {
        autoRuleService.handleSensor();
    }
}
