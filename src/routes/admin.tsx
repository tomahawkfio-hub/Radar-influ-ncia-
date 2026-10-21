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
  const [linkSent, setLinkSent] = useState(false);
  async function sendMagicLink() {
    if (!email.trim()) { setError("Informe seu e-mail."); return; }
    setBusy(true); setError(""); setLinkSent(false);
    try {
      const { error: requestError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (requestError) throw requestError;
      setLinkSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível enviar o link."); }
    finally { setBusy(false); }
  }
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
          <p className="mt-2 text-sm text-muted-foreground">O acesso administrativo é concedido separadamente após a verificação do e-mail. Entrar não concede permissões automaticamente.</p>
        </div>
        <label className="block text-sm">E-mail
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border bg-card p-2.5" />
        </label>
        <label className="block text-sm">Senha
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border bg-card p-2.5" />
        </label>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {linkSent && <p role="status" className="rounded-lg border border-success/30 p-3 text-sm text-success">Se o serviço de autenticação estiver habilitado, você receberá um link de acesso no e-mail informado. Verifique também o spam. Ao entrar, aguarde a liberação administrativa.</p>}
        <button disabled={busy} type="submit" className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? "Entrando…" : "Entrar com senha"}</button>
        <div className="relative py-1 text-center text-xs text-muted-foreground">ou</div>
        <button disabled={busy || !email.trim()} type="button" onClick={() => void sendMagicLink()} className="w-full rounded-lg border bg-card px-4 py-2.5 text-sm font-medium disabled:opacity-50">Receber link de acesso por e-mail</button>
        <p className="text-xs text-muted-foreground">O endereço da aplicação precisa estar autorizado nos redirecionamentos do Supabase Auth. Nunca envie senhas por mensagens.</p>
      </form>
    </div>
  );
}
