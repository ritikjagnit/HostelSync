package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.exception.InvalidOperationException;
import com.hostelsync.backend.exception.ResourceNotFoundException;
import com.hostelsync.backend.repository.HostelRepository;
import com.hostelsync.backend.repository.RoomAllocationRepository;
import com.hostelsync.backend.repository.RoomRepository;
import com.hostelsync.backend.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Service managing student room assignments, checkout workflows, capacity validations, and allocation history.
 */
@Service
@Transactional
public class AllocationService {

    private final RoomAllocationRepository roomAllocationRepository;
    private final StudentRepository studentRepository;
    private final RoomRepository roomRepository;
    private final HostelRepository hostelRepository;

    public AllocationService(
            RoomAllocationRepository roomAllocationRepository,
            StudentRepository studentRepository,
            RoomRepository roomRepository,
            HostelRepository hostelRepository) {
        this.roomAllocationRepository = roomAllocationRepository;
        this.studentRepository = studentRepository;
        this.roomRepository = roomRepository;
        this.hostelRepository = hostelRepository;
    }

    @Transactional(readOnly = true)
    public List<AllocationResponseDto> getAllocations(
            AllocationStatus status, Long hostelId, Long roomId, String search) {
        String searchQuery = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<RoomAllocation> allocations = roomAllocationRepository.searchAllocations(status, hostelId, roomId, searchQuery);
        return allocations.stream().map(this::mapToResponseDto).toList();
    }

    @Transactional(readOnly = true)
    public AllocationResponseDto getAllocationById(Long id) {
        RoomAllocation allocation = roomAllocationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room allocation not found with id: " + id));
        return mapToResponseDto(allocation);
    }

    public AllocationResponseDto createAllocation(AllocationCreateRequestDto dto) {
        // 1. Retrieve room with pessimistic write lock to prevent concurrent over-allocation
        Room room = roomRepository.findByIdWithLock(dto.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + dto.roomId()));

        // 2. Validate hostel active status
        Hostel hostel = room.getHostel();
        if (!hostel.isActive()) {
            throw new InvalidOperationException("Cannot assign room: Hostel '" + hostel.getName() + "' is inactive");
        }

        // 3. Retrieve and validate student
        Student student = studentRepository.findById(dto.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + dto.studentId()));

        User user = student.getUser();
        if (!user.isActive()) {
            throw new InvalidOperationException("Cannot assign room: Student account is inactive");
        }

        // 4. Enforce that student does not already have an ACTIVE allocation
        if (roomAllocationRepository.existsByStudentIdAndStatus(student.getId(), AllocationStatus.ACTIVE)) {
            throw new InvalidOperationException("Student " + student.getEnrollmentNumber() +
                    " (" + user.getFullName() + ") already has an active room allocation");
        }

        // 5. Verify room has available bed capacity
        long currentOccupancy = roomAllocationRepository.countByRoomIdAndStatus(room.getId(), AllocationStatus.ACTIVE);
        if (currentOccupancy >= room.getCapacity()) {
            throw new InvalidOperationException("Room " + room.getRoomNumber() +
                    " in hostel '" + hostel.getName() + "' is at full capacity (" +
                    room.getCapacity() + " beds allocated)");
        }

        // 6. Establish allocation date
        LocalDate allocationDate = (dto.allocationDate() != null) ? dto.allocationDate() : LocalDate.now();

        // 7. Persist new allocation
        RoomAllocation allocation = new RoomAllocation(
                student,
                room,
                allocationDate,
                null,
                AllocationStatus.ACTIVE
        );

        RoomAllocation saved = roomAllocationRepository.save(allocation);
        return mapToResponseDto(saved);
    }

    public AllocationResponseDto checkoutAllocation(Long id, AllocationCheckoutRequestDto dto) {
        RoomAllocation allocation = roomAllocationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room allocation not found with id: " + id));

        if (allocation.getStatus() == AllocationStatus.COMPLETED) {
            throw new InvalidOperationException("Allocation is already completed/checked out on " +
                    allocation.getVacatingDate());
        }

        if (allocation.getStatus() != AllocationStatus.ACTIVE) {
            throw new InvalidOperationException("Only active allocations can be checked out");
        }

        LocalDate vacatingDate = (dto != null && dto.vacatingDate() != null) ? dto.vacatingDate() : LocalDate.now();

        if (vacatingDate.isBefore(allocation.getAllocationDate())) {
            throw new IllegalArgumentException("Vacating date (" + vacatingDate +
                    ") cannot be before allocation date (" + allocation.getAllocationDate() + ")");
        }

        allocation.setStatus(AllocationStatus.COMPLETED);
        allocation.setVacatingDate(vacatingDate);

        RoomAllocation updated = roomAllocationRepository.save(allocation);
        return mapToResponseDto(updated);
    }

    @Transactional(readOnly = true)
    public List<AvailableStudentDto> getAvailableStudents() {
        return studentRepository.findAvailableStudentsForAllocation().stream()
                .map(s -> new AvailableStudentDto(
                        s.getId(),
                        s.getEnrollmentNumber(),
                        s.getUser().getFullName(),
                        s.getUser().getEmail(),
                        s.getCourse(),
                        s.getSemester(),
                        s.getPhone()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomResponseDto> getAvailableRooms(Long hostelId, boolean includeFull) {
        Hostel hostel = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel not found with id: " + hostelId));

        if (!hostel.isActive()) {
            throw new InvalidOperationException("Hostel '" + hostel.getName() + "' is currently inactive");
        }

        List<Room> rooms = roomRepository.findByHostelIdOrderByRoomNumberAsc(hostelId);

        return rooms.stream()
                .map(room -> {
                    long activeOccupancy = roomAllocationRepository.countByRoomIdAndStatus(room.getId(), AllocationStatus.ACTIVE);
                    int availableBeds = Math.max(0, room.getCapacity() - (int) activeOccupancy);
                    return new RoomResponseDto(
                            room.getId(),
                            room.getRoomNumber(),
                            room.getFloor(),
                            room.getCapacity(),
                            hostel.getId(),
                            hostel.getName(),
                            activeOccupancy,
                            availableBeds
                    );
                })
                .filter(roomDto -> includeFull || roomDto.availableBeds() > 0)
                .toList();
    }

    private AllocationResponseDto mapToResponseDto(RoomAllocation allocation) {
        Student student = allocation.getStudent();
        User user = student.getUser();
        Room room = allocation.getRoom();
        Hostel hostel = room.getHostel();

        return new AllocationResponseDto(
                allocation.getId(),
                student.getId(),
                user.getFullName(),
                student.getEnrollmentNumber(),
                user.getEmail(),
                student.getCourse(),
                student.getSemester(),
                student.getPhone(),
                room.getId(),
                room.getRoomNumber(),
                room.getFloor(),
                room.getCapacity(),
                hostel.getId(),
                hostel.getName(),
                hostel.getHostelType().name(),
                allocation.getAllocationDate(),
                allocation.getVacatingDate(),
                allocation.getStatus()
        );
    }
}
