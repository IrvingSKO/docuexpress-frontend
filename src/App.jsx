import React, { useEffect, useMemo, useRef, useState } from "react";

const BACKEND_URL =
  (import.meta?.env?.VITE_BACKEND_URL && String(import.meta.env.VITE_BACKEND_URL).trim()) ||
  "https://docuexpress.onrender.com";

// ------------------ helpers ------------------
async function safeJson(res) {
  const txt = await res.text();
  try {
    return txt ? JSON.parse(txt) : {};
  } catch {
    return { message: txt || "Respuesta inválida del servidor" };
  }
}

async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  return res;
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

function onlyInt(str) {
  const s = String(str ?? "");
  // permite "-" al inicio y dígitos
  const cleaned = s.replace(/[^\d-]/g, "");
  // evitar múltiples "-"
  if (cleaned.includes("-")) {
    const first = cleaned.indexOf("-");
    return "-" + cleaned.slice(0, first) + cleaned.slice(first + 1).replace(/-/g, "");
  }
  return cleaned;
}

// ------------------ UI components ------------------
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
          borderLeft: `8px solid ${s.border}`,
          borderRadius: 14,
          padding: 14,
          boxShadow: "0 18px 40px rgba(0,0,0,.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 900, color: s.title, marginBottom: 4, letterSpacing: -0.2 }}>
              {toast.title}
            </div>
            <div style={{ fontSize: 13, color: "#111827", opacity: 0.92, lineHeight: 1.4 }}>
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

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, .55)",
        zIndex: 9998,
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 95vw)",
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          boxShadow: "0 30px 70px rgba(0,0,0,.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 900, letterSpacing: -0.3 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid #e5e7eb",
              background: "#fff",
              padding: "6px 10px",
              borderRadius: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Cerrar
          </button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

function Badge({ children, tone = "neutral" }) {
  const map = {
    neutral: { bg: "#f8fafc", bd: "#e5e7eb", tx: "#111827" },
    indigo: { bg: "#eef2ff", bd: "#c7d2fe", tx: "#3730a3" },
    cyan: { bg: "#ecfeff", bd: "#a5f3fc", tx: "#155e75" },
    red: { bg: "#fef2f2", bd: "#fecaca", tx: "#7f1d1d" },
    green: { bg: "#f0fdf4", bd: "#bbf7d0", tx: "#166534" },
  };
  const s = map[tone] || map.neutral;
  return (
    <span
      style={{
        fontSize: 12,
        padding: "5px 10px",
        borderRadius: 999,
        background: s.bg,
        border: `1px solid ${s.bd}`,
        color: s.tx,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {children}
    </span>
  );
}

// ------------------ main ------------------
export default function App() {
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (t) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // ENV sanity (te avisa si Vercel no tomó la variable)
  useEffect(() => {
    if (!BACKEND_URL || String(BACKEND_URL).includes("undefined")) {
      console.error("VITE_BACKEND_URL está mal:", BACKEND_URL);
      showToast({
        type: "error",
        title: "Config del backend",
        message: "VITE_BACKEND_URL está mal o no cargó. Revisa Vercel > Environment Variables.",
      });
    }
  }, []);

  // Auth
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState(null);

  // Navigation
  const [view, setView] = useState("consultar"); // consultar | users | logs
  const [step, setStep] = useState("cards"); // cards | form

  // Consult form
  // IMPORTANTE: backend usa "asignacion" (no "nss")
  const [type, setType] = useState("semanas"); // semanas | asignacion | vigencia | noderecho
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");

  const [generating, setGenerating] = useState(false);
  const [files, setFiles] = useState([]); // [{fileId, filename, expiresAt}]

  // Admin
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Modals
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Credits input per user (map)
  const [creditInput, setCreditInput] = useState({}); // { [userId]: "10" }
  const [userSearch, setUserSearch] = useState("");

  const isLogged = !!me;

  const trámites = useMemo(
    () => [
      { key: "semanas", title: "Semanas cotizadas", desc: "Constancia de semanas cotizadas en el IMSS.", badge: "CURP + NSS" },
      { key: "asignacion", title: "Asignación / Localización NSS", desc: "Genera documentos de NSS (puede devolver 2 PDFs).", badge: "Solo CURP • 2 PDFs" },
      { key: "vigencia", title: "Vigencia de derechos", desc: "Constancia de vigencia de derechos.", badge: "CURP + NSS" },
      { key: "noderecho", title: "No derechohabiencia", desc: "Constancia de no derecho al servicio médico.", badge: "Solo CURP (según proveedor)" },
    ],
    []
  );

  const trámiteLabel = useMemo(() => {
    const m = {
      semanas: "Semanas cotizadas",
      asignacion: "Asignación / Localización NSS",
      vigencia: "Vigencia de derechos",
      noderecho: "No derechohabiencia",
    };
    return m[type] || type;
  }, [type]);

  const filenameFallback = useMemo(() => {
    const c = curp.trim().toUpperCase();
    if (!c) return "documento.pdf";
    return `${type}_${c}.pdf`.toLowerCase();
  }, [type, curp]);

  // Try restore session
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      try {
        // Intentamos leer créditos para “validar” token
        const r = await authFetch("/api/credits/me");
        if (r.status === 401) {
          localStorage.removeItem("token");
          return;
        }
        const d = await safeJson(r);
        setMe((prev) => prev || { email: "Sesión activa", role: "user", credits: d.credits ?? 0 });
      } catch {
        // no hacemos nada
      }
    })();
  }, []);

  // Load Admin data when entering admin
  const loadAdmin = async () => {
    if (!me || me.role !== "admin") return;
    setLoadingAdmin(true);
    try {
      const [ru, rl] = await Promise.all([authFetch("/api/users"), authFetch("/api/logs")]);
      const du = await safeJson(ru);
      const dl = await safeJson(rl);

      if (!ru.ok) throw new Error(du.message || "No se pudieron cargar usuarios");
      if (!rl.ok) throw new Error(dl.message || "No se pudieron cargar logs");

      setUsers(Array.isArray(du) ? du : du.users || []);
      setLogs(Array.isArray(dl) ? dl : dl.logs || []);
    } catch (e) {
      showToast({ type: "error", title: "Admin", message: e.message || "Error cargando admin" });
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if (me?.role === "admin") loadAdmin();
  }, [me]);

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
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
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
    showToast({ type: "info", title: "Sesión cerrada", message: "Hasta luego." });
  };

  // Consult validations
  const validate = () => {
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
        title: "Portapapeles bloqueado",
        message: "Tu navegador bloqueó el portapapeles. Usa Ctrl+V manualmente.",
      });
    }
  };

  const onGenerate = async () => {
    if (!isLogged) {
      showToast({ type: "info", title: "Inicia sesión", message: "Necesitas sesión para generar PDFs." });
      return;
    }
    if (!validate()) return;

    setGenerating(true);
    setFiles([]);

    try {
      const res = await authFetch("/api/imss", {
        method: "POST",
        body: JSON.stringify({
          type,
          curp: curp.trim().toUpperCase(),
          nss: nss.trim(),
        }),
      });

      const data = await safeJson(res);

      if (res.status === 401) {
        localStorage.removeItem("token");
        setMe(null);
        showToast({ type: "info", title: "Sesión expirada", message: "Vuelve a iniciar sesión." });
        return;
      }

      if (!res.ok) {
        // backend manda "Inconsistencia" cuando no hay PDF
        const isInc = String(data.message || "").toLowerCase().includes("inconsistencia");
        showToast({
          type: "error",
          title: isInc ? "Inconsistencia" : "Error",
          message: data.message || `HTTP ${res.status}`,
        });
        return;
      }

      const filesArr = data.files || [];
      setFiles(filesArr);

      showToast({
        type: "success",
        title: "Documento(s) generado(s)",
        message: filesArr.length ? `Listo. Se generaron ${filesArr.length} PDF(s).` : "Listo para descargar.",
      });

      // Refresh credits
      try {
        const r2 = await authFetch("/api/credits/me");
        const d2 = await safeJson(r2);
        setMe((m) => (m ? { ...m, credits: d2.credits ?? m.credits } : m));
      } catch {
        // ignore
      }
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    } finally {
      setGenerating(false);
    }
  };

  const downloadFile = async (fileId, filename) => {
    try {
      // Tu backend ha usado /api/download/:id
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
        showToast({ type: "error", title: "No se pudo descargar", message: data.message || `HTTP ${res.status}` });
        return;
      }

      const blob = await res.blob();
      downloadBlob(blob, filename || filenameFallback);
      showToast({ type: "success", title: "Descarga iniciada", message: filename || "PDF" });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo descargar el archivo." });
    }
  };

  // ------------------ Admin actions ------------------
  const openResetModal = (u) => {
    setResetTarget(u);
    setNewPassword("");
    setResetModalOpen(true);
  };

  const doResetPassword = async () => {
    if (!resetTarget?.id) return;
    try {
      const res = await authFetch(`/api/users/${resetTarget.id}/reset-password`, { method: "POST" });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo resetear", message: data.message || `HTTP ${res.status}` });
        return;
      }
      setNewPassword(data.newPassword || "");
      showToast({ type: "success", title: "Password reseteado", message: "Cópialo y guárdalo." });
      // refrescar usuarios
      await loadAdmin();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    }
  };

  const doToggleDisabled = async (u) => {
    try {
      // Endpoint esperado: POST /api/users/:id/disable { disabled: true/false }
      const res = await authFetch(`/api/users/${u.id}/disable`, {
        method: "POST",
        body: JSON.stringify({ disabled: !u.disabled }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo cambiar", message: data.message || `HTTP ${res.status}` });
        return;
      }
      showToast({ type: "success", title: "Usuario actualizado", message: !u.disabled ? "Deshabilitado" : "Habilitado" });
      await loadAdmin();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    }
  };

  const doApplyCredits = async (u) => {
    const raw = creditInput[u.id] ?? "";
    const amt = parseInt(raw, 10);
    if (!Number.isFinite(amt)) {
      showToast({ type: "error", title: "Créditos", message: "Ingresa un número entero (ej. 10 o -5)." });
      return;
    }

    try {
      const res = await authFetch(`/api/credits/${u.id}`, {
        method: "POST",
        body: JSON.stringify({ amount: amt }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo actualizar", message: data.message || `HTTP ${res.status}` });
        return;
      }
      showToast({ type: "success", title: "Créditos actualizados", message: `Se aplicó: ${amt}` });
      setCreditInput((m) => ({ ...m, [u.id]: "" }));
      await loadAdmin();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    }
  };

  // ------------------ UI styles ------------------
  const font = { fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" };
  const pageBg = "#f6f7fb";

  const CardShell = ({ title, subtitle, right, children }) => (
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
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 900, letterSpacing: -0.3, fontSize: 18 }}>{title}</div>
          {subtitle && <div style={{ color: "#6b7280", fontSize: 13 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );

  const Button = ({ children, onClick, variant = "primary", disabled, style }) => {
    const base = {
      padding: 12,
      borderRadius: 14,
      fontWeight: 900,
      cursor: disabled ? "not-allowed" : "pointer",
      border: "1px solid #e5e7eb",
      background: "#fff",
      color: "#111827",
      ...style,
    };
    if (variant === "primary") {
      base.border = "none";
      base.background = disabled ? "#9ca3af" : "#4f46e5";
      base.color = "#fff";
    }
    if (variant === "ghost") {
      base.background = "transparent";
      base.border = "1px solid #e5e7eb";
    }
    return (
      <button onClick={onClick} disabled={disabled} style={base}>
        {children}
      </button>
    );
  };

  const Input = ({ label, value, onChange, placeholder, type = "text", rightHint }) => (
    <div>
      <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        {rightHint ? <span style={{ color: "#6b7280", fontWeight: 700 }}>{rightHint}</span> : null}
      </div>
      <input
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

  // Filtered users
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => String(u.email || "").toLowerCase().includes(q));
  }, [users, userSearch]);

  // ------------------ RENDER ------------------
  return (
    <div style={font}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Modal
        open={resetModalOpen}
        title="Resetear contraseña"
        onClose={() => setResetModalOpen(false)}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Usuario: <b style={{ color: "#111827" }}>{resetTarget?.email}</b>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="primary" onClick={doResetPassword}>
              Generar nueva contraseña
            </Button>
            <Button variant="ghost" onClick={() => setResetModalOpen(false)}>
              Cancelar
            </Button>
          </div>

          {newPassword ? (
            <div
              style={{
                border: "1px dashed #c7d2fe",
                background: "#eef2ff",
                borderRadius: 14,
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 900, color: "#3730a3", marginBottom: 6 }}>Nueva contraseña</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <code style={{ fontSize: 14, fontWeight: 800 }}>{newPassword}</code>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(newPassword);
                      showToast({ type: "success", title: "Copiado", message: "Contraseña copiada al portapapeles." });
                    } catch {
                      showToast({ type: "error", title: "No se pudo copiar", message: "Cópiala manualmente." });
                    }
                  }}
                  style={{ padding: "10px 12px" }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          minHeight: "100vh",
          background: pageBg,
        }}
      >
        {/* Sidebar */}
        <aside style={{ padding: 18, borderRight: "1px solid #e5e7eb", background: "#fff" }}>
          <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 18 }}>
            Docu<span style={{ color: "#4f46e5" }}>Express</span>
          </div>

          {/* Auth box */}
          {!isLogged ? (
            <div style={{ padding: 14, border: "1px solid #e5e7eb", background: "#fff", borderRadius: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Iniciar sesión</div>
              <Input
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@docuexpress.com"
              />
              <div style={{ height: 10 }} />
              <Input
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                type="password"
                rightHint="(seed: Admin123!)"
              />
              <div style={{ height: 12 }} />
              <Button variant="primary" onClick={onLogin}>
                Iniciar sesión
              </Button>

              <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                Backend: <b style={{ color: "#111827" }}>{BACKEND_URL}</b>
              </div>
            </div>
          ) : (
            <div style={{ padding: 14, border: "1px solid #eef2ff", background: "#f8fafc", borderRadius: 16 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Sesión</div>
              <div style={{ fontWeight: 900 }}>{me.email}</div>

              <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Badge tone="indigo">{me.role === "admin" ? "Admin" : "User"}</Badge>
                <Badge tone="cyan">{me.credits ?? 0} créditos</Badge>
              </div>
            </div>
          )}

          {/* Menu */}
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            <button
              onClick={() => {
                setView("consultar");
                setStep("cards");
              }}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: view === "consultar" ? "#4f46e5" : "#fff",
                color: view === "consultar" ? "#fff" : "#111827",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              CONSULTAR
            </button>

            <button
              onClick={() => setView("users")}
              disabled={!isLogged || me.role !== "admin"}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: view === "users" ? "#111827" : "#fff",
                color: view === "users" ? "#fff" : "#111827",
                fontWeight: 900,
                cursor: !isLogged || me.role !== "admin" ? "not-allowed" : "pointer",
                opacity: !isLogged || me.role !== "admin" ? 0.5 : 1,
              }}
            >
              Usuarios
            </button>

            <button
              onClick={() => setView("logs")}
              disabled={!isLogged || me.role !== "admin"}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: view === "logs" ? "#111827" : "#fff",
                color: view === "logs" ? "#fff" : "#111827",
                fontWeight: 900,
                cursor: !isLogged || me.role !== "admin" ? "not-allowed" : "pointer",
                opacity: !isLogged || me.role !== "admin" ? 0.5 : 1,
              }}
            >
              Logs
            </button>

            <button
              onClick={onLogout}
              disabled={!isLogged}
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#fff",
                fontWeight: 900,
                cursor: !isLogged ? "not-allowed" : "pointer",
                opacity: !isLogged ? 0.5 : 1,
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: 26 }}>
          <div style={{ maxWidth: 1060, margin: "0 auto" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>DocuExpress</div>
              <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: -0.6 }}>
                {me?.role === "admin" ? "Panel de Administración" : "Panel"}
              </div>
            </div>

            {/* CONSULTAR */}
            {view === "consultar" && (
              <CardShell
                title="CONSULTAR"
                subtitle={step === "cards" ? "Elige el trámite que deseas generar." : `Trámite: ${trámiteLabel}`}
                right={<Badge>PDFs duran 24h</Badge>}
              >
                {step === "cards" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {trámites.map((c) => (
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
                          border: "1px solid #e5e7eb",
                          background: "#fff",
                          cursor: "pointer",
                          transition: "transform .08s ease",
                        }}
                      >
                        <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 6 }}>{c.title}</div>
                        <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.4 }}>{c.desc}</div>
                        <div style={{ marginTop: 12 }}>
                          <Badge>{c.badge}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ color: "#6b7280", fontSize: 13 }}>
                        Completa los datos y genera el documento.
                      </div>
                      <Button variant="ghost" onClick={() => setStep("cards")} style={{ padding: "10px 12px" }}>
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
                        label={`NSS ${type === "semanas" || type === "vigencia" ? "(obligatorio)" : "(opcional)"}`}
                        value={nss}
                        onChange={(e) => setNss(onlyInt(e.target.value))}
                        placeholder={type === "semanas" || type === "vigencia" ? "11 dígitos" : "Opcional"}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <Button variant="ghost" onClick={pasteCurpNss}>
                        Pegar CURP/NSS
                      </Button>
                      <Button variant="primary" onClick={onGenerate} disabled={!isLogged || generating}>
                        {generating ? "Generando…" : "Generar documento"}
                      </Button>
                    </div>

                    {/* Downloads */}
                    {files?.length ? (
                      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                        {files.map((f, idx) => (
                          <button
                            key={f.fileId || idx}
                            onClick={() => downloadFile(f.fileId, f.filename || filenameFallback)}
                            style={{
                              textAlign: "left",
                              padding: 12,
                              borderRadius: 14,
                              border: "1px solid #e5e7eb",
                              background: "#f8fafc",
                              cursor: "pointer",
                              fontWeight: 900,
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            <span>Descargar: {f.filename || "documento.pdf"}</span>
                            <Badge tone="green">PDF</Badge>
                          </button>
                        ))}
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          * Si expira (24h), el backend lo borra y ya no se podrá descargar.
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardShell>
            )}

            {/* USERS (ADMIN) */}
            {view === "users" && (
              <CardShell
                title="Usuarios"
                subtitle="Admin: resetea passwords, deshabilita usuarios y administra créditos."
                right={
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Badge tone="indigo">Admin</Badge>
                    <Button variant="ghost" onClick={loadAdmin} disabled={loadingAdmin} style={{ padding: "10px 12px" }}>
                      {loadingAdmin ? "Actualizando…" : "Refrescar"}
                    </Button>
                  </div>
                }
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <Input
                      label="Buscar por email"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="ej. cliente@docuexpress.com"
                    />
                  </div>
                  <div style={{ paddingTop: 18 }}>
                    <Badge>{filteredUsers.length} usuarios</Badge>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <div
                    style={{
                      minWidth: 820,
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2.2fr 1fr 1fr 1.2fr 1.7fr",
                        padding: 12,
                        background: "#f8fafc",
                        borderBottom: "1px solid #e5e7eb",
                        fontSize: 12,
                        color: "#6b7280",
                        fontWeight: 900,
                      }}
                    >
                      <div>Email</div>
                      <div>Rol</div>
                      <div>Créditos</div>
                      <div>Estado</div>
                      <div>Acciones</div>
                    </div>

                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2.2fr 1fr 1fr 1.2fr 1.7fr",
                          padding: 12,
                          borderBottom: "1px solid #f1f5f9",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>{u.email}</div>
                        <div>
                          <Badge tone={u.role === "admin" ? "indigo" : "neutral"}>{u.role}</Badge>
                        </div>
                        <div style={{ fontWeight: 900 }}>{u.credits ?? 0}</div>
                        <div>
                          {u.disabled ? <Badge tone="red">Deshabilitado</Badge> : <Badge tone="green">Activo</Badge>}
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <Button variant="ghost" onClick={() => openResetModal(u)} style={{ padding: "10px 12px" }}>
                            Reset pass
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => doToggleDisabled(u)}
                            style={{ padding: "10px 12px" }}
                          >
                            {u.disabled ? "Habilitar" : "Deshabilitar"}
                          </Button>

                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                              value={creditInput[u.id] ?? ""}
                              onChange={(e) =>
                                setCreditInput((m) => ({ ...m, [u.id]: onlyInt(e.target.value) }))
                              }
                              placeholder="ej. 10 o -5"
                              style={{
                                width: 120,
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: "1px solid #e5e7eb",
                                outline: "none",
                                fontWeight: 800,
                              }}
                            />
                            <Button
                              variant="primary"
                              onClick={() => doApplyCredits(u)}
                              style={{ padding: "10px 12px" }}
                            >
                              Aplicar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!filteredUsers.length ? (
                      <div style={{ padding: 14, color: "#6b7280" }}>No hay usuarios para mostrar.</div>
                    ) : null}
                  </div>
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                  * El backend debe tener el endpoint <b>/api/users/:id/disable</b> para habilitar/deshabilitar.
                  Si te sale 404, dímelo y te paso la ruta completa para copiar/pegar.
                </div>
              </CardShell>
            )}

            {/* LOGS (ADMIN) */}
            {view === "logs" && (
              <CardShell
                title="Logs"
                subtitle="Historial de consultas y archivos generados."
                right={
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Badge tone="indigo">Admin</Badge>
                    <Button variant="ghost" onClick={loadAdmin} disabled={loadingAdmin} style={{ padding: "10px 12px" }}>
                      {loadingAdmin ? "Actualizando…" : "Refrescar"}
                    </Button>
                  </div>
                }
              >
                <div style={{ display: "grid", gap: 12 }}>
                  {logs?.length ? (
                    logs
                      .slice()
                      .reverse()
                      .map((l) => (
                        <div
                          key={l.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            borderRadius: 16,
                            padding: 14,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <div style={{ fontWeight: 950 }}>{l.email}</div>
                            <div style={{ color: "#6b7280", fontSize: 12 }}>{l.createdAt}</div>
                          </div>

                          <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <Badge>{l.type}</Badge>
                            {l.curp ? <Badge tone="cyan">{l.curp}</Badge> : null}
                            {l.nss ? <Badge tone="neutral">{l.nss}</Badge> : null}
                            {Array.isArray(l.files) ? <Badge tone="green">{l.files.length} PDF(s)</Badge> : null}
                          </div>

                          {Array.isArray(l.files) && l.files.length ? (
                            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                              {l.files.map((f) => (
                                <button
                                  key={f.fileId}
                                  onClick={() => downloadFile(f.fileId, f.filename)}
                                  style={{
                                    textAlign: "left",
                                    padding: 12,
                                    borderRadius: 14,
                                    border: "1px solid #e5e7eb",
                                    background: "#f8fafc",
                                    cursor: "pointer",
                                    fontWeight: 900,
                                  }}
                                >
                                  Descargar: {f.filename || "documento.pdf"}
                                </button>
                              ))}
                              <div style={{ fontSize: 12, color: "#6b7280" }}>
                                * Si ya pasó 24h, el backend puede haberlo borrado.
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))
                  ) : (
                    <div style={{ color: "#6b7280" }}>No hay logs todavía.</div>
                  )}
                </div>
              </CardShell>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
