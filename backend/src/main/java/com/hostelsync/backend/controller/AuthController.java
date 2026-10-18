package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.AuthResponseDto;
import com.hostelsync.backend.dto.LoginRequestDto;
import com.hostelsync.backend.dto.UserSummaryDto;
import com.hostelsync.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller managing authentication and current user profile retrieval.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Authenticates credentials and returns a signed JWT token.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto loginRequest) {
        AuthResponseDto response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves authenticated user summary from the active security context.
     */
    @GetMapping("/me")
    public ResponseEntity<UserSummaryDto> getCurrentUser(Authentication authentication) {
        UserSummaryDto userSummary = authService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(userSummary);
    }
}
