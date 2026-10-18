package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.HealthResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service providing application health and metadata verification.
 */
@Service
public class HealthService {

    @Value("${info.app.name:HostelSync}")
    private String applicationName;

    @Value("${info.app.subtitle:Smart Digital Hostel Management System}")
    private String applicationSubtitle;

    @Value("${info.app.institution:Government Polytechnic Sakoli}")
    private String institutionName;

    @Value("${info.app.version:1.0.0}")
    private String applicationVersion;

    /**
     * Retrieves the current system health status and institutional metadata.
     *
     * @return HealthResponseDto containing system status and details
     */
    public HealthResponseDto getSystemHealth() {
        return new HealthResponseDto(
                "UP",
                applicationName,
                applicationSubtitle,
                institutionName,
                applicationVersion,
                Instant.now()
        );
    }
}
