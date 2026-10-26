package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.GatePassRequestDto;
import com.hostelsync.backend.dto.GatePassResponseDto;
import com.hostelsync.backend.service.GatePassService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/gatepass")
@PreAuthorize("hasRole('STUDENT')")
public class StudentGatePassController {

    private final GatePassService gatePassService;

    public StudentGatePassController(GatePassService gatePassService) {
        this.gatePassService = gatePassService;
    }

    @PostMapping
    public ResponseEntity<GatePassResponseDto> applyGatePass(
            Authentication authentication,
            @Valid @RequestBody GatePassRequestDto request
    ) {
        GatePassResponseDto dto = gatePassService.applyGatePass(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping
    public ResponseEntity<List<GatePassResponseDto>> getMyGatePasses(Authentication authentication) {
        return ResponseEntity.ok(gatePassService.getStudentGatePasses(authentication.getName()));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<GatePassResponseDto> cancelGatePass(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(gatePassService.cancelGatePass(authentication.getName(), id));
    }
}
