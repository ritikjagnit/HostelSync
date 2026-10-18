package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Objects;

/**
 * Student profile entity linked to a User account for polytechnic residents.
 */
@Entity
@Table(name = "students")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Enrollment number is required")
    @Size(max = 50, message = "Enrollment number cannot exceed 50 characters")
    @Column(name = "enrollment_number", nullable = false, unique = true, length = 50)
    private String enrollmentNumber;

    @NotBlank(message = "Course is required")
    @Size(max = 100, message = "Course name cannot exceed 100 characters")
    @Column(name = "course", nullable = false, length = 100)
    private String course;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be at least 1")
    @Max(value = 10, message = "Semester cannot exceed 10")
    @Column(name = "semester", nullable = false)
    private Integer semester;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @NotNull(message = "Associated user is required")
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    public Student() {
    }

    public Student(String enrollmentNumber, String course, Integer semester, String phone, User user) {
        this.enrollmentNumber = enrollmentNumber;
        this.course = course;
        this.semester = semester;
        this.phone = phone;
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Student student = (Student) o;
        return Objects.equals(id, student.id) ||
                (enrollmentNumber != null && Objects.equals(enrollmentNumber, student.enrollmentNumber));
    }

    @Override
    public int hashCode() {
        return Objects.hash(enrollmentNumber != null ? enrollmentNumber : id);
    }
}
