import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

const COOKIE_NAME = 'omniverseweb_session'
const SESSION_TTL = 60 * 60 * 24 * 7 // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET 未設定或長度不足 32 字元')
  }
  return new TextEncoder().encode(secret)
}

export type SessionPayload = {
  userId: string
  role: 'user' | 'admin'
}

export type PublicUser = {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: Date
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(getSecret())

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL,
  })
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME)
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      userId: payload.userId as string,
      role: payload.role as 'user' | 'admin',
    }
  } catch {
    return null
  }
}

export async function currentUser(): Promise<PublicUser | null> {
  const session = await readSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
  })
  if (!user || user.status === 'disabled') return null
  return user
}

export async function requireUser(): Promise<PublicUser> {
  const user = await currentUser()
  if (!user) throw new HttpError(401, '未登入')
  return user
}

export async function requireAdmin(): Promise<PublicUser> {
  const user = await requireUser()
  if (user.role !== 'admin') throw new HttpError(403, '需要管理員權限')
  return user
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}
