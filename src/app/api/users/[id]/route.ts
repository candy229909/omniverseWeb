import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, requireAdmin, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string') data.name = body.name
    if (typeof body.email === 'string') data.email = body.email.toLowerCase()
    if (body.role === 'admin' || body.role === 'user') data.role = body.role
    if (body.status === 'active' || body.status === 'disabled') data.status = body.status
    if (typeof body.password === 'string' && body.password.length > 0) {
      if (body.password.length < 6) throw new HttpError(400, '密碼至少 6 字元')
      data.password = await hashPassword(body.password)
    }
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    })
    return ok(user)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = await requireAdmin()
    if (me.id === params.id) throw new HttpError(400, '無法刪除自己的帳號')
    await prisma.user.delete({ where: { id: params.id } })
    return ok({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
