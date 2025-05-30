// src/components/AuthGate.tsx
import React, { useState, useEffect } from 'react'
import netlifyIdentity from 'netlify-identity-widget'

export const AuthGate: React.FC = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    netlifyIdentity.init({
      APIUrl: 'https://<your-netlify-subdomain>/.netlify/identity',
    })
    return !!netlifyIdentity.currentUser()
  })

  useEffect(() => {
    // When login succeeds:
    const onLogin = () => {
      setIsLoggedIn(true)
      document.body.style.overflow = ''     // restore scrolling
      netlifyIdentity.close()               // hide the Netlify modal
    }
    // When logout happens:
    const onLogout = () => {
      setIsLoggedIn(false)
      // we could re-hide scroll here if we’d explicitly hidden it on mount
    }

    netlifyIdentity.on('login', onLogin)
    netlifyIdentity.on('logout', onLogout)

    return () => {
      netlifyIdentity.off('login', onLogin)
      netlifyIdentity.off('logout', onLogout)
    }
  }, [])

  if (isLoggedIn) {
    // once you’re logged in, just render your app
    return <>{children}</>
  }

  // otherwise, block everything behind a translucent overlay
  return (
    <div
      className="fixed inset-0 z-50 bg-white bg-opacity-75 flex items-center justify-center"
      onClick={() => netlifyIdentity.open()}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="text-center space-y-4 p-6 bg-white rounded shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-gray-800">
          Please log in to continue
        </h2>
        <button
          onClick={() => netlifyIdentity.open()}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Log In
        </button>
      </div>
    </div>
  )
}