import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Database, FileUp, Globe2, RefreshCcw, Users, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { CATEGORIES, PLATFORMS, fmtDate, slugify } from "@/lib/format";
import { personInput, accountInput, parseSnapshotCsv } from "@/lib/admin-validation";

type Person = Tables<"people">;
type Account = Tables<"social_accounts">;
type Source = Tables<"data_sources">;
type Category = Tables<"categories">;
type Ingest = Tables<"ingest_runs">;
type Tab = "people" | "accounts" | "metrics" | "sources" | "logs";
const field = "mt-1 w-full rounded-lg border bg-card px-3 py-2 text-sm";
const button = "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";
const mutedButton = "rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50";
const statusValues = ["draft", "approved", "archived"] as const;
const statusLabel: Record<string, string> = { draft: "Rascunho", approved: "Aprovado", archived: "Arquivado" };

function Label({ title, children }: { title: string; children: ReactNode }) {
  return <label className="block text-xs font-medium text-muted-foreground">{title}{children}</label>;
}
function StatusSelect({ value, onChange }: { value: Person["status"]; onChange: (v: Person["status"]) => void }) {
  return <select className={field} value={value} onChange={(e) => onChange(e.target.value as Person["status"])}>
    {statusValues.map((s) => <option value={s} key={s}>{statusLabel[s]}</option>)}
  </select>;
}
function PageError({ error }: { error: unknown }) {
  return <p role="alert" className="rounded-lg border border-danger/20 bg-danger-soft p-4 text-sm text-danger">{error instanceof Error ? error.message : String(error)}</p>;
}
function loadTable<T>(table: "people"|"social_accounts"|"categories"|"data_sources"|"ingest_runs", options?: { order?: string }) {
  return async (): Promise<T[]> => {
    // Table names are fixed internal literals, never derived from user input.
    const q = supabase.from(table).select("*").order(options?.order ?? "created_at", { ascending: false }).limit(500);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as T[];
  };
}
export function AdminConsole({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>("people");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const peopleQ = useQuery({ queryKey: ["admin","people"], queryFn: loadTable<Person>("people") });
  const accountsQ = useQuery({ queryKey: ["admin","accounts"], queryFn: loadTable<Account>("social_accounts") });
  const categoriesQ = useQuery({ queryKey: ["admin","categories"], queryFn: loadTable<Category>("categories", {order:"sort_order"}) });
  const sourcesQ = useQuery({ queryKey: ["admin","sources"], queryFn: loadTable<Source>("data_sources") });
  const logsQ = useQuery({ queryKey: ["admin","logs"], queryFn: loadTable<Ingest>("ingest_runs", {order:"started_at"}) });
  const joinQ = useQuery({ queryKey: ["admin","person_categories"], queryFn: async () => {
    const { data, error } = await supabase.from("person_categories").select("person_id,category_id").limit(3000);
    if (error) throw error;
    return data ?? [];
  } });
  const reload = () => qc.invalidateQueries({ queryKey: ["admin"] });
  async function action(label: string, cb: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setNotice("");
    try { await cb(); await reload(); setNotice(label + " realizado com sucesso."); }
    catch (e) { setNotice("Erro: " + (e instanceof Error ? e.message : "operação indisponível")); }
    finally { setBusy(false); }
  }

  const views: { key: Tab; label: string }[] = [
    { key:"people",label:"Pessoas" },{ key:"accounts",label:"Contas sociais" },{ key:"metrics",label:"Métricas e CSV" },
    { key:"sources",label:"Fontes" },{ key:"logs",label:"Histórico" },
  ];
  const loading = peopleQ.isLoading || accountsQ.isLoading || sourcesQ.isLoading || categoriesQ.isLoading || joinQ.isLoading;
  const error = peopleQ.error || accountsQ.error || categoriesQ.error || sourcesQ.error || joinQ.error;
  return <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><div className="eyebrow flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Área restrita</div>
        <h1 className="mt-1 text-3xl font-bold">Painel administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conectado como {user.email}. Operações validadas pelo Supabase e protegidas por RLS.</p>
      </div>
      <div className="flex gap-2">
        <button className={mutedButton} onClick={() => void reload()}><RefreshCcw className="mr-1 inline h-4 w-4" /> Atualizar</button>
        <button className={mutedButton} onClick={() => void supabase.auth.signOut()}>Sair</button>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="card-slim p-4"><div className="eyebrow"><Users className="mr-1 inline h-4 w-4"/>Pessoas</div><div className="mt-2 text-2xl font-semibold">{peopleQ.data?.length ?? "—"}</div></div>
      <div className="card-slim p-4"><div className="eyebrow"><Globe2 className="mr-1 inline h-4 w-4"/>Contas monitoradas</div><div className="mt-2 text-2xl font-semibold">{accountsQ.data?.length ?? "—"}</div></div>
      <div className="card-slim p-4"><div className="eyebrow"><Database className="mr-1 inline h-4 w-4"/>Fontes cadastradas</div><div className="mt-2 text-2xl font-semibold">{sourcesQ.data?.length ?? "—"}</div></div>
    </div>
    <div className="flex flex-wrap gap-2 border-b pb-3" role="tablist" aria-label="Administração">
      {views.map((v) => <button key={v.key} role="tab" aria-selected={tab === v.key} className={tab === v.key ? button : mutedButton} onClick={() => setTab(v.key)}>{v.label}</button>)}
    </div>
    {notice && <div role="status" className={notice.startsWith("Erro:") ? "rounded-lg border border-danger/30 p-3 text-sm text-danger" : "rounded-lg border border-success/30 p-3 text-sm text-success"}>{notice}</div>}
    {loading ? <p>Carregando registros…</p> : error ? <PageError error={error} /> : <>
      {tab === "people" && <PeoplePanel people={peopleQ.data ?? []} categories={categoriesQ.data ?? []} joins={joinQ.data ?? []} busy={busy} action={action} />}
      {tab === "accounts" && <AccountsPanel people={peopleQ.data ?? []} accounts={accountsQ.data ?? []} busy={busy} action={action} />}
      {tab === "metrics" && <MetricsPanel people={peopleQ.data ?? []} accounts={accountsQ.data ?? []} sources={sourcesQ.data ?? []} userId={user.id} busy={busy} action={action} />}
      {tab === "sources" && <SourcesPanel sources={sourcesQ.data ?? []} busy={busy} action={action} />}
      {tab === "logs" && (logsQ.error ? <PageError error={logsQ.error} /> : <LogsPanel logs={logsQ.data ?? []} />)}
    </>}
    <p className="text-xs text-muted-foreground">Atenção: fontes de API não estão conectadas automaticamente. Os dados fictícios são identificados com o selo Demo e não representam pessoas reais.</p>
  </div>;
}

type Handler = (label: string, callback: () => Promise<void>) => Promise<void>;
type PanelProps = { busy: boolean; action: Handler };
function PeoplePanel({ people, categories, joins, busy, action }: PanelProps & { people: Person[]; categories: Category[]; joins: {person_id:string;category_id:string}[] }) {
  const [editing, setEditing] = useState<Person|null>(null);
  const [name, setName] = useState(""); const [country, setCountry] = useState("BR");
  const [slug, setSlug] = useState(""); const [party, setParty] = useState("");
  const [office, setOffice] = useState(""); const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(""); const [status, setStatus] = useState<Person["status"]>("draft");
  const [category, setCategory] = useState(""); const [demo, setDemo] = useState(false);
  function reset() { setEditing(null);setName("");setSlug("");setCountry("BR");setParty("");setOffice("");setBio("");setAvatar("");setStatus("draft");setCategory("");setDemo(false); }
  function edit(p: Person) {setEditing(p);setName(p.name);setSlug(p.slug);setCountry(p.country_code);setParty(p.party??"");setOffice(p.political_office??"");setBio(p.bio??"");setAvatar(p.avatar_url??"");setStatus(p.status);setDemo(p.is_demo);setCategory(joins.find((j)=>j.person_id===p.id)?.category_id??"");}
  async function save(e: FormEvent) {
    e.preventDefault();
    await action(editing ? "Atualização da pessoa" : "Cadastro da pessoa", async () => {
      const payload = personInput.parse({
        name,slug,country_code:country.trim().toUpperCase(),party:party||null,political_office:office||null,
        bio:bio||null,avatar_url:avatar||null,status,is_demo:demo
      });
      let id = editing?.id;
      if (id) {
        const { error } = await supabase.from("people").update(payload).eq("id", id); if(error) throw error;
      } else {
        const { data, error } = await supabase.from("people").insert(payload).select("id").single();
        if(error) throw error; id = data.id;
      }
      if (id) {
        const { error } = await supabase.from("person_categories").delete().eq("person_id",id); if(error) throw error;
        if (category) {
          const { error: insertError } = await supabase.from("person_categories").insert({person_id:id,category_id:category});if(insertError) throw insertError;
        }
      }
      reset();
    });
  }
  return <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
    <form onSubmit={(e)=>void save(e)} className="card-slim space-y-3 p-5">
      <h2 className="font-semibold">{editing ? "Editar pessoa" : "Cadastrar pessoa"}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label title="Nome"><input className={field} value={name} required onChange={(e)=>{setName(e.target.value);if(!editing)setSlug(slugify(e.target.value));}} /></Label></div>
        <Label title="Identificador (slug)"><input className={field} value={slug} required onChange={(e)=>setSlug(e.target.value)} /></Label>
        <Label title="País (ISO 2 letras)"><input className={field} value={country} maxLength={2} required onChange={(e)=>setCountry(e.target.value.toUpperCase())} /></Label>
        <Label title="Categoria"><select className={field} value={category} onChange={(e)=>setCategory(e.target.value)}><option value="">Sem categoria</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Label>
        <Label title="Situação"><StatusSelect value={status} onChange={setStatus} /></Label>
        <Label title="Partido político (opcional)"><input className={field} value={party} onChange={(e)=>setParty(e.target.value)} /></Label>
        <Label title="Cargo político (opcional)"><input className={field} value={office} onChange={(e)=>setOffice(e.target.value)} /></Label>
        <div className="col-span-2"><Label title="URL de foto"><input className={field} type="url" value={avatar} onChange={(e)=>setAvatar(e.target.value)} /></Label></div>
        <div className="col-span-2"><Label title="Biografia"><textarea className={field} rows={2} value={bio} onChange={(e)=>setBio(e.target.value)} /></Label></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={demo} onChange={(e)=>setDemo(e.target.checked)} /> Pessoa fictícia de demonstração</label>
      <div className="flex gap-2"><button className={button} disabled={busy} type="submit">{editing?"Salvar alterações":"Cadastrar"}</button><button className={mutedButton} type="button" onClick={reset}>Limpar</button></div>
    </form>
    <section className="card-slim overflow-hidden p-5">
      <h2 className="mb-3 font-semibold">Pessoas cadastradas <span className="text-xs text-muted-foreground">(até 500)</span></h2>
      <div className="max-h-[520px] space-y-2 overflow-auto">
        {people.map((p)=><div key={p.id} className="flex items-center justify-between gap-2 border-b py-2 text-sm">
          <div className="min-w-0"><div className="truncate font-medium">{p.name}{p.is_demo && <span className="ml-2 text-xs text-demo">Demo</span>}</div><div className="text-xs text-muted-foreground">{p.country_code} · {statusLabel[p.status]} · {p.slug}</div></div>
          <div className="flex shrink-0 gap-1"><button className={mutedButton} onClick={()=>edit(p)}>Editar</button>
          {p.status!=="archived" && <button className={mutedButton} disabled={busy} onClick={()=>void action("Arquivamento",async()=>{const {error}=await supabase.from("people").update({status:"archived"}).eq("id",p.id);if(error) throw error;})}>Arquivar</button>}</div>
        </div>)}
      </div>
    </section>
  </div>;
}

function AccountsPanel({ people, accounts, busy, action }: PanelProps & { people: Person[]; accounts: Account[] }) {
  const [editing,setEditing]=useState<Account|null>(null); const [personId,setPersonId]=useState("");
  const [platform,setPlatform]=useState<Account["platform"]>("instagram");const [handle,setHandle]=useState("");
  const [url,setUrl]=useState("");const [externalId,setExternalId]=useState(""); const [status,setStatus]=useState<Account["status"]>("draft");
  const reset=()=>{setEditing(null);setPersonId("");setPlatform("instagram");setHandle("");setUrl("");setExternalId("");setStatus("draft");};
  function edit(a:Account){setEditing(a);setPersonId(a.person_id);setPlatform(a.platform);setHandle(a.handle);setUrl(a.url??"");setExternalId(a.external_id??"");setStatus(a.status);}
  async function save(e:FormEvent){e.preventDefault(); await action(editing?"Atualização de conta":"Cadastro de conta",async()=>{
    const payload=accountInput.parse({person_id:personId,platform,handle:handle.replace(/^@/,""),url:url||null,external_id:externalId||null,status});
    if(editing){const {error}=await supabase.from("social_accounts").update(payload).eq("id",editing.id);if(error)throw error;}
    else{const {error}=await supabase.from("social_accounts").insert(payload);if(error)throw error;}
    reset();
  });}
  return <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
    <form className="card-slim space-y-3 p-5" onSubmit={(e)=>void save(e)}>
      <h2 className="font-semibold">{editing?"Editar conta social":"Vincular conta social"}</h2>
      <Label title="Pessoa"><select className={field} required value={personId} onChange={(e)=>setPersonId(e.target.value)}><option value="">Selecione</option>{people.map((p)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></Label>
      <div className="grid grid-cols-2 gap-3">
        <Label title="Rede social"><select className={field} value={platform} onChange={(e)=>setPlatform(e.target.value as Account["platform"])}>{PLATFORMS.map((p)=><option key={p.id} value={p.id}>{p.label}</option>)}</select></Label>
        <Label title="@usuário"><input className={field} value={handle} required onChange={(e)=>setHandle(e.target.value)} /></Label>
        <div className="col-span-2"><Label title="Link oficial da conta"><input type="url" className={field} value={url} onChange={(e)=>setUrl(e.target.value)} /></Label></div>
        <Label title="ID externo (opcional)"><input className={field} value={externalId} onChange={(e)=>setExternalId(e.target.value)} /></Label>
        <Label title="Situação"><StatusSelect value={status} onChange={setStatus} /></Label>
      </div>
      <div className="flex gap-2"><button className={button} disabled={busy} type="submit">{editing?"Salvar":"Vincular conta"}</button><button className={mutedButton} type="button" onClick={reset}>Limpar</button></div>
    </form>
    <section className="card-slim p-5"><h2 className="mb-3 font-semibold">Contas vinculadas</h2>
      <div className="max-h-[520px] space-y-2 overflow-auto">
        {accounts.map((a)=><div key={a.id} className="flex items-center justify-between gap-2 border-b py-2 text-sm">
          <div><p className="font-medium">{people.find((p)=>p.id===a.person_id)?.name??"Pessoa"} · @{a.handle}</p><p className="text-xs text-muted-foreground">{a.platform} · {statusLabel[a.status]}</p></div>
          <button className={mutedButton} onClick={()=>edit(a)}>Editar</button>
        </div>)}
      </div>
    </section>
  </div>;
}

function MetricsPanel({ people, accounts, sources, userId, busy, action }: PanelProps & { people: Person[]; accounts: Account[]; sources: Source[]; userId: string }) {
  const [accountId,setAccountId]=useState("");const [sourceId,setSourceId]=useState("");
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,16));
  const [followers,setFollowers]=useState("");const [likes,setLikes]=useState("");const [comments,setComments]=useState("");
  const [approved,setApproved]=useState(false); const [estimate,setEstimate]=useState(false);
  const [csv,setCsv]=useState<File|null>(null);
  const validSources=sources.filter((s)=>s.kind==="manual"||s.kind==="csv");
  const realAccounts=accounts.filter((a)=>!people.find((p)=>p.id===a.person_id)?.is_demo);

  async function ingest(rows: ReturnType<typeof parseSnapshotCsv>, method:"manual"|"csv", source:Source, fileName?:string) {
    if (source.kind!== "manual" && source.kind!=="csv") throw new Error("Selecione uma fonte de importação manual/CSV.");
    const ids=new Set(realAccounts.map((a)=>a.id));
    if(rows.some((r)=>!ids.has(r.account_id))) throw new Error("Conta inválida ou de demonstração. Cadastre uma conta real antes de importar.");
    const { data:run,error:runError }=await supabase.from("ingest_runs").insert({method,source_id:source.id,status:"running",rows_total:rows.length,created_by:userId,file_name:fileName??null}).select("id").single();
    if(runError) throw runError;
    try{
      const {error}=await supabase.from("metric_snapshots").insert(rows.map((r)=>({...r,source_id:source.id,ingest_run_id:run.id})));
      if(error) throw error;
      const {error:logError}=await supabase.from("ingest_runs").update({status:"success",rows_ok:rows.length,finished_at:new Date().toISOString()}).eq("id",run.id);
      if(logError) throw logError;
    }catch(e){
      await supabase.from("ingest_runs").update({status:"failed",rows_failed:rows.length,finished_at:new Date().toISOString(),errors:[{reason:e instanceof Error?e.message:"Falha"}]}).eq("id",run.id);
      throw e;
    }
  }
  async function saveManual(e:FormEvent){e.preventDefault();await action("Registro manual",async()=>{
    const d=new Date(date.endsWith("Z") ? date : date + "Z");
    if(Number.isNaN(d.getTime())) throw new Error("Data inválida");
    const record=parseSnapshotCsv([
      "account_id,captured_at,followers,avg_likes,avg_comments,is_estimate,approved",
      [accountId,d.toISOString(),followers,likes,comments,String(estimate),String(approved)].join(",")
    ].join("\n"));
    const source=sources.find((s)=>s.id===sourceId); if(!source)throw new Error("Fonte inválida");
    await ingest(record,"manual",source);
    setFollowers("");setLikes("");setComments("");
  });}
  async function importFile(e:FormEvent){e.preventDefault();await action("Importação CSV",async()=>{
    if(!csv)throw new Error("Escolha um arquivo CSV.");
    const source=sources.find((s)=>s.id===sourceId);if(!source)throw new Error("Escolha uma fonte.");
    const text=await csv.text();const rows=parseSnapshotCsv(text);
    await ingest(rows,"csv",source,csv.name);setCsv(null);
  });}
  return <div className="grid gap-6 lg:grid-cols-2">
    <form className="card-slim space-y-3 p-5" onSubmit={(e)=>void saveManual(e)}>
      <h2 className="flex items-center gap-2 font-semibold"><Database className="h-5 w-5"/> Inserir snapshot manual</h2>
      <p className="text-xs text-muted-foreground">Apenas contas reais. Cada número deve ser obtido de uma fonte verificável. Novos registros ficam não aprovados por padrão.</p>
      <Label title="Fonte manual ou CSV"><select className={field} required value={sourceId} onChange={(e)=>setSourceId(e.target.value)}><option value="">Selecione uma fonte</option>{validSources.map((s)=><option value={s.id} key={s.id}>{s.name} ({s.kind})</option>)}</select></Label>
      <Label title="Conta real"><select className={field} required value={accountId} onChange={(e)=>setAccountId(e.target.value)}><option value="">Selecione uma conta</option>{realAccounts.map((a)=><option key={a.id} value={a.id}>{people.find((p)=>p.id===a.person_id)?.name} · {a.platform} · @{a.handle}</option>)}</select></Label>
      <div className="grid grid-cols-2 gap-3">
        <Label title="Data UTC"><input className={field} required type="datetime-local" value={date} onChange={(e)=>setDate(e.target.value)} /></Label>
        <Label title="Seguidores"><input className={field} type="number" min={0} step={1} required value={followers} onChange={(e)=>setFollowers(e.target.value)} /></Label>
        <Label title="Média de curtidas"><input className={field} type="number" min={0} step="any" value={likes} onChange={(e)=>setLikes(e.target.value)} /></Label>
        <Label title="Média de comentários"><input className={field} type="number" min={0} step="any" value={comments} onChange={(e)=>setComments(e.target.value)} /></Label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={approved} onChange={(e)=>setApproved(e.target.checked)} /> Autorizar exibição pública</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={estimate} onChange={(e)=>setEstimate(e.target.checked)} /> Métrica estimada</label>
      <button type="submit" className={button} disabled={busy||!validSources.length}>Registrar snapshot</button>
    </form>
    <form className="card-slim space-y-3 p-5" onSubmit={(e)=>void importFile(e)}>
      <h2 className="flex items-center gap-2 font-semibold"><FileUp className="h-5 w-5"/> Importar CSV</h2>
      <p className="text-xs text-muted-foreground">Até 500 linhas, 1,5 MB. Cabeçalhos obrigatórios: account_id, captured_at, followers. Datas ISO 8601 com fuso. Use ponto para decimais.</p>
      <pre className="overflow-auto rounded-lg bg-muted p-3 text-xs">account_id,captured_at,followers,approved{"\n"}UUID,2026-10-01T12:00:00Z,12500,false</pre>
      <Label title="Arquivo"><input type="file" accept=".csv,text/csv" required className={field} onChange={(e)=>setCsv(e.target.files?.[0]??null)}/></Label>
      <div className="rounded-lg border p-3 text-xs text-muted-foreground">Todos os registros são validados antes da escrita. Erros impedem a importação e ficam documentados no histórico. Arquivos não são enviados a serviços externos.</div>
      <button type="submit" className={button} disabled={busy||!csv||!validSources.length}>Importar registros</button>
      {!validSources.length && <p className="text-sm text-danger">Cadastre uma fonte do tipo Manual ou CSV na aba Fontes para habilitar importações.</p>}
    </form>
  </div>;
}

function SourcesPanel({sources,busy,action}:PanelProps&{sources:Source[]}){
  const [name,setName]=useState("");const [kind,setKind]=useState<"manual"|"csv">("manual");
  async function add(e:FormEvent){e.preventDefault();await action("Cadastro de fonte",async()=>{
    const {error}=await supabase.from("data_sources").insert({name:name.trim(),slug:slugify(name).slice(0,60),kind,enabled:true});
    if(error)throw error;setName("");
  });}
  return <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
    <form className="card-slim space-y-3 p-5" onSubmit={(e)=>void add(e)}>
      <h2 className="font-semibold">Adicionar fonte de dados</h2>
      <p className="text-xs text-muted-foreground">Cadastro de procedência para importações. Conectores oficiais permanecem desligados até autenticação e teste reais.</p>
      <Label title="Nome da fonte"><input className={field} value={name} required minLength={2} onChange={(e)=>setName(e.target.value)} /></Label>
      <Label title="Tipo"><select className={field} value={kind} onChange={(e)=>setKind(e.target.value as "manual"|"csv")}><option value="manual">Coleta manual</option><option value="csv">Importação CSV</option></select></Label>
      <button className={button} type="submit" disabled={busy}>Cadastrar fonte</button>
    </form>
    <section className="card-slim p-5"><h2 className="mb-3 font-semibold">Fontes cadastradas</h2>
      {sources.map((s)=><div key={s.id} className="flex items-center justify-between border-b py-2 text-sm">
        <div><p className="font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.kind} · {s.platform??"Todas as redes"} · {s.enabled?"Ativa":"Desativada"}</p></div>
        {(s.kind==="manual"||s.kind==="csv") ? <button className={mutedButton} disabled={busy} onClick={()=>void action("Atualização da fonte",async()=>{const {error}=await supabase.from("data_sources").update({enabled:!s.enabled}).eq("id",s.id);if(error)throw error;})}>{s.enabled?"Desativar":"Ativar"}</button> : <span className="rounded-lg bg-muted px-2 py-1 text-xs">API não conectada</span>}
      </div>)}
    </section>
  </div>;
}

function LogsPanel({logs}:{logs:Ingest[]}){
  return <section className="card-slim overflow-x-auto p-5"><h2 className="mb-4 font-semibold">Histórico de importações</h2>
    {logs.length===0?<p className="text-sm text-muted-foreground">Nenhuma operação registrada.</p>:
      <table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="p-2">Data</th><th className="p-2">Método</th><th className="p-2">Arquivo</th><th className="p-2">Status</th><th className="p-2">Aceitos</th><th className="p-2">Erros</th></tr></thead>
        <tbody>{logs.map((l)=><tr key={l.id} className="border-b"><td className="p-2">{fmtDate(l.started_at,true)}</td><td className="p-2">{l.method}</td><td className="p-2">{l.file_name??"—"}</td><td className="p-2">{l.status==="success"?<span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3"/> Concluído</span>:l.status}</td><td className="p-2">{l.rows_ok}/{l.rows_total}</td><td className="max-w-xs truncate p-2" title={JSON.stringify(l.errors)}>{l.rows_failed ? JSON.stringify(l.errors):"—"}</td></tr>)}</tbody>
      </table>}
  </section>;
}
