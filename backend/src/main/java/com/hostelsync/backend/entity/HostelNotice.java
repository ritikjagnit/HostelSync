package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
        name = "hostel_notices",
        indexes = {
                @Index(name = "idx_notice_target", columnList = "target_audience"),
                @Index(name = "idx_notice_category", columnList = "category"),
                @Index(name = "idx_notice_priority", columnList = "priority"),
                @Index(name = "idx_notice_pinned", columnList = "is_pinned"),
                @Index(name = "idx_notice_created_at", columnList = "created_at")
        }
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class HostelNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @NotBlank(message = "Content is required")
    @Size(max = 4000, message = "Content cannot exceed 4000 characters")
    @Column(name = "content", nullable = false, length = 4000)
    private String content;

    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private NoticeCategory category = NoticeCategory.GENERAL;

    @NotNull(message = "Priority is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private NoticePriority priority = NoticePriority.NORMAL;

    @NotNull(message = "Target audience is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "target_audience", nullable = false, length = 30)
    private NoticeTarget targetAudience = NoticeTarget.ALL;

    @Column(name = "is_pinned", nullable = false)
    private boolean isPinned = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posted_by_user_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.SET_NULL)
    private User postedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hostel_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.SET_NULL)
    private Hostel hostel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public HostelNotice() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public NoticeCategory getCategory() {
        return category;
    }

    public void setCategory(NoticeCategory category) {
        this.category = category;
    }

    public NoticePriority getPriority() {
        return priority;
    }

    public void setPriority(NoticePriority priority) {
        this.priority = priority;
    }

    public NoticeTarget getTargetAudience() {
        return targetAudience;
    }

    public void setTargetAudience(NoticeTarget targetAudience) {
        this.targetAudience = targetAudience;
    }

    public boolean isPinned() {
        return isPinned;
    }

    public void setPinned(boolean pinned) {
        isPinned = pinned;
    }

    public User getPostedBy() {
        return postedBy;
    }

    public void setPostedBy(User postedBy) {
        this.postedBy = postedBy;
    }

    public Hostel getHostel() {
        return hostel;
    }

    public void setHostel(Hostel hostel) {
        this.hostel = hostel;
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
        if (!(o instanceof HostelNotice that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
