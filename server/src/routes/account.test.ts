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
