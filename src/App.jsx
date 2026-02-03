 import React, { useEffect, useMemo, useRef, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // ej: https://docuexpress.onrender.com

// ------------------ UI helpers (Toasts) ------------------
function Toast({ toast, onClose }) {
  // toast: { type: 'success'|'error'|'info', title, message }
  if (!toast) return null;

  const typeStyles = {
    success: { border: "#22c55e", bg: "#f0fdf4", title: "#166534" },
    error: { border: "#ef4444", bg: "#fef2f2", title: "#7f1d1d" },
    info: { border: "#6366f1", bg: "#eef2ff", title: "#312e81" },
  };

  const s = typeStyles[toast.type || "info"];

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        width: 360,
        zIndex: 9999,
      }}
    >
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
            <div style={{ fontWeight: 800, color: s.title, marginBottom: 4 }}>
              {toast.title}
            </div>
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

// ------------------ download helper ------------------
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

  // Auth state
  const [email, setEmail] = useState("admin@docuexpress.com");
  const [password, setPassword] = useState("Admin123!");
  const [me, setMe] = useState(null);

  // UI navigation
  const [view, setView] = useState("consultar"); // consultar | users | logs | credits etc
  const [step, setStep] = useState("cards"); // cards | form

  // Consult form
  const [type, setType] = useState("semanas"); // semanas | nss | vigencia | noderecho
  const [curp, setCurp] = useState("");
  const [nss, setNss] = useState("");

  // result state
  const [generating, setGenerating] = useState(false);
  const [lastFileId, setLastFileId] = useState(null);
  const [lastFiles, setLastFiles] = useState([]); // {fileId, filename}

  // ---- load session (if token exists) ----
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    // Try to fetch credits/me or similar endpoint
    (async () => {
      try {
        const res = await authFetch("/api/credits/me");
        if (res.status === 401) {
          localStorage.removeItem("token");
          return;
        }
        const data = await safeJson(res);
        // We don't necessarily get full user, so keep minimal
        setMe((prev) => prev || { email: "sesión activa", role: "user", credits: data.credits ?? 0 });
      } catch {
        // ignore
      }
    })();
  }, []);

  // ---- login ----
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
          title: "No se pudo iniciar sesión",
          message: data.message || `Error HTTP ${res.status}`,
        });
        return;
      }

      localStorage.setItem("token", data.token);
      setMe(data.user);
      showToast({ type: "success", title: "Sesión iniciada", message: "Bienvenido 👋" });
    } catch (e) {
      showToast({ type: "error", title: "Error de red", message: "No se pudo conectar al servidor." });
    }
  };

  const onLogout = () => {
    localStorage.removeItem("token");
    setMe(null);
    setLastFileId(null);
    setLastFiles([]);
    setStep("cards");
    showToast({ type: "info", title: "Sesión cerrada", message: "Hasta luego." });
  };

  // ---- basic validation ----
  const validate = () => {
    const c = curp.trim().toUpperCase();
    const n = nss.trim();

    // CURP básica: 18 chars alfanum
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

    if (type === "nss" || type === "noderecho") {
      // depende tu backend, pero tú mostrabas "solo CURP" para algunos
      // Aquí dejamos NSS opcional
    }

    return true;
  };

  // ---- paste helper ----
  const pasteCurpNss = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim().toUpperCase();
      // detectar NSS 11 dígitos y CURP 18
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
        title: "Permiso de portapapeles",
        message: "Tu navegador bloqueó el portapapeles. Intenta con Ctrl+V manualmente.",
      });
    }
  };

  // ---- generate ----
  const onGenerate = async () => {
    if (!validate()) return;

    setGenerating(true);
    setLastFileId(null);
    setLastFiles([]);

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

      // ✅ si token expira
      if (res.status === 401) {
        localStorage.removeItem("token");
        setMe(null);
        showToast({
          type: "info",
          title: "Sesión expirada",
          message: "Vuelve a iniciar sesión.",
        });
        return;
      }

      // ✅ inconsistencias / errores del backend
      if (!res.ok) {
        showToast({
          type: "error",
          title: "Inconsistencia",
          message: data.message || "IMSS no devolvió PDF. Intenta de nuevo.",
        });
        return;
      }

      // Esperamos: { fileId } o { files:[{fileId, filename}] }
      if (data.files?.length) {
        setLastFiles(data.files);
        showToast({
          type: "success",
          title: "Documento(s) generado(s)",
          message: `Listo. Se generaron ${data.files.length} PDF(s).`,
        });
      } else if (data.fileId) {
        setLastFileId(data.fileId);
        showToast({ type: "success", title: "Documento generado", message: "Listo para descargar." });
      } else {
        showToast({
          type: "error",
          title: "Inconsistencia",
          message: "No se recibió fileId del backend.",
        });
      }

      // refrescar créditos del usuario
      try {
        const r2 = await authFetch("/api/credits/me");
        const d2 = await safeJson(r2);
        setMe((m) => (m ? { ...m, credits: d2.credits ?? m.credits } : m));
      } catch {
        // ignore
      }
    } catch {
      showToast({
        type: "error",
        title: "Error de red",
        message: "No se pudo conectar al backend (Render).",
      });
    } finally {
      setGenerating(false);
    }
  };

  // ---- download (no abre pestaña) ----
  const downloadSingle = async (fileId, filename) => {
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
        return;
      }

      if (!res.ok) {
        const data = await safeJson(res);
        showToast({ type: "error", title: "No se pudo descargar", message: data.message || `HTTP ${res.status}` });
        return;
      }

      const blob = await res.blob();
      downloadBlob(blob, filename);
      showToast({ type: "success", title: "Descarga iniciada", message: filename });
    } catch {
      showToast({ type: "error", title: "Error de red", message: "No se pudo descargar el archivo." });
    }
  };

  const filenameFor = useMemo(() => {
    const c = curp.trim().toUpperCase();
    if (!c) return "documento.pdf";
    if (type === "semanas") return `semanas_${c}.pdf`;
    if (type === "vigencia") return `vigencia_${c}.pdf`;
    if (type === "nss") return `nss_${c}.pdf`;
    if (type === "noderecho") return `noderecho_${c}.pdf`;
    return `documento_${c}.pdf`;
  }, [type, curp]);

  const isLogged = !!me;

  // ------------------ UI ------------------
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh", background: "#f6f7fb" }}>
        {/* Sidebar */}
        <aside style={{ padding: 18, borderRight: "1px solid #e5e7eb", background: "#fff" }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 18 }}>
            Docu<span style={{ color: "#4f46e5" }}>Express</span>
          </div>

          {isLogged ? (
            <div style={{ padding: 14, border: "1px solid #eef2ff", background: "#f8fafc", borderRadius: 16 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Sesión</div>
              <div style={{ fontWeight: 800 }}>{me.email}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#eef2ff",
                    color: "#3730a3",
                    fontWeight: 700,
                  }}
                >
                  {me.role === "admin" ? "Admin" : "User"}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "#ecfeff",
                    color: "#155e75",
                    fontWeight: 700,
                  }}
                >
                  {me.credits ?? 0} créditos
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: 14, border: "1px solid #e5e7eb", background: "#fff", borderRadius: 16 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Iniciar sesión</div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  marginBottom: 10,
                }}
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  marginBottom: 10,
                }}
              />
              <button
                onClick={onLogin}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 12,
                  border: "none",
                  background: "#4f46e5",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
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
                fontWeight: 800,
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
                background: "#fff",
                color: "#111827",
                fontWeight: 800,
                cursor: !isLogged || me.role !== "admin" ? "not-allowed" : "pointer",
                opacity: !isLogged || me.role !== "admin" ? 0.5 : 1,
              }}
            >
              Usuarios
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
                fontWeight: 800,
                cursor: !isLogged ? "not-allowed" : "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ padding: 26 }}>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>DocuExpress</div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.5 }}>
                {me?.role === "admin" ? "Panel de Administración" : "Panel"}
              </div>
            </div>

            {view === "consultar" && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 22px 50px rgba(0,0,0,.08)",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: 18, borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, letterSpacing: -0.3, fontSize: 18 }}>CONSULTAR</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>Elige el trámite que deseas generar.</div>
                  </div>
                  <span style={{ fontSize: 12, padding: "6px 10px", borderRadius: 999, border: "1px solid #e5e7eb", background: "#f8fafc" }}>
                    PDFs duran 24h
                  </span>
                </div>

                <div style={{ padding: 18 }}>
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
                          key: "nss",
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
                          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>{c.title}</div>
                          <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.4 }}>{c.desc}</div>
                          <div style={{ marginTop: 12 }}>
                            <span
                              style={{
                                fontSize: 12,
                                padding: "6px 10px",
                                borderRadius: 999,
                                background: "#f8fafc",
                                border: "1px solid #e5e7eb",
                                fontWeight: 700,
                              }}
                            >
                              {c.badge}
                            </span>
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
                        <button
                          onClick={() => setStep("cards")}
                          style={{
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            padding: "8px 12px",
                            borderRadius: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          ← Atrás
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>CURP</div>
                          <input
                            value={curp}
                            onChange={(e) => setCurp(e.target.value.toUpperCase())}
                            placeholder="Ej. MAGC790705HTLRNR03"
                            style={{
                              width: "100%",
                              padding: 12,
                              borderRadius: 14,
                              border: "1px solid #e5e7eb",
                              outline: "none",
                            }}
                          />
                        </div>

                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                            NSS {(type === "semanas" || type === "vigencia") ? "(obligatorio)" : "(opcional)"}
                          </div>
                          <input
                            value={nss}
                            onChange={(e) => setNss(e.target.value)}
                            placeholder={(type === "semanas" || type === "vigencia") ? "11 dígitos" : "Opcional"}
                            style={{
                              width: "100%",
                              padding: 12,
                              borderRadius: 14,
                              border: "1px solid #e5e7eb",
                              outline: "none",
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <button
                          onClick={pasteCurpNss}
                          style={{
                            padding: 12,
                            borderRadius: 14,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          Pegar CURP/NSS
                        </button>

                        <button
                          onClick={onGenerate}
                          disabled={!isLogged || generating}
                          style={{
                            padding: 12,
                            borderRadius: 14,
                            border: "none",
                            background: generating ? "#9ca3af" : "#4f46e5",
                            color: "#fff",
                            fontWeight: 900,
                            cursor: !isLogged || generating ? "not-allowed" : "pointer",
                          }}
                        >
                          {generating ? "Generando…" : "Generar documento"}
                        </button>
                      </div>

                      {/* Download area */}
                      <div style={{ marginTop: 16 }}>
                        {lastFiles.length > 0 ? (
                          <div style={{ display: "grid", gap: 10 }}>
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
                                  fontWeight: 800,
                                }}
                              >
                                Descargar: {f.filename || "documento.pdf"}
                              </button>
                            ))}
                          </div>
                        ) : lastFileId ? (
                          <button
                            onClick={() => downloadSingle(lastFileId, filenameFor)}
                            style={{
                              marginTop: 10,
                              border: "none",
                              background: "transparent",
                              color: "#4f46e5",
                              fontWeight: 900,
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            Descargar PDF
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === "users" && (
              <div style={{ padding: 18, background: "#fff", borderRadius: 18, border: "1px solid #e5e7eb" }}>
                <b>Usuarios (Admin)</b>
                <div style={{ color: "#6b7280", marginTop: 6 }}>
                  Esta sección la armamos en el paso 6 (admin completo).
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
