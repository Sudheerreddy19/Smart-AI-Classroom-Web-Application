import { Bell, Mic, MicOff, Moon, SunMedium, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { useNotifications } from '../../hooks/useNotifications'

export function Topbar({ title, subtitle, voice }) {
  const { theme, setTheme, selectedClassroom } = useAppContext()
  const { unreadCount } = useNotifications()

  // Real backend health: ping the actuator health endpoint
  const [backendOnline, setBackendOnline] = useState(true)

  useEffect(() => {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || 'https://smart-ai-classroom-server.onrender.com'

    const check = () => {
      fetch(`${apiBase}/actuator/health`, { method: 'GET', mode: 'cors' })
        .then((r) => setBackendOnline(r.ok))
        .catch(() => setBackendOnline(false))
    }

    check()
    const id = setInterval(check, 30_000) // re-check every 30 s
    return () => clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        {/* Page title */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600">Smart Classroom</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Classroom label */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">Classroom</span>
            <span className="font-medium text-slate-800">{selectedClassroom}</span>
          </div>

          {/* Backend connection status — based on real health ping, NOT login */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {backendOnline
              ? <Wifi className="h-4 w-4 text-emerald-500" />
              : <WifiOff className="h-4 w-4 text-amber-500" />}
            <span>{backendOnline ? 'Backend online' : 'Backend offline'}</span>
          </div>

          {/* Voice Assistant ON/OFF Quick Button */}
          {voice && (
            <button
              type="button"
              onClick={voice.toggleAmbient}
              title={voice.ambientEnabled ? 'Turn Voice Assistant OFF' : 'Turn Voice Assistant ON'}
              className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition border ${
                voice.ambientEnabled
                  ? voice.isUserSpeaking
                    ? 'bg-cyan-500/20 text-cyan-800 border-cyan-400 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400/60 scale-105'
                    : 'bg-cyan-500/10 text-cyan-700 border-cyan-400/40 hover:bg-cyan-500/20'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {voice.ambientEnabled ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full ${
                        voice.isUserSpeaking
                          ? 'animate-ping bg-cyan-400 opacity-90'
                          : 'animate-ping bg-cyan-400 opacity-75'
                      }`}
                    />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
                  </span>
                  <Mic
                    className={`h-4 w-4 text-cyan-600 transition-transform ${
                      voice.isUserSpeaking ? 'scale-125 animate-pulse text-cyan-500' : ''
                    }`}
                  />
                  {/* Vibrating audio wave bars */}
                  {voice.isUserSpeaking && (
                    <span className="flex items-center gap-[2px] h-3">
                      {[0.5, 1, 0.7, 0.9].map((f, i) => (
                        <span
                          key={i}
                          className="w-[2px] rounded-full bg-cyan-500 animate-pulse"
                          style={{
                            height: `${Math.max(4, Math.min(12, ((voice.audioLevel || 0) / 100) * 12 * f + 4))}px`,
                          }}
                        />
                      ))}
                    </span>
                  )}
                  <span>{voice.isUserSpeaking ? 'Hearing…' : 'Voice ON'}</span>
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4 text-slate-400" />
                  <span>Voice OFF</span>
                </>
              )}
            </button>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            aria-label="Toggle theme"
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:border-cyan-300 hover:text-cyan-600"
            onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
          </button>

          {/* Notification bell */}
          <button
            type="button"
            aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
            className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:border-cyan-300 hover:text-cyan-600"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* JARVIS kiosk identity badge — replaces user login dropdown */}
          <div className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-semibold text-white">
              J
            </div>
            <div className="hidden text-sm sm:block">
              <div className="font-medium text-slate-800">JARVIS</div>
              <div className="text-xs text-cyan-600">AI Assistant</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
