package com.hostelsync.backend.dto;

public record GatePassStatsDto(
        long total,
        long pending,
        long approved,
        long outOfCampus,
        long returned,
        long overdue,
        long rejected
) {
}
