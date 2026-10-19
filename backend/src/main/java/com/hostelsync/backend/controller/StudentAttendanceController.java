package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.AttendanceRecordDto;
import com.hostelsync.backend.dto.StudentAttendanceSummaryDto;
import com.hostelsync.backend.service.AttendanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller providing personal attendance self-service endpoints exclusively for authenticated STUDENT residents.
 * Derives student identity from the security authentication principal.
 */
@RestController
@RequestMapping("/api/student/attendance")
@PreAuthorize("hasRole('STUDENT')")
public class StudentAttendanceController {

    private final AttendanceService attendanceService;

    public StudentAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * Retrieves personal attendance history records for the authenticated student.
     */
    @GetMapping("/history")
    public ResponseEntity<List<AttendanceRecordDto>> getMyAttendanceHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication authentication) {
        return ResponseEntity.ok(attendanceService.getStudentAttendanceHistory(
                authentication.getName(), from, to));
    }

    /**
     * Retrieves personal attendance summary metrics and percentage for the authenticated student.
     */
    @GetMapping("/summary")
    public ResponseEntity<StudentAttendanceSummaryDto> getMyAttendanceSummary(
            @RequestParam(required = false) String month,
            Authentication authentication) {
        return ResponseEntity.ok(attendanceService.getStudentAttendanceSummary(
                authentication.getName(), month));
    }
}
