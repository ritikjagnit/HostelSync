package com.hostelsync.backend.controller;

import com.hostelsync.backend.service.AnalyticsExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsExportController {

    private final AnalyticsExportService analyticsExportService;

    public AnalyticsExportController(AnalyticsExportService analyticsExportService) {
        this.analyticsExportService = analyticsExportService;
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        return ResponseEntity.ok(analyticsExportService.getExecutiveAnalytics());
    }

    @GetMapping("/export/residents")
    public ResponseEntity<byte[]> exportResidents() {
        byte[] csv = analyticsExportService.exportResidentsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"hostel_residents_master.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping("/export/fees")
    public ResponseEntity<byte[]> exportFees() {
        byte[] csv = analyticsExportService.exportFeesCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"hostel_fee_register.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping("/export/complaints")
    public ResponseEntity<byte[]> exportComplaints() {
        byte[] csv = analyticsExportService.exportComplaintsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"hostel_maintenance_register.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
