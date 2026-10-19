package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.AllocationStatus;
import java.time.LocalDate;

/**
 * Standardized response DTO representing a room allocation record with student and hostel metadata.
 */
public record AllocationResponseDto(
        Long id,
        Long studentId,
        String studentName,
        String enrollmentNumber,
        String studentEmail,
        String studentCourse,
        Integer studentSemester,
        String studentPhone,
        Long roomId,
        String roomNumber,
        Integer floor,
        Integer roomCapacity,
        Long hostelId,
        String hostelName,
        String hostelType,
        LocalDate allocationDate,
        LocalDate vacatingDate,
        AllocationStatus status
) {}
