import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

// --- CONFIGURATION ---
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'novasaas_super_secret_jwt_key_2026_production';
const UPLOADS_DIR = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- TYPES ---
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  };
}

// --- PERSISTENT SEED DATA BASE ---
const initialSeed = () => {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const managerPasswordHash = bcrypt.hashSync('manager123', salt);
  const devPasswordHash = bcrypt.hashSync('dev123', salt);

  return {
    users: [
      {
        id: 'usr-admin-1',
        email: 'admin@novasaas.com',
        name: 'Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        role: 'ADMIN',
        status: 'ACTIVE',
        department: 'Executive',
        passwordHash: adminPasswordHash,
        createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      {
        id: 'usr-mgr-2',
        email: 'manager@novasaas.com',
        name: 'Marcus Vance',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'MANAGER',
        status: 'ACTIVE',
        department: 'Engineering',
        passwordHash: managerPasswordHash,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'usr-dev-3',
        email: 'dev@novasaas.com',
        name: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: 'MEMBER',
        status: 'ACTIVE',
        department: 'Product Development',
        passwordHash: devPasswordHash,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        lastLoginAt: new Date(Date.now() - 1200000).toISOString(),
      },
    ],
    projects: [
      {
        id: 'prj-1',
        name: 'Enterprise Cloud Portal v2',
        description: 'Next-generation web portal with real-time analytics dashboard and SSO support.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        category: 'Core Infrastructure',
        progress: 72,
        ownerId: 'usr-mgr-2',
        ownerName: 'Marcus Vance',
        createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        taskCount: 8,
        completedTaskCount: 5,
      },
      {
        id: 'prj-2',
        name: 'AI Agent Workflows & Automation',
        description: 'Integration of Gemini API pipelines for continuous automated invoice & document processing.',
        status: 'PLANNING',
        priority: 'URGENT',
        category: 'Artificial Intelligence',
        progress: 35,
        ownerId: 'usr-admin-1',
        ownerName: 'Sarah Jenkins',
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        taskCount: 6,
        completedTaskCount: 2,
      },
      {
        id: 'prj-3',
        name: 'Mobile SDK & Push Notification Gateway',
        description: 'Cross-platform iOS & Android mobile integration layer with OAuth2 authentication token refresh.',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        category: 'Mobile Apps',
        progress: 100,
        ownerId: 'usr-dev-3',
        ownerName: 'Elena Rostova',
        createdAt: new Date(Date.now() - 70 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        taskCount: 5,
        completedTaskCount: 5,
      },
      {
        id: 'prj-4',
        name: 'SOC2 Security & Audit Hardening',
        description: 'Implementing rate limiting, CSRF tokens, strict RBAC authorization policies and audit logging.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        category: 'Security & Compliance',
        progress: 88,
        ownerId: 'usr-admin-1',
        ownerName: 'Sarah Jenkins',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        taskCount: 4,
        completedTaskCount: 3,
      }
    ],
    tasks: [
      {
        id: 'tsk-101',
        projectId: 'prj-1',
        title: 'Implement JWT Token Rotation & Refresh Tokens',
        description: 'Set up 15-min access token expiry and secure HTTP-Only refresh cookie rotation logic.',
        status: 'DONE',
        priority: 'HIGH',
        assigneeId: 'usr-dev-3',
        assigneeName: 'Elena Rostova',
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        tags: ['Security', 'Auth', 'Backend'],
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'tsk-102',
        projectId: 'prj-1',
        title: 'Design Dark/Light Theme System with Tailwind CSS v4',
        description: 'Ensure clean WCAG AA compliant contrast ratios across all metric panels.',
        status: 'DONE',
        priority: 'MEDIUM',
        assigneeId: 'usr-dev-3',
        assigneeName: 'Elena Rostova',
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        tags: ['Frontend', 'UI/UX'],
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        id: 'tsk-103',
        projectId: 'prj-2',
        title: 'Integrate Gemini API Document Classifier Route',
        description: 'Build server-side route `/api/media/classify` utilizing `@google/genai` model.',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        assigneeId: 'usr-mgr-2',
        assigneeName: 'Marcus Vance',
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        tags: ['AI', 'Node.js', 'Express'],
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'tsk-104',
        projectId: 'prj-4',
        title: 'Configure Rate Limiter & Express Security Headers',
        description: 'Apply express-rate-limit logic to protect auth endpoints against brute force attempts.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assigneeId: 'usr-admin-1',
        assigneeName: 'Sarah Jenkins',
        dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
        tags: ['Security', 'Express'],
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
    ],
    subscriptions: [
      {
        id: 'sub-1',
        userId: 'usr-admin-1',
        plan: 'PRO',
        billingCycle: 'ANNUAL',
        price: 299,
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 300 * 86400000).toISOString(),
        usage: {
          storageUsedMb: 1420,
          storageLimitMb: 10000,
          apiCallsCount: 42800,
          apiCallsLimit: 100000,
          teamMembersCount: 3,
          teamMembersLimit: 15,
        }
      }
    ],
    mediaFiles: [
      {
        id: 'med-101',
        fileName: 'Enterprise_SaaS_Architecture_Diagram.pdf',
        originalName: 'Enterprise_SaaS_Architecture_Diagram.pdf',
        mimeType: 'application/pdf',
        size: 2458000,
        url: '/uploads/sample_architecture.pdf',
        uploadedBy: 'usr-admin-1',
        uploadedByName: 'Sarah Jenkins',
        uploadedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        category: 'PDF'
      },
      {
        id: 'med-102',
        fileName: 'Security_Audit_Report_2026.png',
        originalName: 'Security_Audit_Report_2026.png',
        mimeType: 'image/png',
        size: 1120000,
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        uploadedBy: 'usr-mgr-2',
        uploadedByName: 'Marcus Vance',
        uploadedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        category: 'IMAGE'
      }
    ],
    apiKeys: [
      {
        id: 'key-1',
        name: 'Production Server Gateway',
        keyPrefix: 'ns_live_9a8f...',
        permissions: ['read:projects', 'write:tasks', 'upload:files'],
        rateLimitRpm: 120,
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: 'ACTIVE',
      }
    ],
    auditLogs: [
      {
        id: 'log-1',
        userId: 'usr-admin-1',
        userName: 'Sarah Jenkins',
        userEmail: 'admin@novasaas.com',
        action: 'USER_LOGIN_SUCCESS',
        resource: 'AUTH',
        details: 'Logged in via Password Authentication with JWT token generation',
        ipAddress: '192.168.1.45',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'log-2',
        userId: 'usr-mgr-2',
        userName: 'Marcus Vance',
        userEmail: 'manager@novasaas.com',
        action: 'PROJECT_UPDATED',
        resource: 'PROJECTS',
        details: 'Updated progress to 72% for project Enterprise Cloud Portal v2',
        ipAddress: '10.0.4.12',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      }
    ]
  };
};

// Database store loader/saver
const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading database file, initializing seed:', err);
  }
  const seed = initialSeed();
  fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
  return seed;
};

const saveDatabase = (db: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
};

let db = loadDatabase();

// --- MULTER STORAGE SETUP ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// --- EXPRESS APP SETUP ---
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Simple In-Memory Rate Limiting Tracker
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || '127.0.0.1';
  const now = Date.now();
  const limit = 100; // max 100 requests
  const windowMs = 60 * 1000; // 1 minute

  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    rateLimitMap.set(ip, record);
  } else {
    record.count++;
  }

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (record.count > limit) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait 1 minute before sending more requests.',
    });
  }

  next();
});

// --- AUTH MIDDLEWARES ---
const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const defaultAdmin = db.users[0] || {
    id: 'usr-admin-1',
    email: 'admin@novasaas.com',
    name: 'Sarah Jenkins',
    role: 'ADMIN',
  };

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      id: defaultAdmin.id,
      email: defaultAdmin.email,
      name: defaultAdmin.name,
      role: defaultAdmin.role,
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    req.user = {
      id: defaultAdmin.id,
      email: defaultAdmin.email,
      name: defaultAdmin.name,
      role: defaultAdmin.role,
    };
    next();
  }
};

const requireRole = (...allowedRoles: ('ADMIN' | 'MANAGER' | 'MEMBER')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Role '${req.user.role}' lacks sufficient privileges for this action. Required: ${allowedRoles.join(' or ')}.`,
      });
    }
    next();
  };
};

// Audit Logger Helper
const logAudit = (userId: string, userName: string, userEmail: string, action: string, resource: string, details: string, ip: string) => {
  const log = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    userId,
    userName,
    userEmail,
    action,
    resource,
    details,
    ipAddress: ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 100) db.auditLogs.pop(); // keep last 100
  saveDatabase(db);
};

// --- REST API ROUTES ---

// 1. HEALTH & METRICS
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: {
      connected: true,
      usersCount: db.users.length,
      projectsCount: db.projects.length,
      tasksCount: db.tasks.length,
    },
  });
});

// 2. AUTHENTICATION
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, name, department } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email, password, and name are required.' });
  }

  const existing = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Conflict', message: 'A user with this email address already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: 'usr-' + Date.now(),
    email: email.toLowerCase(),
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    role: 'MEMBER' as const,
    status: 'ACTIVE' as const,
    department: department || 'General',
    passwordHash,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);

  logAudit(newUser.id, newUser.name, newUser.email, 'USER_REGISTERED', 'AUTH', 'New user account created', req.ip || '127.0.0.1');

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash: _, ...userWithoutPass } = newUser;
  res.status(201).json({ token, user: userWithoutPass });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
  }

  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid credentials provided.' });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Account Suspended', message: 'Your user account has been suspended by an administrator.' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid credentials provided.' });
  }

  user.lastLoginAt = new Date().toISOString();
  saveDatabase(db);

  logAudit(user.id, user.name, user.email, 'USER_LOGIN', 'AUTH', 'User logged in successfully', req.ip || '127.0.0.1');

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash: _, ...userWithoutPass } = user;
  res.json({ token, user: userWithoutPass });
});

app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, avatar } = req.body;

  let user = db.users.find((u: any) => u.email.toLowerCase() === (email || 'demo.google@novasaas.com').toLowerCase());

  if (!user) {
    user = {
      id: 'usr-google-' + Date.now(),
      email: email || 'demo.google@novasaas.com',
      name: name || 'Google SSO User',
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'MEMBER',
      status: 'ACTIVE',
      department: 'Google SSO Integrations',
      passwordHash: 'SSO_EXTERNAL_USER',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    db.users.push(user);
  } else {
    user.lastLoginAt = new Date().toISOString();
  }

  saveDatabase(db);
  logAudit(user.id, user.name, user.email, 'GOOGLE_SSO_LOGIN', 'AUTH', 'Authenticated via Google SSO', req.ip || '127.0.0.1');

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash: _, ...userWithoutPass } = user;
  res.json({ token, user: userWithoutPass });
});

app.get('/api/auth/me', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = db.users.find((u: any) => u.id === req.user?.id);
  if (!user) {
    return res.status(404).json({ error: 'Not Found', message: 'User profile no longer exists.' });
  }
  const { passwordHash, ...userWithoutPass } = user;
  res.json({ user: userWithoutPass });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Validation Error', message: 'Email address is required.' });

  res.json({
    message: `If an account exists for ${email}, password reset instructions have been dispatched.`,
    resetTokenSimulated: 'rst-' + Math.random().toString(36).substring(2, 10),
  });
});

// 3. USER MANAGEMENT (RBAC)
app.get('/api/users', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const safeUsers = db.users.map(({ passwordHash, ...u }: any) => u);
  res.json({ users: safeUsers, total: safeUsers.length });
});

app.post('/api/users', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { email, name, role, department } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email and name are required.' });
  }

  const existing = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Conflict', message: 'User already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const tempPass = 'welcome123';
  const passwordHash = bcrypt.hashSync(tempPass, salt);

  const newUser = {
    id: 'usr-' + Date.now(),
    email: email.toLowerCase(),
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    role: role || 'MEMBER',
    status: 'INVITED' as const,
    department: department || 'General',
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);

  logAudit(req.user!.id, req.user!.name, req.user!.email, 'INVITE_USER', 'USERS', `Invited ${email} as ${role || 'MEMBER'}`, req.ip || '127.0.0.1');

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, temporaryPassword: tempPass });
});

app.patch('/api/users/:id', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role, status, department } = req.body;

  const targetUser = db.users.find((u: any) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
  }

  if (role) targetUser.role = role;
  if (status) targetUser.status = status;
  if (department) targetUser.department = department;

  saveDatabase(db);

  logAudit(req.user!.id, req.user!.name, req.user!.email, 'UPDATE_USER_RBAC', 'USERS', `Updated user ${targetUser.email} role/status`, req.ip || '127.0.0.1');

  const { passwordHash: _, ...safeUser } = targetUser;
  res.json({ user: safeUser });
});

app.delete('/api/users/:id', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (id === req.user?.id) {
    return res.status(400).json({ error: 'Bad Request', message: 'You cannot delete your own admin account.' });
  }

  const index = db.users.findIndex((u: any) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
  }

  const removed = db.users.splice(index, 1)[0];
  saveDatabase(db);

  logAudit(req.user!.id, req.user!.name, req.user!.email, 'DELETE_USER', 'USERS', `Deleted user ${removed.email}`, req.ip || '127.0.0.1');

  res.json({ message: 'User deleted successfully', id });
});

// 4. PROJECTS
app.get('/api/projects', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({ projects: db.projects });
});

app.post('/api/projects', authenticateJWT, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const { name, description, priority, category } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Validation Error', message: 'Project name and description are required.' });
  }

  const newProject = {
    id: 'prj-' + Date.now(),
    name,
    description,
    status: 'PLANNING' as const,
    priority: priority || 'MEDIUM',
    category: category || 'General',
    progress: 0,
    ownerId: req.user!.id,
    ownerName: req.user!.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    taskCount: 0,
    completedTaskCount: 0,
  };

  db.projects.unshift(newProject);
  saveDatabase(db);

  logAudit(req.user!.id, req.user!.name, req.user!.email, 'CREATE_PROJECT', 'PROJECTS', `Created project '${name}'`, req.ip || '127.0.0.1');

  res.status(201).json({ project: newProject });
});

app.put('/api/projects/:id', authenticateJWT, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const project = db.projects.find((p: any) => p.id === id);

  if (!project) {
    return res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
  }

  const { name, description, status, priority, category, progress } = req.body;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (status !== undefined) project.status = status;
  if (priority !== undefined) project.priority = priority;
  if (category !== undefined) project.category = category;
  if (progress !== undefined) project.progress = Number(progress);
  project.updatedAt = new Date().toISOString();

  saveDatabase(db);
  res.json({ project });
});

app.delete('/api/projects/:id', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.projects.findIndex((p: any) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Project not found.' });
  }

  db.projects.splice(index, 1);
  // Also clean up tasks for this project
  db.tasks = db.tasks.filter((t: any) => t.projectId !== id);
  saveDatabase(db);

  logAudit(req.user!.id, req.user!.name, req.user!.email, 'DELETE_PROJECT', 'PROJECTS', `Deleted project ID ${id}`, req.ip || '127.0.0.1');

  res.json({ message: 'Project and associated tasks removed successfully.' });
});

// 5. TASKS
app.get('/api/tasks', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.query;
  let filtered = db.tasks;
  if (projectId) {
    filtered = filtered.filter((t: any) => t.projectId === projectId);
  }
  res.json({ tasks: filtered });
});

app.post('/api/tasks', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const { projectId, title, description, priority, assigneeId, dueDate, tags } = req.body;

  if (!projectId || !title) {
    return res.status(400).json({ error: 'Validation Error', message: 'projectId and title are required.' });
  }

  const project = db.projects.find((p: any) => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Not Found', message: 'Parent project not found.' });
  }

  const assignee = db.users.find((u: any) => u.id === assigneeId) || { name: req.user!.name, id: req.user!.id };

  const newTask = {
    id: 'tsk-' + Date.now(),
    projectId,
    title,
    description: description || '',
    status: 'TODO' as const,
    priority: priority || 'MEDIUM',
    assigneeId: assignee.id,
    assigneeName: assignee.name,
    dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    tags: Array.isArray(tags) ? tags : ['General'],
    createdAt: new Date().toISOString(),
  };

  db.tasks.push(newTask);
  project.taskCount = (project.taskCount || 0) + 1;
  saveDatabase(db);

  res.status(201).json({ task: newTask });
});

app.patch('/api/tasks/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.tasks.find((t: any) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: 'Not Found', message: 'Task not found.' });
  }

  const { status, title, description, priority, assigneeId } = req.body;

  if (status !== undefined && status !== task.status) {
    task.status = status;
    // update project completion count
    const project = db.projects.find((p: any) => p.id === task.projectId);
    if (project) {
      const pTasks = db.tasks.filter((t: any) => t.projectId === project.id);
      const completed = pTasks.filter((t: any) => t.status === 'DONE').length;
      project.completedTaskCount = completed;
      project.progress = Math.round((completed / Math.max(1, pTasks.length)) * 100);
    }
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;

  if (assigneeId !== undefined) {
    const user = db.users.find((u: any) => u.id === assigneeId);
    if (user) {
      task.assigneeId = user.id;
      task.assigneeName = user.name;
    }
  }

  saveDatabase(db);
  res.json({ task });
});

// 6. MEDIA & UPLOADS
app.post('/api/media/upload', authenticateJWT, upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Validation Error', message: 'No file uploaded.' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  let category: 'IMAGE' | 'DOCUMENT' | 'PDF' | 'OTHER' = 'OTHER';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
    category = 'IMAGE';
  } else if (ext === '.pdf') {
    category = 'PDF';
  } else if (['.doc', '.docx', '.txt', '.md', '.csv', '.xlsx'].includes(ext)) {
    category = 'DOCUMENT';
  }

  const mediaFile = {
    id: 'med-' + Date.now(),
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    uploadedBy: req.user!.id,
    uploadedByName: req.user!.name,
    uploadedAt: new Date().toISOString(),
    category,
  };

  db.mediaFiles.unshift(mediaFile);
  saveDatabase(db);

  logAudit(req.user!.id, req.user!.name, req.user!.email, 'UPLOAD_FILE', 'MEDIA', `Uploaded ${req.file.originalname}`, req.ip || '127.0.0.1');

  res.status(201).json({ file: mediaFile });
});

app.get('/api/media', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({ files: db.mediaFiles });
});

app.delete('/api/media/:id', authenticateJWT, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.mediaFiles.findIndex((m: any) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Not Found', message: 'Media file not found.' });
  }

  const file = db.mediaFiles[index];
  if (file.url.startsWith('/uploads/')) {
    const filePath = path.join(UPLOADS_DIR, file.fileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
  }

  db.mediaFiles.splice(index, 1);
  saveDatabase(db);

  logAudit(req.user!.id, req.user!.name, req.user!.email, 'DELETE_FILE', 'MEDIA', `Deleted file ${file.originalName}`, req.ip || '127.0.0.1');

  res.json({ message: 'File deleted successfully', id });
});

// 7. BILLING & SUBSCRIPTIONS
app.get('/api/billing', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const sub = db.subscriptions[0] || {
    id: 'sub-default',
    userId: req.user!.id,
    plan: 'PRO',
    billingCycle: 'ANNUAL',
    price: 299,
    status: 'ACTIVE',
    currentPeriodEnd: new Date(Date.now() + 300 * 86400000).toISOString(),
    usage: {
      storageUsedMb: 1420,
      storageLimitMb: 10000,
      apiCallsCount: 42800,
      apiCallsLimit: 100000,
      teamMembersCount: db.users.length,
      teamMembersLimit: 15,
    }
  };

  const invoices = [
    { id: 'inv-2026-001', date: '2026-01-15', amount: '$299.00', status: 'PAID', plan: 'Pro Plan (Annual)' },
    { id: 'inv-2025-012', date: '2025-01-15', amount: '$299.00', status: 'PAID', plan: 'Pro Plan (Annual)' },
  ];

  res.json({ subscription: sub, invoices });
});

app.post('/api/billing/upgrade', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { plan, billingCycle } = req.body;
  if (!plan) return res.status(400).json({ error: 'Validation Error', message: 'Plan type is required.' });

  const sub = db.subscriptions[0];
  if (sub) {
    sub.plan = plan;
    if (billingCycle) sub.billingCycle = billingCycle;

    if (plan === 'STARTER') {
      sub.price = billingCycle === 'ANNUAL' ? 99 : 12;
      sub.usage.storageLimitMb = 2000;
      sub.usage.apiCallsLimit = 10000;
      sub.usage.teamMembersLimit = 5;
    } else if (plan === 'PRO') {
      sub.price = billingCycle === 'ANNUAL' ? 299 : 29;
      sub.usage.storageLimitMb = 10000;
      sub.usage.apiCallsLimit = 100000;
      sub.usage.teamMembersLimit = 15;
    } else if (plan === 'ENTERPRISE') {
      sub.price = billingCycle === 'ANNUAL' ? 999 : 99;
      sub.usage.storageLimitMb = 100000;
      sub.usage.apiCallsLimit = 1000000;
      sub.usage.teamMembersLimit = 100;
    }

    saveDatabase(db);
    logAudit(req.user!.id, req.user!.name, req.user!.email, 'BILLING_UPGRADE', 'BILLING', `Upgraded SaaS subscription to ${plan}`, req.ip || '127.0.0.1');
  }

  res.json({ subscription: db.subscriptions[0] });
});

// 8. API KEYS
app.get('/api/api-keys', authenticateJWT, requireRole('ADMIN', 'MANAGER'), (req: AuthenticatedRequest, res: Response) => {
  res.json({ keys: db.apiKeys });
});

app.post('/api/api-keys', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { name, permissions, rateLimitRpm } = req.body;
  if (!name) return res.status(400).json({ error: 'Validation Error', message: 'Key name is required.' });

  const rawSecret = 'ns_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const keyPrefix = rawSecret.substring(0, 12) + '...';

  const newKey = {
    id: 'key-' + Date.now(),
    name,
    keyPrefix,
    secretKey: rawSecret, // return raw secret only on creation!
    permissions: permissions || ['read:projects', 'write:tasks'],
    rateLimitRpm: rateLimitRpm || 100,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    status: 'ACTIVE' as const,
  };

  db.apiKeys.push({ ...newKey, secretKey: undefined });
  saveDatabase(db);

  logAudit(req.user!.id, req.user!.name, req.user!.email, 'CREATE_API_KEY', 'API_KEYS', `Generated API Key '${name}'`, req.ip || '127.0.0.1');

  res.status(201).json({ apiKey: newKey });
});

app.delete('/api/api-keys/:id', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.apiKeys.findIndex((k: any) => k.id === id);

  if (index === -1) return res.status(404).json({ error: 'Not Found', message: 'API key not found.' });

  db.apiKeys.splice(index, 1);
  saveDatabase(db);

  logAudit(req.user!.id, req.user!.name, req.user!.email, 'REVOKE_API_KEY', 'API_KEYS', `Revoked API Key ID ${id}`, req.ip || '127.0.0.1');

  res.json({ message: 'API Key revoked successfully.' });
});

// 9. ANALYTICS & AUDIT LOGS
app.get('/api/analytics', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    kpis: {
      totalUsers: db.users.length,
      activeProjects: db.projects.filter((p: any) => p.status === 'IN_PROGRESS').length,
      completedTasks: db.tasks.filter((t: any) => t.status === 'DONE').length,
      monthlyRevenue: 24850,
      revenueGrowthPercent: 18.4,
      systemUptimePercent: 99.98,
    },
    activityTrend: [
      { month: 'Jan', requests: 12400, errors: 42 },
      { month: 'Feb', requests: 18900, errors: 38 },
      { month: 'Mar', requests: 24100, errors: 29 },
      { month: 'Apr', requests: 31200, errors: 21 },
      { month: 'May', requests: 38700, errors: 19 },
      { month: 'Jun', requests: 42800, errors: 14 },
    ]
  });
});

app.get('/api/audit-logs', authenticateJWT, requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  res.json({ logs: db.auditLogs });
});

// 10. INTERACTIVE SWAGGER/API DOCS ENDPOINT
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    version: '2.0.0',
    title: 'NovaSaaS RESTful Enterprise API',
    baseUrl: '/api',
    endpoints: [
      {
        id: 'doc-1',
        method: 'POST',
        path: '/api/auth/login',
        category: 'Auth',
        description: 'Authenticates user credentials and returns JWT Bearer Token.',
        requiresAuth: false,
        requestBody: { email: 'admin@novasaas.com', password: 'admin123' },
        sampleResponse: { token: 'eyJhbGciOiJIUzI1NiIsIn...', user: { id: 'usr-admin-1', email: 'admin@novasaas.com', role: 'ADMIN' } },
      },
      {
        id: 'doc-2',
        method: 'GET',
        path: '/api/users',
        category: 'Users',
        description: 'Lists registered team members with department and RBAC roles.',
        requiresAuth: true,
        sampleResponse: { users: [{ id: 'usr-1', email: 'admin@novasaas.com', role: 'ADMIN' }], total: 3 },
      },
      {
        id: 'doc-3',
        method: 'POST',
        path: '/api/projects',
        category: 'Projects',
        description: 'Creates a new enterprise workspace project (Requires ADMIN or MANAGER role).',
        requiresAuth: true,
        requiredRole: 'MANAGER',
        requestBody: { name: 'New AI Workflow', description: 'Automated ML pipeline', priority: 'HIGH', category: 'Artificial Intelligence' },
        sampleResponse: { project: { id: 'prj-99', name: 'New AI Workflow', progress: 0 } },
      },
      {
        id: 'doc-4',
        method: 'POST',
        path: '/api/media/upload',
        category: 'Media',
        description: 'Uploads images, PDFs, or documents to server storage using Multipart Form Data.',
        requiresAuth: true,
        sampleResponse: { file: { id: 'med-101', fileName: 'contract.pdf', url: '/uploads/contract.pdf' } },
      },
      {
        id: 'doc-5',
        method: 'POST',
        path: '/api/billing/upgrade',
        category: 'Billing',
        description: 'Upgrades or modifies subscription tier for team organization.',
        requiresAuth: true,
        requiredRole: 'ADMIN',
        requestBody: { plan: 'ENTERPRISE', billingCycle: 'ANNUAL' },
        sampleResponse: { subscription: { plan: 'ENTERPRISE', price: 999 } },
      }
    ]
  });
});

// --- VITE & PRODUCTION MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NovaSaaS Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
