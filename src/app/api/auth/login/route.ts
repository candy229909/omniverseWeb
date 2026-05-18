import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createSessionCookie, verifyPassword, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) throw new HttpError(400, 'Email 與密碼為必填')

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) throw new HttpError(401, '帳號或密碼錯誤')
    if (user.status === 'disabled') throw new HttpError(403, '此帳號已被停用，請聯絡管理員')

    const valid = await verifyPassword(password, user.password)
    if (!valid) throw new HttpError(401, '帳號或密碼錯誤')

    await createSessionCookie({ userId: user.id, role: user.role as 'user' | 'admin' })

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
