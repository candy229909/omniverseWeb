import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, requireAdmin, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    await requireAdmin()
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    return ok(users)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { email, name, password, role, status } = await req.json()
    if (!email || !password || !name) throw new HttpError(400, '必填欄位不完整')
    if (password.length < 6) throw new HttpError(400, '密碼至少 6 字元')

    const lower = String(email).toLowerCase()
    const exists = await prisma.user.findUnique({ where: { email: lower } })
    if (exists) throw new HttpError(409, '此電子郵件已存在')

    const user = await prisma.user.create({
      data: {
        email: lower,
        name,
        password: await hashPassword(password),
        role: role === 'admin' ? 'admin' : 'user',
        status: status === 'disabled' ? 'disabled' : 'active',
      },
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    })
    return ok(user)
  } catch (err) {
    return handleError(err)
  }
}
