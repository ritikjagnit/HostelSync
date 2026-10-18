package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.Role;
import com.hostelsync.backend.entity.User;

/**
 * Publicly safe user profile representation with password hash strictly excluded.
 */
public record UserSummaryDto(
        Long id,
        String fullName,
        String email,
        Role role,
        boolean active
) {
    public static UserSummaryDto fromEntity(User user) {
        return new UserSummaryDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isActive()
        );
    }
}
