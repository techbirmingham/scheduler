import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  ChevronDown, ChevronRight, Plus, X, Trash, Tag,
  Layers, Sparkles, Calendar, Shield, Building2, Briefcase, ExternalLink,
  History, RotateCcw,
} from 'lucide-react'
import { useStore, useIsAdmin, type AuditEntry } from '../store'
import { useConfirm } from '../components/ConfirmDialog'
import { ProgramModal } from '../components/ProgramModal'

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
  canDelete?: boolean
  onSave: (name: string, color?: string, category?: string) => void
  onDelete: () => void
}> = ({ name, color, badge, meta, canEditColor, category, categoryOptions, canDelete = true, onSave, onDelete }) => {
  const confirm = useConfirm()
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
      {canDelete && (
        <button
          onClick={async () => {
            const ok = await confirm({
              title: `Delete "${name}"?`,
              confirmLabel: 'Delete',
              destructive: true,
            })
            if (ok) onDelete()
          }}
          className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
          title="Delete"
        >
          <Trash size={14} />
        </button>
      )}
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
// Change history
// ============================================================================

// Metadata fields skipped when computing the "what changed" diff for UPDATEs.
const DIFF_IGNORE_FIELDS = new Set(['updated_at', 'updated_by', 'created_at', 'created_by'])

// Lightweight prettifier — keeps the diff column readable when values are
// long strings, arrays, or JSON. We don't need full JSON formatting here.
function formatValue(v: any): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return v.length === 0 ? '[]' : `[${v.length} items]`
  if (typeof v === 'object') return JSON.stringify(v)
  const s = String(v)
  return s.length > 60 ? s.slice(0, 60) + '…' : s
}

function displayName(entry: AuditEntry): string {
  const d = entry.newData ?? entry.oldData ?? {}
  return d.title || d.name || d.email || '(unnamed)'
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

interface DiffField { field: string; from: any; to: any }
function diffFields(oldData: any, newData: any): DiffField[] {
  const o = oldData ?? {}
  const n = newData ?? {}
  const keys = new Set([...Object.keys(o), ...Object.keys(n)])
  const out: DiffField[] = []
  for (const k of keys) {
    if (DIFF_IGNORE_FIELDS.has(k)) continue
    if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) {
      out.push({ field: k, from: o[k], to: n[k] })
    }
  }
  return out
}

const ACTION_BADGES: Record<string, string> = {
  UPDATE: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-red-100 text-red-800',
  INSERT: 'bg-green-100 text-green-800',
}

const HistoryRow: React.FC<{
  entry: AuditEntry
  onRestore: (entry: AuditEntry) => void
}> = ({ entry, onRestore }) => {
  const diffs = entry.action === 'UPDATE'
    ? diffFields(entry.oldData, entry.newData)
    : []
  const shown = diffs.slice(0, 2)
  const extra = diffs.length - shown.length

  return (
    <div className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded ${ACTION_BADGES[entry.action] ?? 'bg-gray-100 text-gray-700'}`}>
          {entry.action}
        </span>
        <span className="text-xs text-gray-500 font-mono">{entry.tableName}</span>
        <span className="text-sm font-medium text-gray-800 truncate flex-1 min-w-0">{displayName(entry)}</span>
        <span className="text-xs text-gray-500" title={new Date(entry.changedAt).toLocaleString()}>
          {relativeTime(entry.changedAt)}
        </span>
        <button
          onClick={() => onRestore(entry)}
          className="ml-1 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-gray-300 text-gray-700 hover:bg-white hover:border-indigo-400 hover:text-indigo-700"
          title="Restore this version"
        >
          <RotateCcw size={12} />
          Restore
        </button>
      </div>
      {entry.changedByEmail && (
        <div className="text-xs text-gray-500 mt-1">by {entry.changedByEmail}</div>
      )}
      {entry.action === 'UPDATE' && diffs.length > 0 && (
        <div className="mt-2 text-xs space-y-0.5">
          {shown.map(d => (
            <div key={d.field} className="text-gray-600">
              <span className="font-medium text-gray-700">{d.field}:</span>{' '}
              <span className="text-red-600 line-through">{formatValue(d.from)}</span>{' → '}
              <span className="text-green-700">{formatValue(d.to)}</span>
            </div>
          ))}
          {extra > 0 && (
            <div className="text-gray-400">+ {extra} more field{extra === 1 ? '' : 's'} changed</div>
          )}
        </div>
      )}
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
    auditLog, fetchAuditLog, restoreFromAudit,
  } = useStore()
  const isAdmin = useIsAdmin()
  const confirm = useConfirm()

  // Program editor — opened from the Programs row. null id means "create new".
  const [programModalOpen, setProgramModalOpen] = useState(false)
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null)
  const openProgramModal = (id: string | null) => {
    setEditingProgramId(id)
    setProgramModalOpen(true)
  }

  const currentEvent = events.find(e => e.id === currentEventId)

  // Load audit log on mount when admin. Editors don't see this section, so
  // skip the fetch entirely for them.
  React.useEffect(() => {
    if (isAdmin) fetchAuditLog()
  }, [isAdmin, fetchAuditLog])

  const handleRestore = async (entry: AuditEntry) => {
    const title = entry.action === 'DELETE'
      ? `Restore "${displayName(entry)}"?`
      : `Revert changes to "${displayName(entry)}"?`
    const body = entry.action === 'DELETE'
      ? <>This re-creates the {entry.tableName} row from before it was deleted.</>
      : <>This overwrites the current row with the state from <strong>{relativeTime(entry.changedAt)}</strong>. Any edits made after this entry will be lost.</>
    const ok = await confirm({
      title,
      body,
      confirmLabel: 'Restore',
      destructive: false,
    })
    if (!ok) return
    const result = await restoreFromAudit(entry)
    if (!result.success) {
      await confirm({
        title: 'Restore failed',
        body: <span className="text-red-700">{result.error ?? 'Unknown error'}</span>,
        confirmLabel: 'OK',
        cancelLabel: '',
      })
    }
  }

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
                canDelete={isAdmin}
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
                canDelete={isAdmin}
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
          description="Curated series within the conference (Sloss Tech Dev, Next In Tech, etc.). Click a program to edit its name and host/presenter/sponsor orgs."
        >
          <div className="space-y-1.5">
            {programs.map(p => {
              const hostCount = (p.hosted_by_org_ids ?? []).length
              const presenterCount = (p.presented_by_org_ids ?? []).length
              const sponsorCount = (p.sponsor_org_ids ?? []).length
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openProgramModal(p.id)}
                  className="w-full flex items-center gap-2 p-2 border border-gray-200 rounded-md hover:border-gray-300 hover:bg-gray-50 transition text-left"
                >
                  <span className="flex-1 text-sm text-gray-800 truncate">{p.name}</span>
                  <div className="flex items-center gap-1 flex-shrink-0 text-[10px]">
                    {hostCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded font-medium bg-indigo-50 text-indigo-700" title="Host orgs">
                        {hostCount} host{hostCount === 1 ? '' : 's'}
                      </span>
                    )}
                    {presenterCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded font-medium bg-purple-50 text-purple-700" title="Presenter orgs">
                        {presenterCount} presenter{presenterCount === 1 ? '' : 's'}
                      </span>
                    )}
                    {sponsorCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-600" title="Sponsor orgs">
                        {sponsorCount} sponsor{sponsorCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => openProgramModal(null)}
            className="mt-3 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
          >
            <Plus size={14} /> Add program
          </button>
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
                canDelete={isAdmin}
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
                canDelete={isAdmin}
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

        {/* ── CHANGE HISTORY (admin only) ────────────────────────────── */}
        {isAdmin && (
          <Section
            title="Change History"
            icon={<History size={18} />}
            count={auditLog.length}
            defaultOpen={false}
            description="Recent edits and deletions across the event. Restore an entry to roll back an accidental change."
          >
            {auditLog.length === 0 ? (
              <p className="text-sm text-gray-500">No recent changes recorded.</p>
            ) : (
              <div className="space-y-2">
                {auditLog.map(entry => (
                  <HistoryRow key={entry.id} entry={entry} onRestore={handleRestore} />
                ))}
                <button
                  onClick={() => fetchAuditLog(auditLog.length + 50)}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Load older changes
                </button>
              </div>
            )}
          </Section>
        )}

      </div>

      <ProgramModal
        isOpen={programModalOpen}
        onClose={() => { setProgramModalOpen(false); setEditingProgramId(null) }}
        programId={editingProgramId}
      />
    </div>
  )
}
