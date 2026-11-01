# Prayer Live

A Mixlr-style live audio call for prayer. One host starts the call and shares its link (or its 6-character code). Anyone who opens the link joins, with no account or sign-up, and can optionally type a name so others know who they are.

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
pnpm exec wrangler secret put HOST_PASSCODE
pnpm deploy
```

### Deploy on push

Pushing to `main` on GitHub deploys automatically through Cloudflare **Workers Builds** (Worker → Settings → Build → Connect), using:

- Build command: `pnpm opennextjs-cloudflare build`
- Deploy command: `pnpm opennextjs-cloudflare deploy`

Secrets and database migrations are not part of the build. Set secrets once with `wrangler secret put`, and run `pnpm db:migrate:remote` yourself whenever a new file lands in `migrations/`.

Free plan limits to keep in mind: the Worker must be **3 MB or less compressed** (`pnpm deploy` prints the size), and each request gets about **10 ms of CPU**. 

### RealtimeKit setup

1. In the Cloudflare dashboard, go to **Realtime → RealtimeKit**, create an app, and copy its **App ID**.
2. Create an API token with the **Realtime Admin** permission.
3. Check the preset names under **Presets** in your app. The defaults are `webinar_presenter` for hosts and `webinar_viewer` for listeners. If yours differ, change `REALTIMEKIT_HOST_PRESET` and `REALTIMEKIT_LISTENER_PRESET` in `wrangler.jsonc`. For a Mixlr feel, turn video off in both presets and leave chat on.

### Who hosts

There are no accounts. The host goes to `/host`, enters the `HOST_PASSCODE` secret once (remembered by a cookie on that device), names the call and starts it. Only one call is live at a time. The host shares `/c/<code>`; people can also type the code on the home page. Changing `HOST_PASSCODE` signs the host out everywhere.

## How it works

| Piece | File |
| --- | --- |
| D1 schema (`calls`) | `migrations/` |
| D1 access, join codes | `src/lib/db.ts` |
| Host passcode cookie | `src/lib/host.ts` |
| Host screen (unlock, start call, past calls) | `src/app/host/page.tsx` |
| RealtimeKit REST client (create meeting, participant token) | `src/lib/realtimekit.ts` |
| Unlock / start / end / join-by-code actions | `src/app/actions.ts` |
| Call page; issues each person a participant token server-side | `src/app/c/[code]/page.tsx` |
| Custom RealtimeKit UI (`RtkUiProvider`, client-only) | `src/components/live-room.tsx` |

When the host clicks **Start call**, the app creates a RealtimeKit meeting and a `/c/<code>` link. Whoever opens it gets a participant token: the host preset if they have the host cookie, the listener preset for everyone else. Joiners' names are set in the browser before joining, and the room leaves the meeting as soon as the page closes or navigates away, so others see people join and leave right away. API credentials never leave the server.
