import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Edit,
  Plus,
  Trash2
} from 'lucide-react'
import { useStore } from '../store'

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
  selectedItems: string[]
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onSelectItem,
  selectedItems
}) => {
  const [isOpen, setIsOpen] = useState(true)
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
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
        <h3 className="ml-1 font-medium text-gray-700">{title}</h3>
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
                      className="text-sm text-gray-600 cursor-pointer flex-1"
                    >
                      {item.name}
                    </label>
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(item.id, item.name)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit size={14}/>
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (
                          window.confirm(
                            `Delete "${item.name}"?`
                          )
                        ) {
                          onDeleteItem(item.id)
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={14}/>
                    </button>
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

  // Single floating toggle button — same vertical position in both states.
  // When open: sits flush against the sidebar's right edge.
  // When closed: sits flush against the viewport's left edge.
  const ToggleHandle = (
    <button
      onClick={toggleSidebar}
      aria-label={isOpen ? 'Collapse filters' : 'Expand filters'}
      title={isOpen ? 'Collapse filters' : 'Expand filters'}
      className={`fixed top-20 z-30 bg-white border border-gray-200 p-2 shadow-md transition-all hover:bg-gray-50 ${
        isOpen ? 'left-64 -translate-x-full rounded-l-md' : 'left-0 rounded-r-md'
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
      <div className="flex flex-col h-full w-64 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="font-medium text-gray-800">Filters</h2>
        </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <FilterSection
          title="Venues"
          items={venues}
          onAddItem={name => addVenue({ name })}
          onEditItem={(id, name) => updateVenue(id, { name })}
          onDeleteItem={deleteVenue}
          onSelectItem={id => toggleFilter('venues', id)}
          selectedItems={selectedFilters.venues}
        />

        <FilterSection
          title="Session Types"
          items={sessionTypes}
          onAddItem={name => addSessionType({ name })}
          onEditItem={(id, name) => updateSessionType(id, { name })}
          onDeleteItem={deleteSessionType}
          onSelectItem={id => toggleFilter('sessionTypes', id)}
          selectedItems={selectedFilters.sessionTypes}
        />

        <FilterSection
          title="Tracks"
          items={tracks}
          onAddItem={name => addTrack({ name })}
          onEditItem={(id, name) => updateTrack(id, { name })}
          onDeleteItem={deleteTrack}
          onSelectItem={id => toggleFilter('tracks', id)}
          selectedItems={selectedFilters.tracks}
        />

        <FilterSection
          title="Partner Organizations"
          items={organizations}
          onAddItem={name => addOrganization({ name })}
          onEditItem={(id, name) => updateOrganization(id, { name })}
          onDeleteItem={deleteOrganization}
          onSelectItem={id => toggleFilter('organizations', id)}
          selectedItems={selectedFilters.organizations}
        />

        <FilterSection
          title="Programs"
          items={programs}
          onAddItem={name => addProgram({ name })}
          onEditItem={(id, name) => updateProgram(id, { name })}
          onDeleteItem={deleteProgram}
          onSelectItem={id => toggleFilter('programs', id)}
          selectedItems={selectedFilters.programs}
        />

        <FilterSection
          title="Experiences"
          items={experiences}
          onAddItem={name => addExperience({ name })}
          onEditItem={(id, name) => updateExperience(id, { name })}
          onDeleteItem={deleteExperience}
          onSelectItem={id => toggleFilter('experiences', id)}
          selectedItems={selectedFilters.experiences}
        />

        <FilterSection
          title="Access Levels"
          items={accessLevels}
          onAddItem={name => addAccessLevel({ name })}
          onEditItem={(id, name) => updateAccessLevel(id, { name })}
          onDeleteItem={deleteAccessLevel}
          onSelectItem={id => toggleFilter('accessLevels', id)}
          selectedItems={selectedFilters.accessLevels}
        />
      </div>
      </div>
    </>
  )
}