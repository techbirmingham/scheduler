import React, { useState, useEffect } from 'react'
import { Grid, List, Search, Plus, Edit, Trash, X } from 'lucide-react'
import { useStore, useIsAdmin } from '../store'
import { useConfirm } from '../components/ConfirmDialog'
import type { Organization } from '../types'

// ============================================================================
// Tier / palette helpers (mirrors what Settings uses)
// ============================================================================

const ORG_TIERS: { value: string; label: string }[] = [
  { value: 'Presenting', label: 'Presenting ($250K+)' },
  { value: 'Partner',    label: 'Partner ($100K–$249K)' },
  { value: 'Steel',      label: 'Steel ($50K–$99K)' },
  { value: 'Iron',       label: 'Iron ($20K–$49K)' },
  { value: 'Carbon',     label: 'Carbon ($7,500–$19,999)' },
  { value: 'Nickel',     label: 'Nickel ($2,500–$7,499)' },
  { value: 'General',    label: 'General (< $2,500)' },
  { value: 'Community',  label: 'Community (non-package)' },
  { value: 'Organizer',  label: 'Organizer (parent org)' },
  { value: 'Media',      label: 'Media (press/podcast partner)' },
]

const TIER_BG: Record<string, string> = {
  Presenting: 'bg-purple-100 text-purple-800',
  Partner:    'bg-fuchsia-100 text-fuchsia-800',
  Steel:      'bg-slate-200 text-slate-800',
  Iron:       'bg-zinc-200 text-zinc-800',
  Carbon:     'bg-gray-800 text-white',
  Nickel:     'bg-amber-100 text-amber-800',
  General:    'bg-gray-100 text-gray-700',
  Community:  'bg-green-100 text-green-800',
  Organizer:  'bg-indigo-100 text-indigo-700',
  Media:      'bg-pink-100 text-pink-800',
}
const TierBadge: React.FC<{ tier?: string | null }> = ({ tier }) => {
  if (!tier) return null
  const cls = TIER_BG[tier] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded ${cls}`}>{tier}</span>
  )
}

const fmtMoney = (n?: number | null) =>
  typeof n === 'number' ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'

// ============================================================================
// Modal (mirrors SpeakerModal in shape, fields specific to organizations)
// ============================================================================

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  orgId: string | null
}

// Visual treatment for role chips in the Sponsorship surface section.
const SURFACE_ROLE_CLASS: Record<string, string> = {
  Host:      'bg-indigo-100 text-indigo-700',
  Presenter: 'bg-purple-100 text-purple-700',
  Sponsor:   'bg-gray-100 text-gray-600',
}

const OrganizationModal: React.FC<ModalProps> = ({ isOpen, onClose, orgId }) => {
  const { organizations, programs, sessions, addOrganization, updateOrganization } = useStore()
  const existing = orgId ? organizations.find(o => o.id === orgId) : null

  // Compute everywhere this org appears across the event — Programs and
  // Sessions in any of the host / presenter / sponsor roles. Read-only;
  // editing happens in the respective entity's own modal.
  const surface = React.useMemo(() => {
    if (!orgId) return { programs: [], sessions: [] }

    const programRows = programs
      .map(p => {
        const roles: string[] = []
        if (p.hosted_by_org_ids?.includes(orgId)) roles.push('Host')
        if (p.presented_by_org_ids?.includes(orgId)) roles.push('Presenter')
        if (p.sponsor_org_ids?.includes(orgId)) roles.push('Sponsor')
        return roles.length > 0 ? { id: p.id, name: p.name, roles } : null
      })
      .filter((r): r is { id: string; name: string; roles: string[] } => r !== null)

    const sessionRows = sessions
      .map(s => {
        const roles: string[] = []
        if (s.hosted_by_org_ids?.includes(orgId)) roles.push('Host')
        if (s.presented_by_org_ids?.includes(orgId)) roles.push('Presenter')
        if (s.organizationIds?.includes(orgId)) roles.push('Sponsor')
        return roles.length > 0
          ? { id: s.id, name: s.title || '(untitled)', date: s.date, roles }
          : null
      })
      .filter((r): r is { id: string; name: string; date?: string; roles: string[] } => r !== null)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

    return { programs: programRows, sessions: sessionRows }
  }, [orgId, programs, sessions])

  const [name, setName] = useState('')
  const [tier, setTier] = useState('')
  const [cashStr, setCashStr] = useState('')
  const [inKindStr, setInKindStr] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (existing) {
      const ex = existing as any
      setName(existing.name)
      setTier(ex.tier ?? '')
      setCashStr(ex.cash_amount != null ? String(ex.cash_amount) : '')
      setInKindStr(ex.in_kind_amount != null ? String(ex.in_kind_amount) : '')
      setNotes(ex.notes ?? '')
    } else {
      setName(''); setTier(''); setCashStr(''); setInKindStr(''); setNotes('')
    }
  }, [existing])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        document.querySelector<HTMLFormElement>('form#org-form')?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const parseAmount = (s: string): number | null => {
    if (!s.trim()) return null
    const n = Number(s.replace(/[$,\s]/g, ''))
    return Number.isFinite(n) ? n : null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const payload: any = {
      name: trimmed,
      tier: tier || null,
      cash_amount: parseAmount(cashStr),
      in_kind_amount: parseAmount(inKindStr),
      notes: notes.trim() || null,
    }
    if (orgId) {
      updateOrganization(orgId, payload)
    } else {
      addOrganization(payload)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {orgId ? 'Edit Organization' : 'Add Organization'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form id="org-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Organization name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
            <select
              value={tier}
              onChange={e => setTier(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">— No tier —</option>
              {ORG_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-sm text-gray-400">$</span>
                <input
                  value={cashStr}
                  onChange={e => setCashStr(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-md tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">In-kind</label>
              <div className="relative">
                <span className="absolute left-2 top-2 text-sm text-gray-400">$</span>
                <input
                  value={inKindStr}
                  onChange={e => setInKindStr(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-md tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
              <div className="px-2 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-200 tabular-nums">
                {fmtMoney((parseAmount(cashStr) ?? 0) + (parseAmount(inKindStr) ?? 0))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="What this org sponsors, special arrangements, contacts, etc."
            />
          </div>

          {orgId && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                Sponsorship surface
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">
                Everywhere this organization appears across the event. Read-only —
                edit relationships in the relevant program or session.
              </p>

              {surface.programs.length === 0 && surface.sessions.length === 0 ? (
                <p className="text-sm text-gray-500">Not attached to any programs or sessions yet.</p>
              ) : (
                <div className="space-y-3">
                  {surface.programs.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Programs ({surface.programs.length})
                      </div>
                      <div className="space-y-1">
                        {surface.programs.map(p => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 text-sm py-1 px-2 bg-gray-50 rounded"
                          >
                            <span className="flex-1 truncate text-gray-800">{p.name}</span>
                            {p.roles.map(r => (
                              <span
                                key={r}
                                className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded ${SURFACE_ROLE_CLASS[r] ?? 'bg-gray-100 text-gray-600'}`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {surface.sessions.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        Sessions ({surface.sessions.length})
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {surface.sessions.map(s => (
                          <div
                            key={s.id}
                            className="flex items-center gap-2 text-sm py-1 px-2 bg-gray-50 rounded"
                          >
                            <span className="flex-1 truncate text-gray-800">{s.name}</span>
                            {s.date && (
                              <span className="text-[10px] text-gray-500 tabular-nums whitespace-nowrap">
                                {s.date}
                              </span>
                            )}
                            {s.roles.map(r => (
                              <span
                                key={r}
                                className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded ${SURFACE_ROLE_CLASS[r] ?? 'bg-gray-100 text-gray-600'}`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
            >
              {orgId ? 'Save Changes' : 'Add Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// Main view
// ============================================================================

export const OrganizationsView: React.FC = () => {
  const { organizations, sessions, deleteOrganization } = useStore()
  const isAdmin = useIsAdmin()
  const confirm = useConfirm()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Sort by tier (per ORG_TIERS order), then by name.
  const sorted = [...organizations].sort((a, b) => {
    const ai = ORG_TIERS.findIndex(t => t.value === ((a as any).tier || ''))
    const bi = ORG_TIERS.findIndex(t => t.value === ((b as any).tier || ''))
    const aRank = ai === -1 ? 999 : ai
    const bRank = bi === -1 ? 999 : bi
    if (aRank !== bRank) return aRank - bRank
    return a.name.localeCompare(b.name)
  })

  const q = search.trim().toLowerCase()
  const filtered = q
    ? sorted.filter(o =>
        o.name.toLowerCase().includes(q) ||
        ((o as any).tier ?? '').toLowerCase().includes(q) ||
        ((o as any).notes ?? '').toLowerCase().includes(q),
      )
    : sorted

  // Sessions an org is associated with (any role).
  const sessionsForOrg = (orgId: string) =>
    sessions.filter(s => {
      const ids = ([] as string[])
        .concat((s as any).hosted_by_org_ids ?? [])
        .concat((s as any).presented_by_org_ids ?? [])
        .concat(s.organizationIds ?? [])
      return ids.includes(orgId)
    })

  const handleAddClick = () => { setEditingId(null); setModalOpen(true) }
  const handleEditClick = (id: string) => { setEditingId(id); setModalOpen(true) }
  const handleDeleteClick = async (e: React.MouseEvent, org: Organization) => {
    e.stopPropagation()
    const count = sessionsForOrg(org.id).length
    const ok = await confirm({
      title: `Delete "${org.name}"?`,
      body: count > 0
        ? <>This organization is referenced by <strong>{count} session{count === 1 ? '' : 's'}</strong>. Deleting will remove it from those sessions.</>
        : undefined,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) deleteOrganization(org.id)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Organizations</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, tier, or notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <List size={16} />
            </button>
          </div>
          <button
            onClick={handleAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Add Organization
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow">
          <div className="text-center p-6">
            <p className="text-gray-500 mb-4">
              {q ? `No organizations match "${search}".` : 'No organizations yet.'}
            </p>
            <button
              onClick={handleAddClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Add Organization
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min overflow-y-auto pb-4">
          {filtered.map(o => {
            const ex = o as any
            const sessCount = sessionsForOrg(o.id).length
            const cash = ex.cash_amount as number | null | undefined
            const inKindAmt = ex.in_kind_amount as number | null | undefined
            const total = (cash ?? 0) + (inKindAmt ?? 0)
            const hasInKind = !!ex.in_kind || (inKindAmt != null && inKindAmt >= 0)
            return (
              <div
                key={o.id}
                onClick={() => handleEditClick(o.id)}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition flex flex-col min-h-[10rem]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-gray-900 leading-snug">{o.name}</h3>
                  {isAdmin && (
                    <button
                      onClick={e => handleDeleteClick(e, o)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <TierBadge tier={ex.tier} />
                  {hasInKind && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase rounded border border-gray-300 text-gray-600">
                      In-kind
                    </span>
                  )}
                </div>
                {(cash != null || inKindAmt != null) && (
                  <div className="text-sm tabular-nums text-gray-700 mb-2">
                    {fmtMoney(total)}
                    <span className="text-xs text-gray-400 ml-1">
                      ({fmtMoney(cash)} cash · {fmtMoney(inKindAmt)} in-kind)
                    </span>
                  </div>
                )}
                {ex.notes && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{ex.notes}</p>
                )}
                <div className="mt-auto text-xs text-gray-400">
                  {sessCount > 0 ? `${sessCount} session${sessCount === 1 ? '' : 's'}` : 'No sessions'}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow flex-1 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">In-kind</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(o => {
                const ex = o as any
                const sessCount = sessionsForOrg(o.id).length
                const cash = ex.cash_amount as number | null | undefined
                const inKindAmt = ex.in_kind_amount as number | null | undefined
                return (
                  <tr
                    key={o.id}
                    onClick={() => handleEditClick(o.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{o.name}</td>
                    <td className="px-4 py-3"><TierBadge tier={ex.tier} /></td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600 tabular-nums">{fmtMoney(cash)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600 tabular-nums">{fmtMoney(inKindAmt)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 tabular-nums">{fmtMoney((cash ?? 0) + (inKindAmt ?? 0))}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{ex.notes ?? ''}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-500 tabular-nums">{sessCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleEditClick(o.id) }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={e => handleDeleteClick(e, o)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <OrganizationModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditingId(null) }}
          orgId={editingId}
        />
      )}
    </div>
  )
}
