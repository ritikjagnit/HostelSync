package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.AuthResponseDto;
import com.hostelsync.backend.dto.LoginRequestDto;
import com.hostelsync.backend.dto.UserSummaryDto;
import com.hostelsync.backend.entity.User;
import com.hostelsync.backend.repository.UserRepository;
import com.hostelsync.backend.security.JwtTokenProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing user authentication, credential validation, and profile retrieval.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    /**
     * Authenticates credentials, checks account active status, and returns signed JWT token.
     */
    @Transactional(readOnly = true)
    public AuthResponseDto login(LoginRequestDto loginRequest) {
        User user = userRepository.findByEmail(loginRequest.email().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isActive()) {
            throw new DisabledException("User account is inactive. Please contact administration.");
        }

        if (!passwordEncoder.matches(loginRequest.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = tokenProvider.generateToken(user);
        UserSummaryDto userSummary = UserSummaryDto.fromEntity(user);

        return AuthResponseDto.of(token, tokenProvider.getExpirationMs(), userSummary);
    }

    /**
     * Fetches current authenticated user profile by email.
     */
    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return UserSummaryDto.fromEntity(user);
    }
}
