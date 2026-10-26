package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.FeeType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record FeeRecordCreateDto(
        @NotNull(message = "Student ID is required")
        Long studentId,

        @Size(max = 20)
        String academicYear,

        Integer semester,

        @NotNull(message = "Fee type is required")
        FeeType feeType,

        @NotNull(message = "Amount is required")
        @Positive(message = "Amount must be positive")
        Double amount,

        @NotNull(message = "Due date is required")
        LocalDate dueDate,

        @Size(max = 255)
        String remarks
) {
}
