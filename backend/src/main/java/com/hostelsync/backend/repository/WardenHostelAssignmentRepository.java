package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.Hostel;
import com.hostelsync.backend.entity.WardenHostelAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for managing Warden-to-Hostel assignments and access checks.
 */
@Repository
public interface WardenHostelAssignmentRepository extends JpaRepository<WardenHostelAssignment, Long> {

    List<WardenHostelAssignment> findByWardenId(Long wardenId);

    List<WardenHostelAssignment> findByWardenEmail(String email);

    List<WardenHostelAssignment> findByHostelId(Long hostelId);

    boolean existsByWardenIdAndHostelId(Long wardenId, Long hostelId);

    boolean existsByWardenEmailAndHostelId(String email, Long hostelId);

    Optional<WardenHostelAssignment> findByWardenIdAndHostelId(Long wardenId, Long hostelId);

    void deleteByWardenIdAndHostelId(Long wardenId, Long hostelId);

    void deleteByWardenId(Long wardenId);

    void deleteByHostelId(Long hostelId);

    @Query("SELECT a.hostel.id FROM WardenHostelAssignment a WHERE a.warden.email = :email")
    List<Long> findAssignedHostelIdsByWardenEmail(@Param("email") String email);

    @Query("SELECT a.hostel FROM WardenHostelAssignment a WHERE a.warden.email = :email")
    List<Hostel> findAssignedHostelsByWardenEmail(@Param("email") String email);

    @Query("SELECT a.hostel FROM WardenHostelAssignment a WHERE a.warden.id = :wardenId")
    List<Hostel> findAssignedHostelsByWardenId(@Param("wardenId") Long wardenId);
}
