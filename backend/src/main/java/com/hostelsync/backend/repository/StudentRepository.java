package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Student profile operations.
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByEnrollmentNumber(String enrollmentNumber);

    boolean existsByEnrollmentNumber(String enrollmentNumber);

    boolean existsByEnrollmentNumberAndIdNot(String enrollmentNumber, Long id);

    Optional<Student> findByUserId(Long userId);

    List<Student> findByCourse(String course);

    List<Student> findAllByOrderByIdDesc();

    @Query("SELECT s FROM Student s WHERE LOWER(s.enrollmentNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(s.user.fullName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(s.user.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(s.course) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY s.id DESC")
    List<Student> searchStudents(@Param("query") String query);
}

