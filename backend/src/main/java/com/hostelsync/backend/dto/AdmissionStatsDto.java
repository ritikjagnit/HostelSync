package com.hostelsync.backend.dto;

/**
 * Metric statistics DTO for the Hostel Admissions pipeline.
 */
public record AdmissionStatsDto(
        long totalApplications,
        long pendingCount,
        long selectedCount,
        long admittedCount,
        long rejectedCount
) {}
