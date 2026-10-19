package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.exception.ResourceNotFoundException;
import com.hostelsync.backend.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Service orchestrating Warden hostel operations and scoped metrics.
 * Strictly enforces hostel-level authorization on all operations.
 */
@Service
@Transactional(readOnly = true)
public class WardenOperationsService {

    private final UserRepository userRepository;
    private final HostelRepository hostelRepository;
    private final RoomRepository roomRepository;
    private final RoomAllocationRepository roomAllocationRepository;
    private final WardenHostelAssignmentRepository assignmentRepository;

    public WardenOperationsService(
            UserRepository userRepository,
            HostelRepository hostelRepository,
            RoomRepository roomRepository,
            RoomAllocationRepository roomAllocationRepository,
            WardenHostelAssignmentRepository assignmentRepository) {
        this.userRepository = userRepository;
        this.hostelRepository = hostelRepository;
        this.roomRepository = roomRepository;
        this.roomAllocationRepository = roomAllocationRepository;
        this.assignmentRepository = assignmentRepository;
    }

    /**
     * Resolves the authenticated warden user from email.
     */
    public User getWardenUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Warden user account not found for email: " + email));
    }

    /**
     * Retrieves IDs of all hostels assigned to this warden.
     */
    public List<Long> getAssignedHostelIds(String email) {
        return assignmentRepository.findAssignedHostelIdsByWardenEmail(email);
    }

    /**
     * Enforces that the authenticated warden is assigned to the specified hostel.
     */
    public void assertHostelAccess(String email, Long hostelId) {
        if (!assignmentRepository.existsByWardenEmailAndHostelId(email, hostelId)) {
            throw new AccessDeniedException("Access denied: You are not authorized to access hostel with ID: " + hostelId);
        }
    }

    /**
     * Enforces that the requested room belongs to an assigned hostel.
     */
    public Room assertRoomAccess(String email, Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + roomId));
        assertHostelAccess(email, room.getHostel().getId());
        return room;
    }

    /**
     * Enforces that the requested allocation belongs to an assigned hostel.
     */
    public RoomAllocation assertAllocationAccess(String email, Long allocationId) {
        RoomAllocation allocation = roomAllocationRepository.findById(allocationId)
                .orElseThrow(() -> new ResourceNotFoundException("Room allocation record not found with ID: " + allocationId));
        assertHostelAccess(email, allocation.getRoom().getHostel().getId());
        return allocation;
    }

    /**
     * Computes dashboard statistics for the authenticated warden across all assigned hostels.
     */
    public WardenDashboardDto getDashboard(String wardenEmail) {
        User warden = getWardenUser(wardenEmail);
        List<Hostel> assignedHostels = assignmentRepository.findAssignedHostelsByWardenEmail(wardenEmail);

        if (assignedHostels.isEmpty()) {
            return new WardenDashboardDto(
                    warden.getId(),
                    warden.getFullName(),
                    warden.getEmail(),
                    0, 0, 0, 0, 0, 0.0,
                    Collections.emptyList(),
                    Collections.emptyList()
            );
        }

        List<Long> hostelIds = assignedHostels.stream().map(Hostel::getId).toList();
        List<WardenHostelSummaryDto> hostelSummaries = assignedHostels.stream()
                .map(this::mapToHostelSummaryDto)
                .toList();

        int totalRooms = (int) roomRepository.countByHostelIdIn(hostelIds);
        int totalCapacity = roomRepository.sumCapacityByHostelIdIn(hostelIds);
        int totalOccupiedBeds = (int) roomAllocationRepository.countByRoomHostelIdInAndStatus(hostelIds, AllocationStatus.ACTIVE);
        int totalAvailableBeds = Math.max(0, totalCapacity - totalOccupiedBeds);

        double occupancyRate = 0.0;
        if (totalCapacity > 0) {
            occupancyRate = BigDecimal.valueOf((double) totalOccupiedBeds / totalCapacity * 100.0)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        List<RoomAllocation> recentAllocations = roomAllocationRepository.searchWardenAllocations(
                hostelIds, null, null, null, null
        );

        List<WardenAllocationSummaryDto> recentAllocationDtos = recentAllocations.stream()
                .limit(10)
                .map(this::mapToAllocationSummaryDto)
                .toList();

        return new WardenDashboardDto(
                warden.getId(),
                warden.getFullName(),
                warden.getEmail(),
                assignedHostels.size(),
                totalRooms,
                totalCapacity,
                totalOccupiedBeds,
                totalAvailableBeds,
                occupancyRate,
                hostelSummaries,
                recentAllocationDtos
        );
    }

    /**
     * Returns assigned hostels with live room and bed counts.
     */
    public List<WardenHostelSummaryDto> getAssignedHostels(String wardenEmail) {
        List<Hostel> assignedHostels = assignmentRepository.findAssignedHostelsByWardenEmail(wardenEmail);
        return assignedHostels.stream()
                .map(this::mapToHostelSummaryDto)
                .toList();
    }

    /**
     * Returns details for a single assigned hostel.
     */
    public WardenHostelSummaryDto getAssignedHostelById(String wardenEmail, Long hostelId) {
        assertHostelAccess(wardenEmail, hostelId);
        Hostel hostel = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel not found with ID: " + hostelId));
        return mapToHostelSummaryDto(hostel);
    }

    /**
     * Lists room inventories and occupants for an assigned hostel.
     */
    public List<WardenRoomInventoryDto> getRoomsForHostel(String wardenEmail, Long hostelId) {
        assertHostelAccess(wardenEmail, hostelId);
        List<Room> rooms = roomRepository.findByHostelIdOrderByRoomNumberAsc(hostelId);
        return rooms.stream()
                .map(this::mapToRoomInventoryDto)
                .toList();
    }

    /**
     * Returns room details and occupants for a single room in an assigned hostel.
     */
    public WardenRoomInventoryDto getRoomDetails(String wardenEmail, Long roomId) {
        Room room = assertRoomAccess(wardenEmail, roomId);
        return mapToRoomInventoryDto(room);
    }

    /**
     * Lists all students currently residing in assigned hostels with optional filtering and search.
     */
    public List<WardenResidentSummaryDto> getResidents(String wardenEmail, Long hostelId, String search) {
        List<Long> assignedHostelIds;
        if (hostelId != null) {
            assertHostelAccess(wardenEmail, hostelId);
            assignedHostelIds = List.of(hostelId);
        } else {
            assignedHostelIds = getAssignedHostelIds(wardenEmail);
            if (assignedHostelIds.isEmpty()) {
                return Collections.emptyList();
            }
        }

        String query = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<RoomAllocation> activeAllocations = roomAllocationRepository.findActiveResidentsForHostelIds(
                assignedHostelIds, hostelId, query
        );

        return activeAllocations.stream()
                .map(this::mapToResidentSummaryDto)
                .toList();
    }

    /**
     * Lists allocation history across assigned hostels with status and search filtering.
     */
    public List<WardenAllocationSummaryDto> getAllocations(
            String wardenEmail, Long hostelId, AllocationStatus status, String search) {
        List<Long> assignedHostelIds;
        if (hostelId != null) {
            assertHostelAccess(wardenEmail, hostelId);
            assignedHostelIds = List.of(hostelId);
        } else {
            assignedHostelIds = getAssignedHostelIds(wardenEmail);
            if (assignedHostelIds.isEmpty()) {
                return Collections.emptyList();
            }
        }

        String query = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<RoomAllocation> allocations = roomAllocationRepository.searchWardenAllocations(
                assignedHostelIds, status, hostelId, null, query
        );

        return allocations.stream()
                .map(this::mapToAllocationSummaryDto)
                .toList();
    }

    /**
     * Returns single allocation details after verifying authorization.
     */
    public WardenAllocationSummaryDto getAllocationById(String wardenEmail, Long allocationId) {
        RoomAllocation allocation = assertAllocationAccess(wardenEmail, allocationId);
        return mapToAllocationSummaryDto(allocation);
    }

    private WardenHostelSummaryDto mapToHostelSummaryDto(Hostel hostel) {
        int totalRooms = (int) roomRepository.countByHostelId(hostel.getId());
        int totalCapacity = roomRepository.sumCapacityByHostelId(hostel.getId());
        int occupiedBeds = (int) roomAllocationRepository.countByHostelIdAndStatus(hostel.getId(), AllocationStatus.ACTIVE);
        int availableBeds = Math.max(0, totalCapacity - occupiedBeds);

        return new WardenHostelSummaryDto(
                hostel.getId(),
                hostel.getName(),
                hostel.getHostelType(),
                hostel.getAddress(),
                hostel.isActive(),
                totalRooms,
                totalCapacity,
                occupiedBeds,
                availableBeds
        );
    }

    private WardenRoomInventoryDto mapToRoomInventoryDto(Room room) {
        List<RoomAllocation> allocations = roomAllocationRepository.findByRoomId(room.getId());
        List<WardenResidentSummaryDto> occupants = allocations.stream()
                .filter(a -> a.getStatus() == AllocationStatus.ACTIVE)
                .map(this::mapToResidentSummaryDto)
                .toList();

        int currentOccupancy = occupants.size();
        int availableBeds = Math.max(0, room.getCapacity() - currentOccupancy);

        return new WardenRoomInventoryDto(
                room.getId(),
                room.getRoomNumber(),
                room.getFloor(),
                room.getCapacity(),
                currentOccupancy,
                availableBeds,
                room.getHostel().getId(),
                room.getHostel().getName(),
                occupants
        );
    }

    private WardenResidentSummaryDto mapToResidentSummaryDto(RoomAllocation allocation) {
        Student student = allocation.getStudent();
        Room room = allocation.getRoom();
        Hostel hostel = room.getHostel();

        return new WardenResidentSummaryDto(
                student.getId(),
                student.getEnrollmentNumber(),
                student.getUser().getFullName(),
                student.getUser().getEmail(),
                student.getCourse(),
                student.getSemester(),
                student.getPhone(),
                allocation.getId(),
                allocation.getAllocationDate(),
                room.getId(),
                room.getRoomNumber(),
                hostel.getId(),
                hostel.getName()
        );
    }

    private WardenAllocationSummaryDto mapToAllocationSummaryDto(RoomAllocation allocation) {
        Student student = allocation.getStudent();
        Room room = allocation.getRoom();
        Hostel hostel = room.getHostel();

        return new WardenAllocationSummaryDto(
                allocation.getId(),
                student.getId(),
                student.getUser().getFullName(),
                student.getEnrollmentNumber(),
                student.getCourse(),
                student.getSemester(),
                student.getPhone(),
                room.getId(),
                room.getRoomNumber(),
                hostel.getId(),
                hostel.getName(),
                allocation.getAllocationDate(),
                allocation.getVacatingDate(),
                allocation.getStatus()
        );
    }
}
