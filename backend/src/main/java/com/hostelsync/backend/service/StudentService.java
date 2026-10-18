package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.AllocationStatus;
import com.hostelsync.backend.entity.Role;
import com.hostelsync.backend.entity.RoomAllocation;
import com.hostelsync.backend.entity.Student;
import com.hostelsync.backend.entity.User;
import com.hostelsync.backend.exception.DuplicateResourceException;
import com.hostelsync.backend.exception.InvalidOperationException;
import com.hostelsync.backend.exception.ResourceNotFoundException;
import com.hostelsync.backend.repository.RoomAllocationRepository;
import com.hostelsync.backend.repository.StudentRepository;
import com.hostelsync.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service managing Student directories, user account creation, profile updates, and admission record safety.
 */
@Service
@Transactional
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final RoomAllocationRepository roomAllocationRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(
            StudentRepository studentRepository,
            UserRepository userRepository,
            RoomAllocationRepository roomAllocationRepository,
            PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.roomAllocationRepository = roomAllocationRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<StudentResponseDto> getStudents(String search, String course, Boolean active) {
        List<Student> students;

        if (search != null && !search.trim().isEmpty()) {
            students = studentRepository.searchStudents(search.trim());
        } else if (course != null && !course.trim().isEmpty()) {
            students = studentRepository.findByCourse(course.trim());
        } else {
            students = studentRepository.findAllByOrderByIdDesc();
        }

        if (active != null) {
            students = students.stream()
                    .filter(s -> s.getUser().isActive() == active)
                    .toList();
        }

        return students.stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentDetailDto getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        Optional<RoomAllocation> activeAlloc = roomAllocationRepository.findByStudentIdAndStatus(id, AllocationStatus.ACTIVE);
        int totalAllocations = roomAllocationRepository.countByStudentId(id);

        String roomNum = activeAlloc.map(a -> a.getRoom().getRoomNumber()).orElse(null);
        String hostelName = activeAlloc.map(a -> a.getRoom().getHostel().getName()).orElse(null);
        Long roomId = activeAlloc.map(a -> a.getRoom().getId()).orElse(null);
        Long hostelId = activeAlloc.map(a -> a.getRoom().getHostel().getId()).orElse(null);
        Long allocId = activeAlloc.map(RoomAllocation::getId).orElse(null);
        java.time.LocalDate allocDate = activeAlloc.map(RoomAllocation::getAllocationDate).orElse(null);

        return new StudentDetailDto(
                student.getId(),
                student.getEnrollmentNumber(),
                student.getUser().getFullName(),
                student.getUser().getEmail(),
                student.getCourse(),
                student.getSemester(),
                student.getPhone(),
                student.getUser().isActive(),
                student.getUser().getId(),
                student.getUser().getCreatedAt(),
                roomNum,
                hostelName,
                roomId,
                hostelId,
                allocId,
                allocDate,
                totalAllocations
        );
    }

    public StudentResponseDto createStudent(StudentCreateRequestDto dto) {
        String enrollment = dto.enrollmentNumber().trim().toUpperCase();
        String email = dto.email().trim().toLowerCase();

        if (studentRepository.existsByEnrollmentNumber(enrollment)) {
            throw new DuplicateResourceException("A student with enrollment number '" + enrollment + "' already exists");
        }

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("An account with email '" + email + "' already exists");
        }

        String rawPassword = (dto.password() != null && !dto.password().trim().isEmpty())
                ? dto.password().trim()
                : "StudentPass123!";

        boolean active = dto.active() == null || dto.active();

        // Enforce Role.STUDENT strictly - never allow client to assign elevated roles
        User user = new User(
                dto.fullName().trim(),
                email,
                passwordEncoder.encode(rawPassword),
                Role.STUDENT,
                active
        );
        User savedUser = userRepository.save(user);

        Student student = new Student(
                enrollment,
                dto.course().trim(),
                dto.semester(),
                dto.phone().trim(),
                savedUser
        );
        Student savedStudent = studentRepository.save(student);

        return mapToResponseDto(savedStudent);
    }

    public StudentResponseDto updateStudent(Long id, StudentUpdateRequestDto dto) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        String enrollment = dto.enrollmentNumber().trim().toUpperCase();
        String email = dto.email().trim().toLowerCase();

        if (studentRepository.existsByEnrollmentNumberAndIdNot(enrollment, id)) {
            throw new DuplicateResourceException("Another student with enrollment number '" + enrollment + "' already exists");
        }

        User user = student.getUser();
        if (userRepository.existsByEmailAndIdNot(email, user.getId())) {
            throw new DuplicateResourceException("Another account with email '" + email + "' already exists");
        }

        user.setFullName(dto.fullName().trim());
        user.setEmail(email);
        if (dto.active() != null) {
            user.setActive(dto.active());
        }
        userRepository.save(user);

        student.setEnrollmentNumber(enrollment);
        student.setCourse(dto.course().trim());
        student.setSemester(dto.semester());
        student.setPhone(dto.phone().trim());

        Student updatedStudent = studentRepository.save(student);
        return mapToResponseDto(updatedStudent);
    }

    public StudentResponseDto updateStudentStatus(Long id, boolean active) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        student.getUser().setActive(active);
        userRepository.save(student.getUser());

        return mapToResponseDto(student);
    }

    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        if (roomAllocationRepository.existsByStudentId(id)) {
            throw new InvalidOperationException(
                    "Cannot delete student '" + student.getUser().getFullName() + "' (" + student.getEnrollmentNumber() +
                    ") because historical or active room allocation records exist. Please deactivate the student account instead."
            );
        }

        User user = student.getUser();
        studentRepository.delete(student);
        userRepository.delete(user);
    }

    public StudentResponseDto mapToResponseDto(Student student) {
        Optional<RoomAllocation> activeAlloc = roomAllocationRepository.findByStudentIdAndStatus(student.getId(), AllocationStatus.ACTIVE);
        String roomNum = activeAlloc.map(a -> a.getRoom().getRoomNumber()).orElse(null);
        String hostelName = activeAlloc.map(a -> a.getRoom().getHostel().getName()).orElse(null);
        Long allocId = activeAlloc.map(RoomAllocation::getId).orElse(null);

        return new StudentResponseDto(
                student.getId(),
                student.getEnrollmentNumber(),
                student.getUser().getFullName(),
                student.getUser().getEmail(),
                student.getCourse(),
                student.getSemester(),
                student.getPhone(),
                student.getUser().isActive(),
                student.getUser().getId(),
                student.getUser().getCreatedAt(),
                roomNum,
                hostelName,
                allocId
        );
    }
}
