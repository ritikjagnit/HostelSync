package com.hostelsync.backend.dto;

import java.time.LocalDate;

/**
 * Optional request payload for student checkout from an active room allocation.
 */
public record AllocationCheckoutRequestDto(
        LocalDate vacatingDate
) {}
