package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.AttendanceRecordDto;
import com.hostelsync.backend.dto.AttendanceSummaryDto;
import com.hostelsync.backend.entity.AttendanceStatus;
import com.hostelsync.backend.service.AttendanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for institutional attendance oversight and reporting for ADMIN users.
 */
@RestController
@RequestMapping("/api/admin/attendance")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAttendanceController {

    private final AttendanceService attendanceService;

    public AdminAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * Institutional attendance metrics and per-hostel breakdown for a specific date.
     */
    @GetMapping("/summary")
    public ResponseEntity<AttendanceSummaryDto> getAttendanceSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long hostelId) {
        return ResponseEntity.ok(attendanceService.getAdminAttendanceSummary(date, hostelId));
    }

    /**
     * Complete historical attendance records institution-wide with filters.
     */
    @GetMapping("/history")
    public ResponseEntity<List<AttendanceRecordDto>> getAttendanceHistory(
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(attendanceService.getAdminAttendanceHistory(
                hostelId, studentId, from, to, status, search));
    }
}
