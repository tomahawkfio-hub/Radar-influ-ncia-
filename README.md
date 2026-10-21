# Radar de Influência

Plataforma de análise de crescimento de seguidores e engajamento de contas públicas no Brasil e no mundo, com rankings por país, categoria e rede social, histórico de métricas, perfis e comparador.

## Situação

**Em desenvolvimento; não validado para produção.** Este repositório contém o código-fonte da versão Lovable/TanStack Start migrado para desenvolvimento pelo GitHub, com Supabase. A última compilação realizada na Lovable registrou erros e o painel administrativo estava incompleto. A versão estática independente e testada localmente pode ser fornecida separadamente como ZIP.

Os exemplos de métricas são **fictícios**. Instagram, TikTok, YouTube, Facebook e X exigem APIs oficiais/licenciadas e autorização, custos e limites aplicáveis para operar com dados reais. Não declare os números de demonstração como fatos.

## Desenvolvimento

Requisitos: Node.js 22+ ou Bun e credenciais próprias Supabase no ambiente de execução.

```bash
npm install
npm run build
npm test
```

Configuração e testes de autenticação, segurança RLS, deploy e integrações permanecem pendentes. **Não adicionar chaves de serviço ou senhas no repositório.**

## Segurança: ação obrigatória antes de publicação

A versão original incluía uma função `bootstrap_first_admin` vinculada ao gatilho `on_auth_user_created_bootstrap`, capaz de tornar o primeiro usuário cadastrado administrador. Isso deve ser removido da base real e substituído por concessão explícita de papel ao proprietário.

## Origem

Projeto Lovable (ID): `a653e30c-17aa-4546-a938-2692c64743e4`.
