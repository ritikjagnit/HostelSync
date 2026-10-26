package com.hostelsync.backend.dto;

import java.time.DayOfWeek;
import java.time.Instant;

public record MessMenuDto(
        Long id,
        Long hostelId,
        String hostelName,
        DayOfWeek dayOfWeek,
        String breakfast,
        String lunch,
        String snacks,
        String dinner,
        String specialNote,
        Instant updatedAt
) {
}
