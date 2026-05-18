import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

async function loadOrThrow(id: string) {
  const s = await prisma.streamSession.findUnique({ where: { id } })
  if (!s) throw new HttpError(404, '找不到 session')
  return s
}

function validatePort(value: unknown, label: string) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0 || n > 65535) {
    throw new HttpError(400, `${label} 必須為 1-65535 之間的整數`)
  }
  return n
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
    if (typeof body.signalingServer === 'string') data.signalingServer = body.signalingServer
    if (typeof body.mediaServer === 'string') data.mediaServer = body.mediaServer
    if (body.signalingPort !== undefined) data.signalingPort = validatePort(body.signalingPort, 'Signaling port')
    if (body.mediaPort !== undefined) data.mediaPort = validatePort(body.mediaPort, 'Media port')
    if (body.width !== undefined) data.width = Number(body.width) || 1920
    if (body.height !== undefined) data.height = Number(body.height) || 1080
    if (body.fps !== undefined) data.fps = Number(body.fps) || 60
    if (body.streamType === 'local' || body.streamType === 'stream') data.streamType = body.streamType
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
