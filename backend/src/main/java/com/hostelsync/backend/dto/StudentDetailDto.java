package com.hostelsync.backend.dto;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Detailed DTO for a specific student's directory & admission profile. Excludes passwordHash.
 */
public record StudentDetailDto(
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
        Long currentRoomId,
        Long currentHostelId,
        Long currentAllocationId,
        LocalDate currentAllocationDate,
        int totalAllocationsCount
) {}
