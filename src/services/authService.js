// Mock auth + storage layer. Replace with real API calls when backend is ready.

const USERS_KEY = 'omniverseweb.users'
const RESET_KEY = 'omniverseweb.resetTokens'

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

function loadUsers() {
  const raw = localStorage.getItem(USERS_KEY)
  if (raw) return JSON.parse(raw)
  const seed = [
    {
      id: 'u-admin',
      email: 'admin@omniverse.web',
      password: 'admin123',
      name: 'Administrator',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'u-demo',
      email: 'demo@omniverse.web',
      password: 'demo1234',
      name: 'Demo User',
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ]
  localStorage.setItem(USERS_KEY, JSON.stringify(seed))
  return seed
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function publicUser(u) {
  if (!u) return null
  const { password, ...rest } = u
  return rest
}

export async function login(email, password) {
  await delay()
  const users = loadUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user || user.password !== password) {
    throw new Error('帳號或密碼錯誤')
  }
  if (user.status === 'disabled') {
    throw new Error('此帳號已被停用，請聯絡管理員')
  }
  return publicUser(user)
}

export async function register({ email, password, name }) {
  await delay()
  const users = loadUsers()
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('此電子郵件已被註冊')
  }
  const newUser = {
    id: `u-${Date.now()}`,
    email,
    password,
    name: name || email.split('@')[0],
    role: 'user',
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  saveUsers(users)
  return publicUser(newUser)
}

export async function requestPasswordReset(email) {
  await delay()
  const users = loadUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  // Don't reveal user existence — but here we return token for demo purposes.
  if (!user) return { sent: true }
  const token = Math.random().toString(36).slice(2, 10).toUpperCase()
  const tokens = JSON.parse(localStorage.getItem(RESET_KEY) || '{}')
  tokens[token] = { userId: user.id, expiresAt: Date.now() + 1000 * 60 * 30 }
  localStorage.setItem(RESET_KEY, JSON.stringify(tokens))
  return { sent: true, token } // In real API, token would be emailed.
}

export async function resetPassword(token, newPassword) {
  await delay()
  const tokens = JSON.parse(localStorage.getItem(RESET_KEY) || '{}')
  const entry = tokens[token]
  if (!entry || entry.expiresAt < Date.now()) {
    throw new Error('重設連結無效或已過期')
  }
  const users = loadUsers()
  const idx = users.findIndex((u) => u.id === entry.userId)
  if (idx === -1) throw new Error('找不到使用者')
  users[idx].password = newPassword
  saveUsers(users)
  delete tokens[token]
  localStorage.setItem(RESET_KEY, JSON.stringify(tokens))
  return { ok: true }
}

export async function updateProfile(userId, updates) {
  await delay()
  const users = loadUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) throw new Error('找不到使用者')
  users[idx] = { ...users[idx], ...updates }
  saveUsers(users)
  return publicUser(users[idx])
}

export async function changePassword(userId, oldPwd, newPwd) {
  await delay()
  const users = loadUsers()
  const idx = users.findIndex((u) => u.id === userId)
  if (idx === -1) throw new Error('找不到使用者')
  if (users[idx].password !== oldPwd) throw new Error('目前密碼不正確')
  users[idx].password = newPwd
  saveUsers(users)
  return { ok: true }
}

// Admin user management
export async function listUsers() {
  await delay()
  return loadUsers().map(publicUser)
}

export async function createUser(payload) {
  await delay()
  const users = loadUsers()
  if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
    throw new Error('此電子郵件已存在')
  }
  const newUser = {
    id: `u-${Date.now()}`,
    status: 'active',
    role: 'user',
    createdAt: new Date().toISOString(),
    ...payload,
  }
  users.push(newUser)
  saveUsers(users)
  return publicUser(newUser)
}

export async function updateUser(id, updates) {
  await delay()
  const users = loadUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) throw new Error('找不到使用者')
  users[idx] = { ...users[idx], ...updates }
  saveUsers(users)
  return publicUser(users[idx])
}

export async function deleteUser(id) {
  await delay()
  const users = loadUsers().filter((u) => u.id !== id)
  saveUsers(users)
  return { ok: true }
}
