package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.SosCreateDto;
import com.hostelsync.backend.dto.SosResolveDto;
import com.hostelsync.backend.dto.SosResponseDto;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class SosService {

    private final SosAlertRepository sosAlertRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoomAllocationRepository roomAllocationRepository;
    private final HostelRepository hostelRepository;

    public SosService(
            SosAlertRepository sosAlertRepository,
            StudentRepository studentRepository,
            UserRepository userRepository,
            RoomAllocationRepository roomAllocationRepository,
            HostelRepository hostelRepository) {
        this.sosAlertRepository = sosAlertRepository;
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.roomAllocationRepository = roomAllocationRepository;
        this.hostelRepository = hostelRepository;
    }

    @Transactional
    public SosResponseDto triggerSos(String studentEmail, SosCreateDto dto) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student record not found"));

        // Find active room allocation if any
        var allocOpt = roomAllocationRepository.findActiveByStudentId(student.getId());
        Hostel hostel = allocOpt.map(a -> a.getRoom().getHostel())
                .orElseGet(() -> hostelRepository.findAll().stream().findFirst().orElse(null));

        if (hostel == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hostel found to route emergency alert");
        }

        String roomNum = allocOpt.map(a -> a.getRoom().getRoomNumber()).orElse("Unassigned");

        SosAlert alert = new SosAlert();
        alert.setStudent(student);
        alert.setHostel(hostel);
        alert.setRoomNumber(roomNum);
        alert.setAlertType(dto.alertType());
        alert.setDescription(dto.description() != null ? dto.description().trim() : "Emergency SOS Panic Triggered");
        alert.setStatus(SosStatus.ACTIVE);

        SosAlert saved = sosAlertRepository.save(alert);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<SosResponseDto> getActiveAlerts() {
        return sosAlertRepository.findByStatusInOrderByTriggeredAtDesc(
                List.of(SosStatus.ACTIVE, SosStatus.ACKNOWLEDGED)
        ).stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<SosResponseDto> getAllAlerts() {
        return sosAlertRepository.findAllByOrderByTriggeredAtDesc()
                .stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<SosResponseDto> getStudentAlerts(String studentEmail) {
        Student student = studentRepository.findByUserEmail(studentEmail).orElse(null);
        if (student == null) return List.of();

        return sosAlertRepository.findByStudentIdOrderByTriggeredAtDesc(student.getId())
                .stream().map(this::mapToDto).toList();
    }

    @Transactional
    public SosResponseDto updateAlertStatus(Long alertId, String responderEmail, SosResolveDto dto) {
        SosAlert alert = sosAlertRepository.findById(alertId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SOS Alert not found"));

        User responder = userRepository.findByEmail(responderEmail).orElse(null);

        alert.setStatus(dto.status());
        if (dto.status() == SosStatus.ACKNOWLEDGED && alert.getAcknowledgedAt() == null) {
            alert.setAcknowledgedAt(Instant.now());
        } else if (dto.status() == SosStatus.RESOLVED) {
            alert.setResolvedAt(Instant.now());
            if (alert.getAcknowledgedAt() == null) {
                alert.setAcknowledgedAt(Instant.now());
            }
        }

        if (responder != null) {
            alert.setResolvedBy(responder);
        }
        if (dto.resolutionNotes() != null) {
            alert.setResolutionNotes(dto.resolutionNotes().trim());
        }

        return mapToDto(sosAlertRepository.save(alert));
    }

    @Transactional(readOnly = true)
    public long countActiveAlerts() {
        return sosAlertRepository.countByStatus(SosStatus.ACTIVE);
    }

    private SosResponseDto mapToDto(SosAlert a) {
        return new SosResponseDto(
                a.getId(),
                a.getStudent().getId(),
                a.getStudent().getUser().getFullName(),
                a.getStudent().getEnrollmentNumber(),
                a.getStudent().getPhone(),
                a.getHostel().getId(),
                a.getHostel().getName(),
                a.getRoomNumber(),
                a.getAlertType(),
                a.getStatus(),
                a.getDescription(),
                a.getTriggeredAt(),
                a.getAcknowledgedAt(),
                a.getResolvedAt(),
                a.getResolvedBy() != null ? a.getResolvedBy().getFullName() : null,
                a.getResolutionNotes()
        );
    }
}

