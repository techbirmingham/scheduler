// src/components/AuthGate.tsx
import React, { ReactNode, useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../utils/supabaseClient'

interface AuthGateProps {
  children: ReactNode
}

type GateState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'checking' }
  | { status: 'authorized' }
  | { status: 'unauthorized'; email: string }

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [state, setState] = useState<GateState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    // RLS already blocks non-team-members from reading any data, so
    // this check is purely UX: surface a clear "not authorized"
    // message instead of letting them into an empty-looking app.
    async function verify(session: Session | null) {
      if (cancelled) return
      if (!session) {
        setState({ status: 'signed-out' })
        return
      }
      const email = session.user.email
      if (!email) {
        await supabase.auth.signOut()
        if (!cancelled) setState({ status: 'unauthorized', email: '(no email on account)' })
        return
      }
      setState({ status: 'checking' })
      const { data } = await supabase
        .from('team_members')
        .select('id')
        .ilike('email', email)
        .maybeSingle()
      if (cancelled) return
      if (data) {
        setState({ status: 'authorized' })
      } else {
        await supabase.auth.signOut()
        if (!cancelled) setState({ status: 'unauthorized', email })
      }
    }

    supabase.auth.getSession().then(({ data }) => verify(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => verify(session),
    )

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  if (state.status === 'authorized') return <>{children}</>

  const signIn = () => supabase.auth.signInWithOAuth({ provider: 'google' })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
        {state.status === 'loading' && (
          <p className="text-gray-700">Checking sign-in…</p>
        )}

        {state.status === 'checking' && (
          <p className="text-gray-700">Verifying access…</p>
        )}

        {state.status === 'signed-out' && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Please log in to continue
            </h2>
            <button
              onClick={signIn}
              className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Log In with Google
            </button>
          </>
        )}

        {state.status === 'unauthorized' && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Not authorized
            </h2>
            <p className="text-gray-600 mb-4">
              <strong>{state.email}</strong> isn't on the team allowlist. Ask an
              admin to add you, then sign in again.
            </p>
            <button
              onClick={signIn}
              className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Sign in with a different Google account
            </button>
          </>
        )}
      </div>
    </div>
  )
}
