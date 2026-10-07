'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react'

const PAGE_SIZE = 10

interface UserRow {
  _id: string
  email: string
  displayName: string
  role: string
  isActive: boolean
  orgName: string
  orgSlug: string
  lastActiveAt?: string
}

export default function SuperAdminUsersPage () {
  const [users, setUsers] = useState<UserRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [page, setPage] = useState(1)
  const [lastQuery, setLastQuery] = useState(query)

  const load = useCallback(async (q: string) => {
    setLoading(true)
    const params = q ? `?q=${encodeURIComponent(q)}` : ''
    const res = await fetch(`/api/admin/users${params}`)
    const json = await res.json()
    if (json.success) setUsers(json.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(query), 300)
    return () => clearTimeout(timer)
  }, [query, load])

  // Reset to page 1 whenever the search query changes. Adjusting state
  // during render (rather than in an effect) avoids an extra commit.
  if (query !== lastQuery) {
    setLastQuery(query)
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedUsers = useMemo(
    () => users.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [users, safePage]
  )

  async function toggleUserActive (user: UserRow) {
    setSaving(user._id)
    setMessage(null)

    const res = await fetch(`/api/admin/users/${user._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive })
    })
    const json = await res.json()

    if (!res.ok || !json.success) {
      setMessage({
        type: 'err',
        text: json.error ?? 'Failed to update user'
      })
    } else {
      setMessage({
        type: 'ok',
        text: user.isActive
          ? `${user.displayName} deactivated`
          : `${user.displayName} activated`
      })
    }

    await load(query)
    setSaving(null)
  }

  return (
    <div className='space-y-6'>
      <div>
        <p className='label-caps mb-2 text-brand'>Accounts</p>
        <h1 className='heading-section text-text-primary'>All users</h1>
        <p className='prose-body mt-2 max-w-xl'>
          Search users across all workspaces and deactivate or reactivate
          accounts.
        </p>
      </div>

      <div className='relative max-w-md'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary' />
        <input
          type='search'
          placeholder='Search email or name…'
          value={query}
          onChange={e => setQuery(e.target.value)}
          className='w-full rounded-xl border-2 border-[var(--elevated-ink)] bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand'
        />
      </div>

      {message && (
        <div
          className={`rounded-xl border-2 px-4 py-3 text-sm font-medium ${
            message.type === 'ok'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger/10 text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className='flex justify-center py-16'>
          <Loader2 className='h-8 w-8 animate-spin text-brand' />
        </div>
      ) : (
        <div className='overflow-x-auto rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface shadow-[0_4px_0_0_var(--elevated-ink)]'>
          <table className='w-full min-w-[720px] text-left text-sm'>
            <thead className='border-b-2 border-[var(--elevated-ink)] bg-surface-elevated'>
              <tr>
                <th className='px-4 py-3 font-semibold text-text-secondary'>
                  User
                </th>
                <th className='px-4 py-3 font-semibold text-text-secondary'>
                  Organization
                </th>
                <th className='px-4 py-3 font-semibold text-text-secondary'>
                  Role
                </th>
                <th className='px-4 py-3 font-semibold text-text-secondary'>
                  Status
                </th>
                <th className='px-4 py-3 font-semibold text-text-secondary'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className='px-4 py-12 text-center text-text-tertiary'
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                pagedUsers.map(user => (
                  <tr
                    key={user._id}
                    className='border-b border-border last:border-0'
                  >
                    <td className='px-4 py-3'>
                      <p className='font-medium text-text-primary'>
                        {user.displayName}
                      </p>
                      <p className='text-xs text-text-tertiary'>{user.email}</p>
                    </td>
                    <td className='px-4 py-3 text-text-secondary'>
                      {user.orgName}
                    </td>
                    <td className='px-4 py-3 capitalize text-text-secondary'>
                      {user.role}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.isActive
                            ? 'bg-success/15 text-success'
                            : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <button
                        type='button'
                        disabled={saving === user._id}
                        onClick={() => toggleUserActive(user)}
                        className={`rounded-lg border-2 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                          user.isActive
                            ? 'border-danger/30 text-danger hover:bg-danger/10'
                            : 'border-success/30 text-success hover:bg-success/10'
                        }`}
                      >
                        {saving === user._id
                          ? 'Saving…'
                          : user.isActive
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {users.length > 0 && (
        <div className='flex flex-col items-center justify-between gap-3 sm:flex-row'>
          <p className='text-xs text-text-tertiary'>
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, users.length)} of {users.length}
          </p>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className='flex items-center gap-1 rounded-lg border-2 border-[var(--elevated-ink)] px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-elevated disabled:opacity-40'
            >
              <ChevronLeft className='h-3.5 w-3.5' /> Prev
            </button>
            <span className='text-xs text-text-tertiary'>
              Page {safePage} / {pageCount}
            </span>
            <button
              type='button'
              disabled={safePage >= pageCount}
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              className='flex items-center gap-1 rounded-lg border-2 border-[var(--elevated-ink)] px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-elevated disabled:opacity-40'
            >
              Next <ChevronRight className='h-3.5 w-3.5' />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
