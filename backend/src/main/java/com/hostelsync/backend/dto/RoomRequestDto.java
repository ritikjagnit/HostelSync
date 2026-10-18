package com.hostelsync.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating or updating a Room within a Hostel.
 */
public record RoomRequestDto(
        @NotBlank(message = "Room number is required")
        @Size(max = 20, message = "Room number cannot exceed 20 characters")
        String roomNumber,

        @NotNull(message = "Floor number is required")
        @Min(value = 0, message = "Floor number cannot be negative")
        @Max(value = 50, message = "Floor number exceeds facility limit")
        Integer floor,

        @NotNull(message = "Capacity is required")
        @Min(value = 1, message = "Capacity must be at least 1")
        @Max(value = 20, message = "Capacity cannot exceed 20")
        Integer capacity
) {}
