package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Objects;

/**
 * Room entity representing an accommodation unit within a specific hostel.
 */
@Entity
@Table(
        name = "rooms",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_hostel_room_number", columnNames = {"hostel_id", "room_number"})
        }
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Room number is required")
    @Size(max = 20, message = "Room number cannot exceed 20 characters")
    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;

    @NotNull(message = "Floor number is required")
    @Min(value = 0, message = "Floor number cannot be negative")
    @Column(name = "floor", nullable = false)
    private Integer floor;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Room capacity must be at least 1")
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @NotNull(message = "Hostel reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hostel_id", nullable = false)
    private Hostel hostel;

    public Room() {
    }

    public Room(String roomNumber, Integer floor, Integer capacity, Hostel hostel) {
        this.roomNumber = roomNumber;
        this.floor = floor;
        this.capacity = capacity;
        this.hostel = hostel;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public Integer getFloor() {
        return floor;
    }

    public void setFloor(Integer floor) {
        this.floor = floor;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Hostel getHostel() {
        return hostel;
    }

    public void setHostel(Hostel hostel) {
        this.hostel = hostel;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Room room = (Room) o;
        return Objects.equals(id, room.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
