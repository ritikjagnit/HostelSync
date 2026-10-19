package com.hostelsync.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelsync.backend.dto.WardenAttendanceBulkRequestDto;
import com.hostelsync.backend.dto.WardenAttendanceItemDto;
import com.hostelsync.backend.dto.WardenAttendanceUpdateRequestDto;
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
import java.time.ZoneId;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Comprehensive integration tests for Phase 4 — Hostel Attendance Management.
 * Verifies RBAC, hostel-level authorization scoping, bulk recording upsert, date policies,
 * resident allocation constraints, and analytical summaries.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AttendanceManagementTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

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

    private User adminUser;
    private User wardenBoys;
    private User wardenGirls;
    private User student1User;
    private User student2User;
    private User unallocatedStudentUser;

    private String adminToken;
    private String wardenBoysToken;
    private String wardenGirlsToken;
    private String student1Token;
    private String student2Token;
    private String unallocatedStudentToken;

    private Hostel boysHostel;
    private Hostel girlsHostel;
    private Room room101;
    private Room roomG01;

    private Student student1; // In boysHostel, Room 101
    private Student student2; // In girlsHostel, Room G01
    private Student unallocatedStudent; // Not allocated anywhere

    @BeforeEach
    void setUp() {
        attendanceRepository.deleteAll();
        assignmentRepository.deleteAll();
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        roomRepository.deleteAll();
        hostelRepository.deleteAll();
        userRepository.deleteAll();

        String pwd = passwordEncoder.encode("TestPass123!");

        // 1. Users
        adminUser = userRepository.save(new User("Principal Sakoli", "admin@gpsakoli.ac.in", pwd, Role.ADMIN, true));
        wardenBoys = userRepository.save(new User("Ramesh Patil", "warden.boys@gpsakoli.ac.in", pwd, Role.WARDEN, true));
        wardenGirls = userRepository.save(new User("Sunita Deshmukh", "warden.girls@gpsakoli.ac.in", pwd, Role.WARDEN, true));
        student1User = userRepository.save(new User("Amit Sharma", "amit.sharma@gpsakoli.ac.in", pwd, Role.STUDENT, true));
        student2User = userRepository.save(new User("Sneha Patil", "sneha.patil@gpsakoli.ac.in", pwd, Role.STUDENT, true));
        unallocatedStudentUser = userRepository.save(new User("Rohit Rao", "rohit.rao@gpsakoli.ac.in", pwd, Role.STUDENT, true));

        // 2. Tokens
        adminToken = jwtTokenProvider.generateToken(adminUser);
        wardenBoysToken = jwtTokenProvider.generateToken(wardenBoys);
        wardenGirlsToken = jwtTokenProvider.generateToken(wardenGirls);
        student1Token = jwtTokenProvider.generateToken(student1User);
        student2Token = jwtTokenProvider.generateToken(student2User);
        unallocatedStudentToken = jwtTokenProvider.generateToken(unallocatedStudentUser);

        // 3. Hostels & Rooms
        boysHostel = hostelRepository.save(new Hostel("Sahyadri Boys Hostel", HostelType.BOYS, "Campus Block A", true));
        girlsHostel = hostelRepository.save(new Hostel("Kaveri Girls Hostel", HostelType.GIRLS, "Campus Block B", true));

        room101 = roomRepository.save(new Room("101", 1, 3, boysHostel));
        roomG01 = roomRepository.save(new Room("G01", 1, 2, girlsHostel));

        // 4. Warden Assignments
        assignmentRepository.save(new WardenHostelAssignment(wardenBoys, boysHostel));
        assignmentRepository.save(new WardenHostelAssignment(wardenGirls, girlsHostel));

        // 5. Students
        student1 = studentRepository.save(new Student("EN2026CS101", "Computer Engineering", 4, "9876543210", student1User));
        student2 = studentRepository.save(new Student("EN2026EE201", "Electrical Engineering", 2, "9876543211", student2User));
        unallocatedStudent = studentRepository.save(new Student("EN2026ME301", "Mechanical Engineering", 1, "9876543212", unallocatedStudentUser));

        // 6. Active Room Allocations
        roomAllocationRepository.save(new RoomAllocation(student1, room101, LocalDate.now().minusDays(30), null, AllocationStatus.ACTIVE));
        roomAllocationRepository.save(new RoomAllocation(student2, roomG01, LocalDate.now().minusDays(20), null, AllocationStatus.ACTIVE));
    }

    // -------------------------------------------------------------------------
    // 1. Warden Roll Call & Scoping
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("1. Warden can retrieve roll-call roster for assigned hostel with pre-populated attendance")
    void wardenCanRetrieveRollCallRoster() throws Exception {
        LocalDate today = LocalDate.now(ZONE);

        // Pre-create an attendance record for student1
        attendanceRepository.save(new Attendance(student1, today, AttendanceStatus.PRESENT, wardenBoys, "Night roll call"));

        mockMvc.perform(get("/api/warden/attendance")
                        .param("hostelId", boysHostel.getId().toString())
                        .param("date", today.toString())
                        .header("Authorization", "Bearer " + wardenBoysToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].studentId").value(student1.getId()))
                .andExpect(jsonPath("$[0].studentName").value("Amit Sharma"))
                .andExpect(jsonPath("$[0].roomNumber").value("101"))
                .andExpect(jsonPath("$[0].status").value("PRESENT"))
                .andExpect(jsonPath("$[0].remarks").value("Night roll call"))
                .andExpect(jsonPath("$[0].recordedByName").value("Ramesh Patil"));
    }

    @Test
    @DisplayName("2. Warden cannot access roll-call roster for unassigned hostel (403 Forbidden)")
    void wardenCannotAccessUnassignedHostelRoster() throws Exception {
        LocalDate today = LocalDate.now(ZONE);

        // Boys warden trying to access Girls hostel roster
        mockMvc.perform(get("/api/warden/attendance")
                        .param("hostelId", girlsHostel.getId().toString())
                        .param("date", today.toString())
                        .header("Authorization", "Bearer " + wardenBoysToken))
                .andExpect(status().isForbidden());
    }

    // -------------------------------------------------------------------------
    // 2. Bulk Attendance Recording & Upserting
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("3. Warden can record bulk attendance for assigned hostel residents")
    void wardenCanRecordBulkAttendance() throws Exception {
        LocalDate today = LocalDate.now(ZONE);

        WardenAttendanceBulkRequestDto request = new WardenAttendanceBulkRequestDto(
                boysHostel.getId(),
                today,
                List.of(new WardenAttendanceItemDto(student1.getId(), AttendanceStatus.PRESENT, "Present on time"))
        );

        mockMvc.perform(post("/api/warden/attendance/bulk")
                        .header("Authorization", "Bearer " + wardenBoysToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hostelId").value(boysHostel.getId()))
                .andExpect(jsonPath("$.totalProcessed").value(1))
                .andExpect(jsonPath("$.createdCount").value(1))
                .andExpect(jsonPath("$.updatedCount").value(0));

        // Verify DB record
        assertTrue(attendanceRepository.existsByStudentIdAndAttendanceDate(student1.getId(), today));
        Attendance att = attendanceRepository.findByStudentIdAndAttendanceDate(student1.getId(), today).orElseThrow();
        assertEquals(AttendanceStatus.PRESENT, att.getStatus());
        assertEquals("Present on time", att.getRemarks());
        assertEquals(wardenBoys.getId(), att.getRecordedBy().getId());
    }

    @Test
    @DisplayName("4. Bulk attendance updates existing records on same date without creating duplicates")
    void bulkAttendanceUpdatesExistingRecordCleanly() throws Exception {
        LocalDate today = LocalDate.now(ZONE);

        // Pre-create initial record: ABSENT
        attendanceRepository.save(new Attendance(student1, today, AttendanceStatus.ABSENT, wardenBoys, "Late reporting"));
        assertEquals(1, attendanceRepository.count());

        // Update to ON_LEAVE with new remarks
        WardenAttendanceBulkRequestDto request = new WardenAttendanceBulkRequestDto(
                boysHostel.getId(),
                today,
                List.of(new WardenAttendanceItemDto(student1.getId(), AttendanceStatus.ON_LEAVE, "Approved gate pass"))
        );

        mockMvc.perform(post("/api/warden/attendance/bulk")
                        .header("Authorization", "Bearer " + wardenBoysToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProcessed").value(1))
                .andExpect(jsonPath("$.createdCount").value(0))
                .andExpect(jsonPath("$.updatedCount").value(1));

        // Verify still exactly 1 record, updated
        assertEquals(1, attendanceRepository.count());
        Attendance att = attendanceRepository.findByStudentIdAndAttendanceDate(student1.getId(), today).orElseThrow();
        assertEquals(AttendanceStatus.ON_LEAVE, att.getStatus());
        assertEquals("Approved gate pass", att.getRemarks());
    }

    @Test
    @DisplayName("5. Warden cannot record attendance for student in an unassigned hostel")
    void wardenCannotRecordAttendanceForUnassignedHostelStudent() throws Exception {
        LocalDate today = LocalDate.now(ZONE);

        // Boys warden trying to submit attendance for student2 (residing in girlsHostel)
        WardenAttendanceBulkRequestDto request = new WardenAttendanceBulkRequestDto(
                boysHostel.getId(),
                today,
                List.of(new WardenAttendanceItemDto(student2.getId(), AttendanceStatus.PRESENT, "Invalid cross-hostel"))
        );

        mockMvc.perform(post("/api/warden/attendance/bulk")
                        .header("Authorization", "Bearer " + wardenBoysToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("6. Inactive or unallocated student cannot be marked for attendance (400 Bad Request)")
    void unallocatedStudentCannotBeMarkedForAttendance() throws Exception {
        LocalDate today = LocalDate.now(ZONE);

        WardenAttendanceBulkRequestDto request = new WardenAttendanceBulkRequestDto(
                boysHostel.getId(),
                today,
                List.of(new WardenAttendanceItemDto(unallocatedStudent.getId(), AttendanceStatus.PRESENT, "Not allocated"))
        );

        mockMvc.perform(post("/api/warden/attendance/bulk")
                        .header("Authorization", "Bearer " + wardenBoysToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------
    // 3. Date Validation Policies
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("7. Future attendance date is strictly rejected (400 Bad Request)")
    void futureDateIsRejected() throws Exception {
        LocalDate tomorrow = LocalDate.now(ZONE).plusDays(1);

        WardenAttendanceBulkRequestDto request = new WardenAttendanceBulkRequestDto(
                boysHostel.getId(),
                tomorrow,
                List.of(new WardenAttendanceItemDto(student1.getId(), AttendanceStatus.PRESENT, null))
        );

        mockMvc.perform(post("/api/warden/attendance/bulk")
                        .header("Authorization", "Bearer " + wardenBoysToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("8. Warden backdating beyond 7 days is rejected (400 Bad Request)")
    void wardenBackdatingBeyond7DaysIsRejected() throws Exception {
        LocalDate eightDaysAgo = LocalDate.now(ZONE).minusDays(8);

        WardenAttendanceBulkRequestDto request = new WardenAttendanceBulkRequestDto(
                boysHostel.getId(),
                eightDaysAgo,
                List.of(new WardenAttendanceItemDto(student1.getId(), AttendanceStatus.PRESENT, null))
        );

        mockMvc.perform(post("/api/warden/attendance/bulk")
                        .header("Authorization", "Bearer " + wardenBoysToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("9. Warden can update single attendance record within allowable window")
    void wardenCanUpdateAttendanceRecord() throws Exception {
        LocalDate today = LocalDate.now(ZONE);
        Attendance existing = attendanceRepository.save(new Attendance(
                student1, today, AttendanceStatus.PRESENT, wardenBoys, "Initial mark"));

        WardenAttendanceUpdateRequestDto updateDto = new WardenAttendanceUpdateRequestDto(
                AttendanceStatus.ABSENT, "Changed to absent after verification");

        mockMvc.perform(put("/api/warden/attendance/" + existing.getId())
                        .header("Authorization", "Bearer " + wardenBoysToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(existing.getId()))
                .andExpect(jsonPath("$.status").value("ABSENT"))
                .andExpect(jsonPath("$.remarks").value("Changed to absent after verification"));
    }

    // -------------------------------------------------------------------------
    // 4. Admin Operations & Summaries
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("10. Admin can access institution-wide attendance summary with per-hostel breakdown")
    void adminCanAccessAttendanceSummary() throws Exception {
        LocalDate today = LocalDate.now(ZONE);

        // Seed 1 attendance in Boys hostel (PRESENT) and 1 in Girls hostel (ON_LEAVE)
        attendanceRepository.save(new Attendance(student1, today, AttendanceStatus.PRESENT, wardenBoys, null));
        attendanceRepository.save(new Attendance(student2, today, AttendanceStatus.ON_LEAVE, wardenGirls, null));

        mockMvc.perform(get("/api/admin/attendance/summary")
                        .param("date", today.toString())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value(today.toString()))
                .andExpect(jsonPath("$.totalActiveResidents").value(2))
                .andExpect(jsonPath("$.totalMarked").value(2))
                .andExpect(jsonPath("$.presentCount").value(1))
                .andExpect(jsonPath("$.onLeaveCount").value(1))
                .andExpect(jsonPath("$.attendancePercentage").value(50.0))
                .andExpect(jsonPath("$.hostelBreakdowns", hasSize(2)));
    }

    @Test
    @DisplayName("11. Admin can filter historical attendance records across hostels")
    void adminCanFilterAttendanceHistory() throws Exception {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate yesterday = today.minusDays(1);

        attendanceRepository.save(new Attendance(student1, today, AttendanceStatus.PRESENT, wardenBoys, "Today record"));
        attendanceRepository.save(new Attendance(student1, yesterday, AttendanceStatus.ABSENT, wardenBoys, "Yesterday record"));

        mockMvc.perform(get("/api/admin/attendance/history")
                        .param("studentId", student1.getId().toString())
                        .param("status", "PRESENT")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].remarks").value("Today record"));
    }

    // -------------------------------------------------------------------------
    // 5. Student Self-Service
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("12. Student can retrieve personal attendance history and monthly summary")
    void studentCanRetrievePersonalAttendanceAndSummary() throws Exception {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate yesterday = today.minusDays(1);

        attendanceRepository.save(new Attendance(student1, today, AttendanceStatus.PRESENT, wardenBoys, "Today roll call"));
        attendanceRepository.save(new Attendance(student1, yesterday, AttendanceStatus.ABSENT, wardenBoys, "Yesterday"));

        // Student 1 history
        mockMvc.perform(get("/api/student/attendance/history")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].studentName").value("Amit Sharma"));

        // Student 1 summary
        mockMvc.perform(get("/api/student/attendance/summary")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentName").value("Amit Sharma"))
                .andExpect(jsonPath("$.totalMarkedDays").value(2))
                .andExpect(jsonPath("$.presentDays").value(1))
                .andExpect(jsonPath("$.absentDays").value(1))
                .andExpect(jsonPath("$.attendancePercentage").value(50.0))
                .andExpect(jsonPath("$.calculationFormula").value(containsString("Present Days / Total Marked Days")));
    }

    @Test
    @DisplayName("13. Student cannot access another student's attendance records")
    void studentCannotAccessOtherStudentAttendance() throws Exception {
        LocalDate today = LocalDate.now(ZONE);
        attendanceRepository.save(new Attendance(student1, today, AttendanceStatus.PRESENT, wardenBoys, "Private Amit record"));

        // Student 2 queries their history: should see 0 records, not Student 1's
        mockMvc.perform(get("/api/student/attendance/history")
                        .header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // -------------------------------------------------------------------------
    // 6. Security Boundaries (401 & 403)
    // -------------------------------------------------------------------------

    @Test
    @DisplayName("14. Unauthenticated request to attendance endpoints returns 401 Unauthorized")
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/warden/attendance").param("hostelId", "1"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/attendance/summary"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/student/attendance/history"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("15. Student cannot access Warden or Admin attendance endpoints (403 Forbidden)")
    void studentCannotAccessWardenOrAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/warden/attendance")
                        .param("hostelId", boysHostel.getId().toString())
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/attendance/summary")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("16. Warden cannot access Admin attendance endpoints (403 Forbidden)")
    void wardenCannotAccessAdminAttendanceEndpoints() throws Exception {
        mockMvc.perform(get("/api/admin/attendance/summary")
                        .header("Authorization", "Bearer " + wardenBoysToken))
                .andExpect(status().isForbidden());
    }
}
