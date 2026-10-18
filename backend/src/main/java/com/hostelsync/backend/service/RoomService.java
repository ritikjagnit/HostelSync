package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.RoomRequestDto;
import com.hostelsync.backend.dto.RoomResponseDto;
import com.hostelsync.backend.entity.AllocationStatus;
import com.hostelsync.backend.entity.Hostel;
import com.hostelsync.backend.entity.Room;
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
 * Service managing Room entities, uniqueness enforcement within hostels, capacity modifications, and occupancy calculations.
 */
@Service
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final HostelRepository hostelRepository;
    private final RoomAllocationRepository roomAllocationRepository;

    public RoomService(
            RoomRepository roomRepository,
            HostelRepository hostelRepository,
            RoomAllocationRepository roomAllocationRepository) {
        this.roomRepository = roomRepository;
        this.hostelRepository = hostelRepository;
        this.roomAllocationRepository = roomAllocationRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomResponseDto> getRoomsByHostelId(Long hostelId) {
        if (!hostelRepository.existsById(hostelId)) {
            throw new ResourceNotFoundException("Hostel not found with id: " + hostelId);
        }

        return roomRepository.findByHostelIdOrderByRoomNumberAsc(hostelId).stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomResponseDto getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + id));
        return mapToResponseDto(room);
    }

    public RoomResponseDto createRoom(Long hostelId, RoomRequestDto dto) {
        Hostel hostel = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel not found with id: " + hostelId));

        String trimmedRoomNumber = dto.roomNumber().trim();
        if (roomRepository.existsByHostelIdAndRoomNumber(hostelId, trimmedRoomNumber)) {
            throw new DuplicateResourceException(
                    "Room '" + trimmedRoomNumber + "' already exists in hostel '" + hostel.getName() + "'"
            );
        }

        Room room = new Room(trimmedRoomNumber, dto.floor(), dto.capacity(), hostel);
        Room saved = roomRepository.save(room);
        return mapToResponseDto(saved);
    }

    public RoomResponseDto updateRoom(Long roomId, RoomRequestDto dto) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + roomId));

        Hostel hostel = room.getHostel();
        String trimmedRoomNumber = dto.roomNumber().trim();

        if (roomRepository.existsByHostelIdAndRoomNumberAndIdNot(hostel.getId(), trimmedRoomNumber, roomId)) {
            throw new DuplicateResourceException(
                    "Room '" + trimmedRoomNumber + "' already exists in hostel '" + hostel.getName() + "'"
            );
        }

        // Validate that capacity cannot be reduced below current active resident allocations
        long activeAllocations = roomAllocationRepository.countByRoomIdAndStatus(roomId, AllocationStatus.ACTIVE);
        if (dto.capacity() < activeAllocations) {
            throw new InvalidOperationException(
                    "Cannot reduce room capacity to " + dto.capacity() + " because room '" + room.getRoomNumber() +
                            "' currently has " + activeAllocations + " active student allocations. Reduce or reassign occupants first."
            );
        }

        room.setRoomNumber(trimmedRoomNumber);
        room.setFloor(dto.floor());
        room.setCapacity(dto.capacity());

        Room updated = roomRepository.save(room);
        return mapToResponseDto(updated);
    }

    public RoomResponseDto mapToResponseDto(Room room) {
        long activeAllocations = roomAllocationRepository.countByRoomIdAndStatus(room.getId(), AllocationStatus.ACTIVE);
        int availableBeds = Math.max(0, room.getCapacity() - (int) activeAllocations);

        return new RoomResponseDto(
                room.getId(),
                room.getRoomNumber(),
                room.getFloor(),
                room.getCapacity(),
                room.getHostel().getId(),
                room.getHostel().getName(),
                activeAllocations,
                availableBeds
        );
    }
}
