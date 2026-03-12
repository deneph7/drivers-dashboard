'use client'

import { useEffect, useState } from 'react'
import { TrafficLight } from './TrafficLight'
import { DelayBadge } from './DelayBadge'
import { formatKST, isDelayed, getCountdown } from '@/lib/utils'
import type { DriverWithStatus } from '@/lib/types'

interface Props {
  driver: DriverWithStatus
  clickable?: boolean
  onClick?: () => void
  delayLabel?: string
  returnTimeLabel?: string
  countdownLabel?: string
}

export function DriverCard({
  driver,
  clickable = false,
  onClick,
  delayLabel = 'Overdue',
  returnTimeLabel = 'Return time',
  countdownLabel = 'Remaining',
}: Props) {
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

  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`
        bg-white rounded-xl border p-4 shadow-sm transition-all
        ${clickable ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}
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
            {clickable && (
              <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
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
