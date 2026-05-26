// src/components/ProgramModal.tsx
import React, { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import Select, { MultiValue, StylesConfig } from 'react-select'
import { useStore, useIsAdmin } from '../store'
import { useConfirm } from './ConfirmDialog'

interface Option { label: string; value: string }

// Cap multi-select tag container to ~3 lines and scroll internally so the
// form layout stays predictable as org lists grow.
const multiSelectStyles: StylesConfig<Option, true> = {
  valueContainer: base => ({
    ...base,
    maxHeight: '4.5rem',
    overflowY: 'auto',
    flexWrap: 'wrap',
  }),
  multiValue: base => ({
    ...base,
    margin: '2px',
    padding: '0 4px',
  }),
}

interface ProgramModalProps {
  isOpen: boolean
  onClose: () => void
  programId: string | null
}

interface FormState {
  name: string
  hosted_by_org_ids: string[]
  presented_by_org_ids: string[]
  sponsor_org_ids: string[]
  host_label: string
  presenter_label: string
}

const blank: FormState = {
  name: '',
  hosted_by_org_ids: [],
  presented_by_org_ids: [],
  sponsor_org_ids: [],
  host_label: '',
  presenter_label: '',
}

export const ProgramModal: React.FC<ProgramModalProps> = ({ isOpen, onClose, programId }) => {
  const { programs, organizations, addProgram, updateProgram, deleteProgram } = useStore()
  const isAdmin = useIsAdmin()
  const confirm = useConfirm()

  const existing = programId ? programs.find(p => p.id === programId) || null : null

  const [form, setForm] = useState<FormState>(blank)

  useEffect(() => {
    if (!isOpen) return
    if (existing) {
      setForm({
        name: existing.name || '',
        hosted_by_org_ids: existing.hosted_by_org_ids || [],
        presented_by_org_ids: existing.presented_by_org_ids || [],
        sponsor_org_ids: existing.sponsor_org_ids || [],
        host_label: existing.host_label || '',
        presenter_label: existing.presenter_label || '',
      })
    } else {
      setForm(blank)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, programId])

  if (!isOpen) return null

  const orgOpts: Option[] = organizations.map(o => ({ label: o.name, value: o.id }))
  const toOpts = (ids: string[]): Option[] =>
    ids.map(id => orgOpts.find(o => o.value === id)).filter(Boolean) as Option[]
  const fromOpts = (v: MultiValue<Option>): string[] => (v as Option[]).map(o => o.value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) return
    const payload = {
      name,
      hosted_by_org_ids: form.hosted_by_org_ids,
      presented_by_org_ids: form.presented_by_org_ids,
      sponsor_org_ids: form.sponsor_org_ids,
      host_label: form.host_label.trim() || null,
      presenter_label: form.presenter_label.trim() || null,
    } as any
    if (programId) {
      updateProgram(programId, payload)
    } else {
      addProgram(payload)
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!programId || !existing) return
    const ok = await confirm({
      title: `Delete "${existing.name}"?`,
      body: <>This removes the program. Sessions that reference it will lose the link.</>,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) {
      deleteProgram(programId)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              {existing ? 'Edit Program' : 'New Program'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-4 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                autoFocus
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Hosted by</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">Organizations that lead planning / produce this program.</p>
              <Select
                isMulti
                options={orgOpts}
                value={toOpts(form.hosted_by_org_ids)}
                onChange={v => setForm(s => ({ ...s, hosted_by_org_ids: fromOpts(v) }))}
                styles={multiSelectStyles}
                placeholder="Pick host orgs…"
                classNamePrefix="rs"
              />
              <label className="block text-xs text-gray-500 mt-3 mb-1">
                Display label override (optional, defaults to "Hosted by")
              </label>
              <input
                type="text"
                value={form.host_label}
                onChange={e => setForm(s => ({ ...s, host_label: e.target.value }))}
                placeholder="Hosted by"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Presented by</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">Primary attribution / naming-rights org(s).</p>
              <Select
                isMulti
                options={orgOpts}
                value={toOpts(form.presented_by_org_ids)}
                onChange={v => setForm(s => ({ ...s, presented_by_org_ids: fromOpts(v) }))}
                styles={multiSelectStyles}
                placeholder="Pick presenter orgs…"
                classNamePrefix="rs"
              />
              <label className="block text-xs text-gray-500 mt-3 mb-1">
                Display label override (optional, defaults to "Presented by")
              </label>
              <input
                type="text"
                value={form.presenter_label}
                onChange={e => setForm(s => ({ ...s, presenter_label: e.target.value }))}
                placeholder="Presented by"
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Sponsors</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">Contributing sponsor orgs beyond the host/presenter roles.</p>
              <Select
                isMulti
                options={orgOpts}
                value={toOpts(form.sponsor_org_ids)}
                onChange={v => setForm(s => ({ ...s, sponsor_org_ids: fromOpts(v) }))}
                styles={multiSelectStyles}
                placeholder="Pick sponsor orgs…"
                classNamePrefix="rs"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
            {existing && isAdmin ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
              >
                <Trash2 size={16} className="mr-2" /> Delete Program
              </button>
            ) : <div />}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
              >
                {existing ? 'Save Changes' : 'Create Program'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
