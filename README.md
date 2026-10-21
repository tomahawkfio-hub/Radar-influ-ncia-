# Radar de Influência

Plataforma de rankings e comparação de crescimento de contas públicas no Brasil e no mundo.

**Estado atual: em desenvolvimento, não validado para produção.** Os exemplos disponíveis são fictícios e são indicados como demonstração; as APIs das redes sociais ainda não estão conectadas.

## Desenvolvimento

Requisitos: Node.js 22+ ou Bun e um projeto Supabase configurado. Configurar VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY e SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY para SSR na hospedagem. Somente chaves públicas no frontend. NUNCA adicionar tokens secretos ao GitHub.

- Instalar dependências: bun install --frozen-lockfile
- Executar testes: bun run test
- Compilar: bun run build
- Iniciar localmente: bun run dev

## Administração /admin

Login com Supabase Auth, autorização por papel admin protegido por RLS, cadastro/edição/arquivamento de pessoas, associação de redes sociais, registro manual e importação CSV, fontes e histórico.

**AÇÃO CRÍTICA antes de publicar:** executar sql/01-secure-admin.sql no SQL Editor do projeto Supabase correto, removendo o gatilho inseguro bootstrap_first_admin já criado pela Lovable. Criar usuário do proprietário no Auth e atribuir o papel admin SOMENTE no SQL Editor após verificação de identidade, conforme exemplo no arquivo. Desative sign-up público se não for necessário. Migração inicial foi corrigida no repositório, mas NÃO altera automaticamente o banco existente.

Importação CSV (até 500 registros ou 1,5 MB) exige account_id, captured_at, followers. Exemplo:

    account_id,captured_at,followers,avg_likes,avg_comments,is_estimate,approved
    00000000-0000-4000-8000-000000000001,2026-10-01T12:00:00Z,12000,530,22,false,false

Datas ISO 8601 com fuso; ponto decimal; conta real e fonte cadastrada. Linhas são validadas antes do envio. Aprovação pública é opcional e vem desativada por padrão.

## Verificação

GitHub Actions executa testes e build a cada commit. Ainda dependemos de testes reais de banco e autenticação, configuração de hospedagem e obtenção de dados em APIs oficiais/licenciadas. Não alegar coleta automática ou números reais sem integração efetiva.

Projeto de origem Lovable: a653e30c-17aa-4546-a938-2692c64743e4.