import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * BACKEND URL
 * - Vercel: define VITE_BACKEND_URL en Project Settings
 * - Fallback: Render (tu backend)
 */
const BACKEND_URL =
  (import.meta?.env?.VITE_BACKEND_URL &&
    String(import.meta.env.VITE_BACKEND_URL).trim()) ||
  "https://docuexpress.onrender.com";

// ===================== HELPERS =====================
async function safeJson(res) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return { message: t };
  }
}

function cls(...a) {
  return a.filter(Boolean).join(" ");
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function toISODate(d) {
  // yyyy-mm-dd
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sanitizeFilePart(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "")
    .slice(0, 80);
}

function labelForType(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("seman")) return "Semanas";
  if (t.includes("nss") || t.includes("asign") || t.includes("local")) return "NSS";
  if (t.includes("vigen")) return "Vigencia";
  if (t.includes("no") && t.includes("dere")) return "NoDerecho";
  // fallback
  return "Documento";
}

function buildNiceFilename({ type, curp }) {
  const label = labelForType(type);
  const c = sanitizeFilePart(curp || "SIN_CURP");
  return `${label}_${c}.pdf`;
}

/**
 * authFetch: pega token + JSON headers
 */
async function authFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...(opts.headers || {}),
  };

  // Si el body es FormData, NO pongas Content-Type
  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;

  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(`${BACKEND_URL}${path}`, { ...opts, headers });
}

// ===================== UI PRIMITIVES =====================
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    color: "#0f172a",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
  },
  shell: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 0,
    minHeight: "100vh",
  },
  sidebar: {
    background: "#ffffff",
    borderRight: "1px solid #e9ecf5",
    padding: "22px 18px",
  },
  main: {
    padding: "28px 36px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  logo: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: -0.5,
  },
  logoAccent: { color: "#4f46e5" },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f1f5ff",
    border: "1px solid #dbe3ff",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
  },
  card: {
    background: "#fff",
    border: "1px solid #e9ecf5",
    borderRadius: 18,
    boxShadow: "0 14px 28px rgba(15,23,42,.06)",
  },
  cardHeader: {
    padding: "16px 18px",
    borderBottom: "1px solid #edf1fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardBody: {
    padding: "18px",
  },
  h1: { fontSize: 44, fontWeight: 900, letterSpacing: -1.2, margin: "6px 0 4px" },
  h2: { fontSize: 30, fontWeight: 900, letterSpacing: -0.6, margin: 0 },
  sub: { color: "#64748b", marginTop: 8 },
  label: { fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 8 },
  input: {
    width: "100%",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: "12px 14px",
    outline: "none",
    fontSize: 14,
    background: "#ffffff",
  },
  inputRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  btn: {
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    padding: "12px 14px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    background: "#fff",
  },
  btnPrimary: {
    background: "#4f46e5",
    border: "1px solid #4f46e5",
    color: "#fff",
  },
  btnSoft: {
    background: "#f1f5ff",
    border: "1px solid #dbe3ff",
    color: "#1f2a70",
  },
  navGroupTitle: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    textTransform: "none",
  },
  navBtn: (active) => ({
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 14,
    border: `1px solid ${active ? "#4f46e5" : "#e9ecf5"}`,
    background: active ? "#4f46e5" : "#fff",
    color: active ? "#fff" : "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: active ? "0 14px 28px rgba(79,70,229,.18)" : "none",
    marginBottom: 10,
  }),
  meta: { fontSize: 12, color: "#64748b" },
  badge: (variant) => {
    const map = {
      admin: { bg: "#eef2ff", bd: "#dbe3ff", fg: "#3730a3" },
      user: { bg: "#ecfeff", bd: "#b7f7ff", fg: "#0e7490" },
      ok: { bg: "#ecfdf5", bd: "#bbf7d0", fg: "#166534" },
      warn: { bg: "#fff7ed", bd: "#fed7aa", fg: "#9a3412" },
      gray: { bg: "#f1f5f9", bd: "#e2e8f0", fg: "#334155" },
    };
    const v = map[variant] || map.gray;
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 999,
      background: v.bg,
      border: `1px solid ${v.bd}`,
      color: v.fg,
      fontSize: 12,
      fontWeight: 900,
      whiteSpace: "nowrap",
    };
  },
};

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const colors = {
    success: "#16a34a",
    error: "#dc2626",
    info: "#4f46e5",
    warn: "#f59e0b",
  };
  const c = colors[toast.type] || colors.info;

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}>
      <div
        style={{
          background: "#fff",
          borderLeft: `6px solid ${c}`,
          padding: 14,
          borderRadius: 14,
          width: 380,
          boxShadow: "0 20px 40px rgba(0,0,0,.15)",
          border: "1px solid #eef2ff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900 }}>{toast.title}</div>
            <div style={{ fontSize: 13, marginTop: 4, color: "#475569" }}>{toast.message}</div>
          </div>
          <button onClick={onClose} style={{ ...styles.btn, padding: "8px 10px" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,.50)",
        zIndex: 9998,
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: "min(720px, 96vw)",
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #e9ecf5",
          boxShadow: "0 30px 70px rgba(15,23,42,.25)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ ...styles.cardHeader }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={{ ...styles.btn, padding: "10px 12px" }}>
            ✕
          </button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
        {footer ? (
          <div style={{ padding: 18, borderTop: "1px solid #edf1fb" }}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ title, value, right }) {
  return (
    <div style={{ ...styles.card, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#475569" }}>{title}</div>
          <div style={{ fontSize: 26, fontWeight: 1000, marginTop: 6 }}>{value}</div>
        </div>
        <div style={{ opacity: 0.85 }}>{right}</div>
      </div>
    </div>
  );
}

// ===================== APP =====================
export default function App() {
  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (t) => setToast(t);

  // ===== ENV CHECK (tu bloque “paso 1” ya viene aquí, al inicio del componente) =====
  useEffect(() => {
    if (!BACKEND_URL || String(BACKEND_URL).includes("undefined")) {
      console.error("VITE_BACKEND_URL está mal:", BACKEND_URL);
      showToast({
        type: "warn",
        title: "Config incompleta",
        message: "VITE_BACKEND_URL parece mal configurada. Usaré el fallback.",
      });
    }
  }, []);

  // Auth
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState(null);

  // Views
  const [view, setView] = useState("consultar"); // consultar | dashboard | users | logs | creditlogs
  const [loading, setLoading] = useState(false);

  // Download state
  const [dl, setDl] = useState({}); // { [fileId]: "idle"|"downloading"|"done"|"error" }

  // Consultar flow
  const [step, setStep] = useState("cards"); // cards | form
  const [type, setType] = useState("semanas");
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [files, setFiles] = useState([]);

  // Data admin
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [creditLogs, setCreditLogs] = useState([]);

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [openCredits, setOpenCredits] = useState(false);
  const [creditsUser, setCreditsUser] = useState(null);
  const [creditsAmount, setCreditsAmount] = useState(10);
  const [creditsNote, setCreditsNote] = useState("");

  // Create user fields
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState("user");

  // Filters logs
  const [logType, setLogType] = useState("all");
  const [logRange, setLogRange] = useState("7d"); // 24h | 7d | 30d | all
  const [logEmail, setLogEmail] = useState("");
  const [logApplied, setLogApplied] = useState({ type: "all", range: "7d", email: "" });

  // Filter credit logs
  const [creditEmail, setCreditEmail] = useState("");

  // Clipboard paste
  const pasteBtnRef = useRef(null);

  // ====== AUTH: login / logout ======

  const onLogin = async () => {
    try {
      setLoading(true);
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

      showToast({
        type: "success",
        title: "Sesión iniciada",
        message: "Bienvenido 👋",
      });

      // reset password input to avoid weirdness
      setPassword("");
    } catch (e) {
      console.error(e);
      showToast({
        type: "error",
        title: "Error de red",
        message: "No se pudo conectar al backend.",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setMe(null);
    setView("consultar");
    setStep("cards");
    setFiles([]);
    showToast({ type: "info", title: "Sesión cerrada", message: "" });
  };

  // ====== LOAD DATA ======
  const refreshUsers = async () => {
    const r = await authFetch("/api/users");
    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.message || "Error users");
    setUsers(d.users || d || []);
  };

  const refreshLogs = async (applied = logApplied) => {
    // Build query params (si tu backend ya los soporta, mejor)
    const params = new URLSearchParams();

    if (applied.type && applied.type !== "all") params.set("type", applied.type);

    // rango rápido
    const now = new Date();
    if (applied.range === "24h") {
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      params.set("from", from.toISOString());
      params.set("to", now.toISOString());
    } else if (applied.range === "7d") {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      params.set("from", from.toISOString());
      params.set("to", now.toISOString());
    } else if (applied.range === "30d") {
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      params.set("from", from.toISOString());
      params.set("to", now.toISOString());
    }

    if (applied.email && applied.email.trim()) params.set("email", applied.email.trim());

    const q = params.toString() ? `?${params.toString()}` : "";
    const r = await authFetch(`/api/logs${q}`);
    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.message || "Error logs");

    const items = d.logs || d || [];
    setLogs(items);
  };

  const refreshCreditLogs = async () => {
    const r = await authFetch("/api/creditlogs");
    const d = await safeJson(r);
    if (!r.ok) throw new Error(d.message || "Error creditlogs");
    setCreditLogs(d.logs || d || []);
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      if (me?.role === "admin") {
        await Promise.all([refreshUsers(), refreshLogs(logApplied), refreshCreditLogs()]);
      }
    } catch (e) {
      console.error(e);
      showToast({ type: "error", title: "Error", message: "No se pudieron cargar datos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!me) return;
    // carga inicial
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // ====== CONSULTAR: trámites ======
  const TRAMITES = [
    {
      key: "semanas",
      title: "Semanas cotizadas",
      desc: "Constancia de semanas cotizadas en el IMSS.",
      meta: "CURP + NSS",
      requireNss: true,
    },
    {
      key: "nss",
      title: "Asignación / Localización NSS",
      desc: "Genera documentos de NSS (puede devolver 2 PDFs).",
      meta: "Solo CURP • 2 PDFs",
      requireNss: false,
    },
    {
      key: "vigencia",
      title: "Vigencia de derechos",
      desc: "Constancia de vigencia de derechos.",
      meta: "CURP + NSS",
      requireNss: true,
    },
    {
      key: "noderechohabiencia",
      title: "No derechohabiencia",
      desc: "Constancia de no derecho al servicio médico.",
      meta: "Solo CURP (según proveedor)",
      requireNss: false,
    },
  ];

  const selectedTramite = useMemo(
    () => TRAMITES.find((t) => t.key === type) || TRAMITES[0],
    [type]
  );

  const generate = async () => {
    try {
      const c = curp.trim().toUpperCase();
      const n = nss.trim();
      if (!c || c.length < 10) {
        showToast({ type: "error", title: "Falta CURP", message: "Captura una CURP válida." });
        return;
      }
      if (selectedTramite.requireNss && (!n || n.length < 10)) {
        showToast({ type: "error", title: "Falta NSS", message: "Captura el NSS (11 dígitos)." });
        return;
      }

      setLoading(true);
      const res = await authFetch("/api/imss", {
        method: "POST",
        body: JSON.stringify({ type, curp: c, nss: n }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        showToast({
          type: "error",
          title: "Inconsistencia",
          message: data.message || `HTTP ${res.status}`,
        });
        return;
      }

      setFiles(data.files || []);
      showToast({ type: "success", title: "PDF listo", message: "Descarga disponible" });
    } catch (e) {
      console.error(e);
      showToast({ type: "error", title: "Error", message: "No se pudo generar el documento." });
    } finally {
      setLoading(false);
    }
  };

  // ====== DESCARGA con estado ======
  const download = async (fileId, originalFilename) => {
    try {
      const niceName = buildNiceFilename({ type, curp });
      setDl((p) => ({ ...p, [fileId]: "downloading" }));

      const res = await fetch(`${BACKEND_URL}/api/download/${fileId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);

      // Aquí cambiamos el nombre (ya no “_principal”)
      a.download = niceName || originalFilename || "documento.pdf";
      a.click();

      setDl((p) => ({ ...p, [fileId]: "done" }));
      setTimeout(() => setDl((p) => ({ ...p, [fileId]: "idle" })), 1500);
    } catch (e) {
      console.error(e);
      setDl((p) => ({ ...p, [fileId]: "error" }));
      showToast({
        type: "error",
        title: "Descarga fallida",
        message: "No se pudo descargar el PDF.",
      });
      setTimeout(() => setDl((p) => ({ ...p, [fileId]: "idle" })), 2000);
    }
  };

  // ====== USERS actions ======
  const createUser = async () => {
    try {
      const e = newEmail.trim().toLowerCase();
      if (!e || e.length < 5) {
        showToast({ type: "error", title: "Email inválido", message: "Revisa el email." });
        return;
      }
      if (!newPass || newPass.trim().length < 6) {
        showToast({ type: "error", title: "Password inválida", message: "Mínimo 6 caracteres." });
        return;
      }

      setLoading(true);
      const r = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ email: e, password: newPass, role: newRole }),
      });
      const d = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "No se pudo crear", message: d.message || "Error" });
        return;
      }

      showToast({ type: "success", title: "Usuario creado", message: e });
      setOpenCreate(false);
      setNewEmail("");
      setNewPass("");
      setNewRole("user");
      await refreshUsers();
    } catch (e) {
      console.error(e);
      showToast({ type: "error", title: "Error", message: "No se pudo crear usuario." });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (id) => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/users/${id}/reset-password`, { method: "POST" });
      const d = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Error", message: d.message || "No se pudo resetear" });
        return;
      }
      showToast({
        type: "success",
        title: "Password reseteada",
        message: `Nueva: ${d.newPassword}`,
      });
    } catch (e) {
      console.error(e);
      showToast({ type: "error", title: "Error", message: "No se pudo resetear." });
    } finally {
      setLoading(false);
    }
  };

  const toggleDisabled = async (u) => {
    try {
      setLoading(true);
      const r = await authFetch(`/api/users/${u.id}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: !u.disabled }),
      });
      const d = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Error", message: d.message || "No se pudo actualizar" });
        return;
      }
      showToast({ type: "success", title: "Actualizado", message: u.email });
      await refreshUsers();
    } catch (e) {
      console.error(e);
      showToast({ type: "error", title: "Error", message: "No se pudo actualizar." });
    } finally {
      setLoading(false);
    }
  };

  const openCreditsModal = (u) => {
    setCreditsUser(u);
    setCreditsAmount(10);
    setCreditsNote("");
    setOpenCredits(true);
  };

  const grantCredits = async () => {
    if (!creditsUser) return;
    const amt = Number(creditsAmount);
    if (!Number.isInteger(amt)) {
      showToast({ type: "error", title: "Monto inválido", message: "Debe ser entero." });
      return;
    }

    try {
      setLoading(true);
      const r = await authFetch("/api/credits/grant", {
        method: "POST",
        body: JSON.stringify({
          userId: creditsUser.id,
          amount: amt,
          note: creditsNote || "",
        }),
      });
      const d = await safeJson(r);
      if (!r.ok) {
        showToast({ type: "error", title: "Error", message: d.message || "No se pudo otorgar" });
        return;
      }

      showToast({ type: "success", title: "Créditos actualizados", message: creditsUser.email });
      setOpenCredits(false);
      await Promise.all([refreshUsers(), refreshCreditLogs()]);
    } catch (e) {
      console.error(e);
      showToast({ type: "error", title: "Error", message: "No se pudo otorgar créditos." });
    } finally {
      setLoading(false);
    }
  };

  // ====== LOGS filters handlers ======
  const applyLogFilters = async () => {
    const applied = { type: logType, range: logRange, email: logEmail };
    setLogApplied(applied);
    try {
      setLoading(true);
      await refreshLogs(applied);
    } catch (e) {
      console.error(e);
      showToast({ type: "error", title: "Error", message: "No se pudieron cargar logs." });
    } finally {
      setLoading(false);
    }
  };

  const clearLogFilters = async () => {
    setLogType("all");
    setLogRange("7d");
    setLogEmail("");
    const applied = { type: "all", range: "7d", email: "" };
    setLogApplied(applied);

    try {
      setLoading(true);
      await refreshLogs(applied);
    } catch (e) {
      console.error(e);
      showToast({ type: "error", title: "Error", message: "No se pudieron cargar logs." });
    } finally {
      setLoading(false);
    }
  };

  // ====== DERIVED (dashboard, lists) ======
  const usersFiltered = useMemo(() => {
    return users;
  }, [users]);

  const dashboard = useMemo(() => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const logs24 = (logs || []).filter((l) => new Date(l.createdAt || 0).getTime() >= dayAgo);

    const top = {};
    for (const l of logs24) {
      const k = String(l.type || "otro");
      top[k] = (top[k] || 0) + 1;
    }
    const topArr = Object.entries(top)
      .map(([k, v]) => ({ k, v }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 6);

    const creditsTotal = (users || []).reduce((a, u) => a + Number(u.credits || 0), 0);

    return {
      usersCount: (users || []).length,
      creditsTotal,
      logs24Count: logs24.length,
      topArr,
    };
  }, [users, logs]);

  const filteredCreditLogs = useMemo(() => {
    const q = creditEmail.trim().toLowerCase();
    if (!q) return creditLogs || [];
    return (creditLogs || []).filter((l) =>
      String(l.userEmail || "").toLowerCase().includes(q)
    );
  }, [creditLogs, creditEmail]);

  // =============== LOGIN SCREEN (Fix paso 5 ya aplicado aquí) ===============
  if (!me) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.shell, gridTemplateColumns: "420px 1fr" }}>
          <aside style={{ ...styles.sidebar }}>
            <div style={styles.brand}>
              <div style={styles.logo}>
                Docu<span style={styles.logoAccent}>Express</span>
              </div>
              <span style={styles.pill}>SaaS</span>
            </div>

            <div style={{ ...styles.card, padding: 18 }}>
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 14 }}>
                Iniciar sesión
              </div>

              {/* ✅ FIX: form onSubmit + preventDefault (ya no “te saca” al escribir) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onLogin();
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <input
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <input
                    style={styles.input}
                    placeholder="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  style={{ ...styles.btn, ...styles.btnPrimary, width: "100%" }}
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Iniciar sesión"}
                </button>
              </form>

              <div style={{ marginTop: 14, color: "#64748b", fontSize: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Demo:</div>
                <div>Admin: admin@docuexpress.com / Admin123!</div>
                <div>Cliente: cliente@docuexpress.com / Cliente123!</div>
              </div>
            </div>

            <div style={{ marginTop: 18, fontSize: 12, color: "#64748b" }}>
              Backend:{" "}
              <b style={{ color: "#0f172a" }}>
                {BACKEND_URL}
              </b>
            </div>
          </aside>

          <main style={{ ...styles.main, display: "grid", placeItems: "center" }}>
            <div style={{ maxWidth: 740 }}>
              <div style={{ ...styles.pill, marginBottom: 14 }}>DocuExpress</div>
              <div style={styles.h1}>Consultar</div>
              <div style={styles.sub}>
                Genera documentos del IMSS. Los PDFs se guardan por 24 horas y se descargan desde tu panel.
              </div>

              <div style={{ height: 22 }} />

              <div style={{ ...styles.card, padding: 18 }}>
                <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>
                  ¿Qué incluye?
                </div>
                <div style={{ color: "#64748b", fontSize: 14 }}>
                  • Semanas cotizadas • Asignación/Localización NSS • Vigencia de derechos • No derechohabiencia
                </div>
              </div>
            </div>
          </main>
        </div>

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  // =============== MAIN SHELL ===============
  const isAdmin = me?.role === "admin";

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          <div style={styles.brand}>
            <div style={styles.logo}>
              Docu<span style={styles.logoAccent}>Express</span>
            </div>
            <span style={styles.pill}>SaaS</span>
          </div>

          <div style={{ ...styles.card, padding: 16 }}>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 900 }}>Sesión</div>
            <div style={{ fontWeight: 900, marginTop: 4 }}>{me.email}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <span style={styles.badge(me.role === "admin" ? "admin" : "user")}>
                {me.role === "admin" ? "Admin" : "User"}
              </span>
              <span style={styles.badge("gray")}>{me.credits ?? 0} créditos</span>
            </div>
            <button
              onClick={logout}
              style={{ ...styles.btn, width: "100%", marginTop: 12 }}
            >
              Cerrar sesión
            </button>
          </div>

          <div style={styles.navGroupTitle}>Menú</div>

          <button style={styles.navBtn(view === "consultar")} onClick={() => setView("consultar")}>
            <span>🔎&nbsp; CONSULTAR</span>
            <span style={{ opacity: 0.8 }}>{view === "consultar" ? "●" : ""}</span>
          </button>

          {isAdmin && (
            <>
              <button style={styles.navBtn(view === "dashboard")} onClick={() => setView("dashboard")}>
                <span>📊&nbsp; Dashboard</span>
                <span style={{ opacity: 0.8 }}>{view === "dashboard" ? "●" : ""}</span>
              </button>

              <button style={styles.navBtn(view === "users")} onClick={() => setView("users")}>
                <span>👤&nbsp; Usuarios</span>
                <span style={{ opacity: 0.8 }}>{view === "users" ? "●" : ""}</span>
              </button>

              <button style={styles.navBtn(view === "logs")} onClick={() => setView("logs")}>
                <span>🧾&nbsp; Logs de consultas</span>
                <span style={{ opacity: 0.8 }}>{view === "logs" ? "●" : ""}</span>
              </button>

              <button style={styles.navBtn(view === "creditlogs")} onClick={() => setView("creditlogs")}>
                <span>💳&nbsp; Logs de créditos</span>
                <span style={{ opacity: 0.8 }}>{view === "creditlogs" ? "●" : ""}</span>
              </button>

              <div style={{ height: 6 }} />

              <button
                style={{ ...styles.btn, width: "100%", marginTop: 10, ...styles.btnSoft }}
                onClick={() => setOpenCreate(true)}
              >
                ➕ Crear usuario
              </button>

              <button
                style={{ ...styles.btn, width: "100%", marginTop: 10 }}
                onClick={refreshAll}
                disabled={loading}
              >
                {loading ? "Actualizando..." : "🔄 Actualizar"}
              </button>
            </>
          )}

          <div style={{ marginTop: 18, fontSize: 12, color: "#64748b" }}>
            Backend: <b style={{ color: "#0f172a" }}>{BACKEND_URL}</b>
          </div>
        </aside>

        {/* MAIN */}
        <main style={styles.main}>
          {/* CONSULTAR */}
          {view === "consultar" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ ...styles.pill, marginBottom: 10 }}>DocuExpress</div>
                  <div style={styles.h2}>Consultar</div>
                  <div style={styles.sub}>
                    Genera documentos del IMSS. Los PDFs se guardan por 24 horas y se descargan desde tu panel.
                  </div>
                </div>
                <div>
                  <span style={styles.pill}>PDFs duran 24h</span>
                </div>
              </div>

              <div style={{ height: 16 }} />

              <div style={{ ...styles.card }}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>CONSULTAR</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                      Elige el trámite, captura datos y genera el PDF.
                    </div>
                  </div>
                  <span style={styles.pill}>PDFs duran 24h</span>
                </div>

                <div style={styles.cardBody}>
                  {step === "cards" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {TRAMITES.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => {
                            setType(t.key);
                            setFiles([]);
                            setStep("form");
                          }}
                          style={{
                            textAlign: "left",
                            padding: 16,
                            borderRadius: 16,
                            border: "1px solid #e9ecf5",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontWeight: 1000 }}>{t.title}</div>
                          <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{t.desc}</div>
                          <div style={{ marginTop: 10 }}>
                            <span style={styles.badge("gray")}>{t.meta}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ fontSize: 14, color: "#475569" }}>
                          Trámite: <b>{selectedTramite.title}</b>
                        </div>
                        <button
                          onClick={() => setStep("cards")}
                          style={{ ...styles.btn, padding: "10px 14px" }}
                        >
                          ← Atrás
                        </button>
                      </div>

                      <div style={{ height: 16 }} />

                      <div style={styles.inputRow}>
                        <div>
                          <div style={styles.label}>CURP</div>
                          <input
                            style={styles.input}
                            value={curp}
                            onChange={(e) => setCurp(e.target.value.toUpperCase())}
                            placeholder="CAPTURA CURP"
                          />
                        </div>

                        <div>
                          <div style={styles.label}>
                            NSS {selectedTramite.requireNss ? "(obligatorio)" : "(opcional)"}
                          </div>
                          <input
                            style={styles.input}
                            value={nss}
                            onChange={(e) => setNss(e.target.value)}
                            placeholder="11 dígitos"
                            disabled={!selectedTramite.requireNss && type === "nss"}
                          />
                        </div>
                      </div>

                      <div style={{ height: 12 }} />

                      <div style={styles.inputRow}>
                        <button
                          ref={pasteBtnRef}
                          style={{ ...styles.btn, display: "flex", justifyContent: "center", gap: 10 }}
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              // Soporta pegar "CURP NSS" o "CURP|NSS"
                              const parts = String(text || "")
                                .replace(/\n/g, " ")
                                .replace(/\|/g, " ")
                                .trim()
                                .split(/\s+/);
                              if (parts[0]) setCurp(parts[0].toUpperCase());
                              if (parts[1]) setNss(parts[1]);
                              showToast({ type: "info", title: "Pegado", message: "Datos pegados." });
                            } catch {
                              showToast({
                                type: "error",
                                title: "No se pudo pegar",
                                message: "Tu navegador bloqueó el portapapeles.",
                              });
                            }
                          }}
                        >
                          📋 Pegar CURP/NSS
                        </button>

                        <button
                          style={{ ...styles.btn, ...styles.btnPrimary }}
                          onClick={generate}
                          disabled={loading}
                        >
                          {loading ? "Generando..." : "Generar documento"}
                        </button>
                      </div>

                      <div style={{ height: 14 }} />
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        Aquí aparecerán los PDFs para descargar cuando generes un documento.
                      </div>

                      <div style={{ height: 14 }} />

                      {files?.length ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          {files.map((f) => {
                            const st = dl[f.fileId] || "idle";
                            return (
                              <div
                                key={f.fileId}
                                style={{
                                  border: "1px solid #edf1fb",
                                  borderRadius: 16,
                                  padding: 14,
                                  background: "#fbfcff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 900, fontSize: 14 }}>
                                    {buildNiceFilename({ type, curp })}
                                  </div>
                                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                                    {f.expiresAt ? `Expira: ${fmtDate(f.expiresAt)}` : "Disponible para descargar"}
                                  </div>
                                </div>

                                <button
                                  onClick={() => download(f.fileId, f.filename)}
                                  disabled={st === "downloading"}
                                  style={{
                                    ...styles.btn,
                                    ...styles.btnSoft,
                                    minWidth: 110,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                    opacity: st === "downloading" ? 0.7 : 1,
                                    cursor: st === "downloading" ? "not-allowed" : "pointer",
                                  }}
                                >
                                  {st === "downloading" ? "Descargando..." : "PDF"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* DASHBOARD */}
          {view === "dashboard" && isAdmin && (
            <>
              <div style={{ ...styles.pill, marginBottom: 10 }}>DocuExpress</div>
              <div style={styles.h2}>Dashboard</div>
              <div style={styles.sub}>Resumen rápido de tu operación.</div>

              <div style={{ height: 16 }} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                <StatCard title="Usuarios" value={dashboard.usersCount} right="👥" />
                <StatCard title="Créditos totales" value={dashboard.creditsTotal} right="💳" />
                <StatCard title="Consultas 24h" value={dashboard.logs24Count} right="🧾" />
                <StatCard title="Rol" value={me.role === "admin" ? "Admin" : "User"} right="🛡️" />
              </div>

              <div style={{ height: 14 }} />

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>Top trámites (24h)</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                      Los trámites más utilizados en las últimas 24 horas.
                    </div>
                  </div>
                  <button style={styles.btn} onClick={refreshAll} disabled={loading}>
                    ⟳ Actualizar
                  </button>
                </div>

                <div style={styles.cardBody}>
                  {!dashboard.topArr.length ? (
                    <div style={{ color: "#64748b" }}>Sin datos aún (haz algunas consultas).</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {dashboard.topArr.map((x) => (
                        <div
                          key={x.k}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            border: "1px solid #edf1fb",
                            borderRadius: 14,
                            padding: 12,
                            background: "#fbfcff",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>{labelForType(x.k)}</div>
                          <span style={styles.badge("gray")}>{x.v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* USERS */}
          {view === "users" && isAdmin && (
            <>
              <div style={{ ...styles.pill, marginBottom: 10 }}>DocuExpress</div>
              <div style={styles.h2}>Usuarios</div>
              <div style={styles.sub}>Como admin solo ves tus usuarios.</div>

              <div style={{ height: 16 }} />

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>Usuarios</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                      Gestiona usuarios, deshabilita, resetea password y asigna créditos.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={styles.btn} onClick={refreshUsers} disabled={loading}>
                      ⟳
                    </button>
                    <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={() => setOpenCreate(true)}>
                      ➕ Crear
                    </button>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  {!usersFiltered.length ? (
                    <div style={{ color: "#64748b" }}>Sin usuarios.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {usersFiltered.map((u) => (
                        <div
                          key={u.id}
                          style={{
                            border: "1px solid #edf1fb",
                            borderRadius: 16,
                            padding: 14,
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 14,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 1000 }}>{u.email}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                              <span style={styles.badge(u.role === "admin" ? "admin" : "user")}>
                                {u.role}
                              </span>
                              <span style={styles.badge(u.disabled ? "warn" : "ok")}>
                                {u.disabled ? "Deshabilitado" : "Activo"}
                              </span>
                              <span style={styles.badge("gray")}>Créditos: {u.credits ?? 0}</span>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <button style={{ ...styles.btn, ...styles.btnSoft }} onClick={() => openCreditsModal(u)}>
                              💳 Créditos
                            </button>
                            <button style={styles.btn} onClick={() => resetPassword(u.id)}>
                              🔑 Reset
                            </button>
                            <button style={styles.btn} onClick={() => toggleDisabled(u)}>
                              🚫 {u.disabled ? "Habilitar" : "Deshabilitar"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* LOGS */}
          {view === "logs" && isAdmin && (
            <>
              <div style={{ ...styles.pill, marginBottom: 10 }}>DocuExpress</div>
              <div style={styles.h2}>Logs de consultas</div>
              <div style={styles.sub}>Filtra por tipo, fechas y email.</div>

              <div style={{ height: 16 }} />

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>Consultas</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                      Logs globales (con scope por rol).
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={styles.btn} onClick={applyLogFilters} disabled={loading}>
                      Aplicar filtros
                    </button>
                    <button style={styles.btn} onClick={clearLogFilters} disabled={loading}>
                      Limpiar
                    </button>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={styles.label}>Tipo</div>
                      <select
                        style={styles.input}
                        value={logType}
                        onChange={(e) => setLogType(e.target.value)}
                      >
                        <option value="all">Todos</option>
                        <option value="semanas">Semanas</option>
                        <option value="nss">NSS</option>
                        <option value="vigencia">Vigencia</option>
                        <option value="noderechohabiencia">No derechohabiencia</option>
                      </select>
                    </div>
                    <div>
                      <div style={styles.label}>Rango rápido</div>
                      <select
                        style={styles.input}
                        value={logRange}
                        onChange={(e) => setLogRange(e.target.value)}
                      >
                        <option value="24h">Últimas 24h</option>
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="all">Todo</option>
                      </select>
                    </div>
                    <div>
                      <div style={styles.label}>Buscar por email</div>
                      <input
                        style={styles.input}
                        value={logEmail}
                        onChange={(e) => setLogEmail(e.target.value)}
                        placeholder="correo@..."
                      />
                    </div>
                  </div>

                  <div style={{ height: 14 }} />

                  {!logs?.length ? (
                    <div style={{ color: "#64748b" }}>Sin logs para esos filtros.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {logs.map((l, idx) => {
                        const file = (l.files || [])[0];
                        const fileId = file?.fileId || l.fileId;
                        const showPdf = !!fileId;

                        return (
                          <div
                            key={l.id || idx}
                            style={{
                              border: "1px solid #edf1fb",
                              borderRadius: 16,
                              padding: 14,
                              background: "#fff",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                              <div style={{ fontWeight: 1000 }}>{l.email || "—"}</div>
                              <div style={{ color: "#64748b", fontSize: 12 }}>{fmtDate(l.createdAt)}</div>
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                              <span style={styles.badge("gray")}>{labelForType(l.type)}</span>
                              {l.curp ? <span style={styles.badge("user")}>{l.curp}</span> : null}
                              {l.nss ? <span style={styles.badge("gray")}>{l.nss}</span> : null}
                              {l.files?.length ? <span style={styles.badge("ok")}>{l.files.length} PDF(s)</span> : null}
                            </div>

                            <div
                              style={{
                                marginTop: 12,
                                background: "#fbfcff",
                                border: "1px solid #edf1fb",
                                borderRadius: 14,
                                padding: 12,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <div style={{ fontWeight: 900, fontSize: 13, color: "#0f172a" }}>
                                {buildNiceFilename({ type: l.type, curp: l.curp })}
                                <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                                  {l.expiresAt ? `Expira: ${fmtDate(l.expiresAt)}` : "Disponible"}
                                </div>
                              </div>

                              {showPdf ? (
                                (() => {
                                  const st = dl[fileId] || "idle";
                                  return (
                                    <button
                                      onClick={() => download(fileId, file?.filename)}
                                      disabled={st === "downloading"}
                                      style={{
                                        ...styles.btn,
                                        ...styles.btnSoft,
                                        minWidth: 110,
                                        opacity: st === "downloading" ? 0.7 : 1,
                                      }}
                                    >
                                      {st === "downloading" ? "Descargando..." : "PDF"}
                                    </button>
                                  );
                                })()
                              ) : (
                                <span style={styles.badge("warn")}>Sin PDF</span>
                              )}
                            </div>

                            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                              * Si ya pasó 24h, el backend puede haberlo borrado.
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* CREDIT LOGS */}
          {view === "creditlogs" && isAdmin && (
            <>
              <div style={{ ...styles.pill, marginBottom: 10 }}>DocuExpress</div>
              <div style={styles.h2}>Logs de créditos</div>
              <div style={styles.sub}>Historial de otorgamientos y ajustes de créditos.</div>

              <div style={{ height: 16 }} />

              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ fontWeight: 1000 }}>Créditos</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                      Registros de cambios de créditos.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      style={{ ...styles.input, width: 260 }}
                      placeholder="Filtrar por email..."
                      value={creditEmail}
                      onChange={(e) => setCreditEmail(e.target.value)}
                    />
                    <button style={styles.btn} onClick={refreshCreditLogs} disabled={loading}>
                      ⟳
                    </button>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  {!filteredCreditLogs.length ? (
                    <div style={{ color: "#64748b" }}>Sin logs de créditos.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {filteredCreditLogs.map((l, idx) => (
                        <div
                          key={l.id || idx}
                          style={{
                            border: "1px solid #edf1fb",
                            borderRadius: 16,
                            padding: 14,
                            background: "#fff",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ fontWeight: 1000 }}>{l.userEmail || "—"}</div>
                            <div style={{ color: "#64748b", fontSize: 12 }}>{fmtDate(l.createdAt)}</div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                            <span style={styles.badge("gray")}>
                              Admin: {l.adminEmail || "—"}
                            </span>
                            <span style={styles.badge(l.delta >= 0 ? "ok" : "warn")}>
                              {l.delta >= 0 ? `+${l.delta}` : `${l.delta}`} créditos
                            </span>
                            <span style={styles.badge("gray")}>
                              {l.before} → {l.after}
                            </span>
                          </div>

                          {l.note ? (
                            <div style={{ marginTop: 10, color: "#475569", fontSize: 13 }}>
                              Nota: {l.note}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      <Modal
        open={openCreate}
        title="Crear usuario"
        onClose={() => setOpenCreate(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button style={styles.btn} onClick={() => setOpenCreate(false)}>
              Cancelar
            </button>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={createUser} disabled={loading}>
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={styles.label}>Email</div>
            <input
              style={styles.input}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="correo@dominio.com"
            />
          </div>
          <div>
            <div style={styles.label}>Password</div>
            <input
              style={styles.input}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="mínimo 6 caracteres"
              type="text"
            />
          </div>
          <div>
            <div style={styles.label}>Rol</div>
            <select style={styles.input} value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              * Si tu backend limita roles por superadmin, aquí solo es UI.
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={openCredits}
        title={`Créditos — ${creditsUser?.email || ""}`}
        onClose={() => setOpenCredits(false)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button style={styles.btn} onClick={() => setOpenCredits(false)}>
              Cancelar
            </button>
            <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={grantCredits} disabled={loading}>
              {loading ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={styles.label}>Monto (entero)</div>
            <input
              style={styles.input}
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(Number(e.target.value))}
              type="number"
            />
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              Usa positivo para sumar, negativo para restar (si tu backend lo permite).
            </div>
          </div>

          <div>
            <div style={styles.label}>Nota (opcional)</div>
            <input
              style={styles.input}
              value={creditsNote}
              onChange={(e) => setCreditsNote(e.target.value)}
              placeholder="Motivo / referencia..."
            />
          </div>
        </div>
      </Modal>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
