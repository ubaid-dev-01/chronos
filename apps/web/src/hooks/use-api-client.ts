'use client'

import { useCallback } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { getApiV1Url } from '@/lib/api-url'

export function useApiClient () {
  const { accessToken, refresh } = useAuth()

  const apiFetch = useCallback(
    async <T = unknown> (path: string, options?: RequestInit): Promise<T> => {
      let token = accessToken
      if (!token) {
        token = await refresh()
      }
      if (!token) {
        throw new Error('Not authenticated. Please sign in again.')
      }

      const doFetch = (bearer: string) =>
        fetch(getApiV1Url(path), {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${bearer}`,
            ...options?.headers
          }
        })

      let res = await doFetch(token)

      if (res.status === 401) {
        const newToken = await refresh()
        if (newToken) {
          res = await doFetch(newToken)
        }
      }

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        const message =
          body?.error?.message ||
          body?.error ||
          `Request failed (${res.status})`
        throw new Error(message)
      }

      return body as T
    },
    [accessToken, refresh]
  )

  const apiFetchBlob = useCallback(
    async (path: string, options?: RequestInit): Promise<Blob> => {
      let token = accessToken
      if (!token) token = await refresh()
      if (!token) throw new Error('Not authenticated. Please sign in again.')

      const res = await fetch(getApiV1Url(path), {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...options?.headers
        }
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Request failed (${res.status})`)
      }

      return res.blob()
    },
    [accessToken, refresh]
  )

  return { apiFetch, apiFetchBlob }
}
