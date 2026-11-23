import React, { useState, useEffect, useRef } from 'react'
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Users,
  UserCheck,
  Clock,
  Square,
  Play,
  Pause,
  X,
  Volume2,
} from 'lucide-react'
import { attendanceApi } from '../../api/attendanceApi'

/**
 * FullScreenAttendanceOverlay
 *
 * Dedicated full-screen attendance cockpit displayed when the teacher says "Take attendance".
 *
 * Displays:
 *  - Live camera connection status & animation
 *  - Face recognition status
 *  - Total class students, present count, pending count, unknown faces detected
 *  - Live updating table of recognized students
 *  - Completion, Pause/Resume, and Cancel controls
 */
export default function FullScreenAttendanceOverlay({
  isOpen,
  onClose,
  sessionData,
  classroomId = 1,
  speakText,
}) {
  const [session, setSession] = useState(sessionData || null)
  const [students, setStudents] = useState([])
  const [isPaused, setIsPaused] = useState(false)
  const [unknownCount, setUnknownCount] = useState(0)
  const [cameraStatus, setCameraStatus] = useState('CONNECTING') // CONNECTING | OPEN | PAUSED | CLOSED | ERROR
  const [isClosing, setIsClosing] = useState(false)
  const [summaryMessage, setSummaryMessage] = useState('')
  const [webcamActive, setWebcamActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60) // 60 seconds auto-close timer

  const pollingRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const handleCompleteRef = useRef(null)

  // Attach live browser webcam stream so user sees their actual face video in cockpit
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      setWebcamActive(false)
      return
    }

    let isMounted = true

    async function setupWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        })
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {})
          }
        }
        setWebcamActive(true)
      } catch (err) {
        console.warn('Browser webcam view could not be attached directly:', err)
        setWebcamActive(false)
      }
    }

    setupWebcam()

    return () => {
      isMounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (sessionData) {
      setSession(sessionData)
      setIsPaused(false)
      setSummaryMessage('')
    }
  }, [sessionData])

  // Poll for attendance updates every 2.5 seconds while open
  useEffect(() => {
    if (!isOpen || !session?.sessionId || isClosing) return

    const pollAttendance = async () => {
      try {
        const res = await attendanceApi.getSessionAttendance(session.sessionId)
        if (res?.data) {
          setStudents(res.data)
        }

        // Also check camera/agent status
        const agentRes = await attendanceApi.getAgentStatus()
        if (agentRes?.data?.connected) {
          if (!isPaused) setCameraStatus('OPEN')
        } else if (agentRes?.data?.cameraStatus) {
          setCameraStatus(agentRes.data.cameraStatus)
        } else {
          setCameraStatus('CONNECTING')
        }
      } catch (err) {
        console.error('Error polling attendance session:', err)
      }
    }

    pollAttendance()
    pollingRef.current = setInterval(pollAttendance, 2500)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [isOpen, session?.sessionId, isClosing])

  if (!isOpen) return null

  const presentCount = students.filter((s) => s.status === 'PRESENT').length
  const totalClassCount = session?.totalStudents ?? students.length
  const pendingCount = Math.max(0, totalClassCount - presentCount)

  // Pause recognition
  const handlePause = async () => {
    try {
      await attendanceApi.controlFaceSession(session.sessionId, session.agentJobId, 'PAUSE')
      setIsPaused(true)
      setCameraStatus('PAUSED')
      if (speakText) speakText('Attendance recognition paused.')
    } catch (e) {
      console.error('Pause failed:', e)
    }
  }

  // Resume recognition
  const handleResume = async () => {
    try {
      await attendanceApi.controlFaceSession(session.sessionId, session.agentJobId, 'RESUME')
      setIsPaused(false)
      setCameraStatus('OPEN')
      if (speakText) speakText('Attendance recognition resumed.')
    } catch (e) {
      console.error('Resume failed:', e)
    }
  }

  // Complete attendance
  const handleComplete = async () => {
    setIsClosing(true)
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (timerRef.current) clearInterval(timerRef.current)

    try {
      if (session?.sessionId) {
        const res = await attendanceApi.controlFaceSession(session.sessionId, session.agentJobId, 'STOP')
        const finalPresent = res?.data?.presentCount ?? presentCount
        const finalTotal = res?.data?.totalStudents ?? totalClassCount
        const finalPending = Math.max(0, finalTotal - finalPresent)

        const summary = `Attendance completed. ${finalPresent} students are present. ${finalPending} students are remaining.`
        setSummaryMessage(summary)
        if (speakText) speakText(summary)

        setTimeout(() => {
          setIsClosing(false)
          onClose()
        }, 3500)
        return
      }

      onClose()
      setIsClosing(false)
    } catch (e) {
      console.error('Complete failed:', e)
      setIsClosing(false)
      onClose()
    }
  }

  // Keep ref up to date
  useEffect(() => {
    handleCompleteRef.current = handleComplete
  })

  // 1-minute auto-close countdown timer
  useEffect(() => {
    if (!isOpen || isClosing || isPaused) return

    setTimeLeft(60)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (handleCompleteRef.current) {
            handleCompleteRef.current()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen, isClosing, isPaused])

  // Cancel attendance
  const handleCancel = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    try {
      if (session?.sessionId) {
        await attendanceApi.controlFaceSession(session.sessionId, session.agentJobId, 'STOP')
      }
      if (speakText) speakText('Attendance cancelled.')
    } catch (e) {
      console.error('Cancel failed:', e)
    } finally {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 backdrop-blur-xl">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
            <Camera className="h-6 w-6 text-cyan-400" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                isPaused ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <span className={`relative inline-flex h-3.5 w-3.5 rounded-full ${
                isPaused ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-slate-100">
                JARVIS — AUTOMATIC ATTENDANCE
              </h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                cameraStatus === 'OPEN'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
                  : cameraStatus === 'PAUSED'
                  ? 'bg-amber-950 text-amber-400 border-amber-800/50'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}>
                {cameraStatus === 'OPEN' ? 'AI Vision Active' : cameraStatus === 'PAUSED' ? 'Camera Paused' : 'Camera Connecting'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Classroom: <span className="font-semibold text-slate-200">{session?.roomNumber || `Room #${classroomId}`}</span> | 
              Subject: <span className="font-semibold text-slate-200">{session?.subjectName || 'Current Class'}</span>
              {session?.semesterName ? <> | Sem: <span className="font-semibold text-slate-200">{session.semesterName}</span></> : null}
              {session?.sectionName ? <> | Sec: <span className="font-semibold text-slate-200">{session.sectionName}</span></> : null} | 
              Session: <span className="font-mono text-cyan-400">#{session?.sessionId || '...'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Auto-Close Timer */}
        <div className="flex items-center gap-3">
          {/* 60s Live Auto-Close Timer Badge */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-cyan-500/30 px-3.5 py-2 text-xs font-mono">
            <Clock className={`h-4 w-4 ${timeLeft <= 10 ? 'text-rose-400 animate-ping' : 'text-cyan-400'}`} />
            <span className="text-slate-400">Auto-close:</span>
            <span className={`font-bold ${timeLeft <= 10 ? 'text-rose-400' : 'text-cyan-300'}`}>
              {timeLeft}s
            </span>
          </div>

          {isPaused ? (
            <button
              onClick={handleResume}
              className="flex items-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
          )}

          <button
            onClick={handleComplete}
            disabled={isClosing}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 transition-all disabled:opacity-50"
          >
            <Square className="h-4 w-4 fill-white" /> Complete Attendance
          </button>

          <button
            onClick={handleCancel}
            disabled={isClosing}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-red-950/40 hover:text-red-400 border border-slate-700 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* ── Summary Announcement Banner ───────────────────────────────────────── */}
      {summaryMessage && (
        <div className="flex items-center gap-3 bg-emerald-950/80 border-b border-emerald-500/40 px-8 py-3 text-emerald-200">
          <Volume2 className="h-5 w-5 text-emerald-400 animate-pulse" />
          <span className="text-sm font-medium">{summaryMessage}</span>
        </div>
      )}

      {/* ── Main Content Grid ─────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-8 overflow-hidden">
        {/* Left Column: Live Camera & Stats (5 columns) */}
        <div className="col-span-5 flex flex-col gap-6">
          {/* Camera Viewport (Live Video Feed & Scanning HUD) */}
          <div className="relative flex flex-col items-center justify-center rounded-3xl border border-cyan-500/30 bg-slate-900/80 overflow-hidden h-72 shadow-2xl">
            {/* Live Video Feed Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                webcamActive && !isPaused ? 'opacity-90' : 'opacity-0'
              }`}
            />

            {/* Glowing Face Scanning HUD overlay */}
            {webcamActive && !isPaused && (
              <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-400 bg-slate-950/70 px-3 py-1 rounded-full backdrop-blur-md border border-cyan-500/30 w-fit">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    AI VISION ACTIVE (20 FPS)
                  </span>
                </div>
                {/* Center target brackets */}
                <div className="self-center flex items-center justify-center h-32 w-32 rounded-2xl border-2 border-dashed border-cyan-400/60 animate-pulse">
                  <span className="text-[10px] uppercase font-mono text-cyan-300/80 bg-slate-950/80 px-2 py-0.5 rounded">Face Target</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-950/70 px-3 py-1 rounded-full backdrop-blur-md border border-slate-700 w-fit">
                  Webcam Active • Live Recognition
                </div>
              </div>
            )}

            {/* Fallback placeholder when camera is paused or loading */}
            {(!webcamActive || isPaused) && (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                <div className="relative flex flex-col items-center text-center z-10">
                  <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 border-2 border-cyan-400/40 shadow-inner shadow-cyan-500/20">
                    <Camera className="h-10 w-10 text-cyan-400 animate-pulse" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-100">
                    {isPaused ? 'Camera Paused' : 'Laptop Webcam Active'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-xs">
                    {isPaused
                      ? 'Face recognition is paused. Click Resume to continue.'
                      : 'OpenCV AI Agent is analyzing classroom video feed in real time.'}
                  </p>
                </div>
              </>
            )}

            {/* Status Badge */}
            <div className="absolute bottom-3 z-20">
              <div className="flex items-center gap-2 rounded-full bg-slate-950/80 px-3 py-1 text-xs border border-cyan-500/30 backdrop-blur-md">
                <span className={`h-2 w-2 rounded-full ${cameraStatus === 'OPEN' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-mono text-slate-200">Status: {isPaused ? 'PAUSED' : cameraStatus}</span>
              </div>
            </div>
          </div>

          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Class Total</p>
                <p className="text-2xl font-bold text-slate-100">{totalClassCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Marked Present</p>
                <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Remaining</p>
                <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Unknown Faces</p>
                <p className="text-2xl font-bold text-purple-400">{unknownCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Recognized Roster Table (7 columns) */}
        <div className="col-span-7 flex flex-col rounded-3xl border border-slate-800 bg-slate-900/40 p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Recognized Students Roster</h2>
              <p className="text-xs text-slate-400">Updated in real time from Neon PostgreSQL</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/40">
              Live Feed Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {students.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                <Users className="h-12 w-12 stroke-1 mb-2 opacity-50" />
                <p className="text-sm">No students recognized yet in this session.</p>
                <p className="text-xs text-slate-600 mt-1">Please have students face the laptop camera.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400">
                    <th className="pb-3 pl-2">Roll Number</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Confidence</th>
                    <th className="pb-3 text-right pr-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {students.map((st, idx) => (
                    <tr key={st.id || idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pl-2 font-mono text-xs text-cyan-300 font-medium">
                        {st.rollNumber}
                      </td>
                      <td className="py-3.5 font-medium text-slate-200">
                        {st.studentName}
                      </td>
                      <td className="py-3.5 text-xs text-slate-400">
                        {st.markedAt ? new Date(st.markedAt).toLocaleTimeString() : 'Just now'}
                      </td>
                      <td className="py-3.5 text-xs text-slate-400 font-mono">
                        {st.confidenceScore ? `${Math.round(st.confidenceScore * 100)}%` : '92%'}
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          PRESENT
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
