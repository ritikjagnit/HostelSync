package com.hostelsync.backend.dto;

import jakarta.validation.constraints.*;

/**
 * DTO for prospective students submitting hostel registration/admission requests.
 */
public record HostelApplicationApplyDto(
        @NotBlank(message = "Full name is required")
        @Size(max = 150, message = "Full name cannot exceed 150 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Phone number is required")
        @Size(max = 20, message = "Phone number cannot exceed 20 characters")
        String phone,

        @NotBlank(message = "Enrollment or candidate number is required")
        @Size(max = 50, message = "Enrollment number cannot exceed 50 characters")
        String enrollmentNumber,

        @NotBlank(message = "Course is required")
        @Size(max = 100, message = "Course cannot exceed 100 characters")
        String course,

        @NotNull(message = "Semester is required")
        @Min(value = 1, message = "Semester must be at least 1")
        @Max(value = 10, message = "Semester cannot exceed 10")
        Integer semester,

        @NotBlank(message = "Gender is required")
        @Pattern(regexp = "(?i)^(MALE|FEMALE)$", message = "Gender must be either MALE or FEMALE")
        String gender,

        @NotBlank(message = "Category is required")
        String category,

        @NotNull(message = "Merit percentage is required")
        @DecimalMin(value = "0.0", message = "Percentage cannot be negative")
        @DecimalMax(value = "100.0", message = "Percentage cannot exceed 100")
        Double meritPercentage,

        @NotBlank(message = "Parent / Guardian name is required")
        @Size(max = 150, message = "Parent name cannot exceed 150 characters")
        String parentName,

        @NotBlank(message = "Parent / Guardian phone is required")
        @Size(max = 20, message = "Parent phone cannot exceed 20 characters")
        String parentPhone,

        @NotBlank(message = "Permanent home address is required")
        @Size(max = 255, message = "Address cannot exceed 255 characters")
        String homeAddress,

        @NotNull(message = "Distance from college is required")
        @DecimalMin(value = "0.0", message = "Distance cannot be negative")
        Double distanceFromCollege,

        @Size(max = 500, message = "Remarks cannot exceed 500 characters")
        String remarks
) {}
