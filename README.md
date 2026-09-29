# Smart Classroom Hub - Frontend

A modern, role-based web interface for institutional classroom management, featuring real-time attendance tracking, student and staff administration, schedule management, and integration with an AI-powered face recognition microservice.

---

## 🚀 Key Features

- **Role-Based Access Control (RBAC):** Custom interfaces and permissions for `SUPER_ADMIN`, `ADMIN`, `HOD`, `TEACHER`, and `STUDENT`.
- **Attendance Management:** Automated multi-face attendance capture via webcam and real-time report generation.
- **Academic Administration:** Student directories, semester tracking, branch and department management, timetable builder.
- **Hardware & Device Monitoring:** Classroom device tracking and environmental status indicators.
- **Legal & Compliance:** Built-in Privacy Policy and Terms of Service pages.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4
- **State Management:** Redux Toolkit + React-Redux
- **Routing:** React Router v7
- **HTTP Client:** Axios with JWT request interception & auto-refresh
- **Icons & Visuals:** Lucide React & Recharts
- **Notifications:** React Hot Toast

---

## 📂 Project Structure

```text
smart-classroom-frontend/
├── public/                 # Static assets (favicons, SVG marks)
├── src/
│   ├── api/                # Axios API services by domain
│   ├── components/         # Reusable UI components & layouts
│   ├── pages/              # Role-specific & functional page views
│   ├── routes/             # AppRoutes, PrivateRoute & RoleRoute
│   ├── store/              # Redux slices & store configuration
│   ├── styles/             # Global CSS
│   ├── App.jsx             # Root application component
│   └── main.jsx            # Application entry point
├── .env.example            # Environment variables template
├── package.json            # Project dependencies & scripts
├── vite.config.js          # Vite configuration & dev proxy
└── README.md
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Backend API:** Spring Boot backend running on `http://localhost:8080` (optional during frontend-only development)
- **Face Service:** Python OpenCV/FastAPI service running on `http://localhost:8000` (for face registration)

### 2. Installation
```bash
git clone <your-repo-url>
cd smart-classroom-frontend
npm install
```

### 3. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
In development, the built-in Vite dev proxy automatically forwards all `/api/*` calls to `http://localhost:8080/api/*`.

### 4. Running the Development Server
```bash
npm run dev
```
The app will run at `http://localhost:5173`.

### 5. Production Build
```bash
npm run build
```
Build output is generated inside the `dist/` directory.

---

## 📜 License
Internal Institutional Software. All rights reserved.
