# RoadTo80Kg

App pessoal para cut do Pedro (105 → 80 kg). Next.js 15 + Neon Postgres + Vercel.

## Funcionalidades

- **Perfil** com cálculo Mifflin-St Jeor + TDEE e macros de cut
- **Peso** com log diário e média móvel de 7 dias
- **Refeições** com plano semanal gerado de 30 receitas seed
- **Receitas** com macros calculados por dose
- **Produtos** com catálogo Continente + scrape semanal + fallback manual
- **Compras** biquinzenais agregadas do plano × 2 porções
- **Treinos** 30 min/dia com agenda fixa + cronómetro e troca casa ↔ parque

## Setup local

```bash
npm install
cp .env.example .env.local
# preencher DATABASE_URL (Neon), AUTH_SECRET, CRON_SECRET

npm run db:push         # aplica schema à Neon
npm run db:seed         # produtos + receitas + treinos
npm run seed:user       # cria utilizador interactivo (email/password)
npm run dev
```

Abrir http://localhost:3000/login.

## Deploy Vercel

1. Criar repo GitHub privado e fazer push.
2. Importar no Vercel, apontar para o repo.
3. Adicionar env vars em Settings → Environment Variables:
   - `DATABASE_URL` (pooled URL da Neon)
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `AUTH_URL` (URL de produção)
   - `AUTH_TRUST_HOST=true`
   - `CRON_SECRET` (`openssl rand -hex 32`)
4. Primeiro deploy. O cron Sunday 22:00 UTC (23:00 Lisboa) já está em `vercel.json`.
5. Correr `npm run seed:user` localmente contra a Neon para criar o login.

## Testes

```bash
npm run test
```

## Scrape Continente

- Watchlist em `drizzle/seed/data/products.ts` (~60 SKUs).
- Cada SKU tem URL construída como `https://www.continente.pt/produto/{slug}-{sku}.html`. **Confirma os URLs após o primeiro scrape** — o site pode exigir ajustes nos slugs.
- Falha parcial → rótulo "rever" no `/produtos`. Edita o preço manualmente.
- Se o site bloquear (429/403 repetidos), o `source='manual'` mantém a app a funcionar.

## Estrutura

```
src/app/(app)/...    rotas protegidas
src/app/login/       login público
src/lib/db/          Drizzle schema + client
src/lib/calc/        TDEE, nutrition, meal planner, shopping
src/lib/scrape/      Continente parser + cron helper
src/lib/auth/        Auth.js config
drizzle/seed/        dados seed + scripts
```
