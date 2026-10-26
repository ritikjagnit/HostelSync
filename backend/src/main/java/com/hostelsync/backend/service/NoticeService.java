package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.NoticeCreateDto;
import com.hostelsync.backend.dto.NoticeResponseDto;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class NoticeService {

    private final HostelNoticeRepository noticeRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final HostelRepository hostelRepository;
    private final RoomAllocationRepository roomAllocationRepository;

    public NoticeService(
            HostelNoticeRepository noticeRepository,
            UserRepository userRepository,
            StudentRepository studentRepository,
            HostelRepository hostelRepository,
            RoomAllocationRepository roomAllocationRepository) {
        this.noticeRepository = noticeRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.hostelRepository = hostelRepository;
        this.roomAllocationRepository = roomAllocationRepository;
    }

    @Transactional(readOnly = true)
    public List<NoticeResponseDto> getNoticesForStudent(String studentEmail) {
        Student student = studentRepository.findByUserEmail(studentEmail).orElse(null);
        NoticeTarget allowedTarget = NoticeTarget.ALL;

        if (student != null) {
            var alloc = roomAllocationRepository.findActiveByStudentId(student.getId());
            if (alloc.isPresent()) {
                HostelType hType = alloc.get().getRoom().getHostel().getHostelType();
                allowedTarget = (hType == HostelType.BOYS) ? NoticeTarget.BOYS_HOSTEL : NoticeTarget.GIRLS_HOSTEL;
            }
        }

        List<NoticeTarget> targets = List.of(NoticeTarget.ALL, allowedTarget);
        return noticeRepository.findByTargetAudienceInOrderByIsPinnedDescCreatedAtDesc(targets)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NoticeResponseDto> getAllNotices() {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public NoticeResponseDto createNotice(String authorEmail, NoticeCreateDto dto) {
        User user = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author user not found"));

        Hostel hostel = null;
        if (dto.hostelId() != null) {
            hostel = hostelRepository.findById(dto.hostelId()).orElse(null);
        }

        HostelNotice notice = new HostelNotice();
        notice.setTitle(dto.title().trim());
        notice.setContent(dto.content().trim());
        notice.setCategory(dto.category());
        notice.setPriority(dto.priority());
        notice.setTargetAudience(dto.targetAudience());
        notice.setPinned(dto.isPinned());
        notice.setPostedBy(user);
        notice.setHostel(hostel);

        HostelNotice saved = noticeRepository.save(notice);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteNotice(Long noticeId) {
        if (!noticeRepository.existsById(noticeId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found");
        }
        noticeRepository.deleteById(noticeId);
    }

    private NoticeResponseDto mapToDto(HostelNotice n) {
        return new NoticeResponseDto(
                n.getId(),
                n.getTitle(),
                n.getContent(),
                n.getCategory(),
                n.getPriority(),
                n.getTargetAudience(),
                n.isPinned(),
                n.getPostedBy() != null ? n.getPostedBy().getId() : null,
                n.getPostedBy() != null ? n.getPostedBy().getFullName() : "Hostel Administration",
                n.getHostel() != null ? n.getHostel().getId() : null,
                n.getHostel() != null ? n.getHostel().getName() : "All Hostels",
                n.getCreatedAt(),
                n.getUpdatedAt()
        );
    }
}
