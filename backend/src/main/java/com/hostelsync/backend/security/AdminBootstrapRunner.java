package com.hostelsync.backend.security;

import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

/**
 * Safe administrative account and initial development seed runner.
 * Bootstraps the administrator account and initial demonstration student & hostel data.
 */
@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final HostelRepository hostelRepository;
    private final RoomRepository roomRepository;
    private final RoomAllocationRepository roomAllocationRepository;
    private final WardenHostelAssignmentRepository wardenHostelAssignmentRepository;
    private final HostelApplicationRepository hostelApplicationRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${app.bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${app.bootstrap.admin.password:}")
    private String adminPassword;

    @Value("${app.bootstrap.admin.full-name:System Administrator}")
    private String adminFullName;

    @Value("${app.bootstrap.complaints.enabled:false}")
    private boolean bootstrapComplaintsEnabled;

    public AdminBootstrapRunner(
            UserRepository userRepository,
            StudentRepository studentRepository,
            HostelRepository hostelRepository,
            RoomRepository roomRepository,
            RoomAllocationRepository roomAllocationRepository,
            WardenHostelAssignmentRepository wardenHostelAssignmentRepository,
            HostelApplicationRepository hostelApplicationRepository,
            ComplaintRepository complaintRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.hostelRepository = hostelRepository;
        this.roomRepository = roomRepository;
        this.roomAllocationRepository = roomAllocationRepository;
        this.wardenHostelAssignmentRepository = wardenHostelAssignmentRepository;
        this.hostelApplicationRepository = hostelApplicationRepository;
        this.complaintRepository = complaintRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!bootstrapEnabled) {
            log.debug("Initial admin bootstrap is disabled.");
            return;
        }

        bootstrapAdminUser();
        bootstrapDemoData();
    }

    private void bootstrapAdminUser() {
        if (!StringUtils.hasText(adminEmail) || !StringUtils.hasText(adminPassword)) {
            log.warn("Admin bootstrap is enabled, but email or password is blank. Skipping.");
            return;
        }

        String email = adminEmail.trim();
        if (userRepository.existsByEmail(email)) {
            log.info("Admin bootstrap skipped: User [{}] already exists.", email);
            return;
        }

        User adminUser = new User(
                adminFullName.trim(),
                email,
                passwordEncoder.encode(adminPassword),
                Role.ADMIN,
                true
        );

        userRepository.save(adminUser);
        log.info("Safe initial admin bootstrap completed successfully for [{}] with role [ADMIN].", email);
    }

    private void bootstrapDemoData() {
        // Seed Hostels if none exist
        Hostel sahyadri;
        Hostel kaveri;
        if (hostelRepository.count() == 0) {
            sahyadri = hostelRepository.save(new Hostel(
                    "Sahyadri Boys Hostel",
                    HostelType.BOYS,
                    "GP Sakoli Campus, Block A",
                    true
            ));
            kaveri = hostelRepository.save(new Hostel(
                    "Kaveri Girls Hostel",
                    HostelType.GIRLS,
                    "GP Sakoli Campus, Block B",
                    true
            ));

            // Seed Rooms
            roomRepository.save(new Room("101", 1, 3, sahyadri));
            roomRepository.save(new Room("102", 1, 2, sahyadri));
            roomRepository.save(new Room("201", 2, 4, sahyadri));
            roomRepository.save(new Room("G01", 1, 3, kaveri));
            log.info("Default demonstration hostels and rooms initialized.");
        } else {
            sahyadri = hostelRepository.findAll().stream()
                    .filter(h -> h.getHostelType() == HostelType.BOYS)
                    .findFirst()
                    .orElse(null);
            kaveri = hostelRepository.findAll().stream()
                    .filter(h -> h.getHostelType() == HostelType.GIRLS)
                    .findFirst()
                    .orElse(null);
        }

        // Seed Sample Student (Amit Sharma) if none exist
        if (studentRepository.count() == 0) {
            String defaultPwd = passwordEncoder.encode(StringUtils.hasText(adminPassword) ? adminPassword : "Admin@123");

            User studentUser = userRepository.save(new User(
                    "Amit Sharma",
                    "amit.sharma@gpsakoli.ac.in",
                    defaultPwd,
                    Role.STUDENT,
                    true
            ));

            Student student = studentRepository.save(new Student(
                    "EN2026CS001",
                    "Computer Engineering",
                    4,
                    "9876543210",
                    studentUser
            ));

            // Seed second student for unallocated state test
            User student2User = userRepository.save(new User(
                    "Priya Patil",
                    "priya.patil@gpsakoli.ac.in",
                    defaultPwd,
                    Role.STUDENT,
                    true
            ));

            studentRepository.save(new Student(
                    "EN2026EE003",
                    "Electrical Engineering",
                    6,
                    "9876543212",
                    student2User
            ));

            // Also seed student@gpsakoli.ac.in alias user
            User aliasUser = userRepository.save(new User(
                    "Student Resident",
                    "student@gpsakoli.ac.in",
                    defaultPwd,
                    Role.STUDENT,
                    true
            ));

            studentRepository.save(new Student(
                    "EN2026ME002",
                    "Mechanical Engineering",
                    2,
                    "9876543222",
                    aliasUser
            ));

            // Allocate Amit Sharma to Room 101 if room exists
            if (sahyadri != null) {
                Room room101 = roomRepository.findByHostelIdAndRoomNumber(sahyadri.getId(), "101").orElse(null);
                if (room101 != null) {
                    roomAllocationRepository.save(new RoomAllocation(
                            student,
                            room101,
                            LocalDate.now().minusDays(15),
                            null,
                            AllocationStatus.ACTIVE
                    ));
                    log.info("Default demonstration room allocation initialized for [{}] in Room 101.", studentUser.getEmail());
                }
            }

            log.info("Demonstration student residents successfully seeded.");
        }

        // Seed demonstration Wardens and hostel assignments if none exist
        if (userRepository.findByRole(Role.WARDEN).isEmpty()) {
            String defaultPwd = passwordEncoder.encode(StringUtils.hasText(adminPassword) ? adminPassword : "Admin@123");

            User wardenBoys = userRepository.save(new User(
                    "Ramesh Patil",
                    "warden.boys@gpsakoli.ac.in",
                    defaultPwd,
                    Role.WARDEN,
                    true
            ));

            User wardenGirls = userRepository.save(new User(
                    "Sunita Deshmukh",
                    "warden.girls@gpsakoli.ac.in",
                    defaultPwd,
                    Role.WARDEN,
                    true
            ));

            User wardenChief = userRepository.save(new User(
                    "Chief Warden",
                    "warden@gpsakoli.ac.in",
                    defaultPwd,
                    Role.WARDEN,
                    true
            ));

            if (sahyadri != null) {
                wardenHostelAssignmentRepository.save(new WardenHostelAssignment(wardenBoys, sahyadri));
                wardenHostelAssignmentRepository.save(new WardenHostelAssignment(wardenChief, sahyadri));
            }
            if (kaveri != null) {
                wardenHostelAssignmentRepository.save(new WardenHostelAssignment(wardenGirls, kaveri));
            }
            log.info("Demonstration wardens and hostel assignments successfully initialized.");
        }

        // Seed demonstration hostel applications if none exist
        if (hostelApplicationRepository.count() == 0) {
            HostelApplication app1 = new HostelApplication(
                    "HSA-2026-1021",
                    "Rahul Ramesh Meshram",
                    "rahul.meshram@example.com",
                    "9823456781",
                    "EN24109821",
                    "Diploma in Computer Engineering",
                    1,
                    "MALE",
                    "OBC",
                    88.60,
                    "Ramesh Meshram",
                    "9823456780",
                    "Tumsar Road, Dist. Bhandara",
                    52.0,
                    "Prefers ground floor room if available."
            );
            app1.setStatus(ApplicationStatus.PENDING);
            hostelApplicationRepository.save(app1);

            HostelApplication app2 = new HostelApplication(
                    "HSA-2026-1022",
                    "Sneha Anant Patil",
                    "sneha.patil@example.com",
                    "9730123456",
                    "EN24109822",
                    "Diploma in Electrical Engineering",
                    1,
                    "FEMALE",
                    "OPEN",
                    92.40,
                    "Anant Patil",
                    "9730123450",
                    "Bhandara Main Market, Dist. Bhandara",
                    44.0,
                    "DTE Merit rank top 5%."
            );
            app2.setStatus(ApplicationStatus.SELECTED);
            app2.setReviewedBy("warden.girls@gpsakoli.ac.in");
            app2.setReviewedAt(java.time.LocalDateTime.now().minusHours(2));
            hostelApplicationRepository.save(app2);

            HostelApplication app3 = new HostelApplication(
                    "HSA-2026-1023",
                    "Vaibhav Sanjay Dhumal",
                    "vaibhav.dhumal@example.com",
                    "9421890123",
                    "EN24109823",
                    "Diploma in Civil Engineering",
                    1,
                    "MALE",
                    "SC",
                    81.20,
                    "Sanjay Dhumal",
                    "9421890120",
                    "Lakhani, Dist. Bhandara",
                    28.5,
                    "Regular applicant."
            );
            app3.setStatus(ApplicationStatus.PENDING);
            hostelApplicationRepository.save(app3);

            HostelApplication app4 = new HostelApplication(
                    "HSA-2026-1024",
                    "Pooja Suresh Zade",
                    "pooja.zade@example.com",
                    "9890112233",
                    "EN24109824",
                    "Diploma in Mechanical Engineering",
                    1,
                    "FEMALE",
                    "VJNT",
                    78.50,
                    "Suresh Zade",
                    "9890112230",
                    "Pauni, Dist. Bhandara",
                    62.0,
                    "High distance applicant."
            );
            app4.setStatus(ApplicationStatus.PENDING);
            hostelApplicationRepository.save(app4);

            log.info("Demonstration student hostel applications successfully seeded.");
        }

        // Seed Demonstration Maintenance Complaints if enabled and none exist
        if (bootstrapComplaintsEnabled && complaintRepository.count() == 0) {
            var studentOpt = studentRepository.findByUserEmail("amit.sharma@gpsakoli.ac.in");
            var sahyadriOpt = hostelRepository.findAll().stream().findFirst();
            if (studentOpt.isPresent() && sahyadriOpt.isPresent()) {
                Student amit = studentOpt.get();
                Hostel sahyadriHostel = sahyadriOpt.get();
                Room room101 = roomRepository.findByHostelIdAndRoomNumber(sahyadriHostel.getId(), "101").orElse(null);

                Complaint c1 = new Complaint();
                c1.setTicketNumber("CMP-2026-E49A1");
                c1.setStudent(amit);
                c1.setHostel(sahyadriHostel);
                c1.setRoom(room101);
                c1.setTitle("Ceiling Fan Regulator Not Functioning");
                c1.setDescription("The speed regulator knob is stuck at maximum speed in Room 101. Need replacement.");
                c1.setCategory(ComplaintCategory.ELECTRICAL);
                c1.setUrgency(ComplaintUrgency.MEDIUM);
                c1.setStatus(ComplaintStatus.PENDING);
                complaintRepository.save(c1);

                Complaint c2 = new Complaint();
                c2.setTicketNumber("CMP-2026-P12B3");
                c2.setStudent(amit);
                c2.setHostel(sahyadriHostel);
                c2.setRoom(room101);
                c2.setTitle("Water Tap Dripping Continuously in 1st Floor Corridor Washroom");
                c2.setDescription("The tap in washroom stall #2 has a faulty washer and is continuously dripping water.");
                c2.setCategory(ComplaintCategory.PLUMBING);
                c2.setUrgency(ComplaintUrgency.HIGH);
                c2.setStatus(ComplaintStatus.IN_PROGRESS);
                c2.setResolutionNotes("Maintenance plumber notified, spare tap washer requisitioned.");
                complaintRepository.save(c2);

                log.info("Demonstration hostel maintenance complaints successfully seeded.");
            }
        }
    }
}
