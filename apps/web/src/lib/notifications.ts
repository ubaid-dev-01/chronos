/**
 * Thin wrapper around the browser Notification API. Web notifications are a
 * "nice to have" alongside native OS notifications from the desktop agent —
 * we degrade silently wherever the browser doesn't support them or the user
 * hasn't granted permission, we never throw or block the calling flow.
 */

export function isNotificationSupported (): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function ensureNotificationPermission (): Promise<boolean> {
  if (!isNotificationSupported()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

export function notifyBrowser (title: string, body?: string): void {
  if (!isNotificationSupported()) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/brand/favicon.svg',
      tag: 'chronos-timer'
    })
  } catch {
    // Notifications can throw in some contexts (e.g. non-secure origins) -
    // never let a notification failure break the timer flow.
  }
}
