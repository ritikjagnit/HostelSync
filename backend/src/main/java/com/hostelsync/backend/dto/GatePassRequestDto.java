package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.GatePassType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record GatePassRequestDto(
        @NotNull(message = "Pass type is required")
        GatePassType passType,

        @NotBlank(message = "Purpose is required")
        @Size(max = 255)
        String purpose,

        @NotBlank(message = "Destination is required")
        @Size(max = 255)
        String destination,

        @NotNull(message = "Out time is required")
        LocalDateTime outTime,

        @NotNull(message = "Expected return time is required")
        LocalDateTime expectedInTime,

        @Size(max = 30)
        String parentContact
) {
}
