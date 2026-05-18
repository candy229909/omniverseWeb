import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

async function loadOrThrow(id: string) {
  const p = await prisma.project.findUnique({
    where: { id },
    include: { members: { select: { userId: true } } },
  })
  if (!p) throw new HttpError(404, '找不到專案')
  return p
}

function serialize(p: { id: string; name: string; description: string; status: string; ownerId: string; createdAt: Date; members: { userId: string }[] }) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    ownerId: p.ownerId,
    createdAt: p.createdAt,
    members: p.members.map((m) => m.userId),
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = await requireUser()
    const p = await loadOrThrow(params.id)
    const allowed =
      me.role === 'admin' || p.ownerId === me.id || p.members.some((m) => m.userId === me.id)
    if (!allowed) throw new HttpError(403, '無權限存取此專案')
    return ok(serialize(p))
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = await requireUser()
    const p = await loadOrThrow(params.id)
    if (me.role !== 'admin' && p.ownerId !== me.id) {
      throw new HttpError(403, '只有管理員或專案擁有者可編輯')
    }
    const body = await req.json()
    const updates: Record<string, unknown> = {}
    if (typeof body.name === 'string') updates.name = body.name
    if (typeof body.description === 'string') updates.description = body.description
    if (typeof body.status === 'string') updates.status = body.status

    if (Array.isArray(body.members)) {
      // 同步成員清單
      const currentIds = new Set(p.members.map((m) => m.userId))
      const nextIds = new Set<string>(body.members)
      const toAdd = [...nextIds].filter((id) => !currentIds.has(id))
      const toRemove = [...currentIds].filter((id) => !nextIds.has(id))
      await prisma.$transaction([
        ...(toAdd.length
          ? [prisma.projectMember.createMany({ data: toAdd.map((userId) => ({ projectId: p.id, userId })) })]
          : []),
        ...(toRemove.length
          ? [prisma.projectMember.deleteMany({ where: { projectId: p.id, userId: { in: toRemove } } })]
          : []),
      ])
    }

    const updated = await prisma.project.update({
      where: { id: p.id },
      data: updates,
      include: { members: { select: { userId: true } } },
    })
    return ok(serialize(updated))
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = await requireUser()
    const p = await loadOrThrow(params.id)
    if (me.role !== 'admin' && p.ownerId !== me.id) {
      throw new HttpError(403, '只有管理員或專案擁有者可刪除')
    }
    await prisma.project.delete({ where: { id: p.id } })
    return ok({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
