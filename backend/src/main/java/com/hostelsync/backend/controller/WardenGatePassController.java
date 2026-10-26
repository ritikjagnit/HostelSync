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
@RequestMapping("/api/warden/gatepass")
@PreAuthorize("hasRole('WARDEN')")
public class WardenGatePassController {

    private final GatePassService gatePassService;

    public WardenGatePassController(GatePassService gatePassService) {
        this.gatePassService = gatePassService;
    }

    @GetMapping
    public ResponseEntity<List<GatePassResponseDto>> getGatePasses(
            Authentication authentication,
            @RequestParam(required = false) GatePassStatus status
    ) {
        return ResponseEntity.ok(gatePassService.getWardenGatePasses(authentication.getName(), status));
    }

    @GetMapping("/stats")
    public ResponseEntity<GatePassStatsDto> getStats(Authentication authentication) {
        return ResponseEntity.ok(gatePassService.getWardenGatePassStats(authentication.getName()));
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
