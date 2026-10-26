package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.GatePassStatus;
import com.hostelsync.backend.entity.GatePassType;

import java.time.Instant;
import java.time.LocalDateTime;

public record GatePassResponseDto(
        Long id,
        String passNumber,
        Long studentId,
        String studentName,
        String studentEnrollment,
        String studentPhone,
        String studentEmail,
        Long hostelId,
        String hostelName,
        String roomNumber,
        GatePassType passType,
        String purpose,
        String destination,
        LocalDateTime outTime,
        LocalDateTime expectedInTime,
        LocalDateTime actualOutTime,
        LocalDateTime actualInTime,
        String parentContact,
        GatePassStatus status,
        String wardenRemarks,
        String approvedByName,
        Instant createdAt,
        Instant updatedAt
) {
}
