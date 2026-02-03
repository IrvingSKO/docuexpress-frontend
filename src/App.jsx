import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * BACKEND_URL:
 * - toma VITE_BACKEND_URL si existe
 * - si no, usa Render por default
 */
const BACKEND_URL =
  (import.meta?.env?.VITE_BACKEND_URL && String(import.meta.env.VITE_BACKEND_URL).trim()) ||
  "https://docuexpress.onrender.com";

// ------------------ UI helpers ------------------
const styles = {
  app: {
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    background: "#f6f7fb",
    minHeight: "100vh",
  },
  shell: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    minHeight: "100vh",
  },
  sidebar: {
    padding: 18,
    borderRight: "1px solid #e5e7eb",
    background: "#fff",
  },
  brand: { fontSize: 22, fontWeight: 900, marginBottom: 18 },
  card: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 22px 50px rgba(0,0,0,.08)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: 18,
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardBody: { padding: 18 },
  h1: { fontSize: 30, fontWeight: 900, letterSpacing: -0.5, margin: 0 },
  subtle: { color: "#6b7280", fontSize: 13 },
  divider: { height: 1, background: "#eef2f7", margin: "12px 0" },
};

function Badge({ children, tone = "gray" }) {
  const map = {
    gray: { bg: "#f8fafc", bd: "#e5e7eb", tx: "#111827" },
    indigo: { bg: "#eef2ff", bd: "#c7d2fe", tx: "#3730a3" },
    cyan: { bg: "#ecfeff", bd: "#a5f3fc", tx: "#155e75" },
    green: { bg: "#f0fdf4", bd: "#bbf7d0", tx: "#166534" },
    red: { bg: "#fef2f2", bd: "#fecaca", tx: "#7f1d1d" },
  };
  const c = map[tone] || map.gray;
  return (
    <span
      style={{
        fontSize: 12,
        padding: "6px 10px",
        borderRadius: 999,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        color: c.tx,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, onClick, variant = "primary", disabled, style }) {
  const variants = {
    primary: {
      background: disabled ? "#9ca3af" : "#4f46e5",
      color: "#fff",
      border: "none",
    },
    ghost: {
      background: "#fff",
      color: "#111827",
      border: "1px solid #e5e7eb",
    },
    danger: {
      background: disabled ? "#fecaca" : "#ef4444",
      color: "#fff",
      border: "none",
    },
  };
  const v = variants[variant] || variants.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        ...v,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  rightHint,
  inputRef,
  name,
  autoComplete,
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          marginBottom: 6,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span>{label}</span>
        {rightHint ? <span style={{ color: "#6b7280", fontWeight: 700 }}>{rightHint}</span> : null}
      </div>

      <input
        ref={inputRef}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 14,
          border: "1px solid #e5e7eb",
          outline: "none",
          background: "#fff",
        }}
      />
    </div>
  );
}

// ------------------ Toasts ------------------
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
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, color: s.title, marginBottom: 4 }}>{toast.title}</div>
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

// ------------------ Download row ------------------
function DownloadButtonRow({ title, subtitle, onDownload }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
        borderRadius: 14,
        padding: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 900,
            color: "#0f172a",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={title}
        >
          {title}
        </div>
        {subtitle ? <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{subtitle}</div> : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 900,
            padding: "6px 10px",
            borderRadius: 999,
            background: "#fff",
            border: "1px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: 14 }}>📄</span> PDF
        </span>

        <Button onClick={onDownload} variant="primary">
          Descargar
        </Button>
      </div>
    </div>
  );
}

// ------------------ network helpers ------------------
async function safeJson(res) {
  const txt = await res.text();
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
  a.download = filename || "documento.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------------ main ------------------
export default function App() {
  // toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (t) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // env guard
  useEffect(() => {
    if (!BACKEND_URL || String(BACKEND_URL).includes("undefined")) {
      console.error("VITE_BACKEND_URL está mal:", BACKEND_URL);
      showToast({
        type: "error",
        title: "Config backend",
        message: "VITE_BACKEND_URL está mal configurada (sale undefined).",
      });
    }
  }, []);

  // Auth
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // UI nav
  const [view, setView] = useState("consultar"); // consultar | users | logs
  const [step, setStep] = useState("cards"); // cards | form

  // Consult
  const [type, setType] = useState("semanas"); // semanas | asignacion | vigencia | noderecho
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [generating, setGenerating] = useState(false);
  const [files, setFiles] = useState([]);

  // Admin
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Credits modal input (entero)
  const [creditsModal, setCreditsModal] = useState({ open: false, user: null, value: "" });

  const isLogged = !!me;

  // --- load session if token exists ---
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
        // si el backend no devuelve usuario completo aquí, al menos deja créditos
        setMe((prev) => prev || { email: "Sesión activa", role: "user", credits: d.credits ?? 0 });
      } catch {
        // ignore
      }
    })();
  }, []);

  // --- login ---
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

      // limpiar inputs (opcional)
      setPassword("");
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    }
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    setMe(null);
    setUsers([]);
    setLogs([]);
    setFiles([]);
    setStep("cards");
    setView("consultar");
    showToast({ type: "info", title: "Sesión cerrada", message: "Hasta luego." });
  };

  // --- validate ---
  const validate = () => {
    const c = curp.trim().toUpperCase();
    const n = nss.trim();

    if (!/^[A-Z0-9]{18}$/.test(c)) {
      showToast({
        type: "error",
        title: "CURP inválida",
        message: "Debe tener 18 caracteres (letras/números).",
      });
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

  // --- paste ---
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
        message: `Pegado: ${foundCurp ? "CURP" : ""}${foundCurp && foundNss ? " + " : ""}${
          foundNss ? "NSS" : ""
        }`,
      });
    } catch {
      showToast({
        type: "error",
        title: "Portapapeles bloqueado",
        message: "Tu navegador bloqueó el portapapeles. Usa Ctrl+V manualmente.",
      });
    }
  };

  // --- generate ---
  const onGenerate = async () => {
    if (!validate()) return;

    setGenerating(true);
    setFiles([]);

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
        // backend debe mandar "Inconsistencia" sin descontar créditos
        showToast({
          type: "error",
          title: data.message === "Inconsistencia" ? "Inconsistencia" : "Error",
          message: data.message || "IMSS no devolvió PDF. Intenta de nuevo.",
        });
        return;
      }

      if (data.files?.length) {
        setFiles(data.files);
        showToast({
          type: "success",
          title: "Documento(s) generado(s)",
          message: `Listo. Se generaron ${data.files.length} PDF(s).`,
        });
      } else {
        showToast({ type: "error", title: "Respuesta inválida", message: "No llegaron files del backend." });
      }

      // refrescar créditos
      try {
        const r2 = await authFetch("/api/credits/me");
        const d2 = await safeJson(r2);
        setMe((m) => (m ? { ...m, credits: d2.credits ?? m.credits } : m));
      } catch {
        // ignore
      }
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend (Render)." });
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = async (fileId, filename) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/download/${fileId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        setMe(null);
        showToast({ type: "info", title: "Sesión expirada", message: "Vuelve a iniciar sesión." });
        return;
      }

      if (!res.ok) {
        const d = await safeJson(res);
        showToast({ type: "error", title: "No se pudo descargar", message: d.message || `HTTP ${res.status}` });
        return;
      }

      const blob = await res.blob();
      downloadBlob(blob, filename || "documento.pdf");
      showToast({ type: "success", title: "Descarga iniciada", message: filename || "documento.pdf" });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo descargar el archivo." });
    }
  };

  const filenameFallback = useMemo(() => {
    const c = curp.trim().toUpperCase();
    if (!c) return "documento.pdf";
    return `${type}_${c}.pdf`.toLowerCase();
  }, [type, curp]);

  // --- Admin load ---
  const loadAdmin = async () => {
    if (!me || me.role !== "admin") return;
    setRefreshing(true);
    try {
      const rU = await authFetch("/api/users");
      const dU = await safeJson(rU);
      if (rU.ok) setUsers(dU || []);

      const rL = await authFetch("/api/logs");
      const dL = await safeJson(rL);
      if (rL.ok) setLogs(dL || []);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (me?.role === "admin") loadAdmin();
  }, [me]);

  // --- reset password ---
  const resetPassword = async (userId) => {
    try {
      const res = await authFetch(`/api/users/${userId}/reset-password`, { method: "POST" });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo resetear." });
        return;
      }
      showToast({
        type: "success",
        title: "Password reseteado",
        message: `Nueva contraseña: ${data.newPassword}`,
      });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    }
  };

  // --- set credits (entero) ---
  const setCredits = async (userId, amount) => {
    // amount = entero (positivo o negativo) en tu backend
    try {
      const res = await authFetch(`/api/credits/${userId}`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "Error", message: data.message || "No se pudo actualizar." });
        return;
      }
      showToast({ type: "success", title: "Créditos actualizados", message: "Listo ✅" });
      await loadAdmin();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    }
  };

  // Modal credits helpers
  const openCreditsModal = (u) => setCreditsModal({ open: true, user: u, value: "" });
  const closeCreditsModal = () => setCreditsModal({ open: false, user: null, value: "" });
  const applyCreditsModal = async () => {
    const raw = String(creditsModal.value || "").trim();
    if (!/^-?\d+$/.test(raw)) {
      showToast({ type: "error", title: "Valor inválido", message: "Solo enteros (ej. 10, -5, 100)." });
      return;
    }
    const n = parseInt(raw, 10);
    await setCredits(creditsModal.user.id, n);
    closeCreditsModal();
  };

  // ------------------ LOGIN screen ------------------
  if (!isLogged) {
    return (
      <div style={styles.app}>
        <Toast toast={toast} onClose={() => setToast(null)} />

        <div style={{ maxWidth: 520, margin: "0 auto", padding: 28 }}>
          <div style={{ ...styles.brand, marginTop: 18 }}>
            Docu<span style={{ color: "#4f46e5" }}>Express</span>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Iniciar sesión</div>
                <div style={styles.subtle}>Accede al panel</div>
              </div>
              <Badge tone="indigo">SaaS</Badge>
            </div>

            <div style={styles.cardBody}>
              <Input
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@docuexpress.com"
                inputRef={emailRef}
                name="email"
                autoComplete="username"
              />

              <div style={{ height: 10 }} />

              <Input
                label="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // ✅ evita perder foco si hay re-render
                  requestAnimationFrame(() => passwordRef.current?.focus());
                }}
                placeholder="Tu contraseña"
                type="password"
                rightHint="(seed: Admin123!)"
                inputRef={passwordRef}
                name="password"
                autoComplete="current-password"
              />

              <div style={{ height: 12 }} />

              <Button
                onClick={onLogin}
                variant="primary"
                style={{ width: "100%", padding: 12, borderRadius: 14 }}
              >
                Entrar
              </Button>

              <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280" }}>
                Backend: <b>{BACKEND_URL}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------ main UI ------------------
  const menuItemStyle = (active) => ({
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: active ? "#4f46e5" : "#fff",
    color: active ? "#fff" : "#111827",
    fontWeight: 900,
    cursor: "pointer",
  });

  const consultCards = [
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
  ];

  const filteredLogs = (logs || [])
    .filter((l) => {
      const q = logSearch.trim().toLowerCase();
      if (!q) return true;
      return String(l.email || "").toLowerCase().includes(q);
    })
    .slice()
    .reverse();

  return (
    <div style={styles.app}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Credits modal */}
      {creditsModal.open ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 9998,
            padding: 16,
          }}
          onMouseDown={(e) => {
            // click fuera cierra
            if (e.target === e.currentTarget) closeCreditsModal();
          }}
        >
          <div
            style={{
              width: "min(520px, 95vw)",
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              boxShadow: "0 30px 70px rgba(0,0,0,.20)",
              overflow: "hidden",
            }}
          >
            <div style={{ ...styles.cardHeader }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Modificar créditos</div>
                <div style={styles.subtle}>{creditsModal.user?.email}</div>
              </div>
              <Button variant="ghost" onClick={closeCreditsModal}>
                Cerrar
              </Button>
            </div>

            <div style={styles.cardBody}>
              <Input
                label="Cantidad (enteros)"
                value={creditsModal.value}
                onChange={(e) => setCreditsModal((s) => ({ ...s, value: e.target.value }))}
                placeholder="Ej. 10, -5, 100"
                rightHint="Se suma (o resta) al usuario"
              />

              <div style={{ height: 12 }} />

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Button variant="ghost" onClick={closeCreditsModal}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={applyCreditsModal}>
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={styles.shell}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.brand}>
            Docu<span style={{ color: "#4f46e5" }}>Express</span>
          </div>

          <div style={{ padding: 14, border: "1px solid #eef2ff", background: "#f8fafc", borderRadius: 16 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Sesión</div>
            <div style={{ fontWeight: 900 }}>{me.email}</div>

            <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone="indigo">{me.role === "admin" ? "Admin" : "User"}</Badge>
              <Badge tone="cyan">{me.credits ?? 0} créditos</Badge>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <button
              onClick={() => setView("consultar")}
              style={menuItemStyle(view === "consultar")}
            >
              CONSULTAR
            </button>

            {me.role === "admin" ? (
              <>
                <button onClick={() => setView("users")} style={menuItemStyle(view === "users")}>
                  Usuarios
                </button>
                <button onClick={() => setView("logs")} style={menuItemStyle(view === "logs")}>
                  Logs
                </button>
              </>
            ) : null}

            <button
              onClick={onLogout}
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: 26 }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>DocuExpress</div>
              <h1 style={styles.h1}>{me.role === "admin" ? "Panel de Administración" : "Panel"}</h1>
            </div>

            {/* CONSULTAR */}
            {view === "consultar" ? (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ fontWeight: 900, letterSpacing: -0.3, fontSize: 18 }}>CONSULTAR</div>
                    <div style={styles.subtle}>Elige el trámite que deseas generar.</div>
                  </div>
                  <Badge tone="gray">PDFs duran 24h</Badge>
                </div>

                <div style={styles.cardBody}>
                  {step === "cards" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {consultCards.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => {
                            setType(c.key);
                            setStep("form");
                            setFiles([]);
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
                          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0px)")}
                        >
                          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>{c.title}</div>
                          <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.4 }}>{c.desc}</div>
                          <div style={{ marginTop: 12 }}>
                            <Badge tone="gray">{c.badge}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ color: "#6b7280", fontSize: 13 }}>
                          Trámite:{" "}
                          <b style={{ color: "#111827" }}>
                            {type === "semanas"
                              ? "Semanas cotizadas"
                              : type === "asignacion"
                              ? "Asignación / Localización NSS"
                              : type === "vigencia"
                              ? "Vigencia de derechos"
                              : "No derechohabiencia"}
                          </b>
                        </div>
                        <Button variant="ghost" onClick={() => setStep("cards")}>
                          ← Atrás
                        </Button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <Input
                          label="CURP"
                          value={curp}
                          onChange={(e) => setCurp(e.target.value.toUpperCase())}
                          placeholder="Ej. MAGC790705HTLRNR03"
                        />

                        <Input
                          label={`NSS ${(type === "semanas" || type === "vigencia") ? "(obligatorio)" : "(opcional)"}`}
                          value={nss}
                          onChange={(e) => setNss(e.target.value)}
                          placeholder={(type === "semanas" || type === "vigencia") ? "11 dígitos" : "Opcional"}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Button variant="ghost" onClick={pasteCurpNss} style={{ padding: 12, borderRadius: 14 }}>
                          Pegar CURP/NSS
                        </Button>

                        <Button
                          variant="primary"
                          onClick={onGenerate}
                          disabled={generating}
                          style={{
                            padding: 12,
                            borderRadius: 14,
                            background: generating ? "#9ca3af" : "#4f46e5",
                          }}
                        >
                          {generating ? "Generando…" : "Generar documento"}
                        </Button>
                      </div>

                      {files?.length ? (
                        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                          {files.map((f, idx) => (
                            <DownloadButtonRow
                              key={f.fileId || idx}
                              title={f.filename || "documento.pdf"}
                              subtitle={f.expiresAt ? `Expira: ${f.expiresAt}` : "Disponible para descargar"}
                              onDownload={() => downloadFile(f.fileId, f.filename || filenameFallback)}
                            />
                          ))}
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            * Si ya pasó 24h, el backend puede haberlo borrado.
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* USERS (ADMIN) */}
            {view === "users" && me.role === "admin" ? (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ fontWeight: 900, letterSpacing: -0.3, fontSize: 18 }}>Usuarios</div>
                    <div style={styles.subtle}>Administración de usuarios y créditos.</div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Badge tone="indigo">Admin</Badge>
                    <Button variant="ghost" onClick={loadAdmin} disabled={refreshing}>
                      {refreshing ? "Refrescando…" : "Refrescar"}
                    </Button>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  {!users?.length ? (
                    <div style={{ color: "#6b7280" }}>No hay usuarios cargados.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {users.map((u) => (
                        <div
                          key={u.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 16,
                            padding: 14,
                            background: "#fff",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontWeight: 900 }}>{u.email}</div>
                              <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <Badge tone={u.role === "admin" ? "indigo" : "gray"}>
                                  {u.role === "admin" ? "Admin" : "User"}
                                </Badge>
                                <Badge tone="cyan">{u.credits ?? 0} créditos</Badge>
                                {u.disabled ? <Badge tone="red">Deshabilitado</Badge> : <Badge tone="green">Activo</Badge>}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                              <Button variant="ghost" onClick={() => {
                                setView("logs");
                                setLogSearch(u.email || "");
                              }}>
                                Ver logs
                              </Button>

                              <Button variant="ghost" onClick={() => resetPassword(u.id)}>
                                Reset pass
                              </Button>

                              <Button variant="primary" onClick={() => openCreditsModal(u)}>
                                Editar créditos
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* LOGS (ADMIN) */}
            {view === "logs" && me.role === "admin" ? (
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={{ fontWeight: 900, letterSpacing: -0.3, fontSize: 18 }}>Logs</div>
                    <div style={styles.subtle}>Historial de consultas y archivos generados.</div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge tone="indigo">Admin</Badge>
                    <Button variant="ghost" onClick={loadAdmin} disabled={refreshing}>
                      {refreshing ? "Refrescando…" : "Refrescar"}
                    </Button>
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <Input
                        label="Buscar logs por email"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="ej. cliente@docuexpress.com"
                      />
                    </div>
                    <div style={{ paddingTop: 18 }}>
                      <Badge tone="gray">{filteredLogs.length} log(s)</Badge>
                    </div>
                  </div>

                  {!filteredLogs.length ? (
                    <div style={{ color: "#6b7280" }}>No hay logs para mostrar.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                      {filteredLogs.map((l) => (
                        <div
                          key={l.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 16,
                            padding: 14,
                            background: "#fff",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontWeight: 900 }}>{l.email}</div>

                              <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <Badge tone="gray">{l.type}</Badge>
                                {l.curp ? <Badge tone="cyan">{l.curp}</Badge> : null}
                                {l.nss ? <Badge tone="gray">{l.nss}</Badge> : null}
                                <Badge tone="green">{(l.files?.length || 0)} PDF(s)</Badge>
                              </div>
                            </div>

                            <div style={{ color: "#6b7280", fontSize: 12 }}>
                              {l.createdAt || ""}
                            </div>
                          </div>

                          {l.files?.length ? (
                            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                              {l.files.map((f) => (
                                <DownloadButtonRow
                                  key={f.fileId}
                                  title={f.filename || "documento.pdf"}
                                  subtitle={f.expiresAt ? `Expira: ${f.expiresAt}` : ""}
                                  onDownload={() => downloadFile(f.fileId, f.filename)}
                                />
                              ))}
                              <div style={{ fontSize: 12, color: "#6b7280" }}>
                                * Si ya pasó 24h, el backend puede haberlo borrado.
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
