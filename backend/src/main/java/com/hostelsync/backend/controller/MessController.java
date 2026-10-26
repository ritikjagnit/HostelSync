package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.service.MessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;

@RestController
public class MessController {

    private final MessService messService;

    public MessController(MessService messService) {
        this.messService = messService;
    }

    // Student Endpoints
    @GetMapping("/api/student/mess/menu")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<MessMenuDto>> getStudentMessMenu() {
        return ResponseEntity.ok(messService.getWeeklyMenu(null));
    }

    @PostMapping("/api/student/mess/feedback")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<MealFeedbackResponseDto> submitMealFeedback(
            Authentication authentication,
            @Valid @RequestBody MealFeedbackCreateDto dto
    ) {
        MealFeedbackResponseDto res = messService.submitFeedback(authentication.getName(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/api/student/mess/feedback/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<MealFeedbackResponseDto>> getMyFeedback(Authentication authentication) {
        return ResponseEntity.ok(messService.getStudentFeedbacks(authentication.getName()));
    }

    // Warden Endpoints
    @GetMapping("/api/warden/mess/menu")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<List<MessMenuDto>> getWardenMenu(@RequestParam(required = false) Long hostelId) {
        return ResponseEntity.ok(messService.getWeeklyMenu(hostelId));
    }

    @PutMapping("/api/warden/mess/menu/{dayOfWeek}")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<MessMenuDto> updateWardenMenu(
            @PathVariable DayOfWeek dayOfWeek,
            @RequestParam(required = false) Long hostelId,
            @Valid @RequestBody MessMenuDto dto
    ) {
        return ResponseEntity.ok(messService.updateMenuDay(hostelId, dayOfWeek, dto));
    }

    @GetMapping("/api/warden/mess/feedback/summary")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<MessStatsDto> getWardenMessSummary(@RequestParam(required = false) Long hostelId) {
        return ResponseEntity.ok(messService.getMessSummary(hostelId));
    }

    @GetMapping("/api/warden/mess/feedbacks")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<List<MealFeedbackResponseDto>> getWardenFeedbacks(@RequestParam(required = false) Long hostelId) {
        return ResponseEntity.ok(messService.getHostelFeedbacks(hostelId));
    }

    // Admin Endpoints
    @GetMapping("/api/admin/mess/feedback/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessStatsDto> getAdminMessSummary(@RequestParam(required = false) Long hostelId) {
        return ResponseEntity.ok(messService.getMessSummary(hostelId));
    }
}
