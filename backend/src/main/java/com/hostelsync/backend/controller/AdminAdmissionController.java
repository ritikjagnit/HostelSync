package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.ApplicationStatus;
import com.hostelsync.backend.service.HostelApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Administrative REST controller for managing the complete hostel admissions pipeline:
 * viewing registrations, reviewing credentials/merit, selecting applicants, and admitting to rooms.
 */
@RestController
@RequestMapping("/api/admin/admissions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAdmissionController {

    private final HostelApplicationService applicationService;

    public AdminAdmissionController(HostelApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * Lists registered applications with optional filters for status, gender, course, and search.
     */
    @GetMapping
    public ResponseEntity<List<HostelApplicationResponseDto>> getApplications(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String course,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(applicationService.getApplications(status, gender, course, search));
    }

    /**
     * Retrieves application details by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<HostelApplicationResponseDto> getApplicationById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getApplicationById(id));
    }

    /**
     * Updates applicant review status (e.g. mark as SELECTED or REJECTED).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<HostelApplicationResponseDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody HostelApplicationStatusUpdateDto dto,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.updateStatus(id, dto, authentication.getName()));
    }

    /**
     * Officially admits a student to a hostel room, creating their student account if needed.
     */
    @PostMapping("/{id}/admit")
    public ResponseEntity<HostelApplicationResponseDto> admitStudent(
            @PathVariable Long id,
            @Valid @RequestBody HostelApplicationAdmitDto dto,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.admitStudent(id, dto, authentication.getName()));
    }

    /**
     * Pipeline metrics and statistics for dashboard cards.
     */
    @GetMapping("/stats")
    public ResponseEntity<AdmissionStatsDto> getAdmissionStats() {
        return ResponseEntity.ok(applicationService.getAdmissionStats());
    }
}
