import React, { useEffect, useMemo, useRef, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ===================== TOAST =====================
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const colors = {
    success: "#16a34a",
    error: "#dc2626",
    info: "#4f46e5",
  };
  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}>
      <div style={{
        background: "#fff",
        borderLeft: `6px solid ${colors[toast.type]}`,
        padding: 14,
        borderRadius: 12,
        width: 360,
        boxShadow: "0 20px 40px rgba(0,0,0,.15)"
      }}>
        <b>{toast.title}</b>
        <div style={{ fontSize: 13, marginTop: 4 }}>{toast.message}</div>
        <button onClick={onClose} style={{ marginTop: 10 }}>Cerrar</button>
      </div>
    </div>
  );
}

async function safeJson(res) {
  const t = await res.text();
  try { return JSON.parse(t); } catch { return { message: t }; }
}

async function authFetch(url, opts = {}) {
  const token = localStorage.getItem("token");
  return fetch(`${BACKEND_URL}${url}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ===================== APP =====================
export default function App() {
  const [toast, setToast] = useState(null);
  const showToast = (t) => setToast(t);

  // Auth
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState(null);

  // Admin
  const [view, setView] = useState("consultar");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  // Consultar
  const [step, setStep] = useState("cards");
  const [type, setType] = useState("semanas");
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");
  const [files, setFiles] = useState([]);

  // ================= LOGIN =================
  const login = async () => {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      showToast({ type: "error", title: "Login fallido", message: data.message });
      return;
    }
    localStorage.setItem("token", data.token);
    setMe(data.user);
    showToast({ type: "success", title: "Bienvenido", message: data.user.email });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setMe(null);
    setView("consultar");
  };

  // ================= LOAD ADMIN =================
  useEffect(() => {
    if (!me || me.role !== "admin") return;

    authFetch("/api/users").then(async r => setUsers(await safeJson(r)));
    authFetch("/api/logs").then(async r => setLogs(await safeJson(r)));
  }, [me]);

  // ================= RESET PASSWORD =================
  const resetPassword = async (id) => {
    const res = await authFetch(`/api/users/${id}/reset-password`, { method: "POST" });
    const data = await safeJson(res);
    if (!res.ok) {
      showToast({ type: "error", title: "Error", message: data.message });
      return;
    }
    showToast({
      type: "success",
      title: "Password reseteado",
      message: `Nueva contraseña: ${data.newPassword}`,
    });
  };

  // ================= CREDITS =================
  const changeCredits = async (id, amount) => {
    const res = await authFetch(`/api/credits/${id}`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
    const data = await safeJson(res);
    if (!res.ok) {
      showToast({ type: "error", title: "Error", message: data.message });
      return;
    }
    showToast({ type: "success", title: "Créditos actualizados", message: "" });
    authFetch("/api/users").then(async r => setUsers(await safeJson(r)));
  };

  // ================= GENERAR =================
  const generate = async () => {
    const res = await authFetch("/api/imss", {
      method: "POST",
      body: JSON.stringify({ type, curp, nss }),
    });
    const data = await safeJson(res);

    if (!res.ok) {
      showToast({ type: "error", title: "Inconsistencia", message: data.message });
      return;
    }

    setFiles(data.files || []);
    showToast({ type: "success", title: "PDF listo", message: "Descarga disponible" });
  };

  const download = (id, name) => {
    fetch(`${BACKEND_URL}/api/download/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    }).then(r => r.blob()).then(b => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = name;
      a.click();
    });
  };

  // ================= UI =================
  if (!me) {
    return (
      <div style={{ padding: 40 }}>
        <h2>DocuExpress</h2>
        <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={login}>Entrar</button>
        <Toast toast={toast} onClose={()=>setToast(null)} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
      <aside style={{ padding: 20, borderRight: "1px solid #e5e7eb" }}>
        <b>{me.email}</b>
        <div>{me.credits} créditos</div>
        <button onClick={()=>setView("consultar")}>Consultar</button>
        {me.role === "admin" && <>
          <button onClick={()=>setView("users")}>Usuarios</button>
          <button onClick={()=>setView("logs")}>Logs</button>
        </>}
        <button onClick={logout}>Salir</button>
      </aside>

      <main style={{ padding: 30 }}>
        {view === "consultar" && (
          <>
            <h2>Consultar</h2>
            <input placeholder="CURP" value={curp} onChange={e=>setCurp(e.target.value)} />
            <input placeholder="NSS" value={nss} onChange={e=>setNss(e.target.value)} />
            <button onClick={generate}>Generar</button>

            {files.map(f => (
              <button key={f.fileId} onClick={()=>download(f.fileId, f.filename)}>
                Descargar {f.filename}
              </button>
            ))}
          </>
        )}

        {view === "users" && (
          <>
            <h2>Usuarios</h2>
            {users.map(u => (
              <div key={u.id}>
                {u.email} — {u.credits}
                <button onClick={()=>resetPassword(u.id)}>Reset pass</button>
                <button onClick={()=>changeCredits(u.id, 10)}>+10</button>
                <button onClick={()=>changeCredits(u.id, -10)}>-10</button>
              </div>
            ))}
          </>
        )}

        {view === "logs" && (
          <>
            <h2>Logs</h2>
            {logs.map(l => (
              <div key={l.id}>{l.email} – {l.type}</div>
            ))}
          </>
        )}
      </main>

      <Toast toast={toast} onClose={()=>setToast(null)} />
    </div>
  );
}
