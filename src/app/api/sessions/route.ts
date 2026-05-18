import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    const me = await requireUser()
    const sessions = await prisma.streamSession.findMany({
      where: me.role === 'admin' ? {} : { ownerId: me.id },
      orderBy: { createdAt: 'desc' },
    })
    return ok(sessions)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser()
    const { name, host, port, signalingPath, secure, description } = await req.json()
    if (!name?.trim()) throw new HttpError(400, 'Session 名稱不可為空')
    if (!host?.trim()) throw new HttpError(400, 'Host 不可為空')
    const portNum = Number(port)
    if (!Number.isInteger(portNum) || portNum <= 0 || portNum > 65535) {
      throw new HttpError(400, 'Port 必須為 1-65535 之間的整數')
    }
    const session = await prisma.streamSession.create({
      data: {
        name,
        host,
        port: portNum,
        signalingPath: signalingPath || '/signaling/client',
        secure: !!secure,
        description: description || '',
        ownerId: me.id,
      },
    })
    return ok(session)
  } catch (err) {
    return handleError(err)
  }
}
