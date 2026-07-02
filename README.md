# TeamFlow — Unified Systems Engineering Platform

TeamFlow is a unified collaboration and software lifecycle management platform designed to consolidate tasks, incident reports, reviews, notifications, and reports into a single, cohesive monolithic application. It directly addresses fragmentation issues caused by using disparate tools (e.g. Jira, Slack, Excel, Google Docs, GitHub) by providing a single source of truth for the entire engineering organization.

## 🚀 Quick Start (Running Locally)

To build and run the application, ensure you have **Java 17+** (Java 26.0.1 recommended) installed.

1. **Clone/Open Workspace**
   Change to the project root directory.

2. **Compile and Run the Application**
   Run the embedded Maven wrapper command to launch the Spring Boot app:
   ```bash
   ./mvnw spring-boot:run
   ```

3. **Access the Dashboard**
   Open your browser and navigate to:
   - Dashboard UI: [http://localhost:8080/index.html](http://localhost:8080/index.html) or [http://localhost:8080/](http://localhost:8080/)
   - H2 Database Web Console: [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:teamflowdb`, Username: `sa`, Password: *blank*)

4. **Run Unit & Integration Tests**
   To execute the validation test suite:
   ```bash
   ./mvnw clean test
   ```

---

## 🛠️ Technology Stack & Architecture

- **Backend:** Spring Boot (Java 17+) REST API, Spring Data JPA.
- **Frontend:** Vanilla HTML5, CSS3 (Slate dark mode theme, glassmorphic grids, micro-animations), and modern JavaScript (ES6+ fetch APIs).
- **Database:** Embedded H2 SQL database running in MySQL-compatibility mode, seeded automatically at startup.
- **Portability:** Designed with clean abstraction layers. Easily swap H2 database to local/production MySQL by updating `src/main/resources/application.properties`.

---

## 📌 Features & Business Rules Implemented

### 1. Unified Dashboard
- Core metrics tracking total tasks, tasks in-progress, pending audits, and active production incidents.
- Live active project list with completion percentages computed dynamically based on completed tasks.
- Recent notifications feed mapped to the currently selected active profile role.

### 2. Task & Kanban Board
- Kanban columns representing lifecycle states: `CREATED`, `ASSIGNED`, `IN_PROGRESS`, `UNDER_REVIEW`, `COMPLETED`, and `BLOCKED`.
- Tasks can span multiple projects (**Many-to-Many project-task relationship**).
- **Strict Dependency Constraints:** Tasks cannot transition to `IN_PROGRESS` or `COMPLETED` if they have incomplete prerequisites. Setting incomplete prerequisites automatically flags downstream tasks as `BLOCKED`. Completing prerequisites cascades to unblock dependent tasks.
- **DFS Cycle Detection:** Prevents circular task dependencies (e.g., Task A depends on Task B, which depends on Task A).

### 3. Review Audits & Fallbacks
- Developers submit in-progress tasks to the review console, transitioning task status to `UNDER_REVIEW`.
- Auditors (Managers/Admins) can **Approve** (transitions task to `COMPLETED` and cascades unblock triggers) or **Reject** (forces task back to `IN_PROGRESS` and logs feedback).
- **Reviewer Unavailable Fallback:** If an auditor is out-of-office, the system automatically finds another eligible Manager/Admin and re-allocates the audit, dispatching system alerts to the team managers.

### 4. Incident Reports Feed
- Integrated incident submission console allowing developers to raise incidents.
- Severity levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) determine layout badges and trigger system notifications.
- Admin/Managers can inspect active incidents and update status through `INVESTIGATING` to `RESOLVED`.

### 5. Automated Deadline Scan
- Daily background cron checks tasks due tomorrow and alerts assignees.
- Exposes a manual trigger button in the UI header to simulate this scheduler.

---

## 🔒 Role-Based Permissions

Toggle active profile contexts via the dropdown selector in the sidebar footer to verify:
- **ADMIN:** Full systems access (all CRUD features, incident updates, review approvals).
- **MANAGER:** Can create projects/tasks, review work, view reports, and manage incidents.
- **DEVELOPER:** Can view board, log incidents, start work, and submit reviews for their assigned tasks.
- **VIEWER:** Read-only access across all boards, dashboards, and metrics. Form submissions are disabled.

---

## 📂 Deliverables Included

1. **`teamflow_design_document.pdf`:** Contains Architecture design diagrams, Database ERD specs, REST API mappings, and Design Decisions logs.
2. **`design_document.html`:** The HTML blueprint used to generate the PDF via Chrome headless printing.
3. **Database schema files:** Migrated through Hibernate JPA schema generation and seeded using `src/main/resources/data.sql`.
