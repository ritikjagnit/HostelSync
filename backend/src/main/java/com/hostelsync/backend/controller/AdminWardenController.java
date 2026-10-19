package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.WardenAssignmentRequestDto;
import com.hostelsync.backend.dto.WardenAssignmentResponseDto;
import com.hostelsync.backend.dto.WardenSummaryDto;
import com.hostelsync.backend.service.WardenAssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * REST controller for administrator management of Warden users and their assigned hostels.
 * Strictly restricted to users with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/wardens")
@PreAuthorize("hasRole('ADMIN')")
public class AdminWardenController {

    private final WardenAssignmentService wardenAssignmentService;

    public AdminWardenController(WardenAssignmentService wardenAssignmentService) {
        this.wardenAssignmentService = wardenAssignmentService;
    }

    /**
     * Lists all wardens and their currently assigned hostels.
     */
    @GetMapping
    public ResponseEntity<List<WardenSummaryDto>> getAllWardens() {
        return ResponseEntity.ok(wardenAssignmentService.getAllWardensWithAssignments());
    }

    /**
     * Lists assignments for a specific warden.
     */
    @GetMapping("/{id}/assignments")
    public ResponseEntity<List<WardenAssignmentResponseDto>> getAssignmentsForWarden(@PathVariable Long id) {
        return ResponseEntity.ok(wardenAssignmentService.getAssignmentsForWarden(id));
    }

    /**
     * Assigns a hostel to a warden via request body.
     */
    @PostMapping("/assignments")
    public ResponseEntity<WardenAssignmentResponseDto> assignHostel(
            @Valid @RequestBody WardenAssignmentRequestDto requestDto) {
        WardenAssignmentResponseDto created = wardenAssignmentService.assignHostelToWarden(
                requestDto.wardenId(), requestDto.hostelId()
        );
        return ResponseEntity.created(URI.create("/api/admin/wardens/" + created.wardenId() + "/assignments"))
                .body(created);
    }

    /**
     * Assigns a hostel to a warden via path variables.
     */
    @PostMapping("/{wardenId}/assignments/{hostelId}")
    public ResponseEntity<WardenAssignmentResponseDto> assignHostelPath(
            @PathVariable Long wardenId, @PathVariable Long hostelId) {
        WardenAssignmentResponseDto created = wardenAssignmentService.assignHostelToWarden(wardenId, hostelId);
        return ResponseEntity.created(URI.create("/api/admin/wardens/" + created.wardenId() + "/assignments"))
                .body(created);
    }

    /**
     * Revokes an assignment by assignment ID.
     */
    @DeleteMapping("/assignments/{assignmentId}")
    public ResponseEntity<Map<String, String>> revokeAssignmentById(@PathVariable Long assignmentId) {
        wardenAssignmentService.revokeAssignmentById(assignmentId);
        return ResponseEntity.ok(Map.of("message", "Warden hostel assignment successfully revoked"));
    }

    /**
     * Revokes an assignment by warden ID and hostel ID.
     */
    @DeleteMapping("/{wardenId}/assignments/{hostelId}")
    public ResponseEntity<Map<String, String>> revokeAssignment(
            @PathVariable Long wardenId, @PathVariable Long hostelId) {
        wardenAssignmentService.revokeAssignment(wardenId, hostelId);
        return ResponseEntity.ok(Map.of("message", "Warden hostel assignment successfully revoked"));
    }
}
