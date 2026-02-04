import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * BACKEND_URL:
 * - usa VITE_BACKEND_URL si existe
 * - si no, fallback a Render (tu URL)
 */
const BACKEND_URL =
  (import.meta?.env?.VITE_BACKEND_URL && String(import.meta.env.VITE_BACKEND_URL).trim()) ||
  "https://docuexpress.onrender.com";

// ===================== utils =====================
async function safeJson(res) {
  const txt = await res.text().catch(() => "");
  try {
    return txt ? JSON.parse(txt) : {};
  } catch {
    return { message: txt || "Respuesta inválida del servidor" };
  }
}

function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toISOString();
  } catch {
    return iso;
  }
}

function withinRange(iso, mode) {
  // mode: "24h" | "7d" | "30d" | "all"
  if (!iso) return false;
  if (mode === "all") return true;
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = now - t;
  if (Number.isNaN(t)) return false;
  if (mode === "24h") return diff <= 24 * 60 * 60 * 1000;
  if (mode === "7d") return diff <= 7 * 24 * 60 * 60 * 1000;
  if (mode === "30d") return diff <= 30 * 24 * 60 * 60 * 1000;
  return true;
}

function sumCredits(users) {
  return (users || []).reduce((acc, u) => acc + (Number(u.credits) || 0), 0);
}

// ===================== auth fetch =====================
async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.body && !options.headers?.["Content-Type"] ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res;
}

// ===================== UI primitives =====================
const styles = {
  page: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
    background: "#f6f7fb",
    minHeight: "100vh",
    color: "#0f172a",
  },
  shell: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    minHeight: "100vh",
  },
  aside: {
    background: "#fff",
    borderRight: "1px solid #e5e7eb",
    padding: 18,
  },
  main: {
    padding: 28,
  },
  brand: {
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: -0.6,
    marginBottom: 18,
  },
  badgeSaas: {
    marginLeft: 10,
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    fontWeight: 800,
    color: "#0f172a",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 22px 50px rgba(0,0,0,.08)",
  },
  cardHeader: {
    padding: 18,
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardBody: {
    padding: 18,
  },
  h1: { fontSize: 34, fontWeight: 950, letterSpacing: -0.8, margin: 0 },
  subtitle: { color: "#64748b", marginTop: 8, fontSize: 14 },
  pill: (tone) => {
    const map = {
      indigo: { bg: "#eef2ff", fg: "#3730a3", bd: "#c7d2fe" },
      cyan: { bg: "#ecfeff", fg: "#155e75", bd: "#a5f3fc" },
      green: { bg: "#f0fdf4", fg: "#166534", bd: "#bbf7d0" },
      red: { bg: "#fef2f2", fg: "#7f1d1d", bd: "#fecaca" },
      gray: { bg: "#f8fafc", fg: "#0f172a", bd: "#e5e7eb" },
      purple: { bg: "#f5f3ff", fg: "#5b21b6", bd: "#ddd6fe" },
    };
    const c = map[tone] || map.gray;
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      padding: "6px 10px",
      borderRadius: 999,
      border: `1px solid ${c.bd}`,
      background: c.bg,
      color: c.fg,
      fontWeight: 800,
      lineHeight: 1,
      whiteSpace: "nowrap",
    };
  },
  btn: (variant = "primary") => {
    const base = {
      borderRadius: 14,
      padding: "10px 14px",
      fontWeight: 900,
      cursor: "pointer",
      border: "1px solid transparent",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      justifyContent: "center",
      userSelect: "none",
    };
    const v = {
      primary: { background: "#4f46e5", color: "#fff" },
      soft: { background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe" },
      ghost: { background: "#fff", color: "#0f172a", border: "1px solid #e5e7eb" },
      danger: { background: "#ef4444", color: "#fff" },
    };
    return { ...base, ...(v[variant] || v.primary) };
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    background: "#fff",
  },
  label: { fontSize: 12, fontWeight: 900, marginBottom: 6, color: "#0f172a" },
  sectionTitle: { fontSize: 12, color: "#64748b", fontWeight: 900, margin: "18px 0 10px" },
  navBtn: (active) => ({
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: active ? "#4f46e5" : "#fff",
    color: active ? "#fff" : "#0f172a",
    fontWeight: 950,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
  }),
};

// ===================== Toast =====================
function Toast({ toast, onClose }) {
  if (!toast) return null;

  const typeStyles = {
    success: { border: "#22c55e", bg: "#f0fdf4", title: "#166534" },
    error: { border: "#ef4444", bg: "#fef2f2", title: "#7f1d1d" },
    info: { border: "#6366f1", bg: "#eef2ff", title: "#312e81" },
  };
  const s = typeStyles[toast.type || "info"];

  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, width: 380, zIndex: 9999 }}>
      <div
        style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          borderRadius: 14,
          padding: 14,
          boxShadow: "0 18px 40px rgba(0,0,0,.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 950, color: s.title, marginBottom: 4 }}>{toast.title}</div>
            <div style={{ fontSize: 13, color: "#111827", opacity: 0.9, lineHeight: 1.4 }}>
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

// ===================== Modal =====================
function Modal({ open, title, subtitle, children, onClose }) {
  if (!open) return null;
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, .45)",
        zIndex: 9998,
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(680px, 100%)",
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          boxShadow: "0 30px 80px rgba(0,0,0,.22)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 18, borderBottom: "1px solid #eef2f7" }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>{title}</div>
          {subtitle ? <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>{subtitle}</div> : null}
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

// ===================== Small components =====================
function StatCard({ title, value, icon }) {
  return (
    <div
      style={{
        ...styles.card,
        padding: 18,
        borderRadius: 18,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: -0.6, marginTop: 10 }}>{value}</div>
      </div>
      <div style={{ fontSize: 18, opacity: 0.8 }}>{icon}</div>
    </div>
  );
}

function PdfButton({ state, onClick }) {
  // state: "ready" | "downloading" | "success" | "error"
  const map = {
    ready: { text: "PDF", variant: "soft" },
    downloading: { text: "Descargando…", variant: "ghost" },
    success: { text: "OK", variant: "soft" },
    error: { text: "Error", variant: "danger" },
  };
  const s = map[state] || map.ready;
  return (
    <button onClick={onClick} style={styles.btn(s.variant)} disabled={state === "downloading"}>
      {s.text}
    </button>
  );
}

// ===================== APP =====================
export default function App() {
  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (t) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // Session/user
  const [me, setMe] = useState(null);
  const isLogged = !!me;
  const isAdmin = me?.role === "admin";
  const isSuperAdmin = me?.email === "irvingestray@gmail.com";

  // Login form
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");

  // Navigation
  const [view, setView] = useState("consultar"); // consultar | dashboard | users | logs | creditlogs | createuser
  const [refreshTick, setRefreshTick] = useState(0);

  // Consult flow
  const [step, setStep] = useState("cards"); // cards | form
  const [type, setType] = useState("semanas"); // semanas | asignacion(local "nss") | vigencia | noderecho
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState([]); // [{fileId, filename, expiresAt}]
  const [downloadState, setDownloadState] = useState({}); // { [fileId]: "ready"|"downloading"|"success"|"error" }

  // Admin data
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [creditLogs, setCreditLogs] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingCreditLogs, setLoadingCreditLogs] = useState(false);

  // Filters (logs)
  const [logType, setLogType] = useState("all"); // all|semanas|asignacion|vigencia|noderecho
  const [logRange, setLogRange] = useState("7d"); // 24h|7d|30d|all
  const [logEmail, setLogEmail] = useState("");
  const [applyFiltersKey, setApplyFiltersKey] = useState(0);

  // Filters (credit logs)
  const [creditEmail, setCreditEmail] = useState("");

  // Users search
  const [userSearch, setUserSearch] = useState("");

  // Create user modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState("user"); // user|admin (solo superadmin debería crear admins, pero UI lo permite si isSuperAdmin)

  // Credits modal
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsTarget, setCreditsTarget] = useState(null); // user object
  const [creditsAmount, setCreditsAmount] = useState(10);
  const [creditsNote, setCreditsNote] = useState("");

  // ENV sanity check (te ayuda cuando Vercel inyecta mal env)
  useEffect(() => {
    if (!BACKEND_URL || String(BACKEND_URL).includes("undefined")) {
      console.error("VITE_BACKEND_URL está mal:", BACKEND_URL);
      showToast({
        type: "error",
        title: "Config incorrecta",
        message: "VITE_BACKEND_URL está vacío/undefined. Revisa variables en Vercel.",
      });
    }
  }, []);

  // Load session (token)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    (async () => {
      try {
        // mínimo: credits/me para validar token
        const res = await authFetch("/api/credits/me");
        if (res.status === 401) {
          localStorage.removeItem("token");
          setMe(null);
          return;
        }
        const data = await safeJson(res);
        // si tu backend no tiene endpoint /me, dejamos esto como sesión activa
        setMe((prev) => prev || { email: "sesión activa", role: "user", credits: data.credits ?? 0 });
      } catch {
        // ignore
      }
    })();
  }, []);

  // Login / Logout
  const onLogin = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "Login fallido", message: data.message || `HTTP ${res.status}` });
        return;
      }
      localStorage.setItem("token", data.token);
      setMe(data.user);
      showToast({ type: "success", title: "Sesión iniciada", message: "Bienvenido 👋" });
      setView("consultar");
      setStep("cards");
      setGeneratedFiles([]);
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
    setGeneratedFiles([]);
    setStep("cards");
    setView("consultar");
    showToast({ type: "info", title: "Sesión cerrada", message: "Hasta luego." });
  };

  // Refresh all
  const refreshAll = () => setRefreshTick((x) => x + 1);

  // Fetch data for admin panels
  useEffect(() => {
    if (!isLogged) return;

    // refresh credits always
    (async () => {
      try {
        const r = await authFetch("/api/credits/me");
        if (r.status === 401) return;
        const d = await safeJson(r);
        setMe((m) => (m ? { ...m, credits: d.credits ?? m.credits } : m));
      } catch {
        // ignore
      }
    })();

    // Users (admin)
    if (isAdmin) {
      (async () => {
        setLoadingUsers(true);
        try {
          const r = await authFetch("/api/users");
          const d = await safeJson(r);
          if (r.status === 401) {
            localStorage.removeItem("token");
            setMe(null);
            return;
          }
          setUsers(d.users || []);
        } catch {
          // ignore
        } finally {
          setLoadingUsers(false);
        }
      })();

      // Logs consultas
      (async () => {
        setLoadingLogs(true);
        try {
          const r = await authFetch("/api/logs");
          const d = await safeJson(r);
          if (r.status === 401) {
            localStorage.removeItem("token");
            setMe(null);
            return;
          }
          // tu routeslogs devuelve array directamente
          setLogs(Array.isArray(d) ? d : d.logs || []);
        } catch {
          // ignore
        } finally {
          setLoadingLogs(false);
        }
      })();

      // Credit logs
      (async () => {
        setLoadingCreditLogs(true);
        try {
          const r = await authFetch("/api/creditlogs");
          const d = await safeJson(r);
          if (r.status === 401) {
            localStorage.removeItem("token");
            setMe(null);
            return;
          }
          setCreditLogs(d.logs || []);
        } catch {
          // ignore
        } finally {
          setLoadingCreditLogs(false);
        }
      })();
    } else {
      // user normal: logs/me
      (async () => {
        setLoadingLogs(true);
        try {
          const r = await authFetch("/api/logs/me");
          const d = await safeJson(r);
          setLogs(Array.isArray(d) ? d : d.logs || []);
        } catch {
          // ignore
        } finally {
          setLoadingLogs(false);
        }
      })();
    }
  }, [isLogged, isAdmin, refreshTick]);

  // Consult helpers
  const typeLabel = useMemo(() => {
    if (type === "semanas") return "Semanas cotizadas";
    if (type === "asignacion") return "Asignación / Localización NSS";
    if (type === "vigencia") return "Vigencia de derechos";
    if (type === "noderecho") return "No derechohabiencia";
    return type;
  }, [type]);

  const validateConsult = () => {
    const c = curp.trim().toUpperCase();
    const n = nss.trim();

    // CURP básica: 18
    if (!/^[A-Z0-9]{18}$/.test(c)) {
      showToast({ type: "error", title: "CURP inválida", message: "Debe tener 18 caracteres (letras/números)." });
      return false;
    }

    // semanas/vigencia requieren NSS
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
        showToast({ type: "info", title: "Nada que pegar", message: "Copia una CURP (18) o NSS (11)." });
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
        message: "Tu navegador bloqueó el portapapeles. Pega manualmente con Ctrl+V.",
      });
    }
  };

  const onGenerate = async () => {
    if (!validateConsult()) return;

    setGenerating(true);
    setGeneratedFiles([]);
    try {
      const payload = {
        type,
        curp: curp.trim().toUpperCase(),
        nss: nss.trim(),
      };

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
        // OJO: tú pediste que "Inconsistencia" NO quite créditos: eso es del backend.
        showToast({ type: "error", title: "Inconsistencia", message: data.message || "IMSS no devolvió PDF." });
        return;
      }

      const files = data.files || [];
      setGeneratedFiles(files);
      // set estado listo para cada file
      const initial = {};
      for (const f of files) initial[f.fileId] = "ready";
      setDownloadState(initial);

      showToast({ type: "success", title: "Documento(s) generado(s)", message: `Se generaron ${files.length} PDF(s).` });

      // refresh credits
      try {
        const r2 = await authFetch("/api/credits/me");
        const d2 = await safeJson(r2);
        setMe((m) => (m ? { ...m, credits: d2.credits ?? m.credits } : m));
      } catch {
        // ignore
      }

      // refresh dashboard counters/logs if admin
      refreshAll();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend (Render)." });
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = async (fileId, filename) => {
    setDownloadState((s) => ({ ...s, [fileId]: "downloading" }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/download/${fileId}`, {
        headers: {
          ...(localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {}),
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        setMe(null);
        showToast({ type: "info", title: "Sesión expirada", message: "Vuelve a iniciar sesión." });
        setDownloadState((s) => ({ ...s, [fileId]: "error" }));
        return;
      }

      if (!res.ok) {
        const data = await safeJson(res);
        showToast({ type: "error", title: "No se pudo descargar", message: data.message || `HTTP ${res.status}` });
        setDownloadState((s) => ({ ...s, [fileId]: "error" }));
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "documento.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setDownloadState((s) => ({ ...s, [fileId]: "success" }));
      setTimeout(() => setDownloadState((s) => ({ ...s, [fileId]: "ready" })), 1600);
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo descargar el archivo." });
      setDownloadState((s) => ({ ...s, [fileId]: "error" }));
    }
  };

  // Admin actions
  const resetPassword = async (userId) => {
    try {
      const res = await authFetch(`/api/users/${userId}/reset-password`, { method: "POST" });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo resetear", message: data.message || `HTTP ${res.status}` });
        return;
      }
      showToast({
        type: "success",
        title: "Password reseteado",
        message: `Nueva contraseña: ${data.newPassword}`,
      });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar." });
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
        showToast({ type: "error", title: "Error", message: data.message || `HTTP ${res.status}` });
        return;
      }
      showToast({ type: "success", title: "Actualizado", message: `${u.email} ${!u.disabled ? "deshabilitado" : "habilitado"}.` });
      refreshAll();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar." });
    }
  };

  const openCreditsModal = (u) => {
    setCreditsTarget(u);
    setCreditsAmount(10);
    setCreditsNote("");
    setCreditsOpen(true);
  };

  const grantCredits = async () => {
    if (!creditsTarget) return;
    const amount = Number(creditsAmount);
    if (!Number.isInteger(amount)) {
      showToast({ type: "error", title: "Amount inválido", message: "Debe ser entero (ej. 10 o -10)." });
      return;
    }
    try {
      const res = await authFetch(`/api/credits/grant`, {
        method: "POST",
        body: JSON.stringify({
          userId: creditsTarget.id,
          amount,
          note: creditsNote,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "Error", message: data.message || `HTTP ${res.status}` });
        return;
      }
      showToast({ type: "success", title: "Créditos actualizados", message: `${creditsTarget.email} (${data.user?.credits ?? "OK"})` });
      setCreditsOpen(false);
      refreshAll();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar." });
    }
  };

  const createUser = async () => {
    const em = newUserEmail.trim();
    if (em.length < 5) {
      showToast({ type: "error", title: "Email inválido", message: "Escribe un email válido." });
      return;
    }
    if (newUserPass.trim().length < 6) {
      showToast({ type: "error", title: "Password inválida", message: "Mínimo 6 caracteres." });
      return;
    }

    // Solo superadmin debería poder crear admins (UI)
    const role = isSuperAdmin ? newUserRole : "user";

    try {
      const res = await authFetch(`/api/users`, {
        method: "POST",
        body: JSON.stringify({ email: em, password: newUserPass, role }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo crear", message: data.message || `HTTP ${res.status}` });
        return;
      }
      showToast({ type: "success", title: "Usuario creado", message: `${data.user?.email || em}` });
      setCreateOpen(false);
      setNewUserEmail("");
      setNewUserPass("");
      setNewUserRole("user");
      refreshAll();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar." });
    }
  };

  // ===================== derived views =====================
  const usersFiltered = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return (users || []).filter((u) => String(u.email || "").toLowerCase().includes(q));
  }, [users, userSearch]);

  const logsFiltered = useMemo(() => {
    // se aplica cuando cambias applyFiltersKey (botón)
    // Para no recalcular cada tecla si no quieres, pero igual es light.
    const t = logType;
    const r = logRange;
    const em = logEmail.trim().toLowerCase();

    return (logs || [])
      .filter((l) => {
        if (t !== "all" && String(l.type) !== t) return false;
        if (!withinRange(l.createdAt, r)) return false;
        if (em && !String(l.email || "").toLowerCase().includes(em)) return false;
        return true;
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyFiltersKey, logs]);

  const creditLogsFiltered = useMemo(() => {
    const em = creditEmail.trim().toLowerCase();
    const list = (creditLogs || []).slice();
    if (!em) return list;
    return list.filter((x) => String(x.userEmail || "").toLowerCase().includes(em) || String(x.adminEmail || "").toLowerCase().includes(em));
  }, [creditLogs, creditEmail]);

  const dashboard = useMemo(() => {
    const totalUsers = (users || []).length;
    const totalCredits = sumCredits(users || []);
    const consultas24h = (logs || []).filter((l) => withinRange(l.createdAt, "24h")).length;

    const top = {};
    for (const l of (logs || []).filter((x) => withinRange(x.createdAt, "24h"))) {
      const k = String(l.type || "unknown");
      top[k] = (top[k] || 0) + 1;
    }
    const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6);

    return { totalUsers, totalCredits, consultas24h, topList };
  }, [users, logs]);

  // ===================== UI sections =====================
  const Header = ({ title, desc, right }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 900 }}>DocuExpress</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14 }}>
        <div>
          <h1 style={styles.h1}>{title}</h1>
          {desc ? <div style={styles.subtitle}>{desc}</div> : null}
        </div>
        {right}
      </div>
    </div>
  );

  const SidebarSession = () => (
    <div style={{ padding: 14, border: "1px solid #eef2ff", background: "#f8fafc", borderRadius: 18 }}>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6, fontWeight: 900 }}>Sesión</div>
      <div style={{ fontWeight: 950 }}>{me.email}</div>

      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={styles.pill(me.role === "admin" ? "indigo" : "cyan")}>{me.role === "admin" ? "Admin" : "User"}</span>
        {isSuperAdmin ? <span style={styles.pill("purple")}>Super Admin</span> : null}
        <span style={styles.pill("cyan")}>{me.credits ?? 0} créditos</span>
      </div>

      <button onClick={onLogout} style={{ ...styles.btn("ghost"), width: "100%", marginTop: 12 }}>
        Cerrar sesión
      </button>
    </div>
  );

  const SidebarLogin = () => (
    <div style={{ padding: 14, border: "1px solid #e5e7eb", background: "#fff", borderRadius: 18 }}>
      <div style={{ fontWeight: 950, marginBottom: 10 }}>Iniciar sesión</div>

      <div style={{ marginBottom: 10 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={styles.input}
          autoComplete="username"
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          type="password"
          style={styles.input}
          autoComplete="current-password"
        />
      </div>

      <button onClick={onLogin} style={{ ...styles.btn("primary"), width: "100%" }}>
        Iniciar sesión
      </button>

      <div style={{ marginTop: 12, fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
        <b>Demo:</b>
        <div>Admin: admin@docuexpress.com / Admin123!</div>
        <div>Cliente: cliente@docuexpress.com / Cliente123!</div>
      </div>
    </div>
  );

  const Sidebar = () => (
    <aside style={styles.aside}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={styles.brand}>
          Docu<span style={{ color: "#4f46e5" }}>Express</span>
        </div>
        <span style={styles.badgeSaas}>SaaS</span>
      </div>

      {isLogged ? <SidebarSession /> : <SidebarLogin />}

      <div style={{ marginTop: 18 }}>
        <div style={styles.sectionTitle}>Menú</div>

        <button style={styles.navBtn(view === "consultar")} onClick={() => setView("consultar")}>
          🔎 <span>CONSULTAR</span>
        </button>

        {isLogged && isAdmin ? (
          <>
            <button style={styles.navBtn(view === "dashboard")} onClick={() => setView("dashboard")}>
              📊 <span>Dashboard</span>
            </button>
            <button style={styles.navBtn(view === "users")} onClick={() => setView("users")}>
              👤 <span>Usuarios</span>
            </button>
            <button style={styles.navBtn(view === "logs")} onClick={() => setView("logs")}>
              🧾 <span>Logs de consultas</span>
            </button>
            <button style={styles.navBtn(view === "creditlogs")} onClick={() => setView("creditlogs")}>
              💳 <span>Logs de créditos</span>
            </button>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <button style={styles.navBtn(false)} onClick={() => setCreateOpen(true)}>
                ➕ <span>Crear usuario</span>
              </button>

              <button style={{ ...styles.navBtn(false), justifyContent: "center" }} onClick={refreshAll}>
                🔄 <span>Actualizar</span>
              </button>
            </div>
          </>
        ) : null}

        <div style={{ marginTop: 14, fontSize: 12, color: "#64748b" }}>
          Backend: <b>{BACKEND_URL}</b>
        </div>
      </div>
    </aside>
  );

  // ===================== views =====================
  const ConsultView = () => (
    <>
      <Header
        title="Consultar"
        desc="Genera documentos del IMSS. Los PDFs se guardan por 24 horas y se descargan desde tu panel."
        right={<span style={styles.pill("gray")}>PDFs duran 24h</span>}
      />

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={{ fontWeight: 950, letterSpacing: -0.3, fontSize: 18 }}>CONSULTAR</div>
            <div style={{ color: "#64748b", fontSize: 13 }}>Elige el trámite, captura datos y genera el PDF.</div>
          </div>
          <span style={styles.pill("gray")}>PDFs duran 24h</span>
        </div>

        <div style={styles.cardBody}>
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
                  key: "asignacion",
                  title: "Asignación / Localización NSS",
                  desc: "Genera documentos de NSS (puede devolver 2 PDFs).",
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
                  badge: "Solo CURP (según proveedor)",
                },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setType(c.key);
                    setStep("form");
                    setGeneratedFiles([]);
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
                  <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.4 }}>{c.desc}</div>
                  <div style={{ marginTop: 12 }}>
                    <span style={styles.pill("gray")}>{c.badge}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  Trámite: <b style={{ color: "#0f172a" }}>{typeLabel}</b>
                </div>
                <button onClick={() => setStep("cards")} style={styles.btn("ghost")}>
                  ← Atrás
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={styles.label}>CURP</div>
                  <input
                    value={curp}
                    onChange={(e) => setCurp(e.target.value.toUpperCase())}
                    placeholder="Ej. MAGC790705HTLRNR03"
                    style={styles.input}
                  />
                </div>

                <div>
                  <div style={styles.label}>
                    NSS {type === "semanas" || type === "vigencia" ? "(obligatorio)" : "(opcional)"}
                  </div>
                  <input
                    value={nss}
                    onChange={(e) => setNss(e.target.value)}
                    placeholder={type === "semanas" || type === "vigencia" ? "11 dígitos" : "Opcional"}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <button onClick={pasteCurpNss} style={styles.btn("ghost")}>
                  📋 Pegar CURP/NSS
                </button>

                <button onClick={onGenerate} disabled={!isLogged || generating} style={styles.btn(generating ? "ghost" : "primary")}>
                  {generating ? "Generando…" : "Generar documento"}
                </button>
              </div>

              <div style={{ marginTop: 16, borderTop: "1px solid #eef2f7", paddingTop: 14 }}>
                {generatedFiles.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 13 }}>
                    Aquí aparecerán los PDFs para descargar cuando generes un documento.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {generatedFiles.map((f) => (
                      <div
                        key={f.fileId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: 12,
                          borderRadius: 16,
                          border: "1px solid #e5e7eb",
                          background: "#f8fafc",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {f.filename || "documento.pdf"}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                            {f.expiresAt ? `Expira: ${formatDate(f.expiresAt)}` : "* Si ya pasó 24h, el backend pudo haberlo borrado."}
                          </div>
                        </div>

                        <PdfButton
                          state={downloadState[f.fileId] || "ready"}
                          onClick={() => downloadFile(f.fileId, f.filename)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const DashboardView = () => (
    <>
      <Header title="Dashboard" desc="Resumen rápido de tu operación." right={<button style={styles.btn("ghost")} onClick={refreshAll}>↻ Actualizar</button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard title="Usuarios" value={loadingUsers ? "—" : String(dashboard.totalUsers)} icon="👥" />
        <StatCard title="Créditos totales" value={loadingUsers ? "—" : String(dashboard.totalCredits)} icon="💳" />
        <StatCard title="Consultas 24h" value={loadingLogs ? "—" : String(dashboard.consultas24h)} icon="🧾" />
        <StatCard title="Rol" value={isSuperAdmin ? "Super Admin" : "Admin"} icon="🛡️" />
      </div>

      <div style={{ ...styles.card, marginTop: 16 }}>
        <div style={styles.cardHeader}>
          <div>
            <div style={{ fontWeight: 950 }}>Top trámites (24h)</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>Los trámites más utilizados en las últimas 24 horas.</div>
          </div>
          <button style={styles.btn("ghost")} onClick={refreshAll}>↻ Actualizar</button>
        </div>
        <div style={styles.cardBody}>
          {dashboard.topList.length === 0 ? (
            <div style={{ color: "#64748b" }}>Sin datos aún (haz algunas consultas).</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {dashboard.topList.map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={styles.pill("gray")}>{k}</span>
                    <span style={{ color: "#64748b", fontSize: 13 }}>Solicitudes</span>
                  </div>
                  <div style={{ fontWeight: 950 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const UsersView = () => (
    <>
      <Header title="Usuarios" desc="Como admin solo ves tus usuarios." />

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={{ fontWeight: 950 }}>Usuarios</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>
              Gestiona usuarios, deshabilita, resetea password y asigna créditos.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Buscar email..."
              style={{ ...styles.input, width: 220 }}
            />
            <button style={styles.btn("ghost")} onClick={refreshAll} title="Refrescar">↻</button>
            <button style={styles.btn("primary")} onClick={() => setCreateOpen(true)}>
              ➕ Crear
            </button>
          </div>
        </div>

        <div style={styles.cardBody}>
          {loadingUsers ? (
            <div style={{ color: "#64748b" }}>Cargando usuarios…</div>
          ) : usersFiltered.length === 0 ? (
            <div style={{ color: "#64748b" }}>No hay usuarios.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {usersFiltered.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.email}
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
                      <span style={styles.pill(u.role === "admin" ? "indigo" : "cyan")}>{u.role}</span>
                      <span style={styles.pill(u.disabled ? "red" : "green")}>{u.disabled ? "Inactivo" : "Activo"}</span>
                      <span style={styles.pill("gray")}>Créditos: {u.credits ?? 0}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button style={styles.btn("ghost")} onClick={() => openCreditsModal(u)}>💳 Créditos</button>
                    <button style={styles.btn("ghost")} onClick={() => resetPassword(u.id)}>🔑 Reset</button>
                    <button style={styles.btn(u.disabled ? "soft" : "ghost")} onClick={() => toggleDisabled(u)}>
                      ⛔ {u.disabled ? "Habilitar" : "Deshabilitar"}
                    </button>

                    {/* Si quieres cambiar rol solo para superadmin (UI) */}
                    {isSuperAdmin ? (
                      <button
                        style={styles.btn("ghost")}
                        onClick={async () => {
                          const nextRole = u.role === "admin" ? "user" : "admin";
                          try {
                            const res = await authFetch(`/api/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ role: nextRole }) });
                            const data = await safeJson(res);
                            if (!res.ok) {
                              showToast({ type: "error", title: "Error", message: data.message || `HTTP ${res.status}` });
                              return;
                            }
                            showToast({ type: "success", title: "Rol actualizado", message: `${u.email} → ${nextRole}` });
                            refreshAll();
                          } catch {
                            showToast({ type: "error", title: "Error de red", message: "No se pudo conectar." });
                          }
                        }}
                      >
                        🛡️ Rol
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const LogsView = () => (
    <>
      <Header
        title="Logs de consultas"
        desc="Filtra por tipo, fechas y email."
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={styles.pill("indigo")}>{isSuperAdmin ? "Super Admin" : "Admin"}</span>
            <button style={styles.btn("ghost")} onClick={refreshAll}>Refrescar</button>
          </div>
        }
      />

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={{ fontWeight: 950 }}>Consultas</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>Logs globales (con scope por rol).</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              style={styles.btn("ghost")}
              onClick={() => {
                setApplyFiltersKey((x) => x + 1);
              }}
            >
              Aplicar filtros
            </button>
            <button
              style={styles.btn("ghost")}
              onClick={() => {
                setLogType("all");
                setLogRange("7d");
                setLogEmail("");
                setApplyFiltersKey((x) => x + 1);
              }}
            >
              Limpiar
            </button>
          </div>
        </div>

        <div style={styles.cardBody}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={styles.label}>Tipo</div>
              <select value={logType} onChange={(e) => setLogType(e.target.value)} style={styles.input}>
                <option value="all">Todos</option>
                <option value="semanas">semanas</option>
                <option value="asignacion">asignacion</option>
                <option value="vigencia">vigencia</option>
                <option value="noderecho">noderecho</option>
              </select>
            </div>
            <div>
              <div style={styles.label}>Rango rápido</div>
              <select value={logRange} onChange={(e) => setLogRange(e.target.value)} style={styles.input}>
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="all">Todo</option>
              </select>
            </div>
            <div>
              <div style={styles.label}>Buscar por email</div>
              <input value={logEmail} onChange={(e) => setLogEmail(e.target.value)} placeholder="correo@..." style={styles.input} />
            </div>
          </div>

          {loadingLogs ? (
            <div style={{ color: "#64748b" }}>Cargando logs…</div>
          ) : logsFiltered.length === 0 ? (
            <div style={{ color: "#64748b" }}>Sin logs para esos filtros.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {logsFiltered.slice(0, 60).map((l) => {
                const count = (l.files || []).length;
                const curpChip = l.curp ? String(l.curp).slice(0, 18) : "";
                return (
                  <div key={l.id} style={{ padding: 14, borderRadius: 18, border: "1px solid #e5e7eb", background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontWeight: 950 }}>{l.email}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{formatDate(l.createdAt)}</div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                      <span style={styles.pill("gray")}>{l.type}</span>
                      {curpChip ? <span style={styles.pill("cyan")}>{curpChip}</span> : null}
                      {l.nss ? <span style={styles.pill("gray")}>{l.nss}</span> : null}
                      <span style={styles.pill("green")}>{count} PDF(s)</span>
                    </div>

                    {/* Archivos */}
                    <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                      {(l.files || []).map((f) => (
                        <div
                          key={f.fileId}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            padding: 12,
                            borderRadius: 16,
                            border: "1px solid #e5e7eb",
                            background: "#f8fafc",
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 950, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {f.filename || "documento.pdf"}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                              {f.expiresAt ? `Expira: ${formatDate(f.expiresAt)}` : "* Si ya pasó 24h, el backend pudo haberlo borrado."}
                            </div>
                          </div>

                          <PdfButton state={downloadState[f.fileId] || "ready"} onClick={() => downloadFile(f.fileId, f.filename)} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {logsFiltered.length > 60 ? (
                <div style={{ fontSize: 12, color: "#64748b" }}>Mostrando 60 de {logsFiltered.length} (para performance).</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const CreditLogsView = () => (
    <>
      <Header title="Logs de créditos" desc="Historial de otorgamientos y ajustes de créditos." />

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <div style={{ fontWeight: 950 }}>Créditos</div>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 6 }}>Registros de cambios de créditos.</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              value={creditEmail}
              onChange={(e) => setCreditEmail(e.target.value)}
              placeholder="Filtrar por email..."
              style={{ ...styles.input, width: 220 }}
            />
            <button style={styles.btn("ghost")} onClick={refreshAll}>↻</button>
          </div>
        </div>

        <div style={styles.cardBody}>
          {loadingCreditLogs ? (
            <div style={{ color: "#64748b" }}>Cargando logs de créditos…</div>
          ) : creditLogsFiltered.length === 0 ? (
            <div style={{ color: "#64748b" }}>Sin logs de créditos.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {creditLogsFiltered.slice(0, 80).map((x) => (
                <div key={x.id} style={{ padding: 14, borderRadius: 18, border: "1px solid #e5e7eb", background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 950, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {x.userEmail}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{formatDate(x.createdAt)}</div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                    <span style={styles.pill("gray")}>Admin: {x.adminEmail}</span>
                    <span style={styles.pill(x.delta >= 0 ? "green" : "red")}>Δ {x.delta}</span>
                    <span style={styles.pill("cyan")}>
                      {x.before} → {x.after}
                    </span>
                    {x.note ? <span style={styles.pill("gray")}>Nota: {x.note}</span> : null}
                  </div>
                </div>
              ))}
              {creditLogsFiltered.length > 80 ? (
                <div style={{ fontSize: 12, color: "#64748b" }}>Mostrando 80 de {creditLogsFiltered.length} (para performance).</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );

  // ===================== render main =====================
  return (
    <div style={styles.page}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div style={styles.shell}>
        <Sidebar />

        <main style={styles.main}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            {!isLogged ? (
              <>
                <Header title="Consultar" desc="Inicia sesión para generar y descargar tus PDFs desde el panel." />
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  Si ya configuraste <b>VITE_BACKEND_URL</b> en Vercel, aquí debe apuntar a tu Render.
                </div>
              </>
            ) : (
              <>
                {view === "consultar" && <ConsultView />}
                {view === "dashboard" && isAdmin && <DashboardView />}
                {view === "users" && isAdmin && <UsersView />}
                {view === "logs" && <LogsView />}
                {view === "creditlogs" && isAdmin && <CreditLogsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create user modal */}
      <Modal
        open={createOpen}
        title="Crear usuario"
        subtitle={isSuperAdmin ? "Puedes crear users o admins." : "Como admin, crea usuarios (role=user)."}
        onClose={() => setCreateOpen(false)}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={styles.label}>Email</div>
            <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="correo@..." style={styles.input} />
          </div>
          <div>
            <div style={styles.label}>Password</div>
            <input value={newUserPass} onChange={(e) => setNewUserPass(e.target.value)} placeholder="mínimo 6" type="password" style={styles.input} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={styles.label}>Rol</div>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                style={styles.input}
                disabled={!isSuperAdmin}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              {!isSuperAdmin ? <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Solo Super Admin puede crear admins.</div> : null}
            </div>

            <div style={{ display: "grid", alignContent: "end" }}>
              <button onClick={createUser} style={styles.btn("primary")}>Crear</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Credits modal */}
      <Modal
        open={creditsOpen}
        title="Asignar créditos"
        subtitle={creditsTarget ? `Usuario: ${creditsTarget.email}` : ""}
        onClose={() => setCreditsOpen(false)}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={styles.label}>Amount (entero)</div>
              <input
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                placeholder="10 o -10"
                style={styles.input}
              />
            </div>
            <div>
              <div style={styles.label}>Nota (opcional)</div>
              <input value={creditsNote} onChange={(e) => setCreditsNote(e.target.value)} placeholder="motivo..." style={styles.input} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setCreditsOpen(false)} style={styles.btn("ghost")}>Cancelar</button>
            <button onClick={grantCredits} style={styles.btn("primary")}>Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
