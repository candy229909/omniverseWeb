import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPwd = await bcrypt.hash('admin123', 10)
  const demoPwd = await bcrypt.hash('demo1234', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@omniverse.web' },
    update: {},
    create: {
      email: 'admin@omniverse.web',
      name: 'Administrator',
      password: adminPwd,
      role: 'admin',
    },
  })

  const demo = await prisma.user.upsert({
    where: { email: 'demo@omniverse.web' },
    update: {},
    create: {
      email: 'demo@omniverse.web',
      name: 'Demo User',
      password: demoPwd,
      role: 'user',
    },
  })

  const projectCount = await prisma.project.count()
  if (projectCount === 0) {
    const p1 = await prisma.project.create({
      data: {
        name: 'Digital Twin Factory',
        description: '工廠數位孿生模擬專案，整合 IoT 即時資料。',
        status: 'active',
        ownerId: admin.id,
      },
    })
    await prisma.projectMember.createMany({
      data: [
        { projectId: p1.id, userId: admin.id },
        { projectId: p1.id, userId: demo.id },
      ],
    })

    const p2 = await prisma.project.create({
      data: {
        name: 'AR Showroom',
        description: 'AR 虛擬展示間，提供互動產品瀏覽體驗。',
        status: 'planning',
        ownerId: demo.id,
      },
    })
    await prisma.projectMember.create({
      data: { projectId: p2.id, userId: demo.id },
    })
  }

  const sessionCount = await prisma.streamSession.count()
  if (sessionCount === 0) {
    await prisma.streamSession.create({
      data: {
        name: 'Local Kit Stream',
        host: '127.0.0.1',
        port: 49100,
        signalingPath: '/signaling/client',
        description: '本機 Omniverse Kit App Streaming 測試 session。',
        ownerId: admin.id,
      },
    })
  }

  console.log('Seed completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
