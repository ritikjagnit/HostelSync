package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.AdminDashboardStatsDto;
import com.hostelsync.backend.service.HostelService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller providing consolidated administrative metrics and inventory summary.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final HostelService hostelService;

    public AdminDashboardController(HostelService hostelService) {
        this.hostelService = hostelService;
    }

    @GetMapping
    public ResponseEntity<AdminDashboardStatsDto> getDashboardSummary() {
        return ResponseEntity.ok(hostelService.getDashboardStats());
    }
}
