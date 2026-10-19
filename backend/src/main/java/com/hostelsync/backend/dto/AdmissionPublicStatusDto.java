package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.ApplicationStatus;

import java.time.LocalDateTime;

/**
 * Public DTO for students checking their application status with application number or enrollment number.
 */
public record AdmissionPublicStatusDto(
        String applicationNumber,
        String fullName,
        String enrollmentNumber,
        String course,
        Integer semester,
        String gender,
        String category,
        Double meritPercentage,
        ApplicationStatus status,
        String rejectionReason,
        String allocatedHostelName,
        String allocatedRoomNumber,
        LocalDateTime appliedAt,
        LocalDateTime reviewedAt
) {}
