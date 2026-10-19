package com.hostelsync.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelsync.backend.dto.LoginRequestDto;
import com.hostelsync.backend.entity.Role;
import com.hostelsync.backend.entity.User;
import com.hostelsync.backend.repository.*;
import com.hostelsync.backend.security.JwtTokenProvider;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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

    @Value("${jwt.secret}")
    private String jwtSecret;

    private User activeStudentUser;
    private User inactiveUser;

    @BeforeEach
    void setUp() {
        attendanceRepository.deleteAll();
        assignmentRepository.deleteAll();
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        userRepository.deleteAll();

        activeStudentUser = new User(
                "Gaurav Patil",
                "gaurav.patil@gpsakoli.ac.in",
                passwordEncoder.encode("SecurePass123!"),
                Role.STUDENT,
                true
        );
        userRepository.save(activeStudentUser);

        inactiveUser = new User(
                "Inactive User",
                "inactive@gpsakoli.ac.in",
                passwordEncoder.encode("SecurePass123!"),
                Role.STUDENT,
                false
        );
        userRepository.save(inactiveUser);
    }

    @Test
    @DisplayName("POST /api/auth/login succeeds with valid credentials and excludes passwordHash")
    void loginSuccess() throws Exception {
        LoginRequestDto request = new LoginRequestDto("gaurav.patil@gpsakoli.ac.in", "SecurePass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("gaurav.patil@gpsakoli.ac.in"))
                .andExpect(jsonPath("$.user.fullName").value("Gaurav Patil"))
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.user.active").value(true))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/login rejects invalid password with 401 Unauthorized")
    void loginFailsWithWrongPassword() throws Exception {
        LoginRequestDto request = new LoginRequestDto("gaurav.patil@gpsakoli.ac.in", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("POST /api/auth/login rejects non-existent email with 401 Unauthorized")
    void loginFailsWithUnknownEmail() throws Exception {
        LoginRequestDto request = new LoginRequestDto("nonexistent@gpsakoli.ac.in", "AnyPassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("POST /api/auth/login rejects inactive account with 401 Unauthorized")
    void loginFailsForInactiveUser() throws Exception {
        LoginRequestDto request = new LoginRequestDto("inactive@gpsakoli.ac.in", "SecurePass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message", containsString("inactive")));
    }

    @Test
    @DisplayName("GET /api/auth/me returns current user summary when authenticated with valid token")
    void getCurrentUserWithValidToken() throws Exception {
        String token = jwtTokenProvider.generateToken(activeStudentUser);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("gaurav.patil@gpsakoli.ac.in"))
                .andExpect(jsonPath("$.fullName").value("Gaurav Patil"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("GET /api/auth/me returns 401 Unauthorized when missing token")
    void getCurrentUserFailsWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/auth/me returns 401 Unauthorized with malformed token")
    void getCurrentUserFailsWithMalformedToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer malformed.invalid.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/auth/me returns 401 Unauthorized with expired token")
    void getCurrentUserFailsWithExpiredToken() throws Exception {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Date past = new Date(System.currentTimeMillis() - 100000);
        String expiredToken = Jwts.builder()
                .subject(activeStudentUser.getEmail())
                .claim("userId", activeStudentUser.getId())
                .claim("fullName", activeStudentUser.getFullName())
                .claim("role", activeStudentUser.getRole().name())
                .issuedAt(new Date(past.getTime() - 100000))
                .expiration(past)
                .signWith(key)
                .compact();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/health remains publicly accessible without authentication")
    void healthEndpointRemainsPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.application").value("HostelSync"));
    }
}

