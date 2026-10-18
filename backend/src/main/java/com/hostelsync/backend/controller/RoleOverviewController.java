package com.hostelsync.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST controller verifying and exposing role-governed endpoints for ADMIN, WARDEN, and STUDENT roles.
 */
@RestController
@RequestMapping("/api")
public class RoleOverviewController {

    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminOverview(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "portal", "ADMIN_PORTAL",
                "user", authentication.getName(),
                "authorities", authentication.getAuthorities().toString(),
                "status", "AUTHORIZED"
        ));
    }

    @GetMapping("/warden/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN')")
    public ResponseEntity<Map<String, Object>> getWardenOverview(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "portal", "WARDEN_PORTAL",
                "user", authentication.getName(),
                "authorities", authentication.getAuthorities().toString(),
                "status", "AUTHORIZED"
        ));
    }

    @GetMapping("/student/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'WARDEN', 'STUDENT')")
    public ResponseEntity<Map<String, Object>> getStudentOverview(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
                "portal", "STUDENT_PORTAL",
                "user", authentication.getName(),
                "authorities", authentication.getAuthorities().toString(),
                "status", "AUTHORIZED"
        ));
    }
}
