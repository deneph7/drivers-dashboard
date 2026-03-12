import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import type { UserRole } from '@/lib/types'

// POST /api/users — 신규 사용자 생성 (admin only)
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, password, name, initial, role, sort_order } = body as {
    email: string
    password: string
    name: string
    initial: string
    role: UserRole
    sort_order: number | null
  }

  if (!email || !password || !name || !initial || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = createServiceClient()

  // Auth 계정 생성
  const { data: authUser, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, initial, role },
  })

  if (createError || !authUser.user) {
    return NextResponse.json({ error: createError?.message ?? 'Failed to create user' }, { status: 500 })
  }

  // profiles 업데이트 (트리거가 기본값으로 생성한 레코드를 업데이트)
  const { data: updatedProfile, error: profileError } = await service
    .from('profiles')
    .update({ name, initial, role, sort_order: sort_order ?? null })
    .eq('id', authUser.user.id)
    .select()
    .single()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ profile: updatedProfile }, { status: 201 })
}
