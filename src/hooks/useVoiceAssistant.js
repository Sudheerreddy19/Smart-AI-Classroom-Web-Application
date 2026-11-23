import { useCallback, useEffect, useRef, useState } from 'react'
import { aiChatApi } from '../api/aiApi'
import { attendanceApi } from '../api/attendanceApi'

/**
 * Clean markdown formatting (bold, asterisks, bullet points) before passing to SpeechSynthesis.
 */
function cleanTextForSpeech(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
    .replace(/\*(.*?)\*/g, '$1') // remove italic
    .replace(/^[-*•]\s+/gm, '') // remove bullet points
    .replace(/#+\s+/g, '') // remove headers
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // remove inline code / code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // replace links with label
    .trim()
}

/**
 * useVoiceAssistant
 *
 * Ambient background voice assistant for smart classroom kiosks.
 * Listens continuously for "JARVIS" or "Hey JARVIS" using browser-native
 * SpeechRecognition (Web Speech API). Speaks answers using SpeechSynthesis (TTS).
 *
 * Voice Command Set:
 *  - "Hey Jarvis" / "Jarvis" -> Greetings
 *  - "Take attendance" -> Opens full-screen cockpit & starts Python face AI camera
 *  - "Pause attendance" -> Pauses face recognition
 *  - "Resume attendance" -> Resumes face recognition
 *  - "Complete attendance" / "Finish attendance" -> Stops camera & announces summary
 *  - "Cancel attendance" -> Cancels and closes attendance cockpit
 *  - "How many students are present?" -> Speaks present count
 *  - "How many students are remaining?" -> Speaks remaining count
 */
export function useVoiceAssistant(classroomId = 1) {
  // Settings persisted in localStorage
  const [ambientEnabled, setAmbientEnabled] = useState(() => {
    const saved = localStorage.getItem('jarvis_ambient_enabled')
    return saved !== null ? saved === 'true' : true // default ON for classroom kiosk
  })
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    const saved = localStorage.getItem('jarvis_tts_enabled')
    return saved !== null ? saved === 'true' : true // default ON
  })

  // Assistant states: 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
  const [assistantState, setAssistantState] = useState('idle')
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [activeQuestion, setActiveQuestion] = useState('')
  const [activeAnswer, setActiveAnswer] = useState('')
  const [activeCitations, setActiveCitations] = useState([])
  const [errorMessage, setErrorMessage] = useState(null)
  const [isSpeechSupported, setIsSpeechSupported] = useState(true)

  // Full-screen Attendance Cockpit state
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false)
  const [attendanceSession, setAttendanceSession] = useState(null)

  // Real-time Audio Level (0 to 100) for visual feedback / "vibrating" wave when talking
  const [audioLevel, setAudioLevel] = useState(0)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)

  // Internal refs
  const recognitionRef = useRef(null)
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null)
  const isRunningRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const conversationWindowRef = useRef(null)
  const isAwaitingCommandRef = useRef(false)
  const questionDebounceRef = useRef(null)
  const dismissTimerRef = useRef(null)
  const attendanceSessionRef = useRef(null)
  const processQuestionRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const micStreamRef = useRef(null)
  const animFrameRef = useRef(null)

  // Keep session ref updated
  useEffect(() => {
    attendanceSessionRef.current = attendanceSession
  }, [attendanceSession])

  // ── Audio Level Meter (Web Audio API) for vibrating / live mic waveform feedback ──
  useEffect(() => {
    if (!ambientEnabled) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop())
        micStreamRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
      setAudioLevel(0)
      setIsUserSpeaking(false)
      return
    }

    let isMounted = true

    async function initAudioMeter() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        micStreamRef.current = stream
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        const audioCtx = new AudioCtx()
        audioContextRef.current = audioCtx

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.5
        analyserRef.current = analyser

        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const checkVolume = () => {
          if (!isMounted) return
          analyser.getByteFrequencyData(dataArray)

          // Calculate average volume
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const avg = sum / dataArray.length
          // Normalize to 0 - 100 range
          const normalized = Math.min(100, Math.round((avg / 128) * 100))

          setAudioLevel(normalized)
          // Consider user speaking if volume threshold is crossed (> 8%) and JARVIS isn't speaking
          setIsUserSpeaking(normalized > 8 && !isSpeakingRef.current)

          animFrameRef.current = requestAnimationFrame(checkVolume)
        }

        checkVolume()
      } catch (err) {
        console.warn('[JARVIS AudioMeter] Mic meter unavailable:', err)
      }
    }

    initAudioMeter()

    return () => {
      isMounted = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop())
        micStreamRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [ambientEnabled])

  // ── Speech Synthesis (TTS) Helper ──────────────────────────────────────────
  const speakText = useCallback(
    (textToSpeak) => {
      if (!ttsEnabled || !synthRef.current) return

      const clean = cleanTextForSpeech(textToSpeak)
      if (!clean) return

      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(clean)
      utterance.rate = 1.05
      utterance.pitch = 1.0
      utterance.lang = 'en-US'

      const voices = synthRef.current.getVoices()
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') ||
            v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('David') ||
            v.name.includes('Zira')),
      )
      if (preferred) utterance.voice = preferred

      utterance.onstart = () => {
        isSpeakingRef.current = true
        setAssistantState('speaking')
      }

      utterance.onend = () => {
        isSpeakingRef.current = false
        if (isAwaitingCommandRef.current) {
          setAssistantState('listening')
        } else {
          setAssistantState('idle')
        }
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
        dismissTimerRef.current = setTimeout(() => {
          if (!isAwaitingCommandRef.current) {
            setIsOverlayOpen(false)
            setTranscript('')
          }
        }, 5000)
      }

      utterance.onerror = () => {
        isSpeakingRef.current = false
        setAssistantState(isAwaitingCommandRef.current ? 'listening' : 'idle')
      }

      synthRef.current.speak(utterance)
    },
    [ttsEnabled],
  )

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    setAssistantState('idle')
  }, [])

  // ── Handle Specific Attendance Voice Commands ──────────────────────────────
  const handleAttendanceCommand = useCallback(
    async (commandText) => {
      const lower = commandText.toLowerCase()

      // 1. "Take attendance"
      if (lower.includes('take attendance') || lower.includes('start attendance')) {
        speakText('Starting attendance. Please wait while I recognize the students.')
        setIsOverlayOpen(false)
        setIsAttendanceOpen(true)

        try {
          const res = await attendanceApi.startFaceSession({
            classroomId: classroomId,
            sessionDate: new Date().toISOString().split('T')[0],
            startTime: new Date().toTimeString().split(' ')[0],
          })

          if (res?.data?.status === 'STARTED') {
            setAttendanceSession(res.data)
          } else if (res?.data?.status === 'AGENT_OFFLINE') {
            speakText('Classroom laptop camera is offline. Please make sure the Python agent is running.')
          } else if (res?.data?.status === 'NO_ACTIVE_CLASS') {
            speakText(res.data.message || 'No scheduled class slot found for this classroom. Please check the timetable.')
          } else if (res?.data?.message) {
            speakText(res.data.message)
          }
        } catch (err) {
          console.error('[JARVIS] Start attendance error:', err)
          const errorMsg = err?.response?.data?.message || err?.message || 'Could not connect to the attendance service.'
          speakText(errorMsg)
        }
        return true
      }

      // 2. "Pause attendance"
      if (lower.includes('pause attendance')) {
        const cur = attendanceSessionRef.current
        if (cur?.sessionId) {
          try {
            await attendanceApi.controlFaceSession(cur.sessionId, cur.agentJobId, 'PAUSE')
            speakText('Attendance paused.')
          } catch (e) {
            speakText('Failed to pause attendance.')
          }
        } else {
          speakText('There is no active attendance session to pause.')
        }
        return true
      }

      // 3. "Resume attendance"
      if (lower.includes('resume attendance')) {
        const cur = attendanceSessionRef.current
        if (cur?.sessionId) {
          try {
            await attendanceApi.controlFaceSession(cur.sessionId, cur.agentJobId, 'RESUME')
            speakText('Attendance resumed.')
          } catch (e) {
            speakText('Failed to resume attendance.')
          }
        } else {
          speakText('There is no active attendance session to resume.')
        }
        return true
      }

      // 4. "Complete attendance" / "Finish attendance"
      if (lower.includes('complete attendance') || lower.includes('finish attendance')) {
        const cur = attendanceSessionRef.current
        if (cur?.sessionId) {
          try {
            const res = await attendanceApi.controlFaceSession(cur.sessionId, cur.agentJobId, 'STOP')
            const present = res?.data?.presentCount ?? 0
            const total = res?.data?.totalStudents ?? 0
            const remaining = Math.max(0, total - present)
            speakText(`Attendance completed. ${present} students are present. ${remaining} students are remaining.`)
            setTimeout(() => {
              setIsAttendanceOpen(false)
              setAttendanceSession(null)
            }, 3000)
          } catch (e) {
            speakText('Failed to complete attendance session.')
          }
        } else {
          speakText('No attendance session is currently active.')
        }
        return true
      }

      // 5. "Cancel attendance"
      if (lower.includes('cancel attendance')) {
        const cur = attendanceSessionRef.current
        if (cur?.sessionId) {
          try {
            await attendanceApi.controlFaceSession(cur.sessionId, cur.agentJobId, 'STOP')
          } catch (e) {}
        }
        setIsAttendanceOpen(false)
        setAttendanceSession(null)
        speakText('Attendance session cancelled.')
        return true
      }

      // 6. "How many students are present"
      if (lower.includes('how many') && lower.includes('present')) {
        const cur = attendanceSessionRef.current
        if (cur?.sessionId) {
          try {
            const res = await attendanceApi.getSessionAttendance(cur.sessionId)
            const present = res.data?.filter((s) => s.status === 'PRESENT').length || 0
            speakText(`${present} students have been marked present so far.`)
          } catch (e) {
            speakText('Could not retrieve present count.')
          }
        } else {
          speakText('No attendance session is running.')
        }
        return true
      }

      // 7. "How many students are remaining"
      if (lower.includes('how many') && (lower.includes('remaining') || lower.includes('pending') || lower.includes('absent'))) {
        const cur = attendanceSessionRef.current
        if (cur?.sessionId) {
          try {
            const res = await attendanceApi.getSessionAttendance(cur.sessionId)
            const present = res.data?.filter((s) => s.status === 'PRESENT').length || 0
            const total = cur.totalStudents ?? 0
            const pending = Math.max(0, total - present)
            speakText(`${pending} students are remaining.`)
          } catch (e) {
            speakText('Could not retrieve remaining count.')
          }
        } else {
          speakText('No attendance session is running.')
        }
        return true
      }

      // 8. General Greeting
      if (lower === 'hello' || lower === 'hi' || lower === 'hey' || lower === '' || lower === 'jarvis') {
        speakText('Hello, teacher. How can I help you?')
        return true
      }

      return false // Not an attendance command, pass to AI
    },
    [classroomId, speakText],
  )

  // Process question callback
  const processQuestion = useCallback(
    async (query) => {
      const q = query.trim()
      if (!q) return

      // First check if this is an attendance command
      const isAttendanceHandled = await handleAttendanceCommand(q)
      if (isAttendanceHandled) return

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)

      setIsOverlayOpen(true)
      setActiveQuestion(q)
      setTranscript('')
      setAssistantState('processing')
      setErrorMessage(null)

      try {
        const response = await aiChatApi.ask(q, classroomId)
        const answer = response.data?.answer || 'I could not find an answer to that question.'
        const citations = response.data?.citations || []

        setActiveAnswer(answer)
        setActiveCitations(citations)
        speakText(answer)
      } catch (err) {
        console.error('[JARVIS] Question error:', err)
        const friendly =
          err.status === 429
            ? 'Rate limit reached. Please wait a moment.'
            : err.status === 503
            ? 'Service temporarily overloaded. Please try again.'
            : err.message || 'Could not reach JARVIS backend.'
        setErrorMessage(friendly)
        setAssistantState('error')
        speakText('Sorry, I encountered an issue connecting to the classroom service.')
      }
    },
    [classroomId, handleAttendanceCommand, speakText],
  )

  // Keep latest processQuestion in ref so recognition never needs to recreate
  useEffect(() => {
    processQuestionRef.current = processQuestion
  }, [processQuestion])

  // ── Wake Word & Speech Recognition Setup ───────────────────────────────────
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null

    if (!SpeechRecognition) {
      console.warn('[JARVIS] Web SpeechRecognition API is not supported in this browser.')
      setIsSpeechSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    // Wake word pattern: "Jarvis", "Hey Jarvis", "OK Jarvis", "Hi Jarvis"
    const wakeWordPattern = /(?:hey\s+|ok\s+|hi\s+)?jarvis[,:\s]*/i

    recognition.onresult = (event) => {
      // Ignore incoming speech if JARVIS is currently speaking to prevent feedback echo
      if (isSpeakingRef.current) return

      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i]
        const text = item[0].transcript
        if (item.isFinal) {
          final += text
        } else {
          interim += text
        }
      }

      const currentSpeech = (final || interim).trim()
      if (!currentSpeech) return

      console.log('[JARVIS HEARD]:', currentSpeech)
      setTranscript(currentSpeech)

      const lower = currentSpeech.toLowerCase()

      // DIRECT ATTENDANCE COMMANDS (no need to say "Jarvis" first if teacher just speaks the command!)
      const isDirectAttendance =
        lower.includes('attendance') ||
        lower.includes('present') ||
        lower.includes('remaining') ||
        lower.includes('absent') ||
        lower.includes('student')

      if (isDirectAttendance) {
        setIsOverlayOpen(true)
        setAssistantState('listening')
        if (conversationWindowRef.current) clearTimeout(conversationWindowRef.current)
        if (questionDebounceRef.current) clearTimeout(questionDebounceRef.current)

        questionDebounceRef.current = setTimeout(() => {
          if (processQuestionRef.current) processQuestionRef.current(currentSpeech)
        }, 500)
        return
      }

      // Flexible wake word matching (Jarvis, Hey Jarvis, etc.)
      const isWakeWord =
        wakeWordPattern.test(currentSpeech) ||
        lower.includes('jarvis') ||
        lower.includes('jarves') ||
        lower.includes('javis')

      if (isWakeWord) {
        setIsOverlayOpen(true)
        setAssistantState('listening')

        // Extract any phrase after the wake word
        const parts = currentSpeech.split(wakeWordPattern)
        let trailingPhrase = parts[parts.length - 1]?.trim() || ''
        trailingPhrase = trailingPhrase.replace(/jarv[ia][sv]?[se]?/gi, '').trim()

        if (trailingPhrase && trailingPhrase.length > 2) {
          // e.g. "Jarvis take attendance"
          isAwaitingCommandRef.current = false
          if (conversationWindowRef.current) clearTimeout(conversationWindowRef.current)
          if (questionDebounceRef.current) clearTimeout(questionDebounceRef.current)

          questionDebounceRef.current = setTimeout(() => {
            if (processQuestionRef.current) processQuestionRef.current(trailingPhrase)
          }, 600)
        } else {
          // User ONLY said "Jarvis"
          isAwaitingCommandRef.current = true
          speakText('Hello, teacher. How can I help you?')

          if (conversationWindowRef.current) clearTimeout(conversationWindowRef.current)
          conversationWindowRef.current = setTimeout(() => {
            isAwaitingCommandRef.current = false
            setAssistantState('idle')
          }, 12000)
        }
      } else if (isAwaitingCommandRef.current) {
        // Teacher previously said Jarvis and is now giving a command or asking a question
        if (currentSpeech.length > 1) {
          if (questionDebounceRef.current) clearTimeout(questionDebounceRef.current)
          questionDebounceRef.current = setTimeout(() => {
            isAwaitingCommandRef.current = false
            if (conversationWindowRef.current) clearTimeout(conversationWindowRef.current)
            if (processQuestionRef.current) processQuestionRef.current(currentSpeech)
          }, 600)
        }
      }
    }

    recognition.onerror = (event) => {
      // 'aborted' and 'no-speech' are harmless benign events
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[JARVIS SpeechRecognition error]:', event.error)
        if (event.error === 'not-allowed') {
          isRunningRef.current = false
          setErrorMessage('Microphone access blocked. Click the lock/tune icon in the browser address bar and allow Microphone.')
          setAssistantState('error')
        } else if (event.error === 'network') {
          // Chrome speech recognition uses Google cloud servers; backoff if network error
          isRunningRef.current = false
          setTimeout(() => {
            if (ambientEnabled) {
              isRunningRef.current = true
              try { recognition.start() } catch {}
            }
          }, 3000)
        }
      }
    }

    recognition.onend = () => {
      if (isRunningRef.current && ambientEnabled) {
        setTimeout(() => {
          try {
            if (isRunningRef.current) {
              recognition.start()
            }
          } catch (e) {
            // benign already started
          }
        }, 600)
      } else {
        setAssistantState('idle')
      }
    }

    if (ambientEnabled) {
      isRunningRef.current = true
      try {
        recognition.start()
      } catch (e) {}
    }

    return () => {
      isRunningRef.current = false
      try {
        recognition.abort()
      } catch {}
    }
  }, [ambientEnabled, speakText])

  // Sync Listening State when ambientEnabled toggle changes
  useEffect(() => {
    const recognition = recognitionRef.current
    if (!recognition || !isSpeechSupported) return

    if (ambientEnabled) {
      isRunningRef.current = true
      try {
        recognition.start()
        setAssistantState('idle')
      } catch {}
    } else {
      isRunningRef.current = false
      try {
        recognition.stop()
        setAssistantState('idle')
      } catch {}
    }
  }, [ambientEnabled, isSpeechSupported])

  // Keyboard shortcut: Ctrl+Space toggles assistant overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault()
        setIsOverlayOpen((prev) => !prev)
        if (!isOverlayOpen) {
          setAssistantState('listening')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOverlayOpen])

  // Public controls
  const toggleAmbient = useCallback(() => {
    setAmbientEnabled((prev) => {
      const next = !prev
      localStorage.setItem('jarvis_ambient_enabled', String(next))
      return next
    })
  }, [])

  const toggleTts = useCallback(() => {
    setTtsEnabled((prev) => {
      const next = !prev
      localStorage.setItem('jarvis_tts_enabled', String(next))
      if (!next && synthRef.current) synthRef.current.cancel()
      return next
    })
  }, [])

  const manualAsk = useCallback(
    (question) => {
      processQuestion(question)
    },
    [processQuestion],
  )

  const dismissOverlay = useCallback(() => {
    stopSpeaking()
    setIsOverlayOpen(false)
    setTranscript('')
  }, [stopSpeaking])

  return {
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
    speakText,
    dismissOverlay,
    // Live mic wave & audio vibration level
    audioLevel,
    isUserSpeaking,
    // Attendance overlay state & controls
    isAttendanceOpen,
    setIsAttendanceOpen,
    attendanceSession,
  }
}
