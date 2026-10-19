package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.service.StudentPortalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing self-service endpoints exclusively for authenticated STUDENT residents.
 * Strictly derives resident identity from security authentication principal.
 */
@RestController
@RequestMapping("/api/student")
@PreAuthorize("hasRole('STUDENT')")
public class StudentPortalController {

    private final StudentPortalService studentPortalService;

    public StudentPortalController(StudentPortalService studentPortalService) {
        this.studentPortalService = studentPortalService;
    }

    /**
     * Retrieves consolidated resident dashboard metrics, current housing status, and profile.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<StudentDashboardDto> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(studentPortalService.getStudentDashboard(authentication.getName()));
    }

    /**
     * Retrieves personal academic and contact profile details for the authenticated student.
     */
    @GetMapping("/profile")
    public ResponseEntity<StudentProfileResponseDto> getProfile(Authentication authentication) {
        return ResponseEntity.ok(studentPortalService.getStudentProfile(authentication.getName()));
    }

    /**
     * Updates allowable contact information (phone number) for the authenticated student.
     */
    @PutMapping("/profile")
    public ResponseEntity<StudentProfileResponseDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody StudentProfileUpdateRequestDto dto) {
        return ResponseEntity.ok(studentPortalService.updateStudentProfile(authentication.getName(), dto));
    }

    /**
     * Retrieves the current active room allocation with live room occupancy metrics.
     * Returns 200 with null body if no active allocation exists.
     */
    @GetMapping("/allocations/current")
    public ResponseEntity<StudentRoomDetailsDto> getCurrentAllocation(Authentication authentication) {
        return ResponseEntity.ok(studentPortalService.getCurrentRoom(authentication.getName()));
    }

    /**
     * Retrieves the complete historical residential allocation timeline for the authenticated student.
     */
    @GetMapping("/allocations")
    public ResponseEntity<List<StudentAllocationHistoryDto>> getAllocations(Authentication authentication) {
        return ResponseEntity.ok(studentPortalService.getAllocationHistory(authentication.getName()));
    }
}
