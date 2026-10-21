import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Painel administrativo — Radar de Influência" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: AdminGate,
});

function AdminGate() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<"loading" | "anonymous" | "forbidden" | "admin">("loading");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) {
          if (active) { setUser(null); setState("anonymous"); }
          return;
        }
        const { data: role, error: roleError } = await supabase.from("user_roles")
          .select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
        if (roleError) throw roleError;
        if (active) { setUser(data.user); setState(role ? "admin" : "forbidden"); }
      } catch (e) {
        if (active) { setError(e instanceof Error ? e.message : "Erro ao verificar acesso"); setState("forbidden"); }
      }
    }
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { setTimeout(() => { void check(); }, 0); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  if (state === "loading") return <div className="mx-auto max-w-4xl px-4 py-12">Verificando acesso administrativo…</div>;
  if (state === "anonymous") return <AdminLogin />;
  if (state === "forbidden") return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="card-slim space-y-3 p-6">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">Sua conta não possui permissão de administrador. Um proprietário precisa cadastrar seu usuário e atribuir o papel de admin pelo painel seguro do Supabase.</p>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => void supabase.auth.signOut()}>Sair da conta</button>
      </div>
    </div>
  );
  return <AdminConsole user={user!} />;
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
    } catch (e) { setError(e instanceof Error ? e.message : "Falha no login"); }
    finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form className="card-slim space-y-4 p-6" onSubmit={(e) => void signIn(e)}>
        <div>
          <h1 className="text-2xl font-bold">Acesso administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">Somente contas previamente autorizadas. Não há cadastro público de administradores.</p>
        </div>
        <label className="block text-sm">E-mail
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border bg-card p-2.5" />
        </label>
        <label className="block text-sm">Senha
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border bg-card p-2.5" />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button disabled={busy} type="submit" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}
