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
