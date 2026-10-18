package com.hostelsync.backend.dto;

import java.util.List;

/**
 * Aggregated metrics DTO for the Administrator Dashboard.
 */
public record AdminDashboardStatsDto(
        long totalHostels,
        long activeHostels,
        long totalRooms,
        long totalCapacity,
        long activeAllocations,
        long availableBeds,
        List<HostelResponseDto> hostels
) {}
