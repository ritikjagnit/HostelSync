package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.AllocationStatus;
import com.hostelsync.backend.service.WardenOperationsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for authenticated Warden operational workflows and hostel inventory monitoring.
 * Enforces ROLE_WARDEN and hostel-level data boundaries derived from the security principal.
 */
@RestController
@RequestMapping("/api/warden")
@PreAuthorize("hasRole('WARDEN')")
public class WardenOperationsController {

    private final WardenOperationsService wardenOperationsService;

    public WardenOperationsController(WardenOperationsService wardenOperationsService) {
        this.wardenOperationsService = wardenOperationsService;
    }

    /**
     * Aggregated statistics across all hostels assigned to the authenticated warden.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<WardenDashboardDto> getDashboard(Authentication authentication) {
        return ResponseEntity.ok(wardenOperationsService.getDashboard(authentication.getName()));
    }

    /**
     * Lists all hostels assigned to the authenticated warden with live occupancy metrics.
     */
    @GetMapping("/hostels")
    public ResponseEntity<List<WardenHostelSummaryDto>> getAssignedHostels(Authentication authentication) {
        return ResponseEntity.ok(wardenOperationsService.getAssignedHostels(authentication.getName()));
    }

    /**
     * Retrieves details for a specific assigned hostel.
     */
    @GetMapping("/hostels/{id}")
    public ResponseEntity<WardenHostelSummaryDto> getAssignedHostelById(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(wardenOperationsService.getAssignedHostelById(authentication.getName(), id));
    }

    /**
     * Lists rooms and their occupants in an assigned hostel.
     */
    @GetMapping("/hostels/{id}/rooms")
    public ResponseEntity<List<WardenRoomInventoryDto>> getRoomsForHostel(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(wardenOperationsService.getRoomsForHostel(authentication.getName(), id));
    }

    /**
     * Retrieves details and active occupants for a specific room within an assigned hostel.
     */
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<WardenRoomInventoryDto> getRoomDetails(
            @PathVariable Long roomId, Authentication authentication) {
        return ResponseEntity.ok(wardenOperationsService.getRoomDetails(authentication.getName(), roomId));
    }

    /**
     * Lists active residents residing in assigned hostels with optional search and hostel filtering.
     */
    @GetMapping("/residents")
    public ResponseEntity<List<WardenResidentSummaryDto>> getResidents(
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        return ResponseEntity.ok(wardenOperationsService.getResidents(authentication.getName(), hostelId, search));
    }

    /**
     * Lists historical and active room allocations for assigned hostels with search and status filtering.
     */
    @GetMapping("/allocations")
    public ResponseEntity<List<WardenAllocationSummaryDto>> getAllocations(
            @RequestParam(required = false) Long hostelId,
            @RequestParam(required = false) AllocationStatus status,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        return ResponseEntity.ok(wardenOperationsService.getAllocations(authentication.getName(), hostelId, status, search));
    }

    /**
     * Retrieves details for a specific allocation in an assigned hostel.
     */
    @GetMapping("/allocations/{id}")
    public ResponseEntity<WardenAllocationSummaryDto> getAllocationById(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(wardenOperationsService.getAllocationById(authentication.getName(), id));
    }
}
