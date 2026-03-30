# Ticket das Vaquejadas

Plataforma profissional para divulgação e venda antecipada de ingressos/senhas de vaquejadas no Brasil.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (componentes)
- Supabase (Auth + Postgres)
- Mercado Pago (Pix)
- Deploy: Netlify

## Rotas

**Público**
- `/` Home (hero + filtros + grid)
- `/eventos` Listagem
- `/eventos/[slug]` Detalhes + seleção de ingressos
- `/checkout/[orderId]` Checkout Pix + status
- `/meus-ingressos` Ingressos do usuário logado
- `/login` / `/cadastro` / `/suporte`

**Admin**
- `/admin` Dashboard
- `/admin/eventos` / `/admin/eventos/novo` / `/admin/eventos/[id]` / `/admin/eventos/[id]/editar`
- `/admin/eventos/[id]/lotes` / `/admin/eventos/[id]/vendas` / `/admin/eventos/[id]/checkin`
- `/admin/pedidos` / `/admin/clientes` / `/admin/relatorios` / `/admin/configuracoes`

**API (App Router)**
- `/api/auth/callback`
- `/api/mercado-pago/criar-pagamento`
- `/api/mercado-pago/webhook`
- `/api/mercado-pago/consultar-status`
- `/api/tickets/validar`
- `/api/tickets/reenviar`
- `/api/eventos` / `/api/eventos/[id]`
- `/api/orders` / `/api/orders/[id]`

## Configuração

1) Instale dependências:

```bash
npm install
```

Se você estiver no Windows PowerShell com policy bloqueando scripts, use:

```bash
npm.cmd install
```

2) Variáveis de ambiente:

- Copie `.env.example` para `.env.local` e preencha.
- Obrigatórias para Supabase:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Obrigatórias para Pix Mercado Pago:
  - `MERCADO_PAGO_ACCESS_TOKEN`
  - `MERCADO_PAGO_WEBHOOK_SECRET` (recomendado)

3) Banco de dados (Supabase)

- As migrations iniciais estão em `supabase/migrations/20260330190000_init.sql`.
- Aplique via Supabase CLI ou colando no SQL Editor do seu projeto.

4) Rodar local:

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Admin (roles)

O middleware bloqueia `/admin` para usuários com `profiles.role` diferente de `organizer` ou `admin`.

Para testar, após criar um usuário no Supabase Auth, ajuste:

```sql
update public.profiles set role = 'organizer' where email = 'seu@email.com';
```

## Deploy no Netlify

1) Suba o repositório e conecte no Netlify.
2) Defina as env vars no painel do Netlify (as mesmas do `.env.example`).
3) O projeto já inclui `netlify.toml` com `@netlify/plugin-nextjs`.

## Observações

- Por segurança, escrita no banco é feita via rotas API usando `SUPABASE_SERVICE_ROLE_KEY`.
- Sem env (sem Supabase), a UI usa dados de demonstração para não travar o `npm run dev`.

