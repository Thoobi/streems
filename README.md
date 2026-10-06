# Prayer Live

A Mixlr-style live audio broadcast for prayer. Anyone can create an account, go live, and share their link. People with the link listen as a guest (just a name) or signed in.

It runs entirely on Cloudflare: Next.js 16 on **Workers** (via [OpenNext](https://opennext.js.org/cloudflare)), data in **D1**, and live audio through **[RealtimeKit](https://developers.cloudflare.com/realtime/realtimekit/)**.

## Local development

```bash
pnpm install
cp .dev.vars.example .dev.vars   # fill in RealtimeKit credentials
pnpm db:migrate:local            # creates the local D1 database under .wrangler/
pnpm dev                         # http://localhost:3000
```

To run the real Workers runtime locally instead, use `pnpm preview`.

## Deploying (Workers free plan)

```bash
pnpm exec wrangler login
pnpm exec wrangler d1 create global_prayer_streams   # copy the database_id into wrangler.jsonc
pnpm db:migrate:remote
pnpm exec wrangler secret put CLOUDFLARE_ACCOUNT_ID
pnpm exec wrangler secret put REALTIMEKIT_APP_ID
pnpm exec wrangler secret put CLOUDFLARE_API_TOKEN
pnpm deploy
```

Free plan limits to keep in mind: the Worker must be **3 MB or less compressed** (`pnpm deploy` prints the size), and each request gets about **10 ms of CPU**. Password hashing (PBKDF2, 100k iterations) is the heaviest work the app does.

### RealtimeKit setup

1. In the Cloudflare dashboard, go to **Realtime → RealtimeKit**, create an app, and copy its **App ID**.
2. Create an API token with the **Realtime Admin** permission.
3. Check the preset names under **Presets** in your app. The defaults are `webinar_presenter` for hosts and `webinar_viewer` for listeners. If yours differ, change `REALTIMEKIT_HOST_PRESET` and `REALTIMEKIT_LISTENER_PRESET` in `wrangler.jsonc`. For a Mixlr feel, turn video off in both presets and leave chat on.

### Who hosts

Every account can host. Whoever starts a broadcast is its host (one live broadcast per person at a time), and everyone else who opens its link listens.

## How it works

| Piece | File |
| --- | --- |
| D1 schema (users, sessions, broadcasts) | `migrations/` |
| D1 access | `src/lib/db.ts` |
| Auth: PBKDF2 passwords, DB-backed session cookie | `src/lib/auth.ts` |
| Sign in / sign up screens and actions | `src/app/(auth)/` |
| RealtimeKit REST client (create meeting, participant token) | `src/lib/realtimekit.ts` |
| Go live / end broadcast actions | `src/app/broadcast-actions.ts` |
| Live room page; issues each user an auth token server-side | `src/app/live/[id]/page.tsx` |
| Custom RealtimeKit UI (`RtkUiProvider`, client-only) | `src/components/live-room.tsx` |

When someone clicks **Go live**, the app creates a RealtimeKit meeting and they get a `/live/<id>` link to share. Whoever opens it gets a participant token: the host preset for the person who started it, the listener preset for everyone else, and the browser joins with `useRealtimeKitClient`. API credentials never leave the server.
