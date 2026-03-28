import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import socket from '../socket.js'
import RoomCard from '../components/RoomCard.jsx'
import OnlineCounter from '../components/OnlineCounter.jsx'

const ROOMS = [
  { id: 'academics', name: 'Academics', icon: '📚', desc: 'Doubts, exam tips, syllabus help' },
  { id: 'placements', name: 'Placements', icon: '💼', desc: 'Interview prep, offers, résumés' },
  { id: 'study', name: 'Study Together', icon: '🧠', desc: 'Pomodoro sessions, accountability' },
  { id: 'vent', name: 'Vent', icon: '😤', desc: 'Rant freely. No advice unless asked.' },
  { id: 'ideas', name: 'Ideas & Projects', icon: '💡', desc: 'Share ideas, find collaborators' },
  { id: 'productivity', name: 'Productivity', icon: '🎯', desc: 'Tools, habits, routines' },
  { id: 'sos', name: 'SOS', icon: '🆘', desc: 'Urgent help needed' },
  { id: 'talk', name: 'Just Talk', icon: '💬', desc: 'Late night conversations' },
]

export default function Rooms() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [onlineCounts, setOnlineCounts] = useState({})
  const [lastMessages, setLastMessages] = useState({})
  const [dominantMoods, setDominantMoods] = useState({})
  const [sosRooms, setSosRooms] = useState(new Set())
  const [totalOnline, setTotalOnline] = useState(0)

  useEffect(() => {
    const raw = sessionStorage.getItem('cw_session')
    if (!raw) {
      navigate('/gate')
      return
    }
    try {
      const s = JSON.parse(raw)
      setSession(s)
    } catch {
      navigate('/gate')
      return
    }

    socket.connect()

    const handleOnlineCount = ({ roomId, count }) => {
      setOnlineCounts((prev) => ({ ...prev, [roomId]: count }))
    }

    const handleNewMessage = (msg) => {
      setLastMessages((prev) => ({
        ...prev,
        [msg.roomId]: msg.content?.slice(0, 40) ?? '',
      }))
      if (msg.mood) {
        setDominantMoods((prev) => ({ ...prev, [msg.roomId]: msg.mood }))
      }
    }

    const handleSOSBroadcast = (data) => {
      setSosRooms((prev) => {
        const next = new Set(prev)
        next.add('sos')
        return next
      })
      // Clear SOS glow after 10 minutes
      setTimeout(() => {
        setSosRooms((prev) => {
          const next = new Set(prev)
          next.delete('sos')
          return next
        })
      }, 10 * 60 * 1000)
    }

    const handleGlobalOnline = (count) => {
      setTotalOnline(count)
    }

    socket.on('online_count', handleOnlineCount)
    socket.on('new_message', handleNewMessage)
    socket.on('sos_broadcast', handleSOSBroadcast)
    socket.on('global_online', handleGlobalOnline)

    // Request counts for all rooms
    ROOMS.forEach((room) => {
      socket.emit('get_room_count', { roomId: room.id })
    })

    return () => {
      socket.off('online_count', handleOnlineCount)
      socket.off('new_message', handleNewMessage)
      socket.off('sos_broadcast', handleSOSBroadcast)
      socket.off('global_online', handleGlobalOnline)
    }
  }, [navigate])

  const handleRoomClick = useCallback(
    (roomId) => {
      navigate(`/chat/${roomId}`)
    },
    [navigate],
  )

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  }

  return (
    <div
      className="relative min-h-screen bg-[var(--bg-primary)] px-4 py-10"
      style={{ zIndex: 2 }}
    >
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-mono text-3xl md:text-4xl font-medium text-[var(--text-primary)]">
              Rooms
            </h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              Pick a room and start whispering.{' '}
              {session && (
                <span className="text-[var(--accent-primary)] font-mono text-xs">
                  {session.handle}
                </span>
              )}
            </p>
          </div>
          <OnlineCounter count={totalOnline} label="online" />
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {ROOMS.map((room) => (
          <motion.div key={room.id} variants={cardVariants}>
            <RoomCard
              room={room}
              onlineCount={onlineCounts[room.id] ?? 0}
              lastMessage={lastMessages[room.id] ?? ''}
              dominantMood={dominantMoods[room.id] ?? ''}
              hasActiveSOS={sosRooms.has(room.id)}
              onClick={() => handleRoomClick(room.id)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
