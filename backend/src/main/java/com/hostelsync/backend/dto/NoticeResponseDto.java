package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.NoticeCategory;
import com.hostelsync.backend.entity.NoticePriority;
import com.hostelsync.backend.entity.NoticeTarget;

import java.time.Instant;

public record NoticeResponseDto(
        Long id,
        String title,
        String content,
        NoticeCategory category,
        NoticePriority priority,
        NoticeTarget targetAudience,
        boolean isPinned,
        Long postedById,
        String postedByName,
        Long hostelId,
        String hostelName,
        Instant createdAt,
        Instant updatedAt
) {
}
