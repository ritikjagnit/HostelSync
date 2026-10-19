package com.hostelsync.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelsync.backend.dto.StudentProfileUpdateRequestDto;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import com.hostelsync.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test suite for Phase 3D Student Portal endpoints (/api/student/**).
 * Validates self-service dashboard, profile updates, residential history,
 * data ownership isolation, role-based protection, and sensitive field redaction.
 */
@SpringBootTest
@AutoConfigureMockMvc
class StudentPortalTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomAllocationRepository roomAllocationRepository;

    @Autowired
    private WardenHostelAssignmentRepository assignmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String wardenToken;
    private String student1Token;
    private String student2Token;

    private Student student1;
    private Student student2;
    private Hostel testHostel;
    private Room testRoom1;
    private Room testRoom2;

    @BeforeEach
    void setUp() {
        cleanDatabase();

        // 1. Create Admin
        User adminUser = userRepository.save(new User(
                "System Admin",
                "admin.portal@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.ADMIN,
                true
        ));
        adminToken = jwtTokenProvider.generateToken(adminUser);

        // 2. Create Warden
        User wardenUser = userRepository.save(new User(
                "Hostel Warden",
                "warden.portal@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.WARDEN,
                true
        ));
        wardenToken = jwtTokenProvider.generateToken(wardenUser);

        // 3. Create Student 1
        User student1User = userRepository.save(new User(
                "Aditya Joshi",
                "aditya.joshi@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.STUDENT,
                true
        ));
        student1 = studentRepository.save(new Student(
                "EN2026CS101",
                "Computer Technology",
                4,
                "9822110011",
                student1User
        ));
        student1Token = jwtTokenProvider.generateToken(student1User);

        // 4. Create Student 2
        User student2User = userRepository.save(new User(
                "Sneha Patil",
                "sneha.patil@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.STUDENT,
                true
        ));
        student2 = studentRepository.save(new Student(
                "EN2026EE202",
                "Electrical Engineering",
                2,
                "9822110022",
                student2User
        ));
        student2Token = jwtTokenProvider.generateToken(student2User);

        // 5. Create Hostel and Rooms
        testHostel = hostelRepository.save(new Hostel(
                "Sahyadri Boys Hostel",
                HostelType.BOYS,
                "GP Sakoli Campus Block A",
                true
        ));

        testRoom1 = roomRepository.save(new Room("101", 1, 3, testHostel));
        testRoom2 = roomRepository.save(new Room("102", 1, 2, testHostel));
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        attendanceRepository.deleteAll();
        assignmentRepository.deleteAll();
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        roomRepository.deleteAll();
        hostelRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ------------------------------------------------------------------------
    // 1. Dashboard Tests
    // ------------------------------------------------------------------------

    @Test
    @DisplayName("1. Authenticated STUDENT can retrieve their dashboard with active allocation")
    void studentCanRetrieveDashboard_withActiveAllocation() throws Exception {
        // Allocate Student 1 to Room 1
        roomAllocationRepository.save(new RoomAllocation(
                student1,
                testRoom1,
                LocalDate.now().minusDays(10),
                null,
                AllocationStatus.ACTIVE
        ));

        mockMvc.perform(get("/api/student/dashboard")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.fullName").value("Aditya Joshi"))
                .andExpect(jsonPath("$.profile.enrollmentNumber").value("EN2026CS101"))
                .andExpect(jsonPath("$.profile.course").value("Computer Technology"))
                .andExpect(jsonPath("$.profile.semester").value(4))
                .andExpect(jsonPath("$.profile.phone").value("9822110011"))
                .andExpect(jsonPath("$.profile.active").value(true))
                .andExpect(jsonPath("$.roomAllocated").value(true))
                .andExpect(jsonPath("$.currentRoom.roomNumber").value("101"))
                .andExpect(jsonPath("$.currentRoom.floor").value(1))
                .andExpect(jsonPath("$.currentRoom.capacity").value(3))
                .andExpect(jsonPath("$.currentRoom.currentOccupancy").value(1))
                .andExpect(jsonPath("$.currentRoom.availableBeds").value(2))
                .andExpect(jsonPath("$.currentRoom.hostelName").value("Sahyadri Boys Hostel"))
                .andExpect(jsonPath("$.currentRoom.hostelAddress").value("GP Sakoli Campus Block A"))
                .andExpect(jsonPath("$.currentRoom.status").value("ACTIVE"))
                .andExpect(jsonPath("$.totalAllocationsCount").value(1));
    }

    @Test
    @DisplayName("2. Student without allocation receives valid dashboard with roomAllocated=false")
    void studentCanRetrieveDashboard_withoutAllocation() throws Exception {
        mockMvc.perform(get("/api/student/dashboard")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.fullName").value("Sneha Patil"))
                .andExpect(jsonPath("$.profile.enrollmentNumber").value("EN2026EE202"))
                .andExpect(jsonPath("$.roomAllocated").value(false))
                .andExpect(jsonPath("$.currentRoom").doesNotExist())
                .andExpect(jsonPath("$.totalAllocationsCount").value(0));
    }

    // ------------------------------------------------------------------------
    // 2. Profile Tests
    // ------------------------------------------------------------------------

    @Test
    @DisplayName("3. Student profile endpoint returns only authenticated student information")
    void studentProfileContainsOnlyAuthenticatedStudentInfo() throws Exception {
        mockMvc.perform(get("/api/student/profile")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Aditya Joshi"))
                .andExpect(jsonPath("$.email").value("aditya.joshi@gpsakoli.ac.in"))
                .andExpect(jsonPath("$.enrollmentNumber").value("EN2026CS101"))
                .andExpect(jsonPath("$.course").value("Computer Technology"))
                .andExpect(jsonPath("$.semester").value(4))
                .andExpect(jsonPath("$.phone").value("9822110011"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("4. Student can update permitted contact info (phone number)")
    void studentCanUpdatePermittedPhone() throws Exception {
        StudentProfileUpdateRequestDto updateDto = new StudentProfileUpdateRequestDto("9988776655");

        mockMvc.perform(put("/api/student/profile")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("9988776655"))
                .andExpect(jsonPath("$.fullName").value("Aditya Joshi"))
                .andExpect(jsonPath("$.enrollmentNumber").value("EN2026CS101"));

        // Verify persistence in database
        Student reloaded = studentRepository.findById(student1.getId()).orElseThrow();
        assertEquals("9988776655", reloaded.getPhone());
        // Verify protected fields did NOT change
        assertEquals("EN2026CS101", reloaded.getEnrollmentNumber());
        assertEquals("Computer Technology", reloaded.getCourse());
        assertEquals(4, reloaded.getSemester());
    }

    @Test
    @DisplayName("5. Profile update rejects blank or invalid phone format")
    void profileUpdateRejectsInvalidPhone() throws Exception {
        StudentProfileUpdateRequestDto blankPhone = new StudentProfileUpdateRequestDto("");

        mockMvc.perform(put("/api/student/profile")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankPhone)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.phone").exists());

        StudentProfileUpdateRequestDto lettersPhone = new StudentProfileUpdateRequestDto("invalid-abc");

        mockMvc.perform(put("/api/student/profile")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lettersPhone)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.phone").exists());
    }

    // ------------------------------------------------------------------------
    // 3. Room & Allocation History Tests
    // ------------------------------------------------------------------------

    @Test
    @DisplayName("6. Student can retrieve their own allocation history")
    void studentCanRetrieveOwnAllocationHistory() throws Exception {
        // Create past completed allocation and active allocation for Student 1
        roomAllocationRepository.save(new RoomAllocation(
                student1,
                testRoom2,
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2026, 1, 15),
                AllocationStatus.COMPLETED
        ));

        roomAllocationRepository.save(new RoomAllocation(
                student1,
                testRoom1,
                LocalDate.of(2026, 1, 16),
                null,
                AllocationStatus.ACTIVE
        ));

        mockMvc.perform(get("/api/student/allocations")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].roomNumber").value("101"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[1].roomNumber").value("102"))
                .andExpect(jsonPath("$[1].status").value("COMPLETED"))
                .andExpect(jsonPath("$[1].vacatingDate").value("2026-01-15"));
    }

    @Test
    @DisplayName("7. Student without allocations receives valid empty allocation responses")
    void studentWithoutAllocationsReceivesEmptyResponses() throws Exception {
        // Current room returns 200 with null body
        mockMvc.perform(get("/api/student/allocations/current")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isOk())
                .andExpect(content().string(""));

        // Allocation history returns 200 with empty list
        mockMvc.perform(get("/api/student/allocations")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("8. Student cannot access another student's allocation data")
    void studentCannotAccessAnotherStudentsData() throws Exception {
        // Allocate Student 1 to Room 1
        roomAllocationRepository.save(new RoomAllocation(
                student1,
                testRoom1,
                LocalDate.now().minusDays(5),
                null,
                AllocationStatus.ACTIVE
        ));

        // Allocate Student 2 to Room 2
        roomAllocationRepository.save(new RoomAllocation(
                student2,
                testRoom2,
                LocalDate.now().minusDays(3),
                null,
                AllocationStatus.ACTIVE
        ));

        // Student 2 requests their current room: MUST be Room 102, NEVER Room 101
        mockMvc.perform(get("/api/student/allocations/current")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("102"))
                .andExpect(jsonPath("$.roomNumber", not("101")));

        // Student 1 requests their current room: MUST be Room 101, NEVER Room 102
        mockMvc.perform(get("/api/student/allocations/current")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("101"))
                .andExpect(jsonPath("$.roomNumber", not("102")));
    }

    // ------------------------------------------------------------------------
    // 4. Role Authorization & Endpoint Guard Tests
    // ------------------------------------------------------------------------

    @Test
    @DisplayName("9. STUDENT cannot access admin allocation management endpoints (403)")
    void studentCannotAccessAdminAllocationEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/allocations")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("10. ADMIN and WARDEN roles cannot access student-only endpoints (403)")
    void adminAndWardenCannotAccessStudentOnlyEndpoints() throws Exception {
        // Admin forbidden from /api/student/dashboard
        mockMvc.perform(get("/api/student/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        // Warden forbidden from /api/student/dashboard
        mockMvc.perform(get("/api/student/dashboard")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        // Admin forbidden from /api/student/profile
        mockMvc.perform(get("/api/student/profile")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        // Warden forbidden from /api/student/allocations
        mockMvc.perform(get("/api/student/allocations")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("11. Unauthenticated requests return 401 Unauthorized")
    void unauthenticatedRequestsReturn401() throws Exception {
        mockMvc.perform(get("/api/student/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        mockMvc.perform(get("/api/student/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        mockMvc.perform(get("/api/student/allocations"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    // ------------------------------------------------------------------------
    // 5. Sensitive Data Redaction
    // ------------------------------------------------------------------------

    @Test
    @DisplayName("12. Password hashes and authentication secrets are never exposed in student responses")
    void sensitiveFieldsAreNeverExposed() throws Exception {
        roomAllocationRepository.save(new RoomAllocation(
                student1,
                testRoom1,
                LocalDate.now(),
                null,
                AllocationStatus.ACTIVE
        ));

        mockMvc.perform(get("/api/student/dashboard")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.profile.password").doesNotExist())
                .andExpect(content().string(not(containsString("Pass123!"))))
                .andExpect(content().string(not(containsString("$2a$"))));

        mockMvc.perform(get("/api/student/profile")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(content().string(not(containsString("Pass123!"))));
    }
}
