package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.HostelType;

/**
 * Standardized response DTO representing a Hostel entity with inventory aggregates.
 */
public record HostelResponseDto(
        Long id,
        String name,
        HostelType hostelType,
        String address,
        boolean active,
        int totalRooms,
        int totalCapacity,
        long activeAllocations,
        int availableBeds
) {}
