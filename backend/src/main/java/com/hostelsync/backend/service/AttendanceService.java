package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.exception.ResourceNotFoundException;
import com.hostelsync.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing hostel-residence roll call attendance, authorization scoping,
 * transactional bulk processing, and attendance analytics for Government Polytechnic Sakoli.
 */
@Service
@Transactional
public class AttendanceService {

    public static final ZoneId INSTITUTION_TIMEZONE = ZoneId.of("Asia/Kolkata");
    public static final int WARDEN_MAX_BACKDATE_DAYS = 7;

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final HostelRepository hostelRepository;
    private final RoomAllocationRepository roomAllocationRepository;
    private final WardenOperationsService wardenOperationsService;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            StudentRepository studentRepository,
            UserRepository userRepository,
            HostelRepository hostelRepository,
            RoomAllocationRepository roomAllocationRepository,
            WardenOperationsService wardenOperationsService) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.hostelRepository = hostelRepository;
        this.roomAllocationRepository = roomAllocationRepository;
        this.wardenOperationsService = wardenOperationsService;
    }

    /**
     * Institutional local date convention (Asia/Kolkata).
     */
    public LocalDate getToday() {
        return LocalDate.now(INSTITUTION_TIMEZONE);
    }

    /**
     * Validates that an attendance date complies with the institutional recording policy:
     * 1. Cannot be in the future.
     * 2. For Wardens, cannot be older than WARDEN_MAX_BACKDATE_DAYS (7 days).
     */
    public void assertValidWardenAttendanceDate(LocalDate attendanceDate) {
        if (attendanceDate == null) {
            throw new IllegalArgumentException("Attendance date is required");
        }
        LocalDate today = getToday();
        if (attendanceDate.isAfter(today)) {
            throw new IllegalArgumentException("Attendance date cannot be in the future. Selected: " + attendanceDate);
        }
        LocalDate earliestAllowed = today.minusDays(WARDEN_MAX_BACKDATE_DAYS);
        if (attendanceDate.isBefore(earliestAllowed)) {
            throw new IllegalArgumentException(
                    "Wardens may only record or update attendance for today or up to " +
                            WARDEN_MAX_BACKDATE_DAYS + " days in the past (" + earliestAllowed + " to " + today +
                            "). For older retrospective changes, please contact Administration."
            );
        }
    }

    // =========================================================================
    // WARDEN OPERATIONS
    // =========================================================================

    /**
     * Retrieves the roll-call roster of eligible active residents for a specific hostel and date.
     * Pre-populates existing attendance records if already taken.
     */
    @Transactional(readOnly = true)
    public List<WardenRollCallResidentDto> getWardenRollCall(String wardenEmail, Long hostelId, LocalDate date) {
        LocalDate targetDate = (date != null) ? date : getToday();
        assertValidWardenAttendanceDate(targetDate);
        wardenOperationsService.assertHostelAccess(wardenEmail, hostelId);

        // Fetch all active residents currently allocated to this hostel
        List<RoomAllocation> activeAllocations = roomAllocationRepository.findActiveResidentsForHostelIds(
                List.of(hostelId), hostelId, null);

        if (activeAllocations.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> studentIds = activeAllocations.stream()
                .map(a -> a.getStudent().getId())
                .toList();

        // Fetch any existing attendance records for these students on this target date
        List<Attendance> attendances = attendanceRepository.findByStudentIdInAndAttendanceDate(studentIds, targetDate);
        Map<Long, Attendance> attendanceMap = attendances.stream()
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a, (first, second) -> first));

        return activeAllocations.stream()
                .map(alloc -> WardenRollCallResidentDto.fromAllocationAndAttendance(
                        alloc, attendanceMap.get(alloc.getStudent().getId())))
                .sorted(Comparator.comparing(WardenRollCallResidentDto::roomNumber, Comparator.nullsLast(String::compareTo))
                        .thenComparing(WardenRollCallResidentDto::studentName))
                .toList();
    }

    /**
     * Submits bulk roll-call attendance for a hostel on a given date.
     * Performs transactional upsert (updates existing records or creates new ones).
     */
    public WardenBulkAttendanceResponseDto recordBulkAttendance(
            String wardenEmail, WardenAttendanceBulkRequestDto request) {
        assertValidWardenAttendanceDate(request.date());
        wardenOperationsService.assertHostelAccess(wardenEmail, request.hostelId());

        User warden = userRepository.findByEmail(wardenEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Warden user account not found for: " + wardenEmail));

        Hostel hostel = hostelRepository.findById(request.hostelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hostel not found with ID: " + request.hostelId()));

        int createdCount = 0;
        int updatedCount = 0;

        for (WardenAttendanceItemDto item : request.records()) {
            Student student = studentRepository.findById(item.studentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + item.studentId()));

            // Verify student has an ACTIVE room allocation in this exact hostel
            RoomAllocation activeAlloc = roomAllocationRepository.findByStudentIdAndStatus(student.getId(), AllocationStatus.ACTIVE)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Student [" + student.getUser().getFullName() + " - " + student.getEnrollmentNumber() +
                                    "] does not have an active room allocation in any hostel."
                    ));

            if (!activeAlloc.getRoom().getHostel().getId().equals(request.hostelId())) {
                throw new IllegalArgumentException(
                        "Student [" + student.getUser().getFullName() + " - " + student.getEnrollmentNumber() +
                                "] is allocated to [" + activeAlloc.getRoom().getHostel().getName() +
                                "], not to the requested hostel [" + hostel.getName() + "]."
                );
            }

            // Check if record already exists for this student on this date
            Optional<Attendance> existingOpt = attendanceRepository.findByStudentIdAndAttendanceDate(
                    student.getId(), request.date());

            String remarks = (item.remarks() != null && !item.remarks().isBlank()) ? item.remarks().trim() : null;

            if (existingOpt.isPresent()) {
                Attendance existing = existingOpt.get();
                existing.setStatus(item.status());
                existing.setRemarks(remarks);
                existing.setRecordedBy(warden);
                attendanceRepository.save(existing);
                updatedCount++;
            } else {
                Attendance newAttendance = new Attendance(student, request.date(), item.status(), warden, remarks);
                attendanceRepository.save(newAttendance);
                createdCount++;
            }
        }

        String msg = String.format("Attendance for %s successfully recorded (%d created, %d updated).",
                hostel.getName(), createdCount, updatedCount);

        return new WardenBulkAttendanceResponseDto(
                hostel.getId(),
                hostel.getName(),
                request.date(),
                request.records().size(),
                createdCount,
                updatedCount,
                msg
        );
    }

    /**
     * Updates an individual attendance record.
     */
    public AttendanceRecordDto updateAttendanceRecord(
            String wardenEmail, Long attendanceId, WardenAttendanceUpdateRequestDto request) {
        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with ID: " + attendanceId));

        assertValidWardenAttendanceDate(attendance.getAttendanceDate());

        // Validate that the student currently resides in a hostel assigned to this warden
        RoomAllocation activeAlloc = roomAllocationRepository.findByStudentIdAndStatus(
                attendance.getStudent().getId(), AllocationStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active allocation not found for student"));

        wardenOperationsService.assertHostelAccess(wardenEmail, activeAlloc.getRoom().getHostel().getId());

        User warden = userRepository.findByEmail(wardenEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Warden user account not found for: " + wardenEmail));

        attendance.setStatus(request.status());
        attendance.setRemarks(request.remarks() != null && !request.remarks().isBlank() ? request.remarks().trim() : null);
        attendance.setRecordedBy(warden);

        Attendance updated = attendanceRepository.save(attendance);
        return AttendanceRecordDto.fromEntity(updated, activeAlloc);
    }

    /**
     * Searches attendance history across hostels assigned to the authenticated warden.
     */
    @Transactional(readOnly = true)
    public List<AttendanceRecordDto> getWardenAttendanceHistory(
            String wardenEmail, Long hostelId, Long studentId,
            LocalDate from, LocalDate to, AttendanceStatus status, String search) {
        List<Long> assignedHostelIds = wardenOperationsService.getAssignedHostelIds(wardenEmail);
        if (assignedHostelIds.isEmpty()) {
            return Collections.emptyList();
        }

        if (hostelId != null) {
            wardenOperationsService.assertHostelAccess(wardenEmail, hostelId);
        }

        List<Attendance> results = attendanceRepository.searchWardenAttendanceHistory(
                assignedHostelIds, hostelId, studentId, status, from, to,
                (search != null && !search.isBlank()) ? search.trim() : null);

        // Map each to DTO with their allocation context
        return results.stream()
                .map(a -> {
                    RoomAllocation alloc = roomAllocationRepository.findByStudentIdAndStatus(
                            a.getStudent().getId(), AllocationStatus.ACTIVE).orElse(null);
                    return AttendanceRecordDto.fromEntity(a, alloc);
                })
                .toList();
    }

    // =========================================================================
    // ADMIN OPERATIONS
    // =========================================================================

    /**
     * Computes institutional attendance summary metrics across all hostels (or a selected hostel).
     */
    @Transactional(readOnly = true)
    public AttendanceSummaryDto getAdminAttendanceSummary(LocalDate date, Long hostelId) {
        LocalDate targetDate = (date != null) ? date : getToday();

        List<Hostel> targetHostels;
        if (hostelId != null) {
            Hostel singleHostel = hostelRepository.findById(hostelId)
                    .orElseThrow(() -> new ResourceNotFoundException("Hostel not found with ID: " + hostelId));
            targetHostels = List.of(singleHostel);
        } else {
            targetHostels = hostelRepository.findAll();
        }

        List<HostelAttendanceSummaryDto> breakdowns = new ArrayList<>();
        long totalResidents = 0;
        long totalMarked = 0;
        long totalPresent = 0;
        long totalAbsent = 0;
        long totalOnLeave = 0;

        for (Hostel h : targetHostels) {
            List<RoomAllocation> activeAllocations = roomAllocationRepository.findActiveResidentsForHostelIds(
                    List.of(h.getId()), h.getId(), null);
            long resCount = activeAllocations.size();
            totalResidents += resCount;

            if (resCount == 0) {
                breakdowns.add(new HostelAttendanceSummaryDto(
                        h.getId(), h.getName(), 0, 0, 0, 0, 0, 0, 0.0));
                continue;
            }

            List<Long> studentIds = activeAllocations.stream()
                    .map(a -> a.getStudent().getId())
                    .toList();

            List<Attendance> attendances = attendanceRepository.findByStudentIdInAndAttendanceDate(studentIds, targetDate);

            long hMarked = attendances.size();
            long hPresent = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
            long hAbsent = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
            long hOnLeave = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE).count();
            long hUnmarked = resCount - hMarked;

            double hRate = (hMarked > 0)
                    ? BigDecimal.valueOf((hPresent * 100.0) / hMarked)
                    .setScale(1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            breakdowns.add(new HostelAttendanceSummaryDto(
                    h.getId(), h.getName(), resCount, hMarked, hUnmarked, hPresent, hAbsent, hOnLeave, hRate));

            totalMarked += hMarked;
            totalPresent += hPresent;
            totalAbsent += hAbsent;
            totalOnLeave += hOnLeave;
        }

        long totalUnmarked = totalResidents - totalMarked;
        double overallRate = (totalMarked > 0)
                ? BigDecimal.valueOf((totalPresent * 100.0) / totalMarked)
                .setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        return new AttendanceSummaryDto(
                targetDate,
                totalResidents,
                totalMarked,
                totalUnmarked,
                totalPresent,
                totalAbsent,
                totalOnLeave,
                overallRate,
                breakdowns
        );
    }

    /**
     * Searches complete historical attendance records institution-wide for ADMIN.
     */
    @Transactional(readOnly = true)
    public List<AttendanceRecordDto> getAdminAttendanceHistory(
            Long hostelId, Long studentId, LocalDate from, LocalDate to, AttendanceStatus status, String search) {
        List<Attendance> results = attendanceRepository.searchAdminAttendanceHistory(
                hostelId, studentId, status, from, to,
                (search != null && !search.isBlank()) ? search.trim() : null);

        return results.stream()
                .map(a -> {
                    RoomAllocation alloc = roomAllocationRepository.findByStudentIdAndStatus(
                            a.getStudent().getId(), AllocationStatus.ACTIVE).orElse(null);
                    return AttendanceRecordDto.fromEntity(a, alloc);
                })
                .toList();
    }

    // =========================================================================
    // STUDENT OPERATIONS
    // =========================================================================

    /**
     * Retrieves personal attendance history for the authenticated student.
     */
    @Transactional(readOnly = true)
    public List<AttendanceRecordDto> getStudentAttendanceHistory(String studentEmail, LocalDate from, LocalDate to) {
        User user = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + studentEmail));
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + studentEmail));

        List<Attendance> attendances;
        if (from != null && to != null) {
            attendances = attendanceRepository.findByStudentIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
                    student.getId(), from, to);
        } else {
            attendances = attendanceRepository.findByStudentIdOrderByAttendanceDateDesc(student.getId());
        }

        RoomAllocation activeAlloc = roomAllocationRepository.findByStudentIdAndStatus(
                student.getId(), AllocationStatus.ACTIVE).orElse(null);

        return attendances.stream()
                .map(a -> AttendanceRecordDto.fromEntity(a, activeAlloc))
                .toList();
    }

    /**
     * Computes personal attendance summary metrics for the authenticated student for a given month or overall.
     */
    @Transactional(readOnly = true)
    public StudentAttendanceSummaryDto getStudentAttendanceSummary(String studentEmail, String month) {
        User user = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + studentEmail));
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + studentEmail));

        long totalMarked;
        long present;
        long absent;
        long onLeave;
        String periodLabel;

        if (month != null && !month.isBlank()) {
            YearMonth ym = YearMonth.parse(month.trim());
            LocalDate from = ym.atDay(1);
            LocalDate to = ym.atEndOfMonth();
            periodLabel = ym.toString();

            totalMarked = attendanceRepository.countByStudentIdAndDateBetween(student.getId(), from, to);
            present = attendanceRepository.countByStudentIdAndStatusAndDateBetween(student.getId(), AttendanceStatus.PRESENT, from, to);
            absent = attendanceRepository.countByStudentIdAndStatusAndDateBetween(student.getId(), AttendanceStatus.ABSENT, from, to);
            onLeave = attendanceRepository.countByStudentIdAndStatusAndDateBetween(student.getId(), AttendanceStatus.ON_LEAVE, from, to);
        } else {
            periodLabel = "All Time";
            List<Attendance> all = attendanceRepository.findByStudentIdOrderByAttendanceDateDesc(student.getId());
            totalMarked = all.size();
            present = all.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
            absent = all.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
            onLeave = all.stream().filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE).count();
        }

        double rate = (totalMarked > 0)
                ? BigDecimal.valueOf((present * 100.0) / totalMarked)
                .setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        String formula = "Attendance % = (Present Days / Total Marked Days) * 100";

        return new StudentAttendanceSummaryDto(
                student.getId(),
                user.getFullName(),
                student.getEnrollmentNumber(),
                periodLabel,
                totalMarked,
                present,
                absent,
                onLeave,
                rate,
                formula
        );
    }
}
