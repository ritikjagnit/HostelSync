package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.SosCreateDto;
import com.hostelsync.backend.dto.SosResolveDto;
import com.hostelsync.backend.dto.SosResponseDto;
import com.hostelsync.backend.service.SosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class SosController {

    private final SosService sosService;

    public SosController(SosService sosService) {
        this.sosService = sosService;
    }

    // Student SOS trigger
    @PostMapping("/api/student/sos")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SosResponseDto> triggerSos(
            Authentication authentication,
            @Valid @RequestBody SosCreateDto dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sosService.triggerSos(authentication.getName(), dto));
    }

    @GetMapping("/api/student/sos")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<SosResponseDto>> getStudentSosHistory(Authentication authentication) {
        return ResponseEntity.ok(sosService.getStudentAlerts(authentication.getName()));
    }

    // Warden SOS management
    @GetMapping("/api/warden/sos")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<List<SosResponseDto>> getActiveSosAlerts() {
        return ResponseEntity.ok(sosService.getActiveAlerts());
    }

    @GetMapping("/api/warden/sos/all")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<List<SosResponseDto>> getAllSosAlerts() {
        return ResponseEntity.ok(sosService.getAllAlerts());
    }

    @GetMapping("/api/warden/sos/count")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> getActiveCount() {
        return ResponseEntity.ok(Map.of("activeCount", sosService.countActiveAlerts()));
    }

    @PutMapping("/api/warden/sos/{id}/resolve")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<SosResponseDto> resolveSosWarden(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody SosResolveDto dto
    ) {
        return ResponseEntity.ok(sosService.updateAlertStatus(id, authentication.getName(), dto));
    }

    // Admin SOS endpoints
    @GetMapping("/api/admin/sos")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SosResponseDto>> getAdminSosAlerts() {
        return ResponseEntity.ok(sosService.getAllAlerts());
    }

    @PutMapping("/api/admin/sos/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SosResponseDto> resolveSosAdmin(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody SosResolveDto dto
    ) {
        return ResponseEntity.ok(sosService.updateAlertStatus(id, authentication.getName(), dto));
    }
}

