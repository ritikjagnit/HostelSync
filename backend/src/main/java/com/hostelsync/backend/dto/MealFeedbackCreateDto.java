package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.MealType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MealFeedbackCreateDto(
        @NotNull(message = "Meal type is required")
        MealType mealType,

        @Min(1)
        @Max(5)
        int rating,

        @Min(1)
        @Max(5)
        int hygieneRating,

        @Size(max = 500)
        String comments
) {
}
