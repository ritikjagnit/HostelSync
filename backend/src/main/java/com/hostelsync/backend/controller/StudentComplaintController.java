package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.ComplaintCreateDto;
import com.hostelsync.backend.dto.ComplaintResponseDto;
import com.hostelsync.backend.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for student grievance submission and tracking.
 */
@RestController
@RequestMapping("/api/student/complaints")
@PreAuthorize("hasRole('STUDENT')")
public class StudentComplaintController {

    private final ComplaintService complaintService;

    public StudentComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping
    public ResponseEntity<ComplaintResponseDto> submitComplaint(
            Authentication authentication,
            @Valid @RequestBody ComplaintCreateDto dto
    ) {
        ComplaintResponseDto response = complaintService.createComplaint(authentication.getName(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ComplaintResponseDto>> getMyComplaints(Authentication authentication) {
        return ResponseEntity.ok(complaintService.getStudentComplaints(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponseDto> getComplaintDetails(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(complaintService.getStudentComplaintById(authentication.getName(), id));
    }
}
