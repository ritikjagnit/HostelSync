package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.MealFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface MealFeedbackRepository extends JpaRepository<MealFeedback, Long> {

    List<MealFeedback> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<MealFeedback> findByStudentUserEmailOrderByCreatedAtDesc(String email);

    List<MealFeedback> findByHostelIdOrderByCreatedAtDesc(Long hostelId);

    List<MealFeedback> findByHostelIdInOrderByCreatedAtDesc(Collection<Long> hostelIds);

    List<MealFeedback> findByFeedbackDateBetweenOrderByCreatedAtDesc(LocalDate from, LocalDate to);
}
