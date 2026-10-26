package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.FeePaymentStatus;
import com.hostelsync.backend.entity.FeeType;

import java.time.Instant;
import java.time.LocalDate;

public record FeeResponseDto(
        Long id,
        String receiptNumber,
        Long studentId,
        String studentName,
        String studentEnrollment,
        String studentPhone,
        Long hostelId,
        String hostelName,
        String roomNumber,
        String academicYear,
        Integer semester,
        FeeType feeType,
        Double amount,
        Double paidAmount,
        Double balanceAmount,
        LocalDate dueDate,
        LocalDate paymentDate,
        FeePaymentStatus status,
        String paymentMode,
        String transactionRef,
        String remarks,
        Instant createdAt,
        Instant updatedAt
) {
}
