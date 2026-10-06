# Kriri 🚀

Kriri is a high-performance, full-stack project tracking and management platform meticulously designed to provide engineering and product teams with uncompromised visibility into their workflows. It is built with a focus on strict architectural separation, responsive data mutations, and a premium visual aesthetic.

## ✨ Features

- **Interactive Kanban Board:** Intuitive drag-and-drop interface for effortless task progression and state transitions.
- **Dynamic List View:** A dense, highly configurable data grid supporting customized property visibility for detailed task management.
- **Timeline Visualization:** A comprehensive Gantt-style view rendering project lifecycles, critical dates, and dependencies.
- **Optimistic UI Updates:** Experience a tactile, low-latency feel with rapid client-side state management.
- **Role-Based Access Control (RBAC):** Secure authorization policies ensuring only authorized personnel (Project Managers or Admins) can perform destructive actions or modify project metadata.
- **Seamless Identity Sync:** User profiles are seamlessly synchronized between Clerk authentication and the local database.

## 🏗️ System Architecture & App Logic

Kriri operates on a modern, decoupled client-server architecture ensuring high reliability, scalability, and an excellent developer experience.

### Frontend Client

The frontend is a blazing-fast single-page application built with **React** and **Vite**.
- **Routing & State:** Utilizes React Router for seamless client-side navigation. State is managed locally with React Hooks and Context, optimized for rapid optimistic UI updates.
- **Visual Layer:** Styled with Tailwind CSS, leveraging custom headless components, glassmorphism, and minimal hardware-accelerated animations for a tactile, low-latency feel.

### Backend Services

The backend is a lightweight, robust **Node.js/Express** REST API serving as the definitive source of truth.
- **Database Engine:** PostgreSQL handles strict referential integrity between Users, Projects, Tasks, and Teams.
- **Identity Management:** User authentication and identity are securely managed by **Clerk**. The backend listens to Clerk webhooks to synchronize user profiles into the local PostgreSQL database.
- **Authorization (RBAC):** While authentication is offloaded to Clerk, authorization is handled internally for fine-grained access control.

## 🛠️ Technology Stack

- **Frontend Client:** React 18, Vite, Tailwind CSS, Lucide React, dnd-kit, shadcn/ui
- **Backend Server:** Node.js, Express.js
- **Database:** PostgreSQL (with node-postgres/pg)
- **Authentication & Identity:** Clerk
- **Others:** Zod (Validation), Argon2/Bcrypt

## 🚀 Getting Started

Follow these steps to set up the Kriri environment locally on your machine.

### 1. Repository Initialization

Clone the repository and navigate into the project directory:

```bash
git clone https://github.com/Cy-Jones/Kriri.git
cd Kriri
```

### 2. Backend Configuration

Navigate to the backend directory and install the required dependencies:

```bash
cd backend
npm install
```

Establish the environment configuration by creating a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/kriri
CLERK_SECRET_KEY=your_clerk_secret_key
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Execute the database schema script (`schema.sql`) against your local PostgreSQL instance to set up the tables:

```bash
psql -U <username> -d kriri -f schema.sql
```

Then, start the backend server in development mode:

```bash
npm run dev
```

### 3. Frontend Configuration

Open a new terminal, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

Establish the client environment by creating a `.env` file in the `frontend` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:3000/api
```

Start the Vite development server:

```bash
npm run dev
```

Your frontend should now be running at `http://localhost:5173` and connected to your local backend API!

## 📄 License

This project is licensed under the MIT License.
