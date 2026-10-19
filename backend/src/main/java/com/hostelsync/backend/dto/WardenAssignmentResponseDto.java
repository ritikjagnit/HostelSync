package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.HostelType;

import java.time.Instant;

/**
 * Response DTO describing a Warden-to-Hostel assignment.
 */
public record WardenAssignmentResponseDto(
        Long assignmentId,
        Long wardenId,
        String wardenName,
        String wardenEmail,
        Long hostelId,
        String hostelName,
        HostelType hostelType,
        Instant assignedAt
) {
}
