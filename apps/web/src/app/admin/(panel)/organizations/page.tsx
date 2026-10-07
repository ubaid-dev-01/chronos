'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { PlanTier } from '@chronos/types'

const PLAN_TIERS: PlanTier[] = ['free', 'starter', 'pro', 'enterprise']
const PAGE_SIZE = 10

interface OrgRow {
  _id: string
  name: string
  slug: string
  planTier: PlanTier
  seatLimit: number
  isActive: boolean
  memberCount: number
  createdAt: string
}

export default function SuperAdminOrganizationsPage () {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingSeats, setEditingSeats] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/organizations')
    const json = await res.json()
    if (json.success) {
      setOrgs(json.data)
      const seats: Record<string, string> = {}
      for (const org of json.data as OrgRow[]) {
        seats[org._id] = String(org.seatLimit)
      }
      setEditingSeats(seats)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      load()
    })
  }, [load])

  async function patchOrg (
    id: string,
    body: Record<string, unknown>,
    label: string
  ) {
    setSaving(id)
    setMessage(null)
    const res = await fetch(`/api/admin/organizations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      setMessage({ type: 'err', text: json.error ?? `Failed to update ${label}` })
    } else {
      setMessage({ type: 'ok', text: `${label} updated` })
    }
    await load()
    setSaving(null)
  }

  function handlePlanChange (org: OrgRow, planTier: PlanTier) {
    if (planTier === org.planTier) return
    patchOrg(org._id, { planTier }, 'Plan tier')
  }

  function handleSeatSave (org: OrgRow) {
    const raw = editingSeats[org._id] ?? String(org.seatLimit)
    const seatLimit = parseInt(raw, 10)
    if (Number.isNaN(seatLimit) || seatLimit < 1) {
      setMessage({ type: 'err', text: 'Seat limit must be at least 1' })
      return
    }
    if (seatLimit === org.seatLimit) return
    patchOrg(org._id, { seatLimit }, 'Seat limit')
  }

  function toggleActive (org: OrgRow) {
    patchOrg(org._id, { isActive: !org.isActive }, 'Status')
  }

  const pageCount = Math.max(1, Math.ceil(orgs.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedOrgs = useMemo(
    () => orgs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [orgs, safePage]
  )

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='h-8 w-8 animate-spin text-brand' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <p className='label-caps mb-2 text-brand'>Tenants</p>
        <h1 className='heading-section text-text-primary'>Organizations</h1>
        <p className='prose-body mt-2 max-w-xl'>
          Change plan tier, edit seat limits, or suspend workspaces.
        </p>
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

      <div className='overflow-x-auto rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface shadow-[0_4px_0_0_var(--elevated-ink)]'>
        <table className='w-full min-w-[800px] text-left text-sm'>
          <thead className='border-b-2 border-[var(--elevated-ink)] bg-surface-elevated'>
            <tr>
              <th className='px-4 py-3 font-semibold text-text-secondary'>Name</th>
              <th className='px-4 py-3 font-semibold text-text-secondary'>Plan</th>
              <th className='px-4 py-3 font-semibold text-text-secondary'>Seats</th>
              <th className='px-4 py-3 font-semibold text-text-secondary'>Members</th>
              <th className='px-4 py-3 font-semibold text-text-secondary'>Status</th>
              <th className='px-4 py-3 font-semibold text-text-secondary'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedOrgs.map(org => {
              const busy = saving === org._id
              const seatDraft = editingSeats[org._id] ?? String(org.seatLimit)
              const seatChanged = parseInt(seatDraft, 10) !== org.seatLimit

              return (
                <tr key={org._id} className='border-b border-border last:border-0'>
                  <td className='px-4 py-3'>
                    <p className='font-medium text-text-primary'>{org.name}</p>
                    <p className='text-xs text-text-tertiary'>{org.slug}</p>
                  </td>
                  <td className='px-4 py-3'>
                    <select
                      value={org.planTier}
                      disabled={busy}
                      onChange={e =>
                        handlePlanChange(org, e.target.value as PlanTier)
                      }
                      className='rounded-lg border-2 border-[var(--elevated-ink)] bg-surface-elevated px-2 py-1.5 text-sm capitalize outline-none focus:border-brand disabled:opacity-50'
                    >
                      {PLAN_TIERS.map(tier => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-1.5'>
                      <input
                        type='number'
                        min={1}
                        disabled={busy}
                        value={seatDraft}
                        onChange={e =>
                          setEditingSeats(prev => ({
                            ...prev,
                            [org._id]: e.target.value
                          }))
                        }
                        className='w-16 rounded-lg border-2 border-[var(--elevated-ink)] bg-surface-elevated px-2 py-1.5 text-sm outline-none focus:border-brand disabled:opacity-50'
                      />
                      {seatChanged && (
                        <button
                          type='button'
                          disabled={busy}
                          onClick={() => handleSeatSave(org)}
                          title='Save seat limit'
                          className='rounded-lg border-2 border-brand/30 bg-brand/10 p-1.5 text-brand hover:bg-brand/20 disabled:opacity-50'
                        >
                          <Check className='h-3.5 w-3.5' />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className='px-4 py-3 text-text-secondary'>
                    <span
                      className={
                        org.memberCount > org.seatLimit
                          ? 'font-semibold text-danger'
                          : ''
                      }
                    >
                      {org.memberCount} / {org.seatLimit}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        org.isActive
                          ? 'bg-success/15 text-success'
                          : 'bg-danger/15 text-danger'
                      }`}
                    >
                      {org.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <button
                      type='button'
                      disabled={busy}
                      onClick={() => toggleActive(org)}
                      className='rounded-lg border-2 border-[var(--elevated-ink)] px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-elevated disabled:opacity-50'
                    >
                      {busy ? 'Saving…' : org.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {orgs.length > 0 && (
        <div className='flex flex-col items-center justify-between gap-3 sm:flex-row'>
          <p className='text-xs text-text-tertiary'>
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, orgs.length)} of {orgs.length}
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
