package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.ComplaintCategory;
import com.hostelsync.backend.entity.ComplaintStatus;
import com.hostelsync.backend.entity.ComplaintUrgency;

import java.time.Instant;

/**
 * Standard response DTO for a hostel complaint ticket.
 */
public record ComplaintResponseDto(
        Long id,
        String ticketNumber,
        String title,
        String description,
        ComplaintCategory category,
        ComplaintUrgency urgency,
        ComplaintStatus status,
        Long studentId,
        String studentName,
        String studentEnrollment,
        String studentPhone,
        String studentEmail,
        Long hostelId,
        String hostelName,
        Long roomId,
        String roomNumber,
        String resolutionNotes,
        String resolvedByName,
        Instant resolvedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
