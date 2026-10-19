package com.hostelsync.backend.dto;

import java.time.Instant;

/**
 * Detailed profile response for the authenticated student. Excludes sensitive security hashes.
 */
public record StudentProfileResponseDto(
        Long id,
        String enrollmentNumber,
        String fullName,
        String email,
        String course,
        Integer semester,
        String phone,
        boolean active,
        Long userId,
        Instant createdAt
) {}
