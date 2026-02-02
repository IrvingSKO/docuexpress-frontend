import { useEffect, useState } from "react";

const BACKEND_URL = "https://docuexpress.onrender.com/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("Admin123!");
  const [loading, setLoading] = useState(false);

  const [type, setType] = useState("semanas");
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");

  const [pdfUrl, setPdfUrl] = useState(null);

  /* ========================
     FETCH CON AUTH
  ======================== */
  const authFetch = async (url, options = {}) => {
    const t = localStorage.getItem("token");

    const res = await fetch(`${BACKEND_URL}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      alert("Tu sesión expiró. Vuelve a iniciar sesión.");
      window.location.reload();
      return;
    }

    return res;
  };

  /* ========================
     LOGIN
  ======================== */
  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      setToken(data.token);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ========================
     GENERAR DOCUMENTO
  ======================== */
  const handleGenerate = async () => {
    setLoading(true);
    setPdfUrl(null);

    try {
      const res = await authFetch("/imss", {
        method: "POST",
        body: JSON.stringify({
          type,
          curp,
          nss,
        }),
      });

      if (!res) return;

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error al generar");

      setPdfUrl(data.pdfUrl);
      alert("Documento generado correctamente");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ========================
     DESCARGAR PDF
  ======================== */
  const handleDownload = async () => {
    try {
      const t = localStorage.getItem("token");

      const res = await fetch(
        `${BACKEND_URL}/download?url=${encodeURIComponent(pdfUrl)}`,
        {
          headers: {
            Authorization: `Bearer ${t}`,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "No se pudo descargar");
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
    } catch (e) {
      alert(e.message);
    }
  };

  /* ========================
     UI
  ======================== */
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-6 text-center">DocuExpress</h1>

          <input
            className="w-full mb-3 p-3 border rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />

          <input
            className="w-full mb-4 p-3 border rounded"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded font-semibold"
          >
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8">
        <h2 className="text-2xl font-bold mb-6">Consulta IMSS</h2>

        <select
          className="w-full p-3 border rounded mb-4"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="semanas">Semanas cotizadas</option>
        </select>

        <input
          className="w-full p-3 border rounded mb-4"
          placeholder="CURP"
          value={curp}
          onChange={(e) => setCurp(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded mb-6"
          placeholder="NSS"
          value={nss}
          onChange={(e) => setNss(e.target.value)}
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded font-semibold"
        >
          {loading ? "Generando..." : "Generar documento"}
        </button>

        {pdfUrl && (
          <button
            onClick={handleDownload}
            className="mt-4 text-indigo-700 underline font-semibold"
          >
            Descargar PDF
          </button>
        )}
      </div>
    </div>
  );
}
