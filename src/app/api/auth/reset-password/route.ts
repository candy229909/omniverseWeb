import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()
    if (!token || !newPassword) throw new HttpError(400, '參數不完整')
    if (newPassword.length < 6) throw new HttpError(400, '密碼至少 6 字元')

    const entry = await prisma.resetToken.findUnique({ where: { token } })
    if (!entry || entry.expiresAt < new Date()) {
      throw new HttpError(400, '重設連結無效或已過期')
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: entry.userId },
        data: { password: await hashPassword(newPassword) },
      }),
      prisma.resetToken.delete({ where: { token } }),
    ])

    return ok({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
