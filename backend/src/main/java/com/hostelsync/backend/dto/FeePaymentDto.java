package com.hostelsync.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record FeePaymentDto(
        @NotNull(message = "Payment amount is required")
        @Positive(message = "Payment amount must be greater than 0")
        Double paymentAmount,

        @Size(max = 50)
        String paymentMode,

        @Size(max = 100)
        String transactionRef,

        @Size(max = 255)
        String remarks
) {
}
