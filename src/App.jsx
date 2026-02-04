import React, { useEffect, useMemo, useRef, useState } from "react";

/** ===================== CONFIG ===================== */
const BACKEND_URL =
  (import.meta?.env?.VITE_BACKEND_URL && String(import.meta.env.VITE_BACKEND_URL).trim()) ||
  "https://docuexpress.onrender.com";

const SUPERADMIN_EMAIL = "irvingestray@gmail.com";

/** ===================== HELPERS ===================== */
function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toISOString().replace("T", " ").replace("Z", "");
  } catch {
    return iso || "";
  }
}

function withinRange(iso, rangeKey) {
  if (!rangeKey || rangeKey === "all") return true;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return true;
  const now = Date.now();

  const day = 24 * 60 * 60 * 1000;
  if (rangeKey === "24h") return now - t <= day;
  if (rangeKey === "7d") return now - t <= 7 * day;
  if (rangeKey === "30d") return now - t <= 30 * day;
  return true;
}

async function safeJson(res) {
  const txt = await res.text();
  try {
    return txt ? JSON.parse(txt) : {};
  } catch {
    return { message: txt || "Respuesta inválida del servidor" };
  }
}

async function authFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${BACKEND_URL}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "documento.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** ===================== UI: TOAST ===================== */
function Toast({ toast, onClose }) {
  if (!toast) return null;

  const map = {
    success: { border: "#22c55e", bg: "#f0fdf4", title: "#166534" },
    error: { border: "#ef4444", bg: "#fef2f2", title: "#7f1d1d" },
    info: { border: "#6366f1", bg: "#eef2ff", title: "#312e81" },
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, color: s.title, marginBottom: 4 }}>
              {toast.title}
            </div>
            <div style={{ fontSize: 13, color: "#111827", opacity: 0.9, lineHeight: 1.45 }}>
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
              padding: 8,
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

/** ===================== UI: SMALL COMPONENTS ===================== */
function Pill({ children, tone = "gray" }) {
  const t = {
    gray: { bg: "#f3f4f6", bd: "#e5e7eb", fg: "#111827" },
    indigo: { bg: "#eef2ff", bd: "#c7d2fe", fg: "#3730a3" },
    cyan: { bg: "#ecfeff", bd: "#a5f3fc", fg: "#155e75" },
    green: { bg: "#f0fdf4", bd: "#bbf7d0", fg: "#166534" },
    red: { bg: "#fef2f2", bd: "#fecaca", fg: "#7f1d1d" },
  }[tone];

  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 999,
        background: t.bg,
        border: `1px solid ${t.bd}`,
        color: t.fg,
        fontWeight: 800,
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      {children}
    </span>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        border: "1px solid #e5e7eb",
        boxShadow: "0 22px 50px rgba(0,0,0,.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 18,
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div>
          <div style={{ fontWeight: 950, letterSpacing: -0.3, fontSize: 18 }}>{title}</div>
          {subtitle ? <div style={{ color: "#6b7280", fontSize: 13 }}>{subtitle}</div> : null}
        </div>
        {right || null}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 14,
        border: "none",
        background: disabled ? "#9ca3af" : "#4f46e5",
        color: "#fff",
        fontWeight: 950,
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function SoftButton({ children, onClick, disabled, style, title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        background: "#fff",
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostLink({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none",
        background: "transparent",
        color: "#4f46e5",
        fontWeight: 950,
        cursor: "pointer",
        textDecoration: "underline",
      }}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type = "text", right, style }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        value={value}
        type={type}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: right ? "12px 44px 12px 12px" : "12px",
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          outline: "none",
          ...style,
        }}
      />
      {right ? (
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
          {right}
        </div>
      ) : null}
    </div>
  );
}

function PdfDownloadButton({ label, status, onClick }) {
  // status: "idle" | "downloading" | "done" | "error"
  const isLoading = status === "downloading";
  const tone =
    status === "done" ? "green" : status === "error" ? "red" : status === "downloading" ? "indigo" : "gray";

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        width: "100%",
        textAlign: "left",
        padding: 12,
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
        cursor: isLoading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        fontWeight: 900,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>📄</span>
        <span style={{ fontSize: 13, color: "#111827" }}>{label}</span>
      </div>
      <Pill tone={tone}>
        {status === "downloading" ? "Descargando…" : status === "done" ? "Listo" : status === "error" ? "Error" : "Descargar"}
      </Pill>
    </button>
  );
}

/** ===================== APP ===================== */
export default function App() {
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (t) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // env guard (solo aviso)
  useEffect(() => {
    if (!BACKEND_URL || String(BACKEND_URL).includes("undefined")) {
      console.error("VITE_BACKEND_URL está mal:", BACKEND_URL);
      showToast({
        type: "error",
        title: "Config del backend",
        message: `VITE_BACKEND_URL inválido. Se está usando: ${BACKEND_URL}`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** -------- AUTH STATE -------- */
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState(null);

  const isLogged = !!me;
  const isAdmin = me?.role === "admin" || me?.role === "superadmin";
  const isSuper = me?.role === "superadmin" || String(me?.email || "").toLowerCase() === SUPERADMIN_EMAIL;

  /** -------- NAV -------- */
  const [view, setView] = useState("consultar"); // consultar | dashboard | users | logs | creditlogs
  const [step, setStep] = useState("cards"); // cards | form

  /** -------- CONSULT -------- */
  const [type, setType] = useState("semanas"); // semanas | nss | vigencia | noderecho
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastFiles, setLastFiles] = useState([]); // {fileId, filename, expiresAt}
  const [downloadStatus, setDownloadStatus] = useState({}); // fileId => status

  /** -------- ADMIN DATA -------- */
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [creditLogs, setCreditLogs] = useState([]);

  /** -------- FILTERS -------- */
  const [logsType, setLogsType] = useState("all"); // all | semanas | nss | vigencia | noderecho
  const [logsRange, setLogsRange] = useState("7d"); // 24h | 7d | 30d | all
  const [logsEmail, setLogsEmail] = useState("");

  const [creditEmail, setCreditEmail] = useState("");

  /** -------- CREATE USER MODAL -------- */
  const [creating, setCreating] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState("user"); // user | admin (solo super)
  const [grantUserId, setGrantUserId] = useState(null);
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantNote, setGrantNote] = useState("");

  /** ===================== SESSION BOOTSTRAP ===================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        // intenta traer créditos (y si existe endpoint /api/credits/me)
        const res = await authFetch("/api/credits/me");
        if (res.status === 401) {
          localStorage.removeItem("token");
          return;
        }
        const data = await safeJson(res);
        setMe((prev) => prev || { email: "Sesión activa", role: "user", credits: data.credits ?? 0 });
      } catch {
        // ignore
      }
    })();
  }, []);

  /** ===================== LOGIN / LOGOUT ===================== */
  const onLogin = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Login fallido",
          message: data.message || `HTTP ${res.status}`,
        });
        return;
      }

      localStorage.setItem("token", data.token);
      setMe(data.user);

      showToast({ type: "success", title: "Sesión iniciada", message: "Bienvenido 👋" });

      // default view
      setView("consultar");
      setStep("cards");
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    }
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    setMe(null);
    setUsers([]);
    setLogs([]);
    setCreditLogs([]);
    setLastFiles([]);
    setDownloadStatus({});
    setView("consultar");
    setStep("cards");
    showToast({ type: "info", title: "Sesión cerrada", message: "Hasta luego." });
  };

  /** ===================== LOAD ADMIN DATA ===================== */
  const loadUsers = async () => {
    const res = await authFetch("/api/users");
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || "No se pudo cargar usuarios");
    return Array.isArray(data.users) ? data.users : data;
  };

  const loadLogs = async () => {
    const res = await authFetch("/api/logs");
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || "No se pudo cargar logs");
    return Array.isArray(data) ? data : data.logs || [];
  };

  const loadCreditLogs = async () => {
    const res = await authFetch("/api/creditlogs");
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data.message || "No se pudo cargar logs de créditos");
    return Array.isArray(data.logs) ? data.logs : [];
  };

  const refreshAdmin = async () => {
    if (!isLogged || !isAdmin) return;
    try {
      const [u, l, c] = await Promise.all([loadUsers(), loadLogs(), loadCreditLogs()]);
      setUsers(u);
      setLogs(l);
      setCreditLogs(c);
      showToast({ type: "success", title: "Actualizado", message: "Datos refrescados." });
    } catch (e) {
      showToast({ type: "error", title: "Error", message: e.message || "No se pudo refrescar." });
    }
  };

  useEffect(() => {
    if (!isLogged) return;
    (async () => {
      // trae créditos del usuario actual
      try {
        const r = await authFetch("/api/credits/me");
        const d = await safeJson(r);
        if (r.ok) setMe((m) => (m ? { ...m, credits: d.credits ?? m.credits } : m));
      } catch {}
    })();
  }, [isLogged]);

  useEffect(() => {
    if (!isLogged || !isAdmin) return;
    // carga silenciosa inicial
    (async () => {
      try {
        const [u, l, c] = await Promise.all([loadUsers(), loadLogs(), loadCreditLogs()]);
        setUsers(u);
        setLogs(l);
        setCreditLogs(c);
      } catch {
        // ignore
      }
    })();
  }, [isLogged, isAdmin]);

  /** ===================== CONSULT: VALIDATION ===================== */
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
        title: "Permiso de portapapeles",
        message: "Tu navegador bloqueó el portapapeles. Intenta con Ctrl+V manualmente.",
      });
    }
  };

  /** ===================== CONSULT: GENERATE ===================== */
  const onGenerate = async () => {
    if (!validateConsult()) return;
    setGenerating(true);
    setLastFiles([]);

    try {
      const payload = { type, curp: curp.trim().toUpperCase(), nss: nss.trim() };

      const res = await authFetch("/api/imss", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (res.status === 401) {
        localStorage.removeItem("token");
        setMe(null);
        showToast({ type: "info", title: "Sesión expirada", message: "Vuelve a iniciar sesión." });
        return;
      }

      if (!res.ok) {
        // ✅ IMPORTANTE: “Inconsistencia” no debe quitar créditos (eso ya lo cuidas en backend)
        showToast({ type: "error", title: "Inconsistencia", message: data.message || "IMSS no devolvió PDF." });
        return;
      }

      const files = Array.isArray(data.files) ? data.files : [];
      setLastFiles(files);

      // reset estados de descarga
      const init = {};
      for (const f of files) init[f.fileId] = "idle";
      setDownloadStatus(init);

      showToast({
        type: "success",
        title: "Documento(s) generado(s)",
        message: `Listo. Se generaron ${files.length} PDF(s).`,
      });

      // refrescar créditos
      try {
        const r2 = await authFetch("/api/credits/me");
        const d2 = await safeJson(r2);
        if (r2.ok) setMe((m) => (m ? { ...m, credits: d2.credits ?? m.credits } : m));
      } catch {}
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    } finally {
      setGenerating(false);
    }
  };

  /** ===================== DOWNLOAD WITH STATUS ===================== */
  const downloadFile = async (fileId, filename) => {
    try {
      setDownloadStatus((s) => ({ ...s, [fileId]: "downloading" }));
      const res = await fetch(`${BACKEND_URL}/api/download/${fileId}`, {
        headers: {
          ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        setMe(null);
        showToast({ type: "info", title: "Sesión expirada", message: "Vuelve a iniciar sesión." });
        setDownloadStatus((s) => ({ ...s, [fileId]: "error" }));
        return;
      }

      if (!res.ok) {
        const d = await safeJson(res);
        showToast({ type: "error", title: "No se pudo descargar", message: d.message || `HTTP ${res.status}` });
        setDownloadStatus((s) => ({ ...s, [fileId]: "error" }));
        return;
      }

      const blob = await res.blob();
      downloadBlob(blob, filename || "documento.pdf");
      setDownloadStatus((s) => ({ ...s, [fileId]: "done" }));
      showToast({ type: "success", title: "Descarga iniciada", message: filename || "PDF" });
    } catch {
      setDownloadStatus((s) => ({ ...s, [fileId]: "error" }));
      showToast({ type: "error", title: "Error de red", message: "No se pudo descargar el archivo." });
    }
  };

  /** ===================== USERS: ACTIONS ===================== */
  const resetPassword = async (userId) => {
    try {
      const res = await authFetch(`/api/users/${userId}/reset-password`, { method: "POST" });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo resetear." });
        return;
      }
      showToast({ type: "success", title: "Password reseteado", message: `Nueva: ${data.newPassword}` });
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo resetear." });
    }
  };

  const openGrant = (userId) => {
    setGrantUserId(userId);
    setGrantAmount(10);
    setGrantNote("");
    showToast({ type: "info", title: "Créditos", message: "Configura cantidad y guarda." });
  };

  const grantCredits = async () => {
    if (!grantUserId) return;
    const amount = Number(grantAmount);
    if (!Number.isInteger(amount)) {
      showToast({ type: "error", title: "Cantidad inválida", message: "Debe ser un entero (ej: 10, -10)." });
      return;
    }

    try {
      const res = await authFetch("/api/credits/grant", {
        method: "POST",
        body: JSON.stringify({ userId: grantUserId, amount, note: grantNote }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo actualizar." });
        return;
      }

      showToast({ type: "success", title: "Créditos actualizados", message: data.user?.email || "Listo" });
      setGrantUserId(null);

      // refresh lists
      if (isAdmin) {
        const [u, c] = await Promise.all([loadUsers(), loadCreditLogs()]);
        setUsers(u);
        setCreditLogs(c);
      }
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo actualizar créditos." });
    }
  };

  const createUser = async () => {
    const e = String(newUserEmail || "").trim().toLowerCase();
    const p = String(newUserPass || "").trim();
    if (e.length < 5) {
      showToast({ type: "error", title: "Email inválido", message: "Escribe un email válido." });
      return;
    }
    if (p.length < 6) {
      showToast({ type: "error", title: "Password inválida", message: "Mínimo 6 caracteres." });
      return;
    }

    try {
      const res = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ email: e, password: p, role: newUserRole }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo crear." });
        return;
      }

      showToast({ type: "success", title: "Usuario creado", message: data.user?.email || e });
      setCreating(false);
      setNewUserEmail("");
      setNewUserPass("");
      setNewUserRole("user");

      const u = await loadUsers();
      setUsers(u);
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo crear." });
    }
  };

  /** ===================== DERIVED DATA: DASHBOARD ===================== */
  const logs24 = useMemo(() => logs.filter((x) => withinRange(x.createdAt, "24h")), [logs]);

  const topTypes24 = useMemo(() => {
    const map = new Map();
    for (const l of logs24) {
      const k = l.type || "otro";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [logs24]);

  const totalCredits = useMemo(() => {
    // suma créditos visibles (admin scope)
    return (users || []).reduce((acc, u) => acc + (Number(u.credits) || 0), 0);
  }, [users]);

  /** ===================== FILTERED LOGS ===================== */
  const filteredLogs = useMemo(() => {
    const q = String(logsEmail || "").trim().toLowerCase();
    return (logs || [])
      .filter((l) => (logsType === "all" ? true : (l.type || "") === logsType))
      .filter((l) => withinRange(l.createdAt, logsRange))
      .filter((l) => (q ? String(l.email || "").toLowerCase().includes(q) : true))
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [logs, logsType, logsRange, logsEmail]);

  const filteredCreditLogs = useMemo(() => {
    const q = String(creditEmail || "").trim().toLowerCase();
    return (creditLogs || [])
      .filter((x) => (q ? String(x.userEmail || "").toLowerCase().includes(q) : true))
      .slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [creditLogs, creditEmail]);

  /** ===================== UI STYLES ===================== */
  const PageShell = ({ children }) => (
    <div
      style={{
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        background: "#f6f7fb",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );

  const Sidebar = () => (
    <aside style={{ padding: 18, borderRight: "1px solid #e5e7eb", background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 950 }}>
          Docu<span style={{ color: "#4f46e5" }}>Express</span>
        </div>
        <Pill tone="gray">SaaS</Pill>
      </div>

      {!isLogged ? (
        <div style={{ marginTop: 14, padding: 14, border: "1px solid #e5e7eb", borderRadius: 16 }}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Iniciar sesión</div>

          <div style={{ display: "grid", gap: 10 }}>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              type="password"
            />

            <PrimaryButton onClick={onLogin}>Iniciar sesión</PrimaryButton>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
            <b>Demo</b>:
            <div>Admin: admin@docuexpress.com / Admin123!</div>
            <div>Cliente: cliente@docuexpress.com / Cliente123!</div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, padding: 14, border: "1px solid #eef2ff", background: "#f8fafc", borderRadius: 16 }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Sesión</div>
          <div style={{ fontWeight: 950 }}>{me.email}</div>

          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Pill tone="indigo">{isSuper ? "Super Admin" : me.role === "admin" ? "Admin" : "User"}</Pill>
            <Pill tone="cyan">{me.credits ?? 0} créditos</Pill>
          </div>

          <div style={{ marginTop: 12 }}>
            <SoftButton onClick={onLogout} style={{ width: "100%" }}>
              Cerrar sesión
            </SoftButton>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
        Backend: <b style={{ color: "#111827" }}>{BACKEND_URL}</b>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#6b7280", marginBottom: 8 }}>Menú</div>

        <div style={{ display: "grid", gap: 10 }}>
          <MenuButton label="CONSULTAR" icon="🔎" active={view === "consultar"} onClick={() => setView("consultar")} />

          {isAdmin ? (
            <>
              <MenuButton label="Dashboard" icon="📊" active={view === "dashboard"} onClick={() => setView("dashboard")} />
              <MenuButton label="Usuarios" icon="👤" active={view === "users"} onClick={() => setView("users")} />
              <MenuButton label="Logs de consultas" icon="🧾" active={view === "logs"} onClick={() => setView("logs")} />
              <MenuButton label="Logs de créditos" icon="💳" active={view === "creditlogs"} onClick={() => setView("creditlogs")} />

              <SoftButton
                onClick={() => {
                  setCreating(true);
                  setNewUserRole("user");
                }}
                style={{ width: "100%", marginTop: 8 }}
              >
                ➕ Crear usuario
              </SoftButton>

              <SoftButton onClick={refreshAdmin} style={{ width: "100%" }}>
                🔄 Actualizar
              </SoftButton>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  );

  const MenuButton = ({ label, icon, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        background: active ? "#4f46e5" : "#fff",
        color: active ? "#fff" : "#111827",
        fontWeight: 950,
        cursor: "pointer",
        display: "flex",
        gap: 10,
        alignItems: "center",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  /** ===================== VIEWS ===================== */
  const Header = ({ title, subtitle, right }) => (
    <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
      <div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>DocuExpress</div>
        <div style={{ fontSize: 32, fontWeight: 980, letterSpacing: -0.6 }}>{title}</div>
        {subtitle ? <div style={{ color: "#6b7280", marginTop: 6 }}>{subtitle}</div> : null}
      </div>
      {right || null}
    </div>
  );

  const ConsultView = () => {
    const tramites = [
      { key: "semanas", title: "Semanas cotizadas", desc: "Constancia de semanas cotizadas en el IMSS.", badge: "CURP + NSS" },
      { key: "nss", title: "Asignación / Localización NSS", desc: "Genera documentos de NSS (puede devolver 2 PDFs).", badge: "Solo CURP • 2 PDFs" },
      { key: "vigencia", title: "Vigencia de derechos", desc: "Constancia de vigencia de derechos.", badge: "CURP + NSS" },
      { key: "noderecho", title: "No derechohabiencia", desc: "Constancia de no derecho al servicio médico.", badge: "Solo CURP (según proveedor)" },
    ];

    const typeLabel =
      type === "semanas"
        ? "Semanas cotizadas"
        : type === "nss"
        ? "Asignación / Localización NSS"
        : type === "vigencia"
        ? "Vigencia de derechos"
        : "No derechohabiencia";

    return (
      <>
        <Header
          title="Consultar"
          subtitle="Genera documentos del IMSS. Los PDFs se guardan por 24 horas y se descargan desde tu panel."
          right={<Pill tone="gray">PDFs duran 24h</Pill>}
        />

        <Card
          title="CONSULTAR"
          subtitle="Elige el trámite, captura datos y genera el PDF."
          right={<Pill tone="gray">PDFs duran 24h</Pill>}
        >
          {step === "cards" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {tramites.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setType(c.key);
                    setStep("form");
                    setLastFiles([]);
                  }}
                  style={{
                    textAlign: "left",
                    padding: 18,
                    borderRadius: 16,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    cursor: "pointer",
                    transition: "transform .08s ease",
                  }}
                >
                  <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 6 }}>{c.title}</div>
                  <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.4 }}>{c.desc}</div>
                  <div style={{ marginTop: 12 }}>
                    <Pill tone="gray">{c.badge}</Pill>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ color: "#6b7280", fontSize: 13 }}>
                  Trámite: <b style={{ color: "#111827" }}>{typeLabel}</b>
                </div>
                <SoftButton onClick={() => setStep("cards")}>← Atrás</SoftButton>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>CURP</div>
                  <Input
                    value={curp}
                    onChange={(e) => setCurp(e.target.value.toUpperCase())}
                    placeholder="Ej. MAGC790705HTLRNR03"
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>
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
                <SoftButton onClick={pasteCurpNss} style={{ width: "100%" }}>
                  📋 Pegar CURP/NSS
                </SoftButton>

                <PrimaryButton onClick={onGenerate} disabled={!isLogged || generating}>
                  {generating ? "Generando…" : "Generar documento"}
                </PrimaryButton>
              </div>

              <div style={{ marginTop: 14, borderTop: "1px solid #f1f5f9", paddingTop: 14 }}>
                {lastFiles.length === 0 ? (
                  <div style={{ color: "#6b7280", fontSize: 13 }}>
                    Aquí aparecerán los PDFs para descargar cuando generes un documento.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {lastFiles.map((f) => (
                      <PdfDownloadButton
                        key={f.fileId}
                        label={f.filename || "documento.pdf"}
                        status={downloadStatus[f.fileId] || "idle"}
                        onClick={() => downloadFile(f.fileId, f.filename)}
                      />
                    ))}
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      * Si ya pasó 24h, el backend puede haberlo borrado.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </>
    );
  };

  const DashboardView = () => (
    <>
      <Header title="Dashboard" subtitle="Resumen rápido de tu operación." />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        <MiniStat title="Usuarios" value={`${users.length}`} icon="👥" />
        <MiniStat title="Créditos totales" value={`${totalCredits}`} icon="💳" />
        <MiniStat title="Consultas 24h" value={`${logs24.length}`} icon="🧾" />
        <MiniStat title="Rol" value={isSuper ? "Super Admin" : me.role === "admin" ? "Admin" : "User"} icon="🛡️" />
      </div>

      <Card
        title="Top trámites (24h)"
        subtitle="Los trámites más utilizados en las últimas 24 horas."
        right={<SoftButton onClick={refreshAdmin}>↻ Actualizar</SoftButton>}
      >
        {topTypes24.length === 0 ? (
          <div style={{ color: "#6b7280" }}>Sin datos aún (haz algunas consultas).</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {topTypes24.slice(0, 8).map(([k, v]) => (
              <div
                key={k}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 950 }}>{k}</div>
                <Pill tone="indigo">{v}</Pill>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );

  const MiniStat = ({ title, value, icon }) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 18px 40px rgba(0,0,0,.06)",
        padding: 14,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div>
        <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 980, letterSpacing: -0.4 }}>{value}</div>
      </div>
      <div style={{ fontSize: 18 }}>{icon}</div>
    </div>
  );

  const UsersView = () => {
    const [q, setQ] = useState("");
    const list = useMemo(() => {
      const qq = String(q).trim().toLowerCase();
      return (users || [])
        .filter((u) => (qq ? String(u.email || "").toLowerCase().includes(qq) : true))
        .slice()
        .sort((a, b) => String(a.email || "").localeCompare(String(b.email || "")));
    }, [q, users]);

    return (
      <>
        <Header title="Usuarios" subtitle={isSuper ? "Como super admin ves todos los admins y sus usuarios." : "Como admin solo ves tus usuarios."} />

        <Card
          title="Usuarios"
          subtitle="Gestiona usuarios, resetea password y asigna créditos."
          right={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 220 }}>
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar email..." />
              </div>
              <SoftButton onClick={refreshAdmin} title="Actualizar">↻</SoftButton>
              <SoftButton
                onClick={() => {
                  setCreating(true);
                  setNewUserRole("user");
                }}
                style={{ background: "#4f46e5", color: "#fff", border: "none" }}
              >
                ➕ Crear
              </SoftButton>
            </div>
          }
        >
          <div style={{ display: "grid", gap: 10 }}>
            {list.map((u) => {
              const active = !u.disabled;
              const roleTone = u.role === "admin" ? "indigo" : "cyan";
              return (
                <div
                  key={u.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 14,
                    background: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 980 }}>{u.email}</div>
                      <Pill tone={roleTone}>{u.role}</Pill>
                      <Pill tone={active ? "green" : "red"}>{active ? "Activo" : "Deshabilitado"}</Pill>
                      {isSuper && u.ownerAdminId ? <Pill tone="gray">owner: {u.ownerAdminId.slice(0, 6)}…</Pill> : null}
                    </div>
                    <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
                      Créditos: <b style={{ color: "#111827" }}>{u.credits ?? 0}</b>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <SoftButton onClick={() => openGrant(u.id)}>💳 Créditos</SoftButton>
                    <SoftButton onClick={() => resetPassword(u.id)}>🔑 Reset</SoftButton>
                  </div>
                </div>
              );
            })}

            {list.length === 0 ? <div style={{ color: "#6b7280" }}>Sin usuarios.</div> : null}
          </div>
        </Card>

        {/* GRANT MODAL */}
        {grantUserId ? (
          <div style={modalBackdrop}>
            <div style={modalCard}>
              <div style={{ fontWeight: 980, fontSize: 18 }}>Asignar créditos</div>
              <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
                Entero positivo o negativo. Ej: <b>10</b> / <b>-10</b>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <Input
                  value={String(grantAmount)}
                  onChange={(e) => setGrantAmount(e.target.value)}
                  placeholder="Cantidad (ej: 10)"
                />
                <Input
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                  placeholder="Nota (opcional)"
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <SoftButton onClick={() => setGrantUserId(null)} style={{ width: "100%" }}>
                  Cancelar
                </SoftButton>
                <PrimaryButton onClick={grantCredits} style={{ width: "100%" }}>
                  Guardar
                </PrimaryButton>
              </div>
            </div>
          </div>
        ) : null}

        {/* CREATE USER MODAL */}
        {creating ? (
          <div style={modalBackdrop}>
            <div style={modalCard}>
              <div style={{ fontWeight: 980, fontSize: 18 }}>Crear usuario</div>
              <div style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
                {isSuper ? "Puedes crear users o admins." : "Como admin, solo puedes crear users."}
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <Input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="Email" />
                <Input
                  value={newUserPass}
                  onChange={(e) => setNewUserPass(e.target.value)}
                  placeholder="Password"
                  type="password"
                />

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 900, fontSize: 12, color: "#6b7280" }}>Rol</div>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    disabled={!isSuper}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid #e5e7eb",
                      background: !isSuper ? "#f3f4f6" : "#fff",
                      fontWeight: 900,
                    }}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <SoftButton onClick={() => setCreating(false)} style={{ width: "100%" }}>
                  Cancelar
                </SoftButton>
                <PrimaryButton onClick={createUser} style={{ width: "100%" }}>
                  Crear
                </PrimaryButton>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  };

  const LogsView = () => (
    <>
      <Header title="Logs de consultas" subtitle="Filtra por tipo, fechas y email." />

      <Card
        title="Consultas"
        subtitle="Logs globales (con scope por rol)."
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SoftButton onClick={refreshAdmin}>Aplicar filtros</SoftButton>
            <SoftButton
              onClick={() => {
                setLogsType("all");
                setLogsRange("7d");
                setLogsEmail("");
              }}
            >
              Limpiar
            </SoftButton>
          </div>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>Tipo</div>
            <select
              value={logsType}
              onChange={(e) => setLogsType(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", fontWeight: 900 }}
            >
              <option value="all">Todos</option>
              <option value="semanas">semanas</option>
              <option value="nss">nss</option>
              <option value="vigencia">vigencia</option>
              <option value="noderecho">noderecho</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>Rango rápido</div>
            <select
              value={logsRange}
              onChange={(e) => setLogsRange(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", fontWeight: 900 }}
            >
              <option value="24h">Últimas 24h</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="all">Todo</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>Buscar por email</div>
            <Input value={logsEmail} onChange={(e) => setLogsEmail(e.target.value)} placeholder="correo@..." />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div style={{ color: "#6b7280" }}>Sin logs para esos filtros.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filteredLogs.slice(0, 80).map((l) => (
              <div
                key={l.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  background: "#fff",
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 980 }}>{l.email}</div>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>{fmtDate(l.createdAt)}</div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <Pill tone="gray">{l.type}</Pill>
                  <Pill tone="cyan">{l.curp}</Pill>
                  {l.nss ? <Pill tone="gray">{l.nss}</Pill> : null}
                  <Pill tone="green">{(l.files || []).length} PDF(s)</Pill>
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  {(l.files || []).map((f) => (
                    <PdfDownloadButton
                      key={f.fileId}
                      label={f.filename || "documento.pdf"}
                      status={downloadStatus[f.fileId] || "idle"}
                      onClick={() => downloadFile(f.fileId, f.filename)}
                    />
                  ))}
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    * Si ya pasó 24h, el backend puede haberlo borrado.
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );

  const CreditLogsView = () => (
    <>
      <Header title="Logs de créditos" subtitle="Historial de otorgamientos y ajustes de créditos." />

      <Card
        title="Créditos"
        subtitle="Registros de cambios de créditos."
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 220 }}>
              <Input value={creditEmail} onChange={(e) => setCreditEmail(e.target.value)} placeholder="Filtrar por email..." />
            </div>
            <SoftButton onClick={refreshAdmin} title="Actualizar">↻</SoftButton>
          </div>
        }
      >
        {filteredCreditLogs.length === 0 ? (
          <div style={{ color: "#6b7280" }}>Sin logs de créditos.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filteredCreditLogs.slice(0, 120).map((x) => (
              <div
                key={x.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  background: "#fff",
                  padding: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 980 }}>{x.userEmail}</div>
                  <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                    Por: <b style={{ color: "#111827" }}>{x.adminEmail}</b> • {fmtDate(x.createdAt)}
                  </div>
                  {x.note ? <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>{x.note}</div> : null}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Pill tone={x.delta >= 0 ? "green" : "red"}>
                    {x.delta >= 0 ? `+${x.delta}` : `${x.delta}`}
                  </Pill>
                  <Pill tone="gray">Antes: {x.before}</Pill>
                  <Pill tone="indigo">Después: {x.after}</Pill>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );

  /** ===================== MODAL STYLES ===================== */
  const modalBackdrop = {
    position: "fixed",
    inset: 0,
    background: "rgba(17, 24, 39, .55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9998,
    padding: 16,
  };

  const modalCard = {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 28px 80px rgba(0,0,0,.25)",
    padding: 16,
  };

  /** ===================== MAIN RENDER ===================== */
  return (
    <PageShell>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: "100vh" }}>
        <Sidebar />

        <main style={{ padding: 26 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {!isLogged ? (
              <Header
                title="Consultar"
                subtitle="Genera documentos del IMSS. Inicia sesión para generar y descargar PDFs."
              />
            ) : null}

            {view === "consultar" && <ConsultView />}

            {isAdmin && view === "dashboard" && <DashboardView />}
            {isAdmin && view === "users" && <UsersView />}
            {isAdmin && view === "logs" && <LogsView />}
            {isAdmin && view === "creditlogs" && <CreditLogsView />}

            {!isLogged ? (
              <div style={{ marginTop: 10 }}>
                <Card title="Tip" subtitle="Si no puedes iniciar sesión, revisa BACKEND_URL y tu API de login.">
                  <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>
                    Si Vercel no toma la variable, este frontend usa un fallback:
                    <div style={{ marginTop: 8 }}>
                      <Pill tone="gray">{BACKEND_URL}</Pill>
                    </div>
                  </div>
                </Card>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </PageShell>
  );
}
