// src/components/AuthGate.tsx
import React, { ReactNode, useState, useEffect } from 'react'
import netlifyIdentity from 'netlify-identity-widget'

interface AuthGateProps {
  children: ReactNode
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    netlifyIdentity.init({
      APIUrl: 'https://tb-scheduler.netlify.app/.netlify/identity',
    })
    return !!netlifyIdentity.currentUser()
  })

  useEffect(() => {
    // Prevent scrolling until we’re logged in
    if (!isLoggedIn) document.body.style.overflow = 'hidden'

    const onLogin = (user: any) => {
      // 1) Close Netlify’s own modal instantly
      netlifyIdentity.close()

      // 2) Flip your overlay off
      setIsLoggedIn(true)
      document.body.style.overflow = ''

      // 3) As a fallback, reload the app so all state/data syncs up
      //    (you can remove this line once you confirm the close+state combo works)
      window.location.reload()
    }

    const onLogout = () => {
      setIsLoggedIn(false)
      document.body.style.overflow = 'hidden'
    }

    netlifyIdentity.on('login', onLogin)
    netlifyIdentity.on('logout', onLogout)
    return () => {
      netlifyIdentity.off('login', onLogin)
      netlifyIdentity.off('logout', onLogout)
      document.body.style.overflow = ''
    }
  }, [])

  if (isLoggedIn) {
    return <>{children}</>
  }

  // still not logged in → show a translucent, blurred overlay
  return (
    <div
      onClick={() => netlifyIdentity.open()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white p-6 rounded-lg shadow-lg text-center"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Please log in to continue
        </h2>
        <button
          onClick={() => netlifyIdentity.open()}
          className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Log In
        </button>
      </div>
    </div>
  )
}