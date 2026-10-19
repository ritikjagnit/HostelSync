package com.hostelsync.backend.dto;

/**
 * Lightweight DTO representing an active student eligible for room allocation.
 */
public record AvailableStudentDto(
        Long id,
        String enrollmentNumber,
        String fullName,
        String email,
        String course,
        Integer semester,
        String phone
) {}
