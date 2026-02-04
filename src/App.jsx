import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * BACKEND_URL:
 * - Usa VITE_BACKEND_URL si existe
 * - Si no, cae al Render (default)
 */
const BACKEND_URL =
  (import.meta?.env?.VITE_BACKEND_URL &&
    String(import.meta.env.VITE_BACKEND_URL).trim()) ||
  "https://docuexpress.onrender.com";

/* ===========================
   Helpers
=========================== */
async function safeJson(res) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return { message: t };
  }
}

function nowISO() {
  return new Date().toISOString();
}

function toDateInputValue(d) {
  // YYYY-MM-DD
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function subtractDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function clampStr(s, max = 120) {
  const x = String(s ?? "");
  return x.length > max ? x.slice(0, max) + "…" : x;
}

function fileLabelFromType(type) {
  const map = {
    semanas: "Semanas",
    nss: "NSS",
    vigencia: "Vigencia",
    noderecho: "NoDerecho",
  };
  return map[type] || "Documento";
}

function normalizeEmail(s) {
  return String(s || "").trim().toLowerCase();
}

function isWAFHtmlMessage(msg) {
  // Cuando el proveedor regresa HTML/WAF (Incapsula, etc)
  const m = String(msg || "");
  return m.includes("<html") || m.toLowerCase().includes("incapsula");
}

/* ===========================
   Auth fetch
=========================== */
async function authFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Si mandamos body como JSON, aseguramos content-type
  const hasBody = opts.body !== undefined && opts.body !== null;
  const isFormData = hasBody && opts.body instanceof FormData;

  if (hasBody && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${BACKEND_URL}${path}`, { ...opts, headers });
}

/* ===========================
   UI: Tiny icons (inline)
=========================== */
function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" };
  const stroke = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  if (name === "search")
    return (
      <svg {...common}>
        <path {...stroke} d="M21 21l-4.35-4.35" />
        <circle cx="11" cy="11" r="7" {...stroke} />
      </svg>
    );

  if (name === "dashboard")
    return (
      <svg {...common}>
        <path {...stroke} d="M4 13h6V4H4v9zM14 20h6V11h-6v9zM14 9h6V4h-6v5zM4 20h6v-5H4v5z" />
      </svg>
    );

  if (name === "users")
    return (
      <svg {...common}>
        <path {...stroke} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" {...stroke} />
        <path {...stroke} d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path {...stroke} d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );

  if (name === "file")
    return (
      <svg {...common}>
        <path {...stroke} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path {...stroke} d="M14 2v6h6" />
        <path {...stroke} d="M8 13h8M8 17h8M8 9h2" />
      </svg>
    );

  if (name === "credit")
    return (
      <svg {...common}>
        <path {...stroke} d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        <path {...stroke} d="M16 11h2" />
      </svg>
    );

  if (name === "logout")
    return (
      <svg {...common}>
        <path {...stroke} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path {...stroke} d="M16 17l5-5-5-5" />
        <path {...stroke} d="M21 12H9" />
      </svg>
    );

  if (name === "refresh")
    return (
      <svg {...common}>
        <path {...stroke} d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64" />
        <path {...stroke} d="M21 3v6h-6" />
      </svg>
    );

  if (name === "plus")
    return (
      <svg {...common}>
        <path {...stroke} d="M12 5v14M5 12h14" />
      </svg>
    );

  if (name === "download")
    return (
      <svg {...common}>
        <path {...stroke} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path {...stroke} d="M7 10l5 5 5-5" />
        <path {...stroke} d="M12 15V3" />
      </svg>
    );

  if (name === "key")
    return (
      <svg {...common}>
        <path {...stroke} d="M21 2l-2 2m-7.5 7.5a4.5 4.5 0 1 1 0-6.36A4.5 4.5 0 0 1 11.5 11.5z" />
        <path {...stroke} d="M15 7l6-5" />
        <path {...stroke} d="M18 6l2 2" />
      </svg>
    );

  return null;
}

/* ===========================
   Toast
=========================== */
function Toast({ toast, onClose }) {
  if (!toast) return null;

  const colors = {
    success: "#16a34a",
    error: "#dc2626",
    info: "#4f46e5",
    warn: "#f59e0b",
  };

  return (
    <div style={styles.toastWrap}>
      <div style={{ ...styles.toast, borderLeftColor: colors[toast.type] || "#4f46e5" }}>
        <div style={styles.toastHeader}>
          <div style={{ fontWeight: 800 }}>{toast.title}</div>
          <button onClick={onClose} style={styles.toastClose}>Cerrar</button>
        </div>
        <div style={styles.toastBody}>{toast.message}</div>
      </div>
    </div>
  );
}

/* ===========================
   Small UI building blocks
=========================== */
function Pill({ children, tone = "neutral" }) {
  const toneStyle =
    tone === "purple"
      ? { background: "rgba(79,70,229,.10)", borderColor: "rgba(79,70,229,.20)", color: "#3730a3" }
      : tone === "green"
      ? { background: "rgba(22,163,74,.10)", borderColor: "rgba(22,163,74,.20)", color: "#166534" }
      : tone === "red"
      ? { background: "rgba(220,38,38,.10)", borderColor: "rgba(220,38,38,.20)", color: "#991b1b" }
      : tone === "blue"
      ? { background: "rgba(59,130,246,.10)", borderColor: "rgba(59,130,246,.20)", color: "#1d4ed8" }
      : { background: "rgba(2,6,23,.06)", borderColor: "rgba(2,6,23,.08)", color: "#111827" };

  return <span style={{ ...styles.pill, ...toneStyle }}>{children}</span>;
}

function Button({ children, variant = "primary", onClick, disabled, leftIcon, style }) {
  const base =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "ghost"
      ? styles.btnGhost
      : variant === "danger"
      ? styles.btnDanger
      : styles.btnSoft;

  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...(style || {}) }}>
      {leftIcon ? <span style={{ marginRight: 10, display: "inline-flex" }}>{leftIcon}</span> : null}
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", right, autoComplete }) {
  return (
    <div style={{ width: "100%" }}>
      {label ? <div style={styles.label}>{label}</div> : null}
      <div style={styles.inputWrap}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          style={styles.input}
        />
        {right ? <div style={styles.inputRight}>{right}</div> : null}
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ width: "100%" }}>
      {label ? <div style={styles.label}>{label}</div> : null}
      <select value={value} onChange={onChange} style={styles.select}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>{title}</div>
          {subtitle ? <div style={styles.cardSub}>{subtitle}</div> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div style={styles.cardBody}>{children}</div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTop}>
        <div style={styles.statTitle}>{title}</div>
        <div style={styles.statIcon}>{icon}</div>
      </div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

/* ===========================
   Main App
=========================== */
export default function App() {
  const [toast, setToast] = useState(null);
  const showToast = (t) => setToast(t);

  // Auth state
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState(null);

  // UI state
  const [view, setView] = useState("consultar"); // consultar | dashboard | users | logs | creditlogs
  const [consultStep, setConsultStep] = useState("cards"); // cards | form
  const [type, setType] = useState("semanas");
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [files, setFiles] = useState([]);

  // Data
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [creditLogs, setCreditLogs] = useState([]);

  // Loading states
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingCreditLogs, setLoadingCreditLogs] = useState(false);

  // Download loading per fileId
  const [downloading, setDownloading] = useState({}); // { [fileId]: true }

  // Filters (logs)
  const [logType, setLogType] = useState("all");
  const [logRange, setLogRange] = useState("7"); // days: 1,7,30
  const [logEmail, setLogEmail] = useState("");

  // Filters (credit logs)
  const [creditEmail, setCreditEmail] = useState("");

  // Create user modal (simple)
  const [createOpen, setCreateOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [creatingUser, setCreatingUser] = useState(false);

  // Credits modal (simple)
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditTarget, setCreditTarget] = useState(null);
  const [creditAmount, setCreditAmount] = useState(10);
  const [creditNote, setCreditNote] = useState("");
  const [savingCredits, setSavingCredits] = useState(false);

  // Search users
  const [userSearch, setUserSearch] = useState("");

  const isAdmin = me?.role === "admin" || me?.role === "superadmin";
  const isSuper = me?.role === "superadmin";

  // ✅ Evitar blur “raro”: input focus estable
  const passwordRef = useRef(null);

  /* ===========================
     Bootstrap session
  ============================ */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Ping a credits/me para validar token y recuperar usuario guardado si existe
    const saved = localStorage.getItem("me");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMe(parsed);
      } catch {}
    }

    authFetch("/api/credits/me")
      .then(async (r) => {
        if (!r.ok) throw new Error("bad");
        const data = await safeJson(r);
        // si tengo me, actualizo credits
        setMe((prev) => (prev ? { ...prev, credits: data.credits ?? prev.credits } : prev));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("me");
        setMe(null);
      });
  }, []);

  /* ===========================
     Login / Logout
  ============================ */
  const onLogin = async () => {
    setToast(null);
    setLoadingLogin(true);
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
          message: data.message || `HTTP ${res.status}`,
        });
        setLoadingLogin(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("me", JSON.stringify(data.user));
      setMe(data.user);
      setPassword("");
      setView("consultar");
      setConsultStep("cards");
      setFiles([]);

      showToast({ type: "success", title: "Sesión iniciada", message: "Bienvenido 👋" });
    } catch {
      showToast({
        type: "error",
        title: "Error de red",
        message: "No se pudo conectar al backend.",
      });
    } finally {
      setLoadingLogin(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("me");
    setMe(null);
    setEmail("admin@docuexpress.com");
    setPassword("");
    setView("consultar");
    setConsultStep("cards");
    setFiles([]);
    setToast(null);
  };

  /* ===========================
     Load data for admin areas
  ============================ */
  const refreshUsers = async () => {
    setLoadingUsers(true);
    try {
      const r = await authFetch("/api/users");
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data.message || "No se pudo cargar usuarios");
      setUsers(data.users || data.users === undefined ? data.users : (data.users || []));
      // compat por si backend responde {users:[...]}
      setUsers(data.users || data.users === undefined ? (data.users || []) : []);
    } catch (e) {
      showToast({ type: "error", title: "Error", message: String(e.message || e) });
    } finally {
      setLoadingUsers(false);
    }
  };

  const refreshLogs = async () => {
    setLoadingLogs(true);
    try {
      const r = await authFetch("/api/logs");
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data.message || "No se pudieron cargar logs");
      setLogs(Array.isArray(data) ? data : data.logs || []);
    } catch (e) {
      showToast({ type: "error", title: "Error", message: String(e.message || e) });
    } finally {
      setLoadingLogs(false);
    }
  };

  const refreshCreditLogs = async () => {
    setLoadingCreditLogs(true);
    try {
      const r = await authFetch("/api/credit-logs");
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data.message || "No se pudieron cargar logs de créditos");
      setCreditLogs(data.logs || []);
    } catch (e) {
      showToast({ type: "error", title: "Error", message: String(e.message || e) });
    } finally {
      setLoadingCreditLogs(false);
    }
  };

  // Cuando entra a vistas admin, cargamos
  useEffect(() => {
    if (!me) return;
    // mantener credits actualizados
    authFetch("/api/credits/me")
      .then(async (r) => {
        if (!r.ok) return;
        const data = await safeJson(r);
        setMe((prev) => (prev ? { ...prev, credits: data.credits ?? prev.credits } : prev));
      })
      .catch(() => {});
  }, [me, view]);

  useEffect(() => {
    if (!me || !isAdmin) return;
    if (view === "users") refreshUsers();
    if (view === "logs") refreshLogs();
    if (view === "creditlogs") refreshCreditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, me?.id]);

  /* ===========================
     Consultar (generate + download)
  ============================ */
  const requirements = useMemo(() => {
    if (type === "nss") return { curp: true, nss: false, hint: "Solo CURP · puede devolver 2 PDFs" };
    if (type === "noderecho") return { curp: true, nss: false, hint: "Solo CURP (según proveedor)" };
    if (type === "vigencia") return { curp: true, nss: true, hint: "CURP + NSS" };
    return { curp: true, nss: true, hint: "CURP + NSS" }; // semanas
  }, [type]);

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const t = String(text || "").trim();
      // Buscar CURP (18) y NSS (11) dentro del texto
      const curpMatch = t.match(/[A-Z]{4}\d{6}[A-Z]{6}\d{2}/i);
      const nssMatch = t.match(/\b\d{11}\b/);

      if (curpMatch) setCurp(curpMatch[0].toUpperCase());
      if (nssMatch) setNss(nssMatch[0]);

      showToast({ type: "info", title: "Pegado", message: "Se detectó CURP/NSS desde el portapapeles." });
    } catch {
      showToast({ type: "warn", title: "No se pudo pegar", message: "Tu navegador bloqueó el portapapeles." });
    }
  };

  const generate = async () => {
    setToast(null);

    const cleanCurp = String(curp || "").trim().toUpperCase();
    const cleanNss = String(nss || "").trim();

    if (requirements.curp && cleanCurp.length < 10) {
      showToast({ type: "error", title: "Falta CURP", message: "Ingresa una CURP válida." });
      return;
    }
    if (requirements.nss && cleanNss.length !== 11) {
      showToast({ type: "error", title: "Falta NSS", message: "El NSS debe tener 11 dígitos." });
      return;
    }

    setLoadingGenerate(true);
    setFiles([]);

    try {
      const res = await authFetch("/api/imss", {
        method: "POST",
        body: JSON.stringify({ type, curp: cleanCurp, nss: cleanNss }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        // Mensaje más “bonito” si el proveedor bloquea
        const msg = data?.message || `HTTP ${res.status}`;
        if (isWAFHtmlMessage(msg)) {
          showToast({
            type: "warn",
            title: "Inconsistencia",
            message:
              "El proveedor externo bloqueó la solicitud (WAF). Intenta con otro CURP/NSS, espera unos minutos o vuelve a intentar.",
          });
        } else {
          showToast({ type: "error", title: "Inconsistencia", message: clampStr(msg, 220) });
        }
        return;
      }

      // Actualizar credits
      authFetch("/api/credits/me")
        .then(async (r) => {
          if (!r.ok) return;
          const c = await safeJson(r);
          setMe((prev) => (prev ? { ...prev, credits: c.credits ?? prev.credits } : prev));
          localStorage.setItem("me", JSON.stringify({ ...(me || {}), credits: c.credits }));
        })
        .catch(() => {});

      setFiles(data.files || []);
      showToast({ type: "success", title: "Documento generado", message: "PDF listo para descargar." });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    } finally {
      setLoadingGenerate(false);
    }
  };

  const download = async (fileId, filename) => {
    if (!fileId) return;

    setDownloading((p) => ({ ...p, [fileId]: true }));
    try {
      const r = await authFetch(`/api/download/${fileId}`);
      if (!r.ok) {
        const data = await safeJson(r);
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo descargar." });
        return;
      }

      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename || `DocuExpress_${fileId}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo descargar el archivo." });
    } finally {
      setDownloading((p) => {
        const copy = { ...p };
        delete copy[fileId];
        return copy;
      });
    }
  };

  /* ===========================
     Admin actions
  ============================ */
  const openCreateUser = () => {
    setCreateOpen(true);
    setNewUserEmail("");
    setNewUserPass("");
    setNewUserRole("user");
  };

  const createUser = async () => {
    setCreatingUser(true);
    try {
      const r = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          email: newUserEmail.trim(),
          password: newUserPass,
          role: newUserRole,
        }),
      });

      const data = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo crear usuario." });
        return;
      }

      showToast({ type: "success", title: "Usuario creado", message: data?.user?.email || "Listo." });
      setCreateOpen(false);
      refreshUsers();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo crear usuario." });
    } finally {
      setCreatingUser(false);
    }
  };

  const resetPassword = async (userId) => {
    try {
      const r = await authFetch(`/api/users/${userId}/reset-password`, { method: "POST" });
      const data = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo resetear." });
        return;
      }

      showToast({
        type: "success",
        title: "Password reseteada",
        message: `Nueva contraseña: ${data.newPassword}`,
      });
      refreshUsers();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo resetear password." });
    }
  };

  const toggleDisable = async (u) => {
    try {
      const r = await authFetch(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: !u.disabled }),
      });
      const data = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo actualizar." });
        return;
      }
      refreshUsers();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo actualizar." });
    }
  };

  const openCredits = (u) => {
    setCreditTarget(u);
    setCreditAmount(10);
    setCreditNote("");
    setCreditsOpen(true);
  };

  const grantCredits = async () => {
    if (!creditTarget) return;
    setSavingCredits(true);

    try {
      const r = await authFetch("/api/credits/grant", {
        method: "POST",
        body: JSON.stringify({
          userId: creditTarget.id,
          amount: Number(creditAmount),
          note: String(creditNote || "").slice(0, 200),
        }),
      });
      const data = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo asignar créditos." });
        return;
      }

      showToast({ type: "success", title: "Créditos actualizados", message: creditTarget.email });
      setCreditsOpen(false);
      refreshUsers();
      if (view === "creditlogs") refreshCreditLogs();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo asignar créditos." });
    } finally {
      setSavingCredits(false);
    }
  };

  /* ===========================
     Derived data for UI
  ============================ */
  const filteredUsers = useMemo(() => {
    const q = normalizeEmail(userSearch);
    if (!q) return users || [];
    return (users || []).filter((u) => normalizeEmail(u.email).includes(q));
  }, [users, userSearch]);

  const filteredLogs = useMemo(() => {
    let items = Array.isArray(logs) ? logs.slice() : [];

    // tipo
    if (logType !== "all") {
      items = items.filter((l) => String(l.type) === logType);
    }

    // rango
    const days = Number(logRange);
    if (Number.isFinite(days) && days > 0) {
      const from = subtractDays(new Date(), days).getTime();
      items = items.filter((l) => {
        const t = new Date(l.createdAt || l.date || l.ts || 0).getTime();
        return t >= from;
      });
    }

    // email
    const q = normalizeEmail(logEmail);
    if (q) {
      items = items.filter((l) => normalizeEmail(l.email || l.userEmail).includes(q));
    }

    // newest first
    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return items;
  }, [logs, logType, logRange, logEmail]);

  const filteredCreditLogs = useMemo(() => {
    let items = Array.isArray(creditLogs) ? creditLogs.slice() : [];
    const q = normalizeEmail(creditEmail);
    if (q) {
      items = items.filter(
        (l) => normalizeEmail(l.userEmail).includes(q) || normalizeEmail(l.adminEmail).includes(q)
      );
    }
    return items;
  }, [creditLogs, creditEmail]);

  const dashboardStats = useMemo(() => {
    const totalUsers = (users || []).length;
    const totalCredits = (users || []).reduce((acc, u) => acc + Number(u.credits || 0), 0);

    const last24 = subtractDays(new Date(), 1).getTime();
    const logs24 = (Array.isArray(logs) ? logs : []).filter((l) => new Date(l.createdAt || 0).getTime() >= last24);

    const byType = {};
    for (const l of logs24) {
      const t = String(l.type || "otro");
      byType[t] = (byType[t] || 0) + 1;
    }

    const top = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { totalUsers, totalCredits, logs24Count: logs24.length, top };
  }, [users, logs]);

  /* ===========================
     UI: login screen
  ============================ */
  if (!me) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.shell, gridTemplateColumns: "420px 1fr" }}>
          <div style={styles.sidebarLogin}>
            <div style={styles.brandRow}>
              <div style={styles.brand}>
                <span style={{ fontWeight: 900 }}>Docu</span>
                <span style={{ fontWeight: 900, color: "#4f46e5" }}>Express</span>
              </div>
              <Pill tone="purple">SaaS</Pill>
            </div>

            <div style={styles.loginCard}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 14 }}>Iniciar sesión</div>

              <div style={{ display: "grid", gap: 12 }}>
                <Input
                  label="Correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@docuexpress.com"
                  autoComplete="username"
                  right={<span style={{ opacity: 0.7 }}>@</span>}
                />
                <Input
                  label="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  type="password"
                  autoComplete="current-password"
                  right={<Icon name="key" />}
                />
                <Button
                  variant="primary"
                  onClick={onLogin}
                  disabled={loadingLogin || !email || !password}
                  leftIcon={loadingLogin ? <span style={styles.spinner} /> : null}
                  style={{ width: "100%", height: 48, borderRadius: 14 }}
                >
                  {loadingLogin ? "Entrando…" : "Iniciar sesión"}
                </Button>
              </div>

              <div style={{ marginTop: 14, color: "#64748b", fontSize: 13 }}>
                Tip: si quieres usar el <b>super admin</b>, crea ese usuario en la DB (abajo te digo cómo).
              </div>
            </div>
          </div>

          <div style={styles.loginHero}>
            <div style={styles.heroInner}>
              <div style={{ fontWeight: 900, fontSize: 44, letterSpacing: -1 }}>
                Panel de documentos IMSS, <span style={{ color: "#4f46e5" }}>premium</span>.
              </div>
              <div style={{ marginTop: 12, color: "#64748b", fontSize: 16, lineHeight: 1.6 }}>
                Consulta, controla créditos, revisa logs y descarga PDFs con un flujo limpio para tu equipo.
              </div>

              <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={styles.heroBox}>
                  <div style={styles.heroBoxTitle}>✅ Descargas con estado</div>
                  <div style={styles.heroBoxText}>Botón PDF / Descargar y loading por archivo.</div>
                </div>
                <div style={styles.heroBox}>
                  <div style={styles.heroBoxTitle}>🧩 Admin / Superadmin</div>
                  <div style={styles.heroBoxText}>Listo para crecer a multi-admin por scopes.</div>
                </div>
                <div style={styles.heroBox}>
                  <div style={styles.heroBoxTitle}>🔎 Filtros de logs</div>
                  <div style={styles.heroBoxText}>Tipo, rango rápido y búsqueda por email.</div>
                </div>
                <div style={styles.heroBox}>
                  <div style={styles.heroBoxTitle}>🧼 UI limpia</div>
                  <div style={styles.heroBoxText}>Sin mostrar URL del backend ni detalles sensibles.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  /* ===========================
     Main layout
  ============================ */
  const menu = [
    { id: "consultar", label: "CONSULTAR", icon: <Icon name="search" />, adminOnly: false },
    { id: "dashboard", label: "Dashboard", icon: <Icon name="dashboard" />, adminOnly: true },
    { id: "users", label: "Usuarios", icon: <Icon name="users" />, adminOnly: true },
    { id: "logs", label: "Logs de consultas", icon: <Icon name="file" />, adminOnly: true },
    { id: "creditlogs", label: "Logs de créditos", icon: <Icon name="credit" />, adminOnly: true },
  ];

  const canSee = (m) => (!m.adminOnly ? true : isAdmin);

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.brandRow}>
            <div style={styles.brand}>
              <span style={{ fontWeight: 900 }}>Docu</span>
              <span style={{ fontWeight: 900, color: "#4f46e5" }}>Express</span>
            </div>
            <Pill tone="purple">SaaS</Pill>
          </div>

          <div style={styles.sessionCard}>
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>Sesión</div>
            <div style={{ fontWeight: 900 }}>{me.email}</div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Pill tone={isSuper ? "purple" : "blue"}>{isSuper ? "Superadmin" : me.role}</Pill>
              <Pill tone="blue">{Number(me.credits ?? 0)} créditos</Pill>
            </div>

            <div style={{ marginTop: 12 }}>
              <Button variant="soft" onClick={logout} leftIcon={<Icon name="logout" />} style={{ width: "100%" }}>
                Cerrar sesión
              </Button>
            </div>
          </div>

          <div style={{ marginTop: 14, color: "#64748b", fontWeight: 800, fontSize: 12 }}>Menú</div>

          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {menu.filter(canSee).map((m) => {
              const active = view === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setView(m.id);
                    if (m.id === "consultar") {
                      setConsultStep("cards");
                      setFiles([]);
                    }
                  }}
                  style={{
                    ...styles.menuBtn,
                    ...(active ? styles.menuBtnActive : {}),
                  }}
                >
                  <span style={{ display: "inline-flex", marginRight: 10 }}>{m.icon}</span>
                  <span style={{ fontWeight: 900 }}>{m.label}</span>
                  <span style={styles.menuDot} />
                </button>
              );
            })}
          </div>

          {isAdmin ? (
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <Button variant="soft" onClick={openCreateUser} leftIcon={<Icon name="plus" />}>
                Crear usuario
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (view === "users") refreshUsers();
                  if (view === "logs") refreshLogs();
                  if (view === "creditlogs") refreshCreditLogs();
                  if (view === "dashboard") {
                    refreshUsers();
                    refreshLogs();
                  }
                }}
                leftIcon={<Icon name="refresh" />}
              >
                Actualizar
              </Button>
            </div>
          ) : null}
        </aside>

        {/* Content */}
        <main style={styles.main}>
          {/* Top bar */}
          <div style={styles.topBar}>
            <div>
              <div style={styles.breadcrumb}>DocuExpress</div>
              <div style={styles.pageTitle}>
                {view === "consultar"
                  ? "Consultar"
                  : view === "dashboard"
                  ? "Dashboard"
                  : view === "users"
                  ? "Usuarios"
                  : view === "logs"
                  ? "Logs de consultas"
                  : "Logs de créditos"}
              </div>
              <div style={styles.pageSub}>
                {view === "consultar"
                  ? "Genera documentos del IMSS. Los PDFs se guardan por 24 horas y se descargan desde tu panel."
                  : view === "dashboard"
                  ? "Resumen rápido de tu operación."
                  : view === "users"
                  ? "Gestiona usuarios, resetea password y asigna créditos."
                  : view === "logs"
                  ? "Filtra por tipo, rango y email."
                  : "Historial de otorgamientos y ajustes de créditos."}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Pill tone="purple">PDFs duran 24h</Pill>
            </div>
          </div>

          {/* Views */}
          {view === "consultar" && (
            <Card
              title="CONSULTAR"
              subtitle="Elige el trámite, captura datos y genera el PDF."
              right={<Pill tone="purple">PDFs duran 24h</Pill>}
            >
              {consultStep === "cards" ? (
                <div style={styles.grid2}>
                  <div style={styles.optionCard} onClick={() => { setType("semanas"); setConsultStep("form"); }}>
                    <div style={styles.optionTitle}>Semanas cotizadas</div>
                    <div style={styles.optionSub}>Constancia de semanas cotizadas en el IMSS.</div>
                    <div style={{ marginTop: 10 }}><Pill>CURP + NSS</Pill></div>
                  </div>

                  <div style={styles.optionCard} onClick={() => { setType("nss"); setConsultStep("form"); }}>
                    <div style={styles.optionTitle}>Asignación / Localización NSS</div>
                    <div style={styles.optionSub}>Genera documentos de NSS (puede devolver 2 PDFs).</div>
                    <div style={{ marginTop: 10 }}><Pill>Solo CURP · 2 PDFs</Pill></div>
                  </div>

                  <div style={styles.optionCard} onClick={() => { setType("vigencia"); setConsultStep("form"); }}>
                    <div style={styles.optionTitle}>Vigencia de derechos</div>
                    <div style={styles.optionSub}>Constancia de vigencia de derechos.</div>
                    <div style={{ marginTop: 10 }}><Pill>CURP + NSS</Pill></div>
                  </div>

                  <div style={styles.optionCard} onClick={() => { setType("noderecho"); setConsultStep("form"); }}>
                    <div style={styles.optionTitle}>No derechohabiencia</div>
                    <div style={styles.optionSub}>Constancia de no derecho al servicio médico.</div>
                    <div style={{ marginTop: 10 }}><Pill>Solo CURP</Pill></div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: "#64748b", fontWeight: 700 }}>
                      Trámite:{" "}
                      <span style={{ color: "#0f172a" }}>
                        {type === "semanas"
                          ? "Semanas cotizadas"
                          : type === "nss"
                          ? "Asignación / Localización NSS"
                          : type === "vigencia"
                          ? "Vigencia de derechos"
                          : "No derechohabiencia"}
                      </span>
                      <span style={{ marginLeft: 10 }}>
                        <Pill tone="blue">{requirements.hint}</Pill>
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setConsultStep("cards");
                        setFiles([]);
                        setCurp("");
                        setNss("");
                      }}
                    >
                      ← Atrás
                    </Button>
                  </div>

                  <div style={styles.formRow}>
                    <Input
                      label="CURP"
                      value={curp}
                      onChange={(e) => setCurp(e.target.value.toUpperCase())}
                      placeholder="Ej: GUCJ030206HPLRRVA1"
                    />
                    <Input
                      label={requirements.nss ? "NSS (obligatorio)" : "NSS (opcional)"}
                      value={nss}
                      onChange={(e) => setNss(e.target.value)}
                      placeholder={requirements.nss ? "11 dígitos" : "11 dígitos (si aplica)"}
                    />
                  </div>

                  <div style={styles.formRow}>
                    <Button variant="soft" onClick={onPaste} leftIcon={<span style={{ fontSize: 16 }}>📋</span>}>
                      Pegar CURP/NSS
                    </Button>

                    <Button
                      variant="primary"
                      onClick={generate}
                      disabled={loadingGenerate}
                      leftIcon={loadingGenerate ? <span style={styles.spinner} /> : <Icon name="file" />}
                      style={{ justifyContent: "center" }}
                    >
                      {loadingGenerate ? "Generando…" : "Generar documento"}
                    </Button>
                  </div>

                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    Aquí aparecerán los PDFs para descargar cuando generes un documento.
                  </div>

                  {/* Files */}
                  {files?.length ? (
                    <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
                      {files.map((f) => {
                        const label = fileLabelFromType(type);
                        // ✅ nombre “bonito” sugerido (frontend): TIPO_CURP.pdf
                        // (Para quitar “principal” real, eso se hace en backend al crear el filename)
                        const niceName = `${label}_${String(curp || "").trim().toUpperCase()}.pdf`;

                        return (
                          <div key={f.fileId} style={styles.fileRow}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={styles.fileIcon}>PDF</div>
                              <div>
                                <div style={{ fontWeight: 900, color: "#0f172a" }}>
                                  {clampStr(f.filename || niceName, 70)}
                                </div>
                                <div style={{ fontSize: 12, color: "#64748b" }}>
                                  {f.expiresAt ? `Expira: ${new Date(f.expiresAt).toISOString()}` : "Disponible para descargar"}
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="soft"
                              onClick={() => download(f.fileId, niceName)}
                              disabled={!!downloading[f.fileId]}
                              leftIcon={downloading[f.fileId] ? <span style={styles.spinner} /> : <Icon name="download" />}
                            >
                              {downloading[f.fileId] ? "Descargando…" : "Descargar"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          )}

          {view === "dashboard" && isAdmin && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 14 }}>
                <StatCard title="Usuarios" value={dashboardStats.totalUsers || "—"} icon={<Icon name="users" />} />
                <StatCard title="Créditos totales" value={dashboardStats.totalCredits || "—"} icon={<Icon name="credit" />} />
                <StatCard title="Consultas 24h" value={dashboardStats.logs24Count || "—"} icon={<Icon name="file" />} />
                <StatCard title="Rol" value={isSuper ? "Superadmin" : "Admin"} icon={<Icon name="dashboard" />} />
              </div>

              <Card
                title="Top trámites (24h)"
                subtitle="Los trámites más utilizados en las últimas 24 horas."
                right={
                  <Button
                    variant="soft"
                    onClick={() => {
                      refreshUsers();
                      refreshLogs();
                    }}
                    leftIcon={<Icon name="refresh" />}
                  >
                    Actualizar
                  </Button>
                }
              >
                {dashboardStats.top?.length ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    {dashboardStats.top.map(([t, c]) => (
                      <div key={t} style={styles.topRow}>
                        <div style={{ fontWeight: 900 }}>{t}</div>
                        <Pill tone="blue">{c}</Pill>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#64748b" }}>Sin datos aún (haz algunas consultas).</div>
                )}
              </Card>
            </div>
          )}

          {view === "users" && isAdmin && (
            <Card
              title="Usuarios"
              subtitle={isSuper ? "Como superadmin puedes ver todo." : "Como admin solo ves tus usuarios (si backend está scoping)."}
              right={
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar email…"
                    right={<Icon name="search" />}
                  />
                  <Button variant="ghost" onClick={refreshUsers} leftIcon={<Icon name="refresh" />} disabled={loadingUsers}>
                    {loadingUsers ? "…" : ""}
                  </Button>
                  <Button variant="primary" onClick={openCreateUser} leftIcon={<Icon name="plus" />}>
                    Crear
                  </Button>
                </div>
              }
            >
              {loadingUsers ? (
                <div style={{ color: "#64748b" }}>Cargando…</div>
              ) : filteredUsers?.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {filteredUsers.map((u) => (
                    <div key={u.id} style={styles.userRow}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{u.email}</div>
                        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Pill tone={u.role === "admin" ? "purple" : "blue"}>{u.role}</Pill>
                          <Pill tone={u.disabled ? "red" : "green"}>{u.disabled ? "Deshabilitado" : "Activo"}</Pill>
                          <Pill>Créditos: {u.credits ?? 0}</Pill>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <Button variant="soft" onClick={() => openCredits(u)} leftIcon={<Icon name="credit" />}>
                          Créditos
                        </Button>
                        <Button variant="soft" onClick={() => resetPassword(u.id)} leftIcon={<Icon name="key" />}>
                          Reset
                        </Button>
                        <Button
                          variant={u.disabled ? "soft" : "danger"}
                          onClick={() => toggleDisable(u)}
                        >
                          {u.disabled ? "Habilitar" : "Deshabilitar"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#64748b" }}>Sin usuarios.</div>
              )}
            </Card>
          )}

          {view === "logs" && isAdmin && (
            <Card
              title="Consultas"
              subtitle="Logs globales (con scope por rol)."
              right={
                <div style={{ display: "flex", gap: 10 }}>
                  <Button variant="soft" onClick={refreshLogs} leftIcon={<Icon name="refresh" />} disabled={loadingLogs}>
                    Refrescar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setLogType("all");
                      setLogRange("7");
                      setLogEmail("");
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              }
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Select
                  label="Tipo"
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  options={[
                    { value: "all", label: "Todos" },
                    { value: "semanas", label: "semanas" },
                    { value: "nss", label: "nss" },
                    { value: "vigencia", label: "vigencia" },
                    { value: "noderecho", label: "noderecho" },
                  ]}
                />
                <Select
                  label="Rango rápido"
                  value={logRange}
                  onChange={(e) => setLogRange(e.target.value)}
                  options={[
                    { value: "1", label: "Últimas 24h" },
                    { value: "7", label: "Últimos 7 días" },
                    { value: "30", label: "Últimos 30 días" },
                  ]}
                />
                <Input
                  label="Buscar por email"
                  value={logEmail}
                  onChange={(e) => setLogEmail(e.target.value)}
                  placeholder="correo@…"
                />
              </div>

              <div style={{ marginTop: 14 }}>
                {loadingLogs ? (
                  <div style={{ color: "#64748b" }}>Cargando…</div>
                ) : filteredLogs.length ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    {filteredLogs.slice(0, 50).map((l) => (
                      <div key={l.id || l.createdAt || Math.random()} style={styles.logRow}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 900 }}>{l.email || l.userEmail || "—"}</div>
                          <div style={{ color: "#64748b", fontSize: 12 }}>
                            {l.createdAt ? new Date(l.createdAt).toISOString() : nowISO()}
                          </div>
                        </div>

                        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Pill>{l.type || "—"}</Pill>
                          {l.curp ? <Pill tone="blue">{l.curp}</Pill> : null}
                          {l.nss ? <Pill>{l.nss}</Pill> : null}
                          {l.filesCount ? <Pill tone="green">{l.filesCount} PDF(s)</Pill> : null}
                        </div>

                        {/* Archivos del log */}
                        {Array.isArray(l.files) && l.files.length ? (
                          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                            {l.files.map((f) => {
                              const pretty = `${fileLabelFromType(l.type)}_${String(l.curp || "").toUpperCase()}.pdf`;
                              return (
                                <div key={f.fileId || f.filename} style={styles.fileRow}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={styles.fileIcon}>PDF</div>
                                    <div style={{ fontWeight: 800 }}>{clampStr(f.filename || pretty, 80)}</div>
                                  </div>
                                  <Button
                                    variant="soft"
                                    onClick={() => download(f.fileId, pretty)}
                                    disabled={!!downloading[f.fileId]}
                                    leftIcon={downloading[f.fileId] ? <span style={styles.spinner} /> : <Icon name="download" />}
                                  >
                                    {downloading[f.fileId] ? "…" : "Descargar"}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
                          * Si ya pasó 24h, el backend puede haberlo borrado.
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#64748b" }}>Sin logs para esos filtros.</div>
                )}
              </div>
            </Card>
          )}

          {view === "creditlogs" && isAdmin && (
            <Card
              title="Créditos"
              subtitle="Registros de cambios de créditos."
              right={
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Input
                    value={creditEmail}
                    onChange={(e) => setCreditEmail(e.target.value)}
                    placeholder="Filtrar por email…"
                    right={<Icon name="search" />}
                  />
                  <Button variant="ghost" onClick={refreshCreditLogs} leftIcon={<Icon name="refresh" />} disabled={loadingCreditLogs}>
                    {loadingCreditLogs ? "…" : ""}
                  </Button>
                </div>
              }
            >
              {loadingCreditLogs ? (
                <div style={{ color: "#64748b" }}>Cargando…</div>
              ) : filteredCreditLogs?.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {filteredCreditLogs.slice(0, 60).map((l) => (
                    <div key={l.id} style={styles.creditRow}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ fontWeight: 900 }}>{l.userEmail}</div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>
                          {l.createdAt ? new Date(l.createdAt).toISOString() : nowISO()}
                        </div>
                      </div>

                      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Pill tone="purple">Admin: {l.adminEmail}</Pill>
                        <Pill tone={Number(l.delta) >= 0 ? "green" : "red"}>{Number(l.delta) >= 0 ? `+${l.delta}` : l.delta}</Pill>
                        <Pill>Antes: {l.before}</Pill>
                        <Pill>Después: {l.after}</Pill>
                        {l.note ? <Pill>{clampStr(l.note, 60)}</Pill> : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#64748b" }}>Sin logs de créditos.</div>
              )}
            </Card>
          )}

          {/* Modals */}
          {createOpen && (
            <div style={styles.modalBackdrop} onMouseDown={() => setCreateOpen(false)}>
              <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Crear usuario</div>
                <div style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
                  Crea usuario nuevo (admin o user).
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <Input
                    label="Email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="correo@…"
                  />
                  <Input
                    label="Password"
                    value={newUserPass}
                    onChange={(e) => setNewUserPass(e.target.value)}
                    placeholder="mínimo 6"
                    type="password"
                  />
                  <Select
                    label="Rol"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    options={[
                      { value: "user", label: "user" },
                      { value: "admin", label: "admin" },
                    ]}
                  />
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={createUser}
                    disabled={creatingUser || !newUserEmail || !newUserPass}
                    leftIcon={creatingUser ? <span style={styles.spinner} /> : <Icon name="plus" />}
                  >
                    {creatingUser ? "Creando…" : "Crear"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {creditsOpen && creditTarget && (
            <div style={styles.modalBackdrop} onMouseDown={() => setCreditsOpen(false)}>
              <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Asignar créditos</div>
                <div style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
                  Usuario: <b>{creditTarget.email}</b>
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <Input
                    label="Cantidad (entero, puede ser negativo)"
                    value={String(creditAmount)}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Ej: 10 / -10"
                  />
                  <Input
                    label="Nota (opcional)"
                    value={creditNote}
                    onChange={(e) => setCreditNote(e.target.value)}
                    placeholder="Ej: Recarga semanal"
                  />
                </div>

                <div style={{ marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <Button variant="ghost" onClick={() => setCreditsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={grantCredits}
                    disabled={savingCredits}
                    leftIcon={savingCredits ? <span style={styles.spinner} /> : <Icon name="credit" />}
                  >
                    {savingCredits ? "Guardando…" : "Guardar"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

/* ===========================
   Styles (premium, clean)
=========================== */
const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(1200px 500px at 55% 0%, rgba(79,70,229,.10), transparent 60%) #f6f8fc",
    color: "#0f172a",
  },
  shell: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: 18,
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 16,
  },

  /* Login */
  sidebarLogin: {
    background: "rgba(255,255,255,.70)",
    border: "1px solid rgba(2,6,23,.06)",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 20px 40px rgba(2,6,23,.06)",
    backdropFilter: "blur(8px)",
  },
  loginCard: {
    marginTop: 14,
    background: "white",
    borderRadius: 18,
    padding: 18,
    border: "1px solid rgba(2,6,23,.06)",
  },
  loginHero: {
    background: "white",
    borderRadius: 22,
    border: "1px solid rgba(2,6,23,.06)",
    boxShadow: "0 20px 40px rgba(2,6,23,.06)",
    overflow: "hidden",
  },
  heroInner: { padding: 28 },
  heroBox: {
    border: "1px solid rgba(2,6,23,.06)",
    borderRadius: 16,
    padding: 14,
    background: "rgba(248,250,252,.8)",
  },
  heroBoxTitle: { fontWeight: 900 },
  heroBoxText: { marginTop: 4, color: "#64748b", fontSize: 13 },

  /* Sidebar */
  sidebar: {
    background: "rgba(255,255,255,.75)",
    border: "1px solid rgba(2,6,23,.06)",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 20px 40px rgba(2,6,23,.06)",
    backdropFilter: "blur(8px)",
    height: "calc(100vh - 36px)",
    position: "sticky",
    top: 18,
    alignSelf: "start",
    overflow: "auto",
  },
  brandRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: { fontSize: 24, letterSpacing: -0.5 },
  sessionCard: {
    marginTop: 14,
    background: "white",
    borderRadius: 18,
    padding: 16,
    border: "1px solid rgba(2,6,23,.06)",
  },
  menuBtn: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(2,6,23,.06)",
    background: "white",
    padding: "12px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    transition: "transform .06s ease, box-shadow .12s ease",
  },
  menuBtnActive: {
    background: "linear-gradient(135deg, rgba(79,70,229,.92), rgba(99,102,241,.92))",
    color: "white",
    borderColor: "rgba(79,70,229,.35)",
    boxShadow: "0 12px 30px rgba(79,70,229,.25)",
  },
  menuDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    background: "rgba(15,23,42,.22)",
  },

  /* Main */
  main: { padding: 4 },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    padding: "10px 6px 6px 6px",
  },
  breadcrumb: { color: "#64748b", fontWeight: 700, fontSize: 13 },
  pageTitle: { fontSize: 40, fontWeight: 950, letterSpacing: -1.2, marginTop: 2 },
  pageSub: { color: "#64748b", marginTop: 6, lineHeight: 1.5 },

  /* Cards */
  card: {
    marginTop: 14,
    background: "white",
    borderRadius: 20,
    border: "1px solid rgba(2,6,23,.06)",
    boxShadow: "0 20px 40px rgba(2,6,23,.06)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px solid rgba(2,6,23,.06)",
    background: "linear-gradient(180deg, rgba(248,250,252,.9), white)",
  },
  cardTitle: { fontWeight: 950, fontSize: 16 },
  cardSub: { color: "#64748b", marginTop: 4, fontSize: 13 },
  cardBody: { padding: 18 },

  statCard: {
    background: "white",
    borderRadius: 18,
    border: "1px solid rgba(2,6,23,.06)",
    boxShadow: "0 16px 34px rgba(2,6,23,.05)",
    padding: 16,
  },
  statTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statTitle: { color: "#64748b", fontWeight: 800, fontSize: 12 },
  statIcon: { opacity: 0.8 },
  statValue: { marginTop: 8, fontWeight: 950, fontSize: 26, letterSpacing: -0.5 },

  /* Form */
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  optionCard: {
    borderRadius: 18,
    border: "1px solid rgba(2,6,23,.06)",
    background: "rgba(248,250,252,.9)",
    padding: 16,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(2,6,23,.04)",
    transition: "transform .08s ease, box-shadow .14s ease",
  },
  optionTitle: { fontWeight: 950, fontSize: 16 },
  optionSub: { color: "#64748b", marginTop: 6, fontSize: 13, lineHeight: 1.4 },

  /* Inputs */
  label: { fontWeight: 900, fontSize: 12, color: "#0f172a", marginBottom: 6 },
  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    borderRadius: 14,
    border: "1px solid rgba(2,6,23,.10)",
    background: "white",
    boxShadow: "0 10px 22px rgba(2,6,23,.04)",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "none",
    outline: "none",
    borderRadius: 14,
    fontSize: 14,
  },
  inputRight: { paddingRight: 12, color: "#64748b", display: "flex", alignItems: "center" },
  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(2,6,23,.10)",
    background: "white",
    outline: "none",
    fontSize: 14,
    boxShadow: "0 10px 22px rgba(2,6,23,.04)",
  },

  /* Buttons */
  btnPrimary: {
    border: "none",
    borderRadius: 14,
    padding: "12px 14px",
    cursor: "pointer",
    background: "linear-gradient(135deg, rgba(79,70,229,.95), rgba(99,102,241,.95))",
    color: "white",
    fontWeight: 950,
    boxShadow: "0 16px 34px rgba(79,70,229,.25)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 44,
  },
  btnSoft: {
    border: "1px solid rgba(2,6,23,.08)",
    borderRadius: 14,
    padding: "12px 14px",
    cursor: "pointer",
    background: "rgba(248,250,252,.9)",
    color: "#0f172a",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    minHeight: 44,
  },
  btnGhost: {
    border: "1px solid rgba(2,6,23,.08)",
    borderRadius: 14,
    padding: "12px 14px",
    cursor: "pointer",
    background: "white",
    color: "#0f172a",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    minHeight: 44,
  },
  btnDanger: {
    border: "1px solid rgba(220,38,38,.25)",
    borderRadius: 14,
    padding: "12px 14px",
    cursor: "pointer",
    background: "rgba(220,38,38,.06)",
    color: "#991b1b",
    fontWeight: 950,
    display: "inline-flex",
    alignItems: "center",
    minHeight: 44,
  },

  /* Small */
  pill: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(2,6,23,.08)",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 800,
  },

  /* Rows */
  fileRow: {
    borderRadius: 16,
    border: "1px solid rgba(2,6,23,.06)",
    background: "rgba(248,250,252,.9)",
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  fileIcon: {
    width: 44,
    height: 34,
    borderRadius: 12,
    background: "rgba(79,70,229,.10)",
    border: "1px solid rgba(79,70,229,.18)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    color: "#3730a3",
  },
  userRow: {
    borderRadius: 16,
    border: "1px solid rgba(2,6,23,.06)",
    background: "rgba(248,250,252,.9)",
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  logRow: {
    borderRadius: 18,
    border: "1px solid rgba(2,6,23,.06)",
    background: "white",
    padding: 14,
    boxShadow: "0 14px 30px rgba(2,6,23,.05)",
  },
  creditRow: {
    borderRadius: 18,
    border: "1px solid rgba(2,6,23,.06)",
    background: "white",
    padding: 14,
    boxShadow: "0 14px 30px rgba(2,6,23,.05)",
  },
  topRow: {
    borderRadius: 14,
    border: "1px solid rgba(2,6,23,.06)",
    background: "rgba(248,250,252,.9)",
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  /* Toast */
  toastWrap: { position: "fixed", bottom: 18, right: 18, zIndex: 9999 },
  toast: {
    width: 420,
    background: "white",
    borderRadius: 18,
    border: "1px solid rgba(2,6,23,.08)",
    borderLeft: "6px solid #4f46e5",
    boxShadow: "0 24px 54px rgba(2,6,23,.15)",
    padding: 14,
  },
  toastHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  toastBody: { marginTop: 6, color: "#334155", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-wrap" },
  toastClose: {
    border: "1px solid rgba(2,6,23,.10)",
    background: "rgba(248,250,252,.9)",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 900,
  },

  /* Modal */
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 9998,
  },
  modal: {
    width: 520,
    maxWidth: "100%",
    background: "white",
    borderRadius: 18,
    border: "1px solid rgba(2,6,23,.08)",
    boxShadow: "0 30px 80px rgba(2,6,23,.35)",
    padding: 16,
  },

  /* Spinner */
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 99,
    border: "2px solid rgba(255,255,255,.45)",
    borderTopColor: "white",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },
};

// Inject keyframes for spinner
if (typeof document !== "undefined" && !document.getElementById("dx-spin-style")) {
  const style = document.createElement("style");
  style.id = "dx-spin-style";
  style.innerHTML = `@keyframes spin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);
}
