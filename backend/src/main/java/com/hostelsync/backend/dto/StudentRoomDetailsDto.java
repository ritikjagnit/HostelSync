package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.AllocationStatus;
import java.time.LocalDate;

/**
 * Detailed room information and live occupancy metrics for a student's active allocation.
 */
public record StudentRoomDetailsDto(
        Long allocationId,
        Long roomId,
        String roomNumber,
        Integer floor,
        Integer capacity,
        long currentOccupancy,
        long availableBeds,
        Long hostelId,
        String hostelName,
        String hostelType,
        String hostelAddress,
        LocalDate allocationDate,
        AllocationStatus status
) {}
