
# Project Tracker App — Complete Product & Implementation Blueprint

> **Project Type:** AI/ML/DL/FL Web Application  
> **Category:** Software / Web App / Mobile App (web-first implementation)  
> **Primary Stack:** HTML5, CSS3, Tailwind CSS, React.js, Node.js  
> **Product Goal:** Build a premium, modern project-management platform for project managers, team leaders, and developers to plan, assign, track, communicate, analyze, and complete work from one centralized system.

---

# 1. Product Vision

The **Project Tracker App** should feel like a modern SaaS product rather than a college CRUD project.

The core idea is simple:

> **Projects → Tasks → People → Progress → Insights → Completion**

The application should provide a single workspace where a team can:

- Create and manage projects.
- Break projects into milestones and tasks.
- Assign work to team members.
- Track status, priority, deadlines, and dependencies.
- Communicate around work.
- Monitor progress in real time.
- Identify overdue or blocked work.
- Generate reports and analytics.
- Control access using role-based permissions.
- Use AI-assisted insights to detect risks, summarize activity, and improve planning.

The interface should communicate three qualities immediately:

1. **Clarity** — users know what needs attention.
2. **Speed** — common actions require minimal clicks.
3. **Professionalism** — the product feels like a real production SaaS application.

---

# 2. Inspiration for Project Tracker App

When building a project management tool, studying existing industry leaders is the best way to understand UI/UX expectations, standard features, and workflow logic. Use these products for **feature and interaction inspiration**, not as designs to copy.

### 1. Linear — linear.app

- **What it is:** A highly polished issue and project tracking platform designed around speed and focus.
- **What to study:**
  - Minimalist layout and typography.
  - Dark mode and subtle borders.
  - Keyboard-first workflows.
  - Compact task/list views.
  - Command palette patterns.
  - Highly restrained use of color.
  - Fast transitions and micro-interactions.
- **What to adopt conceptually:** Make important information dense without making the interface feel crowded.

### 2. Trello — trello.com

- **What it is:** A well-known Kanban-based task management product.
- **What to study:**
  - Drag-and-drop behavior.
  - Visual task cards.
  - Labels, assignees, due dates, and checklists.
  - Clear workflow states.
- **What to adopt conceptually:** The Kanban board should be understandable within seconds.

### 3. Plane — plane.so

- **What it is:** An open-source project management platform with modern issue-tracking workflows.
- **What to study:**
  - Workspace and project structure.
  - Issue management.
  - Permissions.
  - Analytics.
  - Open-source engineering patterns.
- **What to adopt conceptually:** Use a structured project/workspace model instead of building everything directly around users.

### 4. Asana — asana.com

- **What it is:** A broad project and work-management platform.
- **What to study:**
  - List, board, and timeline views.
  - Project overviews.
  - Milestone presentation.
  - Dashboard widgets.
  - Status reporting.
- **What to adopt conceptually:** Give users multiple ways to understand the same underlying project data.

### 5. Jira — atlassian.com/software/jira

- **What it is:** An enterprise issue and project management platform.
- **What to study:**
  - Role-based access control.
  - Issue workflows.
  - Sprint concepts.
  - Audit trails.
  - Enterprise-style project administration.
- **What to avoid:** Excessive configuration and visual complexity for a student project.

### 6. Monday.com

- **What it is:** A highly visual work-management platform.
- **What to study:**
  - Dashboards.
  - Reporting widgets.
  - Workload visualization.
  - Progress indicators.
  - Team capacity views.
- **What to adopt conceptually:** Turn raw project data into visually understandable information.

---

# 3. Core Product Requirements

The application should support the following primary workflow:

```text
User Login
   ↓
Workspace
   ↓
Projects
   ↓
Milestones
   ↓
Tasks
   ↓
Assignment / Collaboration
   ↓
Progress Tracking
   ↓
Analytics / AI Insights
   ↓
Reports
   ↓
Project Completion
```

A user should never need to leave the main application to understand:

- What projects exist.
- What they are responsible for.
- What is due soon.
- What is overdue.
- What is blocked.
- How the team is performing.
- Where project risks are developing.

---

# 4. User Roles

Implement **Role-Based Access Control (RBAC)** from the beginning rather than adding permissions later.

## 4.1 Administrator

Can:

- Manage users.
- Create and delete projects.
- Assign roles.
- Configure system settings.
- View all dashboards.
- View audit logs.
- Manage permissions.
- Generate organization-wide reports.

## 4.2 Project Manager

Can:

- Create and manage assigned projects.
- Create milestones.
- Create tasks.
- Assign tasks.
- Set deadlines and priorities.
- View team workload.
- Monitor progress.
- View analytics.
- Generate reports.
- Approve project completion.

## 4.3 Team Leader

Can:

- Manage assigned teams.
- Assign or reassign tasks within authorized projects.
- Update task status.
- Review team progress.
- Comment on tasks.
- Monitor deadlines.
- View team analytics.

## 4.4 Developer / Team Member

Can:

- View assigned projects.
- View assigned tasks.
- Update task status.
- Add comments.
- Upload attachments.
- Track personal deadlines.
- Record work/activity.
- View personal productivity metrics.

## 4.5 Permission Principle

Do not rely on frontend hiding alone.

The backend must enforce permissions:

```text
Frontend Permission Check
        ↓
Backend Authorization Middleware
        ↓
Database Query Restriction
        ↓
Response
```

A user who manually sends an API request must still be denied unauthorized operations.

---

# 5. Application Modules

Build the project as independent modules so the system can scale without becoming one giant React component or one giant Express route file.

## Module 1 — Authentication & Authorization

Responsibilities:

- Registration.
- Login.
- Logout.
- Password hashing.
- Session/token management.
- Role management.
- Permission checks.
- Password reset.
- Optional email verification.

Recommended implementation:

```text
React Login Page
       ↓
POST /api/auth/login
       ↓
Node.js Auth Controller
       ↓
Validate Credentials
       ↓
Hash Verification
       ↓
Issue Access Token / Session
       ↓
React Auth State
```

Never store plain-text passwords.

---

## Module 2 — Dashboard

The dashboard is the product's command center.

### Manager dashboard widgets

- Total projects.
- Active projects.
- Completed projects.
- Overdue tasks.
- Tasks due today.
- Team workload.
- Project health.
- Recent activity.
- Upcoming milestones.
- AI risk alerts.

### Developer dashboard widgets

- My active tasks.
- Tasks due today.
- Tasks overdue.
- Recently assigned work.
- Personal completion rate.
- Current workload.
- Recent comments.

### Dashboard design rule

Do not make every metric a giant card.

Use hierarchy:

```text
Most important alert
        ↓
Primary project statistics
        ↓
Work requiring action
        ↓
Charts and trends
        ↓
Activity feed
```

---

## Module 3 — Workspace Management

A workspace represents an organization, department, or project-management environment.

Features:

- Workspace creation.
- Workspace members.
- Workspace settings.
- Workspace-level permissions.
- Workspace activity.
- Project list.

Potential structure:

```text
Workspace
 ├── Members
 ├── Projects
 ├── Reports
 ├── Settings
 └── Activity
```

---

# 6. Project Management Module

Projects are the highest-level work containers.

Each project should contain:

- Project name.
- Description.
- Owner.
- Team.
- Start date.
- Due date.
- Status.
- Priority.
- Progress.
- Health indicator.
- Milestones.
- Tasks.
- Files.
- Activity.
- Reports.

### Project statuses

```text
Planning
   ↓
Active
   ↓
On Hold
   ↓
Completed
   ↓
Archived
```

### Project health

Use a separate health state from status:

```text
Healthy
At Risk
Critical
```

This lets a project remain "Active" while simultaneously being "At Risk."

---

# 7. Milestone Module

Milestones represent major project checkpoints.

Example:

```text
Project: E-Commerce Platform

Milestone 1 → UI/UX Complete
Milestone 2 → Backend API Complete
Milestone 3 → Payment Integration
Milestone 4 → Testing Complete
Milestone 5 → Production Release
```

Every milestone should display:

- Name.
- Description.
- Deadline.
- Completion percentage.
- Related tasks.
- Status.
- Owner.

---

# 8. Task Management Module

Tasks are the central unit of work.

Each task should support:

- Title.
- Description.
- Status.
- Priority.
- Assignee.
- Reporter.
- Project.
- Milestone.
- Due date.
- Start date.
- Estimated effort.
- Actual effort.
- Labels.
- Dependencies.
- Subtasks.
- Checklist.
- Comments.
- Attachments.
- Activity history.

## Recommended task statuses

```text
BACKLOG
   ↓
TODO
   ↓
IN PROGRESS
   ↓
IN REVIEW
   ↓
DONE
```

Optional:

```text
BLOCKED
CANCELLED
```

---

# 9. Task Priority System

Use four levels:

```text
LOW
MEDIUM
HIGH
URGENT
```

Do not rely only on color.

The UI should use:

- Icon.
- Label.
- Color/accent.
- Accessible tooltip.

Example:

```text
⚡ URGENT
▲ HIGH
● MEDIUM
— LOW
```

---

# 10. Kanban Board

The Kanban board should be one of the application's flagship screens.

### Layout

```text
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│ BACKLOG    │ TODO       │ IN PROGRESS│ IN REVIEW  │ DONE       │
├────────────┼────────────┼────────────┼────────────┼────────────┤
│ Task A     │ Task D     │ Task G     │ Task J     │ Task M     │
│ Task B     │ Task E     │ Task H     │ Task K     │ Task N     │
│ Task C     │ Task F     │ Task I     │            │ Task O     │
└────────────┴────────────┴────────────┴────────────┴────────────┘
```

Features:

- Drag and drop.
- Quick status change.
- Search.
- Filters.
- Priority filter.
- Assignee filter.
- Due-date filter.
- Label filter.
- Grouping.
- Quick-add task.

### Premium behavior

Dragging a task should:

1. Lift the card.
2. Show a subtle shadow.
3. Highlight the destination column.
4. Animate the card into place.
5. Persist the new status.
6. Add an activity event.
7. Update progress immediately.

Use optimistic UI updates where safe.

---

# 11. List View

The list view should be optimized for scanning.

Recommended columns:

| Field | Purpose |
|---|---|
| Task | Primary identifier |
| Status | Workflow position |
| Priority | Urgency |
| Assignee | Ownership |
| Due Date | Deadline |
| Project | Context |
| Progress | Completion |
| Updated | Recency |

Add:

- Column visibility.
- Sorting.
- Filtering.
- Search.
- Pagination or virtualization.

---

# 12. Timeline / Gantt View

Use project dates and dependencies to display a timeline.

```text
            Week 1   Week 2   Week 3   Week 4
UI Design   ████████
API                    ███████████
Database               ███████
Testing                           █████████
Release                                     ███
```

Features:

- Start/end dates.
- Dependencies.
- Milestones.
- Overdue highlighting.
- Today marker.
- Zoom controls.

---

# 13. Calendar Module

Display:

- Task deadlines.
- Milestones.
- Project deadlines.
- Meetings/events if supported.

Views:

- Month.
- Week.
- Day.

Clicking an item should open the task/project detail drawer rather than forcing a page change.

---

# 14. Task Detail Experience

A task should open inside a polished side drawer or full detail panel.

Suggested layout:

```text
┌─────────────────────────────────────────────┐
│ TASK TITLE                         ...       │
│ Project / Milestone                         │
├─────────────────────────────────────────────┤
│ Description                                 │
│                                             │
│ Checklist                                   │
│ [✓] Requirement A                           │
│ [ ] Requirement B                           │
│                                             │
│ Assignee   Priority   Due Date              │
│                                             │
│ Activity / Comments                          │
│                                             │
│ [Write a comment...]              [Send]    │
└─────────────────────────────────────────────┘
```

This should feel fast and contextual.

---

# 15. Subtasks & Checklists

Support two different concepts:

### Subtasks

Independent child tasks with their own:

- Status.
- Assignee.
- Deadline.

### Checklist items

Small completion items inside one task.

Example:

```text
Task: Implement Authentication

Subtasks:
├── Design login page
├── Implement JWT authentication
├── Create session middleware
└── Add password reset
```

---

# 16. Dependencies

Allow relationships such as:

```text
Task A ── blocks ──> Task B
Task B ── blocks ──> Task C
```

Examples:

- "Task B cannot start until Task A is completed."
- "Task C is blocked by Task B."

Use dependency checks to improve project-risk calculations.

---

# 17. Team & Member Management

The team module should show:

- Avatar.
- Name.
- Role.
- Active projects.
- Current workload.
- Assigned tasks.
- Completed tasks.
- Overdue tasks.
- Availability.

### Workload visualization

```text
Alex      ██████████ 100%
Jordan    ███████░░░  70%
Taylor    █████░░░░░  50%
Chris     ███░░░░░░░  30%
```

Avoid using workload alone as a judgment of performance; represent it as a planning signal.

---

# 18. Communication Module

The application should support lightweight project communication.

### Comments

Users can comment on:

- Tasks.
- Projects.
- Milestones.

### Mentions

Example:

```text
@Alex please review the API implementation.
```

### Reactions

Optional quick reactions:

- 👍
- ✅
- 👀
- 🚀

### Activity feed

Record events such as:

```text
Alex moved "Login API" from In Progress → Review
Jordan assigned "Dashboard UI" to Taylor
Taylor completed milestone "Frontend Beta"
```

---

# 19. Notification Module

Notifications should be event-driven.

Examples:

- Task assigned.
- Mention received.
- Task status changed.
- Deadline approaching.
- Task overdue.
- Project risk changed.
- Comment received.
- Milestone completed.

Notification priority:

```text
Critical → High → Normal → Low
```

Provide:

- Notification center.
- Read/unread state.
- Mark all as read.
- Deep links to source objects.
- Optional browser notifications.

---

# 20. File & Attachment Module

Allow users to attach files to tasks and projects.

Store metadata in the database and files in object/file storage.

Database metadata:

```text
id
fileName
storageKey
mimeType
size
uploadedBy
uploadedAt
entityType
entityId
```

Validate:

- File size.
- MIME type.
- Extension.
- Authorization.

Never trust a filename or MIME type supplied only by the browser.

---

# 21. Reporting Module

Reports should transform raw data into management-friendly output.

Recommended reports:

### Project Progress Report

- Overall completion.
- Completed tasks.
- Remaining tasks.
- Overdue tasks.
- Milestone status.
- Risk indicators.

### Team Productivity Report

- Assigned tasks.
- Completed tasks.
- Cycle time.
- Overdue workload.
- Work distribution.

### Project Health Report

- Schedule risk.
- Unresolved blockers.
- Deadline pressure.
- Workload concentration.
- Recent velocity.

### Export options

- PDF.
- CSV.
- Excel-compatible spreadsheet.

---

# 22. Analytics Dashboard

The analytics page should answer questions, not merely display charts.

## Recommended charts

### Task Status Distribution

Doughnut/pie chart:

```text
Done         45%
In Progress  25%
Review       10%
Todo         15%
Blocked       5%
```

### Task Completion Trend

Line chart showing completed tasks by day/week.

### Workload by Member

Bar chart showing active assigned workload.

### Project Progress

Horizontal progress bars for active projects.

### Overdue Trend

Historical count of overdue tasks.

### Cycle Time

Average time from "In Progress" to "Done."

Do not overload one dashboard with every chart available. Prioritize actionable signals.

---

# 23. AI / ML Module

Because the project is categorized as an **AI/ML/DL/FL web application**, include an intelligent layer that provides measurable value rather than adding AI only for presentation.

The AI module can initially use classical ML/statistical techniques and later be extended with deep learning.

## AI Feature 1 — Smart Task Summary

Input:

- Task title.
- Description.
- Comments.
- Activity.

Output:

- Short summary.
- Current state.
- Main blocker.
- Next action.

Example:

```text
AI Summary

The API integration is 80% complete. Authentication has been
implemented, but payment validation is blocked by the missing
sandbox credentials.

Suggested next action:
Request payment sandbox credentials.
```

---

## AI Feature 2 — Project Risk Prediction

Create a risk score using project signals.

Potential features:

```text
number_of_overdue_tasks
percentage_completed
days_remaining
blocked_tasks
recent_completion_rate
workload_variance
unresolved_dependencies
milestone_delay
```

Example conceptual model:

```text
Project Data
     ↓
Feature Engineering
     ↓
Risk Model
     ↓
Risk Probability
     ↓
Healthy / At Risk / Critical
```

Start with:

- Logistic Regression.
- Random Forest.
- Gradient Boosting.

A later version can explore a neural network if a sufficiently large dataset exists.

Do not fabricate model accuracy. Report actual validation metrics from your dataset.

---

# 24. AI Feature 3 — Task Priority Recommendation

The application can recommend a priority using signals such as:

- Deadline proximity.
- Dependency importance.
- Project health.
- Number of blocked tasks.
- Task age.
- Milestone proximity.

Example:

```text
Recommended Priority: HIGH

Reasons:
• Deadline is 2 days away.
• Task blocks 3 other tasks.
• Milestone completion is at risk.
```

The recommendation should remain editable by the project manager.

---

# 25. AI Feature 4 — Smart Task Assignment

Use workload-aware assignment recommendations.

Inputs:

```text
Required skills
Current workload
Past task categories
Availability
Task priority
Deadline
```

Output:

```text
Recommended Assignee: Alex

Reason:
• Required React skill detected
• Lowest active workload among matching members
• Similar task completed previously
```

Do not make assignments automatically unless the workflow explicitly allows automation. Start with recommendations.

---

# 26. AI Feature 5 — Project Risk Alerts

The platform should proactively surface risks.

Example:

> **Project Risk Detected**  
> 4 high-priority tasks remain incomplete while the release milestone is due in 3 days.

This is much more impressive than adding a generic chatbot.

---

# 27. Optional Deep Learning Extension

If the academic requirement explicitly expects deep learning, build a separate experimentation component rather than forcing deep learning into every workflow.

Possible deep-learning tasks:

- Task description classification.
- Comment sentiment classification.
- Work-item category prediction.
- Risk classification from historical project sequences.

Architecture:

```text
Historical Project Data
          ↓
Cleaning / Feature Engineering
          ↓
Training Dataset
          ↓
Deep Learning Model
          ↓
Validation / Evaluation
          ↓
Model Artifact
          ↓
Node.js AI Service / Python Model Service
          ↓
React Dashboard
```

---

# 28. Optional Federated Learning Extension

Federated learning should be treated as an advanced research feature rather than a mandatory core application feature.

Concept:

```text
Team / Organization A ─┐
                       │
Team / Organization B ─┼──> Federated Aggregation
                       │
Team / Organization C ─┘
                              ↓
                     Global Model
```

Only model updates/parameters are shared; raw local training data can remain local depending on the federation architecture.

For a student implementation, this can be demonstrated as an experimental module with simulated clients rather than a production distributed federation.

---

# 29. Recommended System Architecture

Use a modular client-server architecture.

```text
                    ┌────────────────────┐
                    │      React.js      │
                    │    Tailwind CSS    │
                    └─────────┬──────────┘
                              │ HTTPS / JSON
                              ↓
                    ┌────────────────────┐
                    │   Node.js / API    │
                    │      Express       │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼────────────────┐
              ↓               ↓                ↓
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ PostgreSQL │  │ AI Service │  │ File Store │
       │ / MongoDB  │  │ / ML Model │  │            │
       └────────────┘  └────────────┘  └────────────┘
```

### Recommended academic setup

A clean stack would be:

- Frontend: React + Vite.
- Styling: Tailwind CSS.
- Backend: Node.js + Express.
- Database: PostgreSQL or MongoDB.
- Authentication: JWT + refresh token or secure cookie sessions.
- Real-time updates: Socket.IO.
- Validation: Zod/Joi/express-validator.
- Charts: Recharts or another React-compatible charting library.
- Drag/drop: dnd-kit.
- Icons: Lucide React.
- AI/ML: Python service using FastAPI if model inference needs Python.

If the project specification mandates only HTML/CSS/React/Node.js, keep the architecture centered on those technologies and use Python only as an isolated AI service when required.

---

# 30. Recommended Database Design

A relational model makes project relationships easier to demonstrate academically.

Recommended tables:

```text
users
roles
permissions
user_roles
workspaces
workspace_members
projects
project_members
milestones
tasks
task_assignees
task_dependencies
subtasks
labels
task_labels
comments
attachments
notifications
activity_logs
reports
ai_predictions
```

## Core relationships

```text
User
 ├── Workspace Membership
 ├── Project Membership
 ├── Tasks
 ├── Comments
 ├── Notifications
 └── Activity Logs

Workspace
 └── Projects
      └── Milestones
           └── Tasks
                ├── Subtasks
                ├── Comments
                ├── Attachments
                └── Dependencies
```

---

# 31. Core Database Fields

## users

```text
id
name
email
password_hash
avatar_url
role_id
status
created_at
updated_at
```

## projects

```text
id
workspace_id
name
slug
description
owner_id
status
health
priority
start_date
due_date
created_at
updated_at
```

## milestones

```text
id
project_id
name
description
due_date
status
created_at
updated_at
```

## tasks

```text
id
project_id
milestone_id
parent_task_id
title
description
status
priority
assignee_id
reporter_id
start_date
due_date
estimated_hours
actual_hours
progress
created_at
updated_at
completed_at
```

## activity_logs

```text
id
user_id
entity_type
entity_id
action
metadata
created_at
```

The `metadata` field can contain structured JSON such as:

```json
{
  "oldStatus": "IN_PROGRESS",
  "newStatus": "IN_REVIEW"
}
```

---

# 32. REST API Structure

Use clear resource-oriented routes.

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

## Users

```text
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
```

## Projects

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
```

## Tasks

```text
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/comments
POST   /api/tasks/:id/attachments
```

## Milestones

```text
GET    /api/projects/:projectId/milestones
POST   /api/projects/:projectId/milestones
PATCH  /api/milestones/:id
DELETE /api/milestones/:id
```

## Analytics

```text
GET /api/analytics/overview
GET /api/analytics/projects/:id
GET /api/analytics/team/:id
```

## AI

```text
POST /api/ai/task-summary
POST /api/ai/risk-score
POST /api/ai/priority-recommendation
POST /api/ai/assignment-recommendation
GET  /api/ai/projects/:id/insights
```

---

# 33. Backend Folder Structure

Use a modular structure.

```text
server/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── env.js
│   │   └── logger.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── project.controller.js
│   │   ├── task.controller.js
│   │   ├── milestone.controller.js
│   │   ├── user.controller.js
│   │   ├── analytics.controller.js
│   │   └── ai.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── authorize.js
│   │   ├── validate.js
│   │   ├── rateLimit.js
│   │   └── errorHandler.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── project.routes.js
│   │   ├── task.routes.js
│   │   ├── milestone.routes.js
│   │   ├── user.routes.js
│   │   ├── analytics.routes.js
│   │   └── ai.routes.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── project.service.js
│   │   ├── task.service.js
│   │   ├── notification.service.js
│   │   ├── analytics.service.js
│   │   └── ai.service.js
│   │
│   ├── models/
│   ├── repositories/
│   ├── validators/
│   ├── sockets/
│   ├── utils/
│   └── app.js
│
└── package.json
```

The principle is:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository / Model
  ↓
Database
```

Do not put database queries directly inside route definitions.

---

# 34. Frontend Folder Structure

```text
client/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── analytics/
│   │   └── notifications/
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Projects.jsx
│   │   ├── ProjectDetails.jsx
│   │   ├── Kanban.jsx
│   │   ├── Calendar.jsx
│   │   ├── Analytics.jsx
│   │   ├── Team.jsx
│   │   ├── Reports.jsx
│   │   ├── Settings.jsx
│   │   └── Profile.jsx
│   │
│   ├── hooks/
│   ├── context/
│   ├── services/
│   ├── store/
│   ├── routes/
│   ├── utils/
│   ├── constants/
│   ├── App.jsx
│   └── main.jsx
│
└── package.json
```

---

# 35. UI/UX Design System

The application should have a custom design system instead of styling every screen independently.

## Typography

Recommended modern UI fonts:

- Inter.
- Manrope.
- DM Sans.
- Plus Jakarta Sans.

Use one primary font family consistently.

Suggested hierarchy:

```text
Page Heading      28–36px / Semibold
Section Heading   18–22px / Semibold
Body              14–16px / Regular
Metadata          12–13px / Medium
```

## Spacing

Use a consistent spacing scale:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Do not randomly use values such as 13px, 19px, 27px unless the design genuinely requires them.

---

# 36. Premium Visual Direction

The visual language should be:

- Minimal.
- Dense but breathable.
- Editorial.
- Professional.
- Slightly futuristic.
- Data-focused.
- Subtle rather than flashy.

### Recommended palette structure

Do not use ten accent colors everywhere.

Instead:

```text
Background
Surface
Elevated Surface
Border
Primary Text
Secondary Text
Brand Accent
Success
Warning
Danger
Info
```

Dark mode should be designed as a first-class experience rather than simply changing white to black.

---

# 37. Main Application Layout

Recommended desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Top Bar                                      Search  Bell User│
├──────────────┬───────────────────────────────────────────────┤
│              │                                               │
│ Sidebar      │                 Main Content                  │
│              │                                               │
│ Dashboard    │                                               │
│ Projects     │                                               │
│ Tasks        │                                               │
│ Calendar     │                                               │
│ Analytics    │                                               │
│ Reports      │                                               │
│ Team         │                                               │
│              │                                               │
│ Settings     │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

The sidebar should support:

- Collapsed mode.
- Expanded mode.
- Workspace switcher.
- Project shortcuts.

---

# 38. Premium Interaction Rules

The difference between an ordinary academic project and a premium product is often interaction quality.

Implement:

### Micro-interactions

- Button hover transitions.
- Subtle card elevation.
- Press feedback.
- Animated toggles.
- Smooth drawers.
- Toast notifications.
- Progress animations.
- Skeleton loaders.
- Empty-state illustrations.
- Drag-and-drop feedback.

### Avoid

- Excessive bouncing.
- Large unnecessary animations.
- Slow page transitions.
- Animation on every component.
- Distracting gradients everywhere.

Animation should communicate state or hierarchy.

---

# 39. Command Palette

A command palette dramatically increases the premium feel.

Example trigger:

```text
⌘ K / Ctrl K
```

Commands:

```text
Create project
Create task
Search projects
Search tasks
Go to dashboard
Open calendar
Open analytics
Invite member
Change theme
```

---

# 40. Global Search

Search across:

- Projects.
- Tasks.
- Users.
- Milestones.
- Comments.
- Reports.

Search result groups should look like:

```text
PROJECTS
  Website Redesign
  Mobile App

TASKS
  Implement authentication
  Fix dashboard loading

PEOPLE
  Alex Johnson
```

---

# 41. Responsive Design

The product should work across:

```text
Desktop → Tablet → Mobile
```

Desktop:

- Full sidebar.
- Multi-column dashboard.
- Full Kanban board.

Tablet:

- Collapsible sidebar.
- Reduced chart widths.
- Adaptive tables.

Mobile:

- Bottom navigation or compact navigation.
- Single-column layout.
- Horizontal task-board scrolling.
- Full-screen task drawer.
- Compact analytics.

Do not simply shrink desktop UI. Recompose the interface for mobile.

---

# 42. Accessibility Requirements

Implement:

- Semantic HTML.
- Proper labels.
- Keyboard navigation.
- Visible focus states.
- Sufficient contrast.
- Accessible form validation.
- ARIA attributes where required.
- Non-color-only status indicators.
- Reduced-motion support.

Every interactive element should remain usable without a mouse wherever practical.

---

# 43. Loading & Empty States

A premium application must never look broken while data loads.

Implement:

### Skeleton loaders

Instead of:

```text
Loading...
```

Use structured skeletons matching the final component shape.

### Empty states

Example:

```text
No projects yet

Create your first project to start planning work.

[ Create Project ]
```

### Error states

Example:

```text
Something went wrong

We couldn't load your projects.

[ Try Again ]
```

---

# 44. Security Requirements

At minimum implement:

- Password hashing.
- Authorization middleware.
- Input validation.
- Rate limiting on authentication routes.
- Secure HTTP headers.
- CORS configuration.
- Secure cookie settings where cookies are used.
- Parameterized queries / ORM protections.
- File-upload validation.
- Audit logging.
- Secrets in environment variables.

Never commit:

```text
.env
API keys
JWT secrets
Database passwords
Cloud credentials
```

Provide `.env.example` instead.

---

# 45. Validation Rules

Every major entity needs backend validation.

Example task validation:

```text
Title:
- Required
- 3–150 characters

Description:
- Optional
- Maximum defined length

Priority:
- LOW | MEDIUM | HIGH | URGENT

Due date:
- Valid ISO date

Project:
- Must exist
- User must have access
```

Never trust frontend validation as the only validation layer.

---

# 46. Audit Logging

Track important actions.

Examples:

```text
LOGIN
CREATE_PROJECT
UPDATE_PROJECT
DELETE_PROJECT
CREATE_TASK
ASSIGN_TASK
CHANGE_TASK_STATUS
CHANGE_ROLE
UPLOAD_FILE
DELETE_FILE
GENERATE_REPORT
```

The audit-log screen should show:

```text
Who → Did What → To Which Object → When
```

---

# 47. Real-Time Updates

Use WebSockets or Socket.IO for events that benefit from immediate updates.

Examples:

- Task status changes.
- Assignment changes.
- New comments.
- Notifications.
- Dashboard updates.

Architecture:

```text
User A
   ↓
API / Socket
   ↓
Node.js Server
   ↓
Event Broadcast
   ↓
User B / User C
```

Do not send WebSocket events for every possible UI operation. Use real-time communication where immediate synchronization matters.

---

# 48. State Management

Separate state into categories.

### Server state

Projects, tasks, users, analytics.

Recommended approach:

- TanStack Query / React Query.

### UI state

- Modal open/closed.
- Sidebar state.
- Current filters.
- Theme.

Can use:

- React state.
- Context.
- Zustand for larger UI state.

Do not store every backend object in one giant global state object.

---

# 49. Performance Requirements

The application should remain fast when the task count grows.

Implement:

- Lazy-loaded pages.
- API pagination.
- Debounced search.
- Memoized expensive components where necessary.
- Image optimization.
- Virtualized large task lists.
- Efficient database indexes.
- Server-side filtering for large datasets.

Avoid fetching:

```text
10,000 tasks
```

just to display:

```text
20 tasks
```

---

# 50. Error Handling Strategy

Use centralized backend error handling.

Response format:

```json
{
  "success": false,
  "error": {
    "code": "TASK_NOT_FOUND",
    "message": "Task could not be found."
  }
}
```

Successful response:

```json
{
  "success": true,
  "data": {}
}
```

Consistent API responses make the frontend much easier to maintain.

---

# 51. Testing Strategy

Do not wait until the end to test.

## Unit tests

Test:

- Validation.
- Services.
- Utility functions.
- Permission checks.
- Risk-score calculations.

## Integration tests

Test:

- Login.
- Project creation.
- Task creation.
- Assignment.
- Status transitions.
- Permission failures.

## Frontend tests

Test:

- Forms.
- Filters.
- Task interactions.
- Modal behavior.
- Permission-dependent UI.

## End-to-end tests

Example workflow:

```text
Login
 ↓
Create Project
 ↓
Create Milestone
 ↓
Create Task
 ↓
Assign Task
 ↓
Move Task on Kanban
 ↓
Add Comment
 ↓
Mark Complete
 ↓
Verify Dashboard Updated
```

---

# 52. Seed Data

Create realistic seed data for demonstrations.

Example:

### Workspace

```text
Nova Technologies
```

### Projects

```text
Project Phoenix
Mobile Banking App
AI Customer Support Portal
E-Commerce Redesign
```

### Users

```text
Admin
Project Manager
UI/UX Lead
Backend Developer
Frontend Developer
QA Engineer
```

### Tasks

Create at least 30–50 realistic tasks distributed among statuses and priorities.

The dashboard should look alive immediately after installation.

---

# 53. Demo Scenario

Prepare one polished end-to-end scenario for evaluation.

### Scenario

A project manager creates a new project named:

```text
AI Customer Support Platform
```

Then:

1. Adds team members.
2. Creates milestones.
3. Creates tasks.
4. Assigns tasks.
5. Opens the Kanban board.
6. Moves tasks through statuses.
7. Adds comments.
8. Marks one task blocked.
9. Opens analytics.
10. Views an AI-generated risk warning.
11. Generates a project report.
12. Completes the milestone.

This creates a coherent product story for demonstrations and viva presentations.

---

# 54. Implementation Roadmap

Build in phases. Do not attempt every feature simultaneously.

## Phase 1 — Foundation

Implement:

- Project repository.
- React/Vite setup.
- Tailwind CSS.
- Node/Express server.
- Database.
- Environment configuration.
- Base layout.
- Routing.
- Error handling.

**Deliverable:** Application boots cleanly and shows the base shell.

---

## Phase 2 — Authentication

Implement:

- Register.
- Login.
- Logout.
- Session/token handling.
- Protected routes.
- RBAC.

**Deliverable:** Different roles can log in and access only authorized areas.

---

## Phase 3 — Project Management

Implement:

- Workspace.
- Projects.
- Project members.
- Project details.
- Project status.
- Project health.

**Deliverable:** Complete project lifecycle works.

---

## Phase 4 — Task Management

Implement:

- Tasks.
- Subtasks.
- Priority.
- Labels.
- Assignment.
- Due dates.
- Dependencies.
- Comments.

**Deliverable:** Core project tracking is functional.

---

## Phase 5 — Views

Implement:

- List view.
- Kanban.
- Calendar.
- Timeline.

**Deliverable:** Users can view the same project data in different ways.

---

## Phase 6 — Collaboration

Implement:

- Activity feed.
- Notifications.
- Mentions.
- Attachments.
- Real-time updates.

**Deliverable:** Multiple users can collaborate on live work.

---

## Phase 7 — Analytics & Reports

Implement:

- Dashboard metrics.
- Charts.
- Team workload.
- Project health.
- Reports.
- PDF/CSV export.

**Deliverable:** Project data can be interpreted and presented professionally.

---

## Phase 8 — AI Layer

Implement:

- Risk scoring.
- Task summaries.
- Priority recommendations.
- Assignment recommendations.

**Deliverable:** AI generates explainable, useful insights.

---

## Phase 9 — Premium UX

Polish:

- Animation.
- Skeleton loading.
- Empty states.
- Keyboard shortcuts.
- Command palette.
- Dark mode.
- Responsive design.
- Accessibility.

**Deliverable:** Product feels like a real SaaS platform.

---

## Phase 10 — Testing & Deployment

Complete:

- Unit tests.
- Integration tests.
- End-to-end testing.
- Security review.
- Performance check.
- Production build.
- Deployment.

---

# 55. Suggested Git Workflow

Use feature branches.

```text
main
  │
  ├── develop
  │      │
  │      ├── feature/auth
  │      ├── feature/projects
  │      ├── feature/tasks
  │      ├── feature/analytics
  │      └── feature/ai-risk
```

Commit messages should describe the change:

```text
feat: add project creation flow
feat: implement kanban drag and drop
fix: prevent unauthorized task reassignment
refactor: separate task service logic
style: improve project dashboard spacing
```

---

# 56. Environment Configuration

Use environment variables.

Example `.env.example`:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
CLIENT_URL=http://localhost:5173
STORAGE_BUCKET=
AI_SERVICE_URL=
```

Never hardcode secrets inside source code.

---

# 57. Recommended Development Commands

Example structure:

```bash
# install dependencies
npm install

# start frontend
npm run dev

# start backend
npm run server

# run tests
npm test

# production build
npm run build
```

Use a root workspace/monorepo if it simplifies running both applications.

---

# 58. Premium Page Inventory

The final product should include approximately these screens:

```text
01  Landing / Login
02  Register
03  Forgot Password
04  Dashboard
05  Projects
06  Project Overview
07  Project Board
08  Project List
09  Project Timeline
10  Project Calendar
11  Task Details
12  My Tasks
13  Team
14  Member Profile
15  Notifications
16  Analytics
17  Reports
18  AI Insights
19  Activity Log
20  Workspace Settings
21  Profile Settings
22  Security Settings
23  Appearance Settings
24  Admin Panel
```

Do not necessarily build all screens at the beginning. Build the core path first and expand outward.

---

# 59. Navigation Structure

Recommended sidebar:

```text
WORKSPACE

Overview
Projects
My Tasks
Calendar

ANALYZE

Analytics
Reports
AI Insights

COLLABORATE

Team
Activity

ADMIN

Members
Settings
```

Use role-aware navigation so users do not see irrelevant administration features.

---

# 60. Project Overview Page Layout

The project page should be one of the strongest screens.

```text
Project Name                         [Share] [More]
Project description

[Overview] [Board] [List] [Timeline] [Calendar]

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐
│ Progress │ │ Tasks    │ │ Overdue  │ │ Milestones │
│   72%    │ │   38     │ │    4     │ │     3/5    │
└──────────┘ └──────────┘ └──────────┘ └────────────┘

Project Health
██████████████████████░░ 72%

Recent Activity                         Upcoming
─────────────────                       ─────────
Alex moved API to Review                UI Review — Today
Jordan added a comment                  Beta Release — Friday
```

---

# 61. Dashboard UX Rules

The dashboard should answer these questions immediately:

### What is happening?

Recent activity and project status.

### What needs my attention?

Overdue, urgent, blocked, or due-soon tasks.

### How is the team doing?

Workload and completion trends.

### What is at risk?

AI/risk indicators.

### What should I do next?

Actionable shortcuts.

A dashboard full of decorative charts but no clear action is not useful.

---

# 62. AI Insights Screen

Create a dedicated page rather than scattering AI features everywhere.

Suggested sections:

```text
AI PROJECT HEALTH

Overall Risk: AT RISK
Confidence: 84%

Key Signals
• 7 overdue tasks
• 2 blocked dependencies
• Milestone due in 4 days

Recommended Actions
1. Resolve payment integration blocker
2. Rebalance frontend workload
3. Review milestone deadline
```

The UI should clearly distinguish:

- Raw facts.
- Model outputs.
- Recommendations.

Do not present predictions as guaranteed outcomes.

---

# 63. API Security Pattern

Use middleware like:

```text
request
  ↓
helmet / security headers
  ↓
rate limiter
  ↓
authentication
  ↓
authorization
  ↓
validation
  ↓
controller
  ↓
service
```

For object-level authorization, verify the requesting user can access the actual project/task referenced by the ID.

Never assume:

```text
Authenticated = Authorized
```

---

# 64. Database Indexing

Add indexes to fields frequently used for:

- Lookup.
- Filtering.
- Sorting.
- Relationships.

Typical indexes:

```text
users.email
projects.workspace_id
projects.owner_id
tasks.project_id
tasks.assignee_id
tasks.status
tasks.due_date
notifications.user_id
activity_logs.entity_id
activity_logs.created_at
```

Choose indexes based on actual query patterns and validate with database tooling.

---

# 65. Important Edge Cases

Test these deliberately.

### Task edge cases

- Task has no assignee.
- Assignee is removed from project.
- Due date is changed.
- Due date passes while task remains open.
- Task is deleted while comments exist.
- Parent task is completed before subtasks.
- Task dependency forms a cycle.

### Project edge cases

- Project has no tasks.
- Project has no members.
- Project is archived with active tasks.
- Project manager leaves organization.

### Authentication edge cases

- Invalid token.
- Expired token.
- Revoked token.
- Repeated failed login attempts.
- Unauthorized role escalation attempt.

---

# 66. Data Lifecycle Rules

Define what happens when records are deleted.

Prefer soft deletion for important business objects:

```text
is_deleted
 deleted_at
 deleted_by
```

This allows auditability and recovery.

Permanent deletion should be restricted.

---

# 67. Design Details That Make the Product Feel Premium

Small details matter:

- Use consistent 1px borders.
- Keep corner radii consistent.
- Use restrained shadows.
- Keep icons at a consistent visual weight.
- Align numbers in metric cards.
- Avoid overly bright backgrounds.
- Use badges consistently.
- Keep dropdown widths predictable.
- Use drawers for contextual editing.
- Prefer inline edits for low-risk fields.
- Preserve users' filters between navigation changes where appropriate.
- Use optimistic updates for instant feedback.
- Show clear error recovery actions.

---

# 68. Do Not Build These First

Avoid spending the first week on:

- A public landing page.
- Fancy 3D graphics.
- AI chatbot.
- Complex federated-learning infrastructure.
- Custom icon illustrations.
- Dozens of settings.

The order should be:

```text
Core Data Model
   ↓
Authentication
   ↓
Projects
   ↓
Tasks
   ↓
Views
   ↓
Collaboration
   ↓
Analytics
   ↓
AI
   ↓
Polish
```

---

# 69. Minimum Viable Product

The MVP should include:

```text
✓ Login / Logout
✓ Role-based permissions
✓ Project creation
✓ Project members
✓ Milestones
✓ Task creation
✓ Task assignment
✓ Status management
✓ Priority
✓ Due dates
✓ Kanban board
✓ List view
✓ Comments
✓ Notifications
✓ Dashboard
✓ Basic analytics
✓ Responsive design
```

This is the minimum version that still represents a real project-management product.

---

# 70. Advanced Version

After the MVP is stable, add:

```text
✓ Timeline / Gantt
✓ Calendar
✓ Dependencies
✓ Attachments
✓ Activity logs
✓ PDF reports
✓ Real-time collaboration
✓ AI project risk analysis
✓ AI task summaries
✓ AI assignment recommendations
✓ Advanced analytics
✓ Dark mode
✓ Command palette
✓ Keyboard shortcuts
✓ Offline-aware UI
```

---

# 71. Final Project Architecture

The target product should ultimately resemble this:

```text
┌───────────────────────────────────────────────────────────────┐
│                    PROJECT TRACKER APP                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  AUTH                    CORE WORK MANAGEMENT                 │
│  ├─ Login                ├─ Projects                         │
│  ├─ Roles                ├─ Milestones                       │
│  └─ Permissions          ├─ Tasks                            │
│                          ├─ Kanban                            │
│  COLLABORATION           ├─ List                             │
│  ├─ Comments             ├─ Calendar                         │
│  ├─ Mentions             └─ Timeline                         │
│  ├─ Activity                                                  │
│  └─ Notifications         ANALYTICS                          │
│                           ├─ Dashboard                        │
│  ADMIN                    ├─ Workload                         │
│  ├─ Members               ├─ Progress                         │
│  ├─ Roles                 └─ Reports                          │
│  └─ Audit Logs                                               │
│                                                               │
│                          AI / ML                              │
│                          ├─ Risk Prediction                   │
│                          ├─ Task Summary                      │
│                          ├─ Priority Recommendation           │
│                          └─ Assignment Recommendation         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

# 72. Final Acceptance Checklist

Before calling the project complete, verify the following.

## Functional

- [ ] Authentication works.
- [ ] Roles and permissions work.
- [ ] Projects can be created/edited/archived.
- [ ] Members can be added/removed.
- [ ] Milestones work.
- [ ] Tasks work.
- [ ] Task status updates work.
- [ ] Assignment works.
- [ ] Kanban drag-and-drop works.
- [ ] Comments work.
- [ ] Notifications work.
- [ ] Analytics calculate from real data.
- [ ] Reports are generated from real data.
- [ ] AI features use real input data.

## UX

- [ ] Loading states exist.
- [ ] Empty states exist.
- [ ] Error states exist.
- [ ] Responsive layouts work.
- [ ] Keyboard navigation works where applicable.
- [ ] Dark mode is consistent if included.
- [ ] Animations are subtle and intentional.

## Security

- [ ] Passwords are hashed.
- [ ] Protected API routes exist.
- [ ] Authorization is server-side.
- [ ] Input validation exists.
- [ ] Rate limiting exists for sensitive endpoints.
- [ ] Secrets are stored in environment variables.
- [ ] File uploads are validated.

## Technical

- [ ] Backend follows modular architecture.
- [ ] Frontend follows component-based architecture.
- [ ] Database relationships are documented.
- [ ] API endpoints are documented.
- [ ] Error handling is centralized.
- [ ] Tests cover critical flows.
- [ ] Production build succeeds.

---

# 73. Recommended Documentation Package

The final repository should contain:

```text
README.md
PROJECT_BLUEPRINT.md
API_DOCUMENTATION.md
DATABASE_SCHEMA.md
AI_MODEL_DOCUMENTATION.md
DEPLOYMENT.md
.env.example
```

For an academic submission, also prepare:

```text
System Architecture Diagram
Use Case Diagram
DFD Level 0
DFD Level 1
ER Diagram
Class Diagram
Sequence Diagrams
Activity Diagrams
Database Schema
UI Wireframes
Final Screenshots
Testing Report
```

---

# 74. Recommended Presentation Story

When presenting the project, do not simply show screens.

Tell the system story:

```text
Problem
  ↓
Fragmented project management
  ↓
Centralized project workspace
  ↓
Tasks + collaboration + tracking
  ↓
Analytics
  ↓
AI-based project insights
  ↓
Faster identification of project risks
```

Then demonstrate one complete workflow from login to project completion.

---

# 75. The Core Design Principle

The Project Tracker App should never feel like:

> "A database CRUD application with some charts."

It should feel like:

> **A focused project-management operating system with a modern SaaS interface, structured workflows, real-time collaboration, analytics, and an explainable AI layer.**

The best implementation strategy is to make the **core project-management system exceptionally solid first**, then layer AI and advanced analytics on top of reliable project/task data.

---

# 76. Build Order Summary

Use this exact order when implementing:

```text
01. Repository + architecture
02. Database schema
03. Backend API foundation
04. Authentication
05. RBAC
06. Workspace
07. Projects
08. Milestones
09. Tasks
10. Task details
11. Kanban
12. List view
13. Calendar
14. Timeline
15. Comments
16. Notifications
17. Activity log
18. Dashboard
19. Analytics
20. Reports
21. AI risk engine
22. AI recommendations
23. Real-time updates
24. Responsive design
25. Accessibility
26. Security hardening
27. Testing
28. Deployment
29. Final visual polish
```

This sequence minimizes rework because each later module builds on stable project, task, user, and permission foundations.

---

# 77. Final Target

The final application should communicate the following within the first 30 seconds of use:

**I know what projects exist.**  
**I know what I need to do.**  
**I know what is late or blocked.**  
**I know how the team is performing.**  
**I can see why a project may be at risk.**  
**I can take action immediately.**

That is the standard the implementation should target.
