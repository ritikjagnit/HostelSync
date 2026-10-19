package com.hostelsync.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelsync.backend.dto.*;
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
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class HostelAdmissionTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private HostelApplicationRepository applicationRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomAllocationRepository roomAllocationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String wardenToken;
    private Hostel boysHostel;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        // Setup Admin User & Token
        User adminUser = userRepository.findByEmail("test.admin@gpsakoli.ac.in")
                .orElseGet(() -> userRepository.save(new User(
                        "Test Admin",
                        "test.admin@gpsakoli.ac.in",
                        passwordEncoder.encode("Password123!"),
                        Role.ADMIN,
                        true
                )));
        adminToken = jwtTokenProvider.generateToken(adminUser);

        // Setup Warden User & Token
        User wardenUser = userRepository.findByEmail("test.warden@gpsakoli.ac.in")
                .orElseGet(() -> userRepository.save(new User(
                        "Test Warden",
                        "test.warden@gpsakoli.ac.in",
                        passwordEncoder.encode("Password123!"),
                        Role.WARDEN,
                        true
                )));
        wardenToken = jwtTokenProvider.generateToken(wardenUser);

        // Setup Boys Hostel & Room
        boysHostel = hostelRepository.findAll().stream()
                .filter(h -> h.getHostelType() == HostelType.BOYS)
                .findFirst()
                .orElseGet(() -> hostelRepository.save(new Hostel("Sahyadri Test Hostel", HostelType.BOYS, "Sakoli Campus", true)));

        testRoom = roomRepository.findByHostelIdOrderByRoomNumberAsc(boysHostel.getId()).stream()
                .findFirst()
                .orElseGet(() -> roomRepository.save(new Room("T-101", 1, 3, boysHostel)));
    }

    @Test
    @DisplayName("Public student can register for hostel admission and track status")
    void testPublicRegistrationAndStatusTracking() throws Exception {
        HostelApplicationApplyDto applyDto = new HostelApplicationApplyDto(
                "Tanmay Deshmukh",
                "tanmay.deshmukh@example.com",
                "9876543210",
                "EN24TEST99",
                "Diploma in Computer Engineering",
                1,
                "MALE",
                "OBC",
                89.50,
                "Sanjay Deshmukh",
                "9876543200",
                "Tumsar, Dist. Bhandara",
                48.0,
                "Requesting first floor"
        );

        String responseJson = mockMvc.perform(post("/api/admissions/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.applicationNumber", startsWith("HSA-2026-")))
                .andExpect(jsonPath("$.fullName", is("Tanmay Deshmukh")))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andReturn().getResponse().getContentAsString();

        HostelApplicationResponseDto created = objectMapper.readValue(responseJson, HostelApplicationResponseDto.class);

        // Track status using public endpoint
        mockMvc.perform(get("/api/admissions/status/" + created.applicationNumber()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationNumber", is(created.applicationNumber())))
                .andExpect(jsonPath("$.fullName", is("Tanmay Deshmukh")))
                .andExpect(jsonPath("$.status", is("PENDING")));

        // Also track by enrollment number
        mockMvc.perform(get("/api/admissions/track?query=EN24TEST99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enrollmentNumber", is("EN24TEST99")))
                .andExpect(jsonPath("$.status", is("PENDING")));
    }

    @Test
    @DisplayName("Admin or Warden can review, select, and admit a registered student")
    void testHostelInChargeSelectAndAdmitStudent() throws Exception {
        // 1. Submit application
        HostelApplication application = new HostelApplication(
                "HSA-2026-9999",
                "Omkar Ramesh Joshi",
                "omkar.joshi@example.com",
                "9898989898",
                "EN24TEST88",
                "Diploma in Electrical Engineering",
                1,
                "MALE",
                "OPEN",
                91.20,
                "Ramesh Joshi",
                "9898989890",
                "Gondia Road, Sakoli",
                55.0,
                "High merit candidate"
        );
        application.setStatus(ApplicationStatus.PENDING);
        HostelApplication saved = applicationRepository.save(application);

        // 2. Hostel In-charge (Warden) reviews and marks student as SELECTED
        HostelApplicationStatusUpdateDto selectDto = new HostelApplicationStatusUpdateDto(
                ApplicationStatus.SELECTED,
                null,
                "Shortlisted in Merit List 1"
        );

        mockMvc.perform(patch("/api/warden/admissions/" + saved.getId() + "/status")
                        .header("Authorization", "Bearer " + wardenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(selectDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("SELECTED")))
                .andExpect(jsonPath("$.reviewedBy", is("test.warden@gpsakoli.ac.in")));

        // 3. Admin / Hostel In-Charge finalizes admission: assigns room
        HostelApplicationAdmitDto admitDto = new HostelApplicationAdmitDto(
                testRoom.getId(),
                LocalDate.now(),
                "PassSecure123!"
        );

        mockMvc.perform(post("/api/admin/admissions/" + saved.getId() + "/admit")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(admitDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("ADMITTED")))
                .andExpect(jsonPath("$.allocatedRoomNumber", is(testRoom.getRoomNumber())))
                .andExpect(jsonPath("$.allocatedHostelName", is(boysHostel.getName())));

        // 4. Verify student account was automatically provisioned
        User studentUser = userRepository.findByEmail("omkar.joshi@example.com").orElse(null);
        org.junit.jupiter.api.Assertions.assertNotNull(studentUser);
        org.junit.jupiter.api.Assertions.assertEquals(Role.STUDENT, studentUser.getRole());

        Student student = studentRepository.findByEnrollmentNumber("EN24TEST88").orElse(null);
        org.junit.jupiter.api.Assertions.assertNotNull(student);

        // 5. Verify room allocation was created
        boolean hasActiveAlloc = roomAllocationRepository.existsByStudentIdAndStatus(student.getId(), AllocationStatus.ACTIVE);
        org.junit.jupiter.api.Assertions.assertTrue(hasActiveAlloc);
    }
}
