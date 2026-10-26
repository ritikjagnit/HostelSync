package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.FeePaymentStatus;
import com.hostelsync.backend.entity.FeeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeeRecordRepository extends JpaRepository<FeeRecord, Long> {

    Optional<FeeRecord> findByReceiptNumber(String receiptNumber);

    List<FeeRecord> findByStudentIdOrderByDueDateDesc(Long studentId);

    List<FeeRecord> findByStudentUserEmailOrderByDueDateDesc(String email);

    List<FeeRecord> findByHostelIdOrderByDueDateDesc(Long hostelId);

    List<FeeRecord> findByHostelIdInOrderByDueDateDesc(Collection<Long> hostelIds);

    List<FeeRecord> findAllByOrderByDueDateDesc();

    long countByStudentIdAndStatusNot(Long studentId, FeePaymentStatus status);

    long countByStatus(FeePaymentStatus status);

    @Query("SELECT COALESCE(SUM(f.amount), 0.0) FROM FeeRecord f")
    Double sumTotalAssessedFee();

    @Query("SELECT COALESCE(SUM(f.paidAmount), 0.0) FROM FeeRecord f")
    Double sumTotalCollectedFee();
}
