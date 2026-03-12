'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrafficLight } from './TrafficLight'
import { DelayBadge } from './DelayBadge'
import { formatKST, isDelayed, getCountdown } from '@/lib/utils'
import type { DriverWithStatus, UserRole } from '@/lib/types'

interface Props {
  driver: DriverWithStatus
  viewerRole: UserRole
  delayLabel?: string
  returnTimeLabel?: string
  countdownLabel?: string
}

export function DriverCard({
  driver,
  viewerRole,
  delayLabel = 'Overdue',
  returnTimeLabel = 'Return time',
  countdownLabel = 'Remaining',
}: Props) {
  const router = useRouter()
  const [delayed, setDelayed] = useState(false)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    function tick() {
      setDelayed(isDelayed(driver.return_time, driver.status))
      if (driver.status === 'unavailable' && driver.return_time) {
        setCountdown(getCountdown(driver.return_time))
      }
    }
    tick()
    const timer = setInterval(tick, 60_000)
    return () => clearInterval(timer)
  }, [driver.return_time, driver.status])

  const isClickable = viewerRole === 'admin'

  return (
    <div
      onClick={isClickable ? () => router.push(`/admin/driver/${driver.driver_id}`) : undefined}
      className={`
        bg-white rounded-xl border p-4 shadow-sm transition-shadow
        ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}
        ${delayed ? 'border-red-400' : 'border-gray-200'}
      `}
    >
      <div className="flex items-start gap-3">
        <TrafficLight status={driver.status} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl font-bold text-gray-900 leading-none">
              {driver.profiles.initial}
            </span>
            {delayed && <DelayBadge label={delayLabel} />}
          </div>
          {driver.vehicle_number && (
            <p className="mt-1 text-sm text-gray-500 truncate">{driver.vehicle_number}</p>
          )}
        </div>
      </div>

      {driver.status === 'unavailable' && driver.return_time && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-0.5">
          <p className="text-xs text-gray-500">
            {returnTimeLabel}: <span className="font-medium text-gray-700">{formatKST(driver.return_time)}</span>
          </p>
          {!delayed && countdown && (
            <p className="text-xs text-gray-400">
              {countdownLabel}: {countdown}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
