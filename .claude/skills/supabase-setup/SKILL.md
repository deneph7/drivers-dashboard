# Skill: supabase-setup

## 목적

Supabase 프로젝트 초기화, DB 스키마 생성, RLS 정책 설정, Realtime 구독 설정을 가이드한다.

## 트리거 조건

- DB 스키마 생성 또는 변경이 필요할 때
- RLS(Row Level Security) 정책을 설정/수정할 때
- Supabase Realtime 구독 코드를 작성할 때
- Supabase 클라이언트 초기화 코드를 작성할 때

---

## 1. Supabase 클라이언트 설정

### 브라우저용 (`src/lib/supabase-client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 서버용 (`src/lib/supabase-server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### Service Role 클라이언트 (관리자 작업 전용)

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

---

## 2. DB 스키마

전체 SQL: [`scripts/init-schema.sql`](scripts/init-schema.sql)

### 실행 방법
1. Supabase 대시보드 → SQL Editor 접속
2. `init-schema.sql` 전체 내용 붙여넣기 후 실행
3. 오류 없이 완료되면 Table Editor에서 테이블 확인

---

## 3. Realtime 구독 패턴

대시보드에서 `driver_status` 테이블 변경을 실시간으로 구독:

```typescript
"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import type { DriverWithStatus } from '@/lib/types'

export function useDashboardRealtime() {
  const [drivers, setDrivers] = useState<DriverWithStatus[]>([])
  const supabase = createClient()

  useEffect(() => {
    // 초기 데이터 로드
    async function loadDrivers() {
      const { data } = await supabase
        .from('driver_status')
        .select(`
          *,
          profiles!driver_status_driver_id_fkey (
            id, name, initial, sort_order
          )
        `)
        .order('profiles(sort_order)', { ascending: true, nullsFirst: false })
      if (data) setDrivers(data as DriverWithStatus[])
    }
    loadDrivers()

    // Realtime 구독
    const channel = supabase
      .channel('driver-status-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_status' },
        () => loadDrivers() // 변경 시 전체 재조회
      )
      .subscribe()

    // 폴백: 30초 주기 폴링
    const pollInterval = setInterval(loadDrivers, 30_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [])

  return drivers
}
```

---

## 4. 패키지 설치

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 5. 주의사항

- Service Role 키는 절대 클라이언트 사이드에 노출 금지 (`NEXT_PUBLIC_` 접두사 사용 불가)
- RLS가 활성화된 테이블은 반드시 정책을 정의해야 함 (정책 없으면 전체 거부)
- `driver_status` 테이블: `driver_id`가 PK이자 UNIQUE — Upsert 패턴으로 기사당 1개 레코드 유지
- Realtime은 Supabase 대시보드에서 해당 테이블의 Realtime 활성화 필요
