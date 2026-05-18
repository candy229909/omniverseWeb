import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import AppLayout from '@/components/AppLayout'

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/login')
  return <AppLayout>{children}</AppLayout>
}
