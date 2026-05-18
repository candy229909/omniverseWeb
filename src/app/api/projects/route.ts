import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, HttpError } from '@/lib/auth'
import { ok, handleError } from '@/lib/api'

export async function GET() {
  try {
    const me = await requireUser()
    const projects = await prisma.project.findMany({
      where: me.role === 'admin'
        ? {}
        : {
            OR: [
              { ownerId: me.id },
              { members: { some: { userId: me.id } } },
            ],
          },
      include: { members: { select: { userId: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return ok(projects.map(serialize))
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await requireUser()
    const { name, description, status } = await req.json()
    if (!name) throw new HttpError(400, '專案名稱不可為空')
    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        status: status || 'planning',
        ownerId: me.id,
        members: { create: [{ userId: me.id }] },
      },
      include: { members: { select: { userId: true } } },
    })
    return ok(serialize(project))
  } catch (err) {
    return handleError(err)
  }
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
