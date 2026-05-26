import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  ChevronDown, ChevronRight, Plus, X, Trash, Tag,
  Layers, Sparkles, Calendar, Shield, Building2, Briefcase, ExternalLink,
} from 'lucide-react'
import { useStore } from '../store'

const SESSION_CATEGORIES = ['Session', 'Showcase', 'Activation', 'Networking', 'Other']

const SESSION_CATEGORY_COLORS: Record<string, string> = {
  Session:    'bg-blue-100 text-blue-800',
  Showcase:   'bg-purple-100 text-purple-800',
  Activation: 'bg-teal-100 text-teal-800',
  Networking: 'bg-pink-100 text-pink-800',
  Other:      'bg-gray-100 text-gray-700',
}
const categoryBadge = (cat?: string | null) => {
  if (!cat) return null
  const cls = SESSION_CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-medium uppercase rounded ${cls}`}>{cat}</span>
  )
}

// ============================================================================
// Building blocks
// ============================================================================

/** A collapsible card section with a header bar, item count, and slot. */
const Section: React.FC<{
  title: string
  icon: React.ReactNode
  count?: number
  description?: string
  defaultOpen?: boolean
  children: React.ReactNode
}> = ({ title, icon, count, description, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 border-b border-gray-200 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-indigo-600">{icon}</span>
          <div>
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          {typeof count === 'number' && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}

/**
 * A row representing one editable item. Click the name to edit inline.
 * Supports optional color swatch and category dropdown for entities
 * that need them (Tracks have color, SessionTypes have color + category).
 */
const EditableRow: React.FC<{
  name: string
  color?: string | null
  badge?: React.ReactNode
  meta?: React.ReactNode
  canEditColor?: boolean
  category?: string | null
  categoryOptions?: string[]
  onSave: (name: string, color?: string, category?: string) => void
  onDelete: () => void
}> = ({ name, color, badge, meta, canEditColor, category, categoryOptions, onSave, onDelete }) => {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(name)
  const [draftColor, setDraftColor] = useState(color || '#6366f1')
  const [draftCategory, setDraftCategory] = useState(category || (categoryOptions?.[0] ?? ''))

  const commit = () => {
    const trimmed = draftName.trim()
    if (trimmed) {
      onSave(
        trimmed,
        canEditColor ? draftColor : undefined,
        categoryOptions ? draftCategory : undefined,
      )
    }
    setEditing(false)
  }
  const cancel = () => {
    setDraftName(name)
    setDraftColor(color || '#6366f1')
    setDraftCategory(category || (categoryOptions?.[0] ?? ''))
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 p-2 border border-indigo-300 rounded-md bg-indigo-50">
        {canEditColor && (
          <input
            type="color"
            value={draftColor}
            onChange={e => setDraftColor(e.target.value)}
            className="w-8 h-8 border-0 p-0 bg-transparent cursor-pointer rounded"
          />
        )}
        <input
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          autoFocus
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        />
        {categoryOptions && (
          <select
            value={draftCategory}
            onChange={e => setDraftCategory(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
          >
            {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button onClick={commit} className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Save
        </button>
        <button onClick={cancel} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Cancel">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2 p-2 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition">
      {color && (
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex-1 text-left text-sm text-gray-800 hover:text-indigo-700 cursor-pointer truncate"
        title="Click to edit"
      >
        {name}
      </button>
      {badge}
      {meta && <span className="text-xs text-gray-500 ml-1 truncate max-w-[12rem]">{meta}</span>}
      <button
        onClick={() => onDelete()}
        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
        title="Delete"
      >
        <Trash size={14} />
      </button>
    </div>
  )
}

/** Inline "Add" form, expands when the link is clicked. */
const AddRow: React.FC<{
  label: string
  canEditColor?: boolean
  onAdd: (name: string, color?: string) => void
}> = ({ label, canEditColor, onAdd }) => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')

  const commit = () => {
    if (!name.trim()) return
    onAdd(name.trim(), canEditColor ? color : undefined)
    setName(''); setColor('#6366f1'); setOpen(false)
  }
  const cancel = () => { setName(''); setColor('#6366f1'); setOpen(false) }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
      >
        <Plus size={14} /> {label}
      </button>
    )
  }
  return (
    <div className="mt-3 flex items-center gap-2 p-2 border border-indigo-300 rounded-md bg-indigo-50">
      {canEditColor && (
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-8 h-8 border-0 p-0 bg-transparent cursor-pointer rounded"
        />
      )}
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') cancel()
        }}
        placeholder={`New ${label.replace(/^Add\s+/i, '').toLowerCase()} name`}
        autoFocus
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
      />
      <button onClick={commit} className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700">
        Add
      </button>
      <button onClick={cancel} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Cancel">
        <X size={16} />
      </button>
    </div>
  )
}

// ============================================================================
// Main view
// ============================================================================

export const SettingsView: React.FC = () => {
  const {
    events, currentEventId,
    sessionTypes, tracks, organizations,
    programs, experiences, accessLevels,
    addSessionType, updateSessionType, deleteSessionType,
    addTrack, updateTrack, deleteTrack,
    addProgram, updateProgram, deleteProgram,
    addExperience, updateExperience, deleteExperience,
    addAccessLevel, updateAccessLevel, deleteAccessLevel,
  } = useStore()

  const currentEvent = events.find(e => e.id === currentEventId)

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
        </div>

        {/* ── EVENT ──────────────────────────────────────────────────── */}
        <Section
          title="Active Event"
          icon={<Calendar size={18} />}
          description="Switch events from the picker in the top-left of the header."
        >
          {currentEvent ? (
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-semibold text-gray-900">{currentEvent.name}</span>
              <span className="text-sm text-gray-500">
                {dayjs(currentEvent.startDate).format('MMM D')} – {dayjs(currentEvent.endDate).format('MMM D, YYYY')}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{currentEvent.timezone}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">No event selected.</span>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Editing event details (rename, change dates, change timezone) — coming soon.
          </p>
        </Section>

        {/* ── SESSION TYPES ─────────────────────────────────────────── */}
        <Section
          title="Session Types"
          icon={<Tag size={18} />}
          count={sessionTypes.length}
          description="Formats sessions can take. Color on the calendar comes from the session's first track, not its type."
        >
          <div className="space-y-1.5">
            {sessionTypes.map(st => (
              <EditableRow
                key={st.id}
                name={st.name}
                color={st.color || null}
                category={(st as any).category}
                categoryOptions={SESSION_CATEGORIES}
                badge={categoryBadge((st as any).category)}
                canEditColor
                onSave={(name, color, category) => updateSessionType(st.id, { name, color, category } as any)}
                onDelete={() => deleteSessionType(st.id)}
              />
            ))}
          </div>
          <AddRow label="Add session type" canEditColor onAdd={(name, color) => addSessionType({ name, color })} />
        </Section>

        {/* ── TRACKS ────────────────────────────────────────────────── */}
        <Section
          title="Tracks"
          icon={<Layers size={18} />}
          count={tracks.length}
          description="Topical themes attendees can filter by. Track color drives session card colors."
        >
          <div className="space-y-1.5">
            {tracks.map(t => (
              <EditableRow
                key={t.id}
                name={t.name}
                color={t.color || null}
                canEditColor
                onSave={(name, color) => updateTrack(t.id, { name, color })}
                onDelete={() => deleteTrack(t.id)}
              />
            ))}
          </div>
          <AddRow label="Add track" canEditColor onAdd={(name, color) => addTrack({ name, color })} />
        </Section>

        {/* ── PROGRAMS ──────────────────────────────────────────────── */}
        <Section
          title="Programs"
          icon={<Briefcase size={18} />}
          count={programs.length}
          description="Curated series within the conference (Sloss Tech Dev, Next In Tech, etc.). Host/presenter relationships are edited via SQL today."
        >
          <div className="space-y-1.5">
            {programs.map(p => (
              <EditableRow
                key={p.id}
                name={p.name}
                onSave={(name) => updateProgram(p.id, { name })}
                onDelete={() => deleteProgram(p.id)}
              />
            ))}
          </div>
          <AddRow label="Add program" onAdd={(name) => addProgram({ name })} />
        </Section>

        {/* ── ACCESS LEVELS ─────────────────────────────────────────── */}
        <Section
          title="Access Levels"
          icon={<Shield size={18} />}
          count={accessLevels.length}
          description="Badge tiers that gate session access (General, VIP, Speaker, etc.)."
        >
          <div className="space-y-1.5">
            {accessLevels.map(a => (
              <EditableRow
                key={a.id}
                name={a.name}
                onSave={(name) => updateAccessLevel(a.id, { name })}
                onDelete={() => deleteAccessLevel(a.id)}
              />
            ))}
          </div>
          <AddRow label="Add access level" onAdd={(name) => addAccessLevel({ name })} />
        </Section>

        {/* ── EXPERIENCES ───────────────────────────────────────────── */}
        <Section
          title="Experiences"
          icon={<Sparkles size={18} />}
          count={experiences.length}
          defaultOpen={experiences.length > 0}
          description="Branded experience areas (currently unused — programs cover the same ground for now)."
        >
          <div className="space-y-1.5">
            {experiences.map(x => (
              <EditableRow
                key={x.id}
                name={x.name}
                onSave={(name) => updateExperience(x.id, { name })}
                onDelete={() => deleteExperience(x.id)}
              />
            ))}
          </div>
          <AddRow label="Add experience" onAdd={(name) => addExperience({ name })} />
        </Section>

        {/* ── ORGANIZATIONS (lives on its own page) ─────────────────── */}
        <Section
          title="Organizations"
          icon={<Building2 size={18} />}
          count={organizations.length}
          description="Sponsors and partners. Full management — tier, cash, in-kind, notes — lives on its own page."
        >
          <Link
            to="/organizations"
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Manage organizations
            <ExternalLink size={14} />
          </Link>
        </Section>

      </div>
    </div>
  )
}
