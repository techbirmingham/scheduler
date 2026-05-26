import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Edit,
  Plus,
  Trash2
} from 'lucide-react'
import { useStore, useIsAdmin } from '../store'
import { useConfirm } from './ConfirmDialog'

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
}

interface FilterSectionProps {
  title: string
  items: { id: string; name: string; color?: string }[]
  onAddItem: (name: string) => void
  onEditItem: (id: string, newName: string) => void
  onDeleteItem: (id: string) => void
  onSelectItem: (id: string) => void
  /** Set this category's filter to just this id (used by the "Only" link). */
  onSelectOnlyItem: (id: string) => void
  selectedItems: string[]
  canDelete: boolean
  isOpen: boolean
  onToggleOpen: () => void
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onSelectItem,
  onSelectOnlyItem,
  selectedItems,
  canDelete,
  isOpen,
  onToggleOpen,
}) => {
  const confirm = useConfirm()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newItemValue, setNewItemValue] = useState('')

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditValue(name)
  }
  const saveEdit = (id: string) => {
    if (editValue.trim()) onEditItem(id, editValue.trim())
    setEditingId(null)
  }
  const saveNew = () => {
    if (newItemValue.trim()) onAddItem(newItemValue.trim())
    setNewItemValue('')
    setIsAddingNew(false)
  }

  return (
    <div className="mb-4">
      <div
        className="flex items-center mb-2 cursor-pointer"
        onClick={onToggleOpen}
      >
        {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
        <h3 className="ml-1 text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {isOpen && (
        <div className="ml-6 space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between group"
            >
              {editingId === item.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(item.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveEdit(item.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="flex-1 py-1 px-2 border rounded border-gray-300"
                  autoFocus
                />
              ) : (
                <>
                  <div className="flex items-center flex-1">
                    {item.color && (
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                    <input
                      type="checkbox"
                      id={`${title}-${item.id}`}
                      checked={selectedItems.includes(item.id)}
                      onChange={() => onSelectItem(item.id)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`${title}-${item.id}`}
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      {item.name}
                    </label>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onSelectOnlyItem(item.id)
                      }}
                      className="px-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      title={`Show only ${item.name}`}
                    >
                      Only
                    </button>
                    <button
                      onClick={() => startEdit(item.id, item.name)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit size={14}/>
                    </button>
                    {canDelete && (
                      <button
                        onClick={async e => {
                          e.stopPropagation()
                          const ok = await confirm({
                            title: `Delete "${item.name}"?`,
                            confirmLabel: 'Delete',
                            destructive: true,
                          })
                          if (ok) onDeleteItem(item.id)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {isAddingNew ? (
            <input
              type="text"
              value={newItemValue}
              onChange={e => setNewItemValue(e.target.value)}
              onBlur={saveNew}
              onKeyDown={e => {
                if (e.key === 'Enter') saveNew()
                if (e.key === 'Escape') setIsAddingNew(false)
              }}
              placeholder={`New ${title.slice(0, -1)}`}
              className="w-full py-1 px-2 border rounded border-gray-300"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={14} className="mr-1"/> Add Option
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Titles used as keys for the per-section open/closed state, kept in one
// place so the Collapse/Expand-all toggle stays in sync with the sections
// actually rendered below.
const SECTION_TITLES = [
  'Venues',
  'Session Types',
  'Tracks',
  'Partner Organizations',
  'Programs',
  'Experiences',
  'Access Levels',
] as const

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar
}) => {
  const {
    venues,
    sessionTypes,
    tracks,
    organizations,
    programs,
    experiences,
    accessLevels,
    selectedFilters,
    toggleFilter,
    selectOnlyFilter,
    clearFilters,
    addVenue,
    updateVenue,
    deleteVenue,
    addSessionType,
    updateSessionType,
    deleteSessionType,
    addTrack,
    updateTrack,
    deleteTrack,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    addProgram,
    updateProgram,
    deleteProgram,
    addExperience,
    updateExperience,
    deleteExperience,
    addAccessLevel,
    updateAccessLevel,
    deleteAccessLevel
  } = useStore()
  const isAdmin = useIsAdmin()

  // Per-section open state lives here (not inside FilterSection) so a single
  // toggle can flip all 7 sections at once. Sections default to open.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const isSectionOpen = (title: string) => openSections[title] ?? true
  const toggleSection = (title: string) =>
    setOpenSections(s => ({ ...s, [title]: !isSectionOpen(title) }))
  const allOpen = SECTION_TITLES.every(t => isSectionOpen(t))
  const toggleAll = () => {
    const next = !allOpen
    setOpenSections(SECTION_TITLES.reduce((acc, t) => ({ ...acc, [t]: next }), {}))
  }

  // Count every selected filter across all categories so the header can
  // show "N active · Clear" when there's something to clear.
  const totalActive = Object.values(selectedFilters).reduce(
    (sum, arr) => sum + arr.length,
    0,
  )

  // Single floating toggle button — same vertical position in both states.
  // When open: sits flush against the sidebar's right edge.
  // When closed: sits flush against the viewport's left edge.
  // The `left-*` class must match the sidebar's width below so the button
  // stays anchored to the edge.
  const ToggleHandle = (
    <button
      onClick={toggleSidebar}
      aria-label={isOpen ? 'Collapse filters' : 'Expand filters'}
      title={isOpen ? 'Collapse filters' : 'Expand filters'}
      className={`fixed top-20 z-30 bg-white border border-gray-200 p-2 shadow-md transition-all hover:bg-gray-50 ${
        isOpen ? 'left-80 -translate-x-full rounded-l-md' : 'left-0 rounded-r-md'
      }`}
    >
      {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  )

  if (!isOpen) {
    return ToggleHandle
  }

  return (
    <>
      {ToggleHandle}
      <div className="flex flex-col h-full w-80 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Filters</h2>
          {/* Meta row — always rendered so the filter list below doesn't
              jitter when the active count changes. Clear is greyed out
              when there's nothing to clear; Collapse/Expand all is always
              active. Text labels (instead of icons) because the previous
              icon sat behind the floating sidebar-collapse handle. */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            <span className={totalActive > 0 ? 'text-gray-500' : 'text-gray-400'}>
              {totalActive} active
            </span>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => clearFilters()}
              disabled={totalActive === 0}
              className={`font-medium ${
                totalActive > 0
                  ? 'text-indigo-600 hover:text-indigo-800 cursor-pointer'
                  : 'text-gray-300 cursor-default'
              }`}
            >
              Clear
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={toggleAll}
              className="font-medium text-indigo-600 hover:text-indigo-800"
            >
              {allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
        </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <FilterSection
          title="Venues"
          items={venues}
          onAddItem={name => addVenue({ name })}
          onEditItem={(id, name) => updateVenue(id, { name })}
          onDeleteItem={deleteVenue}
          onSelectItem={id => toggleFilter('venues', id)}
          onSelectOnlyItem={id => selectOnlyFilter('venues', id)}
          selectedItems={selectedFilters.venues}
          canDelete={isAdmin}
          isOpen={isSectionOpen('Venues')}
          onToggleOpen={() => toggleSection('Venues')}
        />

        <FilterSection
          title="Session Types"
          items={sessionTypes}
          onAddItem={name => addSessionType({ name })}
          onEditItem={(id, name) => updateSessionType(id, { name })}
          onDeleteItem={deleteSessionType}
          onSelectItem={id => toggleFilter('sessionTypes', id)}
          onSelectOnlyItem={id => selectOnlyFilter('sessionTypes', id)}
          selectedItems={selectedFilters.sessionTypes}
          canDelete={isAdmin}
          isOpen={isSectionOpen('Session Types')}
          onToggleOpen={() => toggleSection('Session Types')}
        />

        <FilterSection
          title="Tracks"
          items={tracks}
          onAddItem={name => addTrack({ name })}
          onEditItem={(id, name) => updateTrack(id, { name })}
          onDeleteItem={deleteTrack}
          onSelectItem={id => toggleFilter('tracks', id)}
          onSelectOnlyItem={id => selectOnlyFilter('tracks', id)}
          selectedItems={selectedFilters.tracks}
          canDelete={isAdmin}
          isOpen={isSectionOpen('Tracks')}
          onToggleOpen={() => toggleSection('Tracks')}
        />

        <FilterSection
          title="Partner Organizations"
          items={organizations}
          onAddItem={name => addOrganization({ name })}
          onEditItem={(id, name) => updateOrganization(id, { name })}
          onDeleteItem={deleteOrganization}
          onSelectItem={id => toggleFilter('organizations', id)}
          onSelectOnlyItem={id => selectOnlyFilter('organizations', id)}
          selectedItems={selectedFilters.organizations}
          canDelete={isAdmin}
          isOpen={isSectionOpen('Partner Organizations')}
          onToggleOpen={() => toggleSection('Partner Organizations')}
        />

        <FilterSection
          title="Programs"
          items={programs}
          onAddItem={name => addProgram({ name })}
          onEditItem={(id, name) => updateProgram(id, { name })}
          onDeleteItem={deleteProgram}
          onSelectItem={id => toggleFilter('programs', id)}
          onSelectOnlyItem={id => selectOnlyFilter('programs', id)}
          selectedItems={selectedFilters.programs}
          canDelete={isAdmin}
          isOpen={isSectionOpen('Programs')}
          onToggleOpen={() => toggleSection('Programs')}
        />

        <FilterSection
          title="Experiences"
          items={experiences}
          onAddItem={name => addExperience({ name })}
          onEditItem={(id, name) => updateExperience(id, { name })}
          onDeleteItem={deleteExperience}
          onSelectItem={id => toggleFilter('experiences', id)}
          onSelectOnlyItem={id => selectOnlyFilter('experiences', id)}
          selectedItems={selectedFilters.experiences}
          canDelete={isAdmin}
          isOpen={isSectionOpen('Experiences')}
          onToggleOpen={() => toggleSection('Experiences')}
        />

        <FilterSection
          title="Access Levels"
          items={accessLevels}
          onAddItem={name => addAccessLevel({ name })}
          onEditItem={(id, name) => updateAccessLevel(id, { name })}
          onDeleteItem={deleteAccessLevel}
          onSelectItem={id => toggleFilter('accessLevels', id)}
          onSelectOnlyItem={id => selectOnlyFilter('accessLevels', id)}
          selectedItems={selectedFilters.accessLevels}
          canDelete={isAdmin}
          isOpen={isSectionOpen('Access Levels')}
          onToggleOpen={() => toggleSection('Access Levels')}
        />
      </div>
      </div>
    </>
  )
}