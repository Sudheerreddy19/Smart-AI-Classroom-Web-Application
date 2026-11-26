import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  Camera, Users, CheckCircle2, XCircle, RefreshCw,
  Building2, BookOpen, User, AlertTriangle,
  Play, Clock, Award, ChevronRight, Scan, Eye, ShieldCheck, Check
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const STATUS_COLORS = {
  NOT_REGISTERED:  { bg: "#fef2f2", text: "#dc2626", label: "Not Registered" },
  ACCOUNT_CREATED: { bg: "#eff6ff", text: "#2563eb", label: "Account Created" },
  FACE_REGISTERED: { bg: "#f0fdf4", text: "#16a34a", label: "Face Registered" },
};

export default function FaceRegistration() {
  const [departments, setDepartments] = useState([]);
  const [semesters,   setSemesters]   = useState([]);
  const [students,    setStudents]    = useState([]);

  const [selDept, setSelDept] = useState("");
  const [selSem,  setSelSem]  = useState("");

  const [loading, setLoading]                 = useState(false);
  const [activeStudent, setActiveStudent]     = useState(null);
  const [modalOpen, setModalOpen]             = useState(false);
  const [captureResult, setCaptureResult]     = useState(null);

  // ── Load departments ────────────────────────────────────────────────────
  useEffect(() => {
    axiosClient.get("/departments").then(({ data }) => {
      setDepartments(Array.isArray(data) ? data : data.content ?? []);
    }).catch(() => toast.error("Failed to load departments."));
  }, []);

  // ── Load semesters when dept changes ───────────────────────────────────
  useEffect(() => {
    if (!selDept) { setSemesters([]); setSelSem(""); return; }
    axiosClient.get(`/semesters/department/${selDept}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.content ?? [];
        list.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
        setSemesters(list);
        setSelSem("");
      })
      .catch(() => toast.error("Failed to load semesters."));
  }, [selDept]);

  // ── Load students when dept + sem selected ─────────────────────────────
  useEffect(() => {
    if (!selDept || !selSem) { setStudents([]); return; }
    setLoading(true);
    axiosClient.get(`/students/department/${selDept}/semester/${selSem}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.content ?? [];
        setStudents(list);
      })
      .catch(() => toast.error("Failed to load students."))
      .finally(() => setLoading(false));
  }, [selDept, selSem]);

  // ── Open Alignment Modal ───────────────────────────────────────────────
  const handleOpenCapture = (student) => {
    if (student.registrationStatus === "NOT_REGISTERED") {
      toast.error("Student must create their account first before face registration.");
      return;
    }
    if (student.registrationStatus === "FACE_REGISTERED") {
      const reCapture = window.confirm(
        `${student.firstName} ${student.lastName} already has face data. Re-capture and overwrite?`
      );
      if (!reCapture) return;
    }

    setActiveStudent(student);
    setCaptureResult(null);
    setModalOpen(true);
  };

  const handleCaptureSuccess = (studentId, data) => {
    setStudents(prev => prev.map(s =>
      s.id === studentId
        ? { ...s, registrationStatus: "FACE_REGISTERED" }
        : s
    ));
    setCaptureResult({ ...data, studentName: `${activeStudent.firstName} ${activeStudent.lastName}` });
  };

  // Stats
  const stats = {
    total:       students.length,
    notReg:      students.filter(s => s.registrationStatus === "NOT_REGISTERED").length,
    acctCreated: students.filter(s => s.registrationStatus === "ACCOUNT_CREATED").length,
    faceReg:     students.filter(s => s.registrationStatus === "FACE_REGISTERED").length,
  };

  return (
    <div className="fr-page">
      {/* Live Biometric Camera & Face Alignment Modal */}
      {modalOpen && activeStudent && (
        <CaptureScreenModal
          student={activeStudent}
          onSuccess={(data) => handleCaptureSuccess(activeStudent.id, data)}
          onClose={() => { setModalOpen(false); setActiveStudent(null); }}
        />
      )}

      {/* Header */}
      <div className="fr-header">
        <div className="fr-header-icon"><Camera size={28} /></div>
        <div>
          <h1 className="fr-title">Face Registration</h1>
          <p className="fr-sub">Select a batch and capture biometric face encodings for each student.</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="fr-how">
        {[
          ["1", "Select Department + Semester", Building2],
          ["2", "Choose a student from the list", Users],
          ["3", "Click Capture Face", Camera],
          ["4", "Align face in the live green guide", Play],
        ].map(([num, text, Icon]) => (
          <div key={num} className="fr-how-step">
            <div className="fr-how-num">{num}</div>
            <Icon size={16} />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Class AI Agent Status Banner */}
      <AgentStatusBanner />

      {/* Filters */}
      <div className="fr-filters">
        <div className="fr-filter-group">
          <label><Building2 size={14} /> Department</label>
          <select value={selDept} onChange={e => { setSelDept(e.target.value); setSelSem(""); }}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <ChevronRight size={20} className="fr-arrow" />
        <div className="fr-filter-group">
          <label><BookOpen size={14} /> Semester</label>
          <select value={selSem} onChange={e => setSelSem(e.target.value)} disabled={!selDept}>
            <option value="">Select Semester</option>
            {semesters.map(s => <option key={s.id} value={s.id}>Sem {s.number}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Row */}
      {students.length > 0 && (
        <div className="fr-stats">
          {[
            { label: "Total", val: stats.total,       color: "#6366f1" },
            { label: "Not Registered", val: stats.notReg,    color: "#ef4444" },
            { label: "Account Created", val: stats.acctCreated, color: "#3b82f6" },
            { label: "Face Registered", val: stats.faceReg,   color: "#22c55e" },
          ].map(({ label, val, color }) => (
            <div key={label} className="fr-stat" style={{ borderLeft: `4px solid ${color}` }}>
              <div className="fr-stat-num" style={{ color }}>{val}</div>
              <div className="fr-stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Capture Result Banner */}
      {captureResult && (
        <div className={`fr-result ${captureResult.success ? "fr-result--ok" : "fr-result--err"}`}>
          {captureResult.success
            ? <CheckCircle2 size={20} />
            : <XCircle size={20} />}
          <div>
            <strong>{captureResult.success ? "Face Registered Successfully!" : "Capture Failed"}</strong>
            <span> — {captureResult.message}</span>
            {captureResult.success && (
              <span className="fr-result-detail"> ({captureResult.imagesCaptured || 20} images captured and encoded)</span>
            )}
          </div>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="fr-loading"><RefreshCw size={24} className="fr-spin" /> Loading students…</div>
      ) : !selDept || !selSem ? (
        <div className="fr-empty">
          <Camera size={48} className="fr-empty-icon" />
          <p>Select a Department and Semester to view students.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="fr-empty">
          <Users size={48} className="fr-empty-icon" />
          <p>No students found in this batch.</p>
        </div>
      ) : (
        <div className="fr-table-wrap">
          <table className="fr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Section</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const statusCfg = STATUS_COLORS[s.registrationStatus] || STATUS_COLORS.NOT_REGISTERED;
                const canCapture  = s.registrationStatus !== "NOT_REGISTERED";

                return (
                  <tr key={s.id}>
                    <td className="fr-td-num">{i + 1}</td>
                    <td>
                      <div className="fr-student-cell">
                        <div className="fr-avatar">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="fr-name">{s.firstName} {s.lastName}</div>
                          <div className="fr-email">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><code className="fr-roll">{s.rollNumber}</code></td>
                    <td>{s.sectionName || "—"}</td>
                    <td>
                      <span className="fr-status" style={{ background: statusCfg.bg, color: statusCfg.text }}>
                        {s.registrationStatus === "FACE_REGISTERED" && <Award size={12} />}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td>
                      {canCapture ? (
                        <button
                          className={`fr-capture-btn ${s.registrationStatus === "FACE_REGISTERED" ? "fr-capture-btn--re" : "fr-capture-btn--new"}`}
                          onClick={() => handleOpenCapture(s)}
                        >
                          <Camera size={14} /> {s.registrationStatus === "FACE_REGISTERED" ? "Re-Capture" : "Capture Face"}
                        </button>
                      ) : (
                        <span className="fr-no-acct">Account not created</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .fr-page {
          padding: 2rem;
          max-width: 1100px;
          margin: 0 auto;
          display: flex; flex-direction: column; gap: 1.5rem;
          font-family: 'Inter', sans-serif;
        }

        .fr-header { display: flex; align-items: center; gap: 1rem; }
        .fr-header-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }
        .fr-title { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; }
        .fr-sub   { color: #64748b; margin: 4px 0 0; font-size: 0.9rem; }

        .fr-how {
          display: flex; gap: 1rem;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 1rem 1.5rem;
          overflow-x: auto;
        }
        .fr-how-step {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.82rem; color: #475569; white-space: nowrap;
        }
        .fr-how-num {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; font-weight: 700; font-size: 0.72rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .fr-filters {
          display: flex; align-items: flex-end; gap: 0.75rem;
          background: white; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: 1.25rem 1.5rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .fr-filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .fr-filter-group label {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; font-weight: 600; color: #475569;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .fr-filter-group select {
          padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 0.88rem; color: #1e293b; background: #f8fafc;
          outline: none; cursor: pointer; transition: border-color 0.2s;
          font-family: inherit;
        }
        .fr-filter-group select:focus { border-color: #6366f1; background: white; }
        .fr-filter-group select:disabled { opacity: 0.5; cursor: not-allowed; }
        .fr-arrow { color: #cbd5e1; flex-shrink: 0; }

        .fr-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
        }
        .fr-stat {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 1rem 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .fr-stat-num   { font-size: 1.75rem; font-weight: 800; }
        .fr-stat-label { font-size: 0.78rem; color: #64748b; font-weight: 500; }

        .fr-result {
          display: flex; align-items: center; gap: 12px;
          border-radius: 12px; padding: 1rem 1.25rem;
          font-size: 0.88rem;
        }
        .fr-result--ok  { background: #f0fdf4; border: 1px solid #86efac; color: #166534; }
        .fr-result--err { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .fr-result-detail { opacity: 0.7; }

        .fr-loading {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 3rem; color: #64748b; font-size: 0.9rem;
        }
        .fr-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 1rem; padding: 4rem;
          color: #94a3b8;
        }
        .fr-empty-icon { opacity: 0.4; }
        .fr-empty p { margin: 0; font-size: 0.9rem; }

        .fr-table-wrap {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
        }
        .fr-table { width: 100%; border-collapse: collapse; }
        .fr-table thead tr {
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
        }
        .fr-table th {
          padding: 12px 16px; text-align: left;
          font-size: 0.75rem; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .fr-table tbody tr {
          border-bottom: 1px solid #f1f5f9; transition: background 0.15s;
        }
        .fr-table tbody tr:hover { background: #f8fafc; }
        .fr-table tbody tr:last-child { border-bottom: none; }
        .fr-table td { padding: 12px 16px; vertical-align: middle; }
        .fr-td-num { color: #94a3b8; font-size: 0.83rem; font-weight: 500; }

        .fr-student-cell { display: flex; align-items: center; gap: 10px; }
        .fr-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }
        .fr-name  { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
        .fr-email { font-size: 0.78rem; color: #94a3b8; }
        .fr-roll  { background: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-size: 0.82rem; color: #475569; }

        .fr-status {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 99px; font-size: 0.78rem; font-weight: 600;
        }

        .fr-capture-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px; border: none;
          cursor: pointer; font-family: inherit; font-size: 0.82rem; font-weight: 600;
          transition: all 0.15s;
        }
        .fr-capture-btn--new {
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: white;
        }
        .fr-capture-btn--new:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(14,165,233,0.4); }
        .fr-capture-btn--re {
          background: #fef9c3; color: #92400e; border: 1px solid #fde047;
        }
        .fr-capture-btn--re:hover:not(:disabled) { background: #fef08a; }
        .fr-capture-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .fr-no-acct { font-size: 0.78rem; color: #94a3b8; font-style: italic; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .fr-spin { animation: spin 1s linear infinite; }

        @media (max-width: 768px) {
          .fr-stats { grid-template-columns: repeat(2, 1fr); }
          .fr-filters { flex-direction: column; }
          .fr-arrow { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}

// ── Live Biometric Camera & Face Alignment Modal ──────────────────────────────
function CaptureScreenModal({ student, onSuccess, onClose }) {
  const videoRef      = useRef(null);
  const streamRef     = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isAligned,   setIsAligned]   = useState(false);
  const [alignmentMsg, setAlignmentMsg] = useState("Position face inside the oval");
  
  // Stages: "aligning" | "capturing" | "success" | "error"
  const [stage, setStage]             = useState("aligning");
  const [statusMsg, setStatusMsg]     = useState("");
  const [elapsed, setElapsed]         = useState(0);
  const [frameProgress, setFrameProgress] = useState(0);
  const [realFramesCaptured, setRealFramesCaptured] = useState(0);
  const [existingStudent, setExistingStudent] = useState(null);  // For duplicate detection

  // Animated frame counter during capture stage (1-5 frames)
  useEffect(() => {
    let frameTimer = null;
    if (stage === "capturing") {
      setFrameProgress(1);
      frameTimer = setInterval(() => {
        setFrameProgress(prev => {
          if (prev >= 5) return 5;
          return prev + 1;
        });
      }, 700);
    } else {
      setFrameProgress(0);
      clearInterval(frameTimer);
    }
    return () => clearInterval(frameTimer);
  }, [stage]);

  // Activate browser webcam for alignment
  useEffect(() => {
    let active = true;
    let stream = null;

    async function initCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false
        });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {});
            setCameraReady(true);
          };
        }
      } catch (err) {
        console.warn("Browser camera access error:", err);
        setCameraError("Camera permission needed. Please allow webcam access in your browser.");
      }
    }

    if (stage === "aligning") {
      initCamera();
    }

    // Alignment verification loop
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const interval = setInterval(async () => {
      if (stage !== "aligning") return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      const v = videoRef.current;

      // Try browser native FaceDetector if available
      if (window.FaceDetector) {
        try {
          const detector = new window.FaceDetector({ fastMode: true });
          const faces = await detector.detect(v);
          if (faces.length === 0) {
            setIsAligned(false);
            setAlignmentMsg("POSITION FACE INSIDE OVAL");
            return;
          }
          if (faces.length > 1) {
            setIsAligned(false);
            setAlignmentMsg("MULTIPLE FACES — ONLY 1 PERSON");
            return;
          }
          const box = faces[0].boundingBox;
          const vW = v.videoWidth || 640;
          const vH = v.videoHeight || 480;
          const faceCx = box.x + box.width / 2;
          const faceCy = box.y + box.height / 2;
          const dx = Math.abs(faceCx - vW / 2);
          const dy = Math.abs(faceCy - vH / 2);

          if (dx > vW * 0.16) {
            setIsAligned(false);
            setAlignmentMsg("CENTER FACE HORIZONTALLY");
            return;
          }
          if (dy > vH * 0.16) {
            setIsAligned(false);
            setAlignmentMsg("CENTER FACE VERTICALLY");
            return;
          }
          if (box.height < vH * 0.28) {
            setIsAligned(false);
            setAlignmentMsg("MOVE CLOSER TO CAMERA");
            return;
          }
          setIsAligned(true);
          setAlignmentMsg("FACE ALIGNED & CLEAR ✓");
          return;
        } catch (e) {}
      }

      // Fast Canvas Luminance & Sharpness Analyzer
      ctx.drawImage(v, 0, 0, 160, 120);
      try {
        const imgData = ctx.getImageData(0, 0, 160, 120);
        const data = imgData.data;
        const cx = 80;
        const cy = 58;
        const rx = 36;
        const ry = 48;

        let centerPixels = 0;
        let skinPixels = 0;
        let totalLum = 0;
        let edgeGrad = 0;

        for (let y = 2; y < 118; y += 3) {
          for (let x = 2; x < 158; x += 3) {
            const normDist = ((x - cx) ** 2) / (rx ** 2) + ((y - cy) ** 2) / (ry ** 2);
            if (normDist <= 1.0) {
              centerPixels++;
              const idx = (y * 160 + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              totalLum += lum;

              if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) >= 8) {
                skinPixels++;
              }

              const left = (y * 160 + (x - 2)) * 4;
              const right = (y * 160 + (x + 2)) * 4;
              edgeGrad += Math.abs(r - data[left]) + Math.abs(r - data[right]);
            }
          }
        }

        const avgLum = totalLum / Math.max(1, centerPixels);
        const skinRatio = skinPixels / Math.max(1, centerPixels);
        const sharpness = edgeGrad / Math.max(1, centerPixels);

        if (avgLum < 25) {
          setIsAligned(false);
          setAlignmentMsg("LIGHTING TOO DARK — FACE LIGHT");
        } else if (skinRatio < 0.14) {
          setIsAligned(false);
          setAlignmentMsg("POSITION FACE INSIDE OVAL");
        } else if (sharpness < 5) {
          setIsAligned(false);
          setAlignmentMsg("HOLD STILL — UNBLURRING");
        } else {
          setIsAligned(true);
          setAlignmentMsg("FACE ALIGNED & CLEAR ✓");
        }
      } catch (err) {}
    }, 150);

    return () => {
      active = false;
      clearInterval(interval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [stage]);

  // Elapsed timer during capturing
  useEffect(() => {
    let t = null;
    if (stage === "capturing") {
      setElapsed(0);
      t = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(t);
    }
    return () => clearInterval(t);
  }, [stage]);

  // ── START BIOMETRIC CAPTURE (Release browser cam -> Call Python AI Agent) ───
  const startBiometricCapture = async () => {
    // 1. CRITICAL: Stop browser camera tracks immediately so hardware webcam is 100% free for Python!
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStage("capturing");
    setExistingStudent(null);
    setRealFramesCaptured(0);
    setStatusMsg("Class AI Agent is capturing biometric frames... Look directly at the camera.");

    try {
      // 2. Call backend -> dispatches CAPTURE_JOB to Python Agent via WebSocket
      const camIdx = (typeof localStorage !== 'undefined' && localStorage.getItem('classai_preferred_camera_index')) || '0';
      const { data } = await axiosClient.post(/faces/register/?cameraIndex=);
      
      if (data.success) {
        const frames = data.imagesCaptured || 20;
        setRealFramesCaptured(frames);
        setStage("success");
        setStatusMsg(`Face registered! ${frames} biometric frames captured & encoded.`);
        toast.success(`✅ Face registered for ${student.firstName}! (${frames} frames)`);
        onSuccess(data);
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setStage("error");
        setStatusMsg(data.message || "Face capture failed. Please retry.");
        // If duplicate face detected, store existing student info
        if (data.existingStudent) {
          setExistingStudent(data.existingStudent);
        }
      }
    } catch (err) {
      setStage("error");
      const errData = err.response?.data;
      const msg = errData?.message || "Capture failed. Ensure Class AI service is running on laptop.";
      setStatusMsg(msg);
      if (errData?.existingStudent) {
        setExistingStudent(errData.existingStudent);
      }
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.88)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: 16
    }}>
      <div style={{
        background: "#0f172a",
        border: `2px solid ${stage === "success" ? "#22c55e" : stage === "error" ? "#ef4444" : isAligned ? "#22c55e" : "#ef4444"}`,
        borderRadius: 22,
        maxWidth: 540,
        width: "100%",
        padding: "22px 26px",
        boxShadow: isAligned || stage === "success"
          ? "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(34, 197, 94, 0.25)"
          : "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(239, 68, 68, 0.25)",
        color: "#f8fafc",
        fontFamily: "'Inter', sans-serif",
        transition: "border-color 0.3s, box-shadow 0.3s"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid #1e293b", paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: stage === "success" ? "#16a34a" : stage === "capturing" ? "#0284c7" : isAligned ? "#16a34a" : "#dc2626",
              boxShadow: isAligned ? "0 0 12px #22c55e" : "0 0 12px #ef4444",
              transition: "all 0.3s"
            }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#f8fafc" }}>
                {stage === "capturing" ? "Biometric Recording in Progress" : stage === "success" ? "Registration Complete!" : "Live Face Alignment"}
              </div>
              <div style={{ fontSize: 12, color: isAligned || stage === "success" ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                {stage === "capturing" ? "Hold still while AI encodes face…" : stage === "success" ? "Verified & Saved" : isAligned ? "✓ Face Aligned & Clear" : "● Align Face Inside Oval"}
              </div>
            </div>
          </div>
          {stage === "capturing" && (
            <div style={{ background: "#1e293b", padding: "4px 12px", borderRadius: 99, fontSize: 13, fontWeight: 700, color: "#38bdf8", border: "1px solid #334155" }}>
              ⏱ {elapsed}s
            </div>
          )}
        </div>

        {/* Real Webcam Viewport (Stage === "aligning") */}
        {stage === "aligning" && (
          <div style={{
            position: "relative",
            height: 250,
            background: "#020617",
            borderRadius: 16,
            border: `2px solid ${isAligned ? "#22c55e" : "#ef4444"}`,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.6)",
            transition: "border-color 0.3s"
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
                display: cameraReady ? "block" : "none"
              }}
            />

            {!cameraReady && (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: 20 }}>
                <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
                <div style={{ fontSize: 13 }}>{cameraError || "Activating laptop camera…"}</div>
              </div>
            )}

            {/* Oval Alignment Reticle Overlay */}
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}>
              <div style={{
                width: 140,
                height: 190,
                borderRadius: "50%",
                border: `3px dashed ${isAligned ? "#22c55e" : "#ef4444"}`,
                boxShadow: isAligned
                  ? "0 0 25px rgba(34, 197, 94, 0.7), inset 0 0 20px rgba(34, 197, 94, 0.3)"
                  : "0 0 25px rgba(239, 68, 68, 0.7), inset 0 0 20px rgba(239, 68, 68, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "all 0.25s ease"
              }}>
                <div style={{ position: "absolute", top: -5, left: 65, width: 10, height: 3, background: "#fff", borderRadius: 2 }} />
                <div style={{ position: "absolute", bottom: -5, left: 65, width: 10, height: 3, background: "#fff", borderRadius: 2 }} />
                <div style={{ position: "absolute", left: -5, top: 90, width: 3, height: 10, background: "#fff", borderRadius: 2 }} />
                <div style={{ position: "absolute", right: -5, top: 90, width: 3, height: 10, background: "#fff", borderRadius: 2 }} />
              </div>

              <div style={{
                position: "absolute",
                bottom: 12,
                background: isAligned ? "rgba(20, 83, 45, 0.9)" : "rgba(69, 10, 10, 0.9)",
                border: `1px solid ${isAligned ? "#22c55e" : "#ef4444"}`,
                color: isAligned ? "#4ade80" : "#fca5a5",
                borderRadius: 99,
                padding: "4px 14px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.03em",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                transition: "all 0.25s ease"
              }}>
                {alignmentMsg}
              </div>
            </div>
          </div>
        )}

        {/* Capturing / Success Stage Animation Viewport */}
        {stage !== "aligning" && (
          <div style={{
            position: "relative",
            height: 250,
            background: "radial-gradient(circle, #1e293b 0%, #0f172a 80%)",
            borderRadius: 16,
            border: `2px solid ${stage === "success" ? "#22c55e" : stage === "error" ? "#ef4444" : "#0284c7"}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            padding: 20,
            textAlign: "center"
          }}>
            {stage === "capturing" && (
              <>
                {/* Live Camera Stream directly from Python Agent (port 8001) */}
                <img
                  src="http://localhost:8001/video_feed"
                  alt="Live Biometric Capture Feed"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  onLoad={(e) => { e.currentTarget.style.display = 'block'; }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 14,
                    zIndex: 0
                  }}
                />

                <div style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(15, 23, 42, 0.45)",
                  backdropFilter: "blur(2px)",
                  padding: "16px 24px",
                  borderRadius: 16,
                  border: "1px solid rgba(56, 189, 248, 0.3)"
                }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  border: "3px solid #38bdf8",
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite",
                  marginBottom: 10
                }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f8fafc", marginBottom: 4, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                  Capturing Biometric Frames
                </div>
                
                {/* Real-time Frame Counter & Progress Bar */}
                <div style={{ width: "100%", maxWidth: 360, marginTop: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14, fontWeight: 800, color: "#38bdf8", marginBottom: 6 }}>
                    <span>Frame Progress</span>
                    <span style={{ background: "#1e293b", padding: "2px 8px", borderRadius: 6, border: "1px solid #334155" }}>
                      {frameProgress} / 5 Frames
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 12, background: "#0f172a", borderRadius: 99, overflow: "hidden", border: "1px solid #334155" }}>
                    <div style={{
                      width: `${(frameProgress / 5) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #38bdf8, #22c55e)",
                      borderRadius: 99,
                      transition: "width 0.25s ease-out"
                    }} />
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 360 }}>
                  Class AI Agent is reading 5 high-precision facial biometric angles. Hold still!
                </div>
              </>
            )}

            {stage === "success" && (
              <>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 0 25px rgba(34, 197, 94, 0.6)" }}>
                  <Check size={40} color="#fff" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80", marginBottom: 6 }}>
                  Face Enrolled Successfully!
                </div>
                <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 6 }}>
                  {statusMsg}
                </div>
                {/* Real frames captured from AI Agent */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, background: "#052e16", border: "1px solid #16a34a", borderRadius: 10, padding: "8px 16px" }}>
                  <span style={{ fontSize: 22 }}>📸</span>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{realFramesCaptured || 20}</div>
                    <div style={{ fontSize: 11, color: "#86efac" }}>biometric frames captured & encoded</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                    <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>✓ Verified</span>
                    <span style={{ fontSize: 11, color: "#86efac" }}>by AI Agent</span>
                  </div>
                </div>
              </>
            )}

            </div>
              </>
            )}

            {stage === "error" && (
              <>
                <div style={{ width: 68, height: 68, borderRadius: "50%", background: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: "0 0 25px rgba(239, 68, 68, 0.6)" }}>
                  <XCircle size={38} color="#fff" />
                </div>

                {((statusMsg && statusMsg.includes("UNCERTAIN")) || (statusMsg && statusMsg.includes("insufficient"))) ? (
                  <div style={{ background: "#451a03", border: "1.5px solid #f59e0b", borderRadius: 14, padding: "14px 16px", textAlign: "left", width: "100%", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fef3c7", fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                      <AlertTriangle size={18} color="#f59e0b" />
                      UNCERTAIN MATCH — ACTION REQUIRED
                    </div>
                    <div style={{ fontSize: 12, color: "#fde68a", lineHeight: 1.6, marginBottom: 10 }}>
                      The AI system could not verify the face with sufficient certainty. To ensure facial biometric integrity:
                      <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                        <li>Improve lighting on your face (avoid strong backlighting).</li>
                        <li>Face the camera directly without tilting.</li>
                        <li>Ensure the lens is clean and hold steady.</li>
                      </ul>
                    </div>
                    <div style={{ background: "#1c1917", padding: "8px 12px", borderRadius: 8, border: "1px solid #78350f", fontSize: 11, color: "#fcd34d" }}>
                      💡 <strong>Guidance:</strong> Please click <strong>Capture Again</strong> to realign and capture fresh biometric frames.
                    </div>
                  </div>
                ) : (statusMsg.includes("DUPLICATE FACE") || statusMsg.includes("already registered to") || existingStudent) ? (
                  <div style={{ background: "#450a0a", border: "1.5px solid #ef4444", borderRadius: 14, padding: "14px 16px", textAlign: "left", width: "100%", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fca5a5", fontWeight: 800, fontSize: 14, marginBottom: 10 }}>
                      <AlertTriangle size={18} color="#ef4444" />
                      FACE ALREADY REGISTERED
                    </div>

                    {/* Existing student details card */}
                    {existingStudent && (
                      <div style={{ background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, textTransform: "uppercase", color: "#f87171", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>
                          Existing Registered Student
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                          <div>
                            <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Student Name</div>
                            <div style={{ fontSize: 13, color: "#fca5a5", fontWeight: 700 }}>{existingStudent.name || "—"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Roll Number</div>
                            <div style={{ fontSize: 13, color: "#f87171", fontWeight: 800, fontFamily: "monospace" }}>{existingStudent.rollNumber || "—"}</div>
                          </div>
                          {existingStudent.department && (
                            <div>
                              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Department</div>
                              <div style={{ fontSize: 12, color: "#fca5a5" }}>{existingStudent.department}</div>
                            </div>
                          )}
                          {existingStudent.status && (
                            <div>
                              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Face Status</div>
                              <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>{existingStudent.status}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ background: "#1c1917", padding: "8px 12px", borderRadius: 8, border: "1px solid #78350f", fontSize: 11, color: "#fde68a", lineHeight: 1.6 }}>
                      <strong>🔒 Registration Blocked:</strong> Please select the correct student. This face cannot be registered again.
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#f87171", marginBottom: 6 }}>
                      Capture Failed
                    </div>
                    <div style={{ fontSize: 13, color: "#fca5a5", marginBottom: 14 }}>
                      {statusMsg}
                    </div>
                  </>
                )}

                <button
                  onClick={() => { setStage("aligning"); setExistingStudent(null); }}
                  style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        )}

        {/* Student Target Card */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: "10px 16px", marginBottom: 14, border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>Student</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{student.firstName} {student.lastName}</div>
          </div>
          <code style={{ background: "#0f172a", color: "#38bdf8", padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
            {student.rollNumber}
          </code>
        </div>

        {/* Dynamic Action Button in Aligning Stage */}
        {stage === "aligning" && (
          <button
            onClick={startBiometricCapture}
            disabled={!isAligned}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: "none",
              background: isAligned
                ? "linear-gradient(135deg, #16a34a, #22c55e)"
                : "#334155",
              color: isAligned ? "#fff" : "#94a3b8",
              fontWeight: 800,
              fontSize: 14,
              cursor: isAligned ? "pointer" : "not-allowed",
              boxShadow: isAligned ? "0 4px 16px rgba(34, 197, 94, 0.4)" : "none",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            <Camera size={18} />
            {isAligned ? "📸 CAPTURE BIOMETRIC DATA NOW" : "Align face in green to enable capture"}
          </button>
        )}

        {/* Footer info & Dismiss */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#64748b" }}>
          <span>
            {stage === "aligning"
              ? (isAligned ? "🟢 Ready to capture" : "🔴 Align inside oval guide")
              : "Agent: laptop-agent-01 (Active)"}
          </span>
          <button
            onClick={onClose}
            disabled={stage === "capturing"}
            style={{
              background: "transparent",
              border: "1px solid #475569",
              color: "#94a3b8",
              borderRadius: 8,
              padding: "5px 12px",
              cursor: stage === "capturing" ? "not-allowed" : "pointer",
              fontSize: 11,
              opacity: stage === "capturing" ? 0.5 : 1
            }}
          >
            Cancel / Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Class AI Agent Status Banner ──────────────────────────────────────────────
function AgentStatusBanner() {
  const [open, setOpen]           = useState(false);
  const [agentInfo, setAgentInfo] = useState(null);
  const [checking, setChecking]   = useState(false);

  useEffect(() => { checkAgent(); }, []);

  const checkAgent = async () => {
    setChecking(true);
    try {
      const { data } = await axiosClient.get("/faces/agent-status");
      setAgentInfo(data);
    } catch {
      setAgentInfo({ connected: false, agentId: null, lastHeartbeat: null });
    } finally {
      setChecking(false);
    }
  };

  const connected = agentInfo?.connected === true;
  const borderColor = checking        ? "#6366f1"
                    : connected       ? "#16a34a"
                    : agentInfo       ? "#dc2626"
                    : "#6366f1";
  const bgColor     = checking        ? "#1e1b4b"
                    : connected       ? "#052e16"
                    : agentInfo       ? "#450a0a"
                    : "#1e1b4b";

  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>
              Class AI Agent
              {checking && <span style={{ marginLeft: 8, color: "#a5b4fc", fontSize: 12 }}>● Checking…</span>}
              {!checking && connected  && <span style={{ marginLeft: 8, color: "#4ade80", fontSize: 12 }}>● Connected</span>}
              {!checking && agentInfo && !connected && <span style={{ marginLeft: 8, color: "#f87171", fontSize: 12 }}>● Offline</span>}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {connected
                ? <>Classroom laptop agent is online{agentInfo?.agentId ? ` (${agentInfo.agentId})` : ""}. Ready to capture.</>
                : agentInfo
                  ? <>Classroom laptop is offline. Start the <strong style={{ color: "#e2e8f0" }}>Class AI service</strong> on the laptop.</>
                  : <>Click <strong style={{ color: "#e2e8f0" }}>Check Status</strong> to verify agent connection.</>
              }
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={checkAgent}
            disabled={checking}
            style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", color: "#94a3b8", cursor: checking ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            {checking ? <><RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> Checking…</> : "Check Status"}
          </button>
          <button onClick={() => setOpen(o => !o)} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {open ? "Hide Info" : "▶ How to Start"}
          </button>
        </div>
      </div>

      {!connected && agentInfo && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#450a0a", borderRadius: 8, border: "1px solid #7f1d1d", fontSize: 12, color: "#fca5a5" }}>
          ⚠️ The classroom laptop agent is not connected. Face capture will fail until the agent is running and connected.
        </div>
      )}

      {open && (
        <div style={{ marginTop: 16, borderTop: "1px solid #334155", paddingTop: 16 }}>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
            Open <strong style={{ color: "#e2e8f0" }}>PowerShell</strong> on the <strong style={{ color: "#e2e8f0" }}>classroom laptop</strong> and run:
          </p>
          {[
            { step: "1", title: "Navigate to the AI service folder",    cmd: "cd C:\\Users\\SUDHEER\\OneDrive\\Documents\\python-face-service" },
            { step: "2", title: "Activate virtual environment",         cmd: ".venv311\\Scripts\\activate" },
            { step: "3", title: "🚀 Start the Class AI service",        cmd: "python run_classai.py" },
          ].map(({ step, title, cmd }) => (
            <div key={step} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                <span style={{ background: "#6366f1", color: "#fff", borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 700, marginRight: 8 }}>{step}</span>
                {title}
              </div>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 13, color: "#a5b4fc", border: "1px solid #334155", wordBreak: "break-all" }}>
                {cmd}
              </div>
            </div>
          ))}
          <div style={{ background: "#172554", borderRadius: 8, padding: "12px 14px", marginTop: 12, fontSize: 12, color: "#93c5fd", lineHeight: 1.7 }}>
            <strong>✅ Success:</strong> The service starts, connects to the server, and shows <code>✅ Authenticated</code> in the logs.<br />
            After that, click <strong>Check Status</strong> above — it should show <span style={{ color: "#4ade80" }}>● Connected</span>.<br />
            <strong>⚠️ Keep this PowerShell window open</strong> while using Face Registration.
          </div>
        </div>
      )}
    </div>
  );
}
