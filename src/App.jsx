import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const BACKEND_URL =
  import.meta?.env?.VITE_API_URL || "https://docuexpress.onrender.com/api";

/* ===================== utils ===================== */
const cx = (...a) => a.filter(Boolean).join(" ");

/* ===================== toasts ===================== */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const push = (type, title, message, ttl = 3500) => {
    const id =
      (crypto?.randomUUID && crypto.randomUUID()) ||
      String(Date.now() + Math.random());
    const t = { id, type, title, message };
    setToasts((prev) => [t, ...prev].slice(0, 5));
    const tm = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      timers.current.delete(id);
    }, ttl);
    timers.current.set(id, tm);
  };

  const dismiss = (id) => {
    const tm = timers.current.get(id);
    if (tm) clearTimeout(tm);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  };

  useEffect(() => {
    return () => {
      timers.current.forEach((tm) => clearTimeout(tm));
      timers.current.clear();
    };
  }, []);

  return { toasts, push, dismiss };
}

function ToastViewport({ toasts, dismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] w-[360px] max-w-[92vw] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "rounded-2xl border shadow-lg px-4 py-3 backdrop-blur bg-white/90",
            t.type === "success" && "border-emerald-200",
            t.type === "error" && "border-rose-200",
            t.type === "info" && "border-indigo-200",
            t.type === "warn" && "border-amber-200"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold text-gray-900">
                {t.title}
              </div>
              {t.message ? (
                <div className="text-sm text-gray-600 mt-1 leading-snug whitespace-pre-line">
                  {t.message}
                </div>
              ) : null}
            </div>
            <button
              className="text-gray-500 hover:text-gray-900 font-semibold"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===================== UI atoms ===================== */
function Card({ className = "", children }) {
  return (
    <div
      className={cx(
        "bg-white border border-gray-200 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, right }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function CardContent({ className = "", children }) {
  return <div className={cx("p-6", className)}>{children}</div>;
}

function Button({ className = "", variant = "solid", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";
  const solid =
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_10px_25px_rgba(79,70,229,0.20)]";
  const outline =
    "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900";
  const ghost = "bg-transparent hover:bg-gray-100 text-gray-900";
  const danger =
    "bg-rose-600 text-white hover:bg-rose-700 shadow-[0_10px_25px_rgba(225,29,72,0.18)]";
  const styles =
    variant === "outline"
      ? outline
      : variant === "ghost"
      ? ghost
      : variant === "danger"
      ? danger
      : solid;

  return <button className={cx(base, styles, className)} {...props} />;
}

function Input({ label, className = "", ...props }) {
  return (
    <label className={cx("block", className)}>
      {label ? (
        <div className="text-xs font-semibold text-gray-600 mb-2">{label}</div>
      ) : null}
      <input
        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
        {...props}
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block">
      {label ? (
        <div className="text-xs font-semibold text-gray-600 mb-2">{label}</div>
      ) : null}
      <select
        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function Pill({ children, tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    gray: "bg-gray-50 text-gray-700 border-gray-100"
  };
  return (
    <span
      className={cx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        tones[tone] || tones.indigo
      )}
    >
      {children}
    </span>
  );
}

/* ===================== modals ===================== */
function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="text-base font-extrabold text-gray-900">{title}</div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 font-semibold"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer ? <div className="px-6 pb-6">{footer}</div> : null}
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmText,
  danger,
  onConfirm,
  onClose
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button
            variant={danger ? "danger" : "solid"}
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      }
    >
      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
        {message}
      </div>
    </Modal>
  );
}

/* ===================== network helpers ===================== */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const authFetch = async (toast, url, options = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {})
    }
  });

  const data = await safeJson(res);

  if (res.status === 401) {
    localStorage.removeItem("token");
    toast("warn", "Sesión expirada", "Vuelve a iniciar sesión.");
    window.location.reload();
    return null;
  }

  if (!res.ok) {
    throw new Error(data?.message || `Error HTTP ${res.status}`);
  }

  return data;
};

/* ===================== APP ===================== */
export default function App() {
  const { toasts, push, dismiss } = useToasts();
  const toast = (type, title, message) => push(type, title, message);

  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(res);

      if (!res.ok) {
        toast("error", "No se pudo iniciar sesión", data?.message || "Revisa tus credenciales");
        return;
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);
      setScreen("app");
      toast("success", "Bienvenido", `Sesión iniciada: ${data.user.email}`);
    } catch {
      toast("error", "Error", "No se pudo conectar con el backend");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setScreen("login");
    toast("info", "Sesión cerrada", "Hasta luego.");
  };

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      setScreen("login");
      setUser(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <ToastViewport toasts={toasts} dismiss={dismiss} />
      {screen === "login" && <Login onLogin={login} />}
      {screen === "app" && <Shell user={user} onLogout={logout} toast={toast} />}
    </div>
  );
}

/* ===================== LOGIN ===================== */
function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("Admin123!");

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="w-[26rem] overflow-hidden">
          <div className="h-2 bg-indigo-600" />
          <CardContent className="p-10 space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight">
                Docu<span className="text-indigo-600">Express</span>
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Acceso al sistema de consulta IMSS
              </p>
            </div>

            <Input label="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <Button className="w-full" onClick={() => onLogin(email, password)}>
              Iniciar sesión
            </Button>

            <div className="text-xs text-gray-500">
              <div>Admin: admin@docuexpress.com / Admin123!</div>
              <div>Cliente: cliente@docuexpress.com / Cliente123!</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ===================== SHELL ===================== */
function Shell({ user, onLogout, toast }) {
  const role = user?.role || "user";
  const [section, setSection] = useState(role === "admin" ? "api" : "api");
  const [credits, setCredits] = useState(null);

  const menu = useMemo(() => {
    if (role === "admin") {
      return [
        { key: "api", label: "Consumir API" },
        { key: "users", label: "Usuarios" },
        { key: "creditlogs", label: "Log de créditos" },
        { key: "credits", label: "Créditos" },
        { key: "logs", label: "Logs" }
      ];
    }
    return [
      { key: "api", label: "Consultar" },
      { key: "history", label: "Mis consultas" },
      { key: "credits", label: "Mis créditos" }
    ];
  }, [role]);

  const refreshCredits = async () => {
    try {
      const data = await authFetch(toast, "/credits/me");
      if (!data) return;
      setCredits(data?.credits ?? 0);
    } catch {
      setCredits(null);
    }
  };

  useEffect(() => {
    refreshCredits();
  }, []);

  return (
    <div className="min-h-screen flex">
      <aside className="w-72 bg-white border-r border-gray-100 px-6 py-6 flex flex-col">
        <div className="font-extrabold text-xl">
          Docu<span className="text-indigo-600">Express</span>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4">
          <div className="text-xs text-gray-500">Sesión</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">{user?.email}</div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Pill tone={role === "admin" ? "indigo" : "gray"}>{role === "admin" ? "Admin" : "Usuario"}</Pill>
            {credits !== null ? <Pill tone="indigo">{credits} créditos</Pill> : null}
          </div>
        </div>

        <nav className="mt-6 space-y-2">
          {menu.map((it) => {
            const active = section === it.key;
            return (
              <button
                key={it.key}
                onClick={() => setSection(it.key)}
                className={cx(
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition",
                  active
                    ? "bg-indigo-600 text-white shadow-[0_10px_25px_rgba(79,70,229,0.25)]"
                    : "hover:bg-gray-100 text-gray-800"
                )}
              >
                {it.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <Button variant="outline" className="w-full" onClick={onLogout}>
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">DocuExpress</div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {role === "admin" ? "Panel de Administración" : "Panel de Usuario"}
            </h1>
          </div>
          <Button variant="outline" onClick={refreshCredits}>
            Actualizar créditos
          </Button>
        </div>

        {section === "api" && <ApiPanel toast={toast} onAfterSuccess={refreshCredits} />}
        {section === "users" && role === "admin" && <UsersPanel toast={toast} />}
        {section === "creditlogs" && role === "admin" && <CreditLogsPanel toast={toast} />}
        {section === "credits" && <CreditsPanel credits={credits} />}
        {section === "logs" && role === "admin" && <LogsPanel toast={toast} onlyMine={false} />}
        {section === "history" && role !== "admin" && <LogsPanel toast={toast} onlyMine />}
      </main>
    </div>
  );
}

/* ===================== API PANEL ===================== */
function ApiPanel({ toast, onAfterSuccess }) {
  const [type, setType] = useState("semanas");
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const needsNss = type === "semanas" || type === "vigencia";

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const curpMatch = text.match(/[A-Z]{4}\d{6}[A-Z]{6}\d{2}/i);
      const nssMatch = text.match(/\b\d{11}\b/);

      if (curpMatch) setCurp(curpMatch[0].toUpperCase());
      if (nssMatch) setNss(nssMatch[0]);

      if (!curpMatch && !nssMatch) {
        toast("warn", "No encontrado", "No detecté CURP o NSS en tu portapapeles.");
      } else {
        toast("success", "Pegado", "Se detectó información desde tu portapapeles.");
      }
    } catch {
      toast("error", "Permiso requerido", "No pude leer el portapapeles (HTTPS + permiso).");
    }
  };

  const generate = async () => {
    try {
      setLoading(true);
      setPdfUrl(null);

      const data = await authFetch(toast, "/imss", {
        method: "POST",
        body: JSON.stringify({ type, curp, nss })
      });

      if (!data) return;

      if (data?.pdfUrl) {
        setPdfUrl(data.pdfUrl);
        toast("success", "Documento generado", "El PDF está listo para descargar.");
        onAfterSuccess?.();
      } else {
        toast("warn", "Sin PDF", "No se recibió la URL del PDF.");
      }
    } catch (e) {
      toast("error", "Error IMSS", e.message);
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${BACKEND_URL}/download?url=${encodeURIComponent(pdfUrl)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const err = await safeJson(res);
        toast("error", "Descarga fallida", err?.message || "No se pudo descargar.");
        return;
      }

      const blob = await res.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = `${type}_${curp}.pdf`.toLowerCase();
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(fileUrl);

      toast("success", "Descarga iniciada", `${type}_${curp}.pdf`);
    } catch {
      toast("error", "Error", "Ocurrió un error al descargar.");
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader
        title="Consulta IMSS"
        subtitle="Cada consulta descuenta 1 crédito."
        right={<Pill tone="indigo">1 crédito / consulta</Pill>}
      />
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Tipo de documento" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="asignacion">Asignación NSS</option>
          <option value="semanas">Semanas cotizadas</option>
          <option value="vigencia">Vigencia de derechos</option>
          <option value="noderecho">No derechohabiencia</option>
        </Select>

        <div className="flex items-end">
          <Button variant="outline" className="w-full" onClick={pasteFromClipboard}>
            Pegar CURP/NSS
          </Button>
        </div>

        <Input
          label="CURP"
          placeholder="Ej. MAGC790705HTLRNR03"
          value={curp}
          onChange={(e) => setCurp(e.target.value.toUpperCase())}
        />

        <Input
          label="NSS"
          placeholder={needsNss ? "Obligatorio" : "No requerido"}
          value={nss}
          onChange={(e) => setNss(e.target.value)}
          disabled={!needsNss}
        />

        <div className="md:col-span-2 space-y-3">
          <Button
            className="w-full"
            onClick={generate}
            disabled={loading || !curp || (needsNss && !nss)}
          >
            {loading ? "Generando..." : "Generar documento"}
          </Button>

          {pdfUrl ? (
            <Button variant="outline" className="w-full" onClick={download}>
              Descargar PDF
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

/* ===================== USERS PANEL (ADMIN) ===================== */
function UsersPanel({ toast }) {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [creditsOpen, setCreditsOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmUser, setConfirmUser] = useState(null);

  const load = async () => {
    const data = await authFetch(toast, "/users");
    if (!data) return;
    setUsers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load().catch((e) => toast("error", "Error", e.message));
  }, []);

  const create = async () => {
    try {
      await authFetch(toast, "/users", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      toast("success", "Usuario creado", email);
      setEmail("");
      setPassword("");
      load();
    } catch (e) {
      toast("error", "No se pudo crear", e.message);
    }
  };

  const openCreditsModal = (u) => {
    setTargetUser(u);
    setDelta("");
    setNote("");
    setCreditsOpen(true);
  };

  const applyCredits = async () => {
    const d = parseInt(delta, 10);
    if (!Number.isFinite(d) || d === 0) {
      toast("warn", "Dato inválido", "Ingresa un entero (positivo o negativo).");
      return;
    }
    try {
      await authFetch(toast, `/users/${targetUser.id}/credits`, {
        method: "POST",
        body: JSON.stringify({ delta: d, note })
      });
      toast("success", "Créditos actualizados", targetUser.email);
      setCreditsOpen(false);
      load();
    } catch (e) {
      toast("error", "Error", e.message);
    }
  };

  const resetPassword = async (u) => {
    try {
      const data = await authFetch(toast, `/users/${u.id}/reset-password`, { method: "POST" });
      if (!data) return;
      setConfirmUser({ ...u, mode: "temp", tempPassword: data.tempPassword });
      setConfirmOpen(true);
    } catch (e) {
      toast("error", "No se pudo resetear", e.message);
    }
  };

  const askToggleDisabled = (u) => {
    setConfirmUser({ ...u, mode: "toggle" });
    setConfirmOpen(true);
  };

  const toggleDisabled = async () => {
    try {
      const u = confirmUser;
      await authFetch(toast, `/users/${u.id}/disabled`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: !u.disabled })
      });
      toast("success", u.disabled ? "Usuario habilitado" : "Usuario deshabilitado", u.email);
      setConfirmOpen(false);
      setConfirmUser(null);
      load();
    } catch (e) {
      toast("error", "Error", e.message);
    }
  };

  return (
    <>
      <Card className="max-w-6xl">
        <CardHeader
          title="Usuarios"
          subtitle="Crear, resetear contraseña, deshabilitar y ajustar créditos."
          right={<Pill tone="gray">{users.length} usuarios</Pill>}
        />
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex items-end">
              <Button className="w-full" onClick={create} disabled={!email || !password}>
                Crear usuario
              </Button>
            </div>
          </div>

          <div className="overflow-auto border border-gray-100 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Email</th>
                  <th className="text-left px-4 py-3 font-semibold">Rol</th>
                  <th className="text-left px-4 py-3 font-semibold">Créditos</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <th className="text-right px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-900">{u.email}</td>
                    <td className="px-4 py-3"><Pill>{u.role}</Pill></td>
                    <td className="px-4 py-3"><Pill tone="indigo">{u.credits}</Pill></td>
                    <td className="px-4 py-3">
                      {u.disabled ? <Pill tone="rose">Deshabilitado</Pill> : <Pill tone="emerald">Activo</Pill>}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button variant="outline" onClick={() => openCreditsModal(u)}>
                        Ajustar créditos
                      </Button>
                      <Button variant="outline" onClick={() => resetPassword(u)}>
                        Reset pass
                      </Button>
                      <Button
                        variant={u.disabled ? "solid" : "danger"}
                        onClick={() => askToggleDisabled(u)}
                      >
                        {u.disabled ? "Habilitar" : "Deshabilitar"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={5}>
                      No hay usuarios aún.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Ajustar créditos */}
      <Modal
        open={creditsOpen}
        title={`Ajustar créditos: ${targetUser?.email || ""}`}
        onClose={() => setCreditsOpen(false)}
        footer={
          <div className="flex gap-2">
            <Button className="flex-1" onClick={applyCredits}>Guardar</Button>
            <Button variant="outline" className="flex-1" onClick={() => setCreditsOpen(false)}>Cancelar</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Cantidad (entero positivo o negativo)"
            placeholder="Ej. 50 o -10"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
          />
          <Input
            label="Nota / Motivo (opcional)"
            placeholder="Ej. Compra de créditos"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="text-xs text-gray-500">
            Solo enteros. Negativo descuenta (nunca baja de 0).
          </div>
        </div>
      </Modal>

      {/* Confirm: deshabilitar/habilitar o mostrar password temporal */}
      <ConfirmModal
        open={confirmOpen}
        title={
          confirmUser?.mode === "temp"
            ? "Contraseña temporal"
            : confirmUser?.disabled
            ? "Habilitar usuario"
            : "Deshabilitar usuario"
        }
        message={
          confirmUser?.mode === "temp"
            ? `Usuario: ${confirmUser.email}\n\nPassword temporal:\n${confirmUser.tempPassword}\n\n(Cópiala y pásasela al usuario)`
            : confirmUser?.disabled
            ? `¿Deseas habilitar a ${confirmUser?.email}?`
            : `¿Deseas deshabilitar a ${confirmUser?.email}?`
        }
        confirmText={
          confirmUser?.mode === "temp"
            ? "Entendido"
            : confirmUser?.disabled
            ? "Habilitar"
            : "Deshabilitar"
        }
        danger={confirmUser?.mode !== "temp" && !confirmUser?.disabled}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmUser(null);
        }}
        onConfirm={() => {
          if (confirmUser?.mode === "temp") {
            setConfirmOpen(false);
            setConfirmUser(null);
            return;
          }
          toggleDisabled();
        }}
      />
    </>
  );
}

/* ===================== CREDIT LOGS (ADMIN) ===================== */
function CreditLogsPanel({ toast }) {
  const [logs, setLogs] = useState([]);
  const [filterEmail, setFilterEmail] = useState("");

  const load = async () => {
    const data = await authFetch(toast, "/credit-logs");
    if (!data) return;
    setLogs(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load().catch((e) => toast("error", "Error", e.message));
  }, []);

  const filtered = logs.filter((l) =>
    filterEmail
      ? (l.userEmail || "").toLowerCase().includes(filterEmail.toLowerCase())
      : true
  );

  return (
    <Card className="max-w-6xl">
      <CardHeader
        title="Log de créditos"
        subtitle="Historial de créditos otorgados o retirados."
        right={<Pill tone="gray">{filtered.length} registros</Pill>}
      />
      <CardContent className="space-y-4">
        <Input
          label="Filtrar por email del usuario"
          placeholder="cliente@..."
          value={filterEmail}
          onChange={(e) => setFilterEmail(e.target.value)}
        />

        <div className="space-y-2">
          {filtered.map((l) => (
            <div key={l.id} className="border border-gray-100 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={l.delta > 0 ? "emerald" : "rose"}>
                  {l.delta > 0 ? `+${l.delta}` : `${l.delta}`}
                </Pill>
                <span className="text-sm font-semibold text-gray-900">{l.userEmail}</span>
                <span className="text-sm text-gray-500">{l.before} → {l.after}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Admin: {l.adminEmail} · {new Date(l.createdAt).toLocaleString()}
                {l.note ? ` · Nota: ${l.note}` : ""}
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="text-gray-500">Sin movimientos de créditos.</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

/* ===================== CREDITS PANEL ===================== */
function CreditsPanel({ credits }) {
  return (
    <Card className="max-w-3xl">
      <CardHeader title="Créditos" subtitle="Se descuentan por documento generado." right={<Pill tone="indigo">Saldo</Pill>} />
      <CardContent>
        <div className="text-5xl font-extrabold text-gray-900">{credits ?? "—"}</div>
      </CardContent>
    </Card>
  );
}

/* ===================== LOGS WOW ===================== */
function LogsPanel({ toast, onlyMine }) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [userEmail, setUserEmail] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const url = onlyMine ? "/logs/me" : "/logs";
    authFetch(toast, url)
      .then((data) => {
        if (!data) return;
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => setLogs([]));
  }, [onlyMine]);

  useEffect(() => {
    if (onlyMine) return;
    authFetch(toast, "/users")
      .then((data) => {
        if (!data) return;
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setUsers([]));
  }, [onlyMine]);

  const typeLabel = (t) => {
    if (t === "asignacion") return "Asignación NSS";
    if (t === "semanas") return "Semanas";
    if (t === "vigencia") return "Vigencia";
    if (t === "noderecho") return "No derechohabiencia";
    return t || "";
  };

  const inDateRange = (iso) => {
    if (!iso) return true;
    const d = new Date(iso);
    if (from) {
      const f = new Date(from + "T00:00:00");
      if (d < f) return false;
    }
    if (to) {
      const t = new Date(to + "T23:59:59");
      if (d > t) return false;
    }
    return true;
  };

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();

    return logs
      .filter((l) => {
        if (type !== "all" && l.type !== type) return false;
        if (!onlyMine && userEmail !== "all" && (l.email || "") !== userEmail) return false;
        if (!inDateRange(l.createdAt)) return false;

        if (!text) return true;
        const hay = [
          l.type,
          l.curp,
          l.nss,
          l.email,
          l.userEmail,
          l.userId
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(text);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [logs, q, type, userEmail, from, to, onlyMine]);

  useEffect(() => {
    setPage(1);
  }, [q, type, userEmail, from, to, onlyMine]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const exportCSV = () => {
    const rows = filtered.map((l) => ({
      fecha: l.createdAt ? new Date(l.createdAt).toISOString() : "",
      tipo: l.type || "",
      curp: l.curp || "",
      nss: l.nss || "",
      email: l.email || l.userEmail || ""
    }));

    const headers = Object.keys(rows[0] || { fecha: "", tipo: "", curp: "", nss: "", email: "" });
    const csv =
      headers.join(",") +
      "\n" +
      rows
        .map((r) =>
          headers
            .map((h) => `"${String(r[h] ?? "").replaceAll('"', '""')}"`)
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${onlyMine ? "mis_consultas" : "logs"}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("success", "CSV exportado", "Se descargó el archivo CSV.");
  };

  return (
    <>
      <Card className="max-w-6xl">
        <CardHeader
          title={onlyMine ? "Mis consultas" : "Logs"}
          subtitle="Filtros por usuario, tipo, fecha y búsqueda. Exporta CSV."
          right={
            <div className="flex items-center gap-2">
              <Pill tone="gray">{filtered.length} resultados</Pill>
              <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
            </div>
          }
        />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              label="Buscar"
              placeholder="CURP / NSS / email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">Todos</option>
              <option value="asignacion">Asignación NSS</option>
              <option value="semanas">Semanas</option>
              <option value="vigencia">Vigencia</option>
              <option value="noderecho">No derechohabiencia</option>
            </Select>

            {!onlyMine ? (
              <Select label="Usuario" value={userEmail} onChange={(e) => setUserEmail(e.target.value)}>
                <option value="all">Todos</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>{u.email}</option>
                ))}
              </Select>
            ) : (
              <div />
            )}

            <div className="grid grid-cols-2 gap-2">
              <Input label="Desde" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input label="Hasta" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <div className="overflow-auto border border-gray-100 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                  <th className="text-left px-4 py-3 font-semibold">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold">CURP</th>
                  <th className="text-left px-4 py-3 font-semibold">NSS</th>
                  {!onlyMine && <th className="text-left px-4 py-3 font-semibold">Usuario</th>}
                  <th className="text-right px-4 py-3 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-700">
                      {l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone="indigo">{typeLabel(l.type)}</Pill>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{l.curp}</td>
                    <td className="px-4 py-3 text-gray-700">{l.nss || "—"}</td>
                    {!onlyMine && <td className="px-4 py-3 text-gray-700">{l.email || "—"}</td>}
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" onClick={() => setSelected(l)}>Ver</Button>
                    </td>
                  </tr>
                ))}

                {pageItems.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={onlyMine ? 6 : 7}>
                      No hay resultados con esos filtros.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Página {pageSafe} de {totalPages}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe <= 1}>
                Anterior
              </Button>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe >= totalPages}>
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal open={!!selected} title="Detalle de consulta" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Pill tone="indigo">{typeLabel(selected.type)}</Pill>
              <Pill tone="gray">{selected.id}</Pill>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-xs font-semibold text-gray-600">CURP</div>
                <div className="font-semibold">{selected.curp}</div>
              </div>
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="text-xs font-semibold text-gray-600">NSS</div>
                <div className="font-semibold">{selected.nss || "—"}</div>
              </div>
              {!onlyMine ? (
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 md:col-span-2">
                  <div className="text-xs font-semibold text-gray-600">Usuario</div>
                  <div className="font-semibold">{selected.email || "—"}</div>
                </div>
              ) : null}
              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 md:col-span-2">
                <div className="text-xs font-semibold text-gray-600">Fecha</div>
                <div className="font-semibold">
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ""}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
