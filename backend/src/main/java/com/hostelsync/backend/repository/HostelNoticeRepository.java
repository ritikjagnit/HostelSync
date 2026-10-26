package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.HostelNotice;
import com.hostelsync.backend.entity.NoticeTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface HostelNoticeRepository extends JpaRepository<HostelNotice, Long> {

    List<HostelNotice> findAllByOrderByIsPinnedDescCreatedAtDesc();

    List<HostelNotice> findByTargetAudienceInOrderByIsPinnedDescCreatedAtDesc(Collection<NoticeTarget> targets);

    long countByIsPinnedTrue();
}
