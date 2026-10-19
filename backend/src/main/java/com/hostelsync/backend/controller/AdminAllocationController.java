package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.AllocationStatus;
import com.hostelsync.backend.service.AllocationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * REST controller for administrator room allocation management, student assignment, and checkout operations.
 */
@RestController
@RequestMapping("/api/admin/allocations")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAllocationController {

    private final AllocationService allocationService;

    public AdminAllocationController(AllocationService allocationService) {
        this.allocationService = allocationService;
    }

    @GetMapping
    public ResponseEntity<List<AllocationResponseDto>> getAllocations(
            @RequestParam(required = false) AllocationStatus status,
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(allocationService.getAllocations(status, hostelId, roomId, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AllocationResponseDto> getAllocationById(@PathVariable Long id) {
        return ResponseEntity.ok(allocationService.getAllocationById(id));
    }

    @PostMapping
    public ResponseEntity<AllocationResponseDto> createAllocation(
            @Valid @RequestBody AllocationCreateRequestDto requestDto) {
        AllocationResponseDto created = allocationService.createAllocation(requestDto);
        return ResponseEntity.created(URI.create("/api/admin/allocations/" + created.id()))
                .body(created);
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<AllocationResponseDto> checkoutAllocation(
            @PathVariable Long id,
            @RequestBody(required = false) AllocationCheckoutRequestDto checkoutDto) {
        return ResponseEntity.ok(allocationService.checkoutAllocation(id, checkoutDto));
    }

    @GetMapping("/available-students")
    public ResponseEntity<List<AvailableStudentDto>> getAvailableStudents() {
        return ResponseEntity.ok(allocationService.getAvailableStudents());
    }

    @GetMapping("/available-rooms")
    public ResponseEntity<List<RoomResponseDto>> getAvailableRooms(
            @RequestParam Long hostelId,
            @RequestParam(required = false, defaultValue = "false") boolean includeFull) {
        return ResponseEntity.ok(allocationService.getAvailableRooms(hostelId, includeFull));
    }
}
