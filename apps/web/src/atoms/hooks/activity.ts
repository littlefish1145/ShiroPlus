import type { ActivityPresence } from '@mx-space/api-client'
import { useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { useMemo } from 'react'

import { activityAtom, activityPresenceAtom } from '../activity'

export const useActivity = () => useAtomValue(activityAtom)
export const useActivityPresence = () => useAtomValue(activityPresenceAtom)
export const useActivityPresenceBySessionId = (
  sessionId: string,
): ActivityPresence | null =>
  useAtomValue(
    useMemo(
      () =>
        selectAtom(activityPresenceAtom, (atomValue) => atomValue[sessionId]),
      [sessionId],
    ),
  )

export const useActivityPresenceByRoomName = (roomName: string) =>
  useAtomValue(
    useMemo(
      () =>
        selectAtom(activityPresenceAtom, (atomValue) =>
          Object.values(atomValue)
            .filter((presence) => presence.roomName === roomName)
            .map((presence) => presence.identity),
        ),
      [roomName],
    ),
  )

export const useCurrentRoomCount = (roomName: string) =>
  useAtomValue(
    useMemo(
      () =>
        selectAtom(
          activityPresenceAtom,
          (atomValue) =>
            Object.values(atomValue).filter(
              (presence) => presence.roomName === roomName,
            ).length,
        ),
      [roomName],
    ),
  )
