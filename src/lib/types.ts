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
  signalingServer: string
  signalingPort: number
  mediaServer: string
  mediaPort: number
  width: number
  height: number
  fps: number
  streamType: 'local' | 'stream'
  description: string
  status: string
  ownerId: string
  createdAt: string
  lastConnectedAt: string | null
}
