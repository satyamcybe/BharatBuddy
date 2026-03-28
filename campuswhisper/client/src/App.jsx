import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import socket from './socket.js'
import Landing from './pages/Landing.jsx'
import Gate from './pages/Gate.jsx'
import Rooms from './pages/Rooms.jsx'
import Chat from './pages/Chat.jsx'
import WhisperWall from './pages/WhisperWall.jsx'
import SOSBanner from './components/SOSBanner.jsx'

const AppContext = createContext(null)

export function useAppContext() {
  return useContext(AppContext)
}

function ShipItToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className="fixed bottom-6 right-6 z-50 ship-banner rounded-xl px-6 py-4 max-w-sm"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">🚀</span>
        <div>
          <p className="text-[var(--accent-ship)] font-semibold text-sm">
            {message.handle} just shipped it!
          </p>
          <p className="text-[var(--text-muted)] text-xs mt-0.5 truncate max-w-[200px]">
            {message.content}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Dismiss ship notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}

function AppInner() {
  const navigate = useNavigate()
  const [activeSOS, setActiveSOS] = useState(null)
  const [onlineCount, setOnlineCount] = useState(0)
  const [shipToast, setShipToast] = useState(null)

  const dismissSOS = useCallback(() => setActiveSOS(null), [])
  const dismissShip = useCallback(() => setShipToast(null), [])

  const goHelp = useCallback(() => {
    navigate('/chat/sos')
    setActiveSOS(null)
  }, [navigate])

  useEffect(() => {
    // Reconnect socket if session exists
    const raw = sessionStorage.getItem('cw_session')
    if (raw) {
      try {
        const session = JSON.parse(raw)
        if (!socket.connected) {
          socket.connect()
        }
        socket.emit('set_session', {
          sessionToken: session.sessionToken,
          handle: session.handle,
        })
      } catch {
        // Invalid session — ignore
      }
    }

    const handleSOS = (data) => {
      setActiveSOS(data)
      // Auto-dismiss SOS after 10 minutes
      setTimeout(() => setActiveSOS(null), 10 * 60 * 1000)
    }

    const handleShipBroadcast = (data) => {
      setShipToast(data)
    }

    const handleGlobalOnline = (count) => {
      setOnlineCount(count)
    }

    socket.on('sos_broadcast', handleSOS)
    socket.on('ship_it_broadcast', handleShipBroadcast)
    socket.on('global_online', handleGlobalOnline)

    return () => {
      socket.off('sos_broadcast', handleSOS)
      socket.off('ship_it_broadcast', handleShipBroadcast)
      socket.off('global_online', handleGlobalOnline)
    }
  }, [])

  return (
    <AppContext.Provider value={{ activeSOS, setActiveSOS, onlineCount, setOnlineCount }}>
      <div className="relative min-h-screen bg-[var(--bg-primary)]">
        <div className="noise-overlay" aria-hidden="true" />
        <SOSBanner message={activeSOS} onDismiss={dismissSOS} onGoHelp={goHelp} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/gate" element={<Gate />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/chat/:roomId" element={<Chat />} />
          <Route path="/whispers" element={<WhisperWall />} />
        </Routes>
        {shipToast && (
          <ShipItToast message={shipToast} onClose={dismissShip} />
        )}
      </div>
    </AppContext.Provider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
