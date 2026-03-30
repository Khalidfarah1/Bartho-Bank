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
