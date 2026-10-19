package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.ApplicationStatus;
import com.hostelsync.backend.entity.HostelApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for student hostel applications.
 */
@Repository
public interface HostelApplicationRepository extends JpaRepository<HostelApplication, Long> {

    Optional<HostelApplication> findByApplicationNumber(String applicationNumber);

    Optional<HostelApplication> findByEnrollmentNumber(String enrollmentNumber);

    Optional<HostelApplication> findByEmail(String email);

    boolean existsByEnrollmentNumberAndStatusIn(String enrollmentNumber, Collection<ApplicationStatus> statuses);

    boolean existsByEmailAndStatusIn(String email, Collection<ApplicationStatus> statuses);

    List<HostelApplication> findAllByOrderByAppliedAtDesc();

    @Query("SELECT a FROM HostelApplication a WHERE " +
            "(:status IS NULL OR a.status = :status) AND " +
            "(:gender IS NULL OR UPPER(a.gender) = UPPER(:gender)) AND " +
            "(:course IS NULL OR a.course = :course) AND " +
            "(:search IS NULL OR " +
            " LOWER(a.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(a.applicationNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(a.enrollmentNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            " LOWER(a.email) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY a.meritPercentage DESC, a.distanceFromCollege DESC, a.appliedAt ASC")
    List<HostelApplication> searchApplications(
            @Param("status") ApplicationStatus status,
            @Param("gender") String gender,
            @Param("course") String course,
            @Param("search") String search
    );

    long countByStatus(ApplicationStatus status);
}
