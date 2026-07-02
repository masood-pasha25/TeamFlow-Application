-- Seed Users
INSERT INTO users (name, email, role, password) VALUES ('Masood', 'masood@teamflow.com', 'ADMIN', 'password123');
INSERT INTO users (name, email, role, password) VALUES ('Rahul', 'rahul@teamflow.com', 'MANAGER', 'password123');
INSERT INTO users (name, email, role, password) VALUES ('Vignesh', 'vignesh@teamflow.com', 'DEVELOPER', 'password123');
INSERT INTO users (name, email, role, password) VALUES ('Rohan', 'rohan@teamflow.com', 'VIEWER', 'password123');

-- Seed Projects
INSERT INTO projects (project_name, description, created_date) VALUES ('TeamFlow Core Platform', 'Development of the unified TeamFlow project management and incident tracking platform.', CURRENT_TIMESTAMP);
INSERT INTO projects (project_name, description, created_date) VALUES ('Infrastructure Migration', 'Migrating resources to low-cost cloud setups and designing highly scalable multi-region setups.', CURRENT_TIMESTAMP);

-- Seed Tasks
-- Task 1: Database Setup (Assigned to Vignesh)
INSERT INTO tasks (title, description, status, priority, due_date, assigned_user_id) VALUES ('Database Schema Design', 'Design JPA entities, setup relation tables and project migrations.', 'COMPLETED', 'HIGH', CURRENT_DATE - 2, 3);
-- Task 2: REST APIs (Assigned to Vignesh)
INSERT INTO tasks (title, description, status, priority, due_date, assigned_user_id) VALUES ('Develop REST API Endpoints', 'Implement CRUD controllers and business logic services with validations.', 'IN_PROGRESS', 'MEDIUM', CURRENT_DATE + 3, 3);
-- Task 3: Dashboard Frontend (Assigned to Vignesh)
INSERT INTO tasks (title, description, status, priority, due_date, assigned_user_id) VALUES ('Build Frontend Dashboard', 'Create responsive single-page dashboard using Vanilla HTML/CSS/JS.', 'UNDER_REVIEW', 'HIGH', CURRENT_DATE + 1, 3);
-- Task 4: Unit Testing (Assigned to Vignesh)
INSERT INTO tasks (title, description, status, priority, due_date, assigned_user_id) VALUES ('Write JUnit Integration Tests', 'Implement mock tests for services and endpoint validation.', 'ASSIGNED', 'LOW', CURRENT_DATE + 5, 3);
-- Task 5: Staging Deployment (Assigned to Vignesh)
INSERT INTO tasks (title, description, status, priority, due_date, assigned_user_id) VALUES ('Deploy Application to Staging', 'Configure package build and verify startup scripts in staging sandbox.', 'BLOCKED', 'CRITICAL', CURRENT_DATE + 2, 3);

-- Map Tasks to Projects (Many-to-Many)
INSERT INTO project_tasks (task_id, project_id) VALUES (1, 1);
INSERT INTO project_tasks (task_id, project_id) VALUES (2, 1);
INSERT INTO project_tasks (task_id, project_id) VALUES (3, 1);
INSERT INTO project_tasks (task_id, project_id) VALUES (4, 1);
INSERT INTO project_tasks (task_id, project_id) VALUES (5, 1);
INSERT INTO project_tasks (task_id, project_id) VALUES (5, 2); -- Task 5 is across both Project 1 and Project 2

-- Seed Task Dependencies
-- Task 5 (Deploy Staging) depends on Task 3 (Build Frontend)
INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (5, 3);
-- Task 3 (Build Frontend) depends on Task 2 (REST APIs)
INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (3, 2);

-- Seed Incidents
INSERT INTO incidents (title, description, severity, status, reporter_id, created_date) VALUES ('API Request Latency Spike', 'Average response time of GET /api/tasks spiked above 500ms under simulated load.', 'HIGH', 'OPEN', 4, CURRENT_TIMESTAMP);
INSERT INTO incidents (title, description, severity, status, reporter_id, created_date) VALUES ('CSS Alignment Safari Bug', 'Sidebar cards are wrapped incorrectly on iOS 15 Safari browsers.', 'LOW', 'INVESTIGATING', 3, CURRENT_TIMESTAMP);

-- Seed Reviews
INSERT INTO reviews (task_id, developer_id, reviewer_id, status, feedback, created_date) VALUES (3, 3, 2, 'PENDING', NULL, CURRENT_TIMESTAMP);

-- Seed Notifications
INSERT INTO notifications (user_id, message, is_read, created_date) VALUES (3, 'You have been assigned to task: Database Schema Design', true, CURRENT_TIMESTAMP - 2);
INSERT INTO notifications (user_id, message, is_read, created_date) VALUES (3, 'Reminder: Task Build Frontend Dashboard is due tomorrow!', false, CURRENT_TIMESTAMP - 1);
