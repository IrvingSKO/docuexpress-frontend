import React, { useEffect, useMemo, useRef, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ------------------ UI helpers ------------------
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
          borderRadius: 16,
          padding: 14,
          boxShadow: "0 18px 40px rgba(0,0,0,.12)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
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

function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,.45)",
        display: "grid",
        placeItems: "center",
        zIndex: 9998,
        padding: 16,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          background: "#fff",
          borderRadius: 18,
          border: "1px solid #e5e7eb",
          boxShadow: "0 30px 70px rgba(0,0,0,.25)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 950, letterSpacing: -0.4 }}>{title}</div>
          <button onClick={onClose} style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: "6px 10px", cursor: "pointer", fontWeight: 900 }}>
            Cerrar
          </button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
        {footer ? <div style={{ padding: 16, borderTop: "1px solid #f1f5f9" }}>{footer}</div> : null}
      </div>
    </div>
  );
}

function Badge({ children, tone = "indigo" }) {
  const tones = {
    indigo: { bg: "#eef2ff", fg: "#3730a3", bd: "#e0e7ff" },
    cyan: { bg: "#ecfeff", fg: "#155e75", bd: "#cffafe" },
    green: { bg: "#f0fdf4", fg: "#166534", bd: "#dcfce7" },
    red: { bg: "#fef2f2", fg: "#7f1d1d", bd: "#fee2e2" },
    slate: { bg: "#f8fafc", fg: "#0f172a", bd: "#e5e7eb" },
  };
  const t = tones[tone] || tones.indigo;
  return (
    <span style={{ fontSize: 12, padding: "6px 10px", borderRadius: 999, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, fontWeight: 800 }}>
      {children}
    </span>
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
  const res = await fetch(`${BACKEND_URL}${url}`, {
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

// ------------------ App ------------------
export default function App() {
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = (t) => {
    setToast(t);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // Auth
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState(null);

  // Nav
  const [view, setView] = useState("consultar"); // consultar | users | credits | creditLogs | logs
  const [step, setStep] = useState("cards"); // cards | form

  // Consult
  const [type, setType] = useState("semanas"); // semanas | nss | vigencia | noderecho
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastFiles, setLastFiles] = useState([]); // {fileId, filename, expiresAt}

  // Admin data
  const isLogged = !!me;
  const isAdmin = !!me && me.role === "admin";

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [creditLogs, setCreditLogs] = useState([]);
  const [creditLogsLoading, setCreditLogsLoading] = useState(false);

  const [queryLogs, setQueryLogs] = useState([]);
  const [queryLogsLoading, setQueryLogsLoading] = useState(false);

  // Modals
  const [modalCreateUser, setModalCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");

  const [modalCredits, setModalCredits] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deltaCredits, setDeltaCredits] = useState(10);
  const [creditNote, setCreditNote] = useState("");

  const [modalResetPass, setModalResetPass] = useState(false);
  const [resetPassUser, setResetPassUser] = useState(null);
  const [generatedPass, setGeneratedPass] = useState("");

  // ---- load session
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    (async () => {
      try {
        // intenta /me de credits para comprobar token + credits
        const res = await authFetch("/api/credits/me");
        if (res.status === 401) {
          localStorage.removeItem("token");
          return;
        }
        const data = await safeJson(res);
        setMe((prev) => prev || { email: "sesión activa", role: "user", credits: data.credits ?? 0 });
      } catch {}
    })();
  }, []);

  // ---- login
  const onLogin = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo iniciar sesión", message: data.message || `HTTP ${res.status}` });
        return;
      }
      localStorage.setItem("token", data.token);
      setMe(data.user);
      showToast({ type: "success", title: "Sesión iniciada", message: "Bienvenido 👋" });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al servidor." });
    }
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    setMe(null);
    setLastFiles([]);
    setStep("cards");
    setView("consultar");
    showToast({ type: "info", title: "Sesión cerrada", message: "Hasta luego." });
  };

  // ---- paste CURP/NSS
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
      showToast({ type: "success", title: "Pegado listo", message: `Pegado: ${foundCurp ? "CURP" : ""}${foundCurp && foundNss ? " + " : ""}${foundNss ? "NSS" : ""}` });
    } catch {
      showToast({ type: "error", title: "Portapapeles bloqueado", message: "Tu navegador no permitió leer el portapapeles. Usa Ctrl+V." });
    }
  };

  // ---- validate consult
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

  // ---- generate IMSS
  const onGenerate = async () => {
    if (!isLogged) {
      showToast({ type: "info", title: "Inicia sesión", message: "Necesitas iniciar sesión para generar." });
      return;
    }
    if (!validate()) return;

    setGenerating(true);
    setLastFiles([]);

    try {
      const payload = { type, curp: curp.trim().toUpperCase(), nss: nss.trim() };
      const res = await authFetch("/api/imss", { method: "POST", body: JSON.stringify(payload) });
      const data = await safeJson(res);

      if (res.status === 401) {
        localStorage.removeItem("token");
        setMe(null);
        showToast({ type: "info", title: "Sesión expirada", message: "Vuelve a iniciar sesión." });
        return;
      }

      if (!res.ok) {
        // ✅ tu backend manda "Inconsistencia"
        showToast({ type: "error", title: "Inconsistencia", message: data.message || "IMSS no devolvió PDF. Intenta otra vez." });
        return;
      }

      if (data.files?.length) {
        setLastFiles(data.files);
        showToast({ type: "success", title: "Documento(s) generado(s)", message: `Listo. Se generaron ${data.files.length} PDF(s).` });
      } else {
        showToast({ type: "error", title: "Inconsistencia", message: "No se recibieron archivos del backend." });
      }

      // refresh credits
      try {
        const r2 = await authFetch("/api/credits/me");
        const d2 = await safeJson(r2);
        setMe((m) => (m ? { ...m, credits: d2.credits ?? m.credits } : m));
      } catch {}
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al backend." });
    } finally {
      setGenerating(false);
    }
  };

  // ---- download
  const downloadSingle = async (fileId, filename) => {
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
        const data = await safeJson(res);
        showToast({ type: "error", title: "No se pudo descargar", message: data.message || `HTTP ${res.status}` });
        return;
      }

      const blob = await res.blob();
      downloadBlob(blob, filename);
      showToast({ type: "success", title: "Descarga iniciada", message: filename || "documento.pdf" });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo descargar el archivo." });
    }
  };

  // ---- friendly filename
  const filenameFor = useMemo(() => {
    const c = curp.trim().toUpperCase();
    if (!c) return "documento.pdf";
    if (type === "semanas") return `semanas_${c}.pdf`;
    if (type === "vigencia") return `vigencia_${c}.pdf`;
    if (type === "nss") return `asignacion_${c}.pdf`;
    if (type === "noderecho") return `noderecho_${c}.pdf`;
    return `documento_${c}.pdf`;
  }, [type, curp]);

  // ------------------ Admin: load users ------------------
  const loadUsers = async () => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      const res = await authFetch("/api/users");
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo cargar usuarios", message: data.message || `HTTP ${res.status}` });
        return;
      }
      setUsers(data.users || []);
    } finally {
      setUsersLoading(false);
    }
  };

  // ------------------ Admin: create user ------------------
  const createUser = async () => {
    const e = newUserEmail.trim();
    const p = newUserPass.trim();
    if (e.length < 5) return showToast({ type: "error", title: "Email inválido", message: "Revisa el email." });
    if (p.length < 6) return showToast({ type: "error", title: "Password inválida", message: "Mínimo 6 caracteres." });

    try {
      const res = await authFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ email: e, password: p, role: newUserRole }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo crear", message: data.message || `HTTP ${res.status}` });
        return;
      }
      showToast({ type: "success", title: "Usuario creado", message: data.user.email });
      setModalCreateUser(false);
      setNewUserEmail("");
      setNewUserPass("");
      setNewUserRole("user");
      loadUsers();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar." });
    }
  };

  // ------------------ Admin: disable/enable ------------------
  const toggleDisabled = async (u) => {
    try {
      const res = await authFetch(`/api/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ disabled: !u.disabled }) });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo actualizar", message: data.message || `HTTP ${res.status}` });
        return;
      }
      showToast({ type: "success", title: "Actualizado", message: `${data.user.email} ${data.user.disabled ? "deshabilitado" : "habilitado"}` });
      loadUsers();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar." });
    }
  };

  // ------------------ Admin: grant credits ------------------
  const openCreditsModal = (u) => {
    setSelectedUser(u);
    setDeltaCredits(10);
    setCreditNote("");
    setModalCredits(true);
  };

  const grantCredits = async () => {
    if (!selectedUser) return;
    const n = Number(deltaCredits);
    if (!Number.isInteger(n)) {
      showToast({ type: "error", title: "Cantidad inválida", message: "Solo enteros (ej. 10, -5)." });
      return;
    }
    try {
      const res = await authFetch("/api/credits/grant", {
        method: "POST",
        body: JSON.stringify({ userId: selectedUser.id, amount: n, note: creditNote }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo actualizar créditos", message: data.message || `HTTP ${res.status}` });
        return;
      }
      showToast({ type: "success", title: "Créditos actualizados", message: `${data.user.email}: ${data.user.credits} créditos` });
      setModalCredits(false);
      loadUsers();
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar." });
    }
  };

  // ------------------ Admin: reset password ------------------
  const openResetPass = (u) => {
    setResetPassUser(u);
    setGeneratedPass("");
    setModalResetPass(true);
  };

  const doResetPassword = async () => {
    if (!resetPassUser) return;
    try {
      const res = await authFetch(`/api/users/${resetPassUser.id}/reset-password`, { method: "POST" });
      const data = await safeJson(res);
      if (!res.ok tells) {
        showToast({ type: "error", title: "No se pudo resetear", message: data.message || `HTTP ${res.status}` });
        return;
      }
      setGeneratedPass(data.newPassword || "");
      showToast({ type: "success", title: "Password reseteada", message: "Cópiala y guárdala." });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar." });
    }
  };

  // ------------------ Admin: load credit logs ------------------
  const loadCreditLogs = async () => {
    if (!isAdmin) return;
    setCreditLogsLoading(true);
    try {
      const res = await authFetch("/api/credit-logs");
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo cargar log", message: data.message || `HTTP ${res.status}` });
        return;
      }
      setCreditLogs(data.logs || []);
    } finally {
      setCreditLogsLoading(false);
    }
  };

  // ------------------ Admin: load query logs ------------------
  const loadQueryLogs = async () => {
    if (!isAdmin) return;
    setQueryLogsLoading(true);
    try {
      const res = await authFetch("/api/logs");
      const data = await safeJson(res);
      if (!res.ok) {
        showToast({ type: "error", title: "No se pudo cargar logs", message: data.message || `HTTP ${res.status}` });
        return;
      }
      setQueryLogs(data.logs || []);
    } finally {
      setQueryLogsLoading(false);
    }
  };

  // Auto-load on admin view change
  useEffect(() => {
    if (!isAdmin) return;
    if (view === "users") loadUsers();
    if (view === "creditLogs") loadCreditLogs();
    if (view === "logs") loadQueryLogs();
  }, [view, isAdmin]);

  // ------------------ UI ------------------
  const cardStyle = {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 22px 50px rgba(0,0,0,.08)",
    overflow: "hidden",
  };

  const buttonPrimary = (disabled) => ({
    padding: 12,
    borderRadius: 14,
    border: "none",
    background: disabled ? "#9ca3af" : "#4f46e5",
    color: "#fff",
    fontWeight: 950,
    cursor: disabled ? "not-allowed" : "pointer",
  });

  const buttonGhost = {
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <Modal
        open={modalCreateUser}
        title="Crear usuario"
        onClose={() => setModalCreateUser(false)}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={buttonGhost} onClick={() => setModalCreateUser(false)}>Cancelar</button>
            <button style={buttonPrimary(false)} onClick={createUser}>Crear</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Email</div>
            <input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="cliente@correo.com" style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Password</div>
            <input value={newUserPass} onChange={(e) => setNewUserPass(e.target.value)} placeholder="Min 6 caracteres" style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb" }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Rol</div>
            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff" }}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={modalCredits}
        title={selectedUser ? `Créditos: ${selectedUser.email}` : "Créditos"}
        onClose={() => setModalCredits(false)}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={buttonGhost} onClick={() => setModalCredits(false)}>Cancelar</button>
            <button style={buttonPrimary(false)} onClick={grantCredits}>Guardar</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Badge tone="cyan">Solo enteros</Badge>
            <Badge tone="slate">Ej: 10 / -5</Badge>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Cantidad (delta)</div>
            <input
              value={deltaCredits}
              onChange={(e) => setDeltaCredits(e.target.value)}
              placeholder="10"
              style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6 }}>Nota (opcional)</div>
            <input
              value={creditNote}
              onChange={(e) => setCreditNote(e.target.value)}
              placeholder="Ej. compra, devolución, ajuste…"
              style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb" }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={modalResetPass}
        title={resetPassUser ? `Reset password: ${resetPassUser.email}` : "Reset password"}
        onClose={() => setModalResetPass(false)}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={buttonGhost} onClick={() => setModalResetPass(false)}>Cerrar</button>
            <button style={buttonPrimary(false)} onClick={doResetPassword}>Resetear</button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.4 }}>
            Esto genera una nueva contraseña. La anterior no se puede “ver”.
          </div>
          {generatedPass ? (
            <div style={{ padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", background: "#f8fafc" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Nueva contraseña</div>
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 14 }}>
                {generatedPass}
              </div>
              <button
                style={{ ...buttonGhost, marginTop: 10 }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(generatedPass);
                    showToast({ type: "success", title: "Copiado", message: "Contraseña copiada al portapapeles." });
                  } catch {
                    showToast({ type: "error", title: "No se pudo copiar", message: "Cópiala manualmente." });
                  }
                }}
              >
                Copiar
              </button>
            </div>
          ) : (
            <div style={{ padding: 12, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff" }}>
              Dale “Resetear” para generar una nueva contraseña.
            </div>
          )}
        </div>
      </Modal>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh", background: "#f6f7fb" }}>
        {/* Sidebar */}
        <aside style={{ padding: 18, borderRight: "1px solid #e5e7eb", background: "#fff" }}>
          <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 18 }}>
            Docu<span style={{ color: "#4f46e5" }}>Express</span>
          </div>

          {isLogged ? (
            <div style={{ padding: 14, border: "1px solid #eef2ff", background: "#f8fafc", borderRadius: 16 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Sesión</div>
              <div style={{ fontWeight: 950 }}>{me.email}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Badge tone="indigo">{me.role === "admin" ? "Admin" : "User"}</Badge>
                <Badge tone="cyan">{me.credits ?? 0} créditos</Badge>
              </div>
            </div>
          ) : (
            <div style={{ padding: 14, border: "1px solid #e5e7eb", background: "#fff", borderRadius: 16 }}>
              <div style={{ fontWeight: 950, marginBottom: 10 }}>Iniciar sesión</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 10 }} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 10 }} />
              <button onClick={onLogin} style={{ width: "100%", padding: 10, borderRadius: 12, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 950, cursor: "pointer" }}>
                Iniciar sesión
              </button>
            </div>
          )}

          {/* Menu */}
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            <button
              onClick={() => setView("consultar")}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: view === "consultar" ? "#4f46e5" : "#fff",
                color: view === "consultar" ? "#fff" : "#111827",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              CONSULTAR
            </button>

            <button
              onClick={() => setView("users")}
              disabled={!isAdmin}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: view === "users" ? "#111827" : "#fff",
                color: view === "users" ? "#fff" : "#111827",
                fontWeight: 950,
                cursor: !isAdmin ? "not-allowed" : "pointer",
                opacity: !isAdmin ? 0.5 : 1,
              }}
            >
              Usuarios
            </button>

            <button
              onClick={() => setView("creditLogs")}
              disabled={!isAdmin}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: view === "creditLogs" ? "#111827" : "#fff",
                color: view === "creditLogs" ? "#fff" : "#111827",
                fontWeight: 950,
                cursor: !isAdmin ? "not-allowed" : "pointer",
                opacity: !isAdmin ? 0.5 : 1,
              }}
            >
              Log de créditos
            </button>

            <button
              onClick={() => setView("logs")}
              disabled={!isAdmin}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: view === "logs" ? "#111827" : "#fff",
                color: view === "logs" ? "#fff" : "#111827",
                fontWeight: 950,
                cursor: !isAdmin ? "not-allowed" : "pointer",
                opacity: !isAdmin ? 0.5 : 1,
              }}
            >
              Logs (consultas)
            </button>

            <button
              onClick={onLogout}
              disabled={!isLogged}
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#fff",
                fontWeight: 950,
                cursor: !isLogged ? "not-allowed" : "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: 26 }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>DocuExpress</div>
              <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: -0.6 }}>
                {isAdmin ? "Panel de Administración" : "Panel"}
              </div>
            </div>

            {/* CONSULTAR */}
            {view === "consultar" && (
              <div style={cardStyle}>
                <div style={{ padding: 18, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 950, letterSpacing: -0.3, fontSize: 18 }}>CONSULTAR</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Elige el trámite que deseas generar.</div>
                  </div>
                  <Badge tone="slate">PDFs duran 24h</Badge>
                </div>

                <div style={{ padding: 18 }}>
                  {step === "cards" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {[
                        { key: "semanas", title: "Semanas cotizadas", desc: "Constancia de semanas cotizadas en el IMSS.", badge: "CURP + NSS" },
                        { key: "nss", title: "Asignación / Localización NSS", desc: "Genera documentos de NSS (puede devolver 2 PDFs).", badge: "Solo CURP • 2 PDFs" },
                        { key: "vigencia", title: "Vigencia de derechos", desc: "Constancia de vigencia de derechos.", badge: "CURP + NSS" },
                        { key: "noderecho", title: "No derechohabiencia", desc: "Constancia de no derecho al servicio médico.", badge: "Solo CURP" },
                      ].map((c) => (
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
                          }}
                        >
                          <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 6 }}>{c.title}</div>
                          <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.4 }}>{c.desc}</div>
                          <div style={{ marginTop: 12 }}>
                            <Badge tone="slate">{c.badge}</Badge>
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
                              : type === "nss"
                              ? "Asignación / Localización NSS"
                              : type === "vigencia"
                              ? "Vigencia de derechos"
                              : "No derechohabiencia"}
                          </b>
                        </div>
                        <button onClick={() => setStep("cards")} style={buttonGhost}>
                          ← Atrás
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>CURP</div>
                          <input value={curp} onChange={(e) => setCurp(e.target.value.toUpperCase())} placeholder="Ej. MAGC790705HTLRNR03" style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 950, marginBottom: 6 }}>
                            NSS {(type === "semanas" || type === "vigencia") ? "(obligatorio)" : "(opcional)"}
                          </div>
                          <input value={nss} onChange={(e) => setNss(e.target.value)} placeholder={(type === "semanas" || type === "vigencia") ? "11 dígitos" : "Opcional"} style={{ width: "100%", padding: 12, borderRadius: 14, border: "1px solid #e5e7eb" }} />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <button onClick={pasteCurpNss} style={{ ...buttonGhost, fontWeight: 950 }}>
                          Pegar CURP/NSS
                        </button>
                        <button onClick={onGenerate} disabled={!isLogged || generating} style={buttonPrimary(!isLogged || generating)}>
                          {generating ? "Generando…" : "Generar documento"}
                        </button>
                      </div>

                      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                        {lastFiles.map((f) => (
                          <button
                            key={f.fileId}
                            onClick={() => downloadSingle(f.fileId, f.filename || filenameFor)}
                            style={{
                              textAlign: "left",
                              padding: 12,
                              borderRadius: 14,
                              border: "1px solid #e5e7eb",
                              background: "#f8fafc",
                              cursor: "pointer",
                              fontWeight: 950,
                            }}
                          >
                            Descargar: {f.filename || "documento.pdf"}{" "}
                            {f.expiresAt ? (
                              <span style={{ marginLeft: 8 }}>
                                <Badge tone="slate">Expira 24h</Badge>
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* USERS */}
            {view === "users" && (
              <div style={cardStyle}>
                <div style={{ padding: 18, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>Usuarios</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Crear, deshabilitar, reset password y créditos.</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button style={buttonGhost} onClick={loadUsers} disabled={usersLoading}>
                      {usersLoading ? "Cargando…" : "Actualizar"}
                    </button>
                    <button style={buttonPrimary(false)} onClick={() => setModalCreateUser(true)}>
                      + Crear
                    </button>
                  </div>
                </div>

                <div style={{ padding: 18 }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["Email", "Rol", "Créditos", "Estado", "Acciones"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e5e7eb", fontSize: 12, letterSpacing: 0.4, color: "#475569" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", fontWeight: 900 }}>{u.email}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                              <Badge tone={u.role === "admin" ? "indigo" : "slate"}>{u.role}</Badge>
                            </td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                              <Badge tone="cyan">{u.credits ?? 0}</Badge>
                            </td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                              {u.disabled ? <Badge tone="red">Deshabilitado</Badge> : <Badge tone="green">Activo</Badge>}
                            </td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <button style={buttonGhost} onClick={() => openCreditsModal(u)}>
                                  Créditos
                                </button>
                                <button style={buttonGhost} onClick={() => openResetPass(u)}>
                                  Reset pass
                                </button>
                                <button style={buttonGhost} onClick={() => toggleDisabled(u)}>
                                  {u.disabled ? "Habilitar" : "Deshabilitar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ padding: 14, color: "#6b7280" }}>
                              {usersLoading ? "Cargando…" : "No hay usuarios (o no se pudo cargar)."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CREDIT LOGS */}
            {view === "creditLogs" && (
              <div style={cardStyle}>
                <div style={{ padding: 18, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>Log de créditos</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Historial de créditos otorgados / quitados.</div>
                  </div>
                  <button style={buttonGhost} onClick={loadCreditLogs} disabled={creditLogsLoading}>
                    {creditLogsLoading ? "Cargando…" : "Actualizar"}
                  </button>
                </div>

                <div style={{ padding: 18 }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["Fecha", "Admin", "Usuario", "Delta", "Antes → Después", "Nota"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e5e7eb", fontSize: 12, color: "#475569" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {creditLogs.map((l) => (
                          <tr key={l.id}>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", color: "#0f172a" }}>
                              {new Date(l.createdAt).toLocaleString()}
                            </td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", fontWeight: 900 }}>{l.adminEmail}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", fontWeight: 900 }}>{l.userEmail}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                              <Badge tone={Number(l.delta) >= 0 ? "green" : "red"}>{l.delta}</Badge>
                            </td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                              <Badge tone="slate">
                                {l.before} → {l.after}
                              </Badge>
                            </td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", color: "#334155" }}>
                              {l.note || "-"}
                            </td>
                          </tr>
                        ))}
                        {creditLogs.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: 14, color: "#6b7280" }}>
                              {creditLogsLoading ? "Cargando…" : "Sin registros todavía."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* QUERY LOGS */}
            {view === "logs" && (
              <div style={cardStyle}>
                <div style={{ padding: 18, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 18 }}>Logs (consultas)</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Historial de consultas IMSS y PDFs generados.</div>
                  </div>
                  <button style={buttonGhost} onClick={loadQueryLogs} disabled={queryLogsLoading}>
                    {queryLogsLoading ? "Cargando…" : "Actualizar"}
                  </button>
                </div>

                <div style={{ padding: 18 }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          {["Fecha", "Usuario", "Trámite", "CURP", "NSS", "PDFs"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: 12, borderBottom: "1px solid #e5e7eb", fontSize: 12, color: "#475569" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {queryLogs.map((l) => (
                          <tr key={l.id}>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>{new Date(l.createdAt).toLocaleString()}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", fontWeight: 900 }}>{l.email}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                              <Badge tone="slate">{l.type}</Badge>
                            </td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", fontFamily: "ui-monospace, monospace" }}>{l.curp}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9", fontFamily: "ui-monospace, monospace" }}>{l.nss || "-"}</td>
                            <td style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                              <div style={{ display: "grid", gap: 8 }}>
                                {(l.files || []).map((f) => (
                                  <button key={f.fileId} style={{ ...buttonGhost, textAlign: "left" }} onClick={() => downloadSingle(f.fileId, f.filename)}>
                                    Descargar: {f.filename}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {queryLogs.length === 0 && (
                          <tr>
                            <td colSpan={6} style={{ padding: 14, color: "#6b7280" }}>
                              {queryLogsLoading ? "Cargando…" : "Sin logs todavía."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* CREDITS view reservado (si luego lo quieres separado) */}
            {view === "credits" && (
              <div style={{ padding: 18, background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb" }}>
                <b>Créditos</b>
                <div style={{ color: "#6b7280", marginTop: 6 }}>
                  Ya lo controlas desde “Usuarios → Créditos” (más simple).
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
