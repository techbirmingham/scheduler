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
  | { status: 'error'; message: string }

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
      try {
        // Race against a timeout so a hung Supabase request surfaces
        // as a visible error instead of an infinite "Verifying…" spinner.
        const queryPromise = supabase
          .from('team_members')
          .select('id')
          .ilike('email', email)
          .maybeSingle()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('team_members lookup timed out after 10s')), 10_000),
        )
        const { data, error } = await Promise.race([queryPromise, timeoutPromise])
        if (cancelled) return
        if (error) {
          console.error('AuthGate: team_members lookup errored', error)
          setState({ status: 'error', message: error.message })
          return
        }
        if (data) {
          setState({ status: 'authorized' })
        } else {
          await supabase.auth.signOut()
          if (!cancelled) setState({ status: 'unauthorized', email })
        }
      } catch (err) {
        console.error('AuthGate: team_members lookup threw', err)
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    // Supabase parses the OAuth access_token from the URL hash on init
    // but leaves the bare '#' behind. Clean it up.
    function tidyOAuthHash() {
      if (window.location.hash) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search,
        )
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      tidyOAuthHash()
      verify(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        tidyOAuthHash()
        verify(session)
      },
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
          <>
            <p className="text-gray-700 mb-4">Verifying access…</p>
            <button
              onClick={() => {
                // Fire-and-forget so a hung Supabase doesn't block recovery.
                // Manually purge cached session keys; next load sees no session.
                supabase.auth.signOut().catch(() => {})
                Object.keys(localStorage)
                  .filter((k) => k.startsWith('sb-'))
                  .forEach((k) => localStorage.removeItem(k))
                window.location.reload()
              }}
              className="px-4 py-1 text-sm text-gray-600 underline"
            >
              Stuck? Sign out and try again
            </button>
          </>
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

        {state.status === 'error' && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Sign-in problem
            </h2>
            <p className="text-gray-600 mb-1">Couldn't verify access:</p>
            <p className="text-gray-800 mb-4 font-mono text-sm break-words">
              {state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Reload
            </button>
          </>
        )}
      </div>
    </div>
  )
}
