package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.GatePassResponseDto;
import com.hostelsync.backend.dto.GatePassStatsDto;
import com.hostelsync.backend.dto.GatePassStatusUpdateDto;
import com.hostelsync.backend.entity.GatePassStatus;
import com.hostelsync.backend.service.GatePassService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/gatepass")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGatePassController {

    private final GatePassService gatePassService;

    public AdminGatePassController(GatePassService gatePassService) {
        this.gatePassService = gatePassService;
    }

    @GetMapping
    public ResponseEntity<List<GatePassResponseDto>> getGatePasses(
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) GatePassStatus status
    ) {
        return ResponseEntity.ok(gatePassService.getAdminGatePasses(hostelId, status));
    }

    @GetMapping("/stats")
    public ResponseEntity<GatePassStatsDto> getStats() {
        return ResponseEntity.ok(gatePassService.getAdminGatePassStats());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<GatePassResponseDto> updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody GatePassStatusUpdateDto updateDto
    ) {
        return ResponseEntity.ok(gatePassService.updatePassStatus(id, authentication.getName(), updateDto));
    }

    @PatchMapping("/{id}/mark-exit")
    public ResponseEntity<GatePassResponseDto> markExit(
            Authentication authentication,
            @PathVariable Long id
    ) {
        GatePassStatusUpdateDto update = new GatePassStatusUpdateDto(GatePassStatus.OUT_OF_CAMPUS, "Exit from hostel gate recorded.");
        return ResponseEntity.ok(gatePassService.updatePassStatus(id, authentication.getName(), update));
    }

    @PatchMapping("/{id}/mark-entry")
    public ResponseEntity<GatePassResponseDto> markEntry(
            Authentication authentication,
            @PathVariable Long id
    ) {
        GatePassStatusUpdateDto update = new GatePassStatusUpdateDto(GatePassStatus.RETURNED, "Return to hostel gate recorded.");
        return ResponseEntity.ok(gatePassService.updatePassStatus(id, authentication.getName(), update));
    }
}
