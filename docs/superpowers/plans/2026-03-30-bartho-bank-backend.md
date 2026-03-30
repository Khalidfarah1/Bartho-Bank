# Bartho Bank Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Node.js + Express + Prisma + PostgreSQL backend to Bartho Bank with JWT authentication, replacing the in-memory `store.ts` with a persistent REST API.

**Architecture:** Express REST API lives in `/server` alongside the existing React frontend in `/src`. The frontend's `store.ts` is deleted and replaced with a `src/lib/api.ts` fetch wrapper. New Login and Register pages handle auth. JWT tokens are stored in `localStorage` under key `bartho_token`.

**Tech Stack:** Node.js, Express 4, TypeScript, Prisma ORM, PostgreSQL, bcryptjs, jsonwebtoken, Jest + supertest (backend); React, Vite, TypeScript, Tailwind CSS (frontend, existing)

---

## File Map

**New — Backend (`/server`)**
- `server/package.json` — dependencies and scripts
- `server/tsconfig.json` — TypeScript config for the server
- `server/jest.config.js` — Jest config using ts-jest
- `server/.env.example` — template for required env vars
- `server/prisma/schema.prisma` — User, Account, Transaction models
- `server/src/app.ts` — Express app factory (no listen call, importable by tests)
- `server/src/index.ts` — starts the server (imports app, calls listen)
- `server/src/lib/prisma.ts` — Prisma client singleton
- `server/src/middleware/auth.ts` — JWT verify middleware
- `server/src/routes/auth.ts` — POST /api/auth/register, POST /api/auth/login
- `server/src/routes/account.ts` — GET /api/account, PATCH /api/account
- `server/src/routes/transactions.ts` — GET /api/transactions, POST /api/transfers

**New — Frontend (`/src`)**
- `src/types.ts` — Transaction and Account interfaces (replaces store interfaces)
- `src/lib/api.ts` — fetch wrapper with JWT header injection
- `src/pages/Login.tsx` — login form (dark/orange design)
- `src/pages/Register.tsx` — register form (dark/orange design)

**Modified — Frontend**
- `src/App.tsx` — adds /login, /register routes; PrivateRoute guard
- `src/pages/Dashboard.tsx` — replaces store subscription with API fetch
- `src/pages/Transfer.tsx` — replaces transferMoney() with api.transfer()
- `src/pages/Spending.tsx` — replaces store subscription with API fetch
- `src/pages/AccountDetails.tsx` — replaces updateAccount() with api.updateAccount()
- `src/pages/BankDetails.tsx` — replaces getState() with api.getAccount()
- `src/components/Layout.tsx` — adds logout button to header

**Deleted**
- `src/data/store.ts`

---

## Task 1: Server package setup

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/jest.config.js`

- [ ] **Step 1: Create server/package.json**

```json
{
  "name": "bartho-bank-server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.14",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.9.0",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "prisma": "^5.22.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create server/jest.config.js**

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
}
```

- [ ] **Step 4: Install dependencies**

Run from the `server` directory:
```bash
cd server && npm install
```

Expected: `node_modules` created, no errors.

- [ ] **Step 5: Commit**

```bash
git add server/package.json server/tsconfig.json server/jest.config.js server/package-lock.json
git commit -m "chore: scaffold server package with Express, Prisma, JWT, Jest"
```

---

## Task 2: Prisma schema and migration

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/.env.example`
- User creates: `server/.env` (manually, not committed)

- [ ] **Step 1: Create server/prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  account      Account?
}

model Account {
  id            String        @id @default(uuid())
  userId        String        @unique
  user          User          @relation(fields: [userId], references: [id])
  firstName     String
  lastName      String
  email         String
  phone         String
  address       String
  city          String
  postcode      String
  accountNumber String        @unique
  sortCode      String
  iban          String
  bic           String
  balance       Float         @default(0)
  transactions  Transaction[]
}

model Transaction {
  id          String   @id @default(uuid())
  accountId   String
  account     Account  @relation(fields: [accountId], references: [id])
  date        String
  description String
  amount      Float
  category    String
  balance     Float
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 2: Create server/.env.example**

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace-with-a-random-32-character-string
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 3: Create server/.env**

Create `server/.env` (do NOT commit this file) and fill in a real PostgreSQL connection string. For local development you can use a free Neon or Supabase PostgreSQL database.

```
DATABASE_URL=postgresql://...your real connection string...
JWT_SECRET=any-random-string-at-least-32-chars
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 4: Add server/.env to .gitignore**

Create or update `server/.gitignore`:
```
node_modules/
dist/
.env
```

Also update root `.gitignore` if it exists to include `server/.env`.

- [ ] **Step 5: Run Prisma migration**

```bash
cd server && npx prisma migrate dev --name init
```

Expected output:
```
Applying migration `20260330_init`
Your database is now in sync with your schema.
Generated Prisma Client
```

- [ ] **Step 6: Commit**

```bash
git add server/prisma/ server/.env.example server/.gitignore
git commit -m "feat: add Prisma schema with User, Account, Transaction models"
```

---

## Task 3: Prisma singleton + Express app + health endpoint

**Files:**
- Create: `server/src/lib/prisma.ts`
- Create: `server/src/app.ts`
- Create: `server/src/index.ts`
- Create: `server/src/app.test.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/app.test.ts`:
```typescript
import request from 'supertest'
import { app } from './app'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npm test -- --testPathPattern=app.test
```

Expected: FAIL — cannot find module `./app`

- [ ] **Step 3: Create server/src/lib/prisma.ts**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Create server/src/app.ts**

```typescript
import express from 'express'
import cors from 'cors'

export const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
```

- [ ] **Step 5: Create server/src/index.ts**

```typescript
import 'dotenv/config'
import { app } from './app'

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

- [ ] **Step 6: Run test to verify it passes**

```bash
cd server && npm test -- --testPathPattern=app.test
```

Expected: PASS — `GET /health returns 200 with status ok`

- [ ] **Step 7: Commit**

```bash
git add server/src/
git commit -m "feat: add Express app with health endpoint and Prisma singleton"
```

---

## Task 4: Auth middleware

**Files:**
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/middleware/auth.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/middleware/auth.test.ts`:
```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticate, AuthenticatedRequest } from './auth'

describe('authenticate middleware', () => {
  const next = jest.fn() as jest.MockedFunction<NextFunction>
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  it('returns 401 when Authorization header is missing', () => {
    const req = { headers: {} } as Request
    authenticate(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 when token is invalid', () => {
    const req = { headers: { authorization: 'Bearer not.a.valid.token' } } as Request
    authenticate(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next and attaches userId when token is valid', () => {
    const token = jwt.sign({ userId: 'user-123' }, 'test-secret')
    const req = { headers: { authorization: `Bearer ${token}` } } as Request
    authenticate(req, res, next)
    expect(next).toHaveBeenCalled()
    expect((req as AuthenticatedRequest).userId).toBe('user-123')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npm test -- --testPathPattern=auth.test
```

Expected: FAIL — cannot find module `./auth`

- [ ] **Step 3: Create server/src/middleware/auth.ts**

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  userId: string
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    ;(req as AuthenticatedRequest).userId = payload.userId
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npm test -- --testPathPattern=middleware/auth.test
```

Expected: PASS — all 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/src/middleware/
git commit -m "feat: add JWT authenticate middleware"
```

---

## Task 5: Auth routes (register + login)

**Files:**
- Create: `server/src/routes/auth.ts`
- Create: `server/src/routes/auth.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/routes/auth.test.ts`:
```typescript
import request from 'supertest'
import express from 'express'

// Build a minimal app for testing — do NOT import from ../app
// so the test doesn't depend on routes being wired in app.ts yet.
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}))

import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'
import { authRouter } from './auth'

const mockUser = prisma.user as jest.Mocked<typeof prisma.user>
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

const app = express()
app.use(express.json())
app.use('/api/auth', authRouter)

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret'
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/auth/register', () => {
  it('returns 400 if password is shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'short', firstName: 'Test', lastName: 'User' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/password/i)
  })

  it('returns 400 if firstName is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', lastName: 'User' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/firstName/i)
  })

  it('returns 400 if email already exists', async () => {
    mockUser.findUnique.mockResolvedValue({ id: 'existing-id', email: 'taken@test.com', passwordHash: 'x', createdAt: new Date() })
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'taken@test.com', password: 'password123', firstName: 'Test', lastName: 'User' })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/email/i)
  })

  it('returns 201 with token on successful registration', async () => {
    mockUser.findUnique.mockResolvedValue(null)
    mockUser.create.mockResolvedValue({ id: 'new-user-id', email: 'new@test.com', passwordHash: 'hashed', createdAt: new Date() })
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@test.com', password: 'password123', firstName: 'Test', lastName: 'User' })
    expect(res.status).toBe(201)
    expect(typeof res.body.token).toBe('string')
  })
})

describe('POST /api/auth/login', () => {
  it('returns 401 if user does not exist', async () => {
    mockUser.findUnique.mockResolvedValue(null)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })

  it('returns 401 if password is wrong', async () => {
    mockUser.findUnique.mockResolvedValue({ id: 'u1', email: 'user@test.com', passwordHash: 'hashed', createdAt: new Date() })
    mockBcrypt.compare.mockResolvedValue(false as never)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with token on valid credentials', async () => {
    mockUser.findUnique.mockResolvedValue({ id: 'u1', email: 'user@test.com', passwordHash: 'hashed', createdAt: new Date() })
    mockBcrypt.compare.mockResolvedValue(true as never)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' })
    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npm test -- --testPathPattern=routes/auth.test
```

Expected: FAIL — cannot find module `../routes/auth` (or similar)

- [ ] **Step 3: Create server/src/routes/auth.ts**

```typescript
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

export const authRouter = Router()

const SEED_TRANSACTIONS = [
  { date: '2026-03-08', description: 'National Rail',             amount:   -34.00, category: 'Transport',     balance: 2126.15 },
  { date: '2026-03-10', description: "Sainsbury's",               amount:   -52.14, category: 'Groceries',     balance: 2074.01 },
  { date: '2026-03-12', description: 'Spotify',                   amount:   -11.99, category: 'Subscriptions', balance: 2062.02 },
  { date: '2026-03-15', description: 'Transfer from James Farah', amount:   200.00, category: 'Transfer',      balance: 2262.02 },
  { date: '2026-03-18', description: 'EDF Energy',                amount:   -89.00, category: 'Bills',         balance: 2173.02 },
  { date: '2026-03-19', description: 'Costa Coffee',              amount:    -5.70, category: 'Dining',        balance: 2167.32 },
  { date: '2026-03-20', description: 'HMRC Tax Refund',           amount:   312.00, category: 'Income',        balance: 2479.32 },
  { date: '2026-03-22', description: 'Amazon',                    amount:   -43.99, category: 'Shopping',      balance: 2435.33 },
  { date: '2026-03-23', description: 'Transport for London',      amount:   -24.50, category: 'Transport',     balance: 2410.83 },
  { date: '2026-03-24', description: 'Netflix',                   amount:   -17.99, category: 'Subscriptions', balance: 2392.84 },
  { date: '2026-03-25', description: 'Tesco Superstore',          amount:   -67.34, category: 'Groceries',     balance: 2325.50 },
  { date: '2026-03-26', description: 'Salary — Acme Corp',        amount:  2500.00, category: 'Income',        balance: 4825.50 },
]

function generateAccountNumber(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

function generateIBAN(accountNumber: string): string {
  const sortDigits = '204106'
  const digits = sortDigits + accountNumber
  return `GB29 BART ${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`
}

function signToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

authRouter.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body

  if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
    res.status(400).json({ error: 'firstName is required' })
    return
  }
  if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
    res.status(400).json({ error: 'lastName is required' })
    return
  }
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'password must be at least 8 characters' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(400).json({ error: 'email already in use' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const accountNumber = generateAccountNumber()
  const iban = generateIBAN(accountNumber)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      account: {
        create: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email,
          phone: '',
          address: '',
          city: '',
          postcode: '',
          accountNumber,
          sortCode: '20-41-06',
          iban,
          bic: 'BARTHGB2',
          balance: 4825.50,
          transactions: {
            createMany: { data: SEED_TRANSACTIONS },
          },
        },
      },
    },
  })

  res.status(201).json({ token: signToken(user.id) })
})

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  res.json({ token: signToken(user.id) })
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npm test -- --testPathPattern=routes/auth.test
```

Expected: PASS — all 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/auth.ts server/src/routes/auth.test.ts
git commit -m "feat: add register and login routes with bcrypt + JWT"
```

---

## Task 6: Account routes (GET + PATCH)

**Files:**
- Create: `server/src/routes/account.ts`
- Create: `server/src/routes/account.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/routes/account.test.ts`:
```typescript
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

jest.mock('../lib/prisma', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { prisma } from '../lib/prisma'
import { accountRouter } from './account'
const mockAccount = prisma.account as jest.Mocked<typeof prisma.account>

const app = express()
app.use(express.json())
app.use('/api', accountRouter)

const FAKE_ACCOUNT = {
  id: 'acc-1',
  userId: 'user-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@test.com',
  phone: '+44 7000 000000',
  address: '1 Test Street',
  city: 'London',
  postcode: 'E1 1AA',
  accountNumber: '12345678',
  sortCode: '20-41-06',
  iban: 'GB29 BART 2041 0612 3456 78',
  bic: 'BARTHGB2',
  balance: 1000,
}

function makeToken(userId = 'user-1'): string {
  return jwt.sign({ userId }, 'test-secret')
}

beforeAll(() => { process.env.JWT_SECRET = 'test-secret' })
beforeEach(() => jest.clearAllMocks())

describe('GET /api/account', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/account')
    expect(res.status).toBe(401)
  })

  it('returns account for authenticated user', async () => {
    mockAccount.findUnique.mockResolvedValue(FAKE_ACCOUNT)
    const res = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${makeToken()}`)
    expect(res.status).toBe(200)
    expect(res.body.firstName).toBe('Test')
    expect(res.body.balance).toBe(1000)
  })

  it('returns 404 if account not found', async () => {
    mockAccount.findUnique.mockResolvedValue(null)
    const res = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${makeToken()}`)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/account', () => {
  it('updates allowed fields and returns updated account', async () => {
    mockAccount.update.mockResolvedValue({ ...FAKE_ACCOUNT, firstName: 'Updated', city: 'Manchester' })
    const res = await request(app)
      .patch('/api/account')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ firstName: 'Updated', city: 'Manchester' })
    expect(res.status).toBe(200)
    expect(res.body.firstName).toBe('Updated')
    expect(res.body.city).toBe('Manchester')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npm test -- --testPathPattern=routes/account.test
```

Expected: FAIL — routes not wired up yet

- [ ] **Step 3: Create server/src/routes/account.ts**

```typescript
import { Router, Request, Response } from 'express'
import { authenticate, AuthenticatedRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const accountRouter = Router()

accountRouter.get('/account', authenticate, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest
  const account = await prisma.account.findUnique({ where: { userId } })
  if (!account) {
    res.status(404).json({ error: 'Account not found' })
    return
  }
  res.json(account)
})

accountRouter.patch('/account', authenticate, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest
  const { firstName, lastName, email, phone, address, city, postcode } = req.body

  const data: Record<string, string> = {}
  if (firstName !== undefined) data.firstName = firstName
  if (lastName  !== undefined) data.lastName  = lastName
  if (email     !== undefined) data.email     = email
  if (phone     !== undefined) data.phone     = phone
  if (address   !== undefined) data.address   = address
  if (city      !== undefined) data.city      = city
  if (postcode  !== undefined) data.postcode  = postcode

  const account = await prisma.account.update({
    where: { userId },
    data,
  })
  res.json(account)
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npm test -- --testPathPattern=routes/account.test
```

Expected: PASS — all 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/account.ts server/src/routes/account.test.ts
git commit -m "feat: add GET and PATCH /api/account routes"
```

---

## Task 7: Transaction routes (GET + POST transfer)

**Files:**
- Create: `server/src/routes/transactions.ts`
- Create: `server/src/routes/transactions.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/routes/transactions.test.ts`:
```typescript
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

jest.mock('../lib/prisma', () => ({
  prisma: {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { prisma } from '../lib/prisma'
import { transactionsRouter } from './transactions'
const mockAccount = prisma.account as jest.Mocked<typeof prisma.account>
const mockTransaction = prisma.transaction as jest.Mocked<typeof prisma.transaction>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

const app = express()
app.use(express.json())
app.use('/api', transactionsRouter)

function makeToken(userId = 'user-1'): string {
  return jwt.sign({ userId }, 'test-secret')
}

const FAKE_ACCOUNT = { id: 'acc-1', userId: 'user-1', balance: 1000 }

beforeAll(() => { process.env.JWT_SECRET = 'test-secret' })
beforeEach(() => jest.clearAllMocks())

describe('GET /api/transactions', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/transactions')
    expect(res.status).toBe(401)
  })

  it('returns list of transactions for authenticated user', async () => {
    mockAccount.findUnique.mockResolvedValue(FAKE_ACCOUNT as any)
    mockTransaction.findMany.mockResolvedValue([
      { id: 't1', accountId: 'acc-1', date: '2026-03-26', description: 'Salary', amount: 2500, category: 'Income', balance: 4825.50, createdAt: new Date() },
    ])
    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${makeToken()}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].description).toBe('Salary')
  })
})

describe('POST /api/transfers', () => {
  it('returns 400 if amount exceeds balance', async () => {
    mockAccount.findUnique.mockResolvedValue(FAKE_ACCOUNT as any)
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ toName: 'James', toAccount: '12345678', amount: 2000 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/insufficient/i)
  })

  it('returns 400 if toAccount is not exactly 8 digits', async () => {
    mockAccount.findUnique.mockResolvedValue(FAKE_ACCOUNT as any)
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ toName: 'James', toAccount: '123', amount: 50 })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/account number/i)
  })

  it('returns 400 if reference exceeds 35 characters', async () => {
    mockAccount.findUnique.mockResolvedValue(FAKE_ACCOUNT as any)
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ toName: 'James', toAccount: '12345678', amount: 50, reference: 'x'.repeat(36) })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/reference/i)
  })

  it('returns 201 with new transaction on valid transfer', async () => {
    mockAccount.findUnique.mockResolvedValue(FAKE_ACCOUNT as any)
    const newTx = { id: 'tx-new', accountId: 'acc-1', date: '2026-03-30', description: 'Transfer to James — rent', amount: -50, category: 'Transfer', balance: 950, createdAt: new Date() }
    mockPrisma.$transaction.mockResolvedValue([newTx, { ...FAKE_ACCOUNT, balance: 950 }])
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ toName: 'James', toAccount: '12345678', amount: 50, reference: 'rent' })
    expect(res.status).toBe(201)
    expect(res.body.amount).toBe(-50)
    expect(res.body.category).toBe('Transfer')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd server && npm test -- --testPathPattern=routes/transactions.test
```

Expected: FAIL — routes not yet created

- [ ] **Step 3: Create server/src/routes/transactions.ts**

```typescript
import { Router, Request, Response } from 'express'
import { authenticate, AuthenticatedRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const transactionsRouter = Router()

transactionsRouter.get('/transactions', authenticate, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest
  const account = await prisma.account.findUnique({ where: { userId } })
  if (!account) {
    res.status(404).json({ error: 'Account not found' })
    return
  }
  const transactions = await prisma.transaction.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json(transactions)
})

transactionsRouter.post('/transfers', authenticate, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest
  const { toName, toAccount, amount, reference } = req.body

  if (!toName || typeof toName !== 'string' || !toName.trim()) {
    res.status(400).json({ error: 'toName is required' })
    return
  }
  if (!toAccount || !/^\d{8}$/.test(toAccount)) {
    res.status(400).json({ error: 'account number must be exactly 8 digits' })
    return
  }
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'amount must be a positive number' })
    return
  }
  if (reference && reference.length > 35) {
    res.status(400).json({ error: 'reference must be 35 characters or fewer' })
    return
  }

  const account = await prisma.account.findUnique({ where: { userId } })
  if (!account) {
    res.status(404).json({ error: 'Account not found' })
    return
  }
  if (amount > account.balance) {
    res.status(400).json({ error: 'Insufficient funds' })
    return
  }

  const newBalance = parseFloat((account.balance - amount).toFixed(2))
  const dateStr = new Date().toISOString().split('T')[0]
  const description = `Transfer to ${toName.trim()}${reference ? ` — ${reference}` : ''}`

  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        accountId: account.id,
        date: dateStr,
        description,
        amount: -amount,
        category: 'Transfer',
        balance: newBalance,
      },
    }),
    prisma.account.update({
      where: { id: account.id },
      data: { balance: newBalance },
    }),
  ])

  res.status(201).json(transaction)
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd server && npm test -- --testPathPattern=routes/transactions.test
```

Expected: PASS — all 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/transactions.ts server/src/routes/transactions.test.ts
git commit -m "feat: add GET /api/transactions and POST /api/transfers routes"
```

---

## Task 8: Wire all routes into the Express app

**Files:**
- Modify: `server/src/app.ts`

- [ ] **Step 1: Update server/src/app.ts to import and mount all routes**

```typescript
import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth'
import { accountRouter } from './routes/account'
import { transactionsRouter } from './routes/transactions'

export const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api', accountRouter)
app.use('/api', transactionsRouter)
```

- [ ] **Step 2: Run all backend tests to confirm nothing broke**

```bash
cd server && npm test
```

Expected: All tests pass (health + auth middleware + auth routes + account routes + transaction routes)

- [ ] **Step 3: Start the dev server and verify manually**

```bash
cd server && npm run dev
```

Then in a separate terminal:
```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: Commit**

```bash
git add server/src/app.ts
git commit -m "feat: wire all routes into Express app"
```

---

## Task 9: Frontend types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create src/types.ts**

This replaces the interfaces that were in `src/data/store.ts`. Note `Account` is now a single unified type (combines old `AccountDetails` + `BankDetails`).

Create `src/types.ts` in the `Bartho Bank` repo (the frontend root, alongside the existing `src` folder):

```typescript
export interface Transaction {
  id: string
  date: string
  description: string
  amount: number    // negative = debit, positive = credit
  category: string
  balance: number   // running balance after this transaction
}

export interface Account {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postcode: string
  accountNumber: string
  sortCode: string
  iban: string
  bic: string
  balance: number
}

export type EditableAccountField = 'firstName' | 'lastName' | 'email' | 'phone' | 'address' | 'city' | 'postcode'
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared frontend types (Account, Transaction)"
```

---

## Task 10: Frontend API client

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: Create src/lib/api.ts**

```typescript
import type { Account, Transaction } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export function getToken(): string | null {
  return localStorage.getItem('bartho_token')
}

export function setToken(token: string): void {
  localStorage.setItem('bartho_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('bartho_token')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  register: (body: { email: string; password: string; firstName: string; lastName: string }) =>
    request<{ token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  getAccount: () =>
    request<Account>('/api/account'),

  updateAccount: (body: Partial<Account>) =>
    request<Account>('/api/account', { method: 'PATCH', body: JSON.stringify(body) }),

  getTransactions: () =>
    request<Transaction[]>('/api/transactions'),

  transfer: (body: { toName: string; toAccount: string; amount: number; reference?: string }) =>
    request<Transaction>('/api/transfers', { method: 'POST', body: JSON.stringify(body) }),
}
```

- [ ] **Step 2: Add VITE_API_URL to .env**

Add to the root `.env` file (create if it doesn't exist):
```
VITE_API_URL=http://localhost:3001
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts .env
git commit -m "feat: add frontend API client with JWT token management"
```

---

## Task 11: Login and Register pages

**Files:**
- Create: `src/pages/Login.tsx`
- Create: `src/pages/Register.tsx`

- [ ] **Step 1: Create src/pages/Login.tsx**

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setToken } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token } = await api.login(form)
      setToken(token)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-lg">B</span>
          </div>
          <span className="text-white text-xl font-semibold tracking-tight">Bartho Bank</span>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-white/40 text-sm mb-6">Sign in to your account</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Email</label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Password</label>
              <input
                type="password" required value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-orange-500 text-black font-semibold py-3 rounded-xl hover:bg-orange-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create src/pages/Register.tsx**

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, setToken } from '../lib/api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token } = await api.register(form)
      setToken(token)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-lg">B</span>
          </div>
          <span className="text-white text-xl font-semibold tracking-tight">Bartho Bank</span>
        </div>

        <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-8">
          <h1 className="text-xl font-semibold text-white mb-1">Create an account</h1>
          <p className="text-white/40 text-sm mb-6">Get started with Bartho Bank</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">First Name</label>
                <input
                  type="text" required value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="Jane"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Last Name</label>
                <input
                  type="text" required value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Smith"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Email</label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Password</label>
              <input
                type="password" required value={form.password} minLength={8}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-orange-500 text-black font-semibold py-3 rounded-xl hover:bg-orange-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Login.tsx src/pages/Register.tsx
git commit -m "feat: add Login and Register pages with dark/orange design"
```

---

## Task 12: App.tsx — auth routing and PrivateRoute guard

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Read the current src/App.tsx**

Current content (`src/App.tsx`):
```tsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transfer from './pages/Transfer'
import AccountDetails from './pages/AccountDetails'
import BankDetails from './pages/BankDetails'
import Spending from './pages/Spending'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="transfer" element={<Transfer />} />
        <Route path="spending" element={<Spending />} />
        <Route path="account" element={<AccountDetails />} />
        <Route path="bank" element={<BankDetails />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 2: Replace src/App.tsx with the auth-guarded version**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transfer from './pages/Transfer'
import AccountDetails from './pages/AccountDetails'
import BankDetails from './pages/BankDetails'
import Spending from './pages/Spending'
import Login from './pages/Login'
import Register from './pages/Register'
import { isAuthenticated } from './lib/api'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transfer" element={<Transfer />} />
        <Route path="spending" element={<Spending />} />
        <Route path="account" element={<AccountDetails />} />
        <Route path="bank" element={<BankDetails />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add PrivateRoute guard, /login and /register routes"
```

---

## Task 13: Dashboard page — replace store with API

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Replace src/pages/Dashboard.tsx**

Replace the entire file:
```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Account, Transaction } from '../types'

const categoryColors: Record<string, string> = {
  Income:        'text-emerald-400 bg-emerald-400/10',
  Groceries:     'text-yellow-400 bg-yellow-400/10',
  Subscriptions: 'text-purple-400 bg-purple-400/10',
  Transport:     'text-blue-400 bg-blue-400/10',
  Shopping:      'text-pink-400 bg-pink-400/10',
  Dining:        'text-orange-400 bg-orange-400/10',
  Bills:         'text-red-400 bg-red-400/10',
  Transfer:      'text-white/40 bg-white/5',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function categoryEmoji(cat: string) {
  const map: Record<string, string> = {
    Income: '💰', Groceries: '🛒', Subscriptions: '📱',
    Transport: '🚇', Shopping: '🛍️', Dining: '☕',
    Bills: '⚡', Transfer: '↔️',
  }
  return map[cat] ?? '💳'
}

export default function Dashboard() {
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    Promise.all([api.getAccount(), api.getTransactions()])
      .then(([acc, txs]) => { setAccount(acc); setTransactions(txs) })
      .catch(() => {})
  }, [])

  const balance = account?.balance ?? 0
  const monthIncome = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const monthSpend  = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Good morning{account ? `, ${account.firstName}` : ''}
        </h1>
        <p className="text-white/40 text-sm mt-1">Here's your account overview</p>
      </div>

      {/* Balance card */}
      <div className="bg-orange-500 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 opacity-60" />
        <div className="relative z-10">
          <p className="text-black/60 text-xs font-semibold uppercase tracking-widest">Available Balance</p>
          <p className="text-5xl font-bold text-black mt-2 tracking-tight">{fmt(balance)}</p>
          <p className="text-black/50 text-sm mt-1">Personal Current Account</p>
          <div className="flex gap-3 mt-6">
            <Link to="/transfer" className="bg-black text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-black/80 transition-colors">
              Send Money
            </Link>
            <Link to="/bank" className="bg-black/20 text-black text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-black/30 transition-colors">
              Bank Details
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-xl p-4">
          <p className="text-white/30 text-xs font-medium uppercase tracking-wide">Money In</p>
          <p className="text-xl font-bold text-emerald-400 mt-1.5">{fmt(monthIncome)}</p>
          <p className="text-white/20 text-xs mt-1">This period</p>
        </div>
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-xl p-4">
          <p className="text-white/30 text-xs font-medium uppercase tracking-wide">Money Out</p>
          <p className="text-xl font-bold text-red-400 mt-1.5">{fmt(monthSpend)}</p>
          <p className="text-white/20 text-xs mt-1">This period</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Recent Transactions</h2>
          <span className="text-white/20 text-xs">{transactions.length} transactions</span>
        </div>
        <ul>
          {transactions.map((tx: Transaction, i: number) => (
            <li
              key={tx.id}
              className={`flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors ${
                i < transactions.length - 1 ? 'border-b border-white/[0.04]' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-base">
                  {categoryEmoji(tx.category)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                  <p className="text-xs text-white/30 mt-0.5">{fmtDate(tx.date)}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                  {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${categoryColors[tx.category] ?? 'text-white/40 bg-white/5'}`}>
                  {tx.category}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: connect Dashboard to REST API"
```

---

## Task 14: Transfer page — replace store with API

**Files:**
- Modify: `src/pages/Transfer.tsx`

- [ ] **Step 1: Replace src/pages/Transfer.tsx**

```tsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)
}

type Status = 'idle' | 'success' | 'error' | 'insufficient' | 'loading'

export default function Transfer() {
  const [balance, setBalance] = useState(0)
  const [form, setForm] = useState({ toName: '', toAccount: '', sortCode: '', amount: '', reference: '' })
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    api.getAccount().then(acc => setBalance(acc.balance)).catch(() => {})
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) { setStatus('error'); return }
    if (amt > balance) { setStatus('insufficient'); return }
    setStatus('loading')
    try {
      await api.transfer({ toName: form.toName, toAccount: form.toAccount, amount: amt, reference: form.reference || undefined })
      const acc = await api.getAccount()
      setBalance(acc.balance)
      setStatus('success')
      setForm({ toName: '', toAccount: '', sortCode: '', amount: '', reference: '' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('insufficient')) setStatus('insufficient')
      else setStatus('error')
    }
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold text-white">Send Money</h1>
        <p className="text-white/40 text-sm mt-1">Transfer funds to another account</p>
      </div>

      {/* Balance pill */}
      <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
        <span className="text-sm text-orange-400 font-medium">Available: {fmt(balance)}</span>
      </div>

      {/* Success banner */}
      {status === 'success' && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-emerald-400 mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-emerald-400 text-sm">Transfer successful</p>
            <p className="text-sm text-white/40 mt-0.5">Your payment has been processed and your balance updated.</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Recipient Name</label>
            <input
              type="text" name="toName" value={form.toName} onChange={handleChange} required
              placeholder="e.g. James Smith"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Account Number</label>
              <input
                type="text" name="toAccount" value={form.toAccount} onChange={handleChange} required
                placeholder="12345678" maxLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Sort Code</label>
              <input
                type="text" name="sortCode" value={form.sortCode} onChange={handleChange} required
                placeholder="20-41-06" maxLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-medium text-sm">£</span>
              <input
                type="number" name="amount" value={form.amount} onChange={handleChange} required
                min="0.01" step="0.01" placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
            {status === 'insufficient' && <p className="text-red-400 text-xs mt-2">Insufficient funds. Balance is {fmt(balance)}.</p>}
            {status === 'error'        && <p className="text-red-400 text-xs mt-2">Please enter a valid amount.</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
              Reference <span className="normal-case text-white/20">(optional)</span>
            </label>
            <input
              type="text" name="reference" value={form.reference} onChange={handleChange}
              placeholder="e.g. Rent, Invoice #42..." maxLength={35}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-xs text-white/20 mb-2">Quick amounts</p>
            <div className="flex flex-wrap gap-2">
              {[10, 25, 50, 100, 250, 500].map(n => (
                <button
                  key={n} type="button"
                  onClick={() => { setForm(f => ({ ...f, amount: String(n) })); setStatus('idle') }}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-white/50 hover:border-orange-500 hover:text-orange-400 transition-colors"
                >
                  £{n}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={status === 'loading'}
            className="w-full bg-orange-500 text-black font-semibold py-3 rounded-xl hover:bg-orange-400 transition-colors text-sm disabled:opacity-50"
          >
            {status === 'loading' ? 'Sending…' : 'Send Money'}
          </button>
        </form>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 text-sm text-white/30">
        <strong className="text-white/50">Security reminder:</strong> Always verify recipient details before sending. Bartho Bank will never ask you to transfer money urgently.
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Transfer.tsx
git commit -m "feat: connect Transfer page to REST API"
```

---

## Task 15: Spending page — replace store with API

**Files:**
- Modify: `src/pages/Spending.tsx`

- [ ] **Step 1: Replace the import and state management at the top of src/pages/Spending.tsx**

Replace only lines 1–44 (the imports and the state setup inside the component). Everything from the `return (` statement onwards stays identical.

The new full file:
```tsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Transaction } from '../types'

function fmt(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Math.abs(n))
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

const categoryMeta: Record<string, { color: string; bar: string; emoji: string }> = {
  Groceries:     { color: 'text-yellow-400',  bar: 'bg-yellow-400',  emoji: '🛒' },
  Subscriptions: { color: 'text-purple-400',  bar: 'bg-purple-400',  emoji: '📱' },
  Transport:     { color: 'text-blue-400',    bar: 'bg-blue-400',    emoji: '🚇' },
  Shopping:      { color: 'text-pink-400',    bar: 'bg-pink-400',    emoji: '🛍️' },
  Dining:        { color: 'text-orange-400',  bar: 'bg-orange-400',  emoji: '☕' },
  Bills:         { color: 'text-red-400',     bar: 'bg-red-400',     emoji: '⚡' },
  Transfer:      { color: 'text-white/40',    bar: 'bg-white/30',    emoji: '↔️' },
  Income:        { color: 'text-emerald-400', bar: 'bg-emerald-400', emoji: '💰' },
}

function groupByDate(txs: Transaction[]) {
  const groups: { label: string; items: Transaction[] }[] = []
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const existing = map.get(tx.date)
    if (existing) { existing.push(tx) }
    else { map.set(tx.date, [tx]); groups.push({ label: tx.date, items: map.get(tx.date)! }) }
  }
  return groups
}

type Tab = 'overview' | 'timeline'

export default function Spending() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<Tab>('overview')

  useEffect(() => {
    api.getTransactions().then(setTransactions).catch(() => {})
  }, [])

  const debits = transactions.filter(t => t.amount < 0)
  const totalSpent = debits.reduce((s, t) => s + Math.abs(t.amount), 0)

  const byCategory = debits.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + Math.abs(t.amount)
    return acc
  }, {})
  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const maxCat = sortedCategories[0]?.[1] ?? 1

  const byDay = debits.reduce<Record<string, number>>((acc, t) => {
    acc[t.date] = (acc[t.date] ?? 0) + Math.abs(t.amount)
    return acc
  }, {})
  const dayEntries = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
  const maxDay = Math.max(...dayEntries.map(([, v]) => v), 1)

  const grouped = groupByDate(transactions)

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold text-white">Spending</h1>
        <p className="text-white/40 text-sm mt-1">Track your spending in real time</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-xl p-1 w-fit">
        {(['overview', 'timeline'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <p className="text-white/30 text-xs font-medium uppercase tracking-widest">Total Spent This Period</p>
            <p className="text-4xl font-bold text-white mt-2">{fmt(totalSpent)}</p>
            <p className="text-white/30 text-xs mt-1">{debits.length} transactions</p>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <p className="text-white text-sm font-semibold mb-5">Daily Spend</p>
            <div className="flex items-end gap-1.5 h-24">
              {dayEntries.map(([date, amount]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full bg-orange-500/70 hover:bg-orange-500 rounded-t-md transition-all cursor-default"
                    style={{ height: `${(amount / maxDay) * 96}px` }}
                  />
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <p className="font-semibold">{fmt(amount)}</p>
                    <p className="text-white/40">{fmtTime(date)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-white/20 text-xs">{dayEntries[0] ? fmtTime(dayEntries[0][0]) : ''}</span>
              <span className="text-white/20 text-xs">{dayEntries.length ? fmtTime(dayEntries[dayEntries.length - 1][0]) : ''}</span>
            </div>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <p className="text-white text-sm font-semibold mb-5">By Category</p>
            <div className="space-y-4">
              {sortedCategories.map(([cat, amount]) => {
                const meta = categoryMeta[cat] ?? { color: 'text-white/40', bar: 'bg-white/30', emoji: '💳' }
                const pct = Math.round((amount / totalSpent) * 100)
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-sm text-white font-medium">{cat}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/30">{pct}%</span>
                        <span className={`text-sm font-semibold ${meta.color}`}>{fmt(amount)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${meta.bar} transition-all duration-700`} style={{ width: `${(amount / maxCat) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-2">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <div className="flex items-center gap-3 px-1 py-2">
                <span className="text-xs font-semibold text-white/30 uppercase tracking-widest whitespace-nowrap">
                  {fmtDate(label)}
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-xs text-white/20">
                  {fmt(items.reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
              <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                {items.map((tx, i) => {
                  const meta = categoryMeta[tx.category] ?? { color: 'text-white/40', bar: 'bg-white/30', emoji: '💳' }
                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors ${
                        i < items.length - 1 ? 'border-b border-white/[0.04]' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${tx.amount > 0 ? 'bg-emerald-400' : 'bg-orange-500'}`} />
                        {i < items.length - 1 && <div className="w-px flex-1 bg-white/5 mt-1" style={{ minHeight: '20px' }} />}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-base shrink-0">
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-white/5 ${meta.color}`}>{tx.category}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                          {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)}
                        </p>
                        <p className="text-xs text-white/20 mt-0.5">bal. {fmt(tx.balance)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Spending.tsx
git commit -m "feat: connect Spending page to REST API"
```

---

## Task 16: AccountDetails page — replace store with API

**Files:**
- Modify: `src/pages/AccountDetails.tsx`

- [ ] **Step 1: Replace src/pages/AccountDetails.tsx**

```tsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Account, EditableAccountField } from '../types'

type FormState = Record<EditableAccountField, string>

export default function AccountDetailsPage() {
  const [saved, setSaved] = useState<Account | null>(null)
  const [form, setForm] = useState<FormState>({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '', postcode: '' })
  const [editing, setEditing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.getAccount().then(acc => {
      setSaved(acc)
      setForm({ firstName: acc.firstName, lastName: acc.lastName, email: acc.email, phone: acc.phone, address: acc.address, city: acc.city, postcode: acc.postcode })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!editing && saved) {
      setForm({ firstName: saved.firstName, lastName: saved.lastName, email: saved.email, phone: saved.phone, address: saved.address, city: saved.city, postcode: saved.postcode })
    }
  }, [saved, editing])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      const updated = await api.updateAccount(form)
      setSaved(updated)
      setEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {}
  }

  function handleCancel() {
    if (saved) setForm({ firstName: saved.firstName, lastName: saved.lastName, email: saved.email, phone: saved.phone, address: saved.address, city: saved.city, postcode: saved.postcode })
    setEditing(false)
  }

  const fields: { name: EditableAccountField; label: string; type?: string; placeholder: string; span?: boolean }[] = [
    { name: 'firstName', label: 'First Name',  placeholder: 'Jane' },
    { name: 'lastName',  label: 'Last Name',   placeholder: 'Smith' },
    { name: 'email',     label: 'Email',       type: 'email', placeholder: 'jane@example.com' },
    { name: 'phone',     label: 'Phone',       type: 'tel',   placeholder: '+44 7000 000000' },
    { name: 'address',   label: 'Address',     placeholder: '12 High Street', span: true },
    { name: 'city',      label: 'City',        placeholder: 'London' },
    { name: 'postcode',  label: 'Postcode',    placeholder: 'E1 7PT' },
  ]

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Account Details</h1>
          <p className="text-white/40 text-sm mt-1">View and update your personal information</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 bg-orange-500 text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-orange-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {/* Avatar card */}
      {saved && (
        <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center text-black text-xl font-bold shrink-0">
            {saved.firstName.charAt(0)}{saved.lastName.charAt(0)}
          </div>
          <div>
            <p className="text-base font-semibold text-white">{saved.firstName} {saved.lastName}</p>
            <p className="text-sm text-white/40 mt-0.5">{saved.email}</p>
            <span className="inline-block mt-1.5 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-medium">
              Verified Account
            </span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <span className="text-emerald-400">✓</span>
          <p className="text-sm font-medium text-emerald-400">Account details updated successfully.</p>
        </div>
      )}

      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6">
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {fields.map(({ name, label, type = 'text', placeholder, span }) => (
              <div key={name} className={span ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-2">{label}</label>
                {editing ? (
                  <input
                    type={type} name={name} value={form[name]} onChange={handleChange} required placeholder={placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                ) : (
                  <div className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-white/70">
                    {saved?.[name] || <span className="text-white/20 italic">Not set</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <div className="flex gap-3 mt-6">
              <button type="submit" className="bg-orange-500 text-black font-semibold px-6 py-2.5 rounded-xl hover:bg-orange-400 transition-colors text-sm">
                Save Changes
              </button>
              <button type="button" onClick={handleCancel} className="border border-white/10 text-white/50 font-medium px-6 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm">
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/AccountDetails.tsx
git commit -m "feat: connect AccountDetails page to REST API"
```

---

## Task 17: BankDetails page — replace store with API

**Files:**
- Modify: `src/pages/BankDetails.tsx`

- [ ] **Step 1: Replace src/pages/BankDetails.tsx**

```tsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Account } from '../types'

const ACCOUNT_TYPE = 'Personal Current Account'
const CURRENCY = 'GBP'

export default function BankDetails() {
  const [account, setAccount] = useState<Account | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    api.getAccount().then(setAccount).catch(() => {})
  }, [])

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const rows = account ? [
    { label: 'Account Number', value: account.accountNumber,                      key: 'acc',  mono: true  },
    { label: 'Sort Code',      value: account.sortCode,                            key: 'sort', mono: true  },
    { label: 'IBAN',           value: account.iban,                                key: 'iban', mono: true  },
    { label: 'BIC / SWIFT',    value: account.bic,                                 key: 'bic',  mono: true  },
    { label: 'Account Type',   value: ACCOUNT_TYPE,                                key: 'type', mono: false },
    { label: 'Currency',       value: CURRENCY,                                    key: 'cur',  mono: false },
    { label: 'Account Holder', value: `${account.firstName} ${account.lastName}`,  key: 'name', mono: false },
  ] : []

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold text-white">Bank Details</h1>
        <p className="text-white/40 text-sm mt-1">Your account information for receiving payments</p>
      </div>

      {/* Card visual */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-white/30 text-xs font-medium uppercase tracking-widest">Bartho Bank</p>
              <p className="text-white font-semibold mt-1">{account ? `${account.firstName} ${account.lastName}` : '—'}</p>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold">B</span>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-white/30 text-xs mb-1">Account Number</p>
            <p className="font-mono text-white text-2xl tracking-[0.2em]">
              {account ? account.accountNumber.replace(/(.{4})/g, '$1 ').trim() : '•••• ••••'}
            </p>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-white/30 text-xs mb-0.5">Sort Code</p>
              <p className="font-mono text-white text-sm">{account?.sortCode ?? '——'}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs mb-0.5">Currency</p>
              <p className="font-mono text-white text-sm">{CURRENCY}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details table */}
      <div className="bg-white/[0.04] backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold text-white text-sm">Full Account Details</h2>
          <p className="text-xs text-white/20 mt-0.5">Tap any row to copy</p>
        </div>
        <ul>
          {rows.map(({ label, value, key, mono }, i) => (
            <li key={key} className={i < rows.length - 1 ? 'border-b border-white/[0.04]' : ''}>
              <button
                onClick={() => copy(value, key)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors text-left group"
              >
                <div>
                  <p className="text-xs text-white/30 font-medium uppercase tracking-wide">{label}</p>
                  <p className={`text-sm text-white mt-0.5 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
                </div>
                <div className="shrink-0 ml-4">
                  {copied === key ? (
                    <span className="text-xs text-orange-400 font-medium bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg">Copied!</span>
                  ) : (
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 text-sm text-white/30">
        <strong className="text-white/50">Receiving payments?</strong> Share your account number and sort code for UK transfers, or your IBAN and BIC for international payments.
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/BankDetails.tsx
git commit -m "feat: connect BankDetails page to REST API"
```

---

## Task 18: Layout — add logout button

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Add logout button to the header in src/components/Layout.tsx**

Replace the `<header>` block (lines 14–25 in the original file) with the version below. Everything else in the file stays the same.

Find this block:
```tsx
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">B</span>
            </div>
            <span className="text-white text-lg font-semibold tracking-tight">Bartho Bank</span>
          </div>
          <span className="text-white/30 text-xs hidden sm:block uppercase tracking-widest">Personal Banking</span>
        </div>
      </header>
```

Replace with:
```tsx
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">B</span>
            </div>
            <span className="text-white text-lg font-semibold tracking-tight">Bartho Bank</span>
          </div>
          <button
            onClick={() => { clearToken(); navigate('/login') }}
            className="text-white/30 text-xs hover:text-white/60 transition-colors uppercase tracking-widest"
          >
            Log out
          </button>
        </div>
      </header>
```

- [ ] **Step 2: Add the imports for clearToken and useNavigate at the top of Layout.tsx**

Add these imports after the existing import line:
```tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearToken } from '../lib/api'
```

And inside the `Layout` component function, add before the `return`:
```tsx
  const navigate = useNavigate()
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "feat: add logout button to Layout header"
```

---

## Task 19: Delete store.ts and add environment files

**Files:**
- Delete: `src/data/store.ts`
- Create: `.env.example` (frontend root)

- [ ] **Step 1: Verify the build compiles without store.ts**

First check no files still import from store:
```bash
grep -r "from '../data/store'" src/
grep -r "from './data/store'" src/
```

Expected: No output (zero matches). If any matches appear, update those files to import from `../types` or `../lib/api` instead before proceeding.

- [ ] **Step 2: Delete src/data/store.ts**

```bash
rm "src/data/store.ts"
```

- [ ] **Step 3: Run the frontend build to confirm no TypeScript errors**

```bash
npm run build
```

Expected: Build succeeds with no errors. If errors appear, fix the broken import before continuing.

- [ ] **Step 4: Create .env.example for the frontend**

Create `.env.example` in the repo root:
```
VITE_API_URL=http://localhost:3001
```

- [ ] **Step 5: Update root .gitignore to exclude .env**

Ensure `.gitignore` in the repo root includes:
```
.env
server/.env
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove in-memory store, frontend now powered by REST API"
```

---

## Deployment

After all tasks are complete, deploy to Railway and update Vercel.

### Railway setup

1. Go to [railway.app](https://railway.app) and create a new project
2. Add a **PostgreSQL** service — Railway provisions the database and sets `DATABASE_URL` automatically
3. Add a **Node.js** service from GitHub, pointing to the `server` folder
4. In the Node.js service settings set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build && npx prisma migrate deploy`
   - **Start Command:** `npm start`
5. Add environment variables in the Railway service dashboard:
   ```
   JWT_SECRET=<generate a random 32-char string>
   CORS_ORIGIN=https://your-app.vercel.app
   ```
6. Deploy — Railway will give you a public URL like `https://bartho-bank-api-xxx.railway.app`

### Vercel update

1. Go to your Vercel project settings → Environment Variables
2. Add:
   ```
   VITE_API_URL=https://bartho-bank-api-xxx.railway.app
   ```
3. Redeploy the frontend

### Verify end to end

1. Visit the Vercel URL — you should be redirected to `/login`
2. Register a new account
3. Dashboard shows seeded transactions and balance
4. Transfer, spending, account details, bank details all work
5. Log out returns to `/login`
