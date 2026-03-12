'use client'

import { useState } from 'react'
import type { Profile, UserRole } from '@/lib/types'
import { setLang, getLang, type Lang } from '@/lib/i18n'

const ROLES: UserRole[] = ['admin', 'driver', 'viewer']
const ROLE_LABELS: Record<UserRole, string> = { admin: 'Admin', driver: 'Driver', viewer: 'Viewer' }

interface Props {
  initialUsers: Profile[]
}

interface NewUserForm {
  email: string
  password: string
  name: string
  initial: string
  role: UserRole
  sort_order: string
}

const EMPTY_FORM: NewUserForm = {
  email: '',
  password: '',
  name: '',
  initial: '',
  role: 'driver',
  sort_order: '',
}

export function AdminClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lang, setLangState] = useState<Lang>(getLang())

  function showMsg(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess('') }
    else { setSuccess(msg); setError('') }
    setTimeout(() => { setError(''); setSuccess('') }, 3000)
  }

  async function handleAddUser() {
    if (!form.email || !form.password || !form.name || !form.initial) {
      showMsg('All fields except Sort Order are required.', true)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          initial: form.initial,
          role: form.role,
          sort_order: form.sort_order ? parseInt(form.sort_order) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to create user')

      setUsers((prev) => [...prev, json.profile as Profile])
      setForm(EMPTY_FORM)
      setShowAddForm(false)
      showMsg('User created successfully.')
    } catch (e) {
      showMsg((e as Error).message, true)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateUser(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update user')

      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...json.profile } : u)))
      setEditingId(null)
      showMsg('User updated.')
    } catch (e) {
      showMsg((e as Error).message, true)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Failed to delete user')
      }
      setUsers((prev) => prev.filter((u) => u.id !== id))
      showMsg('User deleted.')
    } catch (e) {
      showMsg((e as Error).message, true)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/${id}/reset-password`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to reset password')
      showMsg('Password reset email sent.')
    } catch (e) {
      showMsg((e as Error).message, true)
    } finally {
      setLoading(false)
    }
  }

  function handleLangToggle() {
    const next: Lang = lang === 'en' ? 'ko' : 'en'
    setLang(next)
    setLangState(next)
  }

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{success}</div>}

      {/* Language Setting */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Site Language</span>
        <button
          onClick={handleLangToggle}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
        >
          {lang === 'en' ? '한국어로 전환' : 'Switch to English'}
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">User Management</h2>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setForm(EMPTY_FORM) }}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Add User
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div className="px-4 py-4 bg-blue-50 border-b border-blue-100 space-y-3">
            <h3 className="text-sm font-medium text-blue-900">New User</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Email *"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Password *"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Name *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Initial * (e.g. 김, K1)"
                value={form.initial}
                onChange={(e) => setForm((f) => ({ ...f, initial: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Sort Order (optional)"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddUser}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="divide-y divide-gray-100">
          {users.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">No users.</p>
          )}
          {users.map((u) => (
            <div key={u.id} className="px-4 py-3">
              {editingId === u.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name"
                      defaultValue={u.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Initial"
                      defaultValue={u.initial}
                      onChange={(e) => setEditForm((f) => ({ ...f, initial: e.target.value }))}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      defaultValue={u.role}
                      onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Sort Order"
                      defaultValue={u.sort_order ?? ''}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          sort_order: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateUser(u.id)}
                      disabled={loading}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{u.initial}</span>
                      <span className="text-sm text-gray-600">{u.name}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {ROLE_LABELS[u.role]}
                      </span>
                      {u.sort_order !== null && (
                        <span className="text-xs text-gray-400">#{u.sort_order}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{/* email not in profiles — removed */}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditingId(u.id); setEditForm({}) }}
                      className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="rounded px-2 py-1 text-xs text-yellow-600 hover:bg-yellow-50"
                    >
                      Reset PW
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
