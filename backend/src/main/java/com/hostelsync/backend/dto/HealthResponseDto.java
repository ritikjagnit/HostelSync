package com.hostelsync.backend.dto;

import java.time.Instant;

/**
 * Data Transfer Object representing the system health check status.
 */
public record HealthResponseDto(
        String status,
        String application,
        String subtitle,
        String institution,
        String version,
        Instant timestamp
) {}
