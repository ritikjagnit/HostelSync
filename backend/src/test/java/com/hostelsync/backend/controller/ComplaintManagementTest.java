package com.hostelsync.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelsync.backend.dto.ComplaintCreateDto;
import com.hostelsync.backend.dto.ComplaintStatusUpdateDto;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ComplaintManagementTest {

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
    private WardenHostelAssignmentRepository wardenAssignmentRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String studentToken;
    private String otherStudentToken;
    private String wardenToken;
    private String adminToken;

    private Student residentStudent;
    private Student otherStudent;
    private Hostel testHostel;
    private Room testRoom;

    @BeforeEach
    void setUp() {
        complaintRepository.deleteAll();
        User residentUser = userRepository.findByEmail("amit.sharma@gpsakoli.ac.in").orElseGet(() ->
                userRepository.save(new User("Amit Sharma", "amit.sharma@gpsakoli.ac.in", passwordEncoder.encode("Pass@123"), Role.STUDENT, true))
        );
        residentStudent = studentRepository.findByUserEmail("amit.sharma@gpsakoli.ac.in").orElseGet(() ->
                studentRepository.save(new Student("EN240101", "Diploma in Computer Engineering", 3, "9876543210", residentUser))
        );
        studentToken = jwtTokenProvider.generateToken(residentUser);

        User otherUser = userRepository.findByEmail("other.student@gpsakoli.ac.in").orElseGet(() ->
                userRepository.save(new User("Other Student", "other.student@gpsakoli.ac.in", passwordEncoder.encode("Pass@123"), Role.STUDENT, true))
        );
        otherStudent = studentRepository.findByEnrollmentNumber("EN24109899").orElseGet(() ->
                studentRepository.save(new Student("EN24109899", "Diploma in Civil Engineering", 1, "9876543299", otherUser))
        );
        otherStudentToken = jwtTokenProvider.generateToken(otherUser);

        testHostel = hostelRepository.findAll().stream().findFirst().orElseGet(() ->
                hostelRepository.save(new Hostel("Test Boys Hostel", HostelType.BOYS, "Campus Sakoli", true))
        );

        testRoom = roomRepository.findByHostelIdAndRoomNumber(testHostel.getId(), "101").orElseGet(() ->
                roomRepository.save(new Room("101", 1, 3, testHostel))
        );

        if (!roomAllocationRepository.existsByStudentIdAndStatus(residentStudent.getId(), AllocationStatus.ACTIVE)) {
            roomAllocationRepository.save(new RoomAllocation(residentStudent, testRoom, LocalDate.now(), null, AllocationStatus.ACTIVE));
        }

        User wardenUser = userRepository.findByEmail("warden.boys@gpsakoli.ac.in").orElseGet(() ->
                userRepository.save(new User("Warden Boys", "warden.boys@gpsakoli.ac.in", passwordEncoder.encode("Pass@123"), Role.WARDEN, true))
        );
        if (!wardenAssignmentRepository.existsByWardenEmailAndHostelId("warden.boys@gpsakoli.ac.in", testHostel.getId())) {
            wardenAssignmentRepository.save(new WardenHostelAssignment(wardenUser, testHostel));
        }
        wardenToken = jwtTokenProvider.generateToken(wardenUser);

        User adminUser = userRepository.findByEmail("admin@gpsakoli.ac.in").orElseGet(() ->
                userRepository.save(new User("Admin User", "admin@gpsakoli.ac.in", passwordEncoder.encode("Pass@123"), Role.ADMIN, true))
        );
        adminToken = jwtTokenProvider.generateToken(adminUser);
    }

    @Test
    @DisplayName("Student submits a new room complaint successfully")
    void shouldSubmitComplaintSuccessfullyAsStudent() throws Exception {
        ComplaintCreateDto dto = new ComplaintCreateDto(
                "Leaking Washroom Tap",
                "The sink tap in room 101 has water continuously dripping.",
                ComplaintCategory.PLUMBING,
                ComplaintUrgency.MEDIUM,
                testRoom.getId()
        );

        mockMvc.perform(post("/api/student/complaints")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ticketNumber", startsWith("CMP-")))
                .andExpect(jsonPath("$.title", is("Leaking Washroom Tap")))
                .andExpect(jsonPath("$.category", is("PLUMBING")))
                .andExpect(jsonPath("$.urgency", is("MEDIUM")))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.studentName", is("Amit Sharma")));
    }

    @Test
    @DisplayName("Validation fails when complaint title is blank")
    void shouldFailSubmitComplaintWhenTitleBlank() throws Exception {
        ComplaintCreateDto dto = new ComplaintCreateDto(
                "",
                "Valid description text.",
                ComplaintCategory.ELECTRICAL,
                ComplaintUrgency.LOW,
                testRoom.getId()
        );

        mockMvc.perform(post("/api/student/complaints")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Student retrieves their own complaints list")
    void shouldGetStudentComplaintsList() throws Exception {
        mockMvc.perform(get("/api/student/complaints")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(Iterable.class)));
    }

    @Test
    @DisplayName("Cross-student access to complaint detail is forbidden")
    void shouldPreventCrossStudentComplaintDetailAccess() throws Exception {
        // Create complaint as resident student
        Complaint c = new Complaint();
        c.setTicketNumber("CMP-ISOLATION-01");
        c.setStudent(residentStudent);
        c.setHostel(testHostel);
        c.setRoom(testRoom);
        c.setTitle("Private room issue");
        c.setDescription("Resident student only details.");
        c.setCategory(ComplaintCategory.CARPENTRY);
        c.setUrgency(ComplaintUrgency.LOW);
        c.setStatus(ComplaintStatus.PENDING);
        Complaint saved = complaintRepository.save(c);

        // Other student attempts to access
        mockMvc.perform(get("/api/student/complaints/" + saved.getId())
                        .header("Authorization", "Bearer " + otherStudentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Warden views assigned hostel complaints and summary stats")
    void shouldAllowWardenToViewAssignedHostelComplaints() throws Exception {
        mockMvc.perform(get("/api/warden/complaints")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(Iterable.class)));

        mockMvc.perform(get("/api/warden/complaints/stats")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalComplaints", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("Warden updates complaint status to IN_PROGRESS with resolution notes")
    void shouldAllowWardenToUpdateStatusWithResolutionNotes() throws Exception {
        Complaint c = new Complaint();
        c.setTicketNumber("CMP-RESOLVE-01");
        c.setStudent(residentStudent);
        c.setHostel(testHostel);
        c.setRoom(testRoom);
        c.setTitle("Fuse blown");
        c.setDescription("Main switchboard fuse blown.");
        c.setCategory(ComplaintCategory.ELECTRICAL);
        c.setUrgency(ComplaintUrgency.HIGH);
        c.setStatus(ComplaintStatus.PENDING);
        Complaint saved = complaintRepository.save(c);

        ComplaintStatusUpdateDto updateDto = new ComplaintStatusUpdateDto(
                ComplaintStatus.RESOLVED,
                "Fuse replaced with new 16A cartridge."
        );

        mockMvc.perform(patch("/api/warden/complaints/" + saved.getId() + "/status")
                        .header("Authorization", "Bearer " + wardenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RESOLVED")))
                .andExpect(jsonPath("$.resolutionNotes", is("Fuse replaced with new 16A cartridge.")));
    }

    @Test
    @DisplayName("Admin views all institutional complaints and statistics")
    void shouldAllowAdminToViewAllComplaintsAndStats() throws Exception {
        mockMvc.perform(get("/api/admin/complaints")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", isA(Iterable.class)));

        mockMvc.perform(get("/api/admin/complaints/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalComplaints", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("Unauthenticated request to submit complaint is rejected with 401")
    void shouldRejectUnauthenticatedAccess() throws Exception {
        ComplaintCreateDto dto = new ComplaintCreateDto(
                "Unauthorized test",
                "Description",
                ComplaintCategory.OTHER,
                ComplaintUrgency.LOW,
                null
        );

        mockMvc.perform(post("/api/student/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Student role cannot access admin complaints oversight endpoint")
    void shouldRejectStudentFromAccessingAdminComplaints() throws Exception {
        mockMvc.perform(get("/api/admin/complaints")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @AfterEach
    void tearDown() {
        complaintRepository.deleteAll();
    }
}
