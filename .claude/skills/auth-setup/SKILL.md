# Skill: auth-setup

## 목적

Supabase Auth 기반 인증 구현, 역할(role) 기반 접근 제어, Next.js 미들웨어 라우트 보호를 가이드한다.

## 트리거 조건

- 로그인 페이지 구현 시
- 미들웨어(`middleware.ts`) 작성/수정 시
- 역할별 접근 제어 로직 작성 시
- 서버 컴포넌트에서 현재 사용자 정보 조회 시

---

## 1. 역할별 권한

[`references/role-permissions.md`](references/role-permissions.md) 참조

---

## 2. 미들웨어 (`src/middleware.ts`)

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 미인증: /login으로 리다이렉트 (단, 이미 /login이면 통과)
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 인증된 사용자가 /login 접근 시 → 역할별 홈으로 리다이렉트
  if (user && request.nextUrl.pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    const redirectTo = role === 'driver' ? '/driver' : '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // /admin/* → admin만 접근
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // /driver → driver만 접근
  if (request.nextUrl.pathname === '/driver' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'driver') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 3. 서버 컴포넌트에서 현재 사용자 조회

```typescript
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // profile.role로 역할 확인
  return <div>...</div>
}
```

---

## 4. 클라이언트 컴포넌트에서 로그인/로그아웃

### 로그인

```typescript
const supabase = createClient()

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (error) {
  // 에러 표시
  return
}

// 역할에 따라 라우팅
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single()

router.push(profile?.role === 'driver' ? '/driver' : '/dashboard')
```

### 로그아웃

```typescript
await supabase.auth.signOut()
router.push('/login')
```

---

## 5. 관리자 사용자 생성 (Service Role 사용)

API 라우트 `/api/users/route.ts`에서 처리:

```typescript
import { createServiceClient } from '@/lib/supabase-server'

// POST /api/users
export async function POST(request: Request) {
  // 요청자가 admin인지 먼저 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ... admin 확인 로직

  const serviceClient = createServiceClient()

  // Auth 계정 생성
  const { data: authUser, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, initial, role },
  })

  // profiles 레코드 업데이트 (트리거가 기본값으로 생성)
  if (authUser.user) {
    await serviceClient
      .from('profiles')
      .update({ name, initial, role, sort_order })
      .eq('id', authUser.user.id)
  }

  return Response.json({ success: true })
}
```

---

## 6. TypeScript 타입 (`src/lib/types.ts` 일부)

```typescript
export type UserRole = 'admin' | 'driver' | 'viewer'
export type DriverStatusEnum = 'available' | 'unavailable' | 'contact'

export interface Profile {
  id: string
  name: string
  initial: string
  role: UserRole
  recent_vehicles: string[]
  sort_order: number | null
  created_at: string
}

export interface DriverStatus {
  driver_id: string
  status: DriverStatusEnum
  vehicle_number: string | null
  return_time: string | null  // ISO 8601 UTC
  updated_at: string
  updated_by: string | null
}

export interface DriverWithStatus {
  driver_id: string
  status: DriverStatusEnum
  vehicle_number: string | null
  return_time: string | null
  updated_at: string
  profiles: Profile
}
```
