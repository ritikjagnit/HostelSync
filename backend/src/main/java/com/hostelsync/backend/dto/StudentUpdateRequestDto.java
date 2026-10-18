package com.hostelsync.backend.dto;

import jakarta.validation.constraints.*;

/**
 * Request payload for updating student profile and user details.
 */
public record StudentUpdateRequestDto(
        @NotBlank(message = "Enrollment number is required")
        @Size(max = 50, message = "Enrollment number cannot exceed 50 characters")
        String enrollmentNumber,

        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name cannot exceed 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid institutional format")
        @Size(max = 150, message = "Email cannot exceed 150 characters")
        String email,

        @NotBlank(message = "Course is required")
        @Size(max = 100, message = "Course name cannot exceed 100 characters")
        String course,

        @NotNull(message = "Semester is required")
        @Min(value = 1, message = "Semester must be at least 1")
        @Max(value = 10, message = "Semester cannot exceed 10")
        Integer semester,

        @NotBlank(message = "Phone number is required")
        @Size(min = 10, max = 20, message = "Phone number must be between 10 and 20 digits")
        String phone,

        Boolean active
) {}
