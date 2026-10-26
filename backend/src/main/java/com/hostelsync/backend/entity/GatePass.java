package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "gate_passes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_gate_pass_number", columnNames = {"pass_number"})
        },
        indexes = {
                @Index(name = "idx_gate_pass_student", columnList = "student_id"),
                @Index(name = "idx_gate_pass_hostel", columnList = "hostel_id"),
                @Index(name = "idx_gate_pass_status", columnList = "status"),
                @Index(name = "idx_gate_pass_out_time", columnList = "out_time")
        }
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class GatePass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Pass number is required")
    @Size(max = 32, message = "Pass number cannot exceed 32 characters")
    @Column(name = "pass_number", nullable = false, unique = true, length = 32)
    private String passNumber;

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

    @NotNull(message = "Pass type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "pass_type", nullable = false, length = 30)
    private GatePassType passType;

    @NotBlank(message = "Purpose is required")
    @Size(max = 255, message = "Purpose cannot exceed 255 characters")
    @Column(name = "purpose", nullable = false, length = 255)
    private String purpose;

    @NotBlank(message = "Destination is required")
    @Size(max = 255, message = "Destination cannot exceed 255 characters")
    @Column(name = "destination", nullable = false, length = 255)
    private String destination;

    @NotNull(message = "Out time is required")
    @Column(name = "out_time", nullable = false)
    private LocalDateTime outTime;

    @NotNull(message = "Expected in time is required")
    @Column(name = "expected_in_time", nullable = false)
    private LocalDateTime expectedInTime;

    @Column(name = "actual_out_time")
    private LocalDateTime actualOutTime;

    @Column(name = "actual_in_time")
    private LocalDateTime actualInTime;

    @Size(max = 30, message = "Parent contact cannot exceed 30 characters")
    @Column(name = "parent_contact", length = 30)
    private String parentContact;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private GatePassStatus status = GatePassStatus.PENDING;

    @Column(name = "warden_remarks", length = 500)
    private String wardenRemarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_user_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.SET_NULL)
    private User approvedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public GatePass() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.status == null) {
            this.status = GatePassStatus.PENDING;
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

    public String getPassNumber() {
        return passNumber;
    }

    public void setPassNumber(String passNumber) {
        this.passNumber = passNumber;
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

    public GatePassType getPassType() {
        return passType;
    }

    public void setPassType(GatePassType passType) {
        this.passType = passType;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public LocalDateTime getOutTime() {
        return outTime;
    }

    public void setOutTime(LocalDateTime outTime) {
        this.outTime = outTime;
    }

    public LocalDateTime getExpectedInTime() {
        return expectedInTime;
    }

    public void setExpectedInTime(LocalDateTime expectedInTime) {
        this.expectedInTime = expectedInTime;
    }

    public LocalDateTime getActualOutTime() {
        return actualOutTime;
    }

    public void setActualOutTime(LocalDateTime actualOutTime) {
        this.actualOutTime = actualOutTime;
    }

    public LocalDateTime getActualInTime() {
        return actualInTime;
    }

    public void setActualInTime(LocalDateTime actualInTime) {
        this.actualInTime = actualInTime;
    }

    public String getParentContact() {
        return parentContact;
    }

    public void setParentContact(String parentContact) {
        this.parentContact = parentContact;
    }

    public GatePassStatus getStatus() {
        return status;
    }

    public void setStatus(GatePassStatus status) {
        this.status = status;
    }

    public String getWardenRemarks() {
        return wardenRemarks;
    }

    public void setWardenRemarks(String wardenRemarks) {
        this.wardenRemarks = wardenRemarks;
    }

    public User getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(User approvedBy) {
        this.approvedBy = approvedBy;
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
        if (!(o instanceof GatePass that)) return false;
        return Objects.equals(id, that.id) || (passNumber != null && Objects.equals(passNumber, that.passNumber));
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(passNumber != null ? passNumber : id);
    }
}
