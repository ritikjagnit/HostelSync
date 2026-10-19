package com.hostelsync.backend.dto;

import java.util.List;

/**
 * Aggregated dashboard DTO for an authenticated warden's assigned hostels.
 */
public record WardenDashboardDto(
        Long wardenId,
        String wardenName,
        String wardenEmail,
        int totalAssignedHostels,
        int totalRooms,
        int totalCapacity,
        int totalOccupiedBeds,
        int totalAvailableBeds,
        double occupancyRate,
        List<WardenHostelSummaryDto> hostels,
        List<WardenAllocationSummaryDto> recentAllocations
) {
}
