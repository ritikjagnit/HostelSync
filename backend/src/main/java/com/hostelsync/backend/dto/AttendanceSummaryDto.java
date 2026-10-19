package com.hostelsync.backend.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Consolidated institution-wide attendance metrics for a specific date.
 */
public record AttendanceSummaryDto(
        LocalDate date,
        long totalActiveResidents,
        long totalMarked,
        long totalUnmarked,
        long presentCount,
        long absentCount,
        long onLeaveCount,
        double attendancePercentage,
        List<HostelAttendanceSummaryDto> hostelBreakdowns
) {
}
