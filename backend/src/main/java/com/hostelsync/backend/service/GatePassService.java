package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GatePassService {

    private final GatePassRepository gatePassRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoomAllocationRepository roomAllocationRepository;
    private final WardenHostelAssignmentRepository wardenHostelAssignmentRepository;

    public GatePassService(
            GatePassRepository gatePassRepository,
            StudentRepository studentRepository,
            UserRepository userRepository,
            RoomAllocationRepository roomAllocationRepository,
            WardenHostelAssignmentRepository wardenHostelAssignmentRepository) {
        this.gatePassRepository = gatePassRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.roomAllocationRepository = roomAllocationRepository;
        this.wardenHostelAssignmentRepository = wardenHostelAssignmentRepository;
    }

    @Transactional
    public GatePassResponseDto applyGatePass(String studentEmail, GatePassRequestDto request) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));

        RoomAllocation activeAlloc = roomAllocationRepository.findActiveByStudentId(student.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Only actively allocated hostel residents can apply for gate pass"));

        if (request.expectedInTime().isBefore(request.outTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Expected return time cannot be before departure time");
        }

        GatePass pass = new GatePass();
        pass.setPassNumber(generatePassNumber());
        pass.setStudent(student);
        pass.setHostel(activeAlloc.getRoom().getHostel());
        pass.setPassType(request.passType());
        pass.setPurpose(request.purpose());
        pass.setDestination(request.destination());
        pass.setOutTime(request.outTime());
        pass.setExpectedInTime(request.expectedInTime());
        pass.setParentContact(request.parentContact() != null ? request.parentContact() : student.getPhone());
        pass.setStatus(GatePassStatus.PENDING);

        GatePass saved = gatePassRepository.save(pass);
        return mapToDto(saved, activeAlloc.getRoom().getRoomNumber());
    }

    @Transactional(readOnly = true)
    public List<GatePassResponseDto> getStudentGatePasses(String studentEmail) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));

        String roomNum = roomAllocationRepository.findActiveByStudentId(student.getId())
                .map(a -> a.getRoom().getRoomNumber())
                .orElse(null);

        return gatePassRepository.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream()
                .map(p -> mapToDto(p, roomNum))
                .toList();
    }

    @Transactional
    public GatePassResponseDto cancelGatePass(String studentEmail, Long passId) {
        GatePass pass = gatePassRepository.findById(passId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gate pass not found"));

        if (!pass.getStudent().getUser().getEmail().equalsIgnoreCase(studentEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to cancel this pass");
        }

        if (pass.getStatus() != GatePassStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending gate passes can be cancelled");
        }

        pass.setStatus(GatePassStatus.CANCELLED);
        pass.setWardenRemarks("Cancelled by resident student.");
        return mapToDto(gatePassRepository.save(pass), null);
    }

    @Transactional(readOnly = true)
    public List<GatePassResponseDto> getWardenGatePasses(String wardenEmail, GatePassStatus statusFilter) {
        User warden = userRepository.findByEmail(wardenEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warden profile not found"));

        List<Long> hostelIds = wardenHostelAssignmentRepository.findByWardenId(warden.getId())
                .stream()
                .map(a -> a.getHostel().getId())
                .toList();

        if (hostelIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<GatePass> list = gatePassRepository.findByHostelIdInOrderByCreatedAtDesc(hostelIds);
        return filterAndMap(list, statusFilter);
    }

    @Transactional(readOnly = true)
    public GatePassStatsDto getWardenGatePassStats(String wardenEmail) {
        User warden = userRepository.findByEmail(wardenEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Warden profile not found"));

        List<Long> hostelIds = wardenHostelAssignmentRepository.findByWardenId(warden.getId())
                .stream()
                .map(a -> a.getHostel().getId())
                .toList();

        if (hostelIds.isEmpty()) {
            return new GatePassStatsDto(0, 0, 0, 0, 0, 0, 0);
        }

        List<GatePass> passes = gatePassRepository.findByHostelIdInOrderByCreatedAtDesc(hostelIds);
        return computeStats(passes);
    }

    @Transactional(readOnly = true)
    public List<GatePassResponseDto> getAdminGatePasses(Long hostelId, GatePassStatus statusFilter) {
        List<GatePass> list;
        if (hostelId != null) {
            list = gatePassRepository.findByHostelIdOrderByCreatedAtDesc(hostelId);
        } else {
            list = gatePassRepository.findAllByOrderByCreatedAtDesc();
        }
        return filterAndMap(list, statusFilter);
    }

    @Transactional(readOnly = true)
    public GatePassStatsDto getAdminGatePassStats() {
        List<GatePass> passes = gatePassRepository.findAllByOrderByCreatedAtDesc();
        return computeStats(passes);
    }

    @Transactional
    public GatePassResponseDto updatePassStatus(Long passId, String reviewerEmail, GatePassStatusUpdateDto updateDto) {
        GatePass pass = gatePassRepository.findById(passId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gate pass not found"));

        User reviewer = userRepository.findByEmail(reviewerEmail).orElse(null);

        pass.setStatus(updateDto.status());
        if (updateDto.wardenRemarks() != null) {
            pass.setWardenRemarks(updateDto.wardenRemarks());
        }
        pass.setApprovedBy(reviewer);

        if (updateDto.status() == GatePassStatus.OUT_OF_CAMPUS && pass.getActualOutTime() == null) {
            pass.setActualOutTime(LocalDateTime.now());
        } else if (updateDto.status() == GatePassStatus.RETURNED && pass.getActualInTime() == null) {
            pass.setActualInTime(LocalDateTime.now());
        }

        return mapToDto(gatePassRepository.save(pass), null);
    }

    private List<GatePassResponseDto> filterAndMap(List<GatePass> list, GatePassStatus statusFilter) {
        LocalDateTime now = LocalDateTime.now();
        return list.stream()
                .filter(p -> {
                    if (statusFilter == null) return true;
                    if (statusFilter == GatePassStatus.OVERDUE) {
                        return p.getStatus() == GatePassStatus.OUT_OF_CAMPUS && p.getExpectedInTime().isBefore(now);
                    }
                    return p.getStatus() == statusFilter;
                })
                .map(p -> mapToDto(p, null))
                .toList();
    }

    private GatePassStatsDto computeStats(List<GatePass> passes) {
        LocalDateTime now = LocalDateTime.now();
        long total = passes.size();
        long pending = passes.stream().filter(p -> p.getStatus() == GatePassStatus.PENDING).count();
        long approved = passes.stream().filter(p -> p.getStatus() == GatePassStatus.APPROVED).count();
        long outOfCampus = passes.stream().filter(p -> p.getStatus() == GatePassStatus.OUT_OF_CAMPUS).count();
        long returned = passes.stream().filter(p -> p.getStatus() == GatePassStatus.RETURNED).count();
        long overdue = passes.stream().filter(p -> p.getStatus() == GatePassStatus.OUT_OF_CAMPUS && p.getExpectedInTime().isBefore(now)).count();
        long rejected = passes.stream().filter(p -> p.getStatus() == GatePassStatus.REJECTED).count();

        return new GatePassStatsDto(total, pending, approved, outOfCampus, returned, overdue, rejected);
    }

    private GatePassResponseDto mapToDto(GatePass p, String explicitRoom) {
        String room = explicitRoom;
        if (room == null && p.getStudent() != null) {
            room = roomAllocationRepository.findActiveByStudentId(p.getStudent().getId())
                    .map(a -> a.getRoom().getRoomNumber())
                    .orElse(null);
        }

        GatePassStatus effectiveStatus = p.getStatus();
        if (effectiveStatus == GatePassStatus.OUT_OF_CAMPUS && p.getExpectedInTime().isBefore(LocalDateTime.now())) {
            effectiveStatus = GatePassStatus.OVERDUE;
        }

        return new GatePassResponseDto(
                p.getId(),
                p.getPassNumber(),
                p.getStudent().getId(),
                p.getStudent().getUser().getFullName(),
                p.getStudent().getEnrollmentNumber(),
                p.getStudent().getPhone(),
                p.getStudent().getUser().getEmail(),
                p.getHostel().getId(),
                p.getHostel().getName(),
                room,
                p.getPassType(),
                p.getPurpose(),
                p.getDestination(),
                p.getOutTime(),
                p.getExpectedInTime(),
                p.getActualOutTime(),
                p.getActualInTime(),
                p.getParentContact(),
                effectiveStatus,
                p.getWardenRemarks(),
                p.getApprovedBy() != null ? p.getApprovedBy().getFullName() : null,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }

    private String generatePassNumber() {
        int year = Year.now().getValue();
        String randomSuffix = String.format("%05d", ThreadLocalRandom.current().nextInt(1, 100000));
        return "GP-" + year + "-" + randomSuffix;
    }
}
