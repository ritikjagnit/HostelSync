package com.hostelsync.backend.dto;

/**
 * Summary metrics of hostel complaints and grievances.
 */
public record ComplaintStatsDto(
        long totalComplaints,
        long pendingCount,
        long inProgressCount,
        long resolvedCount,
        long emergencyCount
) {
}
