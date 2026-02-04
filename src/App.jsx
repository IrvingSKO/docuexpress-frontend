import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * =========================================================
 *  CONFIG
 * =========================================================
 */
const BACKEND_URL =
  (import.meta?.env?.VITE_BACKEND_URL &&
    String(import.meta.env.VITE_BACKEND_URL).trim()) ||
  "https://docuexpress.onrender.com";

const SUPER_ADMIN_EMAIL = "irvingestray@gmail.com";

/**
 * =========================================================
 *  UI HELPERS (estilo “premium” sin CSS externo)
 * =========================================================
 */
const ui = {
  bg: "#F6F8FC",
  card: "#FFFFFF",
  text: "#0F172A",
  mut: "#64748B",
  border: "#E6EAF2",
  primary: "#4F46E5",
  primary2: "#7C3AED",
  danger: "#DC2626",
  success: "#16A34A",
  shadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
  shadow2: "0 10px 25px rgba(15, 23, 42, 0.08)",
  radius: 18,
};

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Icon({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        width: 18,
        height: 18,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
      }}
    >
      {children}
    </span>
  );
}

function Pill({ color = "gray", children }) {
  const map = {
    gray: { bg: "#F1F5F9", fg: "#0F172A", bd: "#E2E8F0" },
    blue: { bg: "#EEF2FF", fg: "#3730A3", bd: "#DDE3FF" },
    green: { bg: "#ECFDF5", fg: "#065F46", bd: "#C7F9DD" },
    red: { bg: "#FEF2F2", fg: "#991B1B", bd: "#FECACA" },
    purple: { bg: "#F5F3FF", fg: "#5B21B6", bd: "#E9D5FF" },
  }[color];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 999,
        border: `1px solid ${map.bd}`,
        background: map.bg,
        color: map.fg,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: "16px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  title,
  type = "button",
}) {
  const base = {
    height: 44,
    padding: "0 16px",
    borderRadius: 14,
    border: `1px solid ${ui.border}`,
    background: ui.card,
    color: ui.text,
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.65 : 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    userSelect: "none",
    transition: "transform .06s ease, box-shadow .15s ease",
    boxShadow: "0 1px 0 rgba(15,23,42,.04)",
  };

  const variants = {
    primary: {
      background: `linear-gradient(90deg, ${ui.primary}, ${ui.primary2})`,
      color: "#fff",
      border: "none",
      boxShadow: "0 18px 38px rgba(79,70,229,.18)",
    },
    ghost: {
      background: "#fff",
      border: `1px solid ${ui.border}`,
      color: ui.text,
    },
    danger: {
      background: ui.danger,
      color: "#fff",
      border: "none",
      boxShadow: "0 18px 38px rgba(220,38,38,.14)",
    },
    soft: {
      background: "#EEF2FF",
      color: "#3730A3",
      border: "1px solid #DDE3FF",
    },
  };

  return (
    <button
      type={type}
      title={title}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...base,
        ...variants[variant],
        ...style,
      }}
      onMouseDown={(e) => {
        // evita “focus jumping” en algunos browsers cuando hay rerenders
        e.currentTarget.style.transform = "scale(0.99)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {loading ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,.45)",
              borderTopColor: "#fff",
              display: "inline-block",
              animation: "spin .8s linear infinite",
            }}
          />
          Procesando…
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function Input({ label, hint, ...props }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {label && (
        <div style={{ fontSize: 12, fontWeight: 900, color: ui.text }}>
          {label}
        </div>
      )}
      <input
        {...props}
        style={{
          height: 46,
          borderRadius: 14,
          border: `1px solid ${ui.border}`,
          background: "#fff",
          padding: "0 14px",
          outline: "none",
          fontSize: 14,
          fontWeight: 700,
          color: ui.text,
          boxShadow: "0 1px 0 rgba(15,23,42,.02)",
          ...(props.style || {}),
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#CBD5E1";
          e.currentTarget.style.boxShadow = "0 0 0 4px rgba(79,70,229,.10)";
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = ui.border;
          e.currentTarget.style.boxShadow = "0 1px 0 rgba(15,23,42,.02)";
          props.onBlur?.(e);
        }}
      />
      {hint && (
        <div style={{ fontSize: 12, color: ui.mut, marginTop: -4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: ui.card,
        border: `1px solid ${ui.border}`,
        borderRadius: ui.radius,
        boxShadow: ui.shadow2,
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
        padding: "18px 18px",
        borderBottom: `1px solid ${ui.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 1000, color: ui.text }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: ui.mut }}>{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}

/**
 * =========================================================
 *  TOAST
 * =========================================================
 */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const colors = {
    success: ui.success,
    error: ui.danger,
    info: ui.primary,
  };
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}>
      <div
        style={{
          background: "#fff",
          borderLeft: `6px solid ${colors[toast.type] || ui.primary}`,
          padding: 14,
          borderRadius: 16,
          width: 420,
          boxShadow: ui.shadow,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 1000, color: ui.text }}>{toast.title}</div>
            <div style={{ fontSize: 13, marginTop: 6, color: ui.mut, whiteSpace: "pre-wrap" }}>
              {toast.message}
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} style={{ height: 40 }}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * =========================================================
 *  API HELPERS
 * =========================================================
 */
function stripTags(s) {
  return String(s || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeErrorMessage(maybeHtmlOrJson) {
  const raw = String(maybeHtmlOrJson || "").trim();
  if (!raw) return "Ocurrió un error.";
  const clean = stripTags(raw);
  const short = clean.length > 240 ? clean.slice(0, 240) + "…" : clean;

  // Incapsula / WAF típicos
  if (/incapsula/i.test(raw) || /request unsuccessful/i.test(raw)) {
    return "El proveedor externo bloqueó la solicitud (Incapsula/WAF). Intenta con otro CURP/NSS, espera unos minutos o vuelve a intentar.";
  }
  if (/not found/i.test(raw) && /<!doctype html/i.test(raw)) {
    return "Ruta no encontrada. Revisa que el BACKEND_URL esté correcto.";
  }
  return short;
}

async function safeJson(res) {
  const t = await res.text();
  // intenta JSON
  try {
    return JSON.parse(t);
  } catch {
    // texto/HTML
    return { message: t };
  }
}

async function authFetch(url, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(opts.headers || {}),
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(`${BACKEND_URL}${url}`, { ...opts, headers });
}

/**
 * =========================================================
 *  DOMAIN HELPERS
 * =========================================================
 */
const DOC_TYPES = [
  {
    key: "semanas",
    title: "Semanas cotizadas",
    desc: "Constancia de semanas cotizadas en el IMSS.",
    pill: "CURP + NSS",
    needCurp: true,
    needNss: true,
  },
  {
    key: "nss",
    title: "Asignación / Localización NSS",
    desc: "Genera documentos de NSS (puede devolver 2 PDFs).",
    pill: "Solo CURP • 2 PDFs",
    needCurp: true,
    needNss: false, // opcional
  },
  {
    key: "vigencia",
    title: "Vigencia de derechos",
    desc: "Constancia de vigencia de derechos.",
    pill: "CURP + NSS",
    needCurp: true,
    needNss: true,
  },
  {
    key: "noderecho",
    title: "No derechohabiencia",
    desc: "Constancia de no derecho al servicio médico.",
    pill: "Solo CURP (según proveedor)",
    needCurp: true,
    needNss: false,
  },
];

function typeLabel(t) {
  const m = {
    semanas: "Semanas",
    nss: "NSS",
    vigencia: "Vigencia",
    noderecho: "NoDerecho",
  };
  return m[t] || "Documento";
}

function buildNiceFilename({ type, curp, index = 0, ext = "pdf" }) {
  const base = `${typeLabel(type)}_${String(curp || "SIN_CURP").toUpperCase()}`;
  const suffix = index > 0 ? `_${index + 1}` : "";
  return `${base}${suffix}.${ext}`;
}

/**
 * =========================================================
 *  APP
 * =========================================================
 */
export default function App() {
  const [toast, setToast] = useState(null);
  const showToast = (t) => setToast(t);

  const [me, setMe] = useState(null);
  const isLogged = !!me;
  const isAdmin = me?.role === "admin";
  const isSuper = me?.email === SUPER_ADMIN_EMAIL;

  // vistas
  const [view, setView] = useState("consultar"); // consultar | dashboard | users | logs | creditlogs

  // login
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // data admin
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [creditLogs, setCreditLogs] = useState([]);

  // consultar
  const [step, setStep] = useState("cards"); // cards | form
  const [type, setType] = useState("semanas");
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [files, setFiles] = useState([]);
  const [generateLoading, setGenerateLoading] = useState(false);

  // descargas con estado
  const [downloading, setDownloading] = useState({}); // { [fileId]: true }

  // filtros logs
  const [logType, setLogType] = useState("todos");
  const [logRange, setLogRange] = useState("7d"); // 24h | 7d | 30d | all
  const [logEmail, setLogEmail] = useState("");
  const [applyLogFiltersFlag, setApplyLogFiltersFlag] = useState(0);

  // users: crear usuario modal simple
  const [createOpen, setCreateOpen] = useState(false);
  const [newUEmail, setNewUEmail] = useState("");
  const [newUPass, setNewUPass] = useState("");
  const [newURole, setNewURole] = useState("user");
  const [createLoading, setCreateLoading] = useState(false);

  // credits modal simple
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsTarget, setCreditsTarget] = useState(null);
  const [creditsAmount, setCreditsAmount] = useState(10);
  const [creditsNote, setCreditsNote] = useState("");
  const [creditsLoading, setCreditsLoading] = useState(false);

  /**
   * =========================================================
   *  (PASO 1) CHECK ENV (esto ya va adentro del App)
   *  - Te avisa si VITE_BACKEND_URL está mal (undefined)
   * =========================================================
   */
  useEffect(() => {
    if (!BACKEND_URL || String(BACKEND_URL).includes("undefined")) {
      console.error("VITE_BACKEND_URL está mal:", BACKEND_URL);
      showToast({
        type: "error",
        title: "Config inválida",
        message:
          "Tu BACKEND_URL está mal (undefined). Revisa Vercel > Environment Variables: VITE_BACKEND_URL",
      });
    }
  }, []);

  /**
   * restore sesión
   */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedMe = localStorage.getItem("me");
    if (token && savedMe && !me) {
      try {
        setMe(JSON.parse(savedMe));
      } catch {}
    }
  }, []);

  /**
   * =========================================================
   *  AUTH
   * =========================================================
   */
  const onLogin = async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(email).trim(), password }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Login fallido",
          message: normalizeErrorMessage(data?.message || `HTTP ${res.status}`),
        });
        setLoginLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("me", JSON.stringify(data.user));
      setMe(data.user);

      showToast({
        type: "success",
        title: "Sesión iniciada",
        message: "Bienvenido 👋",
      });

      // por defecto entra a consultar
      setView("consultar");
      setStep("cards");
      setFiles([]);
    } catch (e) {
      showToast({
        type: "error",
        title: "Error de red",
        message: "No se pudo conectar al backend.",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("me");
    setMe(null);
    setUsers([]);
    setLogs([]);
    setCreditLogs([]);
    setFiles([]);
    setCurp("");
    setNss("");
    setPassword("");
    setView("consultar");
    setStep("cards");
    showToast({ type: "info", title: "Sesión cerrada", message: "Hasta luego." });
  };

  /**
   * =========================================================
   *  LOAD ADMIN DATA
   * =========================================================
   */
  const refreshAdmin = async () => {
    if (!isAdmin) return;

    try {
      const rUsers = await authFetch("/api/users");
      const dUsers = await safeJson(rUsers);
      const listUsers = Array.isArray(dUsers) ? dUsers : dUsers.users || dUsers.items || [];
      setUsers(listUsers);

      const rLogs = await authFetch("/api/logs");
      const dLogs = await safeJson(rLogs);
      const listLogs = Array.isArray(dLogs) ? dLogs : dLogs.logs || dLogs.items || [];
      setLogs(listLogs);

      const rCLogs = await authFetch("/api/creditlogs");
      const dCLogs = await safeJson(rCLogs);
      const listCLogs = Array.isArray(dCLogs) ? dCLogs : dCLogs.logs || dCLogs.items || [];
      setCreditLogs(listCLogs);
    } catch {
      showToast({
        type: "error",
        title: "Error",
        message: "No se pudieron cargar datos.",
      });
    }
  };

  useEffect(() => {
    if (isAdmin) refreshAdmin();
  }, [me]);

  /**
   * =========================================================
   *  USERS ACTIONS
   * =========================================================
   */
  const createUser = async () => {
    if (createLoading) return;
    setCreateLoading(true);
    try {
      const res = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({
          email: String(newUEmail).trim(),
          password: String(newUPass),
          role: newURole,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({
          type: "error",
          title: "No se pudo crear",
          message: normalizeErrorMessage(data?.message || `HTTP ${res.status}`),
        });
        setCreateLoading(false);
        return;
      }
      showToast({ type: "success", title: "Usuario creado", message: data?.user?.email || "" });
      setCreateOpen(false);
      setNewUEmail("");
      setNewUPass("");
      setNewURole("user");
      await refreshAdmin();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo crear usuario." });
    } finally {
      setCreateLoading(false);
    }
  };

  const resetPassword = async (id) => {
    try {
      const res = await authFetch(`/api/users/${id}/reset-password`, { method: "POST" });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "Error", message: normalizeErrorMessage(data?.message) });
        return;
      }
      showToast({
        type: "success",
        title: "Password reseteada",
        message: `Nueva contraseña: ${data.newPassword}`,
      });
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo resetear password." });
    }
  };

  const toggleDisabled = async (u) => {
    try {
      const res = await authFetch(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: !u.disabled }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "Error", message: normalizeErrorMessage(data?.message) });
        return;
      }
      showToast({ type: "success", title: "Actualizado", message: "" });
      await refreshAdmin();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudo actualizar." });
    }
  };

  const openCredits = (u) => {
    setCreditsTarget(u);
    setCreditsAmount(10);
    setCreditsNote("");
    setCreditsOpen(true);
  };

  const grantCredits = async () => {
    if (!creditsTarget) return;
    if (creditsLoading) return;
    setCreditsLoading(true);
    try {
      const res = await authFetch("/api/credits/grant", {
        method: "POST",
        body: JSON.stringify({
          userId: creditsTarget.id,
          amount: Number(creditsAmount),
          note: creditsNote,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({
          type: "error",
          title: "Error créditos",
          message: normalizeErrorMessage(data?.message || `HTTP ${res.status}`),
        });
        setCreditsLoading(false);
        return;
      }
      showToast({ type: "success", title: "Créditos actualizados", message: "" });
      setCreditsOpen(false);
      setCreditsTarget(null);
      await refreshAdmin();
    } catch {
      showToast({ type: "error", title: "Error", message: "No se pudieron asignar créditos." });
    } finally {
      setCreditsLoading(false);
    }
  };

  /**
   * =========================================================
   *  CONSULTAR
   * =========================================================
   */
  const currentDoc = useMemo(() => DOC_TYPES.find((d) => d.key === type), [type]);

  const pasteCurpNss = async () => {
    try {
      const t = await navigator.clipboard.readText();
      const clean = String(t || "").trim();
      // intenta detectar CURP y NSS en texto pegado
      const curpMatch = clean.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}/i);
      const nssMatch = clean.match(/\b\d{11}\b/);
      if (curpMatch) setCurp(curpMatch[0].toUpperCase());
      if (nssMatch) setNss(nssMatch[0]);
      showToast({ type: "success", title: "Pegado", message: "CURP/NSS detectado." });
    } catch {
      showToast({ type: "error", title: "No se pudo pegar", message: "Tu navegador bloqueó el clipboard." });
    }
  };

  const generate = async () => {
    if (generateLoading) return;

    const c = String(curp || "").trim().toUpperCase();
    const n = String(nss || "").trim();

    if (currentDoc?.needCurp && c.length < 10) {
      showToast({ type: "error", title: "Falta CURP", message: "Captura una CURP válida." });
      return;
    }
    if (currentDoc?.needNss && n.length !== 11) {
      showToast({ type: "error", title: "Falta NSS", message: "Captura NSS (11 dígitos)." });
      return;
    }

    setGenerateLoading(true);
    setFiles([]);

    try {
      const res = await authFetch("/api/imss", {
        method: "POST",
        body: JSON.stringify({
          type,
          curp: c,
          nss: n || undefined,
        }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Inconsistencia",
          message: normalizeErrorMessage(data?.message || `HTTP ${res.status}`),
        });
        setGenerateLoading(false);
        return;
      }

      setFiles(Array.isArray(data.files) ? data.files : []);
      showToast({ type: "success", title: "PDF listo", message: "Descarga disponible." });

      // refresca logs (admin) para que lo veas de inmediato
      if (isAdmin) {
        const rLogs = await authFetch("/api/logs");
        const dLogs = await safeJson(rLogs);
        const listLogs = Array.isArray(dLogs) ? dLogs : dLogs.logs || dLogs.items || [];
        setLogs(listLogs);
      }
    } catch {
      showToast({
        type: "error",
        title: "Error de red",
        message: "No se pudo conectar al backend.",
      });
    } finally {
      setGenerateLoading(false);
    }
  };

  const download = async (fileId, suggestedName) => {
    setDownloading((p) => ({ ...p, [fileId]: true }));
    try {
      const r = await fetch(`${BACKEND_URL}/api/download/${fileId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!r.ok) {
        const t = await r.text();
        showToast({
          type: "error",
          title: "No se pudo descargar",
          message: normalizeErrorMessage(t || `HTTP ${r.status}`),
        });
        return;
      }
      const b = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = suggestedName || `DocuExpress_${fileId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    } catch {
      showToast({ type: "error", title: "Error", message: "Fallo la descarga." });
    } finally {
      setDownloading((p) => {
        const copy = { ...p };
        delete copy[fileId];
        return copy;
      });
    }
  };

  /**
   * =========================================================
   *  LOGS FILTERING (frontend)
   * =========================================================
   */
  const filteredLogs = useMemo(() => {
    let list = Array.isArray(logs) ? [...logs] : [];

    // aplica filtros cuando presionas “Aplicar filtros”
    // (para que no filtre a cada tecleo si no quieres)
    // usamos applyLogFiltersFlag solo para “recalcular”
    // eslint-disable-next-line
    applyLogFiltersFlag;

    // type
    if (logType !== "todos") {
      list = list.filter((l) => String(l.type || "").toLowerCase() === logType);
    }

    // email
    if (String(logEmail || "").trim()) {
      const q = String(logEmail).trim().toLowerCase();
      list = list.filter((l) => String(l.email || "").toLowerCase().includes(q));
    }

    // rango
    const now = Date.now();
    const ms = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      all: Infinity,
    }[logRange];

    if (ms !== Infinity) {
      list = list.filter((l) => {
        const ts = new Date(l.createdAt || l.ts || l.date || 0).getTime();
        return Number.isFinite(ts) && now - ts <= ms;
      });
    }

    // newest first
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return list;
  }, [logs, applyLogFiltersFlag, logType, logEmail, logRange]);

  const dashboardStats = useMemo(() => {
    const uCount = users?.length || 0;
    const totalCredits = (users || []).reduce((s, u) => s + Number(u.credits || 0), 0);

    const last24h = (logs || []).filter((l) => {
      const ts = new Date(l.createdAt || 0).getTime();
      return Date.now() - ts <= 24 * 60 * 60 * 1000;
    });

    const top = {};
    for (const l of last24h) {
      const t = String(l.type || "otro").toLowerCase();
      top[t] = (top[t] || 0) + 1;
    }
    const topList = Object.entries(top)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { uCount, totalCredits, last24hCount: last24h.length, topList };
  }, [users, logs]);

  /**
   * =========================================================
   *  LAYOUT
   * =========================================================
   */
  const PageShell = ({ children }) => {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: ui.bg,
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 18,
          padding: 18,
        }}
      >
        {/* Sidebar */}
        <div style={{ position: "sticky", top: 18, alignSelf: "start" }}>
          <div
            style={{
              background: ui.card,
              border: `1px solid ${ui.border}`,
              borderRadius: ui.radius,
              boxShadow: ui.shadow2,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 24, fontWeight: 1000, color: ui.text }}>
                Docu<span style={{ color: ui.primary }}>Express</span>
              </div>
              <Pill color="gray">SaaS</Pill>
            </div>

            <div style={{ height: 14 }} />

            {!isLogged ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 1000, color: ui.text }}>
                  Iniciar sesión
                </div>
                <div style={{ height: 10 }} />
                <div style={{ display: "grid", gap: 12 }}>
                  <Input
                    placeholder="admin@docuexpress.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <Input
                    placeholder="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onLogin();
                    }}
                  />
                  <Button
                    variant="primary"
                    onClick={onLogin}
                    loading={loginLoading}
                    style={{ width: "100%" }}
                  >
                    Iniciar sesión
                  </Button>

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: `1px solid ${ui.border}`,
                      background: "#FBFCFF",
                      color: ui.mut,
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    <b style={{ color: ui.text }}>Demo:</b>
                    <br />
                    Admin: admin@docuexpress.com / Admin123!
                    <br />
                    Cliente: cliente@docuexpress.com / Cliente123!
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: ui.mut, fontWeight: 900 }}>
                  Sesión
                </div>
                <div style={{ fontSize: 15, fontWeight: 1000, color: ui.text }}>
                  {me.email}
                </div>
                <div style={{ height: 10 }} />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Pill color={isAdmin ? "blue" : "gray"}>{isAdmin ? "Admin" : "User"}</Pill>
                  <Pill color="blue">{Number(me.credits || 0)} créditos</Pill>
                  {isSuper && <Pill color="purple">Super</Pill>}
                </div>

                <div style={{ height: 14 }} />
                <Button variant="ghost" onClick={logout} style={{ width: "100%" }}>
                  Cerrar sesión
                </Button>
              </div>
            )}

            <div style={{ height: 16 }} />

            {/* Menú */}
            <div style={{ fontSize: 12, color: ui.mut, fontWeight: 1000 }}>Menú</div>
            <div style={{ height: 10 }} />

            <div style={{ display: "grid", gap: 10 }}>
              <SideBtn
                active={view === "consultar"}
                onClick={() => {
                  setView("consultar");
                  setStep("cards");
                }}
                icon="🔎"
                label="CONSULTAR"
              />
              {isAdmin && (
                <>
                  <SideBtn
                    active={view === "dashboard"}
                    onClick={() => setView("dashboard")}
                    icon="📊"
                    label="Dashboard"
                  />
                  <SideBtn
                    active={view === "users"}
                    onClick={() => setView("users")}
                    icon="👤"
                    label="Usuarios"
                  />
                  <SideBtn
                    active={view === "logs"}
                    onClick={() => setView("logs")}
                    icon="🧾"
                    label="Logs de consultas"
                  />
                  <SideBtn
                    active={view === "creditlogs"}
                    onClick={() => setView("creditlogs")}
                    icon="💳"
                    label="Logs de créditos"
                  />
                  <Button
                    variant="soft"
                    onClick={() => setCreateOpen(true)}
                    style={{ width: "100%", height: 46, justifyContent: "center" }}
                  >
                    <Icon>➕</Icon> Crear usuario
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={refreshAdmin}
                    style={{ width: "100%", height: 46, justifyContent: "center" }}
                  >
                    <Icon>🔄</Icon> Actualizar
                  </Button>
                </>
              )}
            </div>

            <div style={{ height: 14 }} />
            <div style={{ fontSize: 12, color: ui.mut }}>
              Backend:{" "}
              <span style={{ color: ui.text, fontWeight: 900 }}>{BACKEND_URL}</span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ padding: "4px 10px 40px 10px" }}>{children}</div>
      </div>
    );
  };

  function SideBtn({ active, onClick, icon, label }) {
    return (
      <button
        onClick={onClick}
        style={{
          height: 54,
          borderRadius: 16,
          border: `1px solid ${ui.border}`,
          background: active ? `linear-gradient(90deg, ${ui.primary}, ${ui.primary2})` : "#fff",
          color: active ? "#fff" : ui.text,
          fontWeight: 1000,
          cursor: "pointer",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: active ? "0 18px 38px rgba(79,70,229,.18)" : "0 1px 0 rgba(15,23,42,.04)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 24, textAlign: "center" }}>{icon}</span>
          {label}
        </span>
        <span style={{ opacity: active ? 1 : 0.35 }}>●</span>
      </button>
    );
  }

  /**
   * =========================================================
   *  MODALS (crear usuario / créditos)
   * =========================================================
   */
  const Modal = ({ open, title, children, onClose, width = 520 }) => {
    if (!open) return null;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,23,42,.35)",
          display: "grid",
          placeItems: "center",
          zIndex: 9999,
          padding: 18,
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: width,
            background: "#fff",
            borderRadius: 18,
            border: `1px solid ${ui.border}`,
            boxShadow: ui.shadow,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: `1px solid ${ui.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 1000 }}>{title}</div>
            <Button variant="ghost" onClick={onClose} style={{ height: 38 }}>
              Cerrar
            </Button>
          </div>
          <div style={{ padding: 16 }}>{children}</div>
        </div>
      </div>
    );
  };

  /**
   * =========================================================
   *  RENDER PAGES
   * =========================================================
   */
  const PageHeader = ({ kicker = "DocuExpress", title, subtitle, right }) => (
    <div style={{ padding: "10px 6px 18px 6px" }}>
      <div style={{ fontSize: 12, color: ui.mut, fontWeight: 900 }}>{kicker}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: -0.6, color: ui.text }}>
            {title}
          </div>
          {subtitle && <div style={{ marginTop: 8, color: ui.mut }}>{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );

  const ConsultarPage = () => {
    return (
      <div>
        <PageHeader
          title="Consultar"
          subtitle="Genera documentos del IMSS. Los PDFs se guardan por 24 horas y se descargan desde tu panel."
          right={<Pill color="blue">PDFs duran 24h</Pill>}
        />

        <Card>
          <CardHeader
            title="CONSULTAR"
            subtitle="Elige el trámite, captura datos y genera el PDF."
            right={<Pill color="blue">PDFs duran 24h</Pill>}
          />

          {step === "cards" ? (
            <div style={{ padding: 18 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                {DOC_TYPES.map((d) => (
                  <div
                    key={d.key}
                    onClick={() => {
                      setType(d.key);
                      setStep("form");
                      setFiles([]);
                      setCurp("");
                      setNss("");
                    }}
                    style={{
                      border: `1px solid ${ui.border}`,
                      borderRadius: 16,
                      padding: 16,
                      background: "#fff",
                      cursor: "pointer",
                      boxShadow: "0 1px 0 rgba(15,23,42,.04)",
                    }}
                  >
                    <div style={{ fontWeight: 1000, color: ui.text, fontSize: 15 }}>
                      {d.title}
                    </div>
                    <div style={{ color: ui.mut, fontSize: 13, marginTop: 6 }}>
                      {d.desc}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Pill color="gray">{d.pill}</Pill>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ color: ui.mut, fontSize: 13 }}>
                  Trámite: <b style={{ color: ui.text }}>{currentDoc?.title}</b>
                </div>
                <Button variant="ghost" onClick={() => setStep("cards")} style={{ height: 44 }}>
                  ← Atrás
                </Button>
              </div>

              <div style={{ height: 14 }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Input
                  label="CURP"
                  placeholder="Ejem: GUCJ030206HPLRRVA1"
                  value={curp}
                  onChange={(e) => setCurp(e.target.value.toUpperCase())}
                />
                <Input
                  label={currentDoc?.needNss ? "NSS (obligatorio)" : "NSS (opcional)"}
                  placeholder={currentDoc?.needNss ? "11 dígitos" : "11 dígitos (si aplica)"}
                  value={nss}
                  onChange={(e) => setNss(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
                />
              </div>

              <div style={{ height: 12 }} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Button variant="ghost" onClick={pasteCurpNss} style={{ height: 46 }}>
                  <Icon>📋</Icon> Pegar CURP/NSS
                </Button>
                <Button
                  variant="primary"
                  onClick={generate}
                  loading={generateLoading}
                  style={{ height: 46 }}
                >
                  Generar documento
                </Button>
              </div>

              <div style={{ height: 16 }} />
              <div style={{ color: ui.mut, fontSize: 13 }}>
                Aquí aparecerán los PDFs para descargar cuando generes un documento.
              </div>

              <div style={{ height: 10 }} />

              {files?.length > 0 && (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {files.map((f, idx) => {
                    const niceName = buildNiceFilename({ type, curp, index: idx, ext: "pdf" });
                    return (
                      <div
                        key={f.fileId || f.id || idx}
                        style={{
                          border: `1px solid ${ui.border}`,
                          borderRadius: 16,
                          padding: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          background: "#FBFCFF",
                        }}
                      >
                        <div style={{ display: "grid", gap: 6 }}>
                          <div style={{ fontWeight: 950, color: ui.text }}>{niceName}</div>
                          <div style={{ fontSize: 12, color: ui.mut }}>
                            {f.filename ? `Original: ${f.filename}` : "PDF generado."}
                          </div>
                        </div>

                        <Button
                          variant="soft"
                          onClick={() => download(f.fileId, niceName)}
                          loading={!!downloading[f.fileId]}
                          style={{ height: 42, minWidth: 120 }}
                        >
                          <Icon>📄</Icon> PDF
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const DashboardPage = () => {
    if (!isAdmin) {
      return (
        <div>
          <PageHeader title="Dashboard" subtitle="Solo disponible para admins." />
        </div>
      );
    }

    const { uCount, totalCredits, last24hCount, topList } = dashboardStats;

    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Resumen rápido de tu operación." />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <Card>
            <div style={{ padding: 16 }}>
              <div style={{ color: ui.mut, fontWeight: 900, fontSize: 12 }}>Usuarios</div>
              <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 8 }}>{uCount || "—"}</div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 16 }}>
              <div style={{ color: ui.mut, fontWeight: 900, fontSize: 12 }}>Créditos totales</div>
              <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 8 }}>{totalCredits || "—"}</div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 16 }}>
              <div style={{ color: ui.mut, fontWeight: 900, fontSize: 12 }}>Consultas 24h</div>
              <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 8 }}>{last24hCount || "—"}</div>
            </div>
          </Card>
          <Card>
            <div style={{ padding: 16 }}>
              <div style={{ color: ui.mut, fontWeight: 900, fontSize: 12 }}>Rol</div>
              <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 8 }}>{isSuper ? "Super" : "Admin"}</div>
            </div>
          </Card>
        </div>

        <div style={{ height: 14 }} />

        <Card>
          <CardHeader
            title="Top trámites (24h)"
            subtitle="Los trámites más utilizados en las últimas 24 horas."
            right={
              <Button variant="ghost" onClick={refreshAdmin} style={{ height: 42 }}>
                <Icon>🔄</Icon> Actualizar
              </Button>
            }
          />
          <div style={{ padding: 18 }}>
            {topList.length === 0 ? (
              <div style={{ color: ui.mut }}>Sin datos aún (haz algunas consultas).</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {topList.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 14,
                      border: `1px solid ${ui.border}`,
                      background: "#FBFCFF",
                    }}
                  >
                    <div style={{ fontWeight: 1000, color: ui.text }}>{k}</div>
                    <Pill color="blue">{v}</Pill>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const UsersPage = () => {
    if (!isAdmin) {
      return <PageHeader title="Usuarios" subtitle="Solo disponible para admins." />;
    }

    return (
      <div>
        <PageHeader title="Usuarios" subtitle="Como admin solo ves tus usuarios." />

        <Card>
          <CardHeader
            title="Usuarios"
            subtitle="Gestiona usuarios, deshabilita, resetea password y asigna créditos."
            right={
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Input
                  placeholder="Buscar email..."
                  value={""}
                  onChange={() => {}}
                  style={{ width: 220, display: "none" }}
                />
                <Button variant="ghost" onClick={refreshAdmin} style={{ height: 42 }}>
                  <Icon>🔄</Icon>
                </Button>
                <Button variant="primary" onClick={() => setCreateOpen(true)} style={{ height: 42 }}>
                  <Icon>➕</Icon> Crear
                </Button>
              </div>
            }
          />

          <div style={{ padding: 18, display: "grid", gap: 12 }}>
            {(users || []).length === 0 ? (
              <div style={{ color: ui.mut }}>Sin usuarios.</div>
            ) : (
              users.map((u) => {
                const disabled = !!u.disabled;
                return (
                  <div
                    key={u.id}
                    style={{
                      border: `1px solid ${ui.border}`,
                      borderRadius: 16,
                      padding: 14,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 14,
                    }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 1000, color: ui.text }}>{u.email}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Pill color={u.role === "admin" ? "purple" : "gray"}>
                          {u.role || "user"}
                        </Pill>
                        <Pill color={disabled ? "red" : "green"}>
                          {disabled ? "Deshabilitado" : "Activo"}
                        </Pill>
                        <Pill color="gray">Créditos: {Number(u.credits || 0)}</Pill>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <Button variant="ghost" onClick={() => openCredits(u)} style={{ height: 42 }}>
                        <Icon>💳</Icon> Créditos
                      </Button>
                      <Button variant="ghost" onClick={() => resetPassword(u.id)} style={{ height: 42 }}>
                        <Icon>🔑</Icon> Reset
                      </Button>
                      <Button
                        variant={disabled ? "soft" : "danger"}
                        onClick={() => toggleDisabled(u)}
                        style={{ height: 42 }}
                      >
                        <Icon>{disabled ? "✅" : "⛔"}</Icon>
                        {disabled ? "Habilitar" : "Deshabilitar"}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    );
  };

  const LogsPage = () => {
    if (!isAdmin) return <PageHeader title="Logs de consultas" subtitle="Solo disponible para admins." />;

    return (
      <div>
        <PageHeader
          title="Logs de consultas"
          subtitle="Filtra por tipo, fechas y email."
          right={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Pill color="blue">Admin</Pill>
              <Button variant="ghost" onClick={refreshAdmin} style={{ height: 42 }}>
                Refrescar
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader
            title="Consultas"
            subtitle="Logs globales (con scope por rol)."
            right={
              <div style={{ display: "flex", gap: 10 }}>
                <Button
                  variant="ghost"
                  onClick={() => setApplyLogFiltersFlag((x) => x + 1)}
                  style={{ height: 42 }}
                >
                  Aplicar filtros
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setLogType("todos");
                    setLogRange("7d");
                    setLogEmail("");
                    setApplyLogFiltersFlag((x) => x + 1);
                  }}
                  style={{ height: 42 }}
                >
                  Limpiar
                </Button>
              </div>
            }
          />

          <div style={{ padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 1000, color: ui.text }}>Tipo</div>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                  style={{
                    height: 46,
                    borderRadius: 14,
                    border: `1px solid ${ui.border}`,
                    padding: "0 12px",
                    fontWeight: 800,
                  }}
                >
                  <option value="todos">Todos</option>
                  <option value="semanas">semanas</option>
                  <option value="nss">nss</option>
                  <option value="vigencia">vigencia</option>
                  <option value="noderecho">noderecho</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 1000, color: ui.text }}>Rango rápido</div>
                <select
                  value={logRange}
                  onChange={(e) => setLogRange(e.target.value)}
                  style={{
                    height: 46,
                    borderRadius: 14,
                    border: `1px solid ${ui.border}`,
                    padding: "0 12px",
                    fontWeight: 800,
                  }}
                >
                  <option value="24h">Últimas 24h</option>
                  <option value="7d">Últimos 7 días</option>
                  <option value="30d">Últimos 30 días</option>
                  <option value="all">Todo</option>
                </select>
              </div>

              <Input
                label="Buscar por email"
                placeholder="correo@..."
                value={logEmail}
                onChange={(e) => setLogEmail(e.target.value)}
              />
            </div>

            <div style={{ height: 14 }} />

            {filteredLogs.length === 0 ? (
              <div style={{ color: ui.mut }}>Sin logs para esos filtros.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {filteredLogs.slice(0, 60).map((l, i) => {
                  const dt = new Date(l.createdAt || 0).toISOString();
                  const logFiles = Array.isArray(l.files) ? l.files : [];

                  return (
                    <div
                      key={l.id || i}
                      style={{
                        border: `1px solid ${ui.border}`,
                        borderRadius: 16,
                        padding: 14,
                        background: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontWeight: 1000 }}>{l.email || "—"}</div>
                        <div style={{ fontSize: 12, color: ui.mut }}>{dt}</div>
                      </div>

                      <div style={{ height: 8 }} />

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Pill color="gray">{String(l.type || "—")}</Pill>
                        {l.curp && <Pill color="blue">{String(l.curp).toUpperCase()}</Pill>}
                        {l.nss && <Pill color="gray">{String(l.nss)}</Pill>}
                        <Pill color="green">{logFiles.length || 0} PDF(s)</Pill>
                      </div>

                      <div style={{ height: 10 }} />

                      {logFiles.length > 0 ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          {logFiles.map((f, idx) => {
                            const fileId = f.fileId || f.id;
                            const niceName = buildNiceFilename({
                              type: l.type,
                              curp: l.curp,
                              index: idx,
                              ext: "pdf",
                            });

                            return (
                              <div
                                key={fileId || idx}
                                style={{
                                  border: `1px solid ${ui.border}`,
                                  borderRadius: 14,
                                  padding: 12,
                                  background: "#FBFCFF",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                }}
                              >
                                <div style={{ display: "grid", gap: 4 }}>
                                  <div style={{ fontWeight: 950, color: ui.text }}>
                                    {niceName}
                                  </div>
                                  {f.expiresAt && (
                                    <div style={{ fontSize: 12, color: ui.mut }}>
                                      Expira: {String(f.expiresAt)}
                                    </div>
                                  )}
                                </div>

                                <Button
                                  variant="soft"
                                  onClick={() => download(fileId, niceName)}
                                  loading={!!downloading[fileId]}
                                  style={{ height: 40, minWidth: 110 }}
                                >
                                  <Icon>📄</Icon> PDF
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ color: ui.mut, fontSize: 13 }}>
                          Sin archivos en este log.
                        </div>
                      )}

                      <div style={{ marginTop: 10, fontSize: 12, color: ui.mut }}>
                        * Si ya pasó 24h, el backend puede haberlo borrado.
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const CreditLogsPage = () => {
    if (!isAdmin) return <PageHeader title="Logs de créditos" subtitle="Solo disponible para admins." />;

    return (
      <div>
        <PageHeader title="Logs de créditos" subtitle="Historial de otorgamientos y ajustes de créditos." />

        <Card>
          <CardHeader
            title="Créditos"
            subtitle="Registros de cambios de créditos."
            right={
              <Button variant="ghost" onClick={refreshAdmin} style={{ height: 42 }}>
                <Icon>🔄</Icon> Refrescar
              </Button>
            }
          />
          <div style={{ padding: 18 }}>
            {(creditLogs || []).length === 0 ? (
              <div style={{ color: ui.mut }}>Sin logs de créditos.</div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {creditLogs.slice(0, 80).map((c, i) => (
                  <div
                    key={c.id || i}
                    style={{
                      border: `1px solid ${ui.border}`,
                      borderRadius: 16,
                      padding: 14,
                      background: "#fff",
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontWeight: 1000 }}>
                        {c.userEmail || "—"}{" "}
                        <span style={{ color: ui.mut, fontWeight: 800 }}>
                          (por {c.adminEmail || "admin"})
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: ui.mut }}>
                        {String(c.createdAt || "")}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Pill color={Number(c.delta) >= 0 ? "green" : "red"}>
                        {Number(c.delta) >= 0 ? "+" : ""}
                        {c.delta}
                      </Pill>
                      <Pill color="gray">Antes: {c.before}</Pill>
                      <Pill color="gray">Después: {c.after}</Pill>
                      {c.note && <Pill color="blue">{c.note}</Pill>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  /**
   * =========================================================
   *  MAIN RENDER
   * =========================================================
   */
  const main = () => {
    if (view === "consultar") return <ConsultarPage />;
    if (view === "dashboard") return <DashboardPage />;
    if (view === "users") return <UsersPage />;
    if (view === "logs") return <LogsPage />;
    if (view === "creditlogs") return <CreditLogsPage />;
    return <ConsultarPage />;
  };

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      <PageShell>{main()}</PageShell>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Modal crear usuario */}
      <Modal open={createOpen} title="Crear usuario" onClose={() => setCreateOpen(false)}>
        <div style={{ display: "grid", gap: 12 }}>
          <Input
            label="Email"
            placeholder="nuevo@docuexpress.com"
            value={newUEmail}
            onChange={(e) => setNewUEmail(e.target.value)}
          />
          <Input
            label="Password"
            placeholder="mínimo 6"
            type="password"
            value={newUPass}
            onChange={(e) => setNewUPass(e.target.value)}
          />
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 1000, color: ui.text }}>Rol</div>
            <select
              value={newURole}
              onChange={(e) => setNewURole(e.target.value)}
              style={{
                height: 46,
                borderRadius: 14,
                border: `1px solid ${ui.border}`,
                padding: "0 12px",
                fontWeight: 800,
              }}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <div style={{ fontSize: 12, color: ui.mut }}>
              Nota: el “super admin” real requiere lógica en backend (scopes por admin).
            </div>
          </div>

          <Button variant="primary" onClick={createUser} loading={createLoading} style={{ width: "100%" }}>
            Crear
          </Button>
        </div>
      </Modal>

      {/* Modal créditos */}
      <Modal open={creditsOpen} title="Asignar créditos" onClose={() => setCreditsOpen(false)}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: ui.mut }}>
            Usuario: <b style={{ color: ui.text }}>{creditsTarget?.email}</b>
          </div>
          <Input
            label="Cantidad (entero, puede ser negativo)"
            value={String(creditsAmount)}
            onChange={(e) => setCreditsAmount(e.target.value.replace(/[^\d-]/g, ""))}
          />
          <Input
            label="Nota (opcional)"
            value={creditsNote}
            onChange={(e) => setCreditsNote(e.target.value)}
            placeholder="Ej: paquete 50"
          />

          <Button
            variant="primary"
            onClick={grantCredits}
            loading={creditsLoading}
            style={{ width: "100%" }}
          >
            Guardar
          </Button>
        </div>
      </Modal>
    </>
  );
}
