package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.MealType;

import java.time.Instant;
import java.time.LocalDate;

public record MealFeedbackResponseDto(
        Long id,
        Long studentId,
        String studentName,
        String studentEnrollment,
        Long hostelId,
        String hostelName,
        LocalDate feedbackDate,
        MealType mealType,
        int rating,
        int hygieneRating,
        String comments,
        Instant createdAt
) {
}
