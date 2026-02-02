import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ================== CONFIG ================== */
const BACKEND_URL =
  import.meta?.env?.VITE_API_URL || "https://docuexpress.onrender.com/api";

/* ================== UI ================== */
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ================== HELPERS ================== */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/* 🔐 FETCH AUTENTICADO */
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

  if (res.status === 401) {
    localStorage.removeItem("token");
    alert("Tu sesión expiró. Vuelve a iniciar sesión.");
    window.location.reload();
    return;
  }

  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.message || "Error del servidor");
  }

  return res;
};

/* ================== APP ================== */
export default function App() {
  const [screen, setScreen] = useState("login");
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Credenciales incorrectas");
        return;
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);
      setScreen(data.user.role === "admin" ? "admin" : "user");
    } catch {
      alert("No se pudo conectar al backend");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {screen === "login" && <Login onLogin={login} />}
      {screen === "admin" && <Dashboard user={user} onLogout={logout} />}
      {screen === "user" && <Dashboard user={user} onLogout={logout} />}
    </div>
  );
}

/* ================== LOGIN ================== */
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8 w-96">
          <h1 className="text-3xl font-bold text-center mb-6">
            Docu<span className="text-indigo-600">Express</span>
          </h1>

          <input
            className="w-full border p-3 rounded-xl mb-3"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full border p-3 rounded-xl mb-4"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={() => onLogin(email, password)}
          >
            Iniciar sesión
          </Button>

          <p className="text-xs text-gray-500 mt-4">
            Admin: admin@docuexpress.com / Admin123!
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

/* ================== DASHBOARD ================== */
function Dashboard({ user, onLogout }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white p-6 border-r">
        <h2 className="font-bold text-lg mb-4">
          Docu<span className="text-indigo-600">Express</span>
        </h2>

        <p className="text-xs text-gray-500 mb-6">{user.email}</p>

        <Button className="w-full mb-4" onClick={onLogout}>
          Cerrar sesión
        </Button>
      </aside>

      <main className="flex-1 p-10">
        <ApiPanel />
      </main>
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

  const generar = async () => {
    try {
      setLoading(true);
      setPdfUrl(null);

      const res = await authFetch("/imss", {
        method: "POST",
        body: JSON.stringify({ type, curp, nss })
      });

      const data = await res.json();

      if (!data?.pdfUrl) {
        alert("No se recibió PDF");
        return;
      }

      setPdfUrl(data.pdfUrl);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl p-6">
      <h2 className="text-xl font-bold mb-4">Consulta IMSS</h2>

      <select
        className="w-full border p-3 rounded-xl mb-3"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="asignacion">Asignación NSS</option>
        <option value="semanas">Semanas cotizadas</option>
        <option value="vigencia">Vigencia</option>
      </select>

      <input
        className="w-full border p-3 rounded-xl mb-3"
        placeholder="CURP"
        value={curp}
        onChange={(e) => setCurp(e.target.value)}
      />

      {(type === "semanas" || type === "vigencia") && (
        <input
          className="w-full border p-3 rounded-xl mb-3"
          placeholder="NSS"
          value={nss}
          onChange={(e) => setNss(e.target.value)}
        />
      )}

      <Button className="w-full" onClick={generar} disabled={loading}>
        {loading ? "Generando..." : "Generar documento"}
      </Button>

      {pdfUrl && (
        <a
          href={`${BACKEND_URL}/download?url=${encodeURIComponent(pdfUrl)}`}
          className="block mt-4 text-indigo-700 underline font-semibold"
        >
          Descargar PDF
        </a>
      )}
    </Card>
  );
}
