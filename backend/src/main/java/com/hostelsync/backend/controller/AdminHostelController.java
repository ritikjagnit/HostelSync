package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.HostelRequestDto;
import com.hostelsync.backend.dto.HostelResponseDto;
import com.hostelsync.backend.dto.HostelStatusRequestDto;
import com.hostelsync.backend.dto.RoomRequestDto;
import com.hostelsync.backend.dto.RoomResponseDto;
import com.hostelsync.backend.service.HostelService;
import com.hostelsync.backend.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * REST controller for administrator hostel management and nested room creation/listing.
 */
@RestController
@RequestMapping("/api/admin/hostels")
@PreAuthorize("hasRole('ADMIN')")
public class AdminHostelController {

    private final HostelService hostelService;
    private final RoomService roomService;

    public AdminHostelController(HostelService hostelService, RoomService roomService) {
        this.hostelService = hostelService;
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<List<HostelResponseDto>> getAllHostels() {
        return ResponseEntity.ok(hostelService.getAllHostels());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HostelResponseDto> getHostelById(@PathVariable Long id) {
        return ResponseEntity.ok(hostelService.getHostelById(id));
    }

    @PostMapping
    public ResponseEntity<HostelResponseDto> createHostel(@Valid @RequestBody HostelRequestDto requestDto) {
        HostelResponseDto created = hostelService.createHostel(requestDto);
        return ResponseEntity.created(URI.create("/api/admin/hostels/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HostelResponseDto> updateHostel(
            @PathVariable Long id,
            @Valid @RequestBody HostelRequestDto requestDto) {
        return ResponseEntity.ok(hostelService.updateHostel(id, requestDto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<HostelResponseDto> updateHostelStatus(
            @PathVariable Long id,
            @Valid @RequestBody HostelStatusRequestDto statusDto) {
        return ResponseEntity.ok(hostelService.updateHostelStatus(id, statusDto.active()));
    }

    @GetMapping("/{hostelId}/rooms")
    public ResponseEntity<List<RoomResponseDto>> getRoomsForHostel(@PathVariable Long hostelId) {
        return ResponseEntity.ok(roomService.getRoomsByHostelId(hostelId));
    }

    @PostMapping("/{hostelId}/rooms")
    public ResponseEntity<RoomResponseDto> createRoomForHostel(
            @PathVariable Long hostelId,
            @Valid @RequestBody RoomRequestDto requestDto) {
        RoomResponseDto created = roomService.createRoom(hostelId, requestDto);
        return ResponseEntity.created(URI.create("/api/admin/rooms/" + created.id()))
                .body(created);
    }
}
