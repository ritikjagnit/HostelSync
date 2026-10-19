package com.hostelsync.backend.dto;

/**
 * Consolidated dashboard DTO for the authenticated student resident.
 */
public record StudentDashboardDto(
        StudentProfileResponseDto profile,
        boolean roomAllocated,
        StudentRoomDetailsDto currentRoom,
        int totalAllocationsCount
) {}
