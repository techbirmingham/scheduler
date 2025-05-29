import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Edit, Plus, X, Trash2 } from 'lucide-react'
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
  selectedItems,
}) => {
  const [isOpen, setIsOpen] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newItemValue, setNewItemValue] = useState('')

  const handleEditStart = (id: string, name: string) => {
    setEditingId(id)
    setEditValue(name)
  }

  const handleEditSave = (id: string) => {
    if (editValue.trim()) onEditItem(id, editValue)
    setEditingId(null)
  }

  const handleAddClick = () => {
    setIsAddingNew(true)
    setNewItemValue('')
    setTimeout(() => {
      const input = document.querySelector('.new-item-input') as HTMLInputElement
      input?.focus()
    }, 0)
  }

  const handleAddSave = () => {
    if (newItemValue.trim()) onAddItem(newItemValue)
    setIsAddingNew(false)
    setNewItemValue('')
  }

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAddSave()
    else if (e.key === 'Escape') setIsAddingNew(false)
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDeleteItem(id)
    }
  }

  return (
    <div className="mb-4">
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <h3 className="font-medium text-gray-700 ml-1">{title}</h3>
        </div>
      </div>

      {isOpen && (
        <div className="ml-6 space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between group">
              {editingId === item.id ? (
                <div className="flex items-center flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => handleEditSave(item.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleEditSave(item.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="flex-1 py-1 px-2 border border-gray-300 rounded"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center flex-1">
                  <input
                    type="checkbox"
                    id={`filter-${item.id}`}
                    checked={selectedItems.includes(item.id)}
                    onChange={() => onSelectItem(item.id)}
                    className="mr-2"
                  />
                  {/* color dot */}
                  {item.color && (
                    <span
                      className="w-3 h-3 rounded-full mr-1"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <label
                    htmlFor={`filter-${item.id}`}
                    className="text-sm text-gray-600 cursor-pointer flex-1"
                  >
                    {item.name}
                  </label>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditStart(item.id, item.name)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={e => handleDeleteClick(e, item.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isAddingNew ? (
            <div className="flex items-center">
              <input
                type="text"
                value={newItemValue}
                onChange={e => setNewItemValue(e.target.value)}
                onBlur={handleAddSave}
                onKeyDown={handleAddKeyDown}
                placeholder={`New ${title.toLowerCase().slice(0, -1)}`}
                className="flex-1 py-1 px-2 border border-gray-300 rounded new-item-input"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={handleAddClick}
              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Plus size={14} className="mr-1" />
              Add Option
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const {
    venues,
    organizations,
    programs,
    experiences,
    accessLevels,
    sessionTypes,
    tracks,
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
    deleteAccessLevel,
  } = useStore()

  if (!isOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className="bg-white p-2 rounded-r-md shadow fixed top-20 left-0"
      >
        <ChevronRight size={16} />
      </button>
    )
  }

  return (
    <div className="w-64 bg-white border-r overflow-y-auto flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-medium text-gray-800">Filters</h2>
        <button onClick={toggleSidebar} className="text-gray-500 hover:text-gray-700">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
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

        {/* ...the rest of your FilterSections unchanged... */}
      </div>
    </div>
  )
}