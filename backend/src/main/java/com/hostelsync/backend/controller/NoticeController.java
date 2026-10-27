package com.hostelsync.backend.controller;

import com.hostelsync.backend.dto.NoticeCreateDto;
import com.hostelsync.backend.dto.NoticeResponseDto;
import com.hostelsync.backend.service.NoticeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    // Student notices
    @GetMapping("/api/student/notices")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<NoticeResponseDto>> getStudentNotices(Authentication authentication) {
        return ResponseEntity.ok(noticeService.getNoticesForStudent(authentication.getName()));
    }

    // Warden notices
    @GetMapping("/api/warden/notices")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<List<NoticeResponseDto>> getWardenNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @PostMapping("/api/warden/notices")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<NoticeResponseDto> postWardenNotice(
            Authentication authentication,
            @Valid @RequestBody NoticeCreateDto dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noticeService.createNotice(authentication.getName(), dto));
    }

    @DeleteMapping("/api/warden/notices/{id}")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<Void> deleteWardenNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/warden/notices/{id}/pin")
    @PreAuthorize("hasAnyRole('WARDEN', 'ADMIN')")
    public ResponseEntity<NoticeResponseDto> toggleWardenPin(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.togglePinNotice(id));
    }

    // Admin notices
    @GetMapping("/api/admin/notices")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<NoticeResponseDto>> getAdminNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @PostMapping("/api/admin/notices")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoticeResponseDto> postAdminNotice(
            Authentication authentication,
            @Valid @RequestBody NoticeCreateDto dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noticeService.createNotice(authentication.getName(), dto));
    }

    @PutMapping("/api/admin/notices/{id}/pin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoticeResponseDto> toggleAdminPin(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.togglePinNotice(id));
    }

    @DeleteMapping("/api/admin/notices/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAdminNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }
}
