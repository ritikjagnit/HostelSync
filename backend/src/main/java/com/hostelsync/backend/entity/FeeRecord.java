package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(
        name = "fee_records",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_fee_receipt_number", columnNames = {"receipt_number"})
        },
        indexes = {
                @Index(name = "idx_fee_student", columnList = "student_id"),
                @Index(name = "idx_fee_hostel", columnList = "hostel_id"),
                @Index(name = "idx_fee_status", columnList = "status"),
                @Index(name = "idx_fee_type", columnList = "fee_type")
        }
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FeeRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Receipt number is required")
    @Size(max = 32)
    @Column(name = "receipt_number", nullable = false, unique = true, length = 32)
    private String receiptNumber;

    @NotNull(message = "Student reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Student student;

    @NotNull(message = "Hostel reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hostel_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Hostel hostel;

    @NotBlank(message = "Academic year is required")
    @Size(max = 20)
    @Column(name = "academic_year", nullable = false, length = 20)
    private String academicYear = "2025-26";

    @Column(name = "semester")
    private Integer semester;

    @NotNull(message = "Fee type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "fee_type", nullable = false, length = 30)
    private FeeType feeType = FeeType.HOSTEL_RENT;

    @Column(name = "amount", nullable = false)
    private Double amount;

    @Column(name = "paid_amount", nullable = false)
    private Double paidAmount = 0.0;

    @NotNull(message = "Due date is required")
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @NotNull(message = "Payment status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private FeePaymentStatus status = FeePaymentStatus.PENDING;

    @Size(max = 50)
    @Column(name = "payment_mode", length = 50)
    private String paymentMode;

    @Size(max = 100)
    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;

    @Size(max = 255)
    @Column(name = "remarks", length = 255)
    private String remarks;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public FeeRecord() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == null) {
            this.status = FeePaymentStatus.PENDING;
        }
        if (this.paidAmount == null) {
            this.paidAmount = 0.0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public Hostel getHostel() {
        return hostel;
    }

    public void setHostel(Hostel hostel) {
        this.hostel = hostel;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public FeeType getFeeType() {
        return feeType;
    }

    public void setFeeType(FeeType feeType) {
        this.feeType = feeType;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Double getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(Double paidAmount) {
        this.paidAmount = paidAmount;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public FeePaymentStatus getStatus() {
        return status;
    }

    public void setStatus(FeePaymentStatus status) {
        this.status = status;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getTransactionRef() {
        return transactionRef;
    }

    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FeeRecord feeRecord)) return false;
        return Objects.equals(id, feeRecord.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
