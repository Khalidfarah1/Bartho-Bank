import request from 'supertest'
import express from 'express'

// Build a minimal app for testing — do NOT import from ../app
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
