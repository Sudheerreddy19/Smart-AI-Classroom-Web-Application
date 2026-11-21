import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  Camera, Users, CheckCircle2, XCircle, RefreshCw,
  Building2, BookOpen, User, AlertTriangle,
  Play, Clock, Award, ChevronRight, Scan, Eye, ShieldCheck
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
  const [capturing, setCapturing]             = useState(false);
  const [captureId, setCaptureId]             = useState(null);
  const [capturingStudent, setCapturingStudent] = useState(null);
  const [captureElapsed, setCaptureElapsed]   = useState(0);
  const [captureResult, setCaptureResult]     = useState(null);

  // Timer while capturing
  useEffect(() => {
    let interval = null;
    if (capturing) {
      setCaptureElapsed(0);
      interval = setInterval(() => {
        setCaptureElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [capturing]);

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

  // ── Trigger face capture ───────────────────────────────────────────────
  const handleCaptureFace = async (student) => {
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

    setCaptureId(student.id);
    setCapturingStudent(student);
    setCapturing(true);
    setCaptureResult(null);

    try {
      const { data } = await axiosClient.post(`/faces/register/${student.id}`);
      setCaptureResult({ ...data, studentName: `${student.firstName} ${student.lastName}` });

      if (data.success) {
        toast.success(`Face registered for ${student.firstName}!`);
        // Update student in list
        setStudents(prev => prev.map(s =>
          s.id === student.id
            ? { ...s, registrationStatus: "FACE_REGISTERED" }
            : s
        ));
      } else {
        toast.error(data.message || "Face capture failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Face capture failed. Ensure Class AI service is running on laptop.";
      toast.error(msg);
      setCaptureResult({ success: false, message: msg });
    } finally {
      setCapturing(false);
      setCaptureId(null);
    }
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
      {/* Active Capture & Alignment Screen Modal */}
      {capturing && capturingStudent && (
        <CaptureScreenModal
          student={capturingStudent}
          elapsed={captureElapsed}
          onClose={() => { setCapturing(false); setCapturingStudent(null); }}
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
          ["4", "Webcam opens with oval alignment guide", Play],
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
                const isCapturing = capturing && captureId === s.id;
                const canCapture  = s.registrationStatus !== "NOT_REGISTERED";

                return (
                  <tr key={s.id} className={isCapturing ? "fr-row--capturing" : ""}>
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
                          onClick={() => handleCaptureFace(s)}
                          disabled={capturing}
                        >
                          {isCapturing
                            ? <><RefreshCw size={14} className="fr-spin" /> Capturing…</>
                            : <><Camera size={14} /> {s.registrationStatus === "FACE_REGISTERED" ? "Re-Capture" : "Capture Face"}</>}
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
        .fr-row--capturing { background: #eff6ff !important; }
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

// ── Active Biometric Capture & Face Alignment Modal ────────────────────────────
function CaptureScreenModal({ student, elapsed, onClose }) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: 20
    }}>
      <div style={{
        background: "#0f172a",
        border: "1.5px solid #38bdf8",
        borderRadius: 20,
        maxWidth: 520,
        width: "100%",
        padding: "24px 28px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)",
        color: "#f8fafc",
        fontFamily: "'Inter', sans-serif"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 12px #ef4444"
            }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#f8fafc", letterSpacing: "0.02em" }}>
                Biometric Face Capture Active
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Laptop camera is verifying face alignment
              </div>
            </div>
          </div>
          <div style={{ background: "#1e293b", padding: "4px 12px", borderRadius: 99, fontSize: 13, fontWeight: 700, color: "#38bdf8", border: "1px solid #334155" }}>
            ⏱ {elapsed}s
          </div>
        </div>

        {/* Biometric Scanning Radar Graphic */}
        <div style={{
          position: "relative",
          height: 180,
          background: "radial-gradient(circle, #1e293b 0%, #0f172a 75%)",
          borderRadius: 16,
          border: "1px solid #334155",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
          overflow: "hidden"
        }}>
          {/* Alignment Oval Reticle Graphic */}
          <div style={{
            width: 100,
            height: 130,
            borderRadius: "50%",
            border: "2px dashed #22c55e",
            boxShadow: "0 0 20px rgba(34, 197, 94, 0.3), inset 0 0 15px rgba(34, 197, 94, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}>
            <Scan size={38} color="#4ade80" />
            {/* Corner ticks */}
            <div style={{ position: "absolute", top: -4, left: 45, width: 10, height: 2, background: "#fff" }} />
            <div style={{ position: "absolute", bottom: -4, left: 45, width: 10, height: 2, background: "#fff" }} />
            <div style={{ position: "absolute", left: -4, top: 60, width: 2, height: 10, background: "#fff" }} />
            <div style={{ position: "absolute", right: -4, top: 60, width: 2, height: 10, background: "#fff" }} />
          </div>
          <div style={{ position: "absolute", bottom: 10, fontSize: 12, fontWeight: 600, color: "#4ade80", letterSpacing: "0.03em" }}>
            ● LOOK AT LAPTOP WEBCAM
          </div>
        </div>

        {/* Student Target Card */}
        <div style={{ background: "#1e293b", borderRadius: 12, padding: "12px 16px", marginBottom: 18, border: "1px solid #334155" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>
            Registering Student
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>
              {student.firstName} {student.lastName}
            </span>
            <code style={{ background: "#0f172a", color: "#38bdf8", padding: "3px 8px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
              {student.rollNumber}
            </code>
          </div>
        </div>

        {/* Alignment Instructions */}
        <div style={{ background: "#0c4a6e", border: "1px solid #0284c7", borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "#e0f2fe", lineHeight: 1.6, marginBottom: 18 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={16} color="#38bdf8" />
            Face Alignment Verification Instructions:
          </div>
          <div>1. The <strong>"Class AI Biometrics"</strong> window has opened on your laptop.</div>
          <div>2. Position your face inside the <strong>oval guide</strong>.</div>
          <div>3. When your face is aligned and sharp, the oval turns <strong style={{ color: "#4ade80" }}>GREEN</strong>.</div>
          <div>4. <strong>Hold still for 3 seconds</strong> while 20 biometric angles are captured.</div>
        </div>

        {/* Footer info & Dismiss */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#64748b" }}>
          <span>Agent: laptop-agent-01 (Active)</span>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #475569",
              color: "#94a3b8",
              borderRadius: 8,
              padding: "5px 12px",
              cursor: "pointer",
              fontSize: 11
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
