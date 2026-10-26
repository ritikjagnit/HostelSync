package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.Year;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class FeeService {

    private final FeeRecordRepository feeRecordRepository;
    private final StudentRepository studentRepository;
    private final HostelRepository hostelRepository;
    private final RoomAllocationRepository roomAllocationRepository;

    public FeeService(
            FeeRecordRepository feeRecordRepository,
            StudentRepository studentRepository,
            HostelRepository hostelRepository,
            RoomAllocationRepository roomAllocationRepository) {
        this.feeRecordRepository = feeRecordRepository;
        this.studentRepository = studentRepository;
        this.hostelRepository = hostelRepository;
        this.roomAllocationRepository = roomAllocationRepository;
    }

    @Transactional
    public FeeResponseDto createFeeRecord(FeeRecordCreateDto dto) {
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        RoomAllocation alloc = roomAllocationRepository.findActiveByStudentId(student.getId()).orElse(null);
        Hostel hostel = (alloc != null) ? alloc.getRoom().getHostel() : hostelRepository.findAll().stream().findFirst().orElse(null);

        if (hostel == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hostel available to associate with fee record");
        }

        FeeRecord fee = new FeeRecord();
        fee.setReceiptNumber(generateReceiptNumber());
        fee.setStudent(student);
        fee.setHostel(hostel);
        fee.setAcademicYear(dto.academicYear() != null ? dto.academicYear() : "2025-26");
        fee.setSemester(dto.semester() != null ? dto.semester() : student.getSemester());
        fee.setFeeType(dto.feeType());
        fee.setAmount(dto.amount());
        fee.setPaidAmount(0.0);
        fee.setDueDate(dto.dueDate());
        fee.setStatus(FeePaymentStatus.PENDING);
        fee.setRemarks(dto.remarks());

        FeeRecord saved = feeRecordRepository.save(fee);
        return mapToDto(saved, alloc != null ? alloc.getRoom().getRoomNumber() : null);
    }

    @Transactional
    public FeeResponseDto recordPayment(Long feeId, FeePaymentDto paymentDto) {
        FeeRecord fee = feeRecordRepository.findById(feeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fee record not found"));

        double newPaidAmount = fee.getPaidAmount() + paymentDto.paymentAmount();
        fee.setPaidAmount(newPaidAmount);
        fee.setPaymentDate(LocalDate.now());

        if (newPaidAmount >= fee.getAmount()) {
            fee.setStatus(FeePaymentStatus.PAID);
        } else if (newPaidAmount > 0) {
            fee.setStatus(FeePaymentStatus.PARTIALLY_PAID);
        }

        if (paymentDto.paymentMode() != null) {
            fee.setPaymentMode(paymentDto.paymentMode());
        }
        if (paymentDto.transactionRef() != null) {
            fee.setTransactionRef(paymentDto.transactionRef());
        }
        if (paymentDto.remarks() != null) {
            fee.setRemarks(paymentDto.remarks());
        }

        FeeRecord saved = feeRecordRepository.save(fee);
        return mapToDto(saved, null);
    }

    @Transactional(readOnly = true)
    public List<FeeResponseDto> getStudentFees(String studentEmail) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));

        String room = roomAllocationRepository.findActiveByStudentId(student.getId())
                .map(a -> a.getRoom().getRoomNumber())
                .orElse(null);

        return feeRecordRepository.findByStudentIdOrderByDueDateDesc(student.getId())
                .stream()
                .map(f -> mapToDto(f, room))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FeeResponseDto> getAllFees(Long hostelId, FeePaymentStatus statusFilter) {
        List<FeeRecord> list = (hostelId != null)
                ? feeRecordRepository.findByHostelIdOrderByDueDateDesc(hostelId)
                : feeRecordRepository.findAllByOrderByDueDateDesc();

        return list.stream()
                .filter(f -> statusFilter == null || f.getStatus() == statusFilter)
                .map(f -> mapToDto(f, null))
                .toList();
    }

    @Transactional(readOnly = true)
    public NoDuesResponseDto getNoDuesStatus(String studentEmail) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        return evaluateNoDues(student, "Principal / Hostel Warden (GP Sakoli)");
    }

    @Transactional(readOnly = true)
    public NoDuesResponseDto getNoDuesForStudent(Long studentId, String authorizedBy) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        return evaluateNoDues(student, authorizedBy != null ? authorizedBy : "Principal (GP Sakoli)");
    }

    @Transactional(readOnly = true)
    public FeeStatsDto getFeeStats(Long hostelId) {
        List<FeeRecord> records = (hostelId != null)
                ? feeRecordRepository.findByHostelIdOrderByDueDateDesc(hostelId)
                : feeRecordRepository.findAll();

        double assessed = records.stream().mapToDouble(FeeRecord::getAmount).sum();
        double collected = records.stream().mapToDouble(FeeRecord::getPaidAmount).sum();
        double pending = Math.max(0.0, assessed - collected);

        long paidCount = records.stream().filter(r -> r.getStatus() == FeePaymentStatus.PAID).count();
        long pendingCount = records.stream().filter(r -> r.getStatus() == FeePaymentStatus.PENDING || r.getStatus() == FeePaymentStatus.PARTIALLY_PAID).count();
        long overdueCount = records.stream().filter(r -> r.getStatus() != FeePaymentStatus.PAID && r.getDueDate().isBefore(LocalDate.now())).count();

        return new FeeStatsDto(
                Math.round(assessed * 100.0) / 100.0,
                Math.round(collected * 100.0) / 100.0,
                Math.round(pending * 100.0) / 100.0,
                paidCount,
                pendingCount,
                overdueCount
        );
    }

    private NoDuesResponseDto evaluateNoDues(Student student, String authorizedBy) {
        List<FeeRecord> fees = feeRecordRepository.findByStudentIdOrderByDueDateDesc(student.getId());
        double totalAssessed = fees.stream().mapToDouble(FeeRecord::getAmount).sum();
        double totalPaid = fees.stream().mapToDouble(FeeRecord::getPaidAmount).sum();
        double outstanding = Math.max(0.0, totalAssessed - totalPaid);

        RoomAllocation alloc = roomAllocationRepository.findActiveByStudentId(student.getId()).orElse(null);
        String hostelName = alloc != null ? alloc.getRoom().getHostel().getName() : "Government Polytechnic Sakoli Hostel";
        String roomNumber = alloc != null ? alloc.getRoom().getRoomNumber() : "N/A";

        boolean isEligible = outstanding <= 0.0;
        String certNum = isEligible ? "NOC-" + Year.now().getValue() + "-S" + String.format("%04d", student.getId()) : null;

        return new NoDuesResponseDto(
                student.getId(),
                student.getUser().getFullName(),
                student.getEnrollmentNumber(),
                student.getCourse(),
                student.getSemester(),
                hostelName,
                roomNumber,
                Math.round(totalAssessed * 100.0) / 100.0,
                Math.round(totalPaid * 100.0) / 100.0,
                Math.round(outstanding * 100.0) / 100.0,
                isEligible,
                isEligible ? LocalDate.now() : null,
                certNum,
                authorizedBy
        );
    }

    private FeeResponseDto mapToDto(FeeRecord f, String explicitRoom) {
        String room = explicitRoom;
        if (room == null && f.getStudent() != null) {
            room = roomAllocationRepository.findActiveByStudentId(f.getStudent().getId())
                    .map(a -> a.getRoom().getRoomNumber())
                    .orElse(null);
        }

        double balance = Math.max(0.0, f.getAmount() - f.getPaidAmount());
        FeePaymentStatus effectiveStatus = f.getStatus();
        if (effectiveStatus != FeePaymentStatus.PAID && f.getDueDate().isBefore(LocalDate.now())) {
            effectiveStatus = FeePaymentStatus.OVERDUE;
        }

        return new FeeResponseDto(
                f.getId(),
                f.getReceiptNumber(),
                f.getStudent().getId(),
                f.getStudent().getUser().getFullName(),
                f.getStudent().getEnrollmentNumber(),
                f.getStudent().getPhone(),
                f.getHostel().getId(),
                f.getHostel().getName(),
                room,
                f.getAcademicYear(),
                f.getSemester(),
                f.getFeeType(),
                f.getAmount(),
                f.getPaidAmount(),
                Math.round(balance * 100.0) / 100.0,
                f.getDueDate(),
                f.getPaymentDate(),
                effectiveStatus,
                f.getPaymentMode(),
                f.getTransactionRef(),
                f.getRemarks(),
                f.getCreatedAt(),
                f.getUpdatedAt()
        );
    }

    private String generateReceiptNumber() {
        int year = Year.now().getValue();
        String randomSuffix = String.format("%05d", ThreadLocalRandom.current().nextInt(1, 100000));
        return "REC-" + year + "-" + randomSuffix;
    }
}
