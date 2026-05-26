// src/components/DateTabs.tsx
//
// Horizontal strip of date chips for fast 1-click navigation between event
// days. Lives above DateNavigator in the date-aware views (Grid, Timeline).
// The picker stays around for the rare "jump outside the event range" case;
// these chips cover the common workflow of switching between days.

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

interface DateTabsProps {
  /** Inclusive ISO date strings (YYYY-MM-DD) that bound the event. */
  startDate?: string
  endDate?: string
  /** Currently-selected ISO date. */
  selectedDate: string
  onSelectDate: (date: string) => void
}

function daysBetween(start: string, end: string): string[] {
  const days: string[] = []
  let cursor = dayjs(start)
  const last = dayjs(end)
  // Guard against an inverted range or absurd input — cap at 31 days so a
  // typo in the event row can't render a thousand chips.
  let safety = 0
  while (cursor.isBefore(last) || cursor.isSame(last, 'day')) {
    days.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
    if (++safety > 31) break
  }
  return days
}

export const DateTabs: React.FC<DateTabsProps> = ({
  startDate, endDate, selectedDate, onSelectDate,
}) => {
  if (!startDate || !endDate) return null
  const days = daysBetween(startDate, endDate)
  if (days.length < 2) return null  // single-day event — strip adds no value

  // Chevrons step ±1 day, clamped to the event range. Disabled at the
  // bounds so they don't navigate past the visible chips.
  const goPrev = () => {
    const prev = dayjs(selectedDate).subtract(1, 'day')
    if (prev.isSameOrAfter(dayjs(startDate))) {
      onSelectDate(prev.format('YYYY-MM-DD'))
    }
  }
  const goNext = () => {
    const next = dayjs(selectedDate).add(1, 'day')
    if (next.isSameOrBefore(dayjs(endDate))) {
      onSelectDate(next.format('YYYY-MM-DD'))
    }
  }
  const isPrevDisabled = dayjs(selectedDate).isSameOrBefore(dayjs(startDate))
  const isNextDisabled = dayjs(selectedDate).isSameOrAfter(dayjs(endDate))

  const chevronClass = (disabled: boolean) =>
    `flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md border transition ${
      disabled
        ? 'border-gray-100 text-gray-300 cursor-not-allowed'
        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
    }`

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto">
      {days.map(day => {
        const d = dayjs(day)
        const isActive = day === selectedDate
        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelectDate(day)}
            className={`flex-shrink-0 inline-flex items-baseline gap-1 px-2.5 py-1 rounded-md border text-xs transition ${
              isActive
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
            title={d.format('dddd, MMMM D, YYYY')}
            aria-pressed={isActive}
          >
            <span className={`font-semibold uppercase tracking-wide ${isActive ? '' : 'text-gray-500'}`}>
              {d.format('ddd')}
            </span>
            <span className="font-medium tabular-nums">{d.format('M/D')}</span>
          </button>
        )
      })}
      {/* Chevrons grouped after the chips — same mouse position for fast
          back-and-forth scrubbing. */}
      <div className="flex items-center gap-1 ml-1">
        <button
          type="button"
          onClick={goPrev}
          disabled={isPrevDisabled}
          className={chevronClass(isPrevDisabled)}
          title="Previous day"
          aria-label="Previous day"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={isNextDisabled}
          className={chevronClass(isNextDisabled)}
          title="Next day"
          aria-label="Next day"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
