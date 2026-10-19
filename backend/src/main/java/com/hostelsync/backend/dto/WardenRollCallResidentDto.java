package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.Attendance;
import com.hostelsync.backend.entity.AttendanceStatus;
import com.hostelsync.backend.entity.RoomAllocation;

import java.time.Instant;

/**
 * DTO representing an eligible hostel resident during Warden roll call,
 * with any existing attendance marked for the date pre-populated.
 */
public record WardenRollCallResidentDto(
        Long studentId,
        String studentName,
        String enrollmentNumber,
        Long roomId,
        String roomNumber,
        Integer floor,
        String phone,
        String course,
        Integer semester,
        Long attendanceId,
        AttendanceStatus status,
        String remarks,
        String recordedByName,
        Instant markedAt
) {
    public static WardenRollCallResidentDto fromAllocationAndAttendance(
            RoomAllocation allocation, Attendance attendance) {
        return new WardenRollCallResidentDto(
                allocation.getStudent().getId(),
                allocation.getStudent().getUser().getFullName(),
                allocation.getStudent().getEnrollmentNumber(),
                allocation.getRoom().getId(),
                allocation.getRoom().getRoomNumber(),
                allocation.getRoom().getFloor(),
                allocation.getStudent().getPhone(),
                allocation.getStudent().getCourse(),
                allocation.getStudent().getSemester(),
                attendance != null ? attendance.getId() : null,
                attendance != null ? attendance.getStatus() : null,
                attendance != null ? attendance.getRemarks() : null,
                attendance != null ? attendance.getRecordedBy().getFullName() : null,
                attendance != null ? (attendance.getUpdatedAt() != null ? attendance.getUpdatedAt() : attendance.getCreatedAt()) : null
        );
    }
}
