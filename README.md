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
│   │   │   └── AdminDashboardController.java
│   │   ├── service/            # Business logic:
│   │   │   ├── AuthService.java
│   │   │   ├── HealthService.java
│   │   │   ├── HostelService.java
│   │   │   ├── RoomService.java
│   │   │   └── StudentService.java
│   │   ├── security/           # Security infrastructure:
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   ├── CustomUserDetailsService.java
│   │   │   ├── CustomAuthenticationEntryPoint.java
│   │   │   ├── CustomAccessDeniedHandler.java
│   │   │   └── AdminBootstrapRunner.java (Safe opt-in initial admin seed)
│   │   ├── repository/         # Spring Data JPA Repositories (StudentRepository, UserRepository, etc.)
│   │   ├── entity/             # JPA Domain Models (Hostel, Room, RoomAllocation, User, Student)
│   │   ├── dto/                # Data Transfer Objects (StudentCreateRequestDto, StudentResponseDto, etc.)
│   │   ├── exception/          # Centralized GlobalExceptionHandler & Domain Exceptions
│   │   └── HostelSyncBackendApplication.java
│   ├── src/main/resources/
│   │   └── application.properties # H2 datasource, JWT secrets, and admin bootstrap properties
│   ├── src/test/java/          # Test suites:
│   │   ├── controller/AdminStudentManagementTest.java # Student CRUD, search, 409 conflict, RBAC
│   │   ├── controller/AdminHostelManagementTest.java  # Hostels & Rooms CRUD, validation, 409 conflict, RBAC
│   │   ├── controller/AuthControllerTest.java         # Login, bad credentials, inactive user, expired token
│   │   ├── controller/RoleAuthorizationTest.java      # RBAC checks for ADMIN, WARDEN, STUDENT
│   │   ├── controller/HealthControllerTest.java       # Public /api/health verification
│   │   ├── repository/EntityPersistenceTest.java     # H2 JPA entity persistence & constraints
│   │   └── HostelSyncBackendApplicationTests.java    # Context loads & DataSource check

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
| `GET` | `/api/warden/overview` | `ROLE_WARDEN` or `ROLE_ADMIN` | Warden operations overview & verified RBAC identity |
| `GET` | `/api/student/overview` | `ROLE_STUDENT`, `ROLE_WARDEN`, or `ROLE_ADMIN` | Student resident services overview & verified RBAC identity |


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

## 5. Local H2 Database & Console Access

During local development, the backend uses **file-based H2**:
- **Database File**: `backend/data/hostelsyncdb.mv.db` (persists data across application restarts).
- **Console URL**: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
- **JDBC URL**: `jdbc:h2:file:./data/hostelsyncdb`
- **User Name**: `sa`
- **Password**: *(leave blank)*

> **Git Safety**: Local database files and the `data/` directory are excluded from version control in `.gitignore`.

---

## 6. Future PostgreSQL Migration

When ready to switch from H2 to PostgreSQL, simply provide the connection settings via environment variables (no application code changes required):

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/hostelsync"
$env:SPRING_DATASOURCE_DRIVER_CLASS_NAME = "org.postgresql.Driver"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "YourPassword"
```

See [database/README.md](file:///c:/Users/Admin/Documents/HostelSync/database/README.md) for database initialization scripts and schema definitions.
#   H o s t e l S y n c  
 