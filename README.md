# Kriri

<div align="center">
  <h3>A premium, intelligent workspace for managing projects, tasks, and teams.</h3>
  <p>Engineered for speed, precision, and collaboration.</p>
</div>

---

## ⚡ Overview

Kriri is a high-performance project management platform built to streamline team workflows. Combining a powerful relational database with real-time updates and an intuitive frontend, Kriri brings clarity to complex operations. From Kanban boards to dynamic list views, your data is always exactly where you need it.

## 🛠️ Technology Stack

Kriri is built using modern, reliable technologies carefully chosen to deliver a seamless user experience.

- **Frontend:** React.js, Tailwind CSS, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Relational schema with strong foreign keys)
- **Authentication:** Clerk (with Webhook-based JIT Provisioning)
- **State Management:** React hooks and context
- **Routing:** React Router DOM

## 📐 Architecture & Logic

Kriri's architecture is designed around **Workspaces**, **Projects**, and **Tasks**. 

1. **Authentication & Identity**: User authentication is handled securely via Clerk. Clerk webhooks seamlessly sync user data and organization memberships into the local PostgreSQL database using Just-In-Time (JIT) provisioning.
2. **Workspaces (Organizations)**: Every project and task belongs to a Workspace. Workspaces mirror Clerk Organizations. Users have specific roles (Owner, Admin, Member, etc.) that enforce strict Access Control Logic across the application.
3. **Projects**: Projects are scoped to a Workspace and contain specific Tasks. Project metadata (status, priority, target dates) is updated in real-time.
4. **Tasks (Issues)**: The core operational unit. Tasks are strongly linked to both a Project and a Workspace, ensuring data integrity.
5. **Real-time Synchronization**: (Planned) The platform will leverage WebSockets to guarantee instantaneous state synchronization across all connected clients.

## 🚀 Features

- **Multi-tenant Workspaces:** Create organizations, invite team members, and assign roles effortlessly.
- **Multiple Views:** Visualize your projects via Kanban boards, dynamic Lists, or Timelines.
- **Rich Task Management:** Assign priorities, due dates, statuses, and assignees.
- **Dark Mode First:** Designed with a sleek, premium dark-mode aesthetic.
- **Drag-and-Drop:** Intuitive interfaces for re-ordering and updating task/project statuses.

## ⚙️ Local Development

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)
- Clerk Account

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Cy-Jones/Kriri.git
   cd Kriri
   ```

2. **Database Setup:**
   Ensure PostgreSQL is running, then execute the schema and migrations in your database:
   ```bash
   psql -U your_user -d kriri -f backend/schema.sql
   psql -U your_user -d kriri -f backend/migrations/001_align_projects_and_tasks.sql
   ```

3. **Backend Configuration:**
   Navigate to the `backend` directory, install dependencies, and configure environment variables.
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env with your PostgreSQL credentials and Clerk keys
   npm run dev
   ```

4. **Frontend Configuration:**
   Navigate to the `frontend` directory, install dependencies, and configure environment variables.
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Update .env with your Clerk Publishable Key and backend URL
   npm run dev
   ```

5. **Clerk Webhooks:**
   To enable JIT provisioning, configure Clerk Webhooks to point to `http://<your-domain>/api/webhooks/clerk` and subscribe to:
   - `user.created`, `user.updated`, `user.deleted`
   - `organizationMembership.updated`

---

<div align="center">
  <p>Built with ❤️ by Cy-Jones</p>
</div>
