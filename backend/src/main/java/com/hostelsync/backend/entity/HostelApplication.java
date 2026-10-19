package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * HostelApplication entity recording prospective student applications, merit evaluation,
 * selection by hostel in-charge, and final admission room assignment.
 */
@Entity
@Table(name = "hostel_applications")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class HostelApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Application number is required")
    @Column(name = "application_number", nullable = false, unique = true, length = 50)
    private String applicationNumber;

    @NotBlank(message = "Full name is required")
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @NotBlank(message = "Phone number is required")
    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @NotBlank(message = "Enrollment number is required")
    @Column(name = "enrollment_number", nullable = false, length = 50)
    private String enrollmentNumber;

    @NotBlank(message = "Course is required")
    @Column(name = "course", nullable = false, length = 100)
    private String course;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be at least 1")
    @Max(value = 10, message = "Semester cannot exceed 10")
    @Column(name = "semester", nullable = false)
    private Integer semester;

    @NotBlank(message = "Gender is required")
    @Column(name = "gender", nullable = false, length = 10)
    private String gender; // "MALE" or "FEMALE"

    @NotBlank(message = "Category is required")
    @Column(name = "category", nullable = false, length = 30)
    private String category; // "OPEN", "OBC", "SC", "ST", "VJNT", "EWS"

    @NotNull(message = "Merit percentage is required")
    @DecimalMin(value = "0.0", message = "Percentage cannot be negative")
    @DecimalMax(value = "100.0", message = "Percentage cannot exceed 100")
    @Column(name = "merit_percentage", nullable = false)
    private Double meritPercentage;

    @NotBlank(message = "Parent / Guardian name is required")
    @Column(name = "parent_name", nullable = false, length = 150)
    private String parentName;

    @NotBlank(message = "Parent / Guardian phone is required")
    @Column(name = "parent_phone", nullable = false, length = 20)
    private String parentPhone;

    @NotBlank(message = "Permanent home address is required")
    @Column(name = "home_address", nullable = false, length = 255)
    private String homeAddress;

    @NotNull(message = "Distance from college is required")
    @DecimalMin(value = "0.0", message = "Distance cannot be negative")
    @Column(name = "distance_from_college", nullable = false)
    private Double distanceFromCollege; // in KM

    @NotNull(message = "Application status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "remarks", length = 500)
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocated_hostel_id")
    private Hostel allocatedHostel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocated_room_id")
    private Room allocatedRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    public HostelApplication() {
    }

    public HostelApplication(
            String applicationNumber,
            String fullName,
            String email,
            String phone,
            String enrollmentNumber,
            String course,
            Integer semester,
            String gender,
            String category,
            Double meritPercentage,
            String parentName,
            String parentPhone,
            String homeAddress,
            Double distanceFromCollege,
            String remarks
    ) {
        this.applicationNumber = applicationNumber;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.enrollmentNumber = enrollmentNumber;
        this.course = course;
        this.semester = semester;
        this.gender = gender;
        this.category = category;
        this.meritPercentage = meritPercentage;
        this.parentName = parentName;
        this.parentPhone = parentPhone;
        this.homeAddress = homeAddress;
        this.distanceFromCollege = distanceFromCollege;
        this.remarks = remarks;
        this.status = ApplicationStatus.PENDING;
        this.appliedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getApplicationNumber() {
        return applicationNumber;
    }

    public void setApplicationNumber(String applicationNumber) {
        this.applicationNumber = applicationNumber;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEnrollmentNumber() {
        return enrollmentNumber;
    }

    public void setEnrollmentNumber(String enrollmentNumber) {
        this.enrollmentNumber = enrollmentNumber;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getMeritPercentage() {
        return meritPercentage;
    }

    public void setMeritPercentage(Double meritPercentage) {
        this.meritPercentage = meritPercentage;
    }

    public String getParentName() {
        return parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }

    public String getParentPhone() {
        return parentPhone;
    }

    public void setParentPhone(String parentPhone) {
        this.parentPhone = parentPhone;
    }

    public String getHomeAddress() {
        return homeAddress;
    }

    public void setHomeAddress(String homeAddress) {
        this.homeAddress = homeAddress;
    }

    public Double getDistanceFromCollege() {
        return distanceFromCollege;
    }

    public void setDistanceFromCollege(Double distanceFromCollege) {
        this.distanceFromCollege = distanceFromCollege;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public Hostel getAllocatedHostel() {
        return allocatedHostel;
    }

    public void setAllocatedHostel(Hostel allocatedHostel) {
        this.allocatedHostel = allocatedHostel;
    }

    public Room getAllocatedRoom() {
        return allocatedRoom;
    }

    public void setAllocatedRoom(Room allocatedRoom) {
        this.allocatedRoom = allocatedRoom;
    }

    public Student getStudent() {
        return student;
    }

    public void setStudent(Student student) {
        this.student = student;
    }

    public LocalDateTime getAppliedAt() {
        return appliedAt;
    }

    public void setAppliedAt(LocalDateTime appliedAt) {
        this.appliedAt = appliedAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HostelApplication that = (HostelApplication) o;
        return Objects.equals(id, that.id) ||
                (applicationNumber != null && Objects.equals(applicationNumber, that.applicationNumber));
    }

    @Override
    public int hashCode() {
        return Objects.hash(applicationNumber != null ? applicationNumber : id);
    }
}
