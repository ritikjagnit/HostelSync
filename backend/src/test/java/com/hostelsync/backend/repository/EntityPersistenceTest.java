package com.hostelsync.backend.repository;

import com.hostelsync.backend.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class EntityPersistenceTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomAllocationRepository roomAllocationRepository;

    @Test
    @DisplayName("Persist and query User entity successfully")
    void shouldPersistAndFindUser() {
        User user = new User("Rahul Sharma", "rahul.sharma@gpsakoli.ac.in", "hashed_secret_pwd_123", Role.STUDENT, true);
        User savedUser = userRepository.save(user);

        assertNotNull(savedUser.getId());
        assertNotNull(savedUser.getCreatedAt());
        assertEquals("Rahul Sharma", savedUser.getFullName());
        assertEquals(Role.STUDENT, savedUser.getRole());

        Optional<User> found = userRepository.findByEmail("rahul.sharma@gpsakoli.ac.in");
        assertTrue(found.isPresent());
        assertEquals(savedUser.getId(), found.get().getId());
    }

    @Test
    @DisplayName("Enforce unique email constraint on User entity")
    void shouldEnforceUniqueEmailOnUser() {
        User user1 = new User("Rahul S", "unique.email@gpsakoli.ac.in", "hash1", Role.STUDENT, true);
        userRepository.saveAndFlush(user1);

        User duplicate = new User("Rahul S2", "unique.email@gpsakoli.ac.in", "hash2", Role.STUDENT, true);
        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.saveAndFlush(duplicate);
        });
    }

    @Test
    @DisplayName("Persist Student profile associated with User")
    void shouldPersistAndFindStudent() {
        User user = new User("Amit Patel", "amit.patel@gpsakoli.ac.in", "hashed_pwd_456", Role.STUDENT, true);
        userRepository.save(user);

        Student student = new Student("EN20261001", "Computer Engineering", 3, "+919876543210", user);
        Student savedStudent = studentRepository.save(student);

        assertNotNull(savedStudent.getId());
        assertEquals("EN20261001", savedStudent.getEnrollmentNumber());
        assertEquals(user.getId(), savedStudent.getUser().getId());

        Optional<Student> found = studentRepository.findByEnrollmentNumber("EN20261001");
        assertTrue(found.isPresent());
        assertEquals("Computer Engineering", found.get().getCourse());
    }

    @Test
    @DisplayName("Enforce unique enrollment number constraint on Student entity")
    void shouldEnforceUniqueEnrollmentOnStudent() {
        User user1 = new User("User One", "user1@gpsakoli.ac.in", "hash1", Role.STUDENT, true);
        userRepository.save(user1);
        Student student1 = new Student("EN_UNIQUE_01", "Mechanical", 1, "+919000000001", user1);
        studentRepository.saveAndFlush(student1);

        User user2 = new User("User Two", "user2@gpsakoli.ac.in", "hash2", Role.STUDENT, true);
        userRepository.save(user2);
        Student student2 = new Student("EN_UNIQUE_01", "Civil", 1, "+919000000002", user2);

        assertThrows(DataIntegrityViolationException.class, () -> {
            studentRepository.saveAndFlush(student2);
        });
    }

    @Test
    @DisplayName("Persist Hostel and associated Rooms across multiple hostels")
    void shouldPersistHostelAndRooms() {
        Hostel boysHostel = new Hostel("GPS Boys Hostel Block A", HostelType.BOYS, "Campus, Sakoli", true);
        Hostel savedBoysHostel = hostelRepository.save(boysHostel);

        Hostel girlsHostel = new Hostel("GPS Girls Hostel Block B", HostelType.GIRLS, "Campus, Sakoli", true);
        Hostel savedGirlsHostel = hostelRepository.save(girlsHostel);

        Room boysRoom101 = new Room("101", 1, 3, savedBoysHostel);
        Room savedBoysRoom = roomRepository.save(boysRoom101);

        Room girlsRoom101 = new Room("101", 1, 3, savedGirlsHostel);
        Room savedGirlsRoom = roomRepository.save(girlsRoom101);

        assertNotNull(savedBoysRoom.getId());
        assertNotNull(savedGirlsRoom.getId());

        List<Room> boysRooms = roomRepository.findByHostelId(savedBoysHostel.getId());
        assertEquals(1, boysRooms.size());
        assertEquals("101", boysRooms.get(0).getRoomNumber());

        List<Room> girlsRooms = roomRepository.findByHostelId(savedGirlsHostel.getId());
        assertEquals(1, girlsRooms.size());
        assertEquals("101", girlsRooms.get(0).getRoomNumber());
    }

    @Test
    @DisplayName("Enforce unique constraint for room number within the same hostel")
    void shouldEnforceUniqueRoomNumberPerHostel() {
        Hostel hostel = new Hostel("GPS Block C", HostelType.BOYS, "Campus, Sakoli", true);
        hostelRepository.save(hostel);

        Room room1 = new Room("301", 3, 2, hostel);
        roomRepository.saveAndFlush(room1);

        Room duplicateRoom = new Room("301", 3, 2, hostel);
        assertThrows(DataIntegrityViolationException.class, () -> {
            roomRepository.saveAndFlush(duplicateRoom);
        });
    }

    @Test
    @DisplayName("Persist RoomAllocation and transition status to COMPLETED")
    void shouldPersistAndTransitionRoomAllocation() {
        User user = new User("Priya Deshmukh", "priya.d@gpsakoli.ac.in", "hashed_pwd_priya", Role.STUDENT, true);
        userRepository.save(user);

        Student student = new Student("EN20262002", "Civil Engineering", 2, "+919822334455", user);
        studentRepository.save(student);

        Hostel hostel = new Hostel("GPS Girls Hostel Block A", HostelType.GIRLS, "Polytechnic Campus, Sakoli", true);
        hostelRepository.save(hostel);

        Room room = new Room("204", 2, 2, hostel);
        roomRepository.save(room);

        RoomAllocation allocation = new RoomAllocation(
                student,
                room,
                LocalDate.of(2026, 7, 1),
                null,
                AllocationStatus.ACTIVE
        );
        RoomAllocation savedAllocation = roomAllocationRepository.save(allocation);

        assertNotNull(savedAllocation.getId());
        assertEquals(AllocationStatus.ACTIVE, savedAllocation.getStatus());
        assertNull(savedAllocation.getVacatingDate());

        // Query active allocations for student
        Optional<RoomAllocation> activeAlloc = roomAllocationRepository.findByStudentIdAndStatus(
                student.getId(), AllocationStatus.ACTIVE);
        assertTrue(activeAlloc.isPresent());

        // Vacate room
        activeAlloc.get().setStatus(AllocationStatus.COMPLETED);
        activeAlloc.get().setVacatingDate(LocalDate.of(2026, 12, 15));
        roomAllocationRepository.saveAndFlush(activeAlloc.get());

        Optional<RoomAllocation> completedAlloc = roomAllocationRepository.findById(savedAllocation.getId());
        assertTrue(completedAlloc.isPresent());
        assertEquals(AllocationStatus.COMPLETED, completedAlloc.get().getStatus());
        assertEquals(LocalDate.of(2026, 12, 15), completedAlloc.get().getVacatingDate());
    }
}
