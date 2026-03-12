import type { DriverStatusEnum } from '@/lib/types'

const COLOR_MAP: Record<DriverStatusEnum, string> = {
  available: 'bg-blue-600',
  unavailable: 'bg-red-600',
  contact: 'bg-gray-500',
}

const SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

interface Props {
  status: DriverStatusEnum
  size?: keyof typeof SIZE_MAP
}

export function TrafficLight({ status, size = 'md' }: Props) {
  return (
    <div
      className={`${SIZE_MAP[size]} ${COLOR_MAP[status]} rounded-full flex-shrink-0`}
      role="img"
      aria-label={status}
    />
  )
}
