package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.ApplicationStatus;

import java.time.LocalDateTime;

/**
 * Detailed DTO representing a student's hostel application and review status.
 */
public record HostelApplicationResponseDto(
        Long id,
        String applicationNumber,
        String fullName,
        String email,
        String phone,
        String enrollmentNumber,
        String course,
        Integer semester,
        String gender,
        String category,
        Double meritPercentage,
        String parentName,
        String parentPhone,
        String homeAddress,
        Double distanceFromCollege,
        ApplicationStatus status,
        String rejectionReason,
        String remarks,
        Long allocatedHostelId,
        String allocatedHostelName,
        Long allocatedRoomId,
        String allocatedRoomNumber,
        Long studentId,
        LocalDateTime appliedAt,
        LocalDateTime reviewedAt,
        String reviewedBy
) {}
