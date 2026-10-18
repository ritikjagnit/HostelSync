package com.hostelsync.backend.dto;

/**
 * Outbound response payload following successful authentication containing the JWT bearer token.
 */
public record AuthResponseDto(
        String token,
        String tokenType,
        long expiresInMs,
        UserSummaryDto user
) {
    public static AuthResponseDto of(String token, long expiresInMs, UserSummaryDto user) {
        return new AuthResponseDto(token, "Bearer", expiresInMs, user);
    }
}
