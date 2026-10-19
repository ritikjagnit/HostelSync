package com.hostelsync.backend.dto;

import java.time.Instant;
import java.util.List;

/**
 * Summary DTO of a Warden user and their currently assigned hostels.
 */
public record WardenSummaryDto(
        Long id,
        String fullName,
        String email,
        boolean active,
        Instant createdAt,
        List<HostelResponseDto> assignedHostels
) {
}
