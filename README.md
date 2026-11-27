# The Crew HQ

A live isometric office for Enzo's helper bots. Ms Boone, Ms Bhon, Mr Prendagas, and Coach Bates idle, walk, and work in their departments. When a bot checks in, they stay at their desk and fire a glowing synapse beam into the Big Brain. Every open browser updates. Simulate is off unless you turn it on, and it only plays sample lines on that screen.

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

- `CREW_HQ_VIEW_PASSWORD` gates the page, the grade list for a person, chat from the page, `GET /api/events`, and `GET /api/events/stream`.
- `CREW_HQ_SECRET` gates bot writes: `POST /api/events`, todo create/update/delete, and chat pending/reply. Bots do not need the viewer password.
- `GET /api/todos` and `GET /api/chat` accept either the viewer cookie or `x-crew-secret`.
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

- The bot stays in their department. They do not run to the Big Brain.
- `learned` — lightbulb and a jump, then a curved beam in their color.
- `task_started` — they go to the desk and type, then the beam.
- `task_done`, `message`, `alert` — a jump or a shake, then the beam.
- Small glowing stars travel the beam. The brain pulses when a star hits, and the activity log marks the note as filed.
- If the browser asks for reduced motion, the note files immediately with no traveling stars and no pulse animation.
- The same event is pushed to every open browser over Server-Sent Events. Todo and chat updates use that same stream as named events `todo` and `chat`.

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

Click a character to open a chat with that bot. Click the Big Brain (or the Big Brain chip) for every filed note, grouped by bot, plus the open grade items. **Message the crew** in that panel is the everyone thread. On a phone, drag the floor and use the name chips to find someone. Each classroom has a whiteboard on the back wall. Click it to tick items. A small open count sits in the header. Activity stays in the side column.

## Grades

Each classroom whiteboard shows that class's open items in marker writing, plus an open count. Click any board, including Ethnic Studies, for the same large whiteboard. The header shows one small total. If `data/todos.json` is missing after a restart, the app copies `data/seed-todos.json` (the current class list) once. Later posts are kept. Bot names in chat accept spaces, hyphens, or a `visitor-` prefix, so `ms-boone` and `ms boone` are the same person. More than one bot can reply to an everyone message.

Classes: `Psychology` (Ms Boone), `Ethnic Studies` (Ms Bhon), `Gov/History` (Mr Prendagas), `PE` (Coach Bates).

The top of the panel shows how many items are open in each class, and the next dated item.

Checking an item done, or back to to-do, sends `PATCH` with the viewer cookie.

```bash
curl -X POST http://localhost:3847/api/todos \
  -H "Content-Type: application/json" \
  -H "x-crew-secret: dev-crew-secret" \
  -d '{"bot":"ms boone","class":"Psychology","title":"Finish the chapter quiz","due":"2026-12-02","priority":"high","link":"https://example.com/quiz"}'
```

| Field | Value |
| --- | --- |
| `bot` | Who posted it. Same names as events. |
| `class` | `Psychology`, `Ethnic Studies`, `Gov/History`, or `PE` |
| `title` | 1–140 characters |
| `due` | Optional `YYYY-MM-DD` |
| `priority` | Optional `low`, `normal`, or `high`. Default `normal` |
| `link` | Optional `http` or `https` URL |

```bash
curl -X PATCH http://localhost:3847/api/todos/TODO_ID \
  -H "Content-Type: application/json" \
  -H "x-crew-secret: dev-crew-secret" \
  -d '{"status":"done"}'

curl -X DELETE http://localhost:3847/api/todos/TODO_ID \
  -H "x-crew-secret: dev-crew-secret"

curl -b /tmp/crew-cookies http://localhost:3847/api/todos
```

`PATCH` also accepts the viewer cookie, but then the only field allowed is `status` (`todo` or `done`). Bots can also change `title`, `due`, `priority`, `link`, and `class`.

- `201` `{ "todo": { ... } }` on create
- `200` `{ "todo": { ... } }` on update
- `200` `{ "ok": true }` on delete
- `401` missing cookie and secret, or a bot route without the secret
- `404` unknown id
- `400` bad fields

## Chat

Click a minion to message that bot. The Big Brain panel's **Message the crew** button messages everyone. Unanswered messages from Enzo show **Waiting for a reply**. The drawer says bots check in every few minutes. A reply puts a speech bubble on that minion.

Viewer message (cookie, not the bot secret):

```bash
curl -b /tmp/crew-cookies -X POST http://localhost:3847/api/chat \
  -H "Content-Type: application/json" \
  -d '{"bot":"ms boone","text":"What should I redo?"}'
```

Stored as `from: "enzo"`, `to` the bot id (or `everyone`), `answered: false`, plus `id` and `timestamp`.

Bots poll, then reply:

```bash
curl -H "x-crew-secret: dev-crew-secret" \
  "http://localhost:3847/api/chat/pending?bot=ms%20boone"

curl -X POST http://localhost:3847/api/chat/reply \
  -H "Content-Type: application/json" \
  -H "x-crew-secret: dev-crew-secret" \
  -d '{"bot":"ms boone","text":"Redo the exit ticket.","replyTo":"MESSAGE_ID"}'
```

`pending` for a named bot returns unanswered viewer messages to that bot and to everyone. Names are matched ignoring case, spaces, hyphens, and a leading `visitor-`, so `ms boone`, `ms-boone`, and `visitor-ms-boone` are Ms Boone. `bot=everyone` (or `big brain`) returns only the shared thread. The first reply marks the original `answered: true`. A second reply to a direct message is `409`. Another bot can still reply to an everyone message after that.

`text` is 1–500 characters. `GET /api/chat` (cookie or secret) returns the saved messages.

- `201` `{ "message": { ... } }` for a viewer post
- `201` `{ "message": { ... }, "original": { ... } }` for a reply
- `200` `{ "messages": [ ... ] }` for list and pending

## Check now

**Ask the bots to check now** in the header wakes the crew. The viewer cookie or `x-crew-secret` can call it. A global cooldown of 5 minutes is saved in `data/check-now.json`. During the cooldown the button stays disabled and the header counts down.

```bash
curl -b /tmp/crew-cookies -X POST http://localhost:3847/api/check-now
curl -b /tmp/crew-cookies http://localhost:3847/api/check-now/status
```

`POST` returns `429` and `secondsLeft` when it is too soon. A successful call signs the JSON body with `CREW_HQ_SECRET` and posts it to `CREW_HQ_WAKE_URL` (there is a built-in default). The activity log records `Check requested` plus the webhook status. The secret is not written there.

`GET /api/check-now/status` returns `{ lastCheckAt, nextAllowedAt, secondsLeft, lastResult }`.

## Deploy

This app expects one long-running Node process so the event list, grade items, chat, and the SSE fan-out stay in memory together. `data/events.json`, `data/todos.json`, and `data/chat.json` are the copies on disk. None of them are seeded with personal assignments or messages.

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

`render.yaml` is set for the free plan: one Docker web service, no disk. Free instances sleep when idle, which drops open live streams until the next visit wakes the service. The filesystem is wiped on restart and redeploy, so `data/events.json`, `data/todos.json`, and `data/chat.json` do not survive those. The viewer password still locks the page. To keep the log later, change `plan` to `0.5c-512mb` and add a disk mounted at `/app/data` (paid plans only).

Grades and chat do not add environment variables. On a service that already has `CREW_HQ_SECRET` and `CREW_HQ_VIEW_PASSWORD`, the update is **Manual Deploy** → **Deploy latest commit** when auto-deploy is off.

What a person has to do:

1. Create a [Render](https://render.com) account. The free web service does not need a payment method.
2. Publish this project to a private GitHub, GitLab, or Bitbucket repo. Render deploys from one of those hosts.
3. In the Render Dashboard, choose **New** → **Blueprint**, connect that repo, and use `render.yaml`.
4. When Render asks, set both env vars. It will not invent them (`sync: false`):
   - `CREW_HQ_SECRET` — the value bots send as `x-crew-secret`
   - `CREW_HQ_VIEW_PASSWORD` — the password Enzo types on the site
5. Apply the blueprint and wait for the Docker build. Render sets `PORT`. The health check is `GET /api/health`, which stays public and returns `{ "ok": true }`.
6. Open the service URL, enter the viewer password, and give bots the public URL plus `CREW_HQ_SECRET`.
