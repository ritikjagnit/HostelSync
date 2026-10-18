package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.AdminDashboardStatsDto;
import com.hostelsync.backend.dto.HostelRequestDto;
import com.hostelsync.backend.dto.HostelResponseDto;
import com.hostelsync.backend.entity.AllocationStatus;
import com.hostelsync.backend.entity.Hostel;
import com.hostelsync.backend.exception.DuplicateResourceException;
import com.hostelsync.backend.exception.InvalidOperationException;
import com.hostelsync.backend.exception.ResourceNotFoundException;
import com.hostelsync.backend.repository.HostelRepository;
import com.hostelsync.backend.repository.RoomAllocationRepository;
import com.hostelsync.backend.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing Hostel entities, capacity calculations, status updates, and administrative aggregates.
 */
@Service
@Transactional
public class HostelService {

    private final HostelRepository hostelRepository;
    private final RoomRepository roomRepository;
    private final RoomAllocationRepository roomAllocationRepository;

    public HostelService(
            HostelRepository hostelRepository,
            RoomRepository roomRepository,
            RoomAllocationRepository roomAllocationRepository) {
        this.hostelRepository = hostelRepository;
        this.roomRepository = roomRepository;
        this.roomAllocationRepository = roomAllocationRepository;
    }

    @Transactional(readOnly = true)
    public List<HostelResponseDto> getAllHostels() {
        return hostelRepository.findAll().stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public HostelResponseDto getHostelById(Long id) {
        Hostel hostel = hostelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel not found with id: " + id));
        return mapToResponseDto(hostel);
    }

    public HostelResponseDto createHostel(HostelRequestDto dto) {
        String trimmedName = dto.name().trim();
        if (hostelRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("A hostel with the name '" + trimmedName + "' already exists");
        }

        boolean active = dto.active() == null || dto.active();
        Hostel hostel = new Hostel(trimmedName, dto.hostelType(), dto.address().trim(), active);
        Hostel saved = hostelRepository.save(hostel);
        return mapToResponseDto(saved);
    }

    public HostelResponseDto updateHostel(Long id, HostelRequestDto dto) {
        Hostel hostel = hostelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel not found with id: " + id));

        String trimmedName = dto.name().trim();
        if (hostelRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new DuplicateResourceException("Another hostel with the name '" + trimmedName + "' already exists");
        }

        // Prevent deactivating if there are active resident allocations
        boolean requestedActive = dto.active() == null ? hostel.isActive() : dto.active();
        if (!requestedActive && hostel.isActive()) {
            validateNoActiveAllocations(hostel);
        }

        hostel.setName(trimmedName);
        hostel.setHostelType(dto.hostelType());
        hostel.setAddress(dto.address().trim());
        hostel.setActive(requestedActive);

        Hostel updated = hostelRepository.save(hostel);
        return mapToResponseDto(updated);
    }

    public HostelResponseDto updateHostelStatus(Long id, boolean active) {
        Hostel hostel = hostelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel not found with id: " + id));

        if (!active && hostel.isActive()) {
            validateNoActiveAllocations(hostel);
        }

        hostel.setActive(active);
        Hostel updated = hostelRepository.save(hostel);
        return mapToResponseDto(updated);
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsDto getDashboardStats() {
        long totalHostels = hostelRepository.count();
        long activeHostels = hostelRepository.countByActiveTrue();
        long totalRooms = roomRepository.count();
        long totalCapacity = roomRepository.sumTotalCapacity();
        long activeAllocations = roomAllocationRepository.countByStatus(AllocationStatus.ACTIVE);
        long availableBeds = Math.max(0, totalCapacity - activeAllocations);
        List<HostelResponseDto> hostels = getAllHostels();

        return new AdminDashboardStatsDto(
                totalHostels,
                activeHostels,
                totalRooms,
                totalCapacity,
                activeAllocations,
                availableBeds,
                hostels
        );
    }

    private void validateNoActiveAllocations(Hostel hostel) {
        if (roomAllocationRepository.existsByHostelIdAndStatus(hostel.getId(), AllocationStatus.ACTIVE)) {
            throw new InvalidOperationException(
                    "Cannot deactivate hostel '" + hostel.getName() + "' because it currently has active student room allocations. All residents must be vacated or reallocated first."
            );
        }
    }

    public HostelResponseDto mapToResponseDto(Hostel hostel) {
        int totalRooms = (int) roomRepository.countByHostelId(hostel.getId());
        int totalCapacity = roomRepository.sumCapacityByHostelId(hostel.getId());
        long activeAllocations = roomAllocationRepository.countByHostelIdAndStatus(hostel.getId(), AllocationStatus.ACTIVE);
        int availableBeds = Math.max(0, totalCapacity - (int) activeAllocations);

        return new HostelResponseDto(
                hostel.getId(),
                hostel.getName(),
                hostel.getHostelType(),
                hostel.getAddress(),
                hostel.isActive(),
                totalRooms,
                totalCapacity,
                activeAllocations,
                availableBeds
        );
    }
}
