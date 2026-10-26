package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.FeePaymentStatus;
import com.hostelsync.backend.service.FeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class FeeController {

    private final FeeService feeService;

    public FeeController(FeeService feeService) {
        this.feeService = feeService;
    }

    // Student Endpoints
    @GetMapping("/api/student/fees")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<FeeResponseDto>> getStudentFees(Authentication authentication) {
        return ResponseEntity.ok(feeService.getStudentFees(authentication.getName()));
    }

    @GetMapping("/api/student/fees/no-dues-status")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<NoDuesResponseDto> getMyNoDuesStatus(Authentication authentication) {
        return ResponseEntity.ok(feeService.getNoDuesStatus(authentication.getName()));
    }

    // Admin Endpoints
    @GetMapping("/api/admin/fees")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeeResponseDto>> getAdminFees(
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) FeePaymentStatus status
    ) {
        return ResponseEntity.ok(feeService.getAllFees(hostelId, status));
    }

    @PostMapping("/api/admin/fees")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeeResponseDto> createFeeRecord(@Valid @RequestBody FeeRecordCreateDto dto) {
        FeeResponseDto res = feeService.createFeeRecord(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PatchMapping("/api/admin/fees/{id}/pay")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeeResponseDto> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody FeePaymentDto paymentDto
    ) {
        return ResponseEntity.ok(feeService.recordPayment(id, paymentDto));
    }

    @GetMapping("/api/admin/fees/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<FeeStatsDto> getFeeStats(@RequestParam(required = false) Long hostelId) {
        return ResponseEntity.ok(feeService.getFeeStats(hostelId));
    }

    @GetMapping("/api/admin/fees/no-dues/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoDuesResponseDto> getStudentNoDues(
            Authentication authentication,
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(feeService.getNoDuesForStudent(studentId, authentication.getName()));
    }
}
