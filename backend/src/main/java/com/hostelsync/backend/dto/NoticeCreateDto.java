package com.hostelsync.backend.dto;

import com.hostelsync.backend.entity.NoticeCategory;
import com.hostelsync.backend.entity.NoticePriority;
import com.hostelsync.backend.entity.NoticeTarget;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NoticeCreateDto(
        @NotBlank(message = "Title is required")
        @Size(max = 200)
        String title,

        @NotBlank(message = "Content is required")
        @Size(max = 4000)
        String content,

        @NotNull(message = "Category is required")
        NoticeCategory category,

        @NotNull(message = "Priority is required")
        NoticePriority priority,

        @NotNull(message = "Target audience is required")
        NoticeTarget targetAudience,

        boolean isPinned,

        Long hostelId
) {
}
