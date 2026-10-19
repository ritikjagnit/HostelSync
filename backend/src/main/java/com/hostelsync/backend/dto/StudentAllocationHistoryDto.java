package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.AllocationStatus;
import java.time.LocalDate;

/**
 * Historical room allocation entry for the authenticated student's residential record.
 */
public record StudentAllocationHistoryDto(
        Long id,
        Long roomId,
        String roomNumber,
        Integer floor,
        Integer capacity,
        Long hostelId,
        String hostelName,
        String hostelType,
        String hostelAddress,
        LocalDate allocationDate,
        LocalDate vacatingDate,
        AllocationStatus status
) {}
