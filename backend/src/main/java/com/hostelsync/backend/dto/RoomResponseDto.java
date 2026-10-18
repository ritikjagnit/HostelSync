package com.hostelsync.backend.dto;

/**
 * Standardized response DTO representing a Room with current occupancy metrics.
 */
public record RoomResponseDto(
        Long id,
        String roomNumber,
        Integer floor,
        Integer capacity,
        Long hostelId,
        String hostelName,
        long activeAllocations,
        int availableBeds
) {}
