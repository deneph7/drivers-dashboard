export function formatKST(utcString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcString))
}

export function formatKSTTime(utcString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcString))
}

export function isDelayed(returnTime: string | null, status: string): boolean {
  if (status !== 'unavailable' || !returnTime) return false
  return new Date(returnTime) < new Date()
}

export function getCountdown(returnTime: string): string {
  const diff = new Date(returnTime).getTime() - Date.now()
  if (diff <= 0) return '0분'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}

// 최근 차량번호 배열 업데이트 (최대 5개 FIFO)
export function updateRecentVehicles(current: string[], newVehicle: string): string[] {
  if (!newVehicle.trim()) return current
  const filtered = current.filter((v) => v !== newVehicle)
  return [newVehicle, ...filtered].slice(0, 5)
}

// KST datetime-local input value → UTC ISO string
export function kstInputToUTC(kstLocalValue: string): string {
  // kstLocalValue: "2024-03-11T14:30" (KST로 해석)
  const kstDate = new Date(kstLocalValue + ':00+09:00')
  return kstDate.toISOString()
}

// UTC ISO string → KST datetime-local input value
export function utcToKSTInput(utcString: string): string {
  const date = new Date(utcString)
  const kstOffset = 9 * 60 * 60 * 1000
  const kst = new Date(date.getTime() + kstOffset)
  return kst.toISOString().slice(0, 16)
}
