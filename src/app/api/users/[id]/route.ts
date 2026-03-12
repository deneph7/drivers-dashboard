import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import type { UserRole } from '@/lib/types'

interface Params {
  params: Promise<{ id: string }>
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin' ? supabase : null
}

// PATCH /api/users/[id] — 사용자 프로필 수정 (admin only)
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const authorized = await requireAdmin()
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { name, initial, role, sort_order } = body as {
    name?: string
    initial?: string
    role?: UserRole
    sort_order?: number | null
  }

  const service = createServiceClient()
  const { data: updated, error } = await service
    .from('profiles')
    .update({ ...(name && { name }), ...(initial && { initial }), ...(role && { role }), sort_order })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ profile: updated })
}

// DELETE /api/users/[id] — 사용자 삭제 (admin only)
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const authorized = await requireAdmin()
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const { error } = await service.auth.admin.deleteUser(id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
