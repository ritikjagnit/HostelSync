package com.hostelsync.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelsync.backend.dto.AllocationCheckoutRequestDto;
import com.hostelsync.backend.dto.AllocationCreateRequestDto;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import com.hostelsync.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminAllocationManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoomAllocationRepository roomAllocationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private HostelRepository hostelRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WardenHostelAssignmentRepository assignmentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String wardenToken;
    private String studentToken;

    private Hostel activeHostel;
    private Hostel inactiveHostel;
    private Room singleRoom;
    private Room doubleRoom;
    private Student studentOne;
    private Student studentTwo;
    private Student inactiveStudent;

    @BeforeEach
    void setUp() {
        attendanceRepository.deleteAll();
        assignmentRepository.deleteAll();
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        roomRepository.deleteAll();
        hostelRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Users
        User adminUser = userRepository.save(new User(
                "Principal Admin",
                "admin.alloc@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.ADMIN,
                true
        ));
        adminToken = jwtTokenProvider.generateToken(adminUser);

        User wardenUser = userRepository.save(new User(
                "Hostel Warden",
                "warden.alloc@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.WARDEN,
                true
        ));
        wardenToken = jwtTokenProvider.generateToken(wardenUser);

        User s1User = userRepository.save(new User(
                "Rohan Deshmukh",
                "rohan.deshmukh@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.STUDENT,
                true
        ));
        studentToken = jwtTokenProvider.generateToken(s1User);

        User s2User = userRepository.save(new User(
                "Amit Patil",
                "amit.patil@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.STUDENT,
                true
        ));

        User sInactiveUser = userRepository.save(new User(
                "Inactive Student",
                "inactive.student@gpsakoli.ac.in",
                passwordEncoder.encode("Pass123!"),
                Role.STUDENT,
                false
        ));

        // 2. Create Students
        studentOne = studentRepository.save(new Student(
                "EN2024CS101",
                "Diploma in Computer Engineering",
                3,
                "9876543210",
                s1User
        ));

        studentTwo = studentRepository.save(new Student(
                "EN2024ME102",
                "Diploma in Mechanical Engineering",
                2,
                "9876543211",
                s2User
        ));

        inactiveStudent = studentRepository.save(new Student(
                "EN2024EE999",
                "Diploma in Electrical Engineering",
                1,
                "9876543212",
                sInactiveUser
        ));

        // 3. Create Hostels
        activeHostel = hostelRepository.save(new Hostel(
                "Sahyadri Boys Hostel",
                HostelType.BOYS,
                "Campus Block A",
                true
        ));

        inactiveHostel = hostelRepository.save(new Hostel(
                "Old Inactive Hostel",
                HostelType.BOYS,
                "Campus Block Old",
                false
        ));

        // 4. Create Rooms
        singleRoom = roomRepository.save(new Room(
                "101",
                1,
                1, // capacity 1
                activeHostel
        ));

        doubleRoom = roomRepository.save(new Room(
                "102",
                1,
                2, // capacity 2
                activeHostel
        ));
    }

    @AfterEach
    void tearDown() {
        roomAllocationRepository.deleteAll();
        studentRepository.deleteAll();
        roomRepository.deleteAll();
        hostelRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Admin can assign an eligible student to a room with available capacity")
    void createAllocation_asAdmin_success() throws Exception {
        AllocationCreateRequestDto dto = new AllocationCreateRequestDto(
                studentOne.getId(),
                singleRoom.getId(),
                LocalDate.now()
        );

        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.studentId", is(studentOne.getId().intValue())))
                .andExpect(jsonPath("$.studentName", is("Rohan Deshmukh")))
                .andExpect(jsonPath("$.enrollmentNumber", is("EN2024CS101")))
                .andExpect(jsonPath("$.roomNumber", is("101")))
                .andExpect(jsonPath("$.hostelName", is("Sahyadri Boys Hostel")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.allocationDate", is(LocalDate.now().toString())))
                .andExpect(jsonPath("$.vacatingDate", nullValue()));

        // Verify DB persistence
        assertTrue(roomAllocationRepository.existsByStudentIdAndStatus(studentOne.getId(), AllocationStatus.ACTIVE));
    }

    @Test
    @DisplayName("Unauthenticated callers cannot create room allocations (401)")
    void createAllocation_unauthenticated_returns401() throws Exception {
        AllocationCreateRequestDto dto = new AllocationCreateRequestDto(
                studentOne.getId(),
                singleRoom.getId(),
                LocalDate.now()
        );

        mockMvc.perform(post("/api/admin/allocations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("WARDEN and STUDENT callers cannot access admin room allocation endpoints (403)")
    void createAllocation_asStudentOrWarden_returns403() throws Exception {
        AllocationCreateRequestDto dto = new AllocationCreateRequestDto(
                studentOne.getId(),
                singleRoom.getId(),
                LocalDate.now()
        );

        // STUDENT role
        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());

        // WARDEN role
        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + wardenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Reject assignment if student or room is unknown (404)")
    void createAllocation_unknownStudentOrRoom_returns404() throws Exception {
        // Unknown student
        AllocationCreateRequestDto dtoBadStudent = new AllocationCreateRequestDto(
                99999L,
                singleRoom.getId(),
                LocalDate.now()
        );
        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dtoBadStudent)))
                .andExpect(status().isNotFound());

        // Unknown room
        AllocationCreateRequestDto dtoBadRoom = new AllocationCreateRequestDto(
                studentOne.getId(),
                88888L,
                LocalDate.now()
        );
        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dtoBadRoom)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Reject assignment for inactive student account (409)")
    void createAllocation_inactiveStudent_returns409Conflict() throws Exception {
        AllocationCreateRequestDto dto = new AllocationCreateRequestDto(
                inactiveStudent.getId(),
                singleRoom.getId(),
                LocalDate.now()
        );

        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("inactive")));
    }

    @Test
    @DisplayName("Reject assignment to room in an inactive hostel (409)")
    void createAllocation_inactiveHostel_returns409Conflict() throws Exception {
        Room roomInInactiveHostel = roomRepository.save(new Room("201", 2, 2, inactiveHostel));

        AllocationCreateRequestDto dto = new AllocationCreateRequestDto(
                studentOne.getId(),
                roomInInactiveHostel.getId(),
                LocalDate.now()
        );

        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("inactive")));
    }

    @Test
    @DisplayName("Reject duplicate ACTIVE allocation for a student who already has one (409)")
    void createAllocation_duplicateActiveAllocation_returns409Conflict() throws Exception {
        // First allocation
        roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                doubleRoom,
                LocalDate.now().minusDays(10),
                null,
                AllocationStatus.ACTIVE
        ));

        // Attempt second allocation to another room
        AllocationCreateRequestDto dto = new AllocationCreateRequestDto(
                studentOne.getId(),
                singleRoom.getId(),
                LocalDate.now()
        );

        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already has an active room allocation")));
    }

    @Test
    @DisplayName("Reject assignment when room is already at full capacity (409)")
    void createAllocation_roomAtFullCapacity_returns409Conflict() throws Exception {
        // Fill single room (capacity = 1) with studentOne
        roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                singleRoom,
                LocalDate.now().minusDays(5),
                null,
                AllocationStatus.ACTIVE
        ));

        // Try allocating studentTwo to singleRoom
        AllocationCreateRequestDto dto = new AllocationCreateRequestDto(
                studentTwo.getId(),
                singleRoom.getId(),
                LocalDate.now()
        );

        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("full capacity")));
    }

    @Test
    @DisplayName("Admin can checkout an active allocation, immediately restoring room capacity")
    void checkoutAllocation_asAdmin_successAndFreesCapacity() throws Exception {
        // Allocate single room
        RoomAllocation alloc = roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                singleRoom,
                LocalDate.now().minusDays(15),
                null,
                AllocationStatus.ACTIVE
        ));

        // Verify single room has 0 available beds initially
        assertEquals(1, roomAllocationRepository.countByRoomIdAndStatus(singleRoom.getId(), AllocationStatus.ACTIVE));

        AllocationCheckoutRequestDto checkoutDto = new AllocationCheckoutRequestDto(LocalDate.now());

        mockMvc.perform(post("/api/admin/allocations/" + alloc.getId() + "/checkout")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(alloc.getId().intValue())))
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andExpect(jsonPath("$.vacatingDate", is(LocalDate.now().toString())));

        // Room now has 0 active allocations and is free again
        assertEquals(0, roomAllocationRepository.countByRoomIdAndStatus(singleRoom.getId(), AllocationStatus.ACTIVE));

        // StudentTwo can now be allocated to singleRoom
        AllocationCreateRequestDto newDto = new AllocationCreateRequestDto(
                studentTwo.getId(),
                singleRoom.getId(),
                LocalDate.now()
        );
        mockMvc.perform(post("/api/admin/allocations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newDto)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Repeated checkout of an already completed allocation is rejected (409)")
    void checkoutAllocation_repeatedCheckout_returns409Conflict() throws Exception {
        RoomAllocation completedAlloc = roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                singleRoom,
                LocalDate.now().minusDays(30),
                LocalDate.now().minusDays(5),
                AllocationStatus.COMPLETED
        ));

        mockMvc.perform(post("/api/admin/allocations/" + completedAlloc.getId() + "/checkout")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already completed")));
    }

    @Test
    @DisplayName("Checkout fails with 400 if vacating date is before allocation date")
    void checkoutAllocation_vacatingDateBeforeAllocationDate_returns400() throws Exception {
        RoomAllocation alloc = roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                singleRoom,
                LocalDate.now(),
                null,
                AllocationStatus.ACTIVE
        ));

        AllocationCheckoutRequestDto invalidCheckout = new AllocationCheckoutRequestDto(LocalDate.now().minusDays(5));

        mockMvc.perform(post("/api/admin/allocations/" + alloc.getId() + "/checkout")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidCheckout)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot be before allocation date")));
    }

    @Test
    @DisplayName("Historical allocation records remain accessible after checkout")
    void historicalAllocations_remainAvailableAfterCheckout() throws Exception {
        RoomAllocation alloc = roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                singleRoom,
                LocalDate.now().minusDays(20),
                LocalDate.now().minusDays(1),
                AllocationStatus.COMPLETED
        ));

        mockMvc.perform(get("/api/admin/allocations/" + alloc.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(alloc.getId().intValue())))
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andExpect(jsonPath("$.vacatingDate", is(LocalDate.now().minusDays(1).toString())));
    }

    @Test
    @DisplayName("Search allocations by student name or enrollment number")
    void searchAllocations_byStudentNameAndEnrollment_returnsMatches() throws Exception {
        roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                singleRoom,
                LocalDate.now().minusDays(10),
                null,
                AllocationStatus.ACTIVE
        ));

        roomAllocationRepository.save(new RoomAllocation(
                studentTwo,
                doubleRoom,
                LocalDate.now().minusDays(5),
                null,
                AllocationStatus.ACTIVE
        ));

        // Search by studentOne's enrollment number
        mockMvc.perform(get("/api/admin/allocations?search=EN2024CS101")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].enrollmentNumber", is("EN2024CS101")));

        // Search by studentTwo's name
        mockMvc.perform(get("/api/admin/allocations?search=Amit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].studentName", is("Amit Patil")));

        // Filter by status ACTIVE
        mockMvc.perform(get("/api/admin/allocations?status=ACTIVE")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // Filter by status COMPLETED (none exist yet)
        mockMvc.perform(get("/api/admin/allocations?status=COMPLETED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Available students endpoint returns only active students without active allocations")
    void getAvailableStudents_returnsOnlyEligibleActiveStudents() throws Exception {
        // Allocate studentOne
        roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                singleRoom,
                LocalDate.now(),
                null,
                AllocationStatus.ACTIVE
        ));

        // studentOne is allocated; inactiveStudent is inactive -> Only studentTwo should be available
        mockMvc.perform(get("/api/admin/allocations/available-students")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].enrollmentNumber", is("EN2024ME102")))
                .andExpect(jsonPath("$[0].fullName", is("Amit Patil")));
    }

    @Test
    @DisplayName("Available rooms endpoint returns rooms with remaining capacity")
    void getAvailableRooms_returnsOnlyRoomsWithCapacity() throws Exception {
        // Fill single room
        roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                singleRoom,
                LocalDate.now(),
                null,
                AllocationStatus.ACTIVE
        ));

        // doubleRoom has capacity 2, 0 allocated -> availableBeds = 2
        // singleRoom has capacity 1, 1 allocated -> availableBeds = 0

        // By default (includeFull = false), only doubleRoom is returned
        mockMvc.perform(get("/api/admin/allocations/available-rooms?hostelId=" + activeHostel.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].roomNumber", is("102")))
                .andExpect(jsonPath("$[0].availableBeds", is(2)));

        // When includeFull = true, both rooms returned with accurate stats
        mockMvc.perform(get("/api/admin/allocations/available-rooms?hostelId=" + activeHostel.getId() + "&includeFull=true")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @DisplayName("Allocation responses never expose password hashes or sensitive user internals")
    void allocationResponse_doesNotExposeSensitiveFields() throws Exception {
        RoomAllocation alloc = roomAllocationRepository.save(new RoomAllocation(
                studentOne,
                singleRoom,
                LocalDate.now(),
                null,
                AllocationStatus.ACTIVE
        ));

        mockMvc.perform(get("/api/admin/allocations/" + alloc.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("Room capacity is strictly respected when concurrent allocation requests occur")
    void concurrency_roomCapacityRespectedUnderConcurrentRequests() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        Callable<Void> task1 = () -> {
            latch.await();
            try {
                mockMvc.perform(post("/api/admin/allocations")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new AllocationCreateRequestDto(
                                        studentOne.getId(),
                                        singleRoom.getId(),
                                        LocalDate.now()
                                ))))
                        .andDo(result -> {
                            int status = result.getResponse().getStatus();
                            if (status == 201) successCount.incrementAndGet();
                            else if (status == 409) conflictCount.incrementAndGet();
                        });
            } catch (Exception ignored) {}
            return null;
        };

        Callable<Void> task2 = () -> {
            latch.await();
            try {
                mockMvc.perform(post("/api/admin/allocations")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(new AllocationCreateRequestDto(
                                        studentTwo.getId(),
                                        singleRoom.getId(),
                                        LocalDate.now()
                                ))))
                        .andDo(result -> {
                            int status = result.getResponse().getStatus();
                            if (status == 201) successCount.incrementAndGet();
                            else if (status == 409) conflictCount.incrementAndGet();
                        });
            } catch (Exception ignored) {}
            return null;
        };

        Future<Void> f1 = executor.submit(task1);
        Future<Void> f2 = executor.submit(task2);
        latch.countDown();
        f1.get(10, TimeUnit.SECONDS);
        f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one allocation must succeed for room of capacity 1");
        assertEquals(1, conflictCount.get(), "The other concurrent request must receive 409 Conflict");
        assertEquals(1, roomAllocationRepository.countByRoomIdAndStatus(singleRoom.getId(), AllocationStatus.ACTIVE));
    }
}
