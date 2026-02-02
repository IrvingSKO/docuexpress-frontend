import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta?.env?.VITE_API_URL || "/api";



/* ============== UI components (sin shadcn) ============== */
function Card({ className = "", children }) {
  return (
    <div
      className={`bg-white border border-gray-200 shadow-sm rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function CardContent({ className = "", children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

function Button({ className = "", variant = "solid", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99]";
  const solid = "bg-indigo-600 text-white hover:bg-indigo-700";
  const ghost = "bg-transparent hover:bg-gray-100 text-gray-900";
  const styles = variant === "ghost" ? ghost : solid;

  return <button className={`${base} ${styles} ${className}`} {...props} />;
}

/* ================== HELPERS ================== */
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

  if (!res.ok) {
    throw new Error(data?.message || `Error HTTP ${res.status}`);
  }

  return { res, data };
};

/* ================== APP ================== */
export default function App() {
  const [screen, setScreen] = useState("login"); // login | admin | user
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

      if (data?.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
        setScreen(data.user.role === "admin" ? "admin" : "user");
      } else {
        alert("Respuesta inválida del servidor (sin token).");
      }
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
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      {screen === "login" && <Login onLogin={handleLogin} />}

      {screen === "admin" && (
        <AdminDashboard user={user} onLogout={logout} />
      )}

      {screen === "user" && <UserDashboard user={user} onLogout={logout} />}
    </div>
  );
}

/* ================== LOGIN ================== */
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="w-[24rem] shadow-2xl">
          <CardContent className="p-10 space-y-6">
            <h1 className="text-4xl font-extrabold text-center">
              Docu<span className="text-indigo-600">Express</span>
            </h1>

            <input
              placeholder="Correo"
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Contraseña"
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
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

/* ================== SIDEBAR ================== */
function Sidebar({ items, onLogout, user }) {
  return (
    <div className="w-72 bg-white shadow-xl p-6 flex flex-col gap-3">
      <h2 className="text-xl font-bold mb-4">
        Docu<span className="text-indigo-600">Express</span>
      </h2>

      <p className="text-xs text-gray-500 mb-4">{user?.email}</p>

      {items.map((item) => (
        <Button
          key={item.label}
          variant="ghost"
          className="justify-start rounded-xl"
          onClick={item.onClick}
        >
          {item.label}
        </Button>
      ))}

      <div className="mt-auto pt-4 border-t">
        <Button onClick={onLogout} className="w-full">
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

/* ================== DASHBOARDS ================== */
function AdminDashboard({ onLogout, user }) {
  const [section, setSection] = useState("api"); // api | users | credits | logs

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        onLogout={onLogout}
        items={[
          { label: "Consumir API", onClick: () => setSection("api") },
          { label: "Usuarios", onClick: () => setSection("users") },
          { label: "Créditos", onClick: () => setSection("credits") },
          { label: "Logs", onClick: () => setSection("logs") }
        ]}
      />

      <div className="flex-1 p-10 space-y-6">
        {section === "api" && <ApiPanel />}
        {section === "users" && <UsersPanel />}
        {section === "credits" && <CreditsPanel />}
        {section === "logs" && <LogsPanel />}
      </div>
    </div>
  );
}

function UserDashboard({ onLogout, user }) {
  const [section, setSection] = useState("api"); // api | history | credits

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        onLogout={onLogout}
        items={[
          { label: "Consultar", onClick: () => setSection("api") },
          { label: "Mis consultas", onClick: () => setSection("history") },
          { label: "Mis créditos", onClick: () => setSection("credits") }
        ]}
      />

      <div className="flex-1 p-10 space-y-6">
        {section === "api" && <ApiPanel />}
        {section === "history" && <LogsPanel onlyMine />}
        {section === "credits" && <CreditsPanel />}
      </div>
    </div>
  );
}

/* ================== API PANEL ================== */
function ApiPanel() {
  const [type, setType] = useState("semanas");
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const callApi = async () => {
    try {
      setLoading(true);
      setPdfUrl(null);

      const { data } = await authFetch("/imss", {
        method: "POST",
        body: JSON.stringify({ type, curp, nss })
      });

      if (data?.pdfUrl) {
        setPdfUrl(data.pdfUrl);
      } else {
        alert("No se recibió PDF. Revisa el backend o token IMSS.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error al generar documento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-extrabold">Consulta IMSS</h2>

        <select
          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="asignacion">Asignación NSS</option>
          <option value="semanas">Semanas cotizadas</option>
          <option value="vigencia">Vigencia de derechos</option>
          <option value="noderecho">No derechohabiencia</option>
        </select>

        <input
          placeholder="CURP"
          className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
          value={curp}
          onChange={(e) => setCurp(e.target.value)}
        />

        {(type === "semanas" || type === "vigencia") && (
          <input
            placeholder="NSS"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
            value={nss}
            onChange={(e) => setNss(e.target.value)}
          />
        )}

        <Button onClick={callApi} className="w-full">
          {loading ? "Generando..." : "Generar documento"}
        </Button>

        {pdfUrl && (
          <a href={pdfUrl} target="_blank" className="underline text-indigo-600">
            Descargar PDF
          </a>
        )}

        <p className="text-xs text-gray-500">
          Cada consulta descuenta 1 crédito.
        </p>
      </CardContent>
    </Card>
  );
}

/* ================== USERS ================== */
function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const load = async () => {
    try {
      const { data } = await authFetch("/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
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
      console.error(err);
      alert(err.message || "No se pudo crear el usuario");
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-extrabold">Usuarios</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            placeholder="correo"
            className="border p-3 rounded-xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="password"
            className="border p-3 rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={create}>Crear usuario</Button>
        </div>

        <div className="space-y-2 text-sm">
          {users.map((u) => (
            <div key={u.id} className="border rounded-xl p-3 bg-gray-50">
              <div className="font-semibold">{u.email}</div>
              <div className="text-gray-600">
                Rol: {u.role} · Créditos: {u.credits}
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-gray-500">No hay usuarios aún.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================== CREDITS ================== */
function CreditsPanel() {
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    authFetch("/credits/me")
      .then(({ data }) => setCredits(data?.credits ?? 0))
      .catch(() => {});
  }, []);

  return (
    <Card className="max-w-xl">
      <CardContent>
        <h2 className="text-xl font-extrabold mb-2">Mis créditos</h2>
        <div className="text-3xl font-extrabold">{credits}</div>
        <p className="text-xs text-gray-500 mt-2">
          Los créditos se descuentan por cada documento generado.
        </p>
      </CardContent>
    </Card>
  );
}

/* ================== LOGS ================== */
function LogsPanel({ onlyMine }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const url = onlyMine ? "/logs/me" : "/logs";
    authFetch(url)
      .then(({ data }) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [onlyMine]);

  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-3">
        <h2 className="text-xl font-extrabold">
          {onlyMine ? "Mis consultas" : "Logs"}
        </h2>

        <div className="space-y-2 text-sm">
          {logs.map((l) => (
            <div key={l.id} className="border rounded-xl p-3">
              <div className="font-semibold">{l.type}</div>
              <div className="text-gray-600">
                CURP: {l.curp} · Fecha:{" "}
                {l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-500">Aún no hay consultas.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
