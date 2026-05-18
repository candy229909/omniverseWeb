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

function validatePort(value: unknown, label: string) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0 || n > 65535) {
    throw new HttpError(400, `${label} 必須為 1-65535 之間的整數`)
  }
  return n
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser()
    const body = await req.json()
    const { name, signalingServer, signalingPort, mediaServer, mediaPort, width, height, fps, streamType, description } = body
    if (!name?.trim()) throw new HttpError(400, 'Session 名稱不可為空')
    if (!signalingServer?.trim()) throw new HttpError(400, 'Signaling server 不可為空')

    const sigPort = validatePort(signalingPort, 'Signaling port')
    const finalMediaServer = (mediaServer && String(mediaServer).trim()) || signalingServer
    const mediaPortNum = mediaPort != null && mediaPort !== '' ? validatePort(mediaPort, 'Media port') : sigPort

    const session = await prisma.streamSession.create({
      data: {
        name,
        signalingServer,
        signalingPort: sigPort,
        mediaServer: finalMediaServer,
        mediaPort: mediaPortNum,
        width: Number(width) || 1920,
        height: Number(height) || 1080,
        fps: Number(fps) || 60,
        streamType: streamType === 'stream' ? 'stream' : 'local',
        description: description || '',
        ownerId: me.id,
      },
    })
    return ok(session)
  } catch (err) {
    return handleError(err)
  }
}
