import { useState } from "react";

export default function AdminResetPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email || !password) { setError("Preencha o email e a nova senha."); return; }
    setLoading(true); setError(""); setMessage("");

    try {
      const auth = JSON.parse(localStorage.getItem("oss_auth") || "{}");
      const token = auth?.token;

      const res = await fetch("/api/auth/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetEmail: email, newPassword: password })
      });

      const data = await res.json();
      if (data.success) { setMessage(data.message); setEmail(""); setPassword(""); }
      else setError(data.error || "Erro ao resetar senha.");
    } catch (e) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
      <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">🔐 Reset de Senha — Master</h2>

      <div className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email do usuário"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="bg-slate-800 text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
        />
        <input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="bg-slate-800 text-white rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 text-sm"
        />
        
        <div className="flex flex-col gap-1.5 my-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Senhas Padrões:</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPassword("oss@123")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                password === "oss@123"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              🥋 oss@123
            </button>
            <button
              type="button"
              onClick={() => setPassword("sysbjj2026")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                password === "sysbjj2026"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              🔥 sysbjj2026
            </button>
            <button
              type="button"
              onClick={() => setPassword("mudar@123")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                password === "mudar@123"
                  ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                  : "bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              ⚙️ mudar@123
            </button>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 text-sm cursor-pointer"
        >
          {loading ? "Resetando..." : "🥋 Resetar Senha"}
        </button>

        {message && <p className="text-green-400 text-sm font-medium animate-pulse">{message}</p>}
        {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
      </div>
    </div>
  );
}
