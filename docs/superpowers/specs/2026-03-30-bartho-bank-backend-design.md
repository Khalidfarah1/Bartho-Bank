# Bartho Bank Backend Design

## Overview

Add a Node.js REST API backend to the existing Bartho Bank React frontend. Replace the in-memory `store.ts` with real persistence using PostgreSQL. Add JWT-based user authentication (register + login). Deploy the API on Railway alongside a hosted PostgreSQL database.

**Stack:** Express + TypeScript + Prisma + PostgreSQL + JWT
**Deployment:** Railway (API + database), Vercel (frontend, unchanged)
**Repo structure:** Monorepo — `/server` for the API, `/src` for the existing frontend

---

## Architecture

```
Bartho-Bank/
├── src/                        # React frontend (existing)
├── server/
│   ├── prisma/
│   │   └── schema.prisma       # DB schema
│   ├── src/
│   │   ├── index.ts            # Express entry point
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT verify middleware
│   │   ├── routes/
│   │   │   ├── auth.ts         # Register + login
│   │   │   ├── account.ts      # Get + update account
│   │   │   └── transactions.ts # List transactions + post transfer
│   │   └── lib/
│   │       └── prisma.ts       # Prisma client singleton
│   ├── package.json
│   └── tsconfig.json
└── package.json                # frontend (unchanged)
```

---

## Database Schema (Prisma)

```prisma
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

**On register:** An `Account` row is created automatically with generated bank details (8-digit account number, sort code `20-41-06`, IBAN, BIC) and seeded with 12 sample transactions so the dashboard is not empty on first login.

**Amount convention:** Negative = debit, positive = credit. Each transaction stores the running `balance` after it was applied.

**Valid categories:** `Income | Groceries | Subscriptions | Transport | Shopping | Dining | Bills | Transfer`

---

## API Endpoints

### Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/auth/register` | `{ email, password, firstName, lastName }` | `{ token }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token }` |

**Register validation:**
- `email` must be unique
- `password` min 8 characters, hashed with bcrypt (salt rounds: 10)
- `firstName`, `lastName` required, non-empty

**Login:** Returns 401 with `{ error: "Invalid credentials" }` if email not found or password wrong. Never reveal which.

### Account (auth required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/account` | — | `{ id, firstName, lastName, email, phone, address, city, postcode, accountNumber, sortCode, iban, bic, balance }` |
| PATCH | `/api/account` | `{ firstName?, lastName?, email?, phone?, address?, city?, postcode? }` | updated account object |

### Transactions (auth required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/transactions` | — | `Transaction[]` ordered by `createdAt` desc |
| POST | `/api/transfers` | `{ toName, toAccount, amount, reference? }` | new `Transaction` |

**Transfer validation:**
- `amount` > 0
- `amount` <= current balance
- `toAccount` exactly 8 digits
- `reference` max 35 characters (optional)
- Returns 400 with `{ error: "..." }` on failure

---

## Authentication

JWT tokens are signed with a `JWT_SECRET` environment variable. Token payload: `{ userId, iat, exp }`. Tokens expire after 7 days.

All protected routes use an `auth` middleware that:
1. Reads `Authorization: Bearer <token>` header
2. Verifies and decodes the JWT
3. Attaches `req.userId` for use in route handlers
4. Returns 401 if missing or invalid

---

## Frontend Changes

The following changes are made to the existing React frontend:

**Deleted:**
- `src/data/store.ts` — replaced entirely by API calls

**New files:**
- `src/lib/api.ts` — fetch wrapper that attaches `Authorization: Bearer <token>` header to every request, reads token from `localStorage` key `bartho_token`
- `src/pages/Login.tsx` — login form matching existing dark/orange design
- `src/pages/Register.tsx` — register form matching existing design

**Modified:**
- `src/App.tsx` — adds `/login` and `/register` routes; redirects unauthenticated users to `/login`
- `src/pages/Dashboard.tsx` — fetches account + transactions on mount via API
- `src/pages/Transfer.tsx` — posts to `/api/transfers`, refreshes balance/transactions on success
- `src/pages/Spending.tsx` — fetches transactions on mount
- `src/pages/AccountDetails.tsx` — fetches account on mount, patches on save
- `src/pages/BankDetails.tsx` — fetches account on mount

**Token lifecycle:**
- Stored in `localStorage` as `bartho_token` on login/register
- Cleared on logout
- Missing token → redirect to `/login`
- 401 response from any API call → clear token, redirect to `/login`

All existing UI, Tailwind classes, and visual design remain unchanged.

---

## Environment Variables

**Server (`server/.env`):**
```
DATABASE_URL=postgresql://...
JWT_SECRET=<random 32+ char string>
PORT=3001
```

**Frontend (`/.env`):**
```
VITE_API_URL=https://your-api.railway.app
```

In development, `VITE_API_URL=http://localhost:3001`.

---

## Deployment

- **API:** Deployed on Railway. Railway provisions the PostgreSQL database and the Node.js service in the same project. `DATABASE_URL` is injected automatically.
- **Frontend:** Deployed on Vercel (no change). `VITE_API_URL` set to the Railway API URL in Vercel environment variables.
- **Migrations:** Run `npx prisma migrate deploy` as part of the Railway build command.

---

## Error Handling

All endpoints return JSON errors in the shape `{ error: "message" }`. HTTP status codes:
- `400` — validation failure
- `401` — unauthenticated or wrong credentials
- `404` — resource not found
- `500` — unexpected server error

---

## Out of Scope

- Email verification
- Password reset
- Multi-account support (one account per user)
- Real money movement between users
- Rate limiting
- Refresh tokens
