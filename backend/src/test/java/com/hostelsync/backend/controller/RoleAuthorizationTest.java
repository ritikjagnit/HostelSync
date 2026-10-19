package com.hostelsync.backend.controller;

import com.hostelsync.backend.entity.Role;
import com.hostelsync.backend.entity.User;
import com.hostelsync.backend.repository.*;
import com.hostelsync.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RoleAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

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

    @Autowired(required = false)
    private com.hostelsync.backend.repository.ComplaintRepository complaintRepository;

    private String adminToken;
    private String wardenToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        if (complaintRepository != null) {
            complaintRepository.deleteAll();
        }
        attendanceRepository.deleteAll();
        assignmentRepository.deleteAll();
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        userRepository.deleteAll();
        userRepository.flush();

        User admin = userRepository.save(new User(
                "Principal Administrator",
                "auth.admin@gpsakoli.ac.in",
                passwordEncoder.encode("AdminPass123!"),
                Role.ADMIN,
                true
        ));

        User warden = userRepository.save(new User(
                "Hostel Warden",
                "auth.warden@gpsakoli.ac.in",
                passwordEncoder.encode("WardenPass123!"),
                Role.WARDEN,
                true
        ));

        User student = userRepository.save(new User(
                "Student Resident",
                "auth.student@gpsakoli.ac.in",
                passwordEncoder.encode("StudentPass123!"),
                Role.STUDENT,
                true
        ));

        adminToken = jwtTokenProvider.generateToken(admin);
        wardenToken = jwtTokenProvider.generateToken(warden);
        studentToken = jwtTokenProvider.generateToken(student);
    }

    @Test
    @DisplayName("ADMIN role can access /api/admin/overview")
    void adminCanAccessAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portal").value("ADMIN_PORTAL"))
                .andExpect(jsonPath("$.status").value("AUTHORIZED"));
    }

    @Test
    @DisplayName("STUDENT role is forbidden (403) from accessing /api/admin/overview")
    void studentForbiddenFromAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("WARDEN role is forbidden (403) from accessing /api/admin/overview")
    void wardenForbiddenFromAdminEndpoint() throws Exception {
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("WARDEN role can access /api/warden/overview")
    void wardenCanAccessWardenEndpoint() throws Exception {
        mockMvc.perform(get("/api/warden/overview")
                        .header("Authorization", "Bearer " + wardenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portal").value("WARDEN_PORTAL"))
                .andExpect(jsonPath("$.status").value("AUTHORIZED"));
    }

    @Test
    @DisplayName("STUDENT role is forbidden (403) from accessing /api/warden/overview")
    void studentForbiddenFromWardenEndpoint() throws Exception {
        mockMvc.perform(get("/api/warden/overview")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("STUDENT role can access /api/student/overview")
    void studentCanAccessStudentEndpoint() throws Exception {
        mockMvc.perform(get("/api/student/overview")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portal").value("STUDENT_PORTAL"))
                .andExpect(jsonPath("$.status").value("AUTHORIZED"));
    }

    @Test
    @DisplayName("Unauthenticated request to protected endpoint returns 401 Unauthorized")
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
