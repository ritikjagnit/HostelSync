package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.AllocationStatus;
import com.hostelsync.backend.entity.Room;
import com.hostelsync.backend.entity.RoomAllocation;
import com.hostelsync.backend.entity.Student;
import com.hostelsync.backend.entity.User;
import com.hostelsync.backend.exception.ResourceNotFoundException;
import com.hostelsync.backend.repository.RoomAllocationRepository;
import com.hostelsync.backend.repository.StudentRepository;
import com.hostelsync.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service orchestrating self-service portal operations for authenticated student residents.
 * Enforces server-side data ownership based strictly on authenticated user credentials.
 */
@Service
@Transactional(readOnly = true)
public class StudentPortalService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final RoomAllocationRepository roomAllocationRepository;

    public StudentPortalService(
            UserRepository userRepository,
            StudentRepository studentRepository,
            RoomAllocationRepository roomAllocationRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.roomAllocationRepository = roomAllocationRepository;
    }

    /**
     * Resolves the authenticated student entity from their institutional email identity.
     */
    private Student resolveAuthenticatedStudent(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found for email: " + userEmail));

        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student admission profile not found for user: " + userEmail));
    }

    /**
     * Retrieves consolidated student dashboard metrics and current residential standing.
     */
    public StudentDashboardDto getStudentDashboard(String userEmail) {
        Student student = resolveAuthenticatedStudent(userEmail);
        StudentProfileResponseDto profileDto = mapToProfileDto(student);

        Optional<RoomAllocation> activeAllocationOpt =
                roomAllocationRepository.findByStudentIdAndStatus(student.getId(), AllocationStatus.ACTIVE);

        boolean roomAllocated = activeAllocationOpt.isPresent();
        StudentRoomDetailsDto currentRoomDto = activeAllocationOpt.map(this::mapToRoomDetailsDto).orElse(null);
        int totalAllocations = roomAllocationRepository.countByStudentId(student.getId());

        return new StudentDashboardDto(profileDto, roomAllocated, currentRoomDto, totalAllocations);
    }

    /**
     * Retrieves personal academic and contact profile details for the authenticated student.
     */
    public StudentProfileResponseDto getStudentProfile(String userEmail) {
        Student student = resolveAuthenticatedStudent(userEmail);
        return mapToProfileDto(student);
    }

    /**
     * Safely updates allowable contact details (phone number) for the authenticated student.
     * Prevents any modification of role, enrollment number, department, semester, or room assignments.
     */
    @Transactional
    public StudentProfileResponseDto updateStudentProfile(String userEmail, StudentProfileUpdateRequestDto dto) {
        Student student = resolveAuthenticatedStudent(userEmail);

        student.setPhone(dto.phone().trim());
        Student updated = studentRepository.save(student);

        return mapToProfileDto(updated);
    }

    /**
     * Retrieves the current active room allocation details with live capacity and occupancy metrics.
     * Returns null if no active allocation exists.
     */
    public StudentRoomDetailsDto getCurrentRoom(String userEmail) {
        Student student = resolveAuthenticatedStudent(userEmail);
        return roomAllocationRepository.findByStudentIdAndStatus(student.getId(), AllocationStatus.ACTIVE)
                .map(this::mapToRoomDetailsDto)
                .orElse(null);
    }

    /**
     * Retrieves the complete residential allocation history for the authenticated student,
     * ordered by latest allocation first.
     */
    public List<StudentAllocationHistoryDto> getAllocationHistory(String userEmail) {
        Student student = resolveAuthenticatedStudent(userEmail);
        List<RoomAllocation> allocations = roomAllocationRepository.findByStudentIdOrderByIdDesc(student.getId());

        return allocations.stream()
                .map(this::mapToHistoryDto)
                .toList();
    }

    // --- Internal Mapping Helpers ---

    private StudentProfileResponseDto mapToProfileDto(Student student) {
        User user = student.getUser();
        return new StudentProfileResponseDto(
                student.getId(),
                student.getEnrollmentNumber(),
                user.getFullName(),
                user.getEmail(),
                student.getCourse(),
                student.getSemester(),
                student.getPhone(),
                user.isActive(),
                user.getId(),
                user.getCreatedAt()
        );
    }

    private StudentRoomDetailsDto mapToRoomDetailsDto(RoomAllocation allocation) {
        Room room = allocation.getRoom();
        long currentOccupancy = roomAllocationRepository.countByRoomIdAndStatus(room.getId(), AllocationStatus.ACTIVE);
        long availableBeds = Math.max(0, room.getCapacity() - currentOccupancy);

        return new StudentRoomDetailsDto(
                allocation.getId(),
                room.getId(),
                room.getRoomNumber(),
                room.getFloor(),
                room.getCapacity(),
                currentOccupancy,
                availableBeds,
                room.getHostel().getId(),
                room.getHostel().getName(),
                room.getHostel().getHostelType().name(),
                room.getHostel().getAddress(),
                allocation.getAllocationDate(),
                allocation.getStatus()
        );
    }

    private StudentAllocationHistoryDto mapToHistoryDto(RoomAllocation allocation) {
        Room room = allocation.getRoom();
        return new StudentAllocationHistoryDto(
                allocation.getId(),
                room.getId(),
                room.getRoomNumber(),
                room.getFloor(),
                room.getCapacity(),
                room.getHostel().getId(),
                room.getHostel().getName(),
                room.getHostel().getHostelType().name(),
                room.getHostel().getAddress(),
                allocation.getAllocationDate(),
                allocation.getVacatingDate(),
                allocation.getStatus()
        );
    }
}
