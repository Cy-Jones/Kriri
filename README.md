# Kriri

Kriri is a high-performance, full-stack project tracking and management platform designed to provide engineering and product teams with uncompromised visibility into their workflows. Built with a focus on strict architectural separation, responsive data mutations, and a premium visual aesthetic.

## System Architecture & App Logic

Kriri operates on a decoupled client-server architecture utilizing PostgreSQL for relational data integrity and Clerk for identity management.

### Frontend Client
The frontend is a single-page application built with React and Vite.
- **Routing & State:** Utilizes React Router for client-side navigation. State is managed locally with React Hooks and Context, optimized for rapid optimistic UI updates.
- **Visual Layer:** Styled with Tailwind CSS, leveraging custom headless components, glassmorphism, and minimal hardware-accelerated animations for a tactile, low-latency feel.
- **Views:**
  - **Kanban Board:** Implements drag-and-drop state transitions for task progression.
  - **List View:** A dense, configurable data grid supporting customized property visibility.
  - **Timeline:** A Gantt-style visualization rendering project lifecycles and critical dates.

### Backend Services
The backend is a lightweight Node.js/Express REST API serving as the definitive source of truth.
- **Database Engine:** PostgreSQL handles strict referential integrity between Users, Projects, Tasks, and Teams.
- **Identity Sync:** User identities are managed by Clerk. The backend listens to Clerk webhooks to synchronize user profiles into the local PostgreSQL database, ensuring all domain entities reference valid internal user records.
- **Authorization (RBAC):** While authentication is offloaded to Clerk, authorization is handled internally. Access control policies enforce that only Project Managers or designated Admins can perform destructive actions or modify project metadata.

## Technology Stack

- **Client:** React 18, Vite, Tailwind CSS, Lucide React
- **Server:** Node.js, Express, pg (node-postgres)
- **Database:** PostgreSQL
- **Identity:** Clerk

## Local Environment Setup

### 1. Repository Initialization
Clone the repository and prepare the workspace:
```bash
git clone https://github.com/Cy-Jones/Kriri.git
cd Kriri
```

### 2. Backend Configuration
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```
Establish the environment configuration. Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/kriri
CLERK_SECRET_KEY=your_clerk_secret_key
PORT=3000
```
Execute the database schema script (`schema.sql`) against your local Postgres instance, then start the server:
```bash
npm run dev
```

### 3. Frontend Configuration
Navigate to the frontend directory and install dependencies:
```bash
cd ../frontend
npm install
```
Establish the client environment. Create a `.env` file in the `frontend` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:3000/api
```
Start the development server:
```bash
npm run dev
```

## License
MIT License
