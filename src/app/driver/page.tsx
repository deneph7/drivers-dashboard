import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { StatusSelector } from '@/components/StatusSelector'
import type { DriverWithStatus } from '@/lib/types'

export default async function DriverPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: driverStatus } = await supabase
    .from('driver_status')
    .select(`
      *,
      profiles!driver_status_driver_id_fkey (
        id, name, initial, role, recent_vehicles, sort_order, created_at
      )
    `)
    .eq('driver_id', user.id)
    .single()

  if (!driverStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Driver profile not found. Please contact admin.</p>
      </div>
    )
  }

  const driverData = driverStatus as unknown as DriverWithStatus

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {driverData.profiles.initial}
          </h1>
          <p className="text-sm text-gray-500">{driverData.profiles.name}</p>
        </div>

        {/* Status Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <StatusSelector driverData={driverData} currentUserId={user.id} />
        </div>

        {/* Dashboard Link */}
        <div className="text-center">
          <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
            View Dashboard →
          </a>
        </div>
      </div>
    </div>
  )
}
