package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.AllocationStatus;
import com.hostelsync.backend.entity.RoomAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for RoomAllocation tracking.
 */
@Repository
public interface RoomAllocationRepository extends JpaRepository<RoomAllocation, Long> {

    List<RoomAllocation> findByStudentId(Long studentId);

    boolean existsByStudentId(Long studentId);

    int countByStudentId(Long studentId);

    List<RoomAllocation> findByRoomId(Long roomId);

    List<RoomAllocation> findByStatus(AllocationStatus status);

    Optional<RoomAllocation> findByStudentIdAndStatus(Long studentId, AllocationStatus status);

    long countByRoomIdAndStatus(Long roomId, AllocationStatus status);

    boolean existsByRoomIdAndStatus(Long roomId, AllocationStatus status);

    @Query("SELECT COUNT(ra) > 0 FROM RoomAllocation ra WHERE ra.room.hostel.id = :hostelId AND ra.status = :status")
    boolean existsByHostelIdAndStatus(@Param("hostelId") Long hostelId, @Param("status") AllocationStatus status);

    @Query("SELECT COUNT(ra) FROM RoomAllocation ra WHERE ra.room.hostel.id = :hostelId AND ra.status = :status")
    long countByHostelIdAndStatus(@Param("hostelId") Long hostelId, @Param("status") AllocationStatus status);

    long countByStatus(AllocationStatus status);
}

