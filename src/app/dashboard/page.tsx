import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DashboardClient } from '@/components/DashboardClient'
import type { DriverWithStatus } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, initial')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // driver_status + profiles JOIN, sort_order 기준 정렬
  const { data: drivers } = await supabase
    .from('driver_status')
    .select(`
      *,
      profiles!driver_status_driver_id_fkey (
        id, name, initial, role, recent_vehicles, sort_order, created_at
      )
    `)

  const sorted = ((drivers ?? []) as unknown as DriverWithStatus[]).sort((a, b) => {
    const ao = a.profiles.sort_order
    const bo = b.profiles.sort_order
    if (ao === null && bo === null) return a.profiles.name.localeCompare(b.profiles.name)
    if (ao === null) return 1
    if (bo === null) return -1
    return ao - bo
  })

  async function handleLogout() {
    'use server'
    const { createClient: createServerClient } = await import('@/lib/supabase-server')
    const sb = await createServerClient()
    await sb.auth.signOut()
    redirect('/login')
  }

  return (
    <DashboardClient
      initialDrivers={sorted}
      viewerRole={profile.role}
      userInitial={profile.initial}
      currentUserId={user.id}
      onLogout={handleLogout}
    />
  )
}
