import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { AdminClient } from '@/components/AdminClient'
import type { Profile } from '@/lib/types'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-900">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
              ← Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <AdminClient initialUsers={(users ?? []) as Profile[]} />
      </main>
    </div>
  )
}
