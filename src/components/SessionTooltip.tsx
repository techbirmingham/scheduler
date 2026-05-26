// src/components/SessionTooltip.tsx
//
// Hover popup for sessions on the calendar views. Session blocks in Grid
// and Timeline are too narrow to show speakers / venue / tracks; this
// tooltip surfaces them on mouseenter.
//
// Portal-rendered to <body> so it isn't clipped by FullCalendar's own
// overflow:hidden. Pointer-events:none so the cursor falls through to
// the underlying event element — no flicker, no double-mouse-enter loops.

import React from 'react'
import { createPortal } from 'react-dom'
import { Clock, MapPin, Users } from 'lucide-react'
import { useStore } from '../store'
import { formatTimeRange } from '../utils/formatTime'

export interface SessionTooltipState {
  sessionId: string
  /** Either `top` (tooltip below block) or `bottom` (tooltip above) is set
   *  for the vertical axis. For the horizontal axis: `left` for normal
   *  positioning, `right` when anchored to the right viewport edge so the
   *  browser guarantees it stays inside. Never both `left` and `right`. */
  position: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
}

interface Props {
  state: SessionTooltipState | null
}

const TOOLTIP_WIDTH = 288

/**
 * Position the tooltip directly above the session block, anchored by its
 * BOTTOM edge so the gap is consistent regardless of tooltip height.
 * Flips below if there isn't enough room above. Horizontally clamped
 * with extra margin to keep the shadow inside the viewport.
 */
export function computeTooltipPosition(rect: DOMRect): {
  top?: number
  bottom?: number
  left: number
} {
  const gap = 6
  const minSpaceAbove = 100  // px — if less than this above the block, flip below

  const placement: { top?: number; bottom?: number } =
    rect.top >= minSpaceAbove
      ? { bottom: window.innerHeight - rect.top + gap }   // above
      : { top: rect.bottom + gap }                         // below

  // Horizontal placement: center on the session block when there's room,
  // but anchor by the appropriate viewport EDGE when near a side. Using
  // `right: 24px` (browser-enforced) instead of a computed `left` near the
  // right edge avoids any scrollbar-gutter ambiguity that would let the
  // tooltip nudge into the gutter.
  const viewportWidth = document.documentElement.clientWidth
  const edgeMargin = 24
  const center = rect.left + rect.width / 2
  const idealLeft = center - TOOLTIP_WIDTH / 2

  let horizontal: { left?: number; right?: number }
  if (idealLeft + TOOLTIP_WIDTH > viewportWidth - edgeMargin) {
    horizontal = { right: edgeMargin }
  } else if (idealLeft < edgeMargin) {
    horizontal = { left: edgeMargin }
  } else {
    horizontal = { left: idealLeft }
  }

  return { ...placement, ...horizontal }
}

export const SessionTooltip: React.FC<Props> = ({ state }) => {
  const { sessions, venues, speakers, sessionTypes, tracks } = useStore()

  if (!state) return null

  const session = sessions.find(s => s.id === state.sessionId)
  if (!session) return null

  const venue = venues.find(v => v.id === session.venueId)
  const sessionType = sessionTypes.find(t => t.id === session.sessionTypeId)
  const speakerList = speakers.filter(s => session.speakerIds?.includes(s.id))
  const trackList = tracks.filter(t => session.trackIds?.includes(t.id))
  const timeRange = formatTimeRange(session.startTime, session.endTime)

  const style: React.CSSProperties = { width: TOOLTIP_WIDTH }
  if (state.position.top !== undefined) style.top = state.position.top
  if (state.position.bottom !== undefined) style.bottom = state.position.bottom
  if (state.position.left !== undefined) style.left = state.position.left
  if (state.position.right !== undefined) style.right = state.position.right

  return createPortal(
    <div
      role="tooltip"
      style={style}
      className="fixed z-[1000] bg-white shadow-xl rounded-lg border border-gray-200 p-3 pointer-events-none"
    >
      <h4 className="font-semibold text-gray-900 text-sm leading-snug mb-2">
        {session.title || '(untitled)'}
      </h4>

      <div className="space-y-1 text-xs text-gray-600">
        {timeRange && (
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400 flex-shrink-0" />
            <span>{timeRange}</span>
          </div>
        )}
        {venue && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{venue.name}</span>
          </div>
        )}
        {speakerList.length > 0 && (
          <div className="flex items-start gap-1.5">
            <Users size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <span>{speakerList.map(s => s.name).join(', ')}</span>
          </div>
        )}
      </div>

      {(sessionType || trackList.length > 0 || (session.gating && session.gating !== 'public')) && (
        <div className="flex flex-wrap items-center gap-1 mt-2.5">
          {sessionType && (
            <span
              className="px-1.5 py-0.5 text-[10px] rounded font-medium"
              style={{
                backgroundColor: `${sessionType.color || '#6366f1'}25`,
                color: sessionType.color || '#6366f1',
              }}
            >
              {sessionType.name}
            </span>
          )}
          {trackList.map(t => (
            <span
              key={t.id}
              className="px-1.5 py-0.5 text-[10px] rounded font-medium"
              style={{
                backgroundColor: `${t.color || '#6366f1'}25`,
                color: t.color || '#6366f1',
              }}
            >
              {t.name}
            </span>
          ))}
          {session.gating === 'invitation_only' && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-amber-100 text-amber-800">
              Invitation only
            </span>
          )}
          {session.gating === 'private' && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded bg-red-100 text-red-800">
              Private
            </span>
          )}
        </div>
      )}
    </div>,
    document.body
  )
}
