'use client'

import { useEffect } from 'react'
import { StatusSelector } from './StatusSelector'
import type { DriverWithStatus } from '@/lib/types'
import { useLang } from '@/lib/i18n'

interface Props {
  driver: DriverWithStatus
  currentUserId: string
  onClose: () => void
}

export function StatusModal({ driver, currentUserId, onClose }: Props) {
  const t = useLang()

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* Modal */}
      <div
        className="relative bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {driver.profiles.initial}
            </h2>
            <p className="text-sm text-gray-500">{driver.profiles.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('close')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Selector */}
        <StatusSelector
          driverData={driver}
          currentUserId={currentUserId}
          onSaved={onClose}
        />
      </div>
    </div>
  )
}
