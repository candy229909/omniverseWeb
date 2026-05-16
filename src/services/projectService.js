const PROJECTS_KEY = 'omniverseweb.projects'
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

function load() {
  const raw = localStorage.getItem(PROJECTS_KEY)
  if (raw) return JSON.parse(raw)
  const seed = [
    {
      id: 'p-001',
      name: 'Digital Twin Factory',
      description: '工廠數位孿生模擬專案，整合 IoT 即時資料。',
      status: 'active',
      members: ['u-admin', 'u-demo'],
      ownerId: 'u-admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-002',
      name: 'AR Showroom',
      description: 'AR 虛擬展示間，提供互動產品瀏覽體驗。',
      status: 'planning',
      members: ['u-demo'],
      ownerId: 'u-demo',
      createdAt: new Date().toISOString(),
    },
  ]
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(seed))
  return seed
}

function save(list) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(list))
}

export async function listProjects(userId, { isAdmin } = {}) {
  await delay()
  const all = load()
  if (isAdmin) return all
  return all.filter((p) => p.ownerId === userId || p.members.includes(userId))
}

export async function getProject(id) {
  await delay()
  const p = load().find((x) => x.id === id)
  if (!p) throw new Error('找不到專案')
  return p
}

export async function createProject(payload, ownerId) {
  await delay()
  const all = load()
  const newProject = {
    id: `p-${Date.now()}`,
    status: 'planning',
    members: [ownerId],
    ownerId,
    createdAt: new Date().toISOString(),
    ...payload,
  }
  all.push(newProject)
  save(all)
  return newProject
}

export async function updateProject(id, updates) {
  await delay()
  const all = load()
  const idx = all.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error('找不到專案')
  all[idx] = { ...all[idx], ...updates }
  save(all)
  return all[idx]
}

export async function deleteProject(id) {
  await delay()
  save(load().filter((p) => p.id !== id))
  return { ok: true }
}
