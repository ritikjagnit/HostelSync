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

    List<RoomAllocation> findByStudentIdOrderByIdDesc(Long studentId);

    boolean existsByStudentId(Long studentId);

    int countByStudentId(Long studentId);

    List<RoomAllocation> findByRoomId(Long roomId);

    List<RoomAllocation> findByStatus(AllocationStatus status);

    Optional<RoomAllocation> findByStudentIdAndStatus(Long studentId, AllocationStatus status);

    default Optional<RoomAllocation> findActiveByStudentId(Long studentId) {
        return findByStudentIdAndStatus(studentId, AllocationStatus.ACTIVE);
    }

    boolean existsByStudentIdAndStatus(Long studentId, AllocationStatus status);

    long countByRoomIdAndStatus(Long roomId, AllocationStatus status);

    boolean existsByRoomIdAndStatus(Long roomId, AllocationStatus status);

    @Query("SELECT COUNT(ra) > 0 FROM RoomAllocation ra WHERE ra.room.hostel.id = :hostelId AND ra.status = :status")
    boolean existsByHostelIdAndStatus(@Param("hostelId") Long hostelId, @Param("status") AllocationStatus status);

    @Query("SELECT COUNT(ra) FROM RoomAllocation ra WHERE ra.room.hostel.id = :hostelId AND ra.status = :status")
    long countByHostelIdAndStatus(@Param("hostelId") Long hostelId, @Param("status") AllocationStatus status);

    long countByStatus(AllocationStatus status);

    @Query("SELECT COUNT(ra) FROM RoomAllocation ra WHERE ra.room.hostel.id IN :hostelIds AND ra.status = :status")
    long countByRoomHostelIdInAndStatus(@Param("hostelIds") java.util.Collection<Long> hostelIds, @Param("status") AllocationStatus status);

    List<RoomAllocation> findAllByOrderByIdDesc();

    @Query("SELECT ra FROM RoomAllocation ra WHERE " +
           "(:status IS NULL OR ra.status = :status) AND " +
           "(:hostelId IS NULL OR ra.room.hostel.id = :hostelId) AND " +
           "(:roomId IS NULL OR ra.room.id = :roomId) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(ra.student.user.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(ra.student.enrollmentNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY ra.id DESC")
    List<RoomAllocation> searchAllocations(
            @Param("status") AllocationStatus status,
            @Param("hostelId") Long hostelId,
            @Param("roomId") Long roomId,
            @Param("query") String query
    );

    @Query("SELECT ra FROM RoomAllocation ra WHERE " +
           "ra.room.hostel.id IN :hostelIds AND " +
           "(:status IS NULL OR ra.status = :status) AND " +
           "(:hostelId IS NULL OR ra.room.hostel.id = :hostelId) AND " +
           "(:roomId IS NULL OR ra.room.id = :roomId) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(ra.student.user.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(ra.student.enrollmentNumber) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY ra.id DESC")
    List<RoomAllocation> searchWardenAllocations(
            @Param("hostelIds") java.util.Collection<Long> hostelIds,
            @Param("status") AllocationStatus status,
            @Param("hostelId") Long hostelId,
            @Param("roomId") Long roomId,
            @Param("query") String query
    );

    @Query("SELECT ra FROM RoomAllocation ra WHERE " +
           "ra.room.hostel.id IN :hostelIds AND " +
           "ra.status = 'ACTIVE' AND " +
           "(:hostelId IS NULL OR ra.room.hostel.id = :hostelId) AND " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(ra.student.user.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(ra.student.enrollmentNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(ra.student.phone) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY ra.room.roomNumber ASC, ra.student.user.fullName ASC")
    List<RoomAllocation> findActiveResidentsForHostelIds(
            @Param("hostelIds") java.util.Collection<Long> hostelIds,
            @Param("hostelId") Long hostelId,
            @Param("query") String query
    );
}

