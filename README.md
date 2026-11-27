# The Crew HQ

A live isometric office for Enzo's helper bots. Ms Boone, Ms Bhon, Mr Prendagas, and Coach Bates idle, walk, and work in their departments. When a bot checks in, they react, carry a glowing note to the Big Brain in the middle, and every open browser updates.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3847](http://localhost:3847).

In development, if `CREW_HQ_SECRET` is unset, the ingest secret is `dev-crew-secret`. If `CREW_HQ_VIEW_PASSWORD` is unset, the viewer password is `dev-viewer`.

The page asks for the viewer password before it shows the floor. That login sets an httpOnly signed cookie for 30 days. **Lock** in the header clears it.

Turn on **Simulate** in the header to play the crew's real check-in lines on this screen only. Simulated notes are not saved and are not sent to other browsers.

## Secrets

```bash
# .env.local
CREW_HQ_SECRET=a-long-random-string
CREW_HQ_VIEW_PASSWORD=a-password-enzo-will-type
```

Production (`npm start`, Docker, or Render) does not fall back to the dev secret or the dev viewer password.

- `CREW_HQ_VIEW_PASSWORD` gates the page, `GET /api/events`, and `GET /api/events/stream`.
- `CREW_HQ_SECRET` gates `POST /api/events` only. Bots do not need the viewer password.
- Changing the viewer password signs out existing browsers. The cookie is also signed with `CREW_HQ_SECRET` when that is set.

Don't put passwords or private writeups in event `text`. The floor is as private as the viewer password and whoever you host it with.

## Post an event

```bash
curl -X POST http://localhost:3847/api/events \
  -H "Content-Type: application/json" \
  -H "x-crew-secret: dev-crew-secret" \
  -d '{"bot":"ms boone","type":"learned","text":"Psych grade checked"}'
```

`Authorization: Bearer <secret>` works in place of `x-crew-secret`.

### Body

| Field | Value |
| --- | --- |
| `bot` | Display name. Known bots: `ms boone`, `ms bhon`, `mr prendagas`, `coach bates`. Any other name spawns a visitor with their own pad. |
| `type` | `learned`, `task_started`, `task_done`, `message`, or `alert` |
| `text` | 1–280 characters |

### What the floor does

- `learned` — lightbulb and a jump, then the bot carries an orb to the Big Brain.
- `task_started` — they walk to the desk and type, then carry the orb.
- `task_done`, `message`, `alert` — a jump or a shake, then the orb delivery.
- The brain pulses when the orb lands, and the activity log marks the note as filed.
- The same event is pushed to every open browser over Server-Sent Events.

### Sample check-ins

```bash
curl -X POST http://localhost:3847/api/events \
  -H "Content-Type: application/json" \
  -H "x-crew-secret: dev-crew-secret" \
  -d '{"bot":"ms bhon","type":"task_done","text":"YPAR done ✅"}'

curl -X POST http://localhost:3847/api/events \
  -H "Content-Type: application/json" \
  -H "x-crew-secret: dev-crew-secret" \
  -d '{"bot":"mr prendagas","type":"alert","text":"test or deadline reminder set"}'

curl -X POST http://localhost:3847/api/events \
  -H "Content-Type: application/json" \
  -H "x-crew-secret: dev-crew-secret" \
  -d '{"bot":"coach bates","type":"alert","text":"dress-out reminder"}'

curl -X POST http://localhost:3847/api/events \
  -H "Content-Type: application/json" \
  -H "x-crew-secret: dev-crew-secret" \
  -d '{"bot":"a new helper","type":"message","text":"Clocked in with a spare desk."}'
```

Other lines the crew uses: `Psych grade checked`, `Edpuzzle/assignment found`, `study tip learned`, `Ethnic Studies grade checked`, `missing assignment found`, `Gov grade checked`, `TCI/Classroom assignment found`, `PE grade checked`, `assessment or tutorial coming up`.

### Responses

- `201` `{ "event": { ... } }`
- `401` missing or wrong secret
- `400` bad JSON or fields

`GET /api/events` returns the last 200 events, oldest first. It requires the viewer cookie, same as the page:

```bash
curl -c /tmp/crew-cookies -X POST http://localhost:3847/api/login \
  -H "Content-Type: application/json" \
  -d '{"password":"dev-viewer"}'

curl -b /tmp/crew-cookies http://localhost:3847/api/events
```

`GET /api/events/stream` is the live SSE feed (`data: {event}\n\n`) and uses that same cookie. A refresh reloads history from `data/events.json`. `POST /api/events` does not accept the viewer cookie in place of `x-crew-secret`.

## The crew

| Bot | Department | Look |
| --- | --- | --- |
| Ms Boone | Psychology | Purple minion, cardigan, glasses, brain model, clipboard |
| Ms Bhon | Ethnic Studies | Orange minion, denim jacket, mountain backpack, timeline scroll |
| Mr Prendagas | History & Government | Navy suit, red tie, gavel, Constitution scroll |
| Coach Bates | P.E. | Green tracksuit, whistle, stopwatch, dumbbell |

Click a character for what they're doing and their recent check-ins. On a phone, drag the floor and use the name chips to find someone.

## Deploy

This app expects one long-running Node process so the event list and the SSE fan-out stay in memory together. `data/events.json` is the durable copy.

```bash
npm run build
CREW_HQ_SECRET=your-secret CREW_HQ_VIEW_PASSWORD=your-password npm start
```

Docker:

```bash
docker build -t crew-hq .
docker run --rm -p 3847:3847 \
  -e CREW_HQ_SECRET=your-secret \
  -e CREW_HQ_VIEW_PASSWORD=your-password \
  -v crew-data:/app/data \
  crew-hq
```

Vercel-style serverless hosting will boot separate instances, so a POST can miss browsers connected to another instance and the file store will not be shared.

### Render

`render.yaml` is set for the free plan: one Docker web service, no disk. Free instances sleep when idle, which drops open live streams until the next visit wakes the service. The filesystem is wiped on restart and redeploy, so `data/events.json` does not survive those. The viewer password still locks the page. To keep the log later, change `plan` to `0.5c-512mb` and add a disk mounted at `/app/data` (paid plans only).

What a person has to do:

1. Create a [Render](https://render.com) account. The free web service does not need a payment method.
2. Publish this project to a private GitHub, GitLab, or Bitbucket repo. Render deploys from one of those hosts.
3. In the Render Dashboard, choose **New** → **Blueprint**, connect that repo, and use `render.yaml`.
4. When Render asks, set both env vars. It will not invent them (`sync: false`):
   - `CREW_HQ_SECRET` — the value bots send as `x-crew-secret`
   - `CREW_HQ_VIEW_PASSWORD` — the password Enzo types on the site
5. Apply the blueprint and wait for the Docker build. Render sets `PORT`. The health check is `GET /api/health`, which stays public and returns `{ "ok": true }`.
6. Open the service URL, enter the viewer password, and give bots the public URL plus `CREW_HQ_SECRET`.
