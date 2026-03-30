import { Router, Request, Response } from 'express'
import { authenticate, AuthenticatedRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const transactionsRouter = Router()

transactionsRouter.get('/transactions', authenticate, async (req: Request, res: Response) => {
  const { userId } = req as AuthenticatedRequest
  try {
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
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
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
  if (reference !== undefined) {
    if (typeof reference !== 'string') {
      res.status(400).json({ error: 'reference must be a string' })
      return
    }
    if (reference.length > 35) {
      res.status(400).json({ error: 'reference must be 35 characters or fewer' })
      return
    }
  }

  try {
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
  } catch {
    res.status(500).json({ error: 'Internal server error' })
  }
})
