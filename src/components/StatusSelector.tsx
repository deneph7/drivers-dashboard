'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { VehicleInput } from './VehicleInput'
import { TrafficLight } from './TrafficLight'
import { kstInputToUTC, utcToKSTInput, updateRecentVehicles } from '@/lib/utils'
import type { DriverStatusEnum, DriverWithStatus } from '@/lib/types'
import { useLang } from '@/lib/i18n'

const STATUSES: { value: DriverStatusEnum; labelKey: 'available' | 'unavailable' | 'contact'; color: string }[] = [
  { value: 'available', labelKey: 'available', color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'unavailable', labelKey: 'unavailable', color: 'bg-red-600 hover:bg-red-700' },
  { value: 'contact', labelKey: 'contact', color: 'bg-gray-500 hover:bg-gray-600' },
]

interface Props {
  driverData: DriverWithStatus
  currentUserId: string
  onSaved?: () => void  // modal mode: callback instead of redirect
}

export function StatusSelector({ driverData, currentUserId, onSaved }: Props) {
  const t = useLang()
  const router = useRouter()
  const supabase = createClient()

  const [status, setStatus] = useState<DriverStatusEnum>(driverData.status)
  const [vehicleNumber, setVehicleNumber] = useState(driverData.vehicle_number ?? '')
  const [returnTime, setReturnTime] = useState(
    driverData.return_time ? utcToKSTInput(driverData.return_time) : ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (status === 'unavailable' && !returnTime) {
      setError(t('returnTimeRequired'))
      return
    }

    // Validate return time is in the future
    if (status === 'unavailable' && returnTime) {
      const returnUTC = kstInputToUTC(returnTime)
      if (new Date(returnUTC) <= new Date()) {
        setError(t('returnTimePast'))
        return
      }
    }

    setError('')
    setSaving(true)

    try {
      const updateData = {
        status,
        vehicle_number: vehicleNumber.trim() || null,
        return_time: status === 'unavailable' ? kstInputToUTC(returnTime) : null,
        updated_by: currentUserId,
      }

      const { error: updateError } = await supabase
        .from('driver_status')
        .update(updateData)
        .eq('driver_id', driverData.driver_id)

      if (updateError) throw updateError

      // recent_vehicles 업데이트
      if (vehicleNumber.trim()) {
        const newRecent = updateRecentVehicles(
          driverData.profiles.recent_vehicles,
          vehicleNumber.trim()
        )
        await supabase
          .from('profiles')
          .update({ recent_vehicles: newRecent })
          .eq('id', driverData.driver_id)
      }

      if (onSaved) {
        onSaved()
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  function handleStatusSelect(newStatus: DriverStatusEnum) {
    setStatus(newStatus)
    if (newStatus !== 'unavailable') {
      setReturnTime('')
    }
    setError('')
  }

  return (
    <div className="space-y-6">
      {/* 현재 상태 표시 */}
      <div className="flex items-center gap-3">
        <TrafficLight status={status} size="lg" />
        <span className="text-lg font-medium text-gray-700">{t(status)}</span>
      </div>

      {/* 상태 선택 버튼 */}
      <div className="grid grid-cols-3 gap-3">
        {STATUSES.map(({ value, labelKey, color }) => (
          <button
            key={value}
            onClick={() => handleStatusSelect(value)}
            className={`
              ${color} text-white rounded-lg px-3 py-4 font-medium text-sm
              transition-all min-h-[56px]
              ${status === value ? 'ring-2 ring-offset-2 ring-gray-800 scale-[0.98]' : ''}
            `}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* 복귀 예정시간 (불가용 시 필수) */}
      {status === 'unavailable' && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('returnDateTime')}
            <span className="ml-1 text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={returnTime}
            onChange={(e) => setReturnTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
      )}

      {/* 차량번호 */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {t('vehicleNumber')}
        </label>
        <VehicleInput
          value={vehicleNumber}
          onChange={setVehicleNumber}
          recentVehicles={driverData.profiles.recent_vehicles}
          placeholder={t('vehicleNumberPlaceholder')}
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-[48px]"
      >
        {saving ? t('saving') : t('save')}
      </button>
    </div>
  )
}
