import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { currentUser, requireUser, HttpError } from '@/lib/auth'
import { ok, fail, handleError } from '@/lib/api'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return fail(401, '未登入')
    return ok(user)
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const me = await requireUser()
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.email === 'string' && body.email.trim()) {
      const lower = body.email.toLowerCase()
      const exists = await prisma.user.findFirst({ where: { email: lower, NOT: { id: me.id } } })
      if (exists) throw new HttpError(409, '此電子郵件已被使用')
      data.email = lower
    }
    const updated = await prisma.user.update({
      where: { id: me.id },
      data,
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    })
    return ok(updated)
  } catch (err) {
    return handleError(err)
  }
}
