/**
 * Normalize NEXT_PUBLIC_API_URL which is documented both as
 * `http://localhost:4000` and `http://localhost:4000/v1`.
 */
export function getApiOrigin (raw?: string): string {
  const value = (raw ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000')
    .trim()
    .replace(/\/+$/, '')
  return value.replace(/\/v1$/i, '')
}

export function getApiV1Base (raw?: string): string {
  return `${getApiOrigin(raw)}/v1`
}

export function getApiV1Url (path: string, raw?: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${getApiV1Base(raw)}${suffix}`
}
