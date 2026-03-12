'use client'

interface Props {
  value: string
  onChange: (value: string) => void
  recentVehicles: string[]
  placeholder?: string
  disabled?: boolean
}

export function VehicleInput({
  value,
  onChange,
  recentVehicles,
  placeholder = 'e.g. 12가3456',
  disabled = false,
}: Props) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        list="recent-vehicles-list"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {recentVehicles.length > 0 && (
        <datalist id="recent-vehicles-list">
          {recentVehicles.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      )}
    </div>
  )
}
