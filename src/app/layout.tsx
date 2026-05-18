import './globals.css'
import { ReactNode } from 'react'
import { currentUser } from '@/lib/auth'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'OmniverseWeb',
  description: 'Omniverse Kit App Streaming 管理介面',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()
  return (
    <html lang="zh-TW">
      <body>
        <AuthProvider initialUser={user ? JSON.parse(JSON.stringify(user)) : null}>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
