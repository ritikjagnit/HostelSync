package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.AttendanceStatus;
import com.hostelsync.backend.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for authenticated Warden hostel roll-call attendance operations.
 * Strictly verifies hostel-level authorization derived from the security principal.
 */
@RestController
@RequestMapping("/api/warden/attendance")
@PreAuthorize("hasRole('WARDEN')")
public class WardenAttendanceController {

    private final AttendanceService attendanceService;

    public WardenAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * Retrieves roll-call roster of active residents for a specific hostel and date,
     * including existing attendance marks.
     */
    @GetMapping
    public ResponseEntity<List<WardenRollCallResidentDto>> getRollCallRoster(
            @RequestParam Long hostelId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        return ResponseEntity.ok(attendanceService.getWardenRollCall(authentication.getName(), hostelId, date));
    }

    /**
     * Submits bulk roll-call attendance for an assigned hostel and date with transactional upsert.
     */
    @PostMapping("/bulk")
    public ResponseEntity<WardenBulkAttendanceResponseDto> recordBulkAttendance(
            @Valid @RequestBody WardenAttendanceBulkRequestDto request,
            Authentication authentication) {
        return ResponseEntity.ok(attendanceService.recordBulkAttendance(authentication.getName(), request));
    }

    /**
     * Updates an individual attendance record for an assigned hostel resident.
     */
    @PutMapping("/{id}")
    public ResponseEntity<AttendanceRecordDto> updateAttendanceRecord(
            @PathVariable Long id,
            @Valid @RequestBody WardenAttendanceUpdateRequestDto request,
            Authentication authentication) {
        return ResponseEntity.ok(attendanceService.updateAttendanceRecord(authentication.getName(), id, request));
    }

    /**
     * Searches attendance history across assigned hostels with filters.
     */
    @GetMapping("/history")
    public ResponseEntity<List<AttendanceRecordDto>> getAttendanceHistory(
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        return ResponseEntity.ok(attendanceService.getWardenAttendanceHistory(
                authentication.getName(), hostelId, studentId, from, to, status, search));
    }
}
