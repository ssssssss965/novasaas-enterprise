# NovaSaaS - Enterprise Workspace & Operations SaaS Platform

NovaSaaS is a production-ready, full-stack multi-tenant SaaS application featuring a Node.js Express REST API backend, JWT authentication, Role-Based Access Control (RBAC), file upload vault, subscription billing management, and interactive OpenAPI documentation.

---

## 🌟 Key Features

### ✅ Frontend
- **React 19 + TypeScript**: Type-safe components and clean modular code layout.
- **Tailwind CSS v4 + Motion**: Modern dark/light mode UI with responsive layouts.
- **Role-Aware Navigation**: Adaptive UI controls according to `ADMIN`, `MANAGER`, or `MEMBER` privileges.

### ✅ Backend (Node.js + Express)
- **RESTful API**: REST endpoints for auth, users, projects, tasks, files, subscriptions, and API keys.
- **Security Suite**:
  - `bcryptjs` password hashing (10 salt rounds).
  - JWT Bearer Token issuing & rotation (`jsonwebtoken`).
  - Request rate limiting with custom HTTP headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`).
  - Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
  - CORS middleware configuration.
- **Multer Storage**: Multipart file upload handling with disk persistence for images, PDFs, and documents.

### ✅ Database & Persistence
- **Synced JSON / PostgreSQL Store**: Auto-seeding initial database with persistent disk updates.
- **Data Models**: Users, Workspaces, Tasks, Subscriptions, Media Files, API Keys, and Audit Logs.

### ✅ Interactive Swagger API Documentation
- Live interactive REST API explorer allowing direct execution of API requests directly within the browser with timing metrics and HTTP status responses.

---

## 📂 Project Structure

```
.
├── server.ts                 # Express REST API backend server (port 3000)
├── uploads/                  # Multer disk storage directory for vault files
├── data/                     # Persistent database store (database.json)
├── src/
│   ├── main.tsx              # React entrypoint
│   ├── App.tsx               # Primary SaaS app shell
│   ├── types.ts              # Global TypeScript interfaces & types
│   ├── lib/
│   │   └── api.ts            # Frontend API client with JWT bearer header injection
│   └── components/
│       ├── Navbar.tsx        # Top navigation with live backend health check
│       ├── Sidebar.tsx       # Operations sidebar with RBAC indicator
│       ├── DashboardView.tsx # System KPIs, traffic chart & audit logs
│       ├── ProjectsView.tsx  # Kanban & List project/task manager
│       ├── UsersView.tsx     # Team directory & RBAC role manager
│       ├── BillingView.tsx   # SaaS subscription plans & usage meters
│       ├── MediaManagerView.tsx # Document vault & file uploader
│       ├── ApiKeysView.tsx   # Developer API key generator & rate limits
│       ├── ApiDocsView.tsx   # Interactive Swagger/OpenAPI API Explorer
│       ├── DeployDocsView.tsx# Production specs & PostgreSQL DDL
│       └── AuthModal.tsx     # JWT login, register & 1-click preset demo accounts
├── package.json              # Scripts & dependencies
├── .env.example              # Environment variables template
└── tsconfig.json             # TypeScript config
```

---

## 🔑 Demo Account Credentials

Click **"Sign In / Demo"** in the top navbar to use 1-click preset logins:

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@novasaas.com` | `admin123` | Full access: User RBAC, Billing, API Keys, Workspaces |
| **MANAGER** | `manager@novasaas.com` | `manager123` | Workspace management, File uploads, Task assignments |
| **DEVELOPER** | `dev@novasaas.com` | `dev123` | Task execution, Kanban board updates, Vault view |

---

## 🛠️ Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/novasaas.git
   cd novasaas
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🚢 Production Build & Deployment

### 1. Build the production bundle:
```bash
npm run build
```
This builds static assets via Vite and compiles `server.ts` into a self-contained CommonJS server bundle (`dist/server.cjs`) via `esbuild`.

### 2. Start the production server:
```bash
npm start
```

### 3. Docker Deployment:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

---

## 🛡️ License

Apache 2.0 License - NovaSaaS Operations Platform.
