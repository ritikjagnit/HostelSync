package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.Room;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Room inventory operations.
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdWithLock(@Param("id") Long id);

    List<Room> findByHostelId(Long hostelId);

    List<Room> findByHostelIdOrderByRoomNumberAsc(Long hostelId);

    List<Room> findByHostelIdAndFloor(Long hostelId, Integer floor);

    Optional<Room> findByHostelIdAndRoomNumber(Long hostelId, String roomNumber);

    boolean existsByHostelIdAndRoomNumber(Long hostelId, String roomNumber);

    boolean existsByHostelIdAndRoomNumberAndIdNot(Long hostelId, String roomNumber, Long id);

    long countByHostelId(Long hostelId);

    @Query("SELECT COALESCE(SUM(r.capacity), 0) FROM Room r WHERE r.hostel.id = :hostelId")
    int sumCapacityByHostelId(@Param("hostelId") Long hostelId);

    @Query("SELECT COALESCE(SUM(r.capacity), 0) FROM Room r WHERE r.hostel.id IN :hostelIds")
    int sumCapacityByHostelIdIn(@Param("hostelIds") java.util.Collection<Long> hostelIds);

    @Query("SELECT COUNT(r) FROM Room r WHERE r.hostel.id IN :hostelIds")
    long countByHostelIdIn(@Param("hostelIds") java.util.Collection<Long> hostelIds);

    java.util.List<Room> findByHostelIdInOrderByHostelIdAscRoomNumberAsc(java.util.Collection<Long> hostelIds);

    @Query("SELECT COALESCE(SUM(r.capacity), 0) FROM Room r")
    long sumTotalCapacity();
}

