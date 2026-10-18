package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.Objects;

/**
 * RoomAllocation entity recording student assignments to hostel rooms.
 */
@Entity
@Table(name = "room_allocations")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RoomAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Student reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @NotNull(message = "Room reference is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @NotNull(message = "Allocation date is required")
    @Column(name = "allocation_date", nullable = false)
    private LocalDate allocationDate;

    @Column(name = "vacating_date")
    private LocalDate vacatingDate;

    @NotNull(message = "Allocation status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AllocationStatus status = AllocationStatus.ACTIVE;

    public RoomAllocation() {
    }

    public RoomAllocation(Student student, Room room, LocalDate allocationDate, LocalDate vacatingDate, AllocationStatus status) {
        this.student = student;
        this.room = room;
        this.allocationDate = allocationDate;
        this.vacatingDate = vacatingDate;
        this.status = status;
    }

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

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public LocalDate getAllocationDate() {
        return allocationDate;
    }

    public void setAllocationDate(LocalDate allocationDate) {
        this.allocationDate = allocationDate;
    }

    public LocalDate getVacatingDate() {
        return vacatingDate;
    }

    public void setVacatingDate(LocalDate vacatingDate) {
        this.vacatingDate = vacatingDate;
    }

    public AllocationStatus getStatus() {
        return status;
    }

    public void setStatus(AllocationStatus status) {
        this.status = status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RoomAllocation that = (RoomAllocation) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
