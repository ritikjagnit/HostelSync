package com.hostelsync.backend.dto;

import java.util.List;

/**
 * Room inventory DTO for warden operations showing room capacity, occupancy, and active occupants.
 */
public record WardenRoomInventoryDto(
        Long id,
        String roomNumber,
        Integer floor,
        Integer capacity,
        int currentOccupancy,
        int availableBeds,
        Long hostelId,
        String hostelName,
        List<WardenResidentSummaryDto> occupants
) {
}
