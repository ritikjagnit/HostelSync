package com.hostelsync.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Objects;

/**
 * Hostel building entity representing distinct hostel premises (Boys / Girls).
 */
@Entity
@Table(name = "hostels")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Hostel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Hostel name is required")
    @Size(max = 100, message = "Hostel name cannot exceed 100 characters")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotNull(message = "Hostel type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "hostel_type", nullable = false, length = 20)
    private HostelType hostelType;

    @NotBlank(message = "Hostel address is required")
    @Size(max = 255, message = "Hostel address cannot exceed 255 characters")
    @Column(name = "address", nullable = false, length = 255)
    private String address;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Hostel() {
    }

    public Hostel(String name, HostelType hostelType, String address, boolean active) {
        this.name = name;
        this.hostelType = hostelType;
        this.address = address;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public HostelType getHostelType() {
        return hostelType;
    }

    public void setHostelType(HostelType hostelType) {
        this.hostelType = hostelType;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Hostel hostel = (Hostel) o;
        return Objects.equals(id, hostel.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
