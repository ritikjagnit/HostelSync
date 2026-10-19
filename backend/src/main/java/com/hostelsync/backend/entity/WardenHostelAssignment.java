package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.Objects;

/**
 * Normalized relationship entity assigning a WARDEN User to oversee one or more Hostels.
 * Admin-controlled authorization mapping enforcing hostel-level operational boundaries.
 */
@Entity
@Table(
        name = "warden_hostel_assignments",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_warden_hostel", columnNames = {"warden_id", "hostel_id"})
        }
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WardenHostelAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Warden user reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warden_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User warden;

    @NotNull(message = "Hostel reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hostel_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Hostel hostel;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;

    public WardenHostelAssignment() {
    }

    public WardenHostelAssignment(User warden, Hostel hostel) {
        this.warden = warden;
        this.hostel = hostel;
    }

    @PrePersist
    protected void onCreate() {
        if (this.assignedAt == null) {
            this.assignedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getWarden() {
        return warden;
    }

    public void setWarden(User warden) {
        this.warden = warden;
    }

    public Hostel getHostel() {
        return hostel;
    }

    public void setHostel(Hostel hostel) {
        this.hostel = hostel;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(Instant assignedAt) {
        this.assignedAt = assignedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WardenHostelAssignment that = (WardenHostelAssignment) o;
        if (id != null && that.id != null) {
            return Objects.equals(id, that.id);
        }
        return Objects.equals(warden != null ? warden.getId() : null, that.warden != null ? that.warden.getId() : null) &&
                Objects.equals(hostel != null ? hostel.getId() : null, that.hostel != null ? that.hostel.getId() : null);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id != null ? id : (warden != null ? warden.getId() : 0) + (hostel != null ? hostel.getId() : 0));
    }
}
