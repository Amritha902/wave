import { Routes, Route, NavLink } from "react-router-dom"
import { useEffect, useState, useRef } from "react"

// 🔹 Pages
import Home from "./pages/Home"
import ForumHome from "./pages/ForumHome"
import ForumThread from "./pages/ForumThread"
import Chat from "./pages/Chat"
import Mood from "./pages/Mood"
import Pulse from "./pages/Pulse"
import Journal from "./pages/Journal"
import Crisis from "./pages/Crisis"
import Settings from "./pages/Settings"
import Meditation from "./pages/Meditation"

// 🔹 Components & Services
import AnimatedBackground from "./components/AnimatedBackground"
import { useTheme } from "./services/theme"
import { supabase, signInWithGoogle, signOut, getUser } from "./services/supabaseClient"

/* =================================================================================
   Local Device ID
   ---------------------------------------------------------------------------------
   Generates a unique device ID and stores it in localStorage. Used for anonymous 
   tracking (mood, journal, forum posts) without requiring login.
================================================================================= */
function useDeviceId() {
  const [id, setId] = useState<string>("")

  useEffect(() => {
    const cur = localStorage.getItem("wave-device-id")
    if (cur) {
      setId(cur)
    } else {
      const gen = crypto.randomUUID()
      localStorage.setItem("wave-device-id", gen)
      setId(gen)
    }
  }, [])

  return id
}

/* =================================================================================
   Background Music Hook
   ---------------------------------------------------------------------------------
   Plays looping ambient music. Saves state in localStorage to respect user choice.
================================================================================= */
function useMusic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio("/audio/videoplayback.m4a")
    audioRef.current.loop = true
    audioRef.current.volume = 0.5
    audioRef.current.preload = "metadata"

    audioRef.current.addEventListener("error", (e) => {
      console.log("Audio load error:", e)
    })
    audioRef.current.addEventListener("loadeddata", () => {
      console.log("Music loaded successfully")
    })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const toggleMusic = async () => {
    if (!audioRef.current) return
    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        localStorage.setItem("wave-music-playing", "false")
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
        localStorage.setItem("wave-music-playing", "true")
      }
    } catch (error) {
      console.log("Playback failed:", error)
    }
  }

  // Restore last state
  useEffect(() => {
    const saved = localStorage.getItem("wave-music-playing")
    if (saved === "true") setIsPlaying(false) // don’t autoplay
  }, [])

  return { isPlaying, toggleMusic }
}

/* =================================================================================
   Headbar Navigation
   ---------------------------------------------------------------------------------
   Shows logo, navigation tabs, music button, and auth controls.
================================================================================= */
const Headbar = ({ 
  email, onGoogle, onSignOut, onSwitch, 
  isPlaying, onToggleMusic 
}: any) => {
  
  const tabs = [
    ["/", "🏠", "Home"],
    ["/chat", "💬", "Chat"],
    ["/meditation", "🧘‍♀️", "Meditate"],
    ["/mood", "😊", "Mood"],
    ["/journal", "📝", "Journal"],
    ["/pulse", "🤝", "Pulse"],
    ["/crisis", "🆘", "Panic"],
    ["/forum", "🌐", "Forum"],
    ["/settings", "⚙️", "Settings"],
  ] as const

  return (
    <header className="headbar">
      <div className="px-2 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-4 max-w-full">

        {/* 🔹 Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-full overflow-hidden shadow-lg bg-gradient-to-br from-black/20 to-black/10">
            <img src="/logo.png" alt="WAVE" className="h-full w-full object-cover" />
          </div>
          <div className="font-bold text-sm sm:text-base bg-gradient-to-r from-white via-white to-blue-200 bg-clip-text text-transparent drop-shadow-sm">
            WAVE
          </div>
        </div>

        {/* 🔹 Tabs */}
        <nav className="flex flex-1 justify-center gap-1 sm:gap-2 min-w-0">
          {tabs.map(([to, icon, label]) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              className={({ isActive }) =>
                `px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-white border border-blue-400/40 shadow-lg shadow-blue-500/25 scale-105"
                    : "hover:bg-gradient-to-r hover:from-white/15 hover:to-white/10 hover:text-white hover:scale-105 hover:shadow-md text-gray-300"
                }`
              }
            >
              <span className="text-base sm:text-lg">{icon}</span>
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 🔹 Actions (music + auth) */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Music toggle */}
          <button
            onClick={onToggleMusic}
            title={isPlaying ? "Pause music" : "Play music"}
            className={`music-btn p-2 rounded-full transition-all duration-300 ${
              isPlaying
                ? "bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/40 shadow-lg shadow-green-500/25"
                : "bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30"
            }`}
          >
            {isPlaying ? "⏸️" : "▶️"}
          </button>

          {/* Auth controls */}
          {!email ? (
            <button 
              onClick={onGoogle}
              className="google-btn px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-medium"
            >
              <span>🔑</span>
              <span className="hidden sm:inline">Sign in</span>
            </button>
          ) : (
            <details className="relative">
              <summary className="cursor-pointer px-3 py-2 rounded-xl bg-gradient-to-r from-white/15 to-white/10 hover:from-white/25 hover:to-white/15 text-xs sm:text-sm font-medium border border-white/20 hover:border-white/30">
                <span className="max-w-[100px] truncate inline-block">{email}</span>
              </summary>
              <div className="absolute right-0 mt-2 w-48 card p-2 grid gap-1 text-xs sm:text-sm">
                <button className="btn-ghost text-left hover:scale-105 transition" onClick={onSwitch}>
                  Switch account
                </button>
                <button className="btn-ghost text-left hover:scale-105 transition" onClick={onSignOut}>
                  Sign out
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  )
}

/* =================================================================================
   Root App
   ---------------------------------------------------------------------------------
   Applies theme, handles auth state, focus mode, and routes.
================================================================================= */
export default function App() {
  const { theme, applyTheme } = useTheme()
  const [email, setEmail] = useState<string | null>(null)
  const deviceId = useDeviceId()
  const { isPlaying, toggleMusic } = useMusic()
  const [focusMode, setFocusMode] = useState(false)

  /* 🔹 Apply theme + listen for auth */
  useEffect(() => {
    applyTheme(theme)

    const sub = supabase.auth.onAuthStateChange(async () => {
      const u = await getUser()
      setEmail(u?.email ?? null)
    })

    ;(async () => {
      const u = await getUser()
      setEmail(u?.email ?? null)
    })()

    return () => {
      sub.data.subscription.unsubscribe()
    }
  }, [theme, applyTheme])

  /* 🔹 Global focus mode (for meditation) */
  useEffect(() => {
    const onFocusMode = (e: Event) => {
      try {
        const ce = e as CustomEvent<boolean>
        setFocusMode(Boolean(ce.detail))
      } catch {}
    }
    window.addEventListener("wave:focus-mode", onFocusMode as EventListener)
    return () => window.removeEventListener("wave:focus-mode", onFocusMode as EventListener)
  }, [])

  const onGoogle = async () => { await signInWithGoogle() }
  const onSignOut = async () => { await signOut(); setEmail(null) }
  const onSwitch = async () => { await signInWithGoogle() }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      {/* 🔹 Headbar */}
      {!focusMode && (
        <Headbar
          email={email}
          onGoogle={onGoogle}
          onSignOut={onSignOut}
          onSwitch={onSwitch}
          isPlaying={isPlaying}
          onToggleMusic={toggleMusic}
        />
      )}

      {/* 🔹 Routes */}
      <main className={`max-w-6xl mx-auto p-4 ${focusMode ? "pt-6" : "pt-24"} grid gap-4 relative z-10`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/mood" element={<Mood deviceId={deviceId} />} />
          <Route path="/pulse" element={<Pulse />} />
          <Route path="/journal" element={<Journal deviceId={deviceId} />} />
          <Route path="/meditation" element={<Meditation />} />
          <Route path="/crisis" element={<Crisis />} />
          <Route path="/settings" element={<Settings deviceId={deviceId} />} />
          <Route path="/forum" element={<ForumHome />} />
          <Route path="/forum/:id" element={<ForumThread />} />
        </Routes>
      </main>
    </div>
  )
}
