# HostelSync — Smart Digital Hostel Management System

**HostelSync** is an institutional digital management platform designed specifically for **Government Polytechnic Sakoli** (Bhandara, Maharashtra). It transitions hostel governance from manual paper registers into an integrated, role-based digital system covering admissions, room and bed allocations, leave and gate passes, grievance ticketing, and administrative reporting.

---

## Project Structure

```
HostelSync/
├── frontend/                   # React.js 19 + Vite client application (JavaScript)
│   ├── public/                 # Static assets, institutional icons & favicon
│   ├── src/
│   │   ├── components/         # UI components (Navbar, Hero, ProtectedRoute, etc.)
│   │   ├── context/            # Authentication context & session token handling (AuthContext.jsx)
│   │   ├── pages/              # Portal pages (LoginPage, AdminPortal, WardenPortal, StudentPortal)
│   │   ├── App.jsx             # Client-side routing with role-guarded routes
│   │   ├── index.css           # Blue-and-white design tokens & utility styles
│   │   └── main.jsx            # Application entrypoint with BrowserRouter & AuthProvider
│   ├── package.json            # Frontend dependencies (React 19, React Router 7, Oxlint)
│   └── vite.config.js          # Vite configuration with /api reverse proxy
├── backend/                    # Java 21 + Spring Boot 3.4 REST API service
│   ├── .mvn/wrapper/           # Maven wrapper configuration
│   ├── data/                   # Ignored local H2 runtime database directory
│   ├── src/main/java/com/hostelsync/backend/
│   │   ├── config/             # SecurityConfig & CorsConfig
│   │   ├── controller/         # REST Controllers:
│   │   │   ├── AuthController.java
│   │   │   ├── RoleOverviewController.java
│   │   │   ├── HealthController.java
│   │   │   ├── AdminHostelController.java
│   │   │   ├── AdminRoomController.java
│   │   │   ├── AdminStudentController.java
│   │   │   ├── AdminAllocationController.java
│   │   │   ├── AdminWardenController.java
│   │   │   ├── AdminAttendanceController.java
│   │   │   ├── WardenOperationsController.java
│   │   │   ├── WardenAttendanceController.java
│   │   │   ├── StudentPortalController.java
│   │   │   ├── StudentAttendanceController.java
│   │   │   └── AdminDashboardController.java
│   │   ├── service/            # Business logic:
│   │   │   ├── AuthService.java
│   │   │   ├── HealthService.java
│   │   │   ├── HostelService.java
│   │   │   ├── RoomService.java
│   │   │   ├── StudentService.java
│   │   │   ├── AllocationService.java
│   │   │   ├── WardenAssignmentService.java
│   │   │   ├── WardenOperationsService.java
│   │   │   ├── AttendanceService.java
│   │   │   └── StudentPortalService.java
│   │   ├── security/           # Security infrastructure:
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   ├── CustomUserDetailsService.java
│   │   │   ├── CustomAuthenticationEntryPoint.java
│   │   │   ├── CustomAccessDeniedHandler.java
│   │   │   └── AdminBootstrapRunner.java (Safe opt-in initial admin, warden, & demo seeds)
│   │   ├── repository/         # Spring Data JPA Repositories (AttendanceRepository, etc.)
│   │   ├── entity/             # JPA Domain Models (Attendance, AttendanceStatus, Hostel, Room, RoomAllocation, User, Student, WardenHostelAssignment)
│   │   ├── dto/                # Data Transfer Objects (WardenAttendanceBulkRequestDto, AttendanceSummaryDto, etc.)
│   │   ├── exception/          # Centralized GlobalExceptionHandler & Domain Exceptions
│   │   └── HostelSyncBackendApplication.java
│   ├── src/main/resources/
│   │   └── application.properties # H2 datasource, JWT secrets, and admin bootstrap properties
│   ├── src/test/java/          # Test suites:
│   │   ├── controller/AttendanceManagementTest.java       # Roll call, bulk upsert, date limits, jurisdiction, RBAC
│   │   ├── controller/WardenOperationsTest.java           # Warden portal ops, scoping, 403 on unassigned, RBAC
│   │   ├── controller/StudentPortalTest.java             # Student dashboard, profile update, ownership, RBAC
│   │   ├── controller/AdminAllocationManagementTest.java # Room assignment, checkout, concurrency, 409, RBAC
│   │   ├── controller/AdminStudentManagementTest.java    # Student CRUD, search, 409 conflict, RBAC
│   │   ├── controller/AdminHostelManagementTest.java     # Hostels & Rooms CRUD, validation, 409 conflict, RBAC
│   │   ├── controller/AuthControllerTest.java            # Login, bad credentials, inactive user, expired token
│   │   ├── controller/RoleAuthorizationTest.java         # RBAC checks for ADMIN, WARDEN, STUDENT
│   │   ├── controller/HealthControllerTest.java          # Public /api/health verification
│   │   ├── repository/EntityPersistenceTest.java        # H2 JPA entity persistence & constraints
│   │   └── HostelSyncBackendApplicationTests.java       # Context loads & DataSource check

│   ├── mvnw.cmd                # Maven Wrapper executable for Windows
│   ├── mvnw                    # Maven Wrapper executable for Unix/macOS
│   └── pom.xml                 # Maven build definition (Java 21, Spring Security, JJWT 0.12.6, H2)
├── database/                   # Database documentation & SQL scripts
│   └── README.md               # H2 setup guide, core entities ER diagram, & PostgreSQL migration
├── docs/                       # Technical specifications & project documentation
│   └── project-overview.md     # Architecture overview, JWT lifecycle & RBAC role matrix
├── .gitignore                  # Git ignore rules for Java, Maven, Node.js, H2 data, IDEs
└── README.md                   # Project documentation & execution guide

```

---

## Prerequisites

| Runtime / Tool | Recommended Version | Verification Command | Status in Current Environment |
|---|---|---|---|
| **Node.js** | v20.x or v22.x+ (v24 tested) | `node -v` | Installed (v24.22.0) |
| **npm** | 10.x+ | `npm -v` | Installed (11.19.1) |
| **Java JDK** | 21 (LTS) | `java -version` | Installed (Temurin 21.0.12.1) |
| **Apache Maven** | 3.9.x+ | `.\mvnw.cmd -v` | Managed via Maven Wrapper |
| **Database (Dev)** | H2 Database | Built-in | Active (Phase 2A File Mode) |
| **Database (Prod)** | PostgreSQL 15/16 | `psql -V` | Planned for Later Phase |

---

## Getting Started

### 1. Frontend Setup & Execution (React + Vite)

The frontend runs independently on Vite development server and proxies REST calls to `http://localhost:8080`.

```powershell
# Navigate to the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

The frontend will start at:
- **Local URL**: [http://localhost:5173](http://localhost:5173)

---

### 2. Backend Setup & Execution (Spring Boot + Maven Wrapper)

The backend runs on Java 21 with Spring Data JPA and an embedded, file-based H2 database.

```powershell
# Navigate to the backend directory
cd backend

# Run the Spring Boot application using Maven Wrapper
.\mvnw.cmd spring-boot:run
```

The backend will start at:
- **Base URL**: `http://localhost:8080`
- **Health Check Endpoint**: `http://localhost:8080/api/health`
- **H2 Web Console**: `http://localhost:8080/h2-console`

#### Backend Health Response:
A `GET /api/health` request returns:
```json
{
  "status": "UP",
  "application": "HostelSync",
  "subtitle": "Smart Digital Hostel Management System",
  "institution": "Government Polytechnic Sakoli",
  "version": "1.0.0",
  "timestamp": "2026-10-17T12:00:00Z"
}
```

#### Running Backend Tests:
```powershell
cd backend
.\mvnw.cmd test
```

---

## 3. Secure Authentication & Role-Based Access Control (Phase 2C)

HostelSync implements token-based authentication using **Spring Security 6** and **JJWT (HMAC-SHA256)** with role enforcement for `ADMIN`, `WARDEN`, and `STUDENT`.

### API Endpoints:

| Method | Endpoint | Access / Role Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | **Public** (No auth) | Application health check & metadata |
| `POST` | `/api/auth/login` | **Public** (No auth) | Authenticates email & password; returns JWT token & user summary |
| `GET` | `/api/auth/me` | **Authenticated** (Any valid token) | Returns current authenticated user profile (excludes `passwordHash`) |
| `GET` | `/api/admin/overview` | `ROLE_ADMIN` | Administrator governance overview & verified RBAC identity |
| `GET` | `/api/admin/dashboard` | `ROLE_ADMIN` | Consolidated inventory KPIs (hostels, rooms, capacity, allocations, beds) |
| `GET` | `/api/admin/hostels` | `ROLE_ADMIN` | List all hostel buildings with inventory metrics |
| `GET` | `/api/admin/hostels/{id}` | `ROLE_ADMIN` | Retrieve a specific hostel building by ID |
| `POST` | `/api/admin/hostels` | `ROLE_ADMIN` | Register a new hostel building (name, type, address, active) |
| `PUT` | `/api/admin/hostels/{id}` | `ROLE_ADMIN` | Update hostel building information (validates against active allocations) |
| `PATCH` | `/api/admin/hostels/{id}/status` | `ROLE_ADMIN` | Activate or deactivate hostel (blocks deactivation if active allocations exist) |
| `GET` | `/api/admin/hostels/{hostelId}/rooms` | `ROLE_ADMIN` | List all rooms for a hostel with floor, capacity, and occupancy stats |
| `POST` | `/api/admin/hostels/{hostelId}/rooms` | `ROLE_ADMIN` | Create a room in a hostel (enforces room number uniqueness, capacity >= 1, floor >= 0) |
| `GET` | `/api/admin/rooms/{id}` | `ROLE_ADMIN` | Retrieve room details by ID |
| `PUT` | `/api/admin/rooms/{id}` | `ROLE_ADMIN` | Update room (blocks capacity reduction below active resident count) |
| `GET` | `/api/admin/students` | `ROLE_ADMIN` | List all students with current housing status; optional `?search=` by enrollment or name |
| `GET` | `/api/admin/students/{id}` | `ROLE_ADMIN` | Retrieve student detail with academic profile, user linkage, and room assignment |
| `POST` | `/api/admin/students` | `ROLE_ADMIN` | Enroll student & create linked User account (`ROLE_STUDENT`, BCrypt password, unique checks) |
| `PUT` | `/api/admin/students/{id}` | `ROLE_ADMIN` | Update student academic & contact profile (enforces uniqueness across other students) |
| `PATCH` | `/api/admin/students/{id}/status` | `ROLE_ADMIN` | Toggle student active status (eligible/ineligible for admissions) |
| `DELETE` | `/api/admin/students/{id}` | `ROLE_ADMIN` | Safely delete student (returns 409 Conflict if historical room allocations exist) |
| `GET` | `/api/admin/allocations` | `ROLE_ADMIN` | List room allocations with search (`search`) and status (`ACTIVE`/`COMPLETED`) or hostel filters |
| `GET` | `/api/admin/allocations/{id}` | `ROLE_ADMIN` | Retrieve allocation record detail (dates, student profile, room, hostel; no sensitive hashes) |
| `POST` | `/api/admin/allocations` | `ROLE_ADMIN` | Assign student to room (verifies active student/hostel, pessimistic write lock prevents over-allocation) |
| `POST` | `/api/admin/allocations/{id}/checkout` | `ROLE_ADMIN` | Check out resident (sets status to `COMPLETED`, records vacating date, immediately restores bed capacity) |
| `GET` | `/api/admin/allocations/available-students` | `ROLE_ADMIN` | List eligible students for room allocation (active student account, no existing ACTIVE allocation) |
| `GET` | `/api/admin/allocations/available-rooms` | `ROLE_ADMIN` | List rooms with remaining capacity & occupancy metrics for hostel (`?hostelId={id}&includeFull=true`) |
| `GET` | `/api/warden/overview` | `ROLE_WARDEN` or `ROLE_ADMIN` | Warden operations overview & verified RBAC identity |
| `GET` | `/api/student/overview` | `ROLE_STUDENT`, `ROLE_WARDEN`, or `ROLE_ADMIN` | Student resident services overview & verified RBAC identity |
| `GET` | `/api/student/dashboard` | `ROLE_STUDENT` | Consolidated resident dashboard (academic profile, room status, live bed metrics) |
| `GET` | `/api/student/profile` | `ROLE_STUDENT` | Retrieve authenticated student's academic and contact profile (read-only institutional record) |
| `PUT` | `/api/student/profile` | `ROLE_STUDENT` | Safe self-service profile update (permits phone editing only; protected fields locked) |
| `GET` | `/api/student/allocations` | `ROLE_STUDENT` | Retrieve student's own residential allocation history (ordered latest first) |
| `GET` | `/api/student/allocations/current` | `ROLE_STUDENT` | Retrieve current active room allocation details with live capacity and occupancy |


### Required & Configurable Environment Variables:

| Variable | Default (Local Dev) | Description |
|---|---|---|
| `JWT_SECRET` | 64-char development key | Base HMAC-SHA256 key (minimum 256 bits). In production, supply a random cryptographically secure string. |
| `JWT_EXPIRATION_MS` | `86400000` (24 Hours) | Lifetime of signed JWT tokens in milliseconds. |
| `APP_BOOTSTRAP_ADMIN_ENABLED` | `false` | Set to `true` to bootstrap an initial administrator account on startup. Disabled by default. |
| `APP_BOOTSTRAP_ADMIN_EMAIL` | *(empty)* | Email for initial administrator account. Required if bootstrap is enabled. |
| `APP_BOOTSTRAP_ADMIN_PASSWORD` | *(empty)* | Password for initial administrator account (hashed with BCrypt; never stored plaintext). |
| `APP_BOOTSTRAP_ADMIN_FULL_NAME` | `"HostelSync Administrator"` | Display name for the initial administrator. |

#### Example: Bootstrapping an Initial Administrator Account:
```powershell
$env:APP_BOOTSTRAP_ADMIN_ENABLED = "true"
$env:APP_BOOTSTRAP_ADMIN_EMAIL = "principal@gpsakoli.ac.in"
$env:APP_BOOTSTRAP_ADMIN_PASSWORD = "StrongSecurePassword123!"
$env:APP_BOOTSTRAP_ADMIN_FULL_NAME = "Principal Sakoli"
cd backend
.\mvnw.cmd spring-boot:run
```

### Token Handling Strategy (Frontend):
The React application avoids storing long-lived JWTs in `localStorage` to safeguard against persistent session theft on shared institutional laboratory workstations. Instead:
- JWTs are stored in **`sessionStorage`** and active in-memory React context state.
- Tokens are strictly isolated to the browser tab/session and automatically destroyed when the tab is closed.
- State survives normal page reloads within the same session.

---

## 4. Core Database Entities (Phase 2B)

The domain model implements 5 core relational entities managed via Spring Data JPA:

1. **`User`** (`users`): System accounts with `fullName`, unique `email`, secure `passwordHash`, `role` (`ADMIN`, `WARDEN`, `STUDENT`), `active` status, and `createdAt` timestamp.
2. **`Student`** (`students`): Polytechnic resident profile with unique `enrollmentNumber`, `course`, `semester`, `phone`, and a 1:1 foreign key reference to `User`.
3. **`Hostel`** (`hostels`): Campus hostel block with `name`, `hostelType` (`BOYS`, `GIRLS`), `address`, and `active` status.
4. **`Room`** (`rooms`): Accommodation unit with `roomNumber`, `floor`, `capacity`, ManyToOne reference to `Hostel`, and a composite unique constraint `(hostel_id, room_number)`.
5. **`RoomAllocation`** (`room_allocations`): Student bed assignment linking `Student` and `Room` with `allocationDate`, `vacatingDate`, and `status` (`ACTIVE`, `COMPLETED`).

See [database/README.md](file:///c:/Users/Admin/Documents/HostelSync/database/README.md) for the entity relationship diagram and field specifications.


---

## 5. Room Allocation Assignment Workflow (Phase 3C)

HostelSync provides an automated, concurrency-safe room allocation workflow for `ADMIN` staff:

### Allocation Business Rules:
1. **Eligible Student Verification**:
   - Only students with an active `Student` profile and active `User` account (`Role.STUDENT`) can receive room allotments.
   - A student can hold at most **one** `ACTIVE` allocation at any time. Duplicate allocation attempts are rejected with `409 Conflict`.
2. **Hostel & Room Capacity Validation**:
   - Allocations are permitted only in active hostel buildings and valid rooms belonging to the selected hostel.
   - Current occupancy is calculated strictly from active allocations (`status = 'ACTIVE'`). Completed allocations (`status = 'COMPLETED'`) do not consume bed space.
   - Assignments to full rooms (`availableBeds <= 0`) are rejected with `409 Conflict`.
3. **Database Concurrency & Race-Condition Defense**:
   - High-concurrency room allotments are serialized at the database row level using `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`SELECT ... FOR UPDATE` in SQL) on `RoomRepository.findByIdWithLock()`.
   - Verified via automated multithreaded test suites (`ExecutorService` + `CountDownLatch`), ensuring zero bed over-allocation under simultaneous requests.
4. **Checkout Lifecycle & History Preservation**:
   - Resident departure is executed via `POST /api/admin/allocations/{id}/checkout`.
   - Sets allocation status to `COMPLETED` and records `vacatingDate` (validated to ensure it does not precede `allocationDate`).
   - Bed capacity is immediately restored for subsequent student assignments.
   - Historical records are permanently preserved for institutional compliance and audits. Repeated checkout attempts return `409 Conflict`.
5. **Data Protection & Privacy**:
   - API responses return sanitized DTOs (`AllocationResponseDto`, `AvailableStudentDto`) omitting sensitive hashes (`passwordHash`).

---

## 6. Student Resident Portal & Self-Service Architecture (Phase 3D)

HostelSync provides a dedicated, authenticated resident portal (`/student`) custom-designed for diploma engineering students at Government Polytechnic Sakoli.

### Core Features & Architecture:
1. **Server-Side Identity & Data Ownership Safeguards**:
   - Identity is resolved strictly server-side from the authenticated JWT security principal (`authentication.getName()`).
   - A student can **never** access or mutate another student's profile or residential allocation history by manipulating URL paths or query parameters.
   - All student-scoped REST endpoints under `/api/student/**` require `ROLE_STUDENT`.
   - `ADMIN` and `WARDEN` roles cannot access student self-service endpoints (rejected with `403 Forbidden`).
2. **Personal Resident Dashboard**:
   - Real-time accommodation status: Room number, floor, hostel name, total bed capacity, current active occupancy, and remaining vacant beds.
   - Friendly empty state when no active allocation exists, explaining how room allotments are administered.
   - Academic standing (Course / Department, current Semester).
   - Residential allocation count.
3. **Safe Profile Management & Integrity Protection**:
   - Institutional academic fields (Name, Enrollment Number, Course, Semester, Role, Active status) are read-only and locked against unauthorized modification.
   - Students may safely update only their registered mobile phone number via `PUT /api/student/profile`.
   - Validates phone format (7 to 20 digits, standard phone characters) and rejects invalid or blank inputs (`400 Bad Request`).
4. **My Room & Residential Allocation History**:
   - Live room metrics: Capacity, current occupancy, and available vacant beds.
   - Institutional resident guidelines (curfew hours, cleanliness inspections, maintenance reporting).
   - Complete residential history timeline listing all past (`COMPLETED`) and active (`ACTIVE`) allotments ordered latest first.
5. **Sensitive Field Redaction**:
   - All response DTOs (`StudentDashboardDto`, `StudentProfileResponseDto`, `StudentRoomDetailsDto`, `StudentAllocationHistoryDto`) strictly redact password hashes, security credentials, and unnecessary account metadata.

---

## 7. Warden Operations & Hostel Supervision Architecture (Phase 3E)

HostelSync provides a specialized, role-governed operational portal (`/warden`) custom-designed for hostel superintendents and wardens at Government Polytechnic Sakoli.

### Core Architecture & Authorization Model:
1. **Normalized Warden-to-Hostel Assignment**:
   - Built upon the `WardenHostelAssignment` JPA entity and `WardenHostelAssignmentRepository` with database unique constraint `(warden_id, hostel_id)`.
   - Supports assigning one or more hostels to each warden, mapping multiple wardens to respective blocks without hardcoded shortcuts.
   - **Admin-Controlled Purview**: Only administrators (`ROLE_ADMIN`) may create, list, or revoke warden hostel assignments via `/api/admin/wardens/**`. Wardens cannot self-assign hostels (`403 Forbidden`).
2. **Strict Hostel-Level Access Boundaries**:
   - All operational endpoints under `/api/warden/**` require `ROLE_WARDEN`.
   - The security principal (`authentication.getName()`) is resolved server-side on every request to derive authorized hostel IDs.
   - Any attempt by Warden A to query or inspect unassigned hostel premises, rooms, or allocation records belonging to Warden B returns `403 Forbidden` (or `404 Not Found` without information leakage).
   - Students and unauthenticated callers are strictly blocked (`403 Forbidden` and `401 Unauthorized`).
3. **Warden Operations REST Endpoints**:
   - `GET /api/warden/dashboard` — Aggregated operational statistics across all assigned hostels (total rooms, capacity, occupied beds, vacant beds, occupancy rate %, recent allocations).
   - `GET /api/warden/hostels` — Lists assigned hostels with live room counts and occupancy indicators.
   - `GET /api/warden/hostels/{id}` — Retrieves single assigned hostel details (with ownership enforcement).
   - `GET /api/warden/hostels/{id}/rooms` — Retrieves room inventories for an assigned hostel with current occupant breakdowns.
   - `GET /api/warden/rooms/{roomId}` — Inspects single room details and active student occupants.
   - `GET /api/warden/residents` — Lists active student residents within assigned hostels, with multi-field search (`search`) and hostel filter (`hostelId`).
   - `GET /api/warden/allocations` — Lists allocation history for assigned hostels, with status filter (`ACTIVE` / `COMPLETED`) and query search.
   - `GET /api/warden/allocations/{id}` — Retrieves single allocation details (with ownership enforcement).
4. **Warden Portal Frontend (`/warden`)**:
   - 5 dedicated views: **Dashboard Overview**, **Assigned Hostels**, **Room Inventory** (with bed status pills and occupant badges), **Resident Directory** (with contact links), and **Allocation History** (with status filters).
   - Graceful empty states when no hostels are assigned or search queries yield no results.
   - Full JWT session integration and sign-out workflow.
5. **Admin Portal Integration**:
   - Admin Portal (`/admin`) features a 6th **Warden Oversight** tab allowing administrators to view all registered wardens, inspect their assigned hostels, assign new hostel blocks, and revoke oversight with immediate effect.

### Demonstration Accounts:
| Role | Email | Password | Assigned Oversight |
|---|---|---|---|
| **ADMIN** | `admin@gpsakoli.ac.in` | `Admin@123` | Institutional Oversight (All Hostels & Wardens) |
| **WARDEN (Boys)** | `warden.boys@gpsakoli.ac.in` | `Admin@123` | Sahyadri Boys Hostel |
| **WARDEN (Girls)** | `warden.girls@gpsakoli.ac.in` | `Admin@123` | Kaveri Girls Hostel |
| **WARDEN (Chief)** | `warden@gpsakoli.ac.in` | `Admin@123` | Sahyadri Boys Hostel |
| **STUDENT (Resident)** | `amit.sharma@gpsakoli.ac.in` | `Admin@123` | Room 101, Sahyadri Boys Hostel |
| **STUDENT (Unallocated)** | `priya.patil@gpsakoli.ac.in` | `Admin@123` | Awaiting Room Allotment |

---

## 8. Hostel Attendance Management Architecture (Phase 4)

HostelSync Phase 4 introduces a complete, secure, database-backed hostel residence attendance (night roll call) management system tailored for Government Polytechnic Sakoli.

### Core Data Model & Constraints:
- **`Attendance` Entity**: Represents a single nightly roll call record for a student on a specific date.
  - Fields: `id`, `student_id`, `attendance_date`, `status` (`PRESENT`, `ABSENT`, `ON_LEAVE`), `remarks` (max 500 chars), `recorded_by` (Warden User ID), `created_at`, `updated_at`.
  - **Database Uniqueness Constraint**: Composite unique index `uk_student_attendance_date` on `(student_id, attendance_date)`. Multiple records for the same student on the same date are rejected at both database and service levels.
  - **Historical Preservation**: Non-cascading relationship with `Student` and `User`. Deactivating or checking out a resident preserves all historical roll call logs for institutional audits.

### Attendance Business Rules:
1. **Active Allocation Requirement**: Only active students who currently hold an `ACTIVE` room allocation in a hostel may be marked for attendance. Day scholars and unallocated students cannot be marked.
2. **Hostel-Level Authorization Boundaries**:
   - Wardens can only record, view, or update attendance for students currently residing in hostel buildings assigned to that Warden via `WardenHostelAssignment`.
   - Any attempt to access or modify records of unassigned hostels returns `403 Forbidden`.
3. **Date Policy Enforcement**:
   - Evaluated strictly using the institution's local timezone (`Asia/Kolkata`).
   - **No Future Dates**: Marking attendance for future calendar dates is rejected with `400 Bad Request`.
   - **Backdating Window**: Wardens may only record or update attendance for today or up to 7 days in the past. Backdating beyond 7 days is rejected.
4. **Transactional Bulk Upserting**:
   - Bulk roll calls execute atomically within `@Transactional`.
   - Submitting attendance for students who already have a record for that date updates status, remarks, and `recorded_by` in-place rather than causing constraint conflicts.
5. **Authenticated Recorder Identity**:
   - The duty warden's user identity is resolved strictly server-side from the authenticated JWT security principal (`authentication.getName()`). Client-supplied recorder IDs are completely ignored.

### REST Endpoints Reference:

| Endpoint | Method | Role | Description |
|---|:---:|:---:|---|
| `/api/warden/attendance?hostelId={id}&date={date}` | `GET` | `WARDEN` | Retrieves roll call roster for assigned hostel on date, with existing markings |
| `/api/warden/attendance/bulk` | `POST` | `WARDEN` | Submits atomic bulk roll call for multiple students |
| `/api/warden/attendance/{id}` | `PUT` | `WARDEN` | Updates single attendance record (status & remarks) with jurisdiction check |
| `/api/warden/attendance/history` | `GET` | `WARDEN` | Historical search with date range (`from`, `to`), `status`, and student name/roll filters |
| `/api/admin/attendance/summary` | `GET` | `ADMIN` | Institution-wide roll call KPI metrics & per-hostel breakdown for a date |
| `/api/admin/attendance/history` | `GET` | `ADMIN` | Comprehensive audit trail across all hostels, wardens, and date ranges |
| `/api/student/attendance/summary` | `GET` | `STUDENT` | Monthly personal attendance summary with percentage calculation |
| `/api/student/attendance/history` | `GET` | `STUDENT` | Personal attendance history log with status badges and warden notes |

### Frontend Portals Implementation:
- **Warden Portal (`/warden`)**:
  - Dedicated **Night Roll Call** tab.
  - Date selector and assigned hostel building selector.
  - Roster table with quick toggle buttons for **Present**, **Absent**, and **On Leave**, optional remarks input, and student search.
  - Bulk submission button with count confirmation and immediate visual feedback.
  - Historical tab with date range filter, status filter, and record edit modal.
- **Admin Portal (`/admin`)**:
  - Dedicated **Attendance Oversight** tab.
  - Date and hostel filters for campus-wide visibility.
  - Executive KPI cards: Active Resident Strength, Present Tonight, Absent/Missing, Authorized Leave, and Institution Attendance %.
  - Per-hostel breakdown table with visual progress indicators and unmarked resident alerts.
  - Comprehensive audit log with multi-field search and exportable layout.
- **Student Portal (`/student`)**:
  - Dedicated **My Attendance** tab.
  - Monthly picker with instant recalculation.
  - Transparent formula explanation: `(Present Days ÷ Total Marked Days) × 100`.
  - Minimum 75% residency requirement alert indicator.
  - KPI cards for Monthly Attendance Rate %, Present Days, Absent Days, Leave Days, and Marked Days.
  - Detailed personal roll call log table with status badges and warden notes.

### Verification & Testing:
- **Backend Test Suite**: 106 integration tests run with 0 failures and 0 errors (`mvnw test`).
- **Phase 4 Specific Suite (`AttendanceManagementTest`)**: 16 comprehensive integration tests covering:
  - Admin access to institutional summaries.
  - Warden access restricted strictly to assigned hostels.
  - Prevention of unauthorized cross-warden record access (`403 Forbidden`).
  - Student access restricted strictly to personal records.
  - Authentication checks (`401 Unauthorized` for unauthenticated requests).
  - Role-based authorization (`403 Forbidden` for unauthorized roles).
  - Prevention of duplicate student/date records.
  - Preserving uniqueness on updates.
  - Rejection of inactive and unallocated students.
  - Rejection of future dates and excessive backdating (> 7 days).
  - Validation of status values and remarks length limits.
  - Preservation of historical attendance records.
- **Frontend Code Quality**: `npx oxlint` passed with 0 warnings and 0 errors.
- **Production Build**: `npm run build` completed successfully with Vite production bundle.

### Manual Verification Guide:
*(Note: If automated browser subagents are not enabled or have browser window restrictions on the local workstation, use these manual steps):*
1. **Start Backend**: `cd backend && .\mvnw.cmd spring-boot:run` (runs on `http://localhost:8080`).
2. **Start Frontend**: `cd frontend && npm run dev` (runs on `http://localhost:5173`).
3. **Warden Roll Call Verification**:
   - Log in as `warden.boys@gpsakoli.ac.in` / `Admin@123`.
   - Navigate to the **Night Roll Call** tab.
   - Verify assigned hostel (Sahyadri Boys Hostel) is selected.
   - Click "Present", "Absent", or "On Leave" on resident Amit Sharma.
   - Click "Save Roll Call". Verify success banner and updated counts.
   - Switch to "Roll Call History" sub-tab and confirm the recorded attendance entry.
4. **Admin Oversight Verification**:
   - Log in as `admin@gpsakoli.ac.in` / `Admin@123`.
   - Navigate to the **Attendance Oversight** tab.
   - Verify today's KPI metrics and the hostel breakdown table showing marked/present numbers.
   - Check the Detailed Attendance Audit Log showing Amit Sharma's record and recording warden name.
5. **Student Personal Verification**:
   - Log in as `amit.sharma@gpsakoli.ac.in` / `Admin@123`.
   - Navigate to the **My Attendance** tab.
   - Verify the monthly attendance gauge displays `100.0%` (or matching calculation).
   - Verify the Personal Roll Call Log lists today's attendance entry with verified status badge.

---

## 9. Local H2 Database & Console Access

During local development, the backend uses **file-based H2**:
- **Database File**: `backend/data/hostelsyncdb.mv.db` (persists data across application restarts).
- **Console URL**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
- **JDBC URL**: `jdbc:h2:file:./data/hostelsyncdb`
- **User Name**: `sa`
- **Password**: *(leave blank)*

> **Git Safety**: Local database files and the `data/` directory are excluded from version control in `.gitignore`.

---

## 10. Future PostgreSQL Migration

When ready to switch from H2 to PostgreSQL, simply provide the connection settings via environment variables (no application code changes required):

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/hostelsync"
$env:SPRING_DATASOURCE_DRIVER_CLASS_NAME = "org.postgresql.Driver"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "YourPassword"
```

See [database/README.md](file:///c:/Users/Admin/Documents/HostelSync/database/README.md) for database initialization scripts and schema definitions.

---

## 11. Institutional Visual Design System & Media Asset Pipeline

HostelSync features a client-grade, institutional design system crafted specifically for Government Polytechnic Sakoli.

### Visual Design Tokens
- **Primary Brand Palette**: Deep Navy (`--primary-900: #0b192c`, `--primary-800: #1e3e62`, `--primary-700: #1e3a8a`).
- **Accent Indicators**: Emerald (`--accent-emerald-600: #059669`) for positive status and bed vacancy, Amber (`--accent-amber-600: #d97706`) for intermediate capacity, Rose (`--accent-rose-600: #dc2626`) for high occupancy and full rooms.
- **Surfaces**: Crisp white cards (`--white: #ffffff`) on subtle slate backgrounds (`--slate-50: #f8fafc`), framed with restrained borders (`--slate-200: #e2e8f0`).
- **Typography**: Clean system font stack (`Inter`, `system-ui`, `-apple-system`) with strict line-heights and contrast ratios adhering to WCAG 2.1 AA standards.
- **Accessibility & Motion**: Full support for keyboard navigation, distinct focus rings (`:focus-visible`), and `@media (prefers-reduced-motion: reduce)`.

### Central Media Registry (`frontend/src/config/media.js`)
All image references are unified in `MEDIA_REGISTRY`, providing local assets, verified CDN fallbacks, captions, and accessible descriptions:

| Asset Key | Local File | Purpose & Usage | Demonstration Source |
|---|---|---|---|
| `campusHero` | `/images/campus-hero.jpg` | Homepage landing hero frame | Institutional campus demonstration photo (Unsplash) |
| `boysHostel` | `/images/boys-hostel.jpg` | Sahyadri Boys Hostel cards & overview | University hostel exterior demonstration photo (Unsplash) |
| `girlsHostel` | `/images/girls-hostel.jpg` | Jijau Girls Hostel cards & overview | Modern campus residential facility photo (Unsplash) |
| `roomInterior` | `/images/room-interior.jpg` | Student "My Room" hero banner | Student dormitory room interior photo (Unsplash) |
| `commonArea` | `/images/common-study.jpg` | Common study & hall areas | Student library/study space photo (Unsplash) |
| `loginHero` | `/images/login-hero.jpg` | Split-screen authentication backdrop | Institutional building architecture photo (Unsplash) |

### Resilient Image Fallback Architecture (`ImageWithFallback.jsx`)
1. **Primary**: Fast local asset loading from `/images/*.jpg` with zero external network latency.
2. **Secondary Fallback**: Automatic failover to verified remote Unsplash CDN URLs if a local asset is missing.
3. **Tertiary Fallback**: Clean institutional SVG building placeholder if offline or blocked, preventing layout shifts and broken image icons.

### Instructions to Replace Demo Photos with Official GP Sakoli Campus Photos
To substitute demonstration photography with official photographs taken at Government Polytechnic Sakoli:
1. Save the official photographs as optimized JPG files (`~1200×800px`, `< 300KB`).
2. Overwrite the files in `frontend/public/images/`:
   - `campus-hero.jpg` — Campus main gate and administrative building.
   - `boys-hostel.jpg` — Sahyadri Boys Hostel exterior.
   - `girls-hostel.jpg` — Jijau Girls Hostel exterior.
   - `room-interior.jpg` — Standard student room interior with beds and study desks.
   - `common-study.jpg` — Hostel study hall, reading room, or recreation room.
   - `login-hero.jpg` — Architectural view of the campus hostel complex.
3. If new hostel blocks are constructed, register them in `frontend/src/config/media.js` under `MEDIA_REGISTRY`. No changes to page components or backend code are required.

#   H o s t e l S y n c  
 