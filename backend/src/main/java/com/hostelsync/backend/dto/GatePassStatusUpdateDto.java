package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.GatePassStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GatePassStatusUpdateDto(
        @NotNull(message = "Status is required")
        GatePassStatus status,

        @Size(max = 500)
        String wardenRemarks
) {
}
