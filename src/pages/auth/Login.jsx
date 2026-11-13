import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GraduationCap, Eye, EyeOff, Loader2, CheckCircle2, CloudOff } from "lucide-react";
import { loginUser, selectAuth } from "../../store/slices/authSlice";

const API_ROOT = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "https://smart-ai-classroom-server.onrender.com";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, user } = useSelector(selectAuth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);

  // ── Server warm-up state ──────────────────────────────────────────────
  // "checking" → "waking" → "ready" | "offline"
  const [serverStatus, setServerStatus] = useState("checking");
  const pingStarted = useRef(false);

  useEffect(() => {
    if (pingStarted.current) return;
    pingStarted.current = true;

    const controller = new AbortController();
    const start = Date.now();

    fetch(`${API_ROOT}/`, { signal: controller.signal, cache: "no-store" })
      .then((res) => {
        if (res.ok) {
          const elapsed = ((Date.now() - start) / 1000).toFixed(1);
          console.log(`[warm-up] Server ready in ${elapsed}s`);
          setServerStatus("ready");
        } else {
          setServerStatus("offline");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") setServerStatus("offline");
      });

    // After 3 seconds of waiting, switch label to "waking"
    const timer = setTimeout(() => {
      setServerStatus((prev) => (prev === "checking" ? "waking" : prev));
    }, 3000);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(form)).then((result) => {
      if (loginUser.fulfilled.match(result)) {
        navigate("/dashboard", { replace: true });
      }
    });
  };

  // ── Status badge ──────────────────────────────────────────────────────
  const statusBadge = {
    checking: {
      icon: <Loader2 size={14} className="animate-spin text-blue-500" />,
      text: "Connecting to server...",
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    waking: {
      icon: <Loader2 size={14} className="animate-spin text-amber-500" />,
      text: "Waking up cloud server (~30s on free tier)...",
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    ready: {
      icon: <CheckCircle2 size={14} className="text-emerald-500" />,
      text: "Server online — ready to sign in!",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    offline: {
      icon: <CloudOff size={14} className="text-red-500" />,
      text: "Server may be starting up. Login will retry automatically.",
      color: "text-red-700 bg-red-50 border-red-200",
    },
  }[serverStatus];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <GraduationCap size={24} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-xl leading-tight">Smart</div>
            <div className="font-bold text-gray-900 text-xl leading-tight">Classroom Hub</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">Welcome back</h1>
        <p className="text-gray-500 text-sm text-center mb-4">Sign in to your account to continue</p>

        {/* Server status badge */}
        <div className={`flex items-center gap-2 px-3 py-2 mb-4 rounded-lg border text-xs font-medium ${statusBadge.color}`}>
          {statusBadge.icon}
          <span>{statusBadge.text}</span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@classroom.edu"
              required
              autoComplete="email"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline font-medium">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition text-sm"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {loading && (
            <p className="text-xs text-amber-600 text-center animate-pulse mt-1">
              Connecting to cloud server... (takes ~20-30s if waking up)
            </p>
          )}
        </form>

        {/* No demo credentials shown — contact your administrator for access */}

        <p className="text-center text-sm text-gray-500 mt-5">
          Are you a student?{" "}
          <Link to="/student-register" className="text-blue-600 font-medium hover:underline">
            Register with Roll Number
          </Link>
        </p>
      </div>
    </div>
  );
}
