const SESSIONS_KEY = 'omniverseweb.sessions'
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

function load() {
  const raw = localStorage.getItem(SESSIONS_KEY)
  if (raw) return JSON.parse(raw)
  const seed = [
    {
      id: 's-001',
      name: 'Local Kit Stream',
      host: '127.0.0.1',
      port: 49100,
      signalingPath: '/signaling/client',
      description: '本機 Omniverse Kit App Streaming 測試 session。',
      status: 'idle',
      ownerId: 'u-admin',
      createdAt: new Date().toISOString(),
      lastConnectedAt: null,
    },
  ]
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(seed))
  return seed
}

function save(list) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(list))
}

export async function listSessions(userId, { isAdmin } = {}) {
  await delay()
  const all = load()
  if (isAdmin) return all
  return all.filter((s) => s.ownerId === userId)
}

export async function getSession(id) {
  await delay()
  const s = load().find((x) => x.id === id)
  if (!s) throw new Error('找不到 session')
  return s
}

export async function createSession(payload, ownerId) {
  await delay()
  const all = load()
  const newSession = {
    id: `s-${Date.now()}`,
    status: 'idle',
    ownerId,
    createdAt: new Date().toISOString(),
    lastConnectedAt: null,
    signalingPath: '/signaling/client',
    ...payload,
  }
  all.push(newSession)
  save(all)
  return newSession
}

export async function updateSession(id, updates) {
  await delay()
  const all = load()
  const idx = all.findIndex((s) => s.id === id)
  if (idx === -1) throw new Error('找不到 session')
  all[idx] = { ...all[idx], ...updates }
  save(all)
  return all[idx]
}

export async function deleteSession(id) {
  await delay()
  save(load().filter((s) => s.id !== id))
  return { ok: true }
}

export async function touchSessionConnected(id) {
  return updateSession(id, { lastConnectedAt: new Date().toISOString() })
}
