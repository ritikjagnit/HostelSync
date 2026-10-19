package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.HostelResponseDto;
import com.hostelsync.backend.dto.WardenAssignmentResponseDto;
import com.hostelsync.backend.dto.WardenSummaryDto;
import com.hostelsync.backend.entity.Hostel;
import com.hostelsync.backend.entity.Role;
import com.hostelsync.backend.entity.User;
import com.hostelsync.backend.entity.WardenHostelAssignment;
import com.hostelsync.backend.exception.DuplicateResourceException;
import com.hostelsync.backend.exception.InvalidOperationException;
import com.hostelsync.backend.exception.ResourceNotFoundException;
import com.hostelsync.backend.repository.HostelRepository;
import com.hostelsync.backend.repository.UserRepository;
import com.hostelsync.backend.repository.WardenHostelAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Administrative service for creating, managing, and revoking Warden-to-Hostel assignments.
 * Access is strictly restricted to ADMIN role.
 */
@Service
@Transactional
public class WardenAssignmentService {

    private final UserRepository userRepository;
    private final HostelRepository hostelRepository;
    private final WardenHostelAssignmentRepository assignmentRepository;
    private final HostelService hostelService;

    public WardenAssignmentService(
            UserRepository userRepository,
            HostelRepository hostelRepository,
            WardenHostelAssignmentRepository assignmentRepository,
            HostelService hostelService) {
        this.userRepository = userRepository;
        this.hostelRepository = hostelRepository;
        this.assignmentRepository = assignmentRepository;
        this.hostelService = hostelService;
    }

    /**
     * Lists all WARDEN users with their currently assigned hostels.
     */
    @Transactional(readOnly = true)
    public List<WardenSummaryDto> getAllWardensWithAssignments() {
        List<User> wardens = userRepository.findByRole(Role.WARDEN);
        return wardens.stream().map(warden -> {
            List<Hostel> assignedHostels = assignmentRepository.findAssignedHostelsByWardenId(warden.getId());
            List<HostelResponseDto> hostelDtos = assignedHostels.stream()
                    .map(hostelService::mapToResponseDto)
                    .toList();
            return new WardenSummaryDto(
                    warden.getId(),
                    warden.getFullName(),
                    warden.getEmail(),
                    warden.isActive(),
                    warden.getCreatedAt(),
                    hostelDtos
            );
        }).toList();
    }

    /**
     * Returns assignments for a single warden.
     */
    @Transactional(readOnly = true)
    public List<WardenAssignmentResponseDto> getAssignmentsForWarden(Long wardenId) {
        User warden = userRepository.findById(wardenId)
                .orElseThrow(() -> new ResourceNotFoundException("Warden not found with ID: " + wardenId));

        if (warden.getRole() != Role.WARDEN) {
            throw new InvalidOperationException("User with ID " + wardenId + " is not a WARDEN (role is " + warden.getRole() + ")");
        }

        List<WardenHostelAssignment> assignments = assignmentRepository.findByWardenId(wardenId);
        return assignments.stream()
                .map(this::mapToAssignmentResponseDto)
                .toList();
    }

    /**
     * Assigns a hostel to a warden.
     */
    public WardenAssignmentResponseDto assignHostelToWarden(Long wardenId, Long hostelId) {
        User warden = userRepository.findById(wardenId)
                .orElseThrow(() -> new ResourceNotFoundException("Warden not found with ID: " + wardenId));

        if (warden.getRole() != Role.WARDEN) {
            throw new InvalidOperationException("Cannot assign hostel: User " + warden.getEmail() + " is not a WARDEN (role is " + warden.getRole() + ")");
        }

        if (!warden.isActive()) {
            throw new InvalidOperationException("Cannot assign hostel: Warden account " + warden.getEmail() + " is inactive");
        }

        Hostel hostel = hostelRepository.findById(hostelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel not found with ID: " + hostelId));

        if (assignmentRepository.existsByWardenIdAndHostelId(wardenId, hostelId)) {
            throw new DuplicateResourceException("Warden '" + warden.getFullName() + "' is already assigned to hostel '" + hostel.getName() + "'");
        }

        WardenHostelAssignment assignment = new WardenHostelAssignment(warden, hostel);
        WardenHostelAssignment saved = assignmentRepository.save(assignment);
        return mapToAssignmentResponseDto(saved);
    }

    /**
     * Revokes a specific assignment by wardenId and hostelId.
     */
    public void revokeAssignment(Long wardenId, Long hostelId) {
        WardenHostelAssignment assignment = assignmentRepository.findByWardenIdAndHostelId(wardenId, hostelId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Assignment not found between Warden ID " + wardenId + " and Hostel ID " + hostelId));
        assignmentRepository.delete(assignment);
    }

    /**
     * Revokes an assignment by its primary key ID.
     */
    public void revokeAssignmentById(Long assignmentId) {
        WardenHostelAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Warden hostel assignment not found with ID: " + assignmentId));
        assignmentRepository.delete(assignment);
    }

    private WardenAssignmentResponseDto mapToAssignmentResponseDto(WardenHostelAssignment assignment) {
        return new WardenAssignmentResponseDto(
                assignment.getId(),
                assignment.getWarden().getId(),
                assignment.getWarden().getFullName(),
                assignment.getWarden().getEmail(),
                assignment.getHostel().getId(),
                assignment.getHostel().getName(),
                assignment.getHostel().getHostelType(),
                assignment.getAssignedAt()
        );
    }
}
