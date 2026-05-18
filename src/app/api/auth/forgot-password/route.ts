import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import { ok, handleError } from '@/lib/api'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return ok({ sent: true })

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
    if (!user) return ok({ sent: true })

    const token = randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30) // 30 min

    await prisma.resetToken.create({
      data: { token, userId: user.id, expiresAt },
    })

    // Demo: 把 token 直接回傳，正式環境應寄信而不回傳
    const exposeToken = process.env.NODE_ENV !== 'production'
    return ok({ sent: true, ...(exposeToken ? { token } : {}) })
  } catch (err) {
    return handleError(err)
  }
}
