package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.ComplaintResponseDto;
import com.hostelsync.backend.dto.ComplaintStatsDto;
import com.hostelsync.backend.dto.ComplaintStatusUpdateDto;
import com.hostelsync.backend.entity.ComplaintStatus;
import com.hostelsync.backend.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for institutional administrator grievance oversight and maintenance monitoring.
 */
@RestController
@RequestMapping("/api/admin/complaints")
@PreAuthorize("hasRole('ADMIN')")
public class AdminComplaintController {

    private final ComplaintService complaintService;

    public AdminComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping
    public ResponseEntity<List<ComplaintResponseDto>> getAllComplaints(
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) ComplaintStatus status
    ) {
        return ResponseEntity.ok(complaintService.getAllComplaintsAdmin(hostelId, status));
    }

    @GetMapping("/stats")
    public ResponseEntity<ComplaintStatsDto> getAdminStats() {
        return ResponseEntity.ok(complaintService.getAdminComplaintStats());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ComplaintResponseDto> updateComplaintStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ComplaintStatusUpdateDto dto
    ) {
        return ResponseEntity.ok(complaintService.updateComplaintStatus(authentication.getName(), id, dto));
    }
}
