package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.Attendance;
import com.hostelsync.backend.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for Hostel Attendance records.
 */
@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByStudentIdAndAttendanceDate(Long studentId, LocalDate attendanceDate);

    boolean existsByStudentIdAndAttendanceDate(Long studentId, LocalDate attendanceDate);

    List<Attendance> findByStudentIdOrderByAttendanceDateDesc(Long studentId);

    List<Attendance> findByStudentIdAndAttendanceDateBetweenOrderByAttendanceDateDesc(
            Long studentId, LocalDate fromDate, LocalDate toDate);

    List<Attendance> findByStudentIdInAndAttendanceDate(Collection<Long> studentIds, LocalDate attendanceDate);

    List<Attendance> findByAttendanceDate(LocalDate attendanceDate);

    long countByStudentIdAndStatus(Long studentId, AttendanceStatus status);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId " +
            "AND a.attendanceDate BETWEEN :fromDate AND :toDate")
    long countByStudentIdAndDateBetween(
            @Param("studentId") Long studentId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = :studentId " +
            "AND a.status = :status AND a.attendanceDate BETWEEN :fromDate AND :toDate")
    long countByStudentIdAndStatusAndDateBetween(
            @Param("studentId") Long studentId,
            @Param("status") AttendanceStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    /**
     * Admin attendance history search with flexible filtering.
     */
    @Query("SELECT a FROM Attendance a " +
            "LEFT JOIN RoomAllocation ra ON ra.student.id = a.student.id AND ra.status = 'ACTIVE' " +
            "WHERE (:hostelId IS NULL OR ra.room.hostel.id = :hostelId) " +
            "AND (:studentId IS NULL OR a.student.id = :studentId) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.attendanceDate >= :fromDate) " +
            "AND (:toDate IS NULL OR a.attendanceDate <= :toDate) " +
            "AND (:search IS NULL OR :search = '' OR " +
            "     LOWER(a.student.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.student.enrollmentNumber) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY a.attendanceDate DESC, a.student.user.fullName ASC")
    List<Attendance> searchAdminAttendanceHistory(
            @Param("hostelId") Long hostelId,
            @Param("studentId") Long studentId,
            @Param("status") AttendanceStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("search") String search
    );

    /**
     * Warden attendance history search scoped strictly to assigned hostels.
     */
    @Query("SELECT a FROM Attendance a " +
            "JOIN RoomAllocation ra ON ra.student.id = a.student.id AND ra.status = 'ACTIVE' " +
            "WHERE ra.room.hostel.id IN :assignedHostelIds " +
            "AND (:hostelId IS NULL OR ra.room.hostel.id = :hostelId) " +
            "AND (:studentId IS NULL OR a.student.id = :studentId) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "AND (:fromDate IS NULL OR a.attendanceDate >= :fromDate) " +
            "AND (:toDate IS NULL OR a.attendanceDate <= :toDate) " +
            "AND (:search IS NULL OR :search = '' OR " +
            "     LOWER(a.student.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "     LOWER(a.student.enrollmentNumber) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "ORDER BY a.attendanceDate DESC, a.student.user.fullName ASC")
    List<Attendance> searchWardenAttendanceHistory(
            @Param("assignedHostelIds") Collection<Long> assignedHostelIds,
            @Param("hostelId") Long hostelId,
            @Param("studentId") Long studentId,
            @Param("status") AttendanceStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("search") String search
    );
}
