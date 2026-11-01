package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.SosStatus;
import com.hostelsync.backend.entity.SosType;

import java.time.Instant;

public record SosResponseDto(
        Long id,
        Long studentId,
        String studentName,
        String enrollmentNumber,
        String studentPhone,
        Long hostelId,
        String hostelName,
        String roomNumber,
        SosType alertType,
        SosStatus status,
        String description,
        Instant triggeredAt,
        Instant acknowledgedAt,
        Instant resolvedAt,
        String resolvedByName,
        String resolutionNotes
) {
}

