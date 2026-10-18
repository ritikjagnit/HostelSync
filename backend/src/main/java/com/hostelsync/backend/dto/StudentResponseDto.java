package com.hostelsync.backend.dto;

import java.time.Instant;

/**
 * Summary DTO for student directory listings. Excludes passwordHash.
 */
public record StudentResponseDto(
        Long id,
        String enrollmentNumber,
        String fullName,
        String email,
        String course,
        Integer semester,
        String phone,
        boolean active,
        Long userId,
        Instant createdAt,
        String currentRoomNumber,
        String currentHostelName,
        Long currentAllocationId
) {}
