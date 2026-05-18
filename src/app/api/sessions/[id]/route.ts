import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

async function loadOrThrow(id: string) {
  const s = await prisma.streamSession.findUnique({ where: { id } })
  if (!s) throw new HttpError(404, '找不到 session')
  return s
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = await requireUser()
    const s = await loadOrThrow(params.id)
    if (me.role !== 'admin' && s.ownerId !== me.id) throw new HttpError(403, '無權限')
    return ok(s)
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = await requireUser()
    const s = await loadOrThrow(params.id)
    if (me.role !== 'admin' && s.ownerId !== me.id) throw new HttpError(403, '無權限')
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string') data.name = body.name
    if (typeof body.host === 'string') data.host = body.host
    if (body.port !== undefined) {
      const portNum = Number(body.port)
      if (!Number.isInteger(portNum) || portNum <= 0 || portNum > 65535) {
        throw new HttpError(400, 'Port 必須為 1-65535 之間的整數')
      }
      data.port = portNum
    }
    if (typeof body.signalingPath === 'string') data.signalingPath = body.signalingPath
    if (typeof body.secure === 'boolean') data.secure = body.secure
    if (typeof body.description === 'string') data.description = body.description
    if (typeof body.status === 'string') data.status = body.status
    if (body.lastConnectedAt === 'now') data.lastConnectedAt = new Date()

    const updated = await prisma.streamSession.update({ where: { id: s.id }, data })
    return ok(updated)
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = await requireUser()
    const s = await loadOrThrow(params.id)
    if (me.role !== 'admin' && s.ownerId !== me.id) throw new HttpError(403, '無權限')
    await prisma.streamSession.delete({ where: { id: s.id } })
    return ok({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
