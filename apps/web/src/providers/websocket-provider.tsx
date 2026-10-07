'use client'

import type { ActivityFeedEvent, WSPresencePayload } from '@chronos/types'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Socket, io } from 'socket.io-client'
import { useAuth } from '@/providers/auth-provider'
import { getApiOrigin } from '@/lib/api-url'

const WSEvent = {
  JOIN_ORG: 'join_org',
  LEAVE_ORG: 'leave_org',
  HEARTBEAT: 'heartbeat',
  TEAM_STATUS: 'team_status',
  PRESENCE_UPDATE: 'presence_update',
  SCREENSHOT_NEW: 'screenshot_new',
  TIMELOG_UPDATE: 'timelog_update',
  NOTIFICATION: 'notification',
  BURNOUT_ALERT: 'burnout_alert',
  ACTIVITY_FEED: 'activity_feed'
}

const FEED_LIMIT = 50

interface WSContextValue {
  socket: Socket | null
  connected: boolean
  teamPresence: WSPresencePayload[]
  activityFeed: ActivityFeedEvent[]
}

const WSContext = createContext<WSContextValue>({
  socket: null,
  connected: false,
  teamPresence: [],
  activityFeed: []
})

export function WebSocketProvider ({
  children,
  orgId,
  userId
}: {
  children: React.ReactNode
  orgId: string
  userId: string
}) {
  const { accessToken, loading } = useAuth()
  // A ref is kept for the cleanup/heartbeat closures, but the value handed to
  // consumers via context comes from state reading `ref.current` during
  // render doesn't trigger a re-render when the socket is (re)created, so the
  // context could hand out a stale (or perpetually null) socket instance.
  const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [teamPresence, setTeamPresence] = useState<WSPresencePayload[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityFeedEvent[]>([])

  useEffect(() => {
    if (loading || !accessToken) return

    const socket = io(getApiOrigin(), {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token: accessToken }
    })

    socketRef.current = socket
    queueMicrotask(() => setSocket(socket))

    socket.on('connect', () => {
      setConnected(true)
      socket.emit(WSEvent.JOIN_ORG, { orgId, userId })
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on(WSEvent.TEAM_STATUS, (data: WSPresencePayload[]) => {
      setTeamPresence(data)
    })

    socket.on(WSEvent.PRESENCE_UPDATE, (data: WSPresencePayload) => {
      setTeamPresence(prev => {
        const idx = prev.findIndex(p => p.userId === data.userId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = data
          return next
        }
        return [...prev, data]
      })
    })

    socket.on(WSEvent.ACTIVITY_FEED, (data: ActivityFeedEvent) => {
      setActivityFeed(prev => [data, ...prev].slice(0, FEED_LIMIT))
    })

    const heartbeat = setInterval(() => {
      socket.emit(WSEvent.HEARTBEAT, { userId, orgId })
    }, 30000)

    return () => {
      clearInterval(heartbeat)
      socket.emit(WSEvent.LEAVE_ORG, { orgId })
      socket.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [orgId, userId, accessToken, loading])

  return (
    <WSContext.Provider
      value={{ socket, connected, teamPresence, activityFeed }}
    >
      {children}
    </WSContext.Provider>
  )
}

export const useWebSocket = () => useContext(WSContext)
