package com.hostelsync.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelsync.backend.dto.WardenAssignmentRequestDto;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class WardenOperationsTest {

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
    private User wardenAUser; // assigned to Hostel 1 (Sahyadri)
    private User wardenBUser; // assigned to Hostel 2 (Kaveri)
    private User unassignedWarden; // no hostels assigned
    private User studentUser;

    private String adminToken;
    private String wardenAToken;
    private String wardenBToken;
    private String unassignedWardenToken;
    private String studentToken;

    private Hostel hostelSahyadri;
    private Hostel hostelKaveri;
    private Room room101; // in Sahyadri
    private Room roomG01; // in Kaveri
    private Student student1; // allocated to room 101 in Sahyadri
    private Student student2; // allocated to room G01 in Kaveri
    private RoomAllocation allocation1; // in Sahyadri
    private RoomAllocation allocation2; // in Kaveri

    @BeforeEach
    void setUp() {
        attendanceRepository.deleteAll();
        assignmentRepository.deleteAll();
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        roomRepository.deleteAll();
        hostelRepository.deleteAll();
        userRepository.deleteAll();

        String encodedPwd = passwordEncoder.encode("TestPass123!");

        // 1. Create Users
        adminUser = userRepository.save(new User("Principal Admin", "admin@gpsakoli.ac.in", encodedPwd, Role.ADMIN, true));
        wardenAUser = userRepository.save(new User("Ramesh Patil (Warden A)", "warden.a@gpsakoli.ac.in", encodedPwd, Role.WARDEN, true));
        wardenBUser = userRepository.save(new User("Sunita Deshmukh (Warden B)", "warden.b@gpsakoli.ac.in", encodedPwd, Role.WARDEN, true));
        unassignedWarden = userRepository.save(new User("New Warden", "new.warden@gpsakoli.ac.in", encodedPwd, Role.WARDEN, true));
        studentUser = userRepository.save(new User("Amit Resident", "amit@gpsakoli.ac.in", encodedPwd, Role.STUDENT, true));
        User studentUser2 = userRepository.save(new User("Priya Resident", "priya@gpsakoli.ac.in", encodedPwd, Role.STUDENT, true));

        // 2. Generate Tokens
        adminToken = jwtTokenProvider.generateToken(adminUser);
        wardenAToken = jwtTokenProvider.generateToken(wardenAUser);
        wardenBToken = jwtTokenProvider.generateToken(wardenBUser);
        unassignedWardenToken = jwtTokenProvider.generateToken(unassignedWarden);
        studentToken = jwtTokenProvider.generateToken(studentUser);

        // 3. Create Hostels
        hostelSahyadri = hostelRepository.save(new Hostel("Sahyadri Boys Hostel", HostelType.BOYS, "Campus Block A", true));
        hostelKaveri = hostelRepository.save(new Hostel("Kaveri Girls Hostel", HostelType.GIRLS, "Campus Block B", true));

        // 4. Create Rooms
        room101 = roomRepository.save(new Room("101", 1, 3, hostelSahyadri));
        roomG01 = roomRepository.save(new Room("G01", 1, 2, hostelKaveri));

        // 5. Create Students
        student1 = studentRepository.save(new Student("EN2026CS101", "Computer Engineering", 4, "9876500001", studentUser));
        student2 = studentRepository.save(new Student("EN2026EE102", "Electrical Engineering", 2, "9876500002", studentUser2));

        // 6. Create Allocations
        allocation1 = roomAllocationRepository.save(new RoomAllocation(
                student1, room101, LocalDate.now().minusDays(10), null, AllocationStatus.ACTIVE
        ));
        allocation2 = roomAllocationRepository.save(new RoomAllocation(
                student2, roomG01, LocalDate.now().minusDays(5), null, AllocationStatus.ACTIVE
        ));

        // 7. Assign Hostel 1 to Warden A, and Hostel 2 to Warden B
        assignmentRepository.save(new WardenHostelAssignment(wardenAUser, hostelSahyadri));
        assignmentRepository.save(new WardenHostelAssignment(wardenBUser, hostelKaveri));
    }

    @AfterEach
    void tearDown() {
        assignmentRepository.deleteAll();
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        roomRepository.deleteAll();
        hostelRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ==========================================
    // 1. Dashboard & Scoped Metrics Tests
    // ==========================================

    @Test
    @DisplayName("Warden A can view dashboard statistics scoped exclusively to assigned hostel")
    void wardenASeesScopedDashboard() throws Exception {
        mockMvc.perform(get("/api/warden/dashboard")
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.wardenEmail").value("warden.a@gpsakoli.ac.in"))
                .andExpect(jsonPath("$.totalAssignedHostels").value(1))
                .andExpect(jsonPath("$.totalRooms").value(1))
                .andExpect(jsonPath("$.totalCapacity").value(3))
                .andExpect(jsonPath("$.totalOccupiedBeds").value(1))
                .andExpect(jsonPath("$.totalAvailableBeds").value(2))
                .andExpect(jsonPath("$.occupancyRate").value(33.3))
                .andExpect(jsonPath("$.hostels", hasSize(1)))
                .andExpect(jsonPath("$.hostels[0].name").value("Sahyadri Boys Hostel"))
                .andExpect(jsonPath("$.recentAllocations", hasSize(1)))
                .andExpect(jsonPath("$.recentAllocations[0].studentName").value("Amit Resident"));
    }

    @Test
    @DisplayName("Unassigned Warden sees empty dashboard with zero counts and empty lists")
    void unassignedWardenSeesZeroCountsDashboard() throws Exception {
        mockMvc.perform(get("/api/warden/dashboard")
                        .header("Authorization", "Bearer " + unassignedWardenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.wardenEmail").value("new.warden@gpsakoli.ac.in"))
                .andExpect(jsonPath("$.totalAssignedHostels").value(0))
                .andExpect(jsonPath("$.totalRooms").value(0))
                .andExpect(jsonPath("$.totalCapacity").value(0))
                .andExpect(jsonPath("$.totalOccupiedBeds").value(0))
                .andExpect(jsonPath("$.totalAvailableBeds").value(0))
                .andExpect(jsonPath("$.occupancyRate").value(0.0))
                .andExpect(jsonPath("$.hostels", hasSize(0)))
                .andExpect(jsonPath("$.recentAllocations", hasSize(0)));
    }

    // ==========================================
    // 2. Assigned Hostels & Room Inventory Tests
    // ==========================================

    @Test
    @DisplayName("Warden A lists assigned hostels and does NOT see unassigned Kaveri hostel")
    void wardenAListsOnlyAssignedHostels() throws Exception {
        mockMvc.perform(get("/api/warden/hostels")
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(hostelSahyadri.getId()))
                .andExpect(jsonPath("$[0].name").value("Sahyadri Boys Hostel"))
                .andExpect(jsonPath("$[0].occupiedBeds").value(1))
                .andExpect(jsonPath("$[0].availableBeds").value(2));
    }

    @Test
    @DisplayName("Warden A can inspect assigned hostel details but is FORBIDDEN from inspecting unassigned hostel")
    void wardenACannotInspectUnassignedHostel() throws Exception {
        // Can access assigned hostel
        mockMvc.perform(get("/api/warden/hostels/" + hostelSahyadri.getId())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sahyadri Boys Hostel"));

        // Forbidden from unassigned hostel (Hostel 2 / Kaveri)
        mockMvc.perform(get("/api/warden/hostels/" + hostelKaveri.getId())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Warden A can view rooms in assigned hostel but is FORBIDDEN from rooms in unassigned hostel")
    void wardenRoomBoundaryEnforced() throws Exception {
        // Authorized rooms
        mockMvc.perform(get("/api/warden/hostels/" + hostelSahyadri.getId() + "/rooms")
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].roomNumber").value("101"))
                .andExpect(jsonPath("$[0].currentOccupancy").value(1))
                .andExpect(jsonPath("$[0].availableBeds").value(2))
                .andExpect(jsonPath("$[0].occupants", hasSize(1)))
                .andExpect(jsonPath("$[0].occupants[0].studentName").value("Amit Resident"));

        // Forbidden rooms list
        mockMvc.perform(get("/api/warden/hostels/" + hostelKaveri.getId() + "/rooms")
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Warden A can view room detail for assigned room but is FORBIDDEN for unassigned room")
    void wardenSingleRoomBoundaryEnforced() throws Exception {
        // Assigned room
        mockMvc.perform(get("/api/warden/rooms/" + room101.getId())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roomNumber").value("101"));

        // Unassigned room in Kaveri
        mockMvc.perform(get("/api/warden/rooms/" + roomG01.getId())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    // ==========================================
    // 3. Resident Directory & Allocation History Tests
    // ==========================================

    @Test
    @DisplayName("Warden A lists active residents in assigned hostel with search filtering")
    void wardenResidentsScopedAndFiltered() throws Exception {
        // Normal list shows Amit Resident, NOT Priya Resident
        mockMvc.perform(get("/api/warden/residents")
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].studentName").value("Amit Resident"))
                .andExpect(jsonPath("$[0].roomNumber").value("101"));

        // Search matching Amit
        mockMvc.perform(get("/api/warden/residents")
                        .param("search", "Amit")
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].enrollmentNumber").value("EN2026CS101"));

        // Search matching Priya (who resides in unassigned hostel) returns empty
        mockMvc.perform(get("/api/warden/residents")
                        .param("search", "Priya")
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Filtering by unassigned hostel returns 403 Forbidden
        mockMvc.perform(get("/api/warden/residents")
                        .param("hostelId", hostelKaveri.getId().toString())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Warden A can inspect allocation in assigned hostel but is FORBIDDEN from allocation in unassigned hostel")
    void wardenAllocationBoundaryEnforced() throws Exception {
        // Assigned allocation
        mockMvc.perform(get("/api/warden/allocations/" + allocation1.getId())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentName").value("Amit Resident"))
                .andExpect(jsonPath("$.hostelName").value("Sahyadri Boys Hostel"));

        // Unassigned allocation in Kaveri
        mockMvc.perform(get("/api/warden/allocations/" + allocation2.getId())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    // ==========================================
    // 4. Role Authorization & Admin Assignment Management Tests
    // ==========================================

    @Test
    @DisplayName("STUDENT role is FORBIDDEN from all Warden endpoints")
    void studentForbiddenFromWardenEndpoints() throws Exception {
        mockMvc.perform(get("/api/warden/dashboard")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mockMvc.perform(get("/api/warden/hostels")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/warden/residents")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated requests return 401 Unauthorized")
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/warden/dashboard"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/warden/hostels"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("WARDEN role is FORBIDDEN from Admin assignment management endpoints")
    void wardenCannotManageAssignments() throws Exception {
        WardenAssignmentRequestDto dto = new WardenAssignmentRequestDto(wardenAUser.getId(), hostelKaveri.getId());

        mockMvc.perform(post("/api/admin/wardens/assignments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/admin/wardens/" + wardenAUser.getId() + "/assignments/" + hostelSahyadri.getId())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ADMIN role can assign and revoke hostels for wardens")
    void adminCanAssignAndRevokeWardenHostels() throws Exception {
        // 1. Admin lists wardens with assignments
        mockMvc.perform(get("/api/admin/wardens")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));

        // 2. Admin assigns Kaveri hostel to Warden A as well
        WardenAssignmentRequestDto assignDto = new WardenAssignmentRequestDto(wardenAUser.getId(), hostelKaveri.getId());
        mockMvc.perform(post("/api/admin/wardens/assignments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignDto))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.wardenEmail").value("warden.a@gpsakoli.ac.in"))
                .andExpect(jsonPath("$.hostelName").value("Kaveri Girls Hostel"));

        // 3. Now Warden A has 2 assigned hostels and can view Kaveri hostel!
        mockMvc.perform(get("/api/warden/hostels/" + hostelKaveri.getId())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Kaveri Girls Hostel"));

        // 4. Duplicate assignment attempt returns 409 Conflict
        mockMvc.perform(post("/api/admin/wardens/assignments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignDto))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict());

        // 5. Admin revokes assignment
        mockMvc.perform(delete("/api/admin/wardens/" + wardenAUser.getId() + "/assignments/" + hostelKaveri.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Warden hostel assignment successfully revoked"));

        // 6. After revocation, Warden A is once again FORBIDDEN from Kaveri hostel
        mockMvc.perform(get("/api/warden/hostels/" + hostelKaveri.getId())
                        .header("Authorization", "Bearer " + wardenAToken))
                .andExpect(status().isForbidden());
    }
}
