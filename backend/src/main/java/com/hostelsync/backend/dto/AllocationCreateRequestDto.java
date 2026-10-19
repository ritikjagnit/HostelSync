package com.hostelsync.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * Request payload for assigning a student to a hostel room.
 */
public record AllocationCreateRequestDto(
        @NotNull(message = "Student ID is required")
        Long studentId,

        @NotNull(message = "Room ID is required")
        Long roomId,

        LocalDate allocationDate
) {}
