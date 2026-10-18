package com.hostelsync.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelsync.backend.dto.StudentCreateRequestDto;
import com.hostelsync.backend.dto.StudentStatusRequestDto;
import com.hostelsync.backend.dto.StudentUpdateRequestDto;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import com.hostelsync.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminStudentManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomAllocationRepository roomAllocationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String wardenToken;
    private String studentToken;

    private Student testStudent;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        roomRepository.deleteAll();
        hostelRepository.deleteAll();
        userRepository.deleteAll();

        User admin = userRepository.save(new User(
                "Principal Admin",
                "admin.studenttest@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.ADMIN,
                true
        ));

        User warden = userRepository.save(new User(
                "Hostel Warden",
                "warden.studenttest@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.WARDEN,
                true
        ));

        User studentUser = userRepository.save(new User(
                "Student Regular",
                "regular.student@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.STUDENT,
                true
        ));

        adminToken = jwtTokenProvider.generateToken(admin);
        wardenToken = jwtTokenProvider.generateToken(warden);
        studentToken = jwtTokenProvider.generateToken(studentUser);

        testStudent = studentRepository.save(new Student(
                "EN2026101",
                "Computer Technology",
                3,
                "9876543210",
                studentUser
        ));

        Hostel hostel = hostelRepository.save(new Hostel(
                "Main Boys Hostel",
                HostelType.BOYS,
                "GP Sakoli",
                true
        ));

        testRoom = roomRepository.save(new Room(
                "201",
                2,
                3,
                hostel
        ));
    }

    @Test
    @DisplayName("GET /api/admin/students returns student list for ADMIN")
    void listStudentsSuccess() throws Exception {
        mockMvc.perform(get("/api/admin/students")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].enrollmentNumber").value("EN2026101"))
                .andExpect(jsonPath("$[0].fullName").value("Student Regular"))
                .andExpect(jsonPath("$[0].course").value("Computer Technology"))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/admin/students search by name or enrollment number")
    void searchStudents() throws Exception {
        // Search by enrollment
        mockMvc.perform(get("/api/admin/students?search=EN2026101")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].enrollmentNumber").value("EN2026101"));

        // Search with non-matching query
        mockMvc.perform(get("/api/admin/students?search=NONEXISTENT")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("GET /api/admin/students enforces ADMIN-only access")
    void studentApiAuthorizationEnforcement() throws Exception {
        // Unauthenticated -> 401
        mockMvc.perform(get("/api/admin/students"))
                .andExpect(status().isUnauthorized());

        // WARDEN -> 403
        mockMvc.perform(get("/api/admin/students")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isForbidden());

        // STUDENT -> 403
        mockMvc.perform(get("/api/admin/students")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/students/{id} returns detail or 404")
    void getStudentById() throws Exception {
        mockMvc.perform(get("/api/admin/students/" + testStudent.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(testStudent.getId()))
                .andExpect(jsonPath("$.enrollmentNumber").value("EN2026101"))
                .andExpect(jsonPath("$.fullName").value("Student Regular"))
                .andExpect(jsonPath("$.email").value("regular.student@gpsakoli.ac.in"));

        mockMvc.perform(get("/api/admin/students/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("POST /api/admin/students creates student and linked user with ROLE_STUDENT")
    void createStudentSuccess() throws Exception {
        StudentCreateRequestDto request = new StudentCreateRequestDto(
                "EN2026202",
                "Sneha Patil",
                "sneha.patil@gpsakoli.ac.in",
                "Mechanical Engineering",
                2,
                "9123456789",
                "SnehaPass123!",
                true
        );

        mockMvc.perform(post("/api/admin/students")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("/api/admin/students/")))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.enrollmentNumber").value("EN2026202"))
                .andExpect(jsonPath("$.fullName").value("Sneha Patil"))
                .andExpect(jsonPath("$.email").value("sneha.patil@gpsakoli.ac.in"))
                .andExpect(jsonPath("$.course").value("Mechanical Engineering"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // Verify linked user has ROLE_STUDENT and password is encrypted
        User createdUser = userRepository.findByEmail("sneha.patil@gpsakoli.ac.in").orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(Role.STUDENT, createdUser.getRole());
        org.junit.jupiter.api.Assertions.assertTrue(passwordEncoder.matches("SnehaPass123!", createdUser.getPasswordHash()));
    }

    @Test
    @DisplayName("POST /api/admin/students rejects duplicate enrollment and duplicate email")
    void createStudentDuplicateRejection() throws Exception {
        // Duplicate enrollment
        StudentCreateRequestDto duplicateEnrollment = new StudentCreateRequestDto(
                "EN2026101",
                "Another Name",
                "unique.email@gpsakoli.ac.in",
                "Civil Engineering",
                1,
                "9876500000",
                "Pass123!",
                true
        );

        mockMvc.perform(post("/api/admin/students")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateEnrollment)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("enrollment number")));

        // Duplicate email
        StudentCreateRequestDto duplicateEmail = new StudentCreateRequestDto(
                "EN2026999",
                "Another Name",
                "regular.student@gpsakoli.ac.in",
                "Civil Engineering",
                1,
                "9876500000",
                "Pass123!",
                true
        );

        mockMvc.perform(post("/api/admin/students")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateEmail)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("email")));
    }

    @Test
    @DisplayName("POST /api/admin/students validates semester range, blank fields, and email format")
    void createStudentValidationErrors() throws Exception {
        StudentCreateRequestDto invalid = new StudentCreateRequestDto(
                "",
                "",
                "invalid-email-format",
                "Course",
                12, // semester > 10
                "123", // phone too short
                "Pass",
                true
        );

        mockMvc.perform(post("/api/admin/students")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.enrollmentNumber").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.fullName").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.email").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.semester").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.phone").isNotEmpty());
    }

    @Test
    @DisplayName("PUT /api/admin/students/{id} updates student and linked user profile")
    void updateStudentSuccess() throws Exception {
        StudentUpdateRequestDto update = new StudentUpdateRequestDto(
                "EN2026101",
                "Student Regular (Updated)",
                "updated.email@gpsakoli.ac.in",
                "Information Technology",
                4,
                "9876543211",
                true
        );

        mockMvc.perform(put("/api/admin/students/" + testStudent.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Student Regular (Updated)"))
                .andExpect(jsonPath("$.email").value("updated.email@gpsakoli.ac.in"))
                .andExpect(jsonPath("$.course").value("Information Technology"))
                .andExpect(jsonPath("$.semester").value(4));
    }

    @Test
    @DisplayName("PATCH /api/admin/students/{id}/status toggles active status")
    void toggleStudentStatus() throws Exception {
        mockMvc.perform(patch("/api/admin/students/" + testStudent.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StudentStatusRequestDto(false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(patch("/api/admin/students/" + testStudent.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StudentStatusRequestDto(true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("DELETE /api/admin/students/{id} prevents deletion when allocations exist")
    void deleteStudentPreventedWhenAllocationsExist() throws Exception {
        // Add allocation for testStudent
        roomAllocationRepository.save(new RoomAllocation(
                testStudent,
                testRoom,
                LocalDate.now(),
                null,
                AllocationStatus.ACTIVE
        ));

        // Attempt deletion -> 409 Conflict
        mockMvc.perform(delete("/api/admin/students/" + testStudent.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("room allocation records exist")));

        // Create student without allocations and delete successfully
        User freeUser = userRepository.save(new User("Free User", "free@gpsakoli.ac.in", "hash", Role.STUDENT, true));
        Student freeStudent = studentRepository.save(new Student("EN_FREE_01", "Civil", 1, "9999999999", freeUser));

        mockMvc.perform(delete("/api/admin/students/" + freeStudent.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }
}
