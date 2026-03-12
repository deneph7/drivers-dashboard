import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'

interface Params {
  params: Promise<{ id: string }>
}

// POST /api/users/[id]/reset-password — 비밀번호 초기화 이메일 발송 (admin only)
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  // 대상 사용자 이메일 조회
  const { data: targetUser, error: getUserError } = await service.auth.admin.getUserById(id)
  if (getUserError || !targetUser.user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 비밀번호 리셋 이메일 발송
  const { error } = await supabase.auth.resetPasswordForEmail(targetUser.user.email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
