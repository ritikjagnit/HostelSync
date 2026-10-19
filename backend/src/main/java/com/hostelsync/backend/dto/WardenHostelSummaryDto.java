package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.HostelType;

/**
 * Hostel summary DTO for warden dashboard and hostel lists with operational metrics.
 */
public record WardenHostelSummaryDto(
        Long id,
        String name,
        HostelType hostelType,
        String address,
        boolean active,
        int totalRooms,
        int totalCapacity,
        int occupiedBeds,
        int availableBeds
) {
}
