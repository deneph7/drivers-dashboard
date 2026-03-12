'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { DriverCard } from './DriverCard'
import { Clock } from './Clock'
import { TrafficLight } from './TrafficLight'
import type { DriverWithStatus, UserRole } from '@/lib/types'

interface Props {
  initialDrivers: DriverWithStatus[]
  viewerRole: UserRole
  userInitial: string
  onLogout: () => void
}

export function DashboardClient({ initialDrivers, viewerRole, userInitial, onLogout }: Props) {
  const [drivers, setDrivers] = useState<DriverWithStatus[]>(initialDrivers)
  const supabase = createClient()

  useEffect(() => {
    async function loadDrivers() {
      const { data } = await supabase
        .from('driver_status')
        .select(`
          *,
          profiles!driver_status_driver_id_fkey (
            id, name, initial, role, recent_vehicles, sort_order, created_at
          )
        `)

      if (!data) return

      // sort_order ASC (null last), 이름 알파벳순 fallback
      const sorted = (data as unknown as DriverWithStatus[]).sort((a, b) => {
        const ao = a.profiles.sort_order
        const bo = b.profiles.sort_order
        if (ao === null && bo === null) return a.profiles.name.localeCompare(b.profiles.name)
        if (ao === null) return 1
        if (bo === null) return -1
        return ao - bo
      })

      setDrivers(sorted)
    }

    // Realtime 구독
    const channel = supabase
      .channel('dashboard-driver-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_status' },
        () => loadDrivers()
      )
      .subscribe()

    // 폴백: 30초 주기 폴링
    const poll = setInterval(loadDrivers, 30_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [])

  const available = drivers.filter((d) => d.status === 'available').length
  const unavailable = drivers.filter((d) => d.status === 'unavailable').length
  const contact = drivers.filter((d) => d.status === 'contact').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 truncate">Driver Dashboard</h1>
            <Clock />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {viewerRole === 'driver' && (
              <a href="/driver" className="text-sm text-blue-600 hover:underline">
                My Status
              </a>
            )}
            {viewerRole === 'admin' && (
              <a href="/admin" className="text-sm text-blue-600 hover:underline">
                Admin
              </a>
            )}
            <span className="text-sm text-gray-500">{userInitial}</span>
            <button
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="flex gap-4 flex-wrap">
          {[
            { status: 'available' as const, count: available, label: 'Available' },
            { status: 'unavailable' as const, count: unavailable, label: 'Unavailable' },
            { status: 'contact' as const, count: contact, label: 'Contact' },
          ].map(({ status, count, label }) => (
            <div key={status} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
              <TrafficLight status={status} size="sm" />
              <span className="text-sm text-gray-600">{label}</span>
              <span className="text-sm font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>

        {/* Driver Grid */}
        {drivers.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No drivers found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver) => (
              <DriverCard
                key={driver.driver_id}
                driver={driver}
                viewerRole={viewerRole}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex gap-4 flex-wrap pt-2">
          <p className="text-xs text-gray-400 w-full">Legend</p>
          {[
            { status: 'available' as const, label: 'Available — Ready to dispatch' },
            { status: 'unavailable' as const, label: 'Unavailable — On duty' },
            { status: 'contact' as const, label: 'Contact needed — Status unknown' },
          ].map(({ status, label }) => (
            <div key={status} className="flex items-center gap-1.5">
              <TrafficLight status={status} size="sm" />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
