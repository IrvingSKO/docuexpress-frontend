import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

// ✅ deja esto así; ya lo tienes funcionando con env vars
const BACKEND_URL =
  import.meta?.env?.VITE_API_URL || "https://docuexpress.onrender.com/api";

/* -------------------- UI atoms -------------------- */
function cx(...arr) {
  return arr.filter(Boolean).join(" ");
}

function Card({ className = "", children }) {
  return (
    <div
      className={cx(
        "bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
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
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900">{title}</h2>
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
  const solid = "bg-indigo-600 text-white hover:bg-indigo-700";
  const ghost = "bg-transparent hover:bg-gray-100 text-gray-900";
  const outline =
    "bg-white border border-gray-200 hover:bg-gray-50 text-gray-900";
  const danger =
    "bg-rose-600 text-white hover:bg-rose-700";

  const styles =
    variant === "ghost"
      ? ghost
      : variant === "outline"
      ? outline
      : variant === "danger"
      ? danger
      : solid;

  return <button className={cx(base, styles, className)} {...props} />;
}

function Input({ label, ...props }) {
  return (
    <label className="block">
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

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
      {children}
    </span>
  );
}

/* -------------------- helpers -------------------- */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const authFetch = async (url, options = {}) => {
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
  if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
  return data;
};

/* -------------------- App -------------------- */
export default function App() {
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(res);
      if (!res.ok) {
        alert(data?.message || `Error HTTP ${res.status}`);
        return;
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);
      setScreen(data.user.role === "admin" ? "admin" : "user");
    } catch (err) {
      console.error(err);
      alert("No se pudo conectar con el backend");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setScreen("login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {screen === "login" && <Login onLogin={handleLogin} />}

      {screen === "admin" && (
        <Shell user={user} onLogout={logout} role="admin" />
      )}

      {screen === "user" && (
        <Shell user={user} onLogout={logout} role="user" />
      )}
    </div>
  );
}

/* -------------------- Login -------------------- */
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

            <Input
              label="Correo"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button className="w-full" onClick={() => onLogin(email, password)}>
              Iniciar sesión
            </Button>

            <div className="text-xs text-gray-500 leading-relaxed">
              <p className="font-semibold">Demo:</p>
              <p>Admin: admin@docuexpress.com / Admin123!</p>
              <p>Cliente: cliente@docuexpress.com / Cliente123!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* -------------------- Shell / Layout -------------------- */
function Shell({ user, onLogout, role }) {
  const [section, setSection] = useState(role === "admin" ? "api" : "api");
  const [credits, setCredits] = useState(null);

  const menu = useMemo(() => {
    if (role === "admin") {
      return [
        { key: "api", label: "Consumir API" },
        { key: "users", label: "Usuarios" },
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
      const data = await authFetch("/credits/me");
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
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-xl">
            Docu<span className="text-indigo-600">Express</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="text-xs text-gray-500">Sesión</div>
          <div className="text-sm font-semibold text-gray-900 mt-1">
            {user?.email}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Pill>{role === "admin" ? "Admin" : "Usuario"}</Pill>
            {credits !== null ? <Pill>{credits} créditos</Pill> : null}
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
                    ? "bg-indigo-600 text-white shadow"
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

      {/* Main */}
      <main className="flex-1 p-8">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-gray-500">DocuExpress</div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {role === "admin" ? "Panel de Administración" : "Panel de Usuario"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refreshCredits}>
              Actualizar créditos
            </Button>
          </div>
        </div>

        {/* Content */}
        {section === "api" && <ApiPanel onAfterSuccess={refreshCredits} />}
        {section === "users" && role === "admin" && <UsersPanel />}
        {section === "credits" && <CreditsPanel credits={credits} />}
        {section === "logs" && role === "admin" && <LogsPanel onlyMine={false} />}
        {section === "history" && role !== "admin" && <LogsPanel onlyMine />}
      </main>
    </div>
  );
}

/* -------------------- Panels -------------------- */
function ApiPanel({ onAfterSuccess }) {
  const [type, setType] = useState("semanas");
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const callApi = async () => {
    try {
      setLoading(true);
      setPdfUrl(null);

      const data = await authFetch("/imss", {
        method: "POST",
        body: JSON.stringify({ type, curp, nss })
      });

      if (data?.pdfUrl) {
        setPdfUrl(data.pdfUrl);
        onAfterSuccess?.();
      } else {
        alert("No se recibió PDF. Revisa el backend/token IMSS.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error al generar documento");
    } finally {
      setLoading(false);
    }
  };

  const needsNss = type === "semanas" || type === "vigencia";

  return (
    <Card className="max-w-3xl">
      <CardHeader
        title="Consulta IMSS"
        subtitle="Genera documentos oficiales; cada consulta descuenta 1 crédito."
        right={<Pill>1 crédito / consulta</Pill>}
      />
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Tipo de documento"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="asignacion">Asignación NSS</option>
          <option value="semanas">Semanas cotizadas</option>
          <option value="vigencia">Vigencia de derechos</option>
          <option value="noderecho">No derechohabiencia</option>
        </Select>

        <div className="hidden md:block" />

        <Input
          label="CURP"
          placeholder="Ej. GOML990618HCSMZR07"
          value={curp}
          onChange={(e) => setCurp(e.target.value.toUpperCase())}
        />

        <Input
          label="NSS"
          placeholder={needsNss ? "Obligatorio para este trámite" : "Opcional"}
          value={nss}
          onChange={(e) => setNss(e.target.value)}
          disabled={!needsNss}
        />

        <div className="md:col-span-2">
          <Button
            onClick={callApi}
            className="w-full"
            disabled={loading || !curp || (needsNss && !nss)}
          >
            {loading ? "Generando..." : "Generar documento"}
          </Button>

          {pdfUrl ? (
            <div className="mt-4">
              <a
                href={pdfUrl}
                target="_blank"
                className="text-indigo-700 underline font-semibold"
              >
                Descargar PDF
              </a>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const load = async () => {
    try {
      const data = await authFetch("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err.message || "No se pudieron cargar usuarios");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      await authFetch("/users", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setEmail("");
      setPassword("");
      load();
    } catch (err) {
      alert(err.message || "No se pudo crear usuario");
    }
  };

  return (
    <Card className="max-w-4xl">
      <CardHeader
        title="Usuarios"
        subtitle="Crea usuarios para que consuman consultas."
      />
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Correo"
            placeholder="cliente@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {u.email}
                  </td>
                  <td className="px-4 py-3">
                    <Pill>{u.role}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <Pill>{u.credits}</Pill>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={3}>
                    No hay usuarios aún.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CreditsPanel({ credits }) {
  return (
    <Card className="max-w-3xl">
      <CardHeader title="Créditos" subtitle="Los créditos se descuentan por documento generado." />
      <CardContent>
        <div className="text-5xl font-extrabold text-gray-900">
          {credits ?? "—"}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Tip: si vas a vender esto, aquí luego metemos MercadoPago/Stripe.
        </div>
      </CardContent>
    </Card>
  );
}

function LogsPanel({ onlyMine }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const url = onlyMine ? "/logs/me" : "/logs";
    authFetch(url)
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));
  }, [onlyMine]);

  return (
    <Card className="max-w-5xl">
      <CardHeader
        title={onlyMine ? "Mis consultas" : "Logs"}
        subtitle="Registro de consultas realizadas."
        right={<Pill>{logs.length} registros</Pill>}
      />
      <CardContent className="space-y-3">
        {logs.map((l) => (
          <div
            key={l.id}
            className="border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <Pill>{l.type}</Pill>
              <span className="text-sm text-gray-700 font-semibold">
                CURP: {l.curp}
              </span>
              {l.nss ? (
                <span className="text-sm text-gray-500">NSS: {l.nss}</span>
              ) : null}
            </div>
            <div className="text-sm text-gray-500">
              {l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}
            </div>
          </div>
        ))}
        {logs.length === 0 ? (
          <div className="text-gray-500">Aún no hay consultas.</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
