// src/components/EventPicker.tsx
import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import dayjs from 'dayjs'
import { useStore } from '../store'

// Dropdown in the top nav showing the active event and letting the
// user switch between events the team has access to. Speakers are
// global, but every other entity is scoped to the active event, so
// switching here triggers a refetch via store.setCurrentEventId.
export const EventPicker: React.FC = () => {
  const events           = useStore(s => s.events)
  const currentEventId   = useStore(s => s.currentEventId)
  const setCurrentEventId = useStore(s => s.setCurrentEventId)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = events.find(e => e.id === currentEventId)
  if (!current) {
    return <span className="text-sm text-gray-400 italic">No event</span>
  }

  const sorted = [...events].sort((a, b) => b.startDate.localeCompare(a.startDate))

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center space-x-2 -ml-3 px-3 py-1.5 rounded-md hover:bg-gray-100 transition"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-semibold text-gray-800">{current.name}</span>
        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 w-72 bg-white rounded-md shadow-lg ring-1 ring-black/5 z-50 py-1"
        >
          <div className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wide">Events</div>
          {sorted.map(e => (
            <button
              key={e.id}
              onClick={() => {
                if (e.id !== currentEventId) setCurrentEventId(e.id)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
              role="option"
              aria-selected={e.id === currentEventId}
            >
              <div className="min-w-0">
                <div className="font-medium text-sm text-gray-800 truncate">{e.name}</div>
                <div className="text-xs text-gray-500">
                  {dayjs(e.startDate).format('MMM D')} – {dayjs(e.endDate).format('MMM D, YYYY')}
                </div>
              </div>
              {e.id === currentEventId && (
                <Check size={16} className="text-indigo-600 flex-shrink-0 ml-2" />
              )}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              disabled
              className="w-full text-left px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
              title="Coming soon"
            >
              + Create new event (coming soon)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
