package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.SosAlert;
import com.hostelsync.backend.entity.SosStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SosAlertRepository extends JpaRepository<SosAlert, Long> {

    List<SosAlert> findByStatusInOrderByTriggeredAtDesc(List<SosStatus> statuses);

    List<SosAlert> findAllByOrderByTriggeredAtDesc();

    List<SosAlert> findByStudentIdOrderByTriggeredAtDesc(Long studentId);

    long countByStatus(SosStatus status);
}

