package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.exception.DuplicateResourceException;
import com.hostelsync.backend.exception.InvalidOperationException;
import com.hostelsync.backend.exception.ResourceNotFoundException;
import com.hostelsync.backend.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

/**
 * Service managing student hostel registration, merit evaluation, selection, and admission allocation.
 */
@Service
@Transactional
public class HostelApplicationService {

    private final HostelApplicationRepository applicationRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomAllocationRepository roomAllocationRepository;
    private final PasswordEncoder passwordEncoder;

    public HostelApplicationService(
            HostelApplicationRepository applicationRepository,
            StudentRepository studentRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            RoomAllocationRepository roomAllocationRepository,
            PasswordEncoder passwordEncoder) {
        this.applicationRepository = applicationRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.roomAllocationRepository = roomAllocationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Public registration: prospective student submits an application for hostel admission.
     */
    public HostelApplicationResponseDto apply(HostelApplicationApplyDto dto) {
        String enrollment = dto.enrollmentNumber().trim().toUpperCase();
        String email = dto.email().trim().toLowerCase();

        // Prevent duplicate applications in PENDING, SELECTED, or ADMITTED status
        List<ApplicationStatus> activeStatuses = List.of(ApplicationStatus.PENDING, ApplicationStatus.SELECTED, ApplicationStatus.ADMITTED);
        if (applicationRepository.existsByEnrollmentNumberAndStatusIn(enrollment, activeStatuses)) {
            throw new DuplicateResourceException("An active hostel application already exists for enrollment number: " + enrollment);
        }

        if (applicationRepository.existsByEmailAndStatusIn(email, activeStatuses)) {
            throw new DuplicateResourceException("An active hostel application already exists for email: " + email);
        }

        // Generate a clean official application reference number: HSA-2026-XXXX
        String appNumber = generateUniqueApplicationNumber();

        String normalizedGender = dto.gender().trim().toUpperCase();

        HostelApplication application = new HostelApplication(
                appNumber,
                dto.fullName().trim(),
                email,
                dto.phone().trim(),
                enrollment,
                dto.course().trim(),
                dto.semester(),
                normalizedGender,
                dto.category().trim().toUpperCase(),
                dto.meritPercentage(),
                dto.parentName().trim(),
                dto.parentPhone().trim(),
                dto.homeAddress().trim(),
                dto.distanceFromCollege(),
                dto.remarks() != null ? dto.remarks().trim() : null
        );

        HostelApplication saved = applicationRepository.save(application);
        return mapToResponseDto(saved);
    }

    /**
     * Public application status tracking by application number or enrollment number.
     */
    @Transactional(readOnly = true)
    public AdmissionPublicStatusDto getPublicStatus(String query) {
        if (!StringUtils.hasText(query)) {
            throw new ResourceNotFoundException("Application or enrollment number must be provided");
        }
        String cleanQuery = query.trim();

        HostelApplication application = applicationRepository.findByApplicationNumber(cleanQuery)
                .or(() -> applicationRepository.findByEnrollmentNumber(cleanQuery.toUpperCase()))
                .or(() -> applicationRepository.findByEmail(cleanQuery.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("No application found with identifier: " + cleanQuery));

        return new AdmissionPublicStatusDto(
                application.getApplicationNumber(),
                application.getFullName(),
                application.getEnrollmentNumber(),
                application.getCourse(),
                application.getSemester(),
                application.getGender(),
                application.getCategory(),
                application.getMeritPercentage(),
                application.getStatus(),
                application.getRejectionReason(),
                application.getAllocatedHostel() != null ? application.getAllocatedHostel().getName() : null,
                application.getAllocatedRoom() != null ? application.getAllocatedRoom().getRoomNumber() : null,
                application.getAppliedAt(),
                application.getReviewedAt()
        );
    }

    /**
     * Administrative & Warden: list applications with multi-criteria filtering and merit ranking.
     */
    @Transactional(readOnly = true)
    public List<HostelApplicationResponseDto> getApplications(
            ApplicationStatus status, String gender, String course, String search) {
        String cleanGender = StringUtils.hasText(gender) && !"ALL".equalsIgnoreCase(gender) ? gender.trim() : null;
        String cleanCourse = StringUtils.hasText(course) && !"ALL".equalsIgnoreCase(course) ? course.trim() : null;
        String cleanSearch = StringUtils.hasText(search) ? search.trim() : null;

        List<HostelApplication> list = applicationRepository.searchApplications(status, cleanGender, cleanCourse, cleanSearch);
        return list.stream().map(this::mapToResponseDto).toList();
    }

    /**
     * Administrative & Warden: get single application details.
     */
    @Transactional(readOnly = true)
    public HostelApplicationResponseDto getApplicationById(Long id) {
        HostelApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));
        return mapToResponseDto(app);
    }

    /**
     * Hostel In-Charge / Administrator updates review status (SELECTED or REJECTED).
     */
    public HostelApplicationResponseDto updateStatus(
            Long id, HostelApplicationStatusUpdateDto dto, String reviewerUsername) {
        HostelApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));

        if (app.getStatus() == ApplicationStatus.ADMITTED) {
            throw new InvalidOperationException("Cannot alter status: applicant is already admitted to hostel room");
        }

        app.setStatus(dto.status());
        if (dto.status() == ApplicationStatus.REJECTED) {
            app.setRejectionReason(StringUtils.hasText(dto.rejectionReason()) ? dto.rejectionReason().trim() : "Not selected on merit criteria");
        } else {
            app.setRejectionReason(null);
        }

        if (StringUtils.hasText(dto.remarks())) {
            app.setRemarks(dto.remarks().trim());
        }

        app.setReviewedBy(reviewerUsername);
        app.setReviewedAt(LocalDateTime.now());

        HostelApplication updated = applicationRepository.save(app);
        return mapToResponseDto(updated);
    }

    /**
     * Official Admission: assigns a room, initializes student credentials if needed,
     * and records the active room allocation.
     */
    public HostelApplicationResponseDto admitStudent(
            Long id, HostelApplicationAdmitDto dto, String reviewerUsername) {
        HostelApplication app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));

        if (app.getStatus() == ApplicationStatus.ADMITTED) {
            throw new InvalidOperationException("Applicant is already admitted to room " +
                    (app.getAllocatedRoom() != null ? app.getAllocatedRoom().getRoomNumber() : ""));
        }

        // 1. Lock and validate room
        Room room = roomRepository.findByIdWithLock(dto.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with id: " + dto.roomId()));

        Hostel hostel = room.getHostel();
        if (!hostel.isActive()) {
            throw new InvalidOperationException("Cannot admit student: Hostel '" + hostel.getName() + "' is inactive");
        }

        // 2. Validate gender compatibility
        if (hostel.getHostelType() == HostelType.BOYS && !"MALE".equalsIgnoreCase(app.getGender())) {
            throw new InvalidOperationException("Cannot assign room in Boys Hostel (" + hostel.getName() + ") to a female applicant");
        }
        if (hostel.getHostelType() == HostelType.GIRLS && !"FEMALE".equalsIgnoreCase(app.getGender())) {
            throw new InvalidOperationException("Cannot assign room in Girls Hostel (" + hostel.getName() + ") to a male applicant");
        }

        // 3. Verify room has capacity
        long currentOccupancy = roomAllocationRepository.countByRoomIdAndStatus(room.getId(), AllocationStatus.ACTIVE);
        if (currentOccupancy >= room.getCapacity()) {
            throw new InvalidOperationException("Room " + room.getRoomNumber() +
                    " in hostel '" + hostel.getName() + "' is at full capacity (" +
                    room.getCapacity() + " beds allocated)");
        }

        // 4. Find or create Student record
        String enrollment = app.getEnrollmentNumber().trim().toUpperCase();
        String email = app.getEmail().trim().toLowerCase();

        Student student = studentRepository.findByEnrollmentNumber(enrollment)
                .orElseGet(() -> {
                    // Check if User account with this email exists
                    User user = userRepository.findByEmail(email).orElseGet(() -> {
                        String rawPassword = StringUtils.hasText(dto.defaultPassword())
                                ? dto.defaultPassword().trim()
                                : "StudentPass123!";
                        User newUser = new User(
                                app.getFullName().trim(),
                                email,
                                passwordEncoder.encode(rawPassword),
                                Role.STUDENT,
                                true
                        );
                        return userRepository.save(newUser);
                    });

                    // Ensure user is active
                    if (!user.isActive()) {
                        user.setActive(true);
                        userRepository.save(user);
                    }

                    Student newStudent = new Student(
                            enrollment,
                            app.getCourse().trim(),
                            app.getSemester(),
                            app.getPhone().trim(),
                            user
                    );
                    return studentRepository.save(newStudent);
                });

        // 5. Ensure student does not already have an active room allocation
        if (roomAllocationRepository.existsByStudentIdAndStatus(student.getId(), AllocationStatus.ACTIVE)) {
            throw new InvalidOperationException("Student " + student.getEnrollmentNumber() +
                    " already has an active room allocation");
        }

        // 6. Create Room Allocation
        LocalDate allocDate = (dto.allocationDate() != null) ? dto.allocationDate() : LocalDate.now();
        RoomAllocation allocation = new RoomAllocation(
                student,
                room,
                allocDate,
                null,
                AllocationStatus.ACTIVE
        );
        roomAllocationRepository.save(allocation);

        // 7. Update Application
        app.setStatus(ApplicationStatus.ADMITTED);
        app.setAllocatedHostel(hostel);
        app.setAllocatedRoom(room);
        app.setStudent(student);
        app.setReviewedBy(reviewerUsername);
        app.setReviewedAt(LocalDateTime.now());

        HostelApplication saved = applicationRepository.save(app);
        return mapToResponseDto(saved);
    }

    /**
     * Metric statistics for Admissions dashboard.
     */
    @Transactional(readOnly = true)
    public AdmissionStatsDto getAdmissionStats() {
        long total = applicationRepository.count();
        long pending = applicationRepository.countByStatus(ApplicationStatus.PENDING);
        long selected = applicationRepository.countByStatus(ApplicationStatus.SELECTED);
        long admitted = applicationRepository.countByStatus(ApplicationStatus.ADMITTED);
        long rejected = applicationRepository.countByStatus(ApplicationStatus.REJECTED);
        return new AdmissionStatsDto(total, pending, selected, admitted, rejected);
    }

    private String generateUniqueApplicationNumber() {
        Random random = new Random();
        for (int i = 0; i < 100; i++) {
            int code = 1000 + random.nextInt(9000);
            String candidate = "HSA-2026-" + code;
            if (applicationRepository.findByApplicationNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        return "HSA-2026-" + System.currentTimeMillis() % 100000;
    }

    public HostelApplicationResponseDto mapToResponseDto(HostelApplication app) {
        return new HostelApplicationResponseDto(
                app.getId(),
                app.getApplicationNumber(),
                app.getFullName(),
                app.getEmail(),
                app.getPhone(),
                app.getEnrollmentNumber(),
                app.getCourse(),
                app.getSemester(),
                app.getGender(),
                app.getCategory(),
                app.getMeritPercentage(),
                app.getParentName(),
                app.getParentPhone(),
                app.getHomeAddress(),
                app.getDistanceFromCollege(),
                app.getStatus(),
                app.getRejectionReason(),
                app.getRemarks(),
                app.getAllocatedHostel() != null ? app.getAllocatedHostel().getId() : null,
                app.getAllocatedHostel() != null ? app.getAllocatedHostel().getName() : null,
                app.getAllocatedRoom() != null ? app.getAllocatedRoom().getId() : null,
                app.getAllocatedRoom() != null ? app.getAllocatedRoom().getRoomNumber() : null,
                app.getStudent() != null ? app.getStudent().getId() : null,
                app.getAppliedAt(),
                app.getReviewedAt(),
                app.getReviewedBy()
        );
    }
}
