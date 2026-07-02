// TeamFlow Frontend Logic Coordinator

// Global State
let users = [];
let projects = [];
let tasks = [];
let reviews = [];
let incidents = [];
let notifications = [];
let activeUser = null;
let activeTab = 'dashboard-tab';

// DOM Elements
const authContainer = document.getElementById('authContainer');
const signInCard = document.getElementById('signInCard');
const signUpCard = document.getElementById('signUpCard');
const forgotCard = document.getElementById('forgotCard');

const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileRole = document.getElementById('profileRole');
const logoutBtn = document.getElementById('logoutBtn');

const tabLinks = document.querySelectorAll('.nav-link');
const pageTabs = document.querySelectorAll('.page-tab');
const currentTabTitle = document.getElementById('currentTabTitle');
const unreadCount = document.getElementById('unreadCount');
const bellBtn = document.getElementById('bellBtn');
const notificationDrawer = document.getElementById('notificationDrawer');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');
const drawerContentList = document.getElementById('drawerContentList');
const blockedTaskBanner = document.getElementById('blockedTaskBanner');

// Dashboard Elements
const metricTotalTasks = document.getElementById('metricTotalTasks');
const metricInProgressTasks = document.getElementById('metricInProgressTasks');
const metricPendingReviews = document.getElementById('metricPendingReviews');
const metricActiveIncidents = document.getElementById('metricActiveIncidents');
const dashboardProjectsList = document.getElementById('dashboardProjectsList');
const dashboardNotificationsList = document.getElementById('dashboardNotificationsList');

// Kanban Elements
const projectFilter = document.getElementById('projectFilter');
const laneCreated = document.getElementById('lane-CREATED');
const laneAssigned = document.getElementById('lane-ASSIGNED');
const laneInProgress = document.getElementById('lane-IN_PROGRESS');
const laneUnderReview = document.getElementById('lane-UNDER_REVIEW');
const laneCompleted = document.getElementById('lane-COMPLETED');
const laneBlocked = document.getElementById('lane-BLOCKED');

// Modals
const taskModal = document.getElementById('taskModal');
const projectModal = document.getElementById('projectModal');
const rejectModal = document.getElementById('rejectModal');
const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');
const closeProjectModalBtn = document.getElementById('closeProjectModalBtn');
const cancelProjectBtn = document.getElementById('cancelProjectBtn');
const closeRejectModalBtn = document.getElementById('closeRejectModalBtn');
const cancelRejectBtn = document.getElementById('cancelRejectBtn');

// Forms
const taskForm = document.getElementById('taskForm');
const projectForm = document.getElementById('projectForm');
const incidentForm = document.getElementById('incidentForm');
const rejectForm = document.getElementById('rejectForm');

const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const forgotForm = document.getElementById('forgotForm');

// Base API URL
const API_BASE = '/api';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    
    // Check if session exists
    const storedUser = localStorage.getItem('tf_active_user');
    if (storedUser) {
        activeUser = JSON.parse(storedUser);
        authContainer.classList.remove('active');
        await loadInitialData();
    } else {
        authContainer.classList.add('active');
    }
});

// Load all backend entities
async function loadInitialData() {
    if (!activeUser) return;
    try {
        const usersRes = await fetch(`${API_BASE}/users`);
        users = await usersRes.json();
        
        const projectsRes = await fetch(`${API_BASE}/projects`);
        projects = await projectsRes.json();

        const tasksRes = await fetch(`${API_BASE}/tasks`);
        tasks = await tasksRes.json();

        const reviewsRes = await fetch(`${API_BASE}/reviews`);
        reviews = await reviewsRes.json();

        const incidentsRes = await fetch(`${API_BASE}/incidents`);
        incidents = await incidentsRes.json();

        // Update Profile Display
        profileAvatar.textContent = activeUser.name.charAt(0).toUpperCase();
        profileName.textContent = activeUser.name;
        profileRole.textContent = activeUser.role;

        // Populate Project filter and multiselect inputs
        populateProjectSelections();
        populateTaskFormSelections();

        // Load notifications for active user
        await loadNotifications();
        
        // Refresh entire UI
        renderUI();
        applyPermissions();
    } catch (err) {
        console.error('Error loading initial data:', err);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Brand header click -> switch to dashboard tab and show full screen splash tagline overlay
    document.getElementById('brandHeader').addEventListener('click', () => {
        if (!activeUser) return;
        const dashLink = document.querySelector('.nav-link[data-tab="dashboard-tab"]');
        if (dashLink) dashLink.click();
        
        const splash = document.getElementById('taglineSplash');
        if (splash) {
            splash.style.display = 'flex';
            splash.classList.add('active');
            splash.style.animation = 'fadeIn 0.4s ease-out';
            
            if (window.splashTimeout1) clearTimeout(window.splashTimeout1);
            window.splashTimeout1 = setTimeout(() => {
                splash.style.animation = 'fadeOut 0.4s ease-in';
            }, 1800);
            
            if (window.splashTimeout2) clearTimeout(window.splashTimeout2);
            window.splashTimeout2 = setTimeout(() => {
                splash.classList.remove('active');
                splash.style.display = 'none';
            }, 2200);
        }
    });

    // Auth Switchers
    document.getElementById('toSignUpBtn').addEventListener('click', (e) => {
        e.preventDefault();
        signInCard.classList.remove('active');
        signUpCard.classList.add('active');
        document.getElementById('signupAlert').style.display = 'none';
    });

    document.getElementById('toSignInBtn').addEventListener('click', (e) => {
        e.preventDefault();
        signUpCard.classList.remove('active');
        signInCard.classList.add('active');
        document.getElementById('loginAlert').style.display = 'none';
    });

    document.getElementById('toForgotBtn').addEventListener('click', (e) => {
        e.preventDefault();
        signInCard.classList.remove('active');
        forgotCard.classList.add('active');
        document.getElementById('forgotAlert').style.display = 'none';
    });

    document.getElementById('backToSignInBtn').addEventListener('click', (e) => {
        e.preventDefault();
        forgotCard.classList.remove('active');
        signInCard.classList.add('active');
        document.getElementById('loginAlert').style.display = 'none';
    });

    // Auth Form Submissions
    signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const alertBox = document.getElementById('loginAlert');

        try {
            const res = await fetch(`${API_BASE}/users/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const user = await res.json();
                activeUser = user;
                localStorage.setItem('tf_active_user', JSON.stringify(user));
                authContainer.classList.remove('active');
                alertBox.style.display = 'none';
                await loadInitialData();
            } else {
                const errData = await res.json();
                alertBox.textContent = errData.message || 'Invalid email or password.';
                alertBox.style.display = 'block';
            }
        } catch (err) {
            console.error('Error logging in:', err);
            alertBox.textContent = 'Server connection error.';
            alertBox.style.display = 'block';
        }
    });

    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const role = document.getElementById('registerRole').value;
        const password = document.getElementById('registerPassword').value;
        const alertBox = document.getElementById('signupAlert');

        try {
            const res = await fetch(`${API_BASE}/users/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, role, password })
            });

            if (res.ok) {
                alert("Account created successfully! Please Sign In.");
                signUpCard.classList.remove('active');
                signInCard.classList.add('active');
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginPassword').value = '';
                alertBox.style.display = 'none';
            } else {
                const errData = await res.json();
                alertBox.textContent = errData.message || 'Signup failed.';
                alertBox.style.display = 'block';
            }
        } catch (err) {
            console.error('Error creating account:', err);
            alertBox.textContent = 'Server connection error.';
            alertBox.style.display = 'block';
        }
    });

    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value;
        const alertBox = document.getElementById('forgotAlert');

        try {
            const res = await fetch(`${API_BASE}/users/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                const data = await res.json();
                alertBox.textContent = data.message;
                alertBox.style.display = 'block';
                alertBox.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                alertBox.style.color = 'var(--status-completed)';
                alertBox.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            } else {
                const errData = await res.json();
                alertBox.textContent = errData.message || 'No account found.';
                alertBox.style.display = 'block';
                alertBox.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                alertBox.style.color = 'var(--status-blocked)';
                alertBox.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }
        } catch (err) {
            console.error('Error sending reset link:', err);
            alertBox.textContent = 'Server connection error.';
            alertBox.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('tf_active_user');
        activeUser = null;
        authContainer.classList.add('active');
        signInCard.classList.add('active');
        signUpCard.classList.remove('active');
        forgotCard.classList.remove('active');
        document.getElementById('signInForm').reset();
    });

    // Tab Navigation
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            
            // Remove active classes
            tabLinks.forEach(l => l.classList.remove('active'));
            pageTabs.forEach(t => t.classList.remove('active'));

            // Set active
            link.classList.add('active');
            const tabEl = document.getElementById(targetTab);
            tabEl.classList.add('active');
            activeTab = targetTab;
            
            // Update title
            currentTabTitle.textContent = link.textContent.trim();
        });
    });

    // Notification Drawer
    bellBtn.addEventListener('click', () => {
        notificationDrawer.classList.toggle('active');
    });
    drawerCloseBtn.addEventListener('click', () => {
        notificationDrawer.classList.remove('active');
    });

    // Deadline Alert trigger button
    document.getElementById('triggerDeadlinesBtn').addEventListener('click', async () => {
        try {
            const res = await fetch(`${API_BASE}/notifications/check-deadlines`, { method: 'POST' });
            const data = await res.json();
            alert(data.message);
            await loadInitialData();
        } catch (err) {
            console.error('Error checking deadlines:', err);
        }
    });

    // Project Modal triggers
    document.getElementById('addProjectBtn').addEventListener('click', () => {
        projectModal.classList.add('active');
    });
    closeProjectModalBtn.addEventListener('click', () => projectModal.classList.remove('active'));
    cancelProjectBtn.addEventListener('click', () => projectModal.classList.remove('active'));

    // Task Modal triggers
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        document.getElementById('taskModalTitle').textContent = 'Create Task';
        taskForm.reset();
        document.getElementById('taskIdField').value = '';
        document.getElementById('dependencyGroup').style.display = 'block';
        taskModal.classList.add('active');
    });
    closeTaskModalBtn.addEventListener('click', () => taskModal.classList.remove('active'));
    cancelTaskBtn.addEventListener('click', () => taskModal.classList.remove('active'));

    // Reject Modal Close
    closeRejectModalBtn.addEventListener('click', () => rejectModal.classList.remove('active'));
    cancelRejectBtn.addEventListener('click', () => rejectModal.classList.remove('active'));

    // Form Submissions
    projectForm.addEventListener('submit', handleProjectSubmit);
    taskForm.addEventListener('submit', handleTaskSubmit);
    incidentForm.addEventListener('submit', handleIncidentSubmit);
    rejectForm.addEventListener('submit', handleRejectSubmit);

    // Project filter on Kanban board
    projectFilter.addEventListener('change', () => {
        renderKanbanBoard();
    });
}

// Check roles and hide elements
function applyPermissions() {
    const isViewer = activeUser.role === 'VIEWER';
    const isDeveloper = activeUser.role === 'DEVELOPER';
    const isManagerOrAdmin = activeUser.role === 'MANAGER' || activeUser.role === 'ADMIN';

    // Hide create project/task buttons for viewers
    const addTaskBtn = document.getElementById('addTaskBtn');
    const addProjectBtn = document.getElementById('addProjectBtn');
    
    if (isViewer) {
        addTaskBtn.style.display = 'none';
        addProjectBtn.style.display = 'none';
    } else {
        addTaskBtn.style.display = isManagerOrAdmin ? 'inline-flex' : 'none'; // Developers can't create root tasks (or we let manager do it)
        addProjectBtn.style.display = isManagerOrAdmin ? 'inline-flex' : 'none';
    }

    // Adjust forms
    const incidentSubmitBtn = incidentForm.querySelector('button[type="submit"]');
    if (isViewer) {
        incidentSubmitBtn.disabled = true;
        incidentSubmitBtn.textContent = 'Viewers cannot report incidents';
    } else {
        incidentSubmitBtn.disabled = false;
        incidentSubmitBtn.textContent = 'Raise Incident & Trigger Notifications';
    }
}

// Load notifications list for user
async function loadNotifications() {
    if (!activeUser) return;
    try {
        const res = await fetch(`${API_BASE}/notifications/${activeUser.id}`);
        notifications = await res.json();
        
        // Count unread
        const unread = notifications.filter(n => !n.isRead);
        if (unread.length > 0) {
            unreadCount.style.display = 'flex';
            unreadCount.textContent = unread.length;
        } else {
            unreadCount.style.display = 'none';
        }

        renderNotificationDrawer();
    } catch (err) {
        console.error('Error fetching notifications:', err);
    }
}

// Renders the notifications inside drawer
function renderNotificationDrawer() {
    drawerContentList.innerHTML = '';
    if (notifications.length === 0) {
        drawerContentList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No notifications yet.</div>';
        return;
    }

    notifications.forEach(notif => {
        const div = document.createElement('div');
        div.className = `notification-item ${notif.isRead ? '' : 'unread'}`;
        
        const date = new Date(notif.createdDate);
        const formattedDate = date.toLocaleString();

        div.innerHTML = `
            <div class="notification-item-text">${escapeHTML(notif.message)}</div>
            <div class="notification-item-time">${formattedDate}</div>
        `;

        if (!notif.isRead) {
            div.addEventListener('click', async () => {
                await markNotificationRead(notif.id);
            });
        }
        drawerContentList.appendChild(div);
    });
}

// Mark notification as read
async function markNotificationRead(id) {
    try {
        const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
        if (res.ok) {
            await loadNotifications();
            renderUI();
        }
    } catch (err) {
        console.error('Error marking notification read:', err);
    }
}

// Populate Selections helper
function populateProjectSelections() {
    projectFilter.innerHTML = '<option value="all">All Projects</option>';
    const taskProjSelect = document.getElementById('taskProjects');
    taskProjSelect.innerHTML = '';

    projects.forEach(p => {
        const opt1 = document.createElement('option');
        opt1.value = p.id;
        opt1.textContent = p.projectName;
        projectFilter.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = p.id;
        opt2.textContent = p.projectName;
        taskProjSelect.appendChild(opt2);
    });
}

function populateTaskFormSelections() {
    const assigneeSelect = document.getElementById('taskAssignee');
    assigneeSelect.innerHTML = '<option value="">Unassigned</option>';
    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.name} (${u.role})`;
        assigneeSelect.appendChild(opt);
    });

    const dependencySelect = document.getElementById('taskDependencies');
    dependencySelect.innerHTML = '';
    tasks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.title} (${t.status})`;
        dependencySelect.appendChild(opt);
    });
}

// Main render coordinator
function renderUI() {
    renderDashboard();
    renderKanbanBoard();
    renderReviewConsole();
    renderIncidentFeed();
    renderReports();
}

// Render Dashboard Tab
function renderDashboard() {
    // Metric counts
    metricTotalTasks.textContent = tasks.length;
    metricInProgressTasks.textContent = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    metricPendingReviews.textContent = reviews.filter(r => r.status === 'PENDING').length;
    metricActiveIncidents.textContent = incidents.filter(i => i.status !== 'RESOLVED').length;

    // Display banner if there are any blocked tasks assigned to active user
    const hasBlockedTask = tasks.some(t => t.status === 'BLOCKED' && t.assignedUser && t.assignedUser.id === activeUser.id);
    blockedTaskBanner.style.display = hasBlockedTask ? 'flex' : 'none';

    // Render projects list in dashboard
    dashboardProjectsList.innerHTML = '';
    if (projects.length === 0) {
        dashboardProjectsList.innerHTML = '<div style="color: var(--text-secondary);">No active projects.</div>';
    } else {
        projects.forEach(p => {
            const card = document.createElement('div');
            card.className = 'project-card';
            
            const projectTasks = tasks.filter(t => t.projects.some(proj => proj.id === p.id));
            const completedCount = projectTasks.filter(t => t.status === 'COMPLETED').length;
            const completionPercent = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

            card.innerHTML = `
                <div class="card-info">
                    <h4>${escapeHTML(p.projectName)}</h4>
                    <p>${escapeHTML(p.description || 'No description provided')}</p>
                </div>
                <div style="text-align: right;">
                    <span class="status-badge completed" style="background-color: var(--accent-blue-glow); color: var(--accent-blue);">${completionPercent}% Complete</span>
                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">${completedCount}/${projectTasks.length} Tasks</div>
                </div>
            `;
            dashboardProjectsList.appendChild(card);
        });
    }

    // Render dashboard recent unread alerts
    dashboardNotificationsList.innerHTML = '';
    const unread = notifications.filter(n => !n.isRead).slice(0, 5);
    if (unread.length === 0) {
        dashboardNotificationsList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">All caught up! No unread notifications.</div>';
    } else {
        unread.forEach(n => {
            const item = document.createElement('div');
            item.className = 'project-card';
            item.style.padding = '12px';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="card-info">
                    <p style="font-weight: 500; color: var(--text-primary);">${escapeHTML(n.message)}</p>
                    <span style="font-size: 10px; color: var(--text-muted);">${new Date(n.createdDate).toLocaleTimeString()}</span>
                </div>
            `;
            item.addEventListener('click', () => markNotificationRead(n.id));
            dashboardNotificationsList.appendChild(item);
        });
    }
}

// Render Kanban Board
function renderKanbanBoard() {
    // Clear lanes
    const lanes = [laneCreated, laneAssigned, laneInProgress, laneUnderReview, laneCompleted, laneBlocked];
    lanes.forEach(lane => lane.innerHTML = '');

    // Counts
    const counts = { CREATED: 0, ASSIGNED: 0, IN_PROGRESS: 0, UNDER_REVIEW: 0, COMPLETED: 0, BLOCKED: 0 };

    const selectedProjectId = projectFilter.value;
    
    // Filter tasks by project if selected
    const filteredTasks = tasks.filter(t => {
        if (selectedProjectId === 'all') return true;
        return t.projects.some(p => p.id == selectedProjectId);
    });

    filteredTasks.forEach(task => {
        counts[task.status]++;
        
        const card = document.createElement('div');
        card.className = 'kanban-card';
        
        let actionsHtml = '';
        
        const isAssignedToMe = task.assignedUser && task.assignedUser.id === activeUser.id;
        const isManagerOrAdmin = activeUser.role === 'MANAGER' || activeUser.role === 'ADMIN';

        if (activeUser.role !== 'VIEWER') {
            if (task.status === 'CREATED' || task.status === 'ASSIGNED') {
                if (isAssignedToMe || isManagerOrAdmin) {
                    actionsHtml += `<button class="btn-primary" style="padding: 4px 8px; font-size: 11px; margin-top: 8px;" onclick="changeTaskStatus(${task.id}, 'IN_PROGRESS')">Start Work</button>`;
                }
            } else if (task.status === 'IN_PROGRESS') {
                if (isAssignedToMe || isManagerOrAdmin) {
                    actionsHtml += `<button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; margin-top: 8px; border-color: var(--accent-purple);" onclick="promptReviewSubmit(${task.id})">Submit Review</button>`;
                }
            }
        }

        // Show blocked reasons
        let blockedReason = '';
        if (task.status === 'BLOCKED') {
            blockedReason = `<div style="color: var(--status-blocked); font-size: 10px; margin-top: 6px; font-weight: 600;">⚠️ Blocked by prerequisites</div>`;
        }

        card.innerHTML = `
            <div class="kanban-card-title">${escapeHTML(task.title)}</div>
            <div class="kanban-card-desc">${escapeHTML(task.description || 'No description')}</div>
            ${blockedReason}
            <div class="kanban-card-footer" style="margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 8px;">
                <span class="kanban-card-assignee">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    ${task.assignedUser ? escapeHTML(task.assignedUser.name) : 'Unassigned'}
                </span>
                <span class="severity-badge ${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                ${actionsHtml}
                ${isManagerOrAdmin ? `<button class="btn-secondary" style="padding: 3px 6px; font-size: 10px; border-color: rgba(239,68,68,0.2); color: var(--status-blocked);" onclick="deleteTask(${task.id})">Delete</button>` : ''}
            </div>
        `;
        
        const laneContainer = document.getElementById(`lane-${task.status}`);
        if (laneContainer) {
            laneContainer.appendChild(card);
        }
    });

    // Update Counts
    Object.keys(counts).forEach(status => {
        const el = document.getElementById(`count-${status}`);
        if (el) el.textContent = counts[status];
    });
}

// Prompt reviewer selection before submitting for review
window.promptReviewSubmit = function(taskId) {
    const managers = users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
    if (managers.length === 0) {
        alert("No reviewers/managers registered to audit this review.");
        return;
    }

    const reviewerNames = managers.map(m => `${m.id}: ${m.name}`).join('\n');
    const reviewerIdInput = prompt(`Select reviewer ID from list:\n\n${reviewerNames}`, managers[0].id);
    
    if (reviewerIdInput === null) return;
    
    const reviewerId = parseInt(reviewerIdInput);
    const isValid = managers.some(m => m.id === reviewerId);
    if (!isValid) {
        alert("Invalid Reviewer ID selected.");
        return;
    }

    submitTaskForReview(taskId, activeUser.id, reviewerId);
};

// Transition status via direct service API
window.changeTaskStatus = async function(taskId, status) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        task.status = status;

        const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });

        if (res.ok) {
            await loadInitialData();
        } else {
            const data = await res.json();
            alert(data.message || "Failed to update status.");
        }
    } catch (err) {
        console.error('Error changing task status:', err);
    }
};

async function submitTaskForReview(taskId, developerId, reviewerId) {
    try {
        const res = await fetch(`${API_BASE}/reviews/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, developerId, reviewerId })
        });
        
        if (res.ok) {
            await loadInitialData();
            alert("Task submitted under review!");
        } else {
            const data = await res.json();
            alert(data.message || "Failed to submit review.");
        }
    } catch (err) {
        console.error('Error submitting review:', err);
    }
}

// Delete task
window.deleteTask = async function(id) {
    if (!confirm("Are you sure you want to delete this task? Dependencies mapping will be permanently removed.")) return;
    try {
        const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await loadInitialData();
        }
    } catch (err) {
        console.error('Error deleting task:', err);
    }
};

// Render Reviews panel
function renderReviewConsole() {
    const list = document.getElementById('reviewsConsoleList');
    list.innerHTML = '';

    const pendingReviews = reviews.filter(r => r.status === 'PENDING');
    if (pendingReviews.length === 0) {
        list.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 24px;">No reviews pending action.</div>';
        return;
    }

    pendingReviews.forEach(rev => {
        const div = document.createElement('div');
        div.className = 'review-item';
        
        const isMyReview = rev.reviewer && rev.reviewer.id === activeUser.id;
        const isManagerOrAdmin = activeUser.role === 'MANAGER' || activeUser.role === 'ADMIN';

        let actionButtons = '';
        if (isMyReview || isManagerOrAdmin) {
            actionButtons = `
                <div class="review-actions">
                    <button class="btn-approve" onclick="approveReview(${rev.id})">Approve (Complete)</button>
                    <button class="btn-reject" onclick="openRejectModal(${rev.id})">Reject (Changes)</button>
                    <button class="btn-unavailable" onclick="triggerFallback(${rev.id})">Reviewer Unavailable</button>
                </div>
            `;
        } else {
            actionButtons = `<div style="font-size: 11px; color: var(--text-muted);">Awaiting audit by ${rev.reviewer ? escapeHTML(rev.reviewer.name) : 'unassigned reviewer'}</div>`;
        }

        div.innerHTML = `
            <div class="review-item-header">
                <div>
                    <h4 style="font-weight:600; font-size: 15px; margin-bottom: 4px;">Review for: ${escapeHTML(rev.task.title)}</h4>
                    <p style="font-size:12px; color: var(--text-secondary);">Developer: ${escapeHTML(rev.developer.name)} | Assigned Auditor: ${rev.reviewer ? escapeHTML(rev.reviewer.name) : 'Unassigned'}</p>
                </div>
                ${actionButtons}
            </div>
            <div style="font-size:12px; background: var(--bg-primary); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                <strong>Task Summary:</strong> ${escapeHTML(rev.task.description || 'No summary available.')}
            </div>
        `;
        list.appendChild(div);
    });
}

window.approveReview = async function(id) {
    try {
        const res = await fetch(`${API_BASE}/reviews/${id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
            await loadInitialData();
            alert("Task approved & completed!");
        }
    } catch (err) {
        console.error('Error approving review:', err);
    }
};

window.openRejectModal = function(id) {
    document.getElementById('rejectReviewIdField').value = id;
    document.getElementById('rejectFeedbackText').value = '';
    rejectModal.classList.add('active');
};

window.triggerFallback = async function(id) {
    try {
        const res = await fetch(`${API_BASE}/reviews/${id}/unavailable`, { method: 'POST' });
        if (res.ok) {
            await loadInitialData();
            alert("Reviewer unavailable triggered! System successfully re-assigned review and updated audit feed.");
        } else {
            const data = await res.json();
            alert(data.message || "Failed to trigger reviewer fallback.");
        }
    } catch (err) {
        console.error('Error running reviewer fallback:', err);
    }
};

// Render Incident Feed
function renderIncidentFeed() {
    const list = document.getElementById('incidentsFeedList');
    list.innerHTML = '';

    if (incidents.length === 0) {
        list.innerHTML = '<div style="color: var(--text-secondary); text-align: center; padding: 20px;">No incidents recorded. System stable.</div>';
        return;
    }

    // Sort by createdDate desc
    incidents.sort((a,b) => new Date(b.createdDate) - new Date(a.createdDate));

    incidents.forEach(inc => {
        const div = document.createElement('div');
        div.className = 'incident-card';

        const isManagerOrAdmin = activeUser.role === 'MANAGER' || activeUser.role === 'ADMIN';
        let actionBtn = '';
        
        if (isManagerOrAdmin && inc.status !== 'RESOLVED') {
            if (inc.status === 'OPEN') {
                actionBtn = `<button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="updateIncidentStatus(${inc.id}, 'INVESTIGATING')">Investigate</button>`;
            } else if (inc.status === 'INVESTIGATING') {
                actionBtn = `<button class="btn-primary" style="padding: 4px 8px; font-size: 11px;" onclick="updateIncidentStatus(${inc.id}, 'RESOLVED')">Resolve</button>`;
            }
        }

        const date = new Date(inc.createdDate).toLocaleString();

        div.innerHTML = `
            <div class="card-info" style="flex-grow: 1; margin-right: 16px;">
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
                    <span class="severity-badge ${inc.severity.toLowerCase()}">${inc.severity}</span>
                    <span class="status-badge" style="font-size:9px; background: rgba(255,255,255,0.05);">${inc.status}</span>
                </div>
                <h4 style="font-size:14px; font-weight:600; margin-bottom: 4px;">${escapeHTML(inc.title)}</h4>
                <p style="font-size:12px; margin-bottom: 8px; line-height: 1.4;">${escapeHTML(inc.description)}</p>
                <div style="font-size: 10px; color: var(--text-muted);">Reported: ${date} | By: ${inc.reporter ? escapeHTML(inc.reporter.name) : 'System'}</div>
            </div>
            <div>
                ${actionBtn}
            </div>
        `;
        list.appendChild(div);
    });
}

window.updateIncidentStatus = async function(id, status) {
    try {
        const res = await fetch(`${API_BASE}/incidents/${id}/status?status=${status}`, { method: 'PUT' });
        if (res.ok) {
            await loadInitialData();
        }
    } catch (err) {
        console.error('Error updating incident status:', err);
    }
};

// Render Reports Tab
function renderReports() {
    // 1. Project stats table
    const projBody = document.getElementById('reportProjectsBody');
    projBody.innerHTML = '';

    projects.forEach(p => {
        const projectTasks = tasks.filter(t => t.projects.some(proj => proj.id === p.id));
        const completed = projectTasks.filter(t => t.status === 'COMPLETED').length;
        const percent = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${escapeHTML(p.projectName)}</td>
            <td>${projectTasks.length}</td>
            <td>${completed}</td>
            <td><strong style="color: var(--status-completed);">${percent}%</strong></td>
        `;
        projBody.appendChild(tr);
    });

    // 2. Blocked dependencies table
    const depBody = document.getElementById('reportDependenciesBody');
    depBody.innerHTML = '';

    const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');
    if (blockedTasks.length === 0) {
        depBody.innerHTML = '<tr><td colspan="4" style="color: var(--text-muted); text-align: center;">No blocked tasks currently active.</td></tr>';
        return;
    }

    fetch(`${API_BASE}/tasks/dependencies`)
        .then(res => res.json())
        .then(deps => {
            blockedTasks.forEach(blockedTask => {
                const taskDeps = deps.filter(d => d.taskId === blockedTask.id);
                taskDeps.forEach(dep => {
                    const prereq = tasks.find(t => t.id === dep.dependsOnTaskId);
                    if (prereq && prereq.status !== 'COMPLETED') {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td style="font-weight: 500; color: var(--status-blocked);">${escapeHTML(blockedTask.title)}</td>
                            <td>${blockedTask.assignedUser ? escapeHTML(blockedTask.assignedUser.name) : 'Unassigned'}</td>
                            <td>${escapeHTML(prereq.title)}</td>
                            <td><span class="status-badge ${prereq.status.toLowerCase()}">${prereq.status}</span></td>
                        `;
                        depBody.appendChild(tr);
                    }
                });
            });
            if (depBody.children.length === 0) {
                depBody.innerHTML = '<tr><td colspan="4" style="color: var(--text-muted); text-align: center;">All blockers resolved! Tasks waiting on completion only.</td></tr>';
            }
        })
        .catch(err => {
            console.error('Error fetching dependencies:', err);
            depBody.innerHTML = '<tr><td colspan="4" style="color: var(--status-blocked); text-align: center;">Failed to load dependencies matrix.</td></tr>';
        });
}

// Event Handlers for Form Submissions
async function handleProjectSubmit(e) {
    e.preventDefault();
    const projectName = document.getElementById('projName').value;
    const description = document.getElementById('projDesc').value;

    try {
        const res = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName, description })
        });
        if (res.ok) {
            projectModal.classList.remove('active');
            projectForm.reset();
            await loadInitialData();
        }
    } catch (err) {
        console.error('Error saving project:', err);
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDesc').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value || null;
    
    const assigneeVal = document.getElementById('taskAssignee').value;
    const assignedUser = assigneeVal ? { id: parseInt(assigneeVal) } : null;

    const projectsSelect = document.getElementById('taskProjects');
    const selectedProjects = Array.from(projectsSelect.selectedOptions).map(opt => ({ id: parseInt(opt.value) }));

    const dependenciesSelect = document.getElementById('taskDependencies');
    const selectedDependencies = Array.from(dependenciesSelect.selectedOptions).map(opt => parseInt(opt.value));

    const taskData = {
        title,
        description,
        priority,
        dueDate,
        assignedUser,
        projects: selectedProjects,
        status: assignedUser ? 'ASSIGNED' : 'CREATED'
    };

    try {
        // Create task
        const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        if (res.ok) {
            const savedTask = await res.json();
            
            // Add dependencies
            for (let depId of selectedDependencies) {
                await fetch(`${API_BASE}/tasks/${savedTask.id}/dependencies?dependsOnTaskId=${depId}`, {
                    method: 'POST'
                });
            }

            taskModal.classList.remove('active');
            taskForm.reset();
            await loadInitialData();
        } else {
            alert("Failed to create task.");
        }
    } catch (err) {
        console.error('Error saving task:', err);
    }
}

async function handleIncidentSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('incTitle').value;
    const description = document.getElementById('incDesc').value;
    const severity = document.getElementById('incSeverity').value;

    const incidentData = {
        title,
        description,
        severity,
        status: 'OPEN',
        reporter: { id: activeUser.id }
    };

    try {
        const res = await fetch(`${API_BASE}/incidents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(incidentData)
        });
        if (res.ok) {
            incidentForm.reset();
            await loadInitialData();
            alert("Incident logged and alert dispatched!");
        }
    } catch (err) {
        console.error('Error logging incident:', err);
    }
}

async function handleRejectSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('rejectReviewIdField').value;
    const feedback = document.getElementById('rejectFeedbackText').value;

    try {
        const res = await fetch(`${API_BASE}/reviews/${id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback })
        });
        if (res.ok) {
            rejectModal.classList.remove('active');
            rejectForm.reset();
            await loadInitialData();
            alert("Task rejected back to In Progress with reviewer feedback.");
        }
    } catch (err) {
        console.error('Error rejecting review:', err);
    }
}

// Escape HTML utility
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
