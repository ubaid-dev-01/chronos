'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  Database,
  Camera,
  Mail,
  Check,
  X,
  Loader2,
  Save,
  KeyRound,
  Copy,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/hooks/use-api-client'
import { QueryError } from '@/components/ui/query-error'

interface SettingsFormProps {
  orgName: string
  userTimezone: string
}

const TIMEZONES = [
  'UTC',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Australia/Sydney',
  'Pacific/Auckland'
]

interface IntegrationStatus {
  configured: boolean
  label: string
  detail?: string
}

interface ApiKeyRow {
  _id: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt?: string
  revokedAt?: string | null
  createdAt: string
}

export function SettingsForm ({
  orgName,
  userTimezone
}: SettingsFormProps) {
  const router = useRouter()
  const { apiFetch } = useApiClient()
  const [name, setName] = useState(orgName)
  const [timezone, setTimezone] = useState(userTimezone || 'UTC')
  const [saving, setSaving] = useState(false)
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus> | null>(null)
  const [integrationsError, setIntegrationsError] = useState('')
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [keysError, setKeysError] = useState('')
  const [keyName, setKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ data: Record<string, IntegrationStatus> }>('/orgs/me/integrations')
      .then(res => {
        setIntegrations(res.data)
        setIntegrationsError('')
      })
      .catch(err => {
        setIntegrationsError(err instanceof Error ? err.message : 'Failed to load integrations')
      })

    apiFetch<{ data: ApiKeyRow[] }>('/api-keys')
      .then(res => {
        setKeys(res.data ?? [])
        setKeysError('')
      })
      .catch(err => {
        setKeysError(err instanceof Error ? err.message : 'Failed to load API keys')
      })
  }, [apiFetch])

  const handleSaveOrg = async () => {
    if (!name.trim()) {
      toast.error('Organization name is required')
      return
    }
    setSaving(true)
    try {
      await apiFetch(`/orgs/me`, {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), timezone })
      })
      toast.success('Organization settings saved')
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error('Key name is required')
      return
    }
    setCreatingKey(true)
    try {
      const res = await apiFetch<{ data: ApiKeyRow & { key: string } }>('/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: keyName.trim() })
      })
      setKeys(prev => [res.data, ...prev])
      setRevealedKey(res.data.key)
      setKeyName('')
      toast.success('API key created — copy it now, it will not be shown again')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setCreatingKey(false)
    }
  }

  const handleRevokeKey = async (id: string) => {
    try {
      await apiFetch(`/api-keys/${id}`, { method: 'DELETE' })
      setKeys(prev => prev.map(k => k._id === id ? { ...k, revokedAt: new Date().toISOString() } : k))
      toast.success('API key revoked')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke key')
    }
  }

  const integrationIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    stripe: CreditCard,
    s3: Camera,
    redis: Database,
    email: Mail
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-text-primary'>Settings</h1>
        <p className='text-text-secondary'>Manage your organization settings</p>
      </div>

      <div className='rounded-xl border border-border bg-surface p-6'>
        <h2 className='text-lg font-semibold text-text-primary mb-4'>
          Organization
        </h2>
        <div className='space-y-4'>
          <div>
            <label className='text-sm text-text-secondary mb-1 block'>
              Organization Name
            </label>
            <input
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='My Workspace'
              className='w-full max-w-md bg-surface-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary'
            />
          </div>
          <div>
            <label className='text-sm text-text-secondary mb-1 block'>
              Timezone
            </label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className='w-full max-w-md bg-surface-elevated border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary'
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSaveOrg}
            disabled={saving}
            className='flex items-center gap-2 px-4 py-2 bg-accent hover:bg-primary-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors'
          >
            {saving ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Save className='w-4 h-4' />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className='rounded-xl border border-border bg-surface p-6'>
        <h2 className='text-lg font-semibold text-text-primary mb-1'>
          Infrastructure status
        </h2>
        <p className='text-sm text-text-secondary mb-4'>
          These services are configured on the server. Credentials are never
          stored in the browser.
        </p>
        {integrationsError && (
          <QueryError
            message={integrationsError}
            onRetry={() => router.refresh()}
          />
        )}
        <div className='space-y-3'>
          {integrations &&
            Object.entries(integrations).map(([id, service]) => {
              const Icon = integrationIcons[id] ?? Database
              return (
                <div
                  key={id}
                  className='flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-elevated p-4'
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <Icon className='h-5 w-5 shrink-0 text-text-secondary' />
                    <div className='min-w-0'>
                      <p className='text-sm font-medium text-text-primary'>
                        {service.label}
                      </p>
                      {service.detail && (
                        <p className='text-xs text-text-tertiary'>{service.detail}</p>
                      )}
                    </div>
                  </div>
                  {service.configured ? (
                    <span className='flex items-center gap-1 text-xs text-success'>
                      <Check className='h-3 w-3' /> Configured
                    </span>
                  ) : (
                    <span className='flex items-center gap-1 text-xs text-text-tertiary'>
                      <X className='h-3 w-3' /> Not configured
                    </span>
                  )}
                </div>
              )
            })}
        </div>
      </div>

      <div className='rounded-xl border border-border bg-surface p-6'>
        <h2 className='mb-1 flex items-center gap-2 text-lg font-semibold text-text-primary'>
          <KeyRound className='h-5 w-5' />
          Public API keys
        </h2>
        <p className='mb-4 text-sm text-text-secondary'>
          Keys authenticate <code>/v1/public/*</code> integrations. The secret is
          shown only once at creation.
        </p>
        {keysError && <QueryError message={keysError} />}
        {revealedKey && (
          <div className='mb-4 rounded-lg border border-warning/30 bg-warning/5 p-3'>
            <p className='mb-2 text-xs text-warning'>
              Copy this key now. It cannot be retrieved later.
            </p>
            <div className='flex items-center gap-2'>
              <code className='flex-1 truncate text-xs text-text-primary'>
                {revealedKey}
              </code>
              <button
                type='button'
                onClick={() => {
                  navigator.clipboard.writeText(revealedKey)
                  toast.success('Copied')
                }}
                className='rounded-md border border-border p-1.5 text-text-secondary hover:text-text-primary'
              >
                <Copy className='h-4 w-4' />
              </button>
            </div>
          </div>
        )}
        <div className='mb-4 flex flex-col gap-2 sm:flex-row'>
          <input
            value={keyName}
            onChange={e => setKeyName(e.target.value)}
            placeholder='Key name, e.g. Payroll export'
            className='flex-1 rounded-lg border border-white/10 bg-surface-elevated px-3 py-2 text-sm text-text-primary'
          />
          <button
            type='button'
            onClick={handleCreateKey}
            disabled={creatingKey}
            className='rounded-lg bg-accent px-4 py-2 text-sm font-medium disabled:opacity-50'
          >
            {creatingKey ? 'Creating…' : 'Create key'}
          </button>
        </div>
        <div className='space-y-2'>
          {keys.length === 0 ? (
            <p className='text-sm text-text-tertiary'>No API keys yet.</p>
          ) : (
            keys.map(key => (
              <div
                key={key._id}
                className='flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm text-text-primary'>
                    {key.name}{' '}
                    <span className='text-text-tertiary'>({key.keyPrefix}…)</span>
                  </p>
                  <p className='text-xs text-text-tertiary'>
                    {key.revokedAt ? 'Revoked' : key.scopes?.join(', ')}
                  </p>
                </div>
                {!key.revokedAt && (
                  <button
                    type='button'
                    onClick={() => handleRevokeKey(key._id)}
                    className='rounded p-1 text-text-tertiary hover:text-danger'
                    aria-label='Revoke key'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
