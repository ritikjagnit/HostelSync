package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.ComplaintCreateDto;
import com.hostelsync.backend.dto.ComplaintResponseDto;
import com.hostelsync.backend.dto.ComplaintStatsDto;
import com.hostelsync.backend.dto.ComplaintStatusUpdateDto;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.Year;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Service for managing hostel maintenance grievances and tickets.
 */
@Service
@Transactional
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final StudentRepository studentRepository;
    private final RoomAllocationRepository roomAllocationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final WardenHostelAssignmentRepository wardenAssignmentRepository;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public ComplaintService(
            ComplaintRepository complaintRepository,
            StudentRepository studentRepository,
            RoomAllocationRepository roomAllocationRepository,
            RoomRepository roomRepository,
            UserRepository userRepository,
            WardenHostelAssignmentRepository wardenAssignmentRepository
    ) {
        this.complaintRepository = complaintRepository;
        this.studentRepository = studentRepository;
        this.roomAllocationRepository = roomAllocationRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.wardenAssignmentRepository = wardenAssignmentRepository;
    }

    public ComplaintResponseDto createComplaint(String studentEmail, ComplaintCreateDto dto) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new NoSuchElementException("Student profile not found for email: " + studentEmail));

        Room room = null;
        Hostel hostel = null;

        if (dto.roomId() != null) {
            room = roomRepository.findById(dto.roomId())
                    .orElseThrow(() -> new NoSuchElementException("Room not found with ID: " + dto.roomId()));
            hostel = room.getHostel();
        } else {
            // Find active allocation for this resident
            var activeAllocation = roomAllocationRepository.findByStudentIdAndStatus(student.getId(), AllocationStatus.ACTIVE);
            if (activeAllocation.isPresent()) {
                room = activeAllocation.get().getRoom();
                hostel = room.getHostel();
            } else {
                throw new IllegalArgumentException("An active room allocation or valid room ID is required to submit a maintenance complaint.");
            }
        }

        Complaint complaint = new Complaint();
        complaint.setTicketNumber(generateUniqueTicketNumber());
        complaint.setStudent(student);
        complaint.setHostel(hostel);
        complaint.setRoom(room);
        complaint.setTitle(dto.title().trim());
        complaint.setDescription(dto.description().trim());
        complaint.setCategory(dto.category());
        complaint.setUrgency(dto.urgency());
        complaint.setStatus(ComplaintStatus.PENDING);

        Complaint saved = complaintRepository.save(complaint);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponseDto> getStudentComplaints(String studentEmail) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new NoSuchElementException("Student profile not found for email: " + studentEmail));

        return complaintRepository.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ComplaintResponseDto getStudentComplaintById(String studentEmail, Long complaintId) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new NoSuchElementException("Student profile not found for email: " + studentEmail));

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new NoSuchElementException("Complaint not found with ID: " + complaintId));

        if (!complaint.getStudent().getId().equals(student.getId())) {
            throw new AccessDeniedException("You are not authorized to view this complaint ticket.");
        }

        return mapToDto(complaint);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponseDto> getWardenComplaints(String wardenEmail, ComplaintStatus status) {
        List<Long> assignedHostelIds = wardenAssignmentRepository.findAssignedHostelIdsByWardenEmail(wardenEmail);
        if (assignedHostelIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<Complaint> complaints = (status != null)
                ? complaintRepository.findByHostelIdInAndStatusOrderByCreatedAtDesc(assignedHostelIds, status)
                : complaintRepository.findByHostelIdInOrderByCreatedAtDesc(assignedHostelIds);

        return complaints.stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public ComplaintStatsDto getWardenComplaintStats(String wardenEmail) {
        List<Long> assignedHostelIds = wardenAssignmentRepository.findAssignedHostelIdsByWardenEmail(wardenEmail);
        if (assignedHostelIds.isEmpty()) {
            return new ComplaintStatsDto(0, 0, 0, 0, 0);
        }

        long total = complaintRepository.countByHostelIdIn(assignedHostelIds);
        long pending = complaintRepository.countByHostelIdInAndStatus(assignedHostelIds, ComplaintStatus.PENDING);
        long inProgress = complaintRepository.countByHostelIdInAndStatus(assignedHostelIds, ComplaintStatus.IN_PROGRESS);
        long resolved = complaintRepository.countByHostelIdInAndStatus(assignedHostelIds, ComplaintStatus.RESOLVED);
        long emergency = complaintRepository.countByHostelIdInAndUrgency(assignedHostelIds, ComplaintUrgency.EMERGENCY);

        return new ComplaintStatsDto(total, pending, inProgress, resolved, emergency);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponseDto> getAllComplaintsAdmin(Long hostelId, ComplaintStatus status) {
        List<Complaint> complaints;
        if (hostelId != null && status != null) {
            complaints = complaintRepository.findByHostelIdAndStatusOrderByCreatedAtDesc(hostelId, status);
        } else if (hostelId != null) {
            complaints = complaintRepository.findByHostelIdOrderByCreatedAtDesc(hostelId);
        } else if (status != null) {
            complaints = complaintRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            complaints = complaintRepository.findAllByOrderByCreatedAtDesc();
        }
        return complaints.stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public ComplaintStatsDto getAdminComplaintStats() {
        long total = complaintRepository.count();
        long pending = complaintRepository.countByStatus(ComplaintStatus.PENDING);
        long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
        long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
        long emergency = complaintRepository.countByUrgency(ComplaintUrgency.EMERGENCY);

        return new ComplaintStatsDto(total, pending, inProgress, resolved, emergency);
    }

    public ComplaintResponseDto updateComplaintStatus(String staffEmail, Long complaintId, ComplaintStatusUpdateDto dto) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new NoSuchElementException("Complaint not found with ID: " + complaintId));

        User staffUser = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new NoSuchElementException("Staff user not found for email: " + staffEmail));

        // If user is a WARDEN (and not ADMIN), enforce hostel assignment check
        if (staffUser.getRole() == Role.WARDEN) {
            boolean assigned = wardenAssignmentRepository.existsByWardenEmailAndHostelId(
                    staffEmail,
                    complaint.getHostel().getId()
            );
            if (!assigned) {
                throw new AccessDeniedException("You are not authorized to modify complaints for this hostel.");
            }
        }

        complaint.setStatus(dto.status());
        if (dto.resolutionNotes() != null) {
            complaint.setResolutionNotes(dto.resolutionNotes().trim());
        }

        if (dto.status() == ComplaintStatus.RESOLVED || dto.status() == ComplaintStatus.REJECTED) {
            complaint.setResolvedBy(staffUser);
            complaint.setResolvedAt(Instant.now());
        }

        Complaint saved = complaintRepository.save(complaint);
        return mapToDto(saved);
    }

    private String generateUniqueTicketNumber() {
        int currentYear = Year.now().getValue();
        for (int i = 0; i < 10; i++) {
            StringBuilder sb = new StringBuilder("CMP-").append(currentYear).append("-");
            for (int j = 0; j < 5; j++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            String candidate = sb.toString();
            if (complaintRepository.findByTicketNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        return "CMP-" + System.currentTimeMillis();
    }

    private ComplaintResponseDto mapToDto(Complaint c) {
        Student s = c.getStudent();
        User u = s != null ? s.getUser() : null;
        Room r = c.getRoom();
        Hostel h = c.getHostel();
        User resolver = c.getResolvedBy();

        return new ComplaintResponseDto(
                c.getId(),
                c.getTicketNumber(),
                c.getTitle(),
                c.getDescription(),
                c.getCategory(),
                c.getUrgency(),
                c.getStatus(),
                s != null ? s.getId() : null,
                u != null ? u.getFullName() : null,
                s != null ? s.getEnrollmentNumber() : null,
                s != null ? s.getPhone() : null,
                u != null ? u.getEmail() : null,
                h != null ? h.getId() : null,
                h != null ? h.getName() : null,
                r != null ? r.getId() : null,
                r != null ? r.getRoomNumber() : null,
                c.getResolutionNotes(),
                resolver != null ? resolver.getFullName() : null,
                c.getResolvedAt(),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }
}
