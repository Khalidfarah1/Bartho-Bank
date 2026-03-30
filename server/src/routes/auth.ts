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
