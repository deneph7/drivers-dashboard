# Skill: ui-components

## 목적

신호등, 기사 카드, 상태 선택기 등 UI 컴포넌트 구현 가이드. 디자인 토큰, 반응형 패턴, 접근성 원칙을 포함한다.

## 트리거 조건

- UI 컴포넌트 생성/수정 시
- 신호등 스타일 정의가 필요할 때
- 반응형 레이아웃 구현 시
- 복귀 지연 감지 타이머 구현 시

---

## 1. 디자인 토큰

[`references/design-tokens.md`](references/design-tokens.md) 참조

---

## 2. 컴포넌트별 구현 가이드

### TrafficLight.tsx — 신호등 원형 아이콘

```tsx
type Status = 'available' | 'unavailable' | 'contact'

const COLOR_MAP: Record<Status, string> = {
  available: 'bg-blue-600',
  unavailable: 'bg-red-600',
  contact: 'bg-gray-500',
}

export function TrafficLight({ status, size = 'md' }: { status: Status; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div
      className={`${sizeClass} ${COLOR_MAP[status]} rounded-full`}
      role="img"
      aria-label={status}
    />
  )
}
```

### DriverCard.tsx — 기사 상태 카드

```tsx
// 핵심 구조 (admin 클릭 가능 / driver·viewer 불가)
<div
  className={`
    rounded-xl border p-4 shadow-sm
    ${isAdmin ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
    ${isDelayed ? 'animate-pulse border-red-500' : 'border-gray-200'}
  `}
  onClick={isAdmin ? () => router.push(`/admin/driver/${driverId}`) : undefined}
>
  <div className="flex items-center gap-3">
    <TrafficLight status={status} size="lg" />
    <div>
      <p className="text-2xl font-bold">{initial}</p>
      {vehicleNumber && <p className="text-sm text-gray-600">{vehicleNumber}</p>}
    </div>
    {isDelayed && <DelayBadge />}
  </div>
  {status === 'unavailable' && returnTime && (
    <div className="mt-2 text-sm">
      <p>복귀 예정: {formatKST(returnTime)}</p>
      <Countdown returnTime={returnTime} />
    </div>
  )}
</div>
```

### StatusSelector.tsx — 상태 선택 UI (기사/관리자 공용)

```tsx
// 3개 버튼: 가용 / 불가용 / 연락필요
// 불가용 선택 시 복귀시간 입력 필드 활성화
const STATUSES = [
  { value: 'available', label: '가용', labelEn: 'Available', color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'unavailable', label: '불가용', labelEn: 'Unavailable', color: 'bg-red-600 hover:bg-red-700' },
  { value: 'contact', label: '연락필요', labelEn: 'Contact', color: 'bg-gray-500 hover:bg-gray-600' },
]

// 핵심 로직:
// - 버튼 탭 즉시 저장 (확인 단계 없음)
// - unavailable 선택 시 → returnTime 입력 필드 표시 (필수)
// - available/contact 선택 시 → returnTime 초기화
```

### VehicleInput.tsx — 차량번호 입력 + 자동완성

```tsx
// recent_vehicles 배열 기반 드롭다운
// 저장 성공 시 배열 앞에 추가, 6번째 이후 제거
// 구현: input + datalist 또는 커스텀 드롭다운

function updateRecentVehicles(current: string[], newVehicle: string): string[] {
  const filtered = current.filter(v => v !== newVehicle) // 중복 제거
  return [newVehicle, ...filtered].slice(0, 5)           // 앞에 추가, 최대 5개
}
```

### Clock.tsx — 실시간 시계 (KST)

```tsx
"use client"
import { useEffect, useState } from 'react'

export function Clock() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat('ko-KR', {
          timeZone: 'Asia/Seoul',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
        }).format(new Date())
      )
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  return <time className="text-lg font-mono">{time}</time>
}
```

### DelayBadge.tsx — 복귀 지연 경고 배지

```tsx
export function DelayBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 animate-pulse">
      복귀 지연
    </span>
  )
}
```

---

## 3. 복귀 지연 감지 패턴

```typescript
// 1분 주기 클라이언트 사이드 타이머
function isDelayed(returnTime: string | null, status: string): boolean {
  if (status !== 'unavailable' || !returnTime) return false
  return new Date(returnTime) < new Date()
}

// useEffect에서 setInterval(checkDelays, 60_000)
```

---

## 4. 반응형 그리드 (대시보드)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {drivers.map(driver => <DriverCard key={driver.driver_id} {...driver} />)}
</div>
```

---

## 5. KST 시간 변환 유틸리티

```typescript
export function formatKST(utcString: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
    ...options,
  }).format(new Date(utcString))
}
```

---

## 6. i18n 패턴 (`src/lib/i18n.ts`)

```typescript
export const messages = {
  en: {
    available: 'Available',
    unavailable: 'Unavailable',
    contact: 'Contact needed',
    returnTime: 'Return time',
    delayed: 'Overdue',
    dashboard: 'Dashboard',
    // ... 전체 번역
  },
  ko: {
    available: '가용',
    unavailable: '불가용',
    contact: '연락필요',
    returnTime: '복귀 예정',
    delayed: '복귀 지연',
    dashboard: '대시보드',
    // ... 전체 번역
  },
} as const

type Lang = keyof typeof messages
type MessageKey = keyof typeof messages.en

// localStorage['site_language'] 기반으로 언어 선택
export function useLang(): (key: MessageKey) => string {
  const lang = (typeof window !== 'undefined'
    ? localStorage.getItem('site_language')
    : null) as Lang ?? 'en'
  return (key: MessageKey) => messages[lang][key]
}
```

---

## 7. 접근성 원칙

- 모든 상태 아이콘에 `aria-label` 필수
- 버튼 최소 크기 44×44px (모바일 터치)
- 복귀 지연 경고는 색상 외 텍스트로도 표시
- 키보드 탐색 지원 (tab 순서)
