// src/components/SettingsView.tsx

import React, { useState, useEffect } from 'react'
import { Cog, Plus, Edit, Trash, X } from 'lucide-react'
import { useStore } from '../store'
import { supabase } from '../utils/supabaseClient'

type SettingsCategory =
  | 'sessionTypes'
  | 'tracks'
  | 'organizations'
  | 'programs'
  | 'experiences'
  | 'accessLevels'

interface CategoryItemProps {
  id: string
  name: string
  color?: string
  canEditColor?: boolean
  onEdit: (id: string, newName: string, newColor?: string) => void
  onDelete: (id: string) => void
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  id, name, color, canEditColor = false, onEdit, onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const [editColor, setEditColor] = useState(color || '#3B82F6')

  const handleSave = () => {
    if (!editName.trim()) return
    canEditColor
      ? onEdit(id, editName.trim(), editColor)
      : onEdit(id, editName.trim())
    setIsEditing(false)
  }

  return (
    <div className="group flex items-center justify-between p-3 border rounded bg-white hover:bg-gray-50">
      {isEditing ? (
        <div className="flex items-center flex-1 space-x-2">
          <input
            className="flex-1 p-1 border rounded"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
          {canEditColor && (
            <input
              type="color"
              className="w-8 h-8 p-0 border-0"
              value={editColor}
              onChange={e => setEditColor(e.target.value)}
            />
          )}
          <button className="text-green-600" onClick={handleSave}>Save</button>
          <button
            className="text-gray-600"
            onClick={() => {
              setIsEditing(false)
              setEditName(name)
              setEditColor(color || '#3B82F6')
            }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center flex-1 space-x-2">
            {color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
            <span className="text-gray-800">{name}</span>
          </div>
          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition">
            <button className="text-gray-500" onClick={() => setIsEditing(true)}>
              <Edit size={16} />
            </button>
            <button className="text-gray-500" onClick={() => onDelete(id)}>
              <Trash size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

interface CategorySectionProps {
  title: string
  items: { id: string; name: string; color?: string }[]
  canEditColor?: boolean
  onAdd: (name: string, color?: string) => void
  onEdit: (id: string, name: string, color?: string) => void
  onDelete: (id: string) => void
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title, items, canEditColor = false, onAdd, onEdit, onDelete,
}) => {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3B82F6')

  const handleAdd = () => {
    if (!newName.trim()) return
    canEditColor
      ? onAdd(newName.trim(), newColor)
      : onAdd(newName.trim())
    setAdding(false)
    setNewName('')
    setNewColor('#3B82F6')
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h2 className="text-lg font-medium text-gray-800">{title}</h2>
      </div>
      <div className="p-6 space-y-3">
        {items.map(i => (
          <CategoryItem
            key={i.id}
            id={i.id}
            name={i.name}
            color={i.color}
            canEditColor={canEditColor}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {adding ? (
          <div className="flex items-center space-x-2">
            <input
              className="flex-1 p-2 border rounded"
              placeholder={`New ${title.slice(0, -1)}`}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
            {canEditColor && (
              <input
                type="color"
                className="w-8 h-8 p-0 border-0"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
              />
            )}
            <button className="bg-indigo-600 text-white px-3 py-1 rounded" onClick={handleAdd}>
              Add
            </button>
            <button className="text-gray-600" onClick={() => setAdding(false)}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            className="flex items-center text-indigo-600"
            onClick={() => setAdding(true)}
          >
            <Plus size={16} className="mr-1" />
            Add {title.slice(0, -1)}
          </button>
        )}
      </div>
    </div>
  )
}

// ——— CHANGELOG WIDGET ———

interface LogEntry {
  id: string
  user_id: string
  action: string
  resource: string
  resource_id: string
  details: Record<string, any>
  created_at: string
}

const ChangeLogSection: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from<LogEntry>('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (data) setLogs(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading changelog…</p>
  if (!logs.length) return <p>No changes logged yet.</p>

  return (
    <div className="bg-white rounded-lg shadow overflow-auto max-h-96">
      <table className="w-full text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-sm">When</th>
            <th className="px-4 py-2 text-sm">Who</th>
            <th className="px-4 py-2 text-sm">Action</th>
            <th className="px-4 py-2 text-sm">Resource</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-t">
              <td className="px-4 py-2 text-xs">
                {new Date(log.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-xs">{log.user_id}</td>
              <td className="px-4 py-2 text-xs">{log.action}</td>
              <td className="px-4 py-2 text-xs">
                {log.resource} &nbsp;#{log.resource_id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ——— SETTINGS VIEW ———

export const SettingsView: React.FC = () => {
  const {
    sessionTypes,
    tracks,
    organizations,
    programs,
    experiences,
    accessLevels,
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

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center mb-4">
        <Cog className="text-indigo-600 mr-2" size={24} />
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ... your CategorySections as before ... */}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-800 mb-2">Changelog</h2>
        <ChangeLogSection />
      </div>
    </div>
  )
}