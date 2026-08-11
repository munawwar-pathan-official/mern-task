# CaseFlow - MERN Case Workflow Management System

CaseFlow is a full-stack MERN (MongoDB, Express, React, Node.js) application designed for managing multi-role verification cases with strict server-enforced state transitions, comprehensive audit logging, file attachments, and search/filtering/pagination capabilities.

---

## 🚀 Quickstart (Clone & Run in < 10 Minutes)

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v25.9)
- **NPM**: v9+ (tested on npm 11.15)
- **MongoDB**: Local MongoDB instance OR no setup required (includes automatic zero-config fallback to `mongodb-memory-server` if local MongoDB is not running!).

### 2. Installation & Setup

Clone the repository and run the setup commands in the root directory:

```bash
# 1. Install dependencies for root, server, and client
npm run install-all

# 2. Seed the database with demo users, sample cases, and audit logs
npm run seed

# 3. Start both backend server (port 5005) and Vite frontend (port 3000) concurrently
npm run dev
```

Open your browser to: **`http://localhost:3000`**

---

## 🔑 Demo Credentials (1-Click Logins Available on Login Page)

| Role | Email | Password | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **Manager** | `manager@example.com` | `password123` | Create cases, assign agents, review submissions, mark cases **Cleared** or **Discrepant**, view all cases & audit logs. |
| **Agent 1** | `agent1@example.com` | `password123` | View assigned cases, start work (`In Progress`), upload evidence/photos, add notes, submit case for review. |
| **Agent 2** | `agent2@example.com` | `password123` | Secondary agent account with assigned sample cases. |

---

## ☁️ Production Deployment Guide

### Backend → Render

1. Connect your GitHub repository to [Render](https://dashboard.render.com/).
2. Render will automatically detect the included [`render.yaml`](file:///Applications/XAMPP/xamppfiles/htdocs/mern-task/render.yaml) specification:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Set environment variable `MONGODB_URI` to your MongoDB Atlas connection string:
   `mongodb+srv://<user>:<password>@cluster.mongodb.net/mern-task?retryWrites=true&w=majority`
4. Copy your live Render URL (e.g., `https://mern-task-backend.onrender.com`).

### Frontend → Vercel

1. Connect your repository to [Vercel](https://vercel.com/dashboard).
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variable:
   `VITE_API_URL` = `https://mern-task-backend.onrender.com`
5. Vercel automatically deploys with SPA rewrites via [`client/vercel.json`](file:///Applications/XAMPP/xamppfiles/htdocs/mern-task/client/vercel.json).

---

## 🔄 Server-Enforced Status State Machine

The status flow is strictly validated on the Express server:

```
[ New ] ──(Manager Assigns Agent)──> [ Assigned ] ──(Agent Starts Work)──> [ In Progress ]
                                                                               │
[ Cleared ] <──(Manager Approves)── [ Submitted ] <──(Agent Submits Work)──────┘
     OR
[ Discrepant ] <──(Manager Rejects)──┘
```

### Transition Matrix & Enforcement:
1. **New → Assigned**: Allowed for Manager when assigning an Agent.
2. **Assigned → In Progress**: Allowed for assigned Agent or Manager starting field work.
3. **In Progress → Submitted**: Allowed for assigned Agent after uploading documents and adding investigation notes.
4. **Submitted → Cleared**: Allowed **ONLY** for Manager upon reviewing submitted report.
5. **Submitted → Discrepant**: Allowed **ONLY** for Manager if issues or discrepancies are identified.

> **Server-Side Security**: Any invalid status transition attempt (e.g. `New` → `Cleared` or an Agent marking a case as `Cleared`) is rejected with a `400 Bad Request` or `403 Forbidden` response and detailed error message.

---

## 📊 Database Schemas (Mongoose)

### 1. `User`
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (hashed with `bcryptjs`)
- `role`: Enum (`'Manager'`, `'Agent'`)

### 2. `Case`
- `clientName`: String (required)
- `subjectName`: String (required)
- `caseType`: String (required)
- `dueDate`: Date (required)
- `status`: Enum (`'New'`, `'Assigned'`, `'In Progress'`, `'Submitted'`, `'Cleared'`, `'Discrepant'`)
- `assignedTo`: ObjectId -> `User` (Agent)
- `createdBy`: ObjectId -> `User` (Manager)

### 3. `Document`
- `caseId`: ObjectId -> `Case`
- `uploadedBy`: ObjectId -> `User`
- `originalName`: String
- `filename`: String
- `path`: Local storage path (`/uploads/...`)
- `mimeType`: String
- `size`: Number (bytes)

### 4. `Comment`
- `caseId`: ObjectId -> `Case`
- `author`: ObjectId -> `User`
- `text`: String

### 5. `AuditLog`
- `caseId`: ObjectId -> `Case`
- `changedBy`: ObjectId -> `User`
- `action`: String (`CASE_CREATED`, `CASE_ASSIGNED`, `STATUS_CHANGE`, `DOCUMENT_UPLOADED`, `COMMENT_ADDED`)
- `fromStatus`: String
- `toStatus`: String
- `details`: String
- `createdAt`: Date

---

## 📡 REST API Endpoint Reference

### Authentication
- `POST /api/auth/register`: Register new user (`name`, `email`, `password`, `role`)
- `POST /api/auth/login`: Authenticate and receive JWT token
- `GET /api/auth/me`: Get current authenticated user profile
- `GET /api/auth/agents`: Get list of registered agents (Manager access)

### Cases
- `GET /api/cases`: List cases with search (`?search=`), status filter (`?status=`), agent filter (`?agent=`), and pagination (`?page=1&limit=8`)
- `POST /api/cases`: Create a new case (Manager only)
- `GET /api/cases/:id`: Get single case details (Agent restricted to assigned cases)
- `PUT /api/cases/:id/assign`: Assign/reassign case to an Agent (Manager only)
- `PUT /api/cases/:id/status`: Transition case status (Server state machine enforced)
- `GET /api/cases/:id/audit-logs`: Fetch chronological audit trail for a case

### Documents & Comments
- `POST /api/cases/:id/documents`: Upload file attachment (`multer` storage)
- `GET /api/cases/:id/documents`: List uploaded files for a case
- `POST /api/cases/:id/comments`: Add investigation note/comment
- `GET /api/cases/:id/comments`: List comments for a case

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Axios, React Router v6.
- **Backend**: Node.js, Express, Mongoose, JWT (`jsonwebtoken`), Bcryptjs, Multer, Express-Validator.
- **Database**: MongoDB (Local or embedded `mongodb-memory-server`).

---

## 💻 Running Tests / Verification

- Check backend API status: `http://localhost:5005/api/health`
- Execute database re-seeding anytime: `npm run seed` inside `server/` or root directory.
=======
# mern-task
