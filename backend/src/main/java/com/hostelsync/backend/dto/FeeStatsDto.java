package com.hostelsync.backend.dto;

public record FeeStatsDto(
        Double totalAssessed,
        Double totalCollected,
        Double totalPending,
        long paidCount,
        long pendingCount,
        long overdueCount
) {
}
