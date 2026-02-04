import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * BACKEND_URL:
 * - En Vercel: define variable env VITE_BACKEND_URL = https://tu-backend.onrender.com
 * - Local: VITE_BACKEND_URL=http://localhost:3001
 */
const BACKEND_URL =
  (import.meta?.env?.VITE_BACKEND_URL && String(import.meta.env.VITE_BACKEND_URL).trim()) ||
  "https://docuexpress.onrender.com";

// =============== UI: helpers ===============
const styles = {
  font: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
  bg: "#f6f7fb",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  primary: "#4f46e5",
  primaryDark: "#4338ca",
  success: "#16a34a",
  error: "#dc2626",
  warn: "#b45309",
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ color = "indigo", children }) {
  const map = {
    indigo: { bg: "#eef2ff", text: "#3730a3", border: "#e0e7ff" },
    cyan: { bg: "#ecfeff", text: "#155e75", border: "#cffafe" },
    green: { bg: "#f0fdf4", text: "#166534", border: "#dcfce7" },
    red: { bg: "#fef2f2", text: "#7f1d1d", border: "#fee2e2" },
    gray: { bg: "#f8fafc", text: "#111827", border: "#e5e7eb" },
    amber: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  };
  const s = map[color] || map.gray;
  return (
    <span
      style={{
        fontSize: 12,
        padding: "5px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        border: `1px solid ${styles.border}`,
        boxShadow: "0 22px 50px rgba(0,0,0,.08)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, right }) {
  return (
    <div
      style={{
        padding: 18,
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontWeight: 900, letterSpacing: -0.3, fontSize: 18 }}>{title}</div>
        {subtitle && <div style={{ color: styles.muted, fontSize: 13, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function Button({ children, variant = "primary", disabled, onClick, style, title, type = "button" }) {
  const map = {
    primary: { bg: styles.primary, color: "#fff", border: "none" },
    outline: { bg: "#fff", color: styles.text, border: `1px solid ${styles.border}` },
    ghost: { bg: "transparent", color: styles.text, border: "none" },
    danger: { bg: "#ef4444", color: "#fff", border: "none" },
  };
  const s = map[variant] || map.primary;

  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "11px 14px",
        borderRadius: 14,
        border: s.border,
        background: s.bg,
        color: s.color,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "transform .06s ease, background .12s ease",
        ...style,
      }}
      onMouseDown={(e) => {
        // pequeño "click feel"
        if (!disabled) e.currentTarget.style.transform = "scale(0.99)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = "text", style, disabled }) {
  return (
    <input
      disabled={disabled}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 14,
        border: `1px solid ${styles.border}`,
        outline: "none",
        background: disabled ? "#f8fafc" : "#fff",
        ...style,
      }}
    />
  );
}

function Select({ value, onChange, children, style }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 14,
        border: `1px solid ${styles.border}`,
        outline: "none",
        background: "#fff",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#eef2f7" }} />;
}

// =============== Toast ===============
function Toast({ toast, onClose }) {
  if (!toast) return null;

  const map = {
    success: { border: styles.success, bg: "#f0fdf4", title: "#166534" },
    error: { border: styles.error, bg: "#fef2f2", title: "#7f1d1d" },
    info: { border: styles.primary, bg: "#eef2ff", title: "#312e81" },
    warn: { border: styles.warn, bg: "#fffbeb", title: "#92400e" },
  };

  const s = map[toast.type || "info"];

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, width: 380, zIndex: 9999 }}>
      <div
        style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 16,
          padding: 14,
          boxShadow: "0 18px 40px rgba(0,0,0,.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, color: s.title, marginBottom: 4, letterSpacing: -0.2 }}>
              {toast.title}
            </div>
            <div style={{ fontSize: 13, color: styles.text, opacity: 0.92, lineHeight: 1.4 }}>
              {toast.message}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: 6,
              borderRadius: 10,
            }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// =============== Modal ===============
function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(17,24,39,.45)",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 96vw)",
          background: "#fff",
          borderRadius: 18,
          border: `1px solid ${styles.border}`,
          boxShadow: "0 28px 80px rgba(0,0,0,.25)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #eef2f7", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900 }}>{title}</div>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
        {footer && (
          <div style={{ padding: 16, borderTop: "1px solid #eef2f7", display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// =============== Network helpers ===============
async function safeJson(res) {
  const txt = await res.text().catch(() => "");
  try {
    return txt ? JSON.parse(txt) : {};
  } catch {
    return { message: txt || "Respuesta inválida del servidor" };
  }
}

async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildQuery(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

// =============== Main App ===============
export default function App() {
  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (t) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // Auth
  const [me, setMe] = useState(null);
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const isLogged = !!me;
  const isStaff = me?.role === "admin" || me?.role === "superadmin";
  const isSuper = me?.role === "superadmin";

  // Navigation
  const [view, setView] = useState("consultar"); // consultar | dashboard | users | logs | creditlogs | mylogs | mycredits

  // Consult (cards -> form)
  const [step, setStep] = useState("cards"); // cards | form
  const [type, setType] = useState("semanas"); // semanas | asignacion/nss | vigencia | noderecho
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");

  const [generating, setGenerating] = useState(false);
  const [files, setFiles] = useState([]); // files returned by /api/imss
  const [downloadingIds, setDownloadingIds] = useState({}); // {fileId:true}

  // Admin data
  const [metrics, setMetrics] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [creditLogs, setCreditLogs] = useState([]);
  const [creditLogsLoading, setCreditLogsLoading] = useState(false);

  // Create user modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("user"); // superadmin only
  const [newOwnerAdminId, setNewOwnerAdminId] = useState(""); // superadmin only when creating user
  const [adminsForOwner, setAdminsForOwner] = useState([]);

  // Credits modal
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsTarget, setCreditsTarget] = useState(null);
  const [creditsAmount, setCreditsAmount] = useState("0");
  const [creditsNote, setCreditsNote] = useState("");

  // Reset password modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetInfo, setResetInfo] = useState({ email: "", newPassword: "" });

  // Logs filters
  const [logType, setLogType] = useState("");
  const [logEmail, setLogEmail] = useState("");
  const [logRange, setLogRange] = useState("7"); // 1,7,30,all
  const [logFrom, setLogFrom] = useState("");
  const [logTo, setLogTo] = useState("");

  // Credits logs filters (simple)
  const [creditEmail, setCreditEmail] = useState("");

  // Credits for user
  const [myCredits, setMyCredits] = useState(0);

  // Load session on mount (if token exists, try credits/me & maybe logs/me)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        const r = await authFetch("/api/credits/me");
        if (r.status === 401) {
          localStorage.removeItem("token");
          return;
        }
        const d = await safeJson(r);
        setMyCredits(d.credits ?? 0);

        // We don't have /api/auth/me; keep minimal until next login
        setMe((prev) => prev || { email: "Sesión activa", role: "user", credits: d.credits ?? 0 });
      } catch {
        // ignore
      }
    })();
  }, []);

  // Login
  const onLogin = async () => {
    if (!email || !password) {
      showToast({ type: "warn", title: "Faltan datos", message: "Escribe email y contraseña." });
      return;
    }
    setLoggingIn(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(email).trim(), password: String(password) }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Login fallido",
          message: data?.message || `HTTP ${res.status}`,
        });
        return;
      }

      localStorage.setItem("token", data.token);
      setMe(data.user);
      setView("consultar");
      setStep("cards");
      setFiles([]);
      setCurp("");
      setNss("");

      // refresh credits
      try {
        const r2 = await authFetch("/api/credits/me");
        const d2 = await safeJson(r2);
        setMyCredits(d2.credits ?? 0);
        setMe((m) => (m ? { ...m, credits: d2.credits ?? m.credits } : m));
      } catch {}

      showToast({ type: "success", title: "Sesión iniciada", message: "Bienvenido 👋" });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    } finally {
      setLoggingIn(false);
    }
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    setMe(null);
    setView("consultar");
    setStep("cards");
    setFiles([]);
    setCurp("");
    setNss("");
    setMetrics(null);
    setUsers([]);
    setLogs([]);
    setCreditLogs([]);
    setMyCredits(0);
    showToast({ type: "info", title: "Sesión cerrada", message: "Hasta luego." });
  };

  // =============== Clipboard paste helper ===============
  const pasteCurpNss = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim().toUpperCase();
      const foundCurp = text.match(/[A-Z0-9]{18}/)?.[0] || "";
      const foundNss = text.match(/\b\d{11}\b/)?.[0] || "";
      if (foundCurp) setCurp(foundCurp);
      if (foundNss) setNss(foundNss);

      if (!foundCurp && !foundNss) {
        showToast({
          type: "info",
          title: "Nada que pegar",
          message: "Copia una CURP (18) o NSS (11) y vuelve a intentar.",
        });
        return;
      }

      showToast({
        type: "success",
        title: "Pegado listo",
        message: `Pegado: ${foundCurp ? "CURP" : ""}${foundCurp && foundNss ? " + " : ""}${foundNss ? "NSS" : ""}`,
      });
    } catch {
      showToast({
        type: "error",
        title: "Portapapeles bloqueado",
        message: "Tu navegador bloqueó el portapapeles. Usa Ctrl+V manualmente.",
      });
    }
  };

  // =============== Validation ===============
  const validateConsult = () => {
    const c = curp.trim().toUpperCase();
    const n = nss.trim();

    if (!/^[A-Z0-9]{18}$/.test(c)) {
      showToast({ type: "error", title: "CURP inválida", message: "Debe tener 18 caracteres (letras/números)." });
      return false;
    }

    if (type === "semanas" || type === "vigencia") {
      if (!/^\d{11}$/.test(n)) {
        showToast({ type: "error", title: "NSS requerido", message: "Debe ser de 11 dígitos." });
        return false;
      }
    }
    return true;
  };

  // =============== Generate IMSS ===============
  const onGenerate = async () => {
    if (!isLogged) {
      showToast({ type: "warn", title: "Inicia sesión", message: "Debes iniciar sesión para generar documentos." });
      return;
    }
    if (!validateConsult()) return;

    setGenerating(true);
    setFiles([]);

    try {
      const payload = {
        type: type === "nss" ? "asignacion" : type,
        curp: curp.trim().toUpperCase(),
        nss: nss.trim(),
      };

      const res = await authFetch("/api/imss", { method: "POST", body: JSON.stringify(payload) });
      const data = await safeJson(res);

      if (res.status === 401) {
        localStorage.removeItem("token");
        setMe(null);
        showToast({ type: "info", title: "Sesión expirada", message: "Vuelve a iniciar sesión." });
        return;
      }

      if (!res.ok) {
        // tu backend manda "Inconsistencia" cuando no hay PDF
        showToast({
          type: "error",
          title: "Inconsistencia",
          message: data?.message || "IMSS no devolvió PDF. Intenta de nuevo.",
        });
        return;
      }

      const got = data?.files || [];
      setFiles(got);

      showToast({
        type: "success",
        title: "Documento(s) listo(s)",
        message: got.length ? `Se generaron ${got.length} PDF(s).` : "Listo.",
      });

      // refresh credits
      try {
        const r2 = await authFetch("/api/credits/me");
        const d2 = await safeJson(r2);
        setMyCredits(d2.credits ?? 0);
        setMe((m) => (m ? { ...m, credits: d2.credits ?? m.credits } : m));
      } catch {}
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend (Render)." });
    } finally {
      setGenerating(false);
    }
  };

  // =============== Download PDF (with state) ===============
  const downloadFile = async (fileId, filename) => {
    try {
      setDownloadingIds((m) => ({ ...m, [fileId]: true }));

      const res = await fetch(`${BACKEND_URL}/api/download/${fileId}`, {
        headers: {
          ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        setMe(null);
        showToast({ type: "info", title: "Sesión expirada", message: "Vuelve a iniciar sesión." });
        return;
      }

      if (!res.ok) {
        const data = await safeJson(res);
        showToast({
          type: "error",
          title: "No se pudo descargar",
          message: data?.message || `HTTP ${res.status}`,
        });
        return;
      }

      const blob = await res.blob();
      downloadBlob(blob, filename || "documento.pdf");
      showToast({ type: "success", title: "Descarga iniciada", message: filename || "documento.pdf" });
    } catch {
      showToast({ type: "error", title: "Error", message: "Falló la descarga." });
    } finally {
      setDownloadingIds((m) => {
        const copy = { ...m };
        delete copy[fileId];
        return copy;
      });
    }
  };

  // =============== Tabs labels ===============
  const consultLabel = useMemo(() => {
    const t = type === "nss" ? "asignacion" : type;
    if (t === "semanas") return "Semanas cotizadas";
    if (t === "asignacion") return "Asignación / Localización NSS";
    if (t === "vigencia") return "Vigencia de derechos";
    if (t === "noderecho") return "No derechohabiencia";
    return "Consulta";
  }, [type]);

  // =============== Staff data loaders ===============
  const loadMetrics = async () => {
    try {
      const r = await authFetch("/api/admin/metrics");
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "No se pudo cargar métricas");
      setMetrics(d);
    } catch {
      // ignore
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const r = await authFetch("/api/users");
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "No se pudo cargar usuarios");
      setUsers(d.users || []);
    } catch (e) {
      showToast({ type: "error", title: "Usuarios", message: "No se pudo cargar la lista." });
    } finally {
      setUsersLoading(false);
    }
  };

  const loadLogs = async (params = {}) => {
    setLogsLoading(true);
    try {
      const q = buildQuery(params);
      const r = await authFetch(`/api/logs${q}`);
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "No se pudo cargar logs");
      setLogs(d.logs || []);
    } catch {
      showToast({ type: "error", title: "Logs", message: "No se pudieron cargar los logs." });
    } finally {
      setLogsLoading(false);
    }
  };

  const loadMyLogs = async () => {
    setLogsLoading(true);
    try {
      const r = await authFetch(`/api/logs/me`);
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "No se pudo cargar logs");
      setLogs(d.logs || []);
    } catch {
      showToast({ type: "error", title: "Mis consultas", message: "No se pudieron cargar tus consultas." });
    } finally {
      setLogsLoading(false);
    }
  };

  const loadCreditLogs = async () => {
    setCreditLogsLoading(true);
    try {
      const r = await authFetch(`/api/credit-logs`);
      const d = await safeJson(r);
      if (!r.ok) throw new Error(d?.message || "No se pudo cargar logs de créditos");
      setCreditLogs(d.logs || []);
    } catch {
      showToast({ type: "error", title: "Créditos", message: "No se pudieron cargar los logs de créditos." });
    } finally {
      setCreditLogsLoading(false);
    }
  };

  const refreshMeCredits = async () => {
    try {
      const r = await authFetch("/api/credits/me");
      const d = await safeJson(r);
      if (r.ok) {
        setMyCredits(d.credits ?? 0);
        setMe((m) => (m ? { ...m, credits: d.credits ?? m.credits } : m));
      }
    } catch {}
  };

  // When staff logs/users view changes, load data
  useEffect(() => {
    if (!isLogged) return;

    // always refresh my credits on login
    refreshMeCredits();

    if (isStaff) {
      if (view === "dashboard") loadMetrics();
      if (view === "users") loadUsers();
      if (view === "logs") applyLogFilters();
      if (view === "creditlogs") loadCreditLogs();
    } else {
      if (view === "mylogs") loadMyLogs();
      if (view === "mycredits") refreshMeCredits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogged, view]);

  // =============== Staff: create user ===============
  const loadAdminsForOwner = async () => {
    // Only for superadmin: needs list of admins to choose ownerAdminId
    try {
      const r = await authFetch("/api/users");
      const d = await safeJson(r);
      if (!r.ok) return;
      // From superadmin scope, /api/users returns all users; pick admins
      const admins = (d.users || []).filter((u) => u.role === "admin");
      setAdminsForOwner(admins);
      if (!newOwnerAdminId && admins[0]?.id) setNewOwnerAdminId(admins[0].id);
    } catch {}
  };

  const openCreateUser = async () => {
    setNewEmail("");
    setNewPass("");
    setNewRole("user");
    setNewOwnerAdminId("");
    if (isSuper) await loadAdminsForOwner();
    setCreateOpen(true);
  };

  const createUser = async () => {
    if (!newEmail || newEmail.trim().length < 5) {
      showToast({ type: "warn", title: "Email inválido", message: "Escribe un email válido." });
      return;
    }
    if (!newPass || newPass.trim().length < 6) {
      showToast({ type: "warn", title: "Password inválido", message: "Mínimo 6 caracteres." });
      return;
    }

    const payload = {
      email: newEmail.trim(),
      password: newPass.trim(),
    };

    if (isSuper) {
      payload.role = newRole; // admin | user
      if (newRole === "user") payload.ownerAdminId = newOwnerAdminId;
    }

    try {
      const r = await authFetch("/api/users", { method: "POST", body: JSON.stringify(payload) });
      const d = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Crear usuario", message: d?.message || "No se pudo crear." });
        return;
      }
      showToast({ type: "success", title: "Usuario creado", message: d.user?.email || "Listo." });
      setCreateOpen(false);
      await loadUsers();
      await loadMetrics();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo crear usuario." });
    }
  };

  // =============== Staff: disable user ===============
  const toggleDisabled = async (u) => {
    try {
      const r = await authFetch(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: !u.disabled }),
      });
      const d = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Actualizar", message: d?.message || "Error" });
        return;
      }
      showToast({
        type: "success",
        title: "Actualizado",
        message: `${d.user?.email} ${d.user?.disabled ? "deshabilitado" : "habilitado"}`,
      });
      await loadUsers();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo actualizar." });
    }
  };

  // =============== Staff: reset password ===============
  const resetPassword = async (u) => {
    try {
      const r = await authFetch(`/api/users/${u.id}/reset-password`, { method: "POST" });
      const d = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Reset password", message: d?.message || "Error" });
        return;
      }
      setResetInfo({ email: u.email, newPassword: d.newPassword });
      setResetOpen(true);
      showToast({ type: "success", title: "Password reseteada", message: "Se generó una nueva contraseña." });
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo resetear password." });
    }
  };

  // =============== Staff: grant credits ===============
  const openCredits = (u) => {
    setCreditsTarget(u);
    setCreditsAmount("0");
    setCreditsNote("");
    setCreditsOpen(true);
  };

  const grantCredits = async () => {
    if (!creditsTarget) return;
    const n = Number(creditsAmount);
    if (!Number.isInteger(n)) {
      showToast({ type: "warn", title: "Monto inválido", message: "Solo enteros (ej. 10, -5, 0)." });
      return;
    }
    try {
      const r = await authFetch("/api/credits/grant", {
        method: "POST",
        body: JSON.stringify({ userId: creditsTarget.id, amount: n, note: creditsNote }),
      });
      const d = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Créditos", message: d?.message || "Error" });
        return;
      }
      showToast({ type: "success", title: "Créditos actualizados", message: `${creditsTarget.email}` });
      setCreditsOpen(false);
      await loadUsers();
      await loadCreditLogs();
      await loadMetrics();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo actualizar créditos." });
    }
  };

  // =============== Logs filters apply ===============
  const applyLogFilters = async () => {
    // date quick range
    let from = "";
    let to = "";
    const now = new Date();
    if (logRange !== "all") {
      const days = Number(logRange);
      const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      from = d.toISOString();
      to = now.toISOString();
    } else {
      if (logFrom) from = new Date(logFrom).toISOString();
      if (logTo) to = new Date(logTo).toISOString();
    }

    await loadLogs({
      type: logType || "",
      email: logEmail || "",
      from,
      to,
    });
  };

  // =============== Sidebar items ===============
  const menu = useMemo(() => {
    const base = [
      { key: "consultar", label: "CONSULTAR", icon: "🔎", show: true },
    ];

    if (isLogged && isStaff) {
      base.push({ key: "dashboard", label: "Dashboard", icon: "📊", show: true });
      base.push({ key: "users", label: "Usuarios", icon: "👤", show: true });
      base.push({ key: "logs", label: "Logs de consultas", icon: "🧾", show: true });
      base.push({ key: "creditlogs", label: "Logs de créditos", icon: "💳", show: true });
    }

    if (isLogged && !isStaff) {
      base.push({ key: "mylogs", label: "Mis consultas", icon: "🧾", show: true });
      base.push({ key: "mycredits", label: "Mis créditos", icon: "💳", show: true });
    }

    return base;
  }, [isLogged, isStaff]);

  // =============== Render helpers ===============
  const TopTitle = ({ title, subtitle }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, color: styles.muted }}>DocuExpress</div>
      <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.6 }}>{title}</div>
      {subtitle && <div style={{ marginTop: 6, color: styles.muted, fontSize: 14 }}>{subtitle}</div>}
    </div>
  );

  const PdfButton = ({ fileId, filename }) => {
    const busy = !!downloadingIds[fileId];
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: 12,
          borderRadius: 14,
          border: `1px solid ${styles.border}`,
          background: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "#fff",
              border: `1px solid ${styles.border}`,
              flex: "0 0 auto",
            }}
            title="PDF"
          >
            📄
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {filename || "documento.pdf"}
            </div>
            <div style={{ fontSize: 12, color: styles.muted }}>Disponible por 24h</div>
          </div>
        </div>

        <Button
          variant="primary"
          disabled={busy}
          onClick={() => downloadFile(fileId, filename)}
          style={{ padding: "10px 12px", borderRadius: 12, flex: "0 0 auto" }}
        >
          {busy ? "Descargando…" : "Descargar"}
        </Button>
      </div>
    );
  };

  // =============== Main layout ===============
  return (
    <div style={{ fontFamily: styles.font }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Modals */}
      <Modal
        open={createOpen}
        title={isSuper ? "Crear usuario (Superadmin)" : "Crear usuario (Admin)"}
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createUser}>Crear</Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Email</div>
            <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="cliente@correo.com" />
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Contraseña</div>
            <Input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" type="text" />
            <div style={{ fontSize: 12, color: styles.muted, marginTop: 6 }}>
              (Tip: puedes poner una temporal y luego usar Reset Password)
            </div>
          </div>

          {isSuper && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Rol</div>
                  <Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </Select>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Owner Admin (si role=user)</div>
                  <Select
                    value={newOwnerAdminId}
                    onChange={(e) => setNewOwnerAdminId(e.target.value)}
                    style={{ opacity: newRole === "user" ? 1 : 0.5 }}
                  >
                    {(adminsForOwner || []).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.email}
                      </option>
                    ))}
                  </Select>
                  <div style={{ fontSize: 12, color: styles.muted, marginTop: 6 }}>
                    Si creas un user, debe pertenecer a un admin.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={creditsOpen}
        title={`Créditos: ${creditsTarget?.email || ""}`}
        onClose={() => setCreditsOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCreditsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={grantCredits}>Aplicar</Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Monto (entero)</div>
              <Input value={creditsAmount} onChange={(e) => setCreditsAmount(e.target.value)} placeholder="Ej. 10 o -5" />
              <div style={{ fontSize: 12, color: styles.muted, marginTop: 6 }}>
                Positivo suma / negativo resta (nunca baja de 0).
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Nota (opcional)</div>
              <Input value={creditsNote} onChange={(e) => setCreditsNote(e.target.value)} placeholder="Ej. Pago mensual" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={resetOpen}
        title="Nueva contraseña"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(resetInfo.newPassword);
                  showToast({ type: "success", title: "Copiado", message: "Contraseña copiada." });
                } catch {
                  showToast({ type: "error", title: "No se pudo copiar", message: "Copia manualmente." });
                }
              }}
            >
              Copiar
            </Button>
            <Button onClick={() => setResetOpen(false)}>Listo</Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ color: styles.muted, fontSize: 13 }}>Usuario: <b style={{ color: styles.text }}>{resetInfo.email}</b></div>
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              border: `1px solid ${styles.border}`,
              background: "#f8fafc",
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: 0.2,
            }}
          >
            {resetInfo.newPassword}
          </div>
          <div style={{ fontSize: 12, color: styles.muted }}>
            *Guárdala, porque después ya no se puede ver (solo se puede volver a resetear).
          </div>
        </div>
      </Modal>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "100vh", background: styles.bg }}>
        {/* Sidebar */}
        <aside style={{ padding: 18, borderRight: `1px solid ${styles.border}`, background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.6 }}>
              Docu<span style={{ color: styles.primary }}>Express</span>
            </div>
            <Badge color="gray">SaaS</Badge>
          </div>

          {/* Auth card */}
          {isLogged ? (
            <div style={{ padding: 14, border: "1px solid #eef2ff", background: "#f8fafc", borderRadius: 16 }}>
              <div style={{ fontSize: 12, color: styles.muted, marginBottom: 6 }}>Sesión</div>
              <div style={{ fontWeight: 1000, overflow: "hidden", textOverflow: "ellipsis" }}>{me.email}</div>

              <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Badge color={isSuper ? "amber" : isStaff ? "indigo" : "cyan"}>
                  {isSuper ? "Superadmin" : isStaff ? "Admin" : "User"}
                </Badge>
                <Badge color="cyan">{me.credits ?? myCredits ?? 0} créditos</Badge>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <Button variant="outline" onClick={onLogout}>
                  Cerrar sesión
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 14, border: `1px solid ${styles.border}`, background: "#fff", borderRadius: 16 }}>
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>Iniciar sesión</div>

              <div style={{ display: "grid", gap: 10 }}>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  type="password"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onLogin();
                  }}
                />
                <Button onClick={onLogin} disabled={loggingIn}>
                  {loggingIn ? "Entrando…" : "Iniciar sesión"}
                </Button>

                <div style={{ fontSize: 12, color: styles.muted, lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 900, color: styles.text, marginBottom: 4 }}>Demo:</div>
                  <div>Admin: admin@docuexpress.com / Admin123!</div>
                  <div>Cliente: cliente@docuexpress.com / Cliente123!</div>
                </div>
              </div>
            </div>
          )}

          {/* Menu */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: styles.muted, fontWeight: 900, marginBottom: 10 }}>Menú</div>

            <div style={{ display: "grid", gap: 10 }}>
              {menu.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setView(m.key)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: `1px solid ${styles.border}`,
                    background: view === m.key ? styles.primary : "#fff",
                    color: view === m.key ? "#fff" : styles.text,
                    fontWeight: 1000,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    letterSpacing: -0.2,
                  }}
                >
                  <span style={{ width: 22 }}>{m.icon}</span>
                  {m.label}
                </button>
              ))}

              {isLogged && isStaff && (
                <div style={{ marginTop: 10, paddingTop: 12, borderTop: "1px solid #eef2f7", display: "grid", gap: 10 }}>
                  <Button variant="outline" onClick={openCreateUser}>
                    ➕ Crear usuario
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: styles.muted }}>
            Backend: <span style={{ color: styles.text, fontWeight: 900 }}>{BACKEND_URL}</span>
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: 26 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* CONSULTAR */}
            {view === "consultar" && (
              <>
                <TopTitle
                  title="Consultar"
                  subtitle="Genera documentos del IMSS. Los PDFs se guardan por 24 horas y se descargan desde tu panel."
                />

                <Card>
                  <CardHeader
                    title="CONSULTAR"
                    subtitle="Elige el trámite, captura datos y genera el PDF."
                    right={<Badge color="gray">PDFs duran 24h</Badge>}
                  />

                  <div style={{ padding: 18 }}>
                    {step === "cards" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                        {[
                          {
                            key: "semanas",
                            title: "Semanas cotizadas",
                            desc: "Constancia de semanas cotizadas en el IMSS.",
                            badge: "CURP + NSS",
                          },
                          {
                            key: "nss",
                            title: "Asignación / Localización NSS",
                            desc: "Puede devolver 2 PDFs (principal + extra).",
                            badge: "Solo CURP • 2 PDFs",
                          },
                          {
                            key: "vigencia",
                            title: "Vigencia de derechos",
                            desc: "Constancia de vigencia de derechos.",
                            badge: "CURP + NSS",
                          },
                          {
                            key: "noderecho",
                            title: "No derechohabiencia",
                            desc: "Constancia de no derecho al servicio médico.",
                            badge: "Solo CURP",
                          },
                        ].map((c) => (
                          <button
                            key={c.key}
                            onClick={() => {
                              setType(c.key);
                              setFiles([]);
                              setStep("form");
                            }}
                            style={{
                              textAlign: "left",
                              padding: 18,
                              borderRadius: 16,
                              border: `1px solid ${styles.border}`,
                              background: "#fff",
                              cursor: "pointer",
                              transition: "transform .08s ease",
                            }}
                          >
                            <div style={{ fontWeight: 1000, fontSize: 16, marginBottom: 6 }}>{c.title}</div>
                            <div style={{ color: styles.muted, fontSize: 13, lineHeight: 1.4 }}>{c.desc}</div>
                            <div style={{ marginTop: 12 }}>
                              <Badge color="gray">{c.badge}</Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: "grid", gap: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                          <div style={{ color: styles.muted, fontSize: 13 }}>
                            Trámite: <b style={{ color: styles.text }}>{consultLabel}</b>
                          </div>
                          <Button variant="outline" onClick={() => setStep("cards")} style={{ padding: "9px 12px", borderRadius: 12 }}>
                            ← Atrás
                          </Button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 6 }}>CURP</div>
                            <Input
                              value={curp}
                              onChange={(e) => setCurp(e.target.value.toUpperCase())}
                              placeholder="Ej. MAGC790705HTLRNR03"
                            />
                          </div>

                          <div>
                            <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 6 }}>
                              NSS {(type === "semanas" || type === "vigencia") ? "(obligatorio)" : "(opcional)"}
                            </div>
                            <Input
                              value={nss}
                              onChange={(e) => setNss(e.target.value)}
                              placeholder={(type === "semanas" || type === "vigencia") ? "11 dígitos" : "Opcional"}
                            />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          <Button variant="outline" onClick={pasteCurpNss}>
                            📋 Pegar CURP/NSS
                          </Button>

                          <Button onClick={onGenerate} disabled={!isLogged || generating}>
                            {generating ? "Generando…" : "Generar documento"}
                          </Button>
                        </div>

                        <Divider />

                        <div style={{ display: "grid", gap: 10 }}>
                          {files?.length > 0 ? (
                            <>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                                <div style={{ fontWeight: 1000 }}>Descargas</div>
                                <Badge color="cyan">{files.length} PDF(s)</Badge>
                              </div>

                              <div style={{ display: "grid", gap: 10 }}>
                                {files.map((f) => (
                                  <PdfButton key={f.fileId} fileId={f.fileId} filename={f.filename} />
                                ))}
                              </div>
                            </>
                          ) : (
                            <div style={{ color: styles.muted, fontSize: 13 }}>
                              Aquí aparecerán los PDFs para descargar cuando generes un documento.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* DASHBOARD (Admin/Superadmin) */}
            {view === "dashboard" && isStaff && (
              <>
                <TopTitle title="Dashboard" subtitle="Resumen rápido de tu operación." />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
                  {[
                    { title: "Usuarios", value: metrics?.totalUsers ?? "—", icon: "👥" },
                    { title: "Créditos totales", value: metrics?.totalCredits ?? "—", icon: "💳" },
                    { title: "Consultas 24h", value: metrics?.logs24h ?? "—", icon: "🧾" },
                    {
                      title: "Rol",
                      value: isSuper ? "Superadmin" : "Admin",
                      icon: "🛡️",
                    },
                  ].map((c, i) => (
                    <Card key={i} style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: styles.muted, fontSize: 13, fontWeight: 900 }}>{c.title}</div>
                        <div style={{ fontSize: 18 }}>{c.icon}</div>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 1000, letterSpacing: -0.6 }}>{c.value}</div>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader
                    title="Top trámites (24h)"
                    subtitle="Los trámites más utilizados en las últimas 24 horas."
                    right={
                      <Button variant="outline" onClick={loadMetrics}>
                        ↻ Actualizar
                      </Button>
                    }
                  />
                  <div style={{ padding: 18 }}>
                    {(metrics?.topTypes || []).length ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {metrics.topTypes.slice(0, 8).map((t) => (
                          <div
                            key={t.type}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: 12,
                              borderRadius: 14,
                              border: `1px solid ${styles.border}`,
                              background: "#f8fafc",
                            }}
                          >
                            <div style={{ fontWeight: 1000 }}>{t.type}</div>
                            <Badge color="indigo">{t.count}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: styles.muted }}>Sin datos aún (haz algunas consultas).</div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* USERS (Admin/Superadmin) */}
            {view === "users" && isStaff && (
              <>
                <TopTitle
                  title="Usuarios"
                  subtitle={isSuper ? "Como superadmin puedes ver y crear admins/usuarios." : "Como admin solo ves tus usuarios."}
                />

                <Card>
                  <CardHeader
                    title="Usuarios"
                    subtitle="Gestiona usuarios, deshabilita, resetea password y asigna créditos."
                    right={
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Input
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Buscar email…"
                          style={{ width: 220, padding: 10, borderRadius: 12 }}
                        />
                        <Button variant="outline" onClick={loadUsers}>
                          ↻
                        </Button>
                        <Button onClick={openCreateUser}>➕ Crear</Button>
                      </div>
                    }
                  />

                  <div style={{ padding: 18 }}>
                    {usersLoading ? (
                      <div style={{ color: styles.muted }}>Cargando…</div>
                    ) : (
                      <>
                        <div style={{ display: "grid", gap: 10 }}>
                          {(users || [])
                            .filter((u) => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                            .map((u) => (
                              <div
                                key={u.id}
                                style={{
                                  border: `1px solid ${styles.border}`,
                                  borderRadius: 16,
                                  padding: 14,
                                  display: "grid",
                                  gridTemplateColumns: "1fr auto",
                                  gap: 12,
                                  background: u.disabled ? "#fff7ed" : "#fff",
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                    <div style={{ fontWeight: 1000, overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                                    <Badge color={u.role === "admin" ? "indigo" : "cyan"}>{u.role}</Badge>
                                    {u.disabled ? <Badge color="amber">Deshabilitado</Badge> : <Badge color="green">Activo</Badge>}
                                    {isSuper && u.ownerAdminId && <Badge color="gray">ownerAdminId: {String(u.ownerAdminId).slice(0, 6)}…</Badge>}
                                  </div>

                                  <div style={{ marginTop: 8, color: styles.muted, fontSize: 13 }}>
                                    Créditos: <b style={{ color: styles.text }}>{u.credits ?? 0}</b>
                                  </div>
                                </div>

                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                  <Button variant="outline" onClick={() => openCredits(u)} title="Asignar/retirar créditos">
                                    💳 Créditos
                                  </Button>
                                  <Button variant="outline" onClick={() => resetPassword(u)} title="Reset password">
                                    🔑 Reset
                                  </Button>
                                  <Button variant="outline" onClick={() => toggleDisabled(u)} title="Habilitar/Deshabilitar">
                                    {u.disabled ? "✅ Habilitar" : "⛔ Deshabilitar"}
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>

                        {(!users || users.length === 0) && <div style={{ color: styles.muted }}>Aún no hay usuarios.</div>}
                      </>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* LOGS (Admin/Superadmin) */}
            {view === "logs" && isStaff && (
              <>
                <TopTitle title="Logs de consultas" subtitle="Filtra por tipo, fechas y email." />

                <Card>
                  <CardHeader
                    title="Consultas"
                    subtitle="Logs globales (con scope por rol)."
                    right={
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Button variant="outline" onClick={applyLogFilters}>
                          Aplicar filtros
                        </Button>
                        <Button variant="outline" onClick={() => { setLogType(""); setLogEmail(""); setLogRange("7"); setLogFrom(""); setLogTo(""); }}>
                          Limpiar
                        </Button>
                      </div>
                    }
                  />

                  <div style={{ padding: 18, display: "grid", gap: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 6 }}>Tipo</div>
                        <Select value={logType} onChange={(e) => setLogType(e.target.value)}>
                          <option value="">Todos</option>
                          <option value="semanas">semanas</option>
                          <option value="asignacion">asignacion</option>
                          <option value="vigencia">vigencia</option>
                          <option value="noderecho">noderecho</option>
                        </Select>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 6 }}>Rango rápido</div>
                        <Select value={logRange} onChange={(e) => setLogRange(e.target.value)}>
                          <option value="1">Últimas 24h</option>
                          <option value="7">Últimos 7 días</option>
                          <option value="30">Últimos 30 días</option>
                          <option value="all">Manual</option>
                        </Select>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 6 }}>Buscar por email</div>
                        <Input value={logEmail} onChange={(e) => setLogEmail(e.target.value)} placeholder="correo@…" />
                      </div>
                    </div>

                    {logRange === "all" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 6 }}>Desde</div>
                          <Input value={logFrom} onChange={(e) => setLogFrom(e.target.value)} placeholder="YYYY-MM-DD" />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 1000, marginBottom: 6 }}>Hasta</div>
                          <Input value={logTo} onChange={(e) => setLogTo(e.target.value)} placeholder="YYYY-MM-DD" />
                        </div>
                      </div>
                    )}

                    <Divider />

                    {logsLoading ? (
                      <div style={{ color: styles.muted }}>Cargando…</div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {(logs || []).map((l) => (
                          <div
                            key={l.id}
                            style={{
                              border: `1px solid ${styles.border}`,
                              borderRadius: 16,
                              padding: 14,
                              background: "#fff",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                <Badge color="gray">{l.type}</Badge>
                                <div style={{ fontWeight: 1000 }}>{l.email}</div>
                                <div style={{ color: styles.muted, fontSize: 13 }}>
                                  {new Date(l.createdAt).toLocaleString()}
                                </div>
                              </div>

                              <div style={{ color: styles.muted, fontSize: 13 }}>
                                CURP: <b style={{ color: styles.text }}>{l.curp}</b>
                              </div>
                            </div>

                            {(l.files || []).length > 0 && (
                              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                                {(l.files || []).map((f) => (
                                  <PdfButton key={f.fileId} fileId={f.fileId} filename={f.filename} />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {(!logs || logs.length === 0) && <div style={{ color: styles.muted }}>Sin logs para esos filtros.</div>}
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* CREDIT LOGS (Admin/Superadmin) */}
            {view === "creditlogs" && isStaff && (
              <>
                <TopTitle title="Logs de créditos" subtitle="Historial de otorgamientos y ajustes de créditos." />

                <Card>
                  <CardHeader
                    title="Créditos"
                    subtitle="Registros de cambios de créditos."
                    right={
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Input
                          value={creditEmail}
                          onChange={(e) => setCreditEmail(e.target.value)}
                          placeholder="Filtrar por email…"
                          style={{ width: 220, padding: 10, borderRadius: 12 }}
                        />
                        <Button variant="outline" onClick={loadCreditLogs}>
                          ↻
                        </Button>
                      </div>
                    }
                  />

                  <div style={{ padding: 18 }}>
                    {creditLogsLoading ? (
                      <div style={{ color: styles.muted }}>Cargando…</div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {(creditLogs || [])
                          .filter((x) => !creditEmail || String(x.userEmail || "").toLowerCase().includes(creditEmail.toLowerCase()))
                          .map((x) => (
                            <div
                              key={x.id}
                              style={{
                                border: `1px solid ${styles.border}`,
                                borderRadius: 16,
                                padding: 14,
                                background: "#fff",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                  <Badge color={x.delta >= 0 ? "green" : "red"}>{x.delta >= 0 ? `+${x.delta}` : `${x.delta}`}</Badge>
                                  <div style={{ fontWeight: 1000 }}>{x.userEmail}</div>
                                  <div style={{ color: styles.muted, fontSize: 13 }}>
                                    {new Date(x.createdAt).toLocaleString()}
                                  </div>
                                </div>

                                <div style={{ color: styles.muted, fontSize: 13 }}>
                                  {x.before} → <b style={{ color: styles.text }}>{x.after}</b>
                                </div>
                              </div>

                              <div style={{ marginTop: 8, color: styles.muted, fontSize: 13 }}>
                                Por: <b style={{ color: styles.text }}>{x.actorEmail || x.adminEmail}</b> · Nota:{" "}
                                <span style={{ color: styles.text }}>{x.note || "—"}</span>
                              </div>
                            </div>
                          ))}

                        {(!creditLogs || creditLogs.length === 0) && <div style={{ color: styles.muted }}>Sin logs de créditos.</div>}
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* USER: MY LOGS */}
            {view === "mylogs" && isLogged && !isStaff && (
              <>
                <TopTitle title="Mis consultas" subtitle="Descarga tus PDFs generados (disponibles por 24h)." />

                <Card>
                  <CardHeader
                    title="Mis consultas"
                    subtitle="Historial personal"
                    right={<Button variant="outline" onClick={loadMyLogs}>↻</Button>}
                  />

                  <div style={{ padding: 18 }}>
                    {logsLoading ? (
                      <div style={{ color: styles.muted }}>Cargando…</div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {(logs || []).map((l) => (
                          <div key={l.id} style={{ border: `1px solid ${styles.border}`, borderRadius: 16, padding: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <Badge color="gray">{l.type}</Badge>
                                <div style={{ color: styles.muted, fontSize: 13 }}>
                                  {new Date(l.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <div style={{ color: styles.muted, fontSize: 13 }}>
                                CURP: <b style={{ color: styles.text }}>{l.curp}</b>
                              </div>
                            </div>

                            {(l.files || []).length > 0 && (
                              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                                {(l.files || []).map((f) => (
                                  <PdfButton key={f.fileId} fileId={f.fileId} filename={f.filename} />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {(!logs || logs.length === 0) && <div style={{ color: styles.muted }}>Aún no tienes consultas.</div>}
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )}

            {/* USER: MY CREDITS */}
            {view === "mycredits" && isLogged && !isStaff && (
              <>
                <TopTitle title="Mis créditos" subtitle="Tu saldo actual." />

                <Card>
                  <CardHeader
                    title="Créditos"
                    subtitle="Los créditos se descuentan por cada documento generado."
                    right={<Button variant="outline" onClick={refreshMeCredits}>↻</Button>}
                  />
                  <div style={{ padding: 18 }}>
                    <div style={{ fontSize: 46, fontWeight: 1000, letterSpacing: -1 }}>
                      {myCredits ?? me?.credits ?? 0}
                    </div>
                    <div style={{ color: styles.muted, marginTop: 8 }}>Si necesitas recarga, contacta a tu administrador.</div>
                  </div>
                </Card>
              </>
            )}

            {/* Default guard */}
            {view !== "consultar" && !isLogged && (
              <Card>
                <CardHeader title="Inicia sesión" subtitle="Debes iniciar sesión para ver esta sección." />
                <div style={{ padding: 18, color: styles.muted }}>Usa el panel de la izquierda para entrar.</div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
