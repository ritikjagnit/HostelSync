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
 * REST controller for Hostel In-Charge (Warden) to review registrations, select eligible students,
 * and finalize hostel admissions.
 */
@RestController
@RequestMapping("/api/warden/admissions")
@PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
public class WardenAdmissionController {

    private final HostelApplicationService applicationService;

    public WardenAdmissionController(HostelApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * Lists registered applications for warden review.
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
     * Hostel In-Charge updates applicant status (SELECT / REJECT).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<HostelApplicationResponseDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody HostelApplicationStatusUpdateDto dto,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.updateStatus(id, dto, authentication.getName()));
    }

    /**
     * Officially admits selected student into a hostel room.
     */
    @PostMapping("/{id}/admit")
    public ResponseEntity<HostelApplicationResponseDto> admitStudent(
            @PathVariable Long id,
            @Valid @RequestBody HostelApplicationAdmitDto dto,
            Authentication authentication) {
        return ResponseEntity.ok(applicationService.admitStudent(id, dto, authentication.getName()));
    }

    /**
     * Application statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<AdmissionStatsDto> getAdmissionStats() {
        return ResponseEntity.ok(applicationService.getAdmissionStats());
    }
}
