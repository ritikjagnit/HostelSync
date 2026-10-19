package com.hostelsync.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * DTO for Hostel In-Charge or Administrator to officially admit a selected applicant into a room.
 */
public record HostelApplicationAdmitDto(
        @NotNull(message = "Room ID is required")
        Long roomId,

        LocalDate allocationDate,

        String defaultPassword
) {}
