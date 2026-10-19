package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.Attendance;
import com.hostelsync.backend.entity.AttendanceStatus;
import com.hostelsync.backend.entity.RoomAllocation;

import java.time.Instant;
import java.time.LocalDate;

/**
 * DTO representing an individual hostel attendance record with student, room, and recorder context.
 */
public record AttendanceRecordDto(
        Long id,
        Long studentId,
        String studentName,
        String enrollmentNumber,
        String roomNumber,
        Long hostelId,
        String hostelName,
        LocalDate attendanceDate,
        AttendanceStatus status,
        String remarks,
        Long recordedById,
        String recordedByName,
        Instant createdAt,
        Instant updatedAt
) {
    public static AttendanceRecordDto fromEntity(Attendance attendance, RoomAllocation allocation) {
        String roomNum = allocation != null ? allocation.getRoom().getRoomNumber() : "N/A";
        Long hId = allocation != null ? allocation.getRoom().getHostel().getId() : null;
        String hName = allocation != null ? allocation.getRoom().getHostel().getName() : "N/A";

        return new AttendanceRecordDto(
                attendance.getId(),
                attendance.getStudent().getId(),
                attendance.getStudent().getUser().getFullName(),
                attendance.getStudent().getEnrollmentNumber(),
                roomNum,
                hId,
                hName,
                attendance.getAttendanceDate(),
                attendance.getStatus(),
                attendance.getRemarks(),
                attendance.getRecordedBy().getId(),
                attendance.getRecordedBy().getFullName(),
                attendance.getCreatedAt(),
                attendance.getUpdatedAt()
        );
    }
}
