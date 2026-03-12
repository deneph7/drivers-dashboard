import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { StatusSelector } from '@/components/StatusSelector'
import type { DriverWithStatus } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminDriverPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') redirect('/dashboard')

  const { data: driverStatus } = await supabase
    .from('driver_status')
    .select(`
      *,
      profiles!driver_status_driver_id_fkey (
        id, name, initial, role, recent_vehicles, sort_order, created_at
      )
    `)
    .eq('driver_id', id)
    .single()

  if (!driverStatus) notFound()

  const driverData = driverStatus as unknown as DriverWithStatus

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
              ← Dashboard
            </a>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {driverData.profiles.initial}
          </h1>
          <p className="text-sm text-gray-500">
            {driverData.profiles.name} — Admin override
          </p>
        </div>

        {/* Status Selector (재사용) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <StatusSelector driverData={driverData} currentUserId={user.id} />
        </div>
      </div>
    </div>
  )
}
