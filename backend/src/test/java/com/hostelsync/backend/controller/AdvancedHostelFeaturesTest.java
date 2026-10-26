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
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdvancedHostelFeaturesTest {

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
    private GatePassRepository gatePassRepository;

    @Autowired
    private HostelNoticeRepository noticeRepository;

    @Autowired
    private FeeRecordRepository feeRecordRepository;

    @Autowired
    private MealFeedbackRepository mealFeedbackRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String wardenToken;
    private String studentToken;
    private Student testStudent;
    private Hostel testHostel;

    @BeforeEach
    void setUp() {
        gatePassRepository.deleteAll();
        feeRecordRepository.deleteAll();
        mealFeedbackRepository.deleteAll();
        noticeRepository.deleteAll();
        roomAllocationRepository.deleteAll();
        assignmentRepository.deleteAll();
        studentRepository.deleteAll();
        userRepository.deleteAll();
        userRepository.flush();

        User adminUser = userRepository.save(new User(
                "Test Admin", "admin.test@gpsakoli.ac.in", passwordEncoder.encode("Password123!"), Role.ADMIN, true
        ));
        User wardenUser = userRepository.save(new User(
                "Test Warden", "warden.test@gpsakoli.ac.in", passwordEncoder.encode("Password123!"), Role.WARDEN, true
        ));
        User studentUser = userRepository.save(new User(
                "Test Student", "student.test@gpsakoli.ac.in", passwordEncoder.encode("Password123!"), Role.STUDENT, true
        ));

        adminToken = jwtTokenProvider.generateToken(adminUser);
        wardenToken = jwtTokenProvider.generateToken(wardenUser);
        studentToken = jwtTokenProvider.generateToken(studentUser);

        testHostel = hostelRepository.findAll().stream().findFirst().orElseGet(() ->
                hostelRepository.save(new Hostel("Sahyadri Test", HostelType.BOYS, "Campus", true))
        );

        Room room = roomRepository.save(new Room("901", 1, 3, testHostel));
        assignmentRepository.save(new WardenHostelAssignment(wardenUser, testHostel));

        testStudent = studentRepository.save(new Student(
                "EN26999", "Computer Engineering", 4, "9876543299", studentUser
        ));

        roomAllocationRepository.save(new RoomAllocation(
                testStudent, room, LocalDate.now().minusDays(10), null, AllocationStatus.ACTIVE
        ));
    }

    @Test
    @DisplayName("Gate Pass: Student can apply and Warden can approve & record exit/entry")
    void testGatePassLifecycle() throws Exception {
        GatePassRequestDto request = new GatePassRequestDto(
                GatePassType.DAY_OUTING,
                "Purchase engineering books from Sakoli Market",
                "Sakoli Main Market",
                LocalDateTime.now().plusHours(2),
                LocalDateTime.now().plusHours(5),
                "9876543299"
        );

        // 1. Student apply
        String responseJson = mockMvc.perform(post("/api/student/gatepass")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.passNumber").exists())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();

        GatePassResponseDto pass = objectMapper.readValue(responseJson, GatePassResponseDto.class);

        // 2. Warden approve
        GatePassStatusUpdateDto approveDto = new GatePassStatusUpdateDto(GatePassStatus.APPROVED, "Approved for 3 hours.");
        mockMvc.perform(patch("/api/warden/gatepass/" + pass.id() + "/status")
                        .header("Authorization", "Bearer " + wardenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // 3. Mark Out of Campus
        mockMvc.perform(patch("/api/warden/gatepass/" + pass.id() + "/mark-exit")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OUT_OF_CAMPUS"));

        // 4. Mark Returned
        mockMvc.perform(patch("/api/warden/gatepass/" + pass.id() + "/mark-entry")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"));
    }

    @Test
    @DisplayName("Notice Board: Admin can post notice and Student can retrieve it")
    void testNoticeBoardFlow() throws Exception {
        NoticeCreateDto noticeDto = new NoticeCreateDto(
                "Winter Carnival 2026",
                "Grand cultural celebration in hostel quadrangle.",
                NoticeCategory.GENERAL,
                NoticePriority.IMPORTANT,
                NoticeTarget.ALL,
                true,
                testHostel.getId()
        );

        mockMvc.perform(post("/api/admin/notices")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noticeDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Winter Carnival 2026"));

        mockMvc.perform(get("/api/student/notices")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Winter Carnival 2026"));
    }

    @Test
    @DisplayName("Mess Management: Student can view menu and submit feedback")
    void testMessFlow() throws Exception {
        mockMvc.perform(get("/api/student/mess/menu")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(7));

        MealFeedbackCreateDto feedbackDto = new MealFeedbackCreateDto(
                MealType.LUNCH, 5, 5, "Dal tadka and paneer were delicious."
        );

        mockMvc.perform(post("/api/student/mess/feedback")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(feedbackDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5));
    }

    @Test
    @DisplayName("Fee Management: Admin creates fee demand, marks payment, and evaluates No-Dues")
    void testFeeAndNoDuesFlow() throws Exception {
        FeeRecordCreateDto feeDto = new FeeRecordCreateDto(
                testStudent.getId(),
                "2025-26",
                4,
                FeeType.HOSTEL_RENT,
                3500.0,
                LocalDate.now().plusDays(30),
                "Semester 4 Rent"
        );

        String feeRes = mockMvc.perform(post("/api/admin/fees")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(feeDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();

        FeeResponseDto createdFee = objectMapper.readValue(feeRes, FeeResponseDto.class);

        // Student checks No Dues before payment -> should NOT be eligible
        mockMvc.perform(get("/api/student/fees/no-dues-status")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isEligibleForNoDues").value(false));

        // Record full payment
        FeePaymentDto paymentDto = new FeePaymentDto(3500.0, "ONLINE_UPI", "UPI123456", "Paid via SBI Collect");
        mockMvc.perform(patch("/api/admin/fees/" + createdFee.id() + "/pay")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        // Student checks No Dues after payment -> should be eligible!
        mockMvc.perform(get("/api/student/fees/no-dues-status")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isEligibleForNoDues").value(true))
                .andExpect(jsonPath("$.certificateNumber").exists());
    }

    @Test
    @DisplayName("Analytics: Admin can retrieve executive campus overview")
    void testExecutiveAnalytics() throws Exception {
        mockMvc.perform(get("/api/admin/analytics/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalHostels").exists())
                .andExpect(jsonPath("$.activeResidents").exists())
                .andExpect(jsonPath("$.occupancyRate").exists());
    }
}
