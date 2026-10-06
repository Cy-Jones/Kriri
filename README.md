# Kriri

Kriri is a modern, full-stack project tracking and management application designed for seamless team collaboration. Built with a focus on speed, aesthetics, and rich interactions, Kriri empowers teams to manage tasks, visualize roadmaps, and track progress effortlessly across a variety of customized views.

## 🚀 Features

- **Project Workspaces:** Organize work into distinct projects with customizable properties (status, priority, health, dates, lead, members).
- **Dynamic Views:**
  - **Board (Kanban):** Drag and drop tasks across columns to easily update their status.
  - **List:** A compact, sortable, and highly customizable tabular view of all projects/tasks.
  - **Timeline:** Visualize project schedules and deadlines over a sleek timeline chart.
- **Role-Based Access Control (RBAC):** Built-in security so that only authorized project managers and admins can edit or delete projects.
- **Team Management:** Add team members, assign project leads, and group members into specific teams.
- **Beautiful UI:** A premium dark-mode interface with glassmorphism, micro-animations, and modern typography (using Inter), tailored for developer and product teams.
- **Authentication:** Secure user login and identity management via Clerk.

## 🛠 Tech Stack

**Frontend:**
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- Custom UI components with headless primitives and smooth animations
- [Clerk](https://clerk.com/) for Authentication
- [Lucide React](https://lucide.dev/) for icons

**Backend:**
- [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/) for robust, relational data storage
- RESTful API architecture

## 🏗 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Clerk Account (for auth keys)

### 1. Clone the repository
```bash
git clone https://github.com/Cy-Jones/Kriri.git
cd Kriri
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory and add your Postgres connection string and Clerk Secret Key:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/kriri
CLERK_SECRET_KEY=your_clerk_secret_key
PORT=3000
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` directory with your Clerk publishable key and the API URL:
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_API_URL=http://localhost:3000/api
```
Start the frontend development server:
```bash
npm run dev
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the MIT License.
