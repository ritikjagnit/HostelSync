package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.DayOfWeek;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(
        name = "mess_menus",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_hostel_day_of_week", columnNames = {"hostel_id", "day_of_week"})
        },
        indexes = {
                @Index(name = "idx_mess_menu_day", columnList = "day_of_week")
        }
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MessMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hostel_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Hostel hostel;

    @NotNull(message = "Day of week is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 20)
    private DayOfWeek dayOfWeek;

    @Size(max = 500)
    @Column(name = "breakfast", length = 500)
    private String breakfast;

    @Size(max = 500)
    @Column(name = "lunch", length = 500)
    private String lunch;

    @Size(max = 500)
    @Column(name = "snacks", length = 500)
    private String snacks;

    @Size(max = 500)
    @Column(name = "dinner", length = 500)
    private String dinner;

    @Size(max = 255)
    @Column(name = "special_note", length = 255)
    private String specialNote;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public MessMenu() {
    }

    public MessMenu(Hostel hostel, DayOfWeek dayOfWeek, String breakfast, String lunch, String snacks, String dinner, String specialNote) {
        this.hostel = hostel;
        this.dayOfWeek = dayOfWeek;
        this.breakfast = breakfast;
        this.lunch = lunch;
        this.snacks = snacks;
        this.dinner = dinner;
        this.specialNote = specialNote;
        this.updatedAt = Instant.now();
    }

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Hostel getHostel() {
        return hostel;
    }

    public void setHostel(Hostel hostel) {
        this.hostel = hostel;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getBreakfast() {
        return breakfast;
    }

    public void setBreakfast(String breakfast) {
        this.breakfast = breakfast;
    }

    public String getLunch() {
        return lunch;
    }

    public void setLunch(String lunch) {
        this.lunch = lunch;
    }

    public String getSnacks() {
        return snacks;
    }

    public void setSnacks(String snacks) {
        this.snacks = snacks;
    }

    public String getDinner() {
        return dinner;
    }

    public void setDinner(String dinner) {
        this.dinner = dinner;
    }

    public String getSpecialNote() {
        return specialNote;
    }

    public void setSpecialNote(String specialNote) {
        this.specialNote = specialNote;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MessMenu messMenu)) return false;
        return Objects.equals(id, messMenu.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
