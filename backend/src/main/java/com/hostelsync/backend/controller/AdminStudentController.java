package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * REST controller for administrator student directory, admission registration, and status management.
 */
@RestController
@RequestMapping("/api/admin/students")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStudentController {

    private final StudentService studentService;

    public AdminStudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<StudentResponseDto>> getStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String course,
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(studentService.getStudents(search, course, active));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentDetailDto> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @PostMapping
    public ResponseEntity<StudentResponseDto> createStudent(@Valid @RequestBody StudentCreateRequestDto requestDto) {
        StudentResponseDto created = studentService.createStudent(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(URI.create("/api/admin/students/" + created.id()))
                .body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentResponseDto> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody StudentUpdateRequestDto requestDto) {
        return ResponseEntity.ok(studentService.updateStudent(id, requestDto));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<StudentResponseDto> updateStudentStatus(
            @PathVariable Long id,
            @Valid @RequestBody StudentStatusRequestDto statusDto) {
        return ResponseEntity.ok(studentService.updateStudentStatus(id, statusDto.active()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}
