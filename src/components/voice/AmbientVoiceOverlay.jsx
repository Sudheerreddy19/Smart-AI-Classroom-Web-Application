import { useRef, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Waves,
  X,
} from 'lucide-react'

export function AmbientVoiceOverlay({ voice }) {
  const {
    assistantState,
    isOverlayOpen,
    setIsOverlayOpen,
    transcript,
    activeQuestion,
    activeAnswer,
    activeCitations,
    errorMessage,
    ambientEnabled,
    ttsEnabled,
    isSpeechSupported,
    toggleAmbient,
    toggleTts,
    manualAsk,
    stopSpeaking,
    dismissOverlay,
    audioLevel = 0,
    isUserSpeaking = false,
  } = voice

  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef(null)

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    manualAsk(inputVal.trim())
    setInputVal('')
  }

  const isSpeaking = assistantState === 'speaking'
  const isProcessing = assistantState === 'processing'
  const isListening = assistantState === 'listening'

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* ── EXPANDED HUD CARD ──────────────────────────────────────────────── */}
      {isOverlayOpen && (
        <div className="mb-3 w-[360px] sm:w-[420px] rounded-3xl border border-cyan-500/30 bg-slate-950/95 p-5 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isSpeaking
                      ? 'animate-ping bg-cyan-400'
                      : isProcessing
                      ? 'animate-pulse bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${
                    isSpeaking
                      ? 'bg-cyan-500'
                      : isProcessing
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  JARVIS AI Assistant
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isSpeaking
                    ? 'Speaking answer…'
                    : isProcessing
                    ? 'Processing question…'
                    : isListening
                    ? 'Hearing speech…'
                    : 'Listening for "Jarvis"'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle TTS audio output */}
              <button
                type="button"
                onClick={toggleTts}
                title={ttsEnabled ? 'Mute voice responses' : 'Enable voice responses'}
                className={`rounded-lg p-1.5 text-xs transition ${
                  ttsEnabled
                    ? 'text-cyan-400 hover:bg-slate-800'
                    : 'text-slate-500 hover:bg-slate-800'
                }`}
              >
                {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              {/* Close / Dismiss */}
              <button
                type="button"
                onClick={dismissOverlay}
                title="Minimize overlay"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="my-4 max-h-[340px] space-y-3 overflow-y-auto pr-1 text-sm">
            {/* Live speech transcription */}
            {(isListening || transcript) && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/30 p-3 text-cyan-200">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-cyan-400">
                  <Waves className="h-3.5 w-3.5 animate-pulse" /> Live Speech
                </div>
                <p className="mt-1 text-xs italic">
                  "{transcript || 'Listening for your question…'}"
                </p>
              </div>
            )}

            {/* Last asked question */}
            {activeQuestion && !isListening && (
              <div className="rounded-2xl bg-slate-900 p-3 text-slate-300">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  You asked:
                </p>
                <p className="mt-1 font-medium text-white">"{activeQuestion}"</p>
              </div>
            )}

            {/* Thinking spinner */}
            {isProcessing && (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-900/60 p-3 text-xs text-amber-300">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400"
                    style={{ animationDelay: '0.15s' }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400"
                    style={{ animationDelay: '0.3s' }}
                  />
                </span>
                <span>JARVIS is querying tools and knowledge base…</span>
              </div>
            )}

            {/* Error message */}
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* AI Answer */}
            {activeAnswer && !isProcessing && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 leading-relaxed text-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">
                    JARVIS Response
                  </p>
                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="inline-flex items-center gap-1 rounded-md bg-rose-900/60 px-2 py-0.5 text-[10px] text-rose-200 hover:bg-rose-900"
                    >
                      Stop voice
                    </button>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-xs sm:text-sm">{activeAnswer}</p>

                {/* RAG Citations */}
                {activeCitations?.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      <BookOpen className="h-3 w-3" /> Cited Sources
                    </p>
                    {activeCitations.map((c, i) => (
                      <p key={i}>
                        • {c.documentTitle}
                        {c.section ? ` — ${c.section}` : ''}
                        {c.page ? ` (p. ${c.page})` : ''}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick type input fallback */}
          <form onSubmit={handleManualSubmit} className="relative mt-2">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Or type a question for JARVIS…"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pl-3 pr-10 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isProcessing}
              className="absolute right-1.5 top-1.5 rounded-lg bg-cyan-600 p-1 text-white hover:bg-cyan-500 disabled:opacity-40"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      )}

      {/* ── LIVE HEARD SPEECH BUBBLE (Visible even when overlay is closed) ── */}
      {transcript && !isOverlayOpen && (
        <div className="mb-2 max-w-[320px] rounded-2xl border border-cyan-400/40 bg-slate-950/90 px-4 py-2 text-xs text-cyan-200 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            <Waves className="h-3 w-3 animate-pulse" /> Heard:
          </div>
          <p className="mt-0.5 font-medium italic text-white truncate">"{transcript}"</p>
        </div>
      )}

      {/* ── FLOATING AMBIENT PILL (ALWAYS VISIBLE) ─────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Toggle ambient listening on/off */}
        <button
          type="button"
          onClick={toggleAmbient}
          title={
            ambientEnabled
              ? 'Ambient listening active: say "Jarvis" anytime'
              : 'Ambient listening paused: click to enable'
          }
          className={`relative flex h-11 items-center gap-2.5 rounded-full border px-4 text-xs font-medium shadow-xl backdrop-blur-md transition-all duration-150 ${
            ambientEnabled
              ? isUserSpeaking
                ? 'border-cyan-400 bg-slate-950/95 text-cyan-200 shadow-cyan-500/40 scale-105 ring-2 ring-cyan-400/50'
                : 'border-cyan-500/40 bg-slate-950/90 text-cyan-200 shadow-cyan-900/20 hover:scale-105'
              : 'border-slate-700 bg-slate-900/90 text-slate-400'
          }`}
        >
          {/* Vibrating ripple wave when person talks */}
          {ambientEnabled && isUserSpeaking && (
            <span
              className="absolute -inset-1 rounded-full border border-cyan-400/80 animate-ping opacity-60"
              style={{
                animationDuration: `${Math.max(400, 1200 - audioLevel * 8)}ms`,
              }}
            />
          )}

          <span className="relative flex h-2.5 w-2.5">
            {ambientEnabled && (
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  isUserSpeaking ? 'animate-ping bg-cyan-400 opacity-90' : 'animate-ping bg-emerald-400 opacity-75'
                }`}
              />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                ambientEnabled
                  ? isUserSpeaking
                    ? 'bg-cyan-400'
                    : 'bg-emerald-400'
                  : 'bg-slate-500'
              }`}
            />
          </span>

          {ambientEnabled ? (
            <div className="flex items-center gap-2">
              <Mic
                className={`h-4 w-4 transition-transform duration-75 ${
                  isUserSpeaking
                    ? 'text-cyan-400 scale-125 animate-pulse'
                    : 'text-cyan-400'
                }`}
              />

              {/* Dynamic vibrating equalizer bars */}
              <div className="flex items-center gap-[3px] h-4">
                {[0.4, 0.8, 1, 0.6, 0.9, 0.5].map((factor, i) => {
                  const barHeight = isUserSpeaking
                    ? Math.max(4, Math.min(16, (audioLevel / 100) * 16 * factor + 3))
                    : 3
                  return (
                    <span
                      key={i}
                      className={`w-[2px] rounded-full transition-all duration-75 ${
                        isUserSpeaking
                          ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                          : 'bg-slate-600'
                      }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  )
                })}
              </div>

              <span className="text-[11px] font-semibold tracking-wide">
                {isSpeaking
                  ? 'JARVIS Speaking…'
                  : isProcessing
                  ? 'Thinking…'
                  : isUserSpeaking
                  ? 'Hearing you…'
                  : isListening
                  ? 'Listening…'
                  : 'Say "Jarvis"'}
              </span>
            </div>
          ) : (
            <span className="flex items-center gap-1.5">
              <MicOff className="h-3.5 w-3.5 text-slate-500" />
              <span>Voice Muted</span>
            </span>
          )}
        </button>

        {/* Expand / Talk Button with pulsing aura */}
        <button
          type="button"
          onClick={() => setIsOverlayOpen((prev) => !prev)}
          title="Open JARVIS Voice Assistant (or press Ctrl+Space)"
          className={`relative flex h-11 w-11 items-center justify-center rounded-full border shadow-xl transition-all duration-200 hover:scale-105 ${
            isOverlayOpen
              ? 'border-cyan-400 bg-cyan-600 text-white shadow-cyan-500/30'
              : 'border-slate-800 bg-slate-950/90 text-cyan-300 hover:border-cyan-500/40'
          }`}
        >
          {isUserSpeaking && (
            <span className="absolute -inset-0.5 rounded-full border-2 border-cyan-400/80 animate-ping opacity-50" />
          )}
          <Waves
            className={`h-5 w-5 transition-transform ${
              isSpeaking || isListening || isUserSpeaking ? 'animate-bounce text-cyan-300' : ''
            }`}
          />
        </button>
      </div>

      {!isSpeechSupported && (
        <p className="mt-1 text-[10px] text-amber-500">
          Browser mic API unavailable — use text input.
        </p>
      )}
    </div>
  )
}
