package com.hostelsync.backend.dto;

import java.util.List;

public record MessStatsDto(
        double averageFoodRating,
        double averageHygieneRating,
        long totalFeedbacksCount,
        List<MessMenuDto> weeklyMenu
) {
}
