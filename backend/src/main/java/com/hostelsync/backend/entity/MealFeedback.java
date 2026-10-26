package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;

@Entity
@Table(
        name = "meal_feedbacks",
        indexes = {
                @Index(name = "idx_feedback_student", columnList = "student_id"),
                @Index(name = "idx_feedback_hostel", columnList = "hostel_id"),
                @Index(name = "idx_feedback_date", columnList = "feedback_date")
        }
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MealFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @NotNull(message = "Feedback date is required")
    @Column(name = "feedback_date", nullable = false)
    private LocalDate feedbackDate;

    @NotNull(message = "Meal type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false, length = 20)
    private MealType mealType;

    @Min(1)
    @Max(5)
    @Column(name = "rating", nullable = false)
    private int rating = 4;

    @Min(1)
    @Max(5)
    @Column(name = "hygiene_rating", nullable = false)
    private int hygieneRating = 4;

    @Size(max = 500)
    @Column(name = "comments", length = 500)
    private String comments;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public MealFeedback() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.feedbackDate == null) {
            this.feedbackDate = LocalDate.now();
        }
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDate getFeedbackDate() {
        return feedbackDate;
    }

    public void setFeedbackDate(LocalDate feedbackDate) {
        this.feedbackDate = feedbackDate;
    }

    public MealType getMealType() {
        return mealType;
    }

    public void setMealType(MealType mealType) {
        this.mealType = mealType;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public int getHygieneRating() {
        return hygieneRating;
    }

    public void setHygieneRating(int hygieneRating) {
        this.hygieneRating = hygieneRating;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MealFeedback that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
