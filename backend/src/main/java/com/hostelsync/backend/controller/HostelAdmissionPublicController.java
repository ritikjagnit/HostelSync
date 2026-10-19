package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.AdmissionPublicStatusDto;
import com.hostelsync.backend.dto.HostelApplicationApplyDto;
import com.hostelsync.backend.dto.HostelApplicationResponseDto;
import com.hostelsync.backend.service.HostelApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

/**
 * Public REST controller for prospective student hostel admission registration and application status tracking.
 * Permitted without authentication so applicants can submit forms and track results.
 */
@RestController
@RequestMapping("/api/admissions")
public class HostelAdmissionPublicController {

    private final HostelApplicationService applicationService;

    public HostelAdmissionPublicController(HostelApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * Submit an online hostel admission registration.
     */
    @PostMapping("/apply")
    public ResponseEntity<HostelApplicationResponseDto> submitApplication(
            @Valid @RequestBody HostelApplicationApplyDto applyDto) {
        HostelApplicationResponseDto created = applicationService.apply(applyDto);
        return ResponseEntity.created(URI.create("/api/admissions/status/" + created.applicationNumber()))
                .body(created);
    }

    /**
     * Check status of an application by application number or enrollment number.
     */
    @GetMapping("/status/{query}")
    public ResponseEntity<AdmissionPublicStatusDto> getStatus(@PathVariable String query) {
        return ResponseEntity.ok(applicationService.getPublicStatus(query));
    }

    /**
     * Track application by query parameter.
     */
    @GetMapping("/track")
    public ResponseEntity<AdmissionPublicStatusDto> trackApplication(@RequestParam String query) {
        return ResponseEntity.ok(applicationService.getPublicStatus(query));
    }
}
