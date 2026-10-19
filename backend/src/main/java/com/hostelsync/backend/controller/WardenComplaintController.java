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
 * REST controller for Warden maintenance ticket handling and hostel issue resolution.
 */
@RestController
@RequestMapping("/api/warden/complaints")
@PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
public class WardenComplaintController {

    private final ComplaintService complaintService;

    public WardenComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @GetMapping
    public ResponseEntity<List<ComplaintResponseDto>> getAssignedComplaints(
            Authentication authentication,
            @RequestParam(required = false) ComplaintStatus status
    ) {
        return ResponseEntity.ok(complaintService.getWardenComplaints(authentication.getName(), status));
    }

    @GetMapping("/stats")
    public ResponseEntity<ComplaintStatsDto> getWardenStats(Authentication authentication) {
        return ResponseEntity.ok(complaintService.getWardenComplaintStats(authentication.getName()));
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
