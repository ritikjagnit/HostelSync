package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.Complaint;
import com.hostelsync.backend.entity.ComplaintCategory;
import com.hostelsync.backend.entity.ComplaintStatus;
import com.hostelsync.backend.entity.ComplaintUrgency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for managing resident complaint and maintenance ticket persistence.
 */
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<Complaint> findByHostelIdOrderByCreatedAtDesc(Long hostelId);

    List<Complaint> findByHostelIdInOrderByCreatedAtDesc(Collection<Long> hostelIds);

    List<Complaint> findByHostelIdInAndStatusOrderByCreatedAtDesc(Collection<Long> hostelIds, ComplaintStatus status);

    List<Complaint> findAllByOrderByCreatedAtDesc();

    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    List<Complaint> findByHostelIdAndStatusOrderByCreatedAtDesc(Long hostelId, ComplaintStatus status);

    Optional<Complaint> findByTicketNumber(String ticketNumber);

    long countByHostelIdInAndStatus(Collection<Long> hostelIds, ComplaintStatus status);

    long countByHostelIdIn(Collection<Long> hostelIds);

    long countByHostelIdInAndUrgency(Collection<Long> hostelIds, ComplaintUrgency urgency);

    long countByStatus(ComplaintStatus status);

    long countByUrgency(ComplaintUrgency urgency);

    long countByStudentId(Long studentId);

    long countByStudentIdAndStatus(Long studentId, ComplaintStatus status);
}
