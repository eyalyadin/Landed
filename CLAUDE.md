# Landlord ↔ Tenant Manager (Israel) — Build Spec

> This file is the project's source of truth. Build exactly what's described here.
> If a required secret is missing, STOP and ask the human for it — never invent
> tokens, keys, or URLs.

## Goal
A web tool for an Israeli landlord to manage tenant communication, maintenance
requests, and rent — with AI-suggested replies. **Tenants talk to a Telegram bot;
the landlord sees every tenant's chat in one web dashboard and replies from there.**

---

## STEP 0 — Human setup (the person running you must do these by hand)
Ask the human for each value below and store it as an environment variable in
Railway. Do not proceed past a step that needs a value you don't have.

1. **Telegram bot** — human creates a bot via @BotFather, sends you the **bot token**
   and the **bot username** (e.g. `MyLandlordBot`).
2. **Google Gemini key** — human creates an API key at Google AI Studio.
3. **Railway** — human creates a Railway project and adds a **PostgreSQL** plugin
   (Railway auto-provides `DATABASE_URL`).
4. After the first deploy, the human copies the **Railway public URL** and tells you,
   so you can register the Telegram webhook (see Phase 2).

### Environment variables
| Var | Source | Notes |
|---|---|---|
| `DATABASE_URL` | Railway Postgres | auto-provided |
| `TELEGRAM_BOT_TOKEN` | BotFather | server-side only |
| `TELEGRAM_BOT_USERNAME` | BotFather | used to build invite links |
| `TELEGRAM_WEBHOOK_SECRET` | you generate (random string) | verify inbound webhook |
| `GEMINI_API_KEY` | Google AI Studio | server-side only |
| `LANDLORD_PASSWORD` | human chooses | single-landlord login |
| `SESSION_SECRET` | you generate (random) | signs the login cookie |
| `CRON_SECRET` | you generate (random) | protects the cron endpoint |
| `PUBLIC_URL` | Railway domain | known only after first deploy |

---

## Tech stack (pinned — do not substitute)
- **Next.js (App Router) + TypeScript** — UI + API routes in one deployable app.
- **Prisma** ORM with **Railway PostgreSQL**.
- **Tailwind CSS**, with full **RTL** support.
- **Telegram Bot API called directly with `fetch`** — do NOT add a Telegram library.
- **Google GenAI SDK** (`@google/genai`, class `GoogleGenAI`) — model `gemini-3.5-flash`.
  Do NOT use the deprecated `@google/generative-ai` package.
- **Auth:** single landlord only. Password from `LANDLORD_PASSWORD`, stored in a
  signed httpOnly cookie. Keep it minimal — tenants never log into the web app.
- **Cron:** a Railway cron service that calls a protected endpoint daily.

---

## Data model (Prisma)
- **Landlord** — id, name. Seed exactly one row.
- **Tenant** — id, landlordId(FK), name, unitLabel, phone?, `telegramChatId`? (null
  until linked), `linkToken` (unique), `preferredLanguage`? , createdAt.
- **Message** — id, tenantId(FK), `direction` ('inbound'|'outbound'), body(text),
  `detectedLanguage`?, telegramMessageId?, createdAt.
- **MaintenanceRequest** — id, tenantId(FK), title, description?, `status`
  ('open'|'in_progress'|'resolved'), createdAt, updatedAt.
- **MaintenancePhoto** — id, maintenanceRequestId(FK), `telegramFileId`, caption?, createdAt.
- **RentSchedule** — id, tenantId(FK), amount(Decimal, ILS), `dueDayOfMonth` (1–28),
  startDate(Date), endDate?(Date), active(Bool).
- **RentInvoice** — id, tenantId(FK), rentScheduleId(FK), `dueDate` (Date, NOT
  timestamp), amount(Decimal), `status` ('pending'|'paid'|'overdue'), paidDate?(Date),
  createdAt.

---

## Feature behavior

### 1. Linking a tenant to Telegram
- Landlord adds a tenant in the dashboard → generate a random `linkToken`.
- Dashboard shows an invite link: `https://t.me/{TELEGRAM_BOT_USERNAME}?start={linkToken}`.
- Tenant opens it and presses Start → Telegram sends `/start {linkToken}` to the bot →
  webhook finds the matching tenant, sets `telegramChatId`, and replies with a short
  welcome (Hebrew + English).

### 2. Inbound messages (webhook)
- Endpoint: `POST /api/telegram/webhook`.
- Verify header `X-Telegram-Bot-Api-Secret-Token` equals `TELEGRAM_WEBHOOK_SECRET`; reject otherwise.
- `/start <token>` → linking flow above.
- Text from a linked chat → store a `Message` (direction `inbound`).
- A photo from a linked chat → create a `MaintenanceRequest` (title = caption or
  "Maintenance request", status `open`) + a `MaintenancePhoto` with the photo's
  largest `file_id`.

### 3. Dashboard threads
- Tenant list; clicking a tenant shows the message thread.
- Inbound vs outbound styled differently; bubbles use `dir="auto"` so Hebrew renders RTL.
- Reply box + **"Suggest reply (AI)"** button.

### 4. Outbound replies
- `POST /api/messages/send` `{tenantId, body}` → call Telegram `sendMessage` to the
  tenant's `telegramChatId` → store a `Message` (direction `outbound`).

### 5. AI suggestions (Gemini)
- `POST /api/suggest` `{tenantId}` → load the last ~10 messages → call `gemini-3.5-flash`.
- System instruction: *"You help an Israeli landlord reply to a tenant. Detect the
  language of the tenant's most recent message (likely Hebrew or English) and write a
  concise, polite suggested reply in that SAME language."*
- Return the suggestion; dashboard fills the reply box (editable before sending).

### 6. Maintenance
- Per-tenant list of requests with their photos.
- Photos are served through a proxy: `GET /api/photo/[fileId]` → Telegram `getFile`
  → fetch the returned file path → stream the bytes. **Re-fetch every time; never
  store the path — Telegram file paths expire after ~1 hour.**
- Landlord can change a request's status.

### 7. Rent tracking + overdue alerts
- Landlord creates a `RentSchedule` (amount, dueDayOfMonth, startDate).
- On creation, generate `RentInvoice` rows for the next 12 months.
- Mark-as-paid button → status `paid`, paidDate = today.
- **Daily cron** `GET /api/cron/check-overdue?secret=CRON_SECRET`:
  compute "today" **in Asia/Jerusalem**, set invoices to `overdue` where
  `dueDate < today AND status = 'pending'`, and send each affected tenant a polite
  Telegram reminder in their language.

---

## Israel / Hebrew specifics (do not skip)
- Whole dashboard supports **RTL**; use CSS logical properties (`margin-inline-start`, etc.).
- Currency is **ILS (₪)**; dates display **dd/MM/yyyy**.
- **All date logic runs in `Asia/Jerusalem`.** Railway cron triggers in UTC, so still
  compute the Israel calendar date inside the handler. Store `dueDate` as a Date.

## Critical gotchas
- Telegram needs an **HTTPS public URL** (the Railway domain) for its webhook.
- `TELEGRAM_BOT_TOKEN` and `GEMINI_API_KEY` are **server-side only** — never sent to the browser.
- Keep dependencies minimal. No Telegram wrapper library.

---

## Build order (≈15h core, with buffer)
1. **Phase 0 (1h):** scaffold Next.js + Tailwind + Prisma; deploy a hello-world to
   Railway; confirm the public URL loads.
2. **Phase 1 (1.5h):** Prisma schema + migrate; seed 1 landlord + 3 tenants.
3. **Phase 2 (3.5h):** Telegram webhook, `/start` linking, inbound text, `sendMessage`,
   photo capture. **After deploy, register the webhook** by calling Telegram
   `setWebhook` with `url={PUBLIC_URL}/api/telegram/webhook` and the secret token.
4. **Phase 3 (3.5h):** landlord login, tenant list, thread view (RTL), reply box,
   maintenance view with photo proxy.
5. **Phase 4 (1.5h):** Gemini suggestion endpoint + "Suggest reply" button.
6. **Phase 5 (2.5h):** rent schedule UI, invoice generation, mark-as-paid, overdue cron.
7. **Phase 6 (2.5h):** seed real Hebrew messages, end-to-end test on real Telegram,
   polish RTL/₪/dates, final deploy.

Lock the Prisma schema and the webhook endpoint FIRST — everything depends on them.

## Definition of done (matches the assignment)
- [ ] Real Hebrew tenant messages flow end-to-end through Telegram.
- [ ] AI suggestion is written in the language of the incoming message.
- [ ] At least 3 tenants, each with its own thread.
- [ ] Maintenance requests support photo upload (via Telegram photos).
- [ ] Rent tracking has recurring schedules + overdue alerts based on real dates.

## Working rules for you (Claude Code)
- Ask the human for any missing secret; never fabricate one.
- Commit and push so Railway auto-deploys; after deploys that change the domain or
  webhook, re-run `setWebhook`.
- Prefer the simplest correct implementation over cleverness — this is a 24-hour build.
