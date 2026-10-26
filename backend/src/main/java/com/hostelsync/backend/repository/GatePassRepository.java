package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.GatePass;
import com.hostelsync.backend.entity.GatePassStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface GatePassRepository extends JpaRepository<GatePass, Long> {

    Optional<GatePass> findByPassNumber(String passNumber);

    List<GatePass> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<GatePass> findByStudentUserEmailOrderByCreatedAtDesc(String email);

    List<GatePass> findByHostelIdOrderByCreatedAtDesc(Long hostelId);

    List<GatePass> findByHostelIdInOrderByCreatedAtDesc(Collection<Long> hostelIds);

    List<GatePass> findAllByOrderByCreatedAtDesc();

    long countByStatus(GatePassStatus status);

    long countByHostelIdInAndStatus(Collection<Long> hostelIds, GatePassStatus status);

    long countByHostelIdIn(Collection<Long> hostelIds);
}
