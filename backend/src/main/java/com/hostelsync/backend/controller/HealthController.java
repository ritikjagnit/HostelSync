package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.HealthResponseDto;
import com.hostelsync.backend.service.HealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing health check endpoints for HostelSync backend.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    /**
     * Endpoint to verify backend status and connectivity.
     * Accessible without requiring an active database connection.
     *
     * @return 200 OK with HealthResponseDto JSON payload
     */
    @GetMapping("/health")
    public ResponseEntity<HealthResponseDto> getHealth() {
        return ResponseEntity.ok(healthService.getSystemHealth());
    }
}
