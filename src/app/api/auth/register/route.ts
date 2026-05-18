import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createSessionCookie, hashPassword, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password) throw new HttpError(400, 'Email 與密碼為必填')
    if (password.length < 6) throw new HttpError(400, '密碼長度至少 6 字元')

    const lower = String(email).toLowerCase()
    const exists = await prisma.user.findUnique({ where: { email: lower } })
    if (exists) throw new HttpError(409, '此電子郵件已被註冊')

    const user = await prisma.user.create({
      data: {
        email: lower,
        name: name || lower.split('@')[0],
        password: await hashPassword(password),
        role: 'user',
      },
    })

    await createSessionCookie({ userId: user.id, role: 'user' })

    return ok({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    })
  } catch (err) {
    return handleError(err)
  }
}
