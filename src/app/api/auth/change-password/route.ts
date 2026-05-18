import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, requireUser, verifyPassword, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser()
    const { oldPassword, newPassword } = await req.json()
    if (!oldPassword || !newPassword) throw new HttpError(400, '參數不完整')
    if (newPassword.length < 6) throw new HttpError(400, '新密碼至少 6 字元')

    const user = await prisma.user.findUnique({ where: { id: me.id } })
    if (!user) throw new HttpError(404, '找不到使用者')

    const valid = await verifyPassword(oldPassword, user.password)
    if (!valid) throw new HttpError(400, '目前密碼不正確')

    await prisma.user.update({
      where: { id: me.id },
      data: { password: await hashPassword(newPassword) },
    })

    return ok({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
