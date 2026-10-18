package com.hostelsync.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelsync.backend.dto.HostelRequestDto;
import com.hostelsync.backend.dto.HostelStatusRequestDto;
import com.hostelsync.backend.dto.RoomRequestDto;
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
class AdminHostelManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomAllocationRepository roomAllocationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String wardenToken;
    private String studentToken;

    private Hostel boysHostel;
    private Room room101;

    @BeforeEach
    void setUp() {
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        roomRepository.deleteAll();
        hostelRepository.deleteAll();
        userRepository.deleteAll();

        User admin = userRepository.save(new User(
                "Principal Admin",
                "admin.hostel@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.ADMIN,
                true
        ));

        User warden = userRepository.save(new User(
                "Hostel Warden",
                "warden.hostel@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.WARDEN,
                true
        ));

        User student = userRepository.save(new User(
                "Student User",
                "student.hostel@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.STUDENT,
                true
        ));

        adminToken = jwtTokenProvider.generateToken(admin);
        wardenToken = jwtTokenProvider.generateToken(warden);
        studentToken = jwtTokenProvider.generateToken(student);

        boysHostel = hostelRepository.save(new Hostel(
                "Sahyadri Boys Hostel",
                HostelType.BOYS,
                "Campus Block A, GP Sakoli",
                true
        ));

        room101 = roomRepository.save(new Room(
                "101",
                1,
                3,
                boysHostel
        ));
    }

    @Test
    @DisplayName("GET /api/admin/hostels returns 200 with inventory metrics for ADMIN")
    void getAllHostelsSuccess() throws Exception {
        mockMvc.perform(get("/api/admin/hostels")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Sahyadri Boys Hostel"))
                .andExpect(jsonPath("$[0].hostelType").value("BOYS"))
                .andExpect(jsonPath("$[0].totalRooms").value(1))
                .andExpect(jsonPath("$[0].totalCapacity").value(3))
                .andExpect(jsonPath("$[0].availableBeds").value(3));
    }

    @Test
    @DisplayName("GET /api/admin/hostels rejects unauthenticated and non-admin requests")
    void getAllHostelsAuthorizationEnforcement() throws Exception {
        // Unauthenticated -> 401
        mockMvc.perform(get("/api/admin/hostels"))
                .andExpect(status().isUnauthorized());

        // WARDEN -> 403
        mockMvc.perform(get("/api/admin/hostels")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isForbidden());

        // STUDENT -> 403
        mockMvc.perform(get("/api/admin/hostels")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/hostels/{id} returns 200 for existing and 404 for missing")
    void getHostelById() throws Exception {
        mockMvc.perform(get("/api/admin/hostels/" + boysHostel.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(boysHostel.getId()))
                .andExpect(jsonPath("$.name").value("Sahyadri Boys Hostel"));

        mockMvc.perform(get("/api/admin/hostels/99999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("POST /api/admin/hostels creates hostel and returns 201 Created")
    void createHostelSuccess() throws Exception {
        HostelRequestDto request = new HostelRequestDto(
                "Jijau Girls Hostel",
                HostelType.GIRLS,
                "Campus Block B, GP Sakoli",
                true
        );

        mockMvc.perform(post("/api/admin/hostels")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("/api/admin/hostels/")))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Jijau Girls Hostel"))
                .andExpect(jsonPath("$.hostelType").value("GIRLS"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("POST /api/admin/hostels validates blank fields and rejects duplicates")
    void createHostelValidationAndDuplicates() throws Exception {
        // Validation: blank name
        HostelRequestDto invalid = new HostelRequestDto(
                "",
                HostelType.BOYS,
                "Address",
                true
        );

        mockMvc.perform(post("/api/admin/hostels")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.name").isNotEmpty());

        // Duplicate name
        HostelRequestDto duplicate = new HostelRequestDto(
                "sahyadri boys hostel",
                HostelType.BOYS,
                "Another address",
                true
        );

        mockMvc.perform(post("/api/admin/hostels")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("PUT /api/admin/hostels/{id} updates existing hostel")
    void updateHostelSuccess() throws Exception {
        HostelRequestDto update = new HostelRequestDto(
                "Sahyadri Boys Hostel (Renovated)",
                HostelType.BOYS,
                "Campus Block A - North Wing, GP Sakoli",
                true
        );

        mockMvc.perform(put("/api/admin/hostels/" + boysHostel.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sahyadri Boys Hostel (Renovated)"))
                .andExpect(jsonPath("$.address").value("Campus Block A - North Wing, GP Sakoli"));
    }

    @Test
    @DisplayName("PATCH /api/admin/hostels/{id}/status toggles active status and blocks unsafe deactivation")
    void toggleHostelStatusAndPreventUnsafeDeactivation() throws Exception {
        // Normal deactivation when no active allocations
        mockMvc.perform(patch("/api/admin/hostels/" + boysHostel.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HostelStatusRequestDto(false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        // Re-activate
        mockMvc.perform(patch("/api/admin/hostels/" + boysHostel.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HostelStatusRequestDto(true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));

        // Now simulate an active allocation in room101
        User studentUser = userRepository.save(new User(
                "Rahul Sharma",
                "rahul@gpsakoli.ac.in",
                "hash",
                Role.STUDENT,
                true
        ));
        Student resident = studentRepository.save(new Student(
                "EN_2026_099",
                "Civil Engineering",
                3,
                "9876543210",
                studentUser
        ));
        roomAllocationRepository.save(new RoomAllocation(
                resident,
                room101,
                LocalDate.now(),
                null,
                AllocationStatus.ACTIVE
        ));

        // Attempt deactivation should be blocked with 409 Conflict
        mockMvc.perform(patch("/api/admin/hostels/" + boysHostel.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new HostelStatusRequestDto(false))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("active student room allocations")));
    }

    @Test
    @DisplayName("POST /api/admin/hostels/{hostelId}/rooms creates room and rejects duplicates")
    void createRoomAndEnforceUniqueness() throws Exception {
        // Create Room 102
        RoomRequestDto room102 = new RoomRequestDto("102", 1, 4);

        mockMvc.perform(post("/api/admin/hostels/" + boysHostel.getId() + "/rooms")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(room102)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.roomNumber").value("102"))
                .andExpect(jsonPath("$.floor").value(1))
                .andExpect(jsonPath("$.capacity").value(4))
                .andExpect(jsonPath("$.availableBeds").value(4));

        // Attempt creating duplicate room "101" in same hostel
        RoomRequestDto duplicate101 = new RoomRequestDto("101", 1, 2);

        mockMvc.perform(post("/api/admin/hostels/" + boysHostel.getId() + "/rooms")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate101)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    @DisplayName("POST /api/admin/hostels/{hostelId}/rooms validates negative floor and capacity")
    void createRoomValidationErrors() throws Exception {
        RoomRequestDto invalid = new RoomRequestDto("201", -1, 0);

        mockMvc.perform(post("/api/admin/hostels/" + boysHostel.getId() + "/rooms")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.floor").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.capacity").isNotEmpty());
    }

    @Test
    @DisplayName("PUT /api/admin/rooms/{id} updates room and prevents capacity reduction below active allocations")
    void updateRoomAndPreventUnsafeCapacityReduction() throws Exception {
        // Add 2 active allocations to room101
        for (int i = 1; i <= 2; i++) {
            User u = userRepository.save(new User("Occupant " + i, "occ" + i + "@gpsakoli.ac.in", "hash", Role.STUDENT, true));
            Student s = studentRepository.save(new Student("EN_OCC_" + i, "ME", 1, "999999999" + i, u));
            roomAllocationRepository.save(new RoomAllocation(s, room101, LocalDate.now(), null, AllocationStatus.ACTIVE));
        }

        // Updating capacity to 4 is safe
        RoomRequestDto expand = new RoomRequestDto("101", 1, 4);
        mockMvc.perform(put("/api/admin/rooms/" + room101.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expand)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.capacity").value(4))
                .andExpect(jsonPath("$.activeAllocations").value(2))
                .andExpect(jsonPath("$.availableBeds").value(2));

        // Attempting to reduce capacity to 1 (when 2 are active) must be rejected with 409 Conflict
        RoomRequestDto unsafeShrink = new RoomRequestDto("101", 1, 1);
        mockMvc.perform(put("/api/admin/rooms/" + room101.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unsafeShrink)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Cannot reduce room capacity")));
    }

    @Test
    @DisplayName("GET /api/admin/dashboard returns real aggregated counts")
    void getAdminDashboardStats() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalHostels").value(1))
                .andExpect(jsonPath("$.activeHostels").value(1))
                .andExpect(jsonPath("$.totalRooms").value(1))
                .andExpect(jsonPath("$.totalCapacity").value(3))
                .andExpect(jsonPath("$.activeAllocations").value(0))
                .andExpect(jsonPath("$.availableBeds").value(3))
                .andExpect(jsonPath("$.hostels", hasSize(1)));
    }
}
