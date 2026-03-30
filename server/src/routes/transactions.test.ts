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
