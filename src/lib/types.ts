export type User = {
  id: string
  email: string
  name: string
  role: string
  status: string
  createdAt: string
}

export type Project = {
  id: string
  name: string
  description: string
  status: string
  ownerId: string
  createdAt: string
  members: string[]
}

export type StreamSession = {
  id: string
  name: string
  host: string
  port: number
  signalingPath: string
  secure: boolean
  description: string
  status: string
  ownerId: string
  createdAt: string
  lastConnectedAt: string | null
}
