// src/components/ConfirmDialog.tsx
import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react'
import { AlertTriangle } from 'lucide-react'

export interface ConfirmOptions {
  title: string
  body?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

type Resolver = (value: boolean) => void

const ConfirmContext = createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null)

// Provider mounted once at the app root. Holds a single dialog in state and
// a Promise resolver — every useConfirm() call shares the same UI slot, so
// stacked confirms aren't possible (which is what we want for destructive
// actions: only one prompt at a time).
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<Resolver | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    // If a previous confirm is still open, resolve it as cancelled first
    // so we don't leak a never-settling Promise.
    resolverRef.current?.(false)
    setOpts(options)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const resolve = (value: boolean) => {
    resolverRef.current?.(value)
    resolverRef.current = null
    setOpts(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && <Dialog opts={opts} onResult={resolve} />}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx
}

const Dialog: React.FC<{ opts: ConfirmOptions; onResult: (v: boolean) => void }> = ({
  opts, onResult,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResult(false)
      if (e.key === 'Enter') onResult(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onResult])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={() => onResult(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {opts.destructive && (
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
              {opts.title}
            </h2>
            {opts.body && (
              <div className="text-sm text-gray-600 mt-1">{opts.body}</div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={() => onResult(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {opts.cancelLabel ?? 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onResult(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
              opts.destructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {opts.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
