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
