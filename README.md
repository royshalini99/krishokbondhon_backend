# KrishokBondhon — Community & Q&A Service

A standalone Express + MongoDB service implementing exactly the two
features documented in the Flutter app's `docs/API_CONTRACT.md`:
the community feed and the Q&A support system. It does **not** touch
user accounts, login, or expert registration — that's PostgreSQL,
managed by a separate service.

## What this is, in plain terms

Think of this as a small standalone "post office" for two kinds of mail:
farmer community posts, and farming questions. It knows how to:
- receive a new post/question and file it away
- hand back a list of recent posts/questions when asked
- keep track of likes and comments
- kick off a background "ask the AI" job when a new question comes in,
  without making the farmer's app wait for the AI to finish thinking

It trusts a JWT (a signed login token) to know who's asking — it doesn't
do the actual login itself. That's the real auth service's job, which
lives on the PostgreSQL side and isn't part of this project.

This project is built to work in two modes, switched by a single
environment variable (`STORAGE_DRIVER`), so you can build and test
everything for free first, then flip one setting to go live on Google
Cloud whenever you're ready:

| | Phase 1: Free local dev | Phase 2: Google Cloud |
|---|---|---|
| Where it runs | Your own laptop | Cloud Run |
| Image storage | Local `uploads/` folder | Google Cloud Storage |
| Cost | $0, no signup needed beyond MongoDB | $0 within Cloud Run's free tier, small cost beyond it |
| `STORAGE_DRIVER` | `local` (the default) | `gcs` |

---

## Phase 1: Free local development

Nothing here needs a Google account, a credit card, or Docker. Just
Node.js and a MongoDB connection.

### 1. Get a MongoDB connection — pick one:
- **Easiest: MongoDB Atlas free tier (M0).** Genuinely free forever, no
  card required for the M0 tier specifically. See the earlier walkthrough
  we went through for creating a cluster, a database user, and getting a
  connection string.
- **Fully offline: install MongoDB Community Server locally** on your
  Windows machine (`mongodb.com/try/download/community`). Once running,
  your connection string is just `mongodb://localhost:27017/krishokbondhon`.

Either way works identically from this app's point of view — same
`MONGO_URI` format either way.

### 2. Install and configure

```bash
npm install
cp .env.example .env
```

Open `.env` and set:
- `MONGO_URI` — from step 1
- `JWT_SECRET` — any random string for now (e.g. mash your keyboard);
  you'll swap this for the real one when your auth service exists
- Leave `STORAGE_DRIVER=local` — this is already the default, so you
  don't strictly need to touch it, but it's worth knowing it's there

### 3. Run it

```bash
npm run dev
```

You should see `[mongo] connected: krishokbondhon` and a message that
the server is listening on port 4000.

### 4. Test without a real login system yet

```bash
node scripts/generateTestToken.js
node scripts/generateTestToken.js --role=expert
```

Paste the printed token into Postman/curl as `Authorization: Bearer <token>`.

```bash
# List posts (empty at first)
curl http://localhost:4000/v1/community/feed \
  -H "Authorization: Bearer <token>"

# Create a post
curl -X POST http://localhost:4000/v1/community/posts \
  -H "Authorization: Bearer <token>" \
  -F "content=Testing my first post" \
  -F 'tags=["Tomato"]'

# Ask a question
curl -X POST http://localhost:4000/v1/qna/ask \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Why are my tomato leaves curling?","cropType":"Tomato"}'

# Wait ~5 seconds, then fetch it again — the AI answer should have appeared
curl http://localhost:4000/v1/qna/questions/<id-from-previous-response> \
  -H "Authorization: Bearer <token>"
```

### 5. Connecting the Flutter app to your local backend

Point `ApiConstants.baseUrl` (or pass `--dart-define=API_BASE_URL=...`)
at your machine, not `localhost` — which "localhost" means depends on
where the app is running:

| Running on | Use this as the base URL |
|---|---|
| Android emulator | `http://10.0.2.2:4000/v1` (emulator's alias for your host machine) |
| iOS simulator | `http://localhost:4000/v1` (works directly) |
| A real phone, same Wi-Fi as your laptop | `http://<your-laptop's-LAN-IP>:4000/v1`, e.g. `http://192.168.1.42:4000/v1`. Find your IP with `ipconfig` on Windows. You may also need to allow Node.js through Windows Firewall the first time. |

### One thing that differs between local and production
When `STORAGE_DRIVER=local`, uploaded image URLs come back as relative
paths, e.g. `/uploads/169...-photo.jpg` — you'd combine that with your
base URL to actually display it. On `STORAGE_DRIVER=gcs`, they come back
as full URLs already (`https://storage.googleapis.com/...`). If you
build image display in the Flutter app while still on local storage,
keep this in mind so it isn't a surprise later.

---

## Phase 2: Deploying to Google Cloud Run

Cloud Run is a "serverless" way to run this backend: Google handles the
server, scaling, and restarts — you just hand it your code. It scales
to zero when nobody's using the app, so you're not paying for an idle
machine. This walkthrough assumes you've never used Google Cloud before.

### 1. Install the gcloud CLI and sign in
Download it from `cloud.google.com/sdk/docs/install`, then run:
```bash
gcloud init
gcloud auth login
```
This opens a browser window to log into your Google account.

### 2. Create a project
```bash
gcloud projects create krishokbondhon-app --name="KrishokBondhon"
gcloud config set project krishokbondhon-app
```
(Project IDs must be globally unique — if this one's taken, add digits,
e.g. `krishokbondhon-app-2026`.)

### 3. Link a billing account
Cloud Run requires a billing account attached, even though the free tier
covers typical dev/small-app usage (2 million requests/month, forever,
not a time-limited trial). You won't be charged unless you exceed that.
Do this once, in the console: `console.cloud.google.com/billing` → link
a card → link it to your project.

### 4. Enable the APIs you need
```bash
gcloud services enable run.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com
```

### 5. Create the image storage bucket
```bash
gcloud storage buckets create gs://krishokbondhon-post-images \
  --location=asia-south1 \
  --uniform-bucket-level-access
```
Then make it publicly readable (fine for farmer-facing post photos —
nothing sensitive is stored here):
```bash
gcloud storage buckets add-iam-policy-binding gs://krishokbondhon-post-images \
  --member=allUsers --role=roles/storage.objectViewer
```

### 6. Deploy
From inside the `krishokbondhon_backend` folder:
```bash
gcloud run deploy krishokbondhon-backend \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="JWT_SECRET=your-real-secret,MONGO_URI=your-atlas-connection-string,STORAGE_DRIVER=gcs,GCS_BUCKET_NAME=krishokbondhon-post-images"
```

**Important:** don't forget `STORAGE_DRIVER=gcs` in that list. If you
omit it, the app quietly falls back to `local` — meaning it'll try to
write images to Cloud Run's local disk, which will seem to work at
first and then silently lose images the moment the container restarts.

- `--source .` tells Cloud Run to build the container for you (via Cloud
  Build) straight from this folder — no local Docker needed.
- `--allow-unauthenticated` means the *Cloud Run URL itself* is publicly
  reachable. This is correct here: your own JWT middleware (`auth.js`)
  still gates every actual endpoint — this flag is about Google's layer,
  not yours.
- First deploy takes a few minutes. It'll print a URL like
  `https://krishokbondhon-backend-xxxxx.a.run.app` when done — that's
  your live API base URL.

### 7. Let Cloud Run talk to MongoDB Atlas
Cloud Run doesn't use a fixed IP address by default, so in Atlas's
**Network Access** panel, keep (or add) `0.0.0.0/0` (allow from
anywhere) for now. For production later, look into Atlas's **Private
Service Connect** with a Serverless VPC Connector to lock this down
properly — worth doing before real farmer data is involved, not
required to get started.

### 8. Point the Flutter app at it
```bash
flutter run --dart-define=API_BASE_URL=https://krishokbondhon-backend-xxxxx.a.run.app/v1
```

### 9. Redeploying after code changes
Same command as step 6 — Cloud Run builds a new version and switches
traffic over with zero downtime.

### A note on `npm audit`
`@google-cloud/storage` currently pulls in an older `uuid` version with
a known moderate-severity advisory (a buffer-bounds check issue that
only matters if you pass a custom buffer into UUID generation — this
codebase never does). It's an upstream issue in Google's own SDK, not
something introduced here. Worth re-running `npm audit` occasionally in
case Google ships a fix.

---

## Folder structure

```
Dockerfile                 — packages this app into a container for Cloud Run
.dockerignore               — keeps node_modules/secrets out of that container
src/
  server.js                 — starts the app, connects to MongoDB
  app.js                    — Express setup, mounts routes under /v1
  config/db.js              — MongoDB connection
  middleware/
    auth.js                  — verifies the JWT, fills in req.user
    upload.js                 — holds uploaded files in memory (multer)
    errorHandler.js           — turns thrown errors into clean JSON responses
  models/                    — Mongoose schemas: Post, Comment, Question, Answer
  controllers/               — the actual logic behind each endpoint
  routes/                    — maps URLs to controller functions
  services/
    storageService.js         — picks local vs. GCS based on STORAGE_DRIVER
    storage/localDriver.js     — free local disk storage
    storage/gcsDriver.js       — Google Cloud Storage, for production
    nlpService.js              — stubbed "ask the AI" background job
    expertNotificationService.js — stubbed expert-matching notification job
  utils/
    pagination.js             — cursor-based "load more" logic
    asyncHandler.js            — plumbing so async errors don't hang requests
scripts/generateTestToken.js — mint a fake login token for local testing
uploads/                    — local image storage (Phase 1 only, gitignored)
```

## What's stubbed vs. real

| Piece | Status |
|---|---|
| Feed, posts, likes, comments | Fully working against MongoDB |
| Questions, farmer/expert answers | Fully working against MongoDB |
| Answer ordering | Expert-verified first, then AI, then farmer — per the build guide's Q&A screen spec |
| "List open questions" filter | `GET /qna/questions?status=open` |
| AI answer generation | **Stubbed** — waits 5s, writes a placeholder reply. Swap `generateAiAnswer()` in `src/services/nlpService.js` for a real call to your FastAPI microservice. |
| Expert notification on new question | **Stubbed, no-op** — the trigger point is real (fires on every new question), but actual specialty/language matching + email sending needs the Postgres expert directory service to exist first. See `src/services/expertNotificationService.js`. |
| Image storage | Real in both modes — local disk for free dev, Google Cloud Storage for production. |
| Auth / JWT issuing | **Not built here.** This service only verifies tokens; your Postgres-backed auth service issues them. Make sure both use the same `JWT_SECRET`. |

## Mapping to the full build guide

This repo intentionally covers only **Phase 5 (Social Feed)** and
**Phase 6 (Q&A)** of the full KrishokBondhon build guide — not the whole
app. Here's exactly what that means, phase by phase:

| Guide phase | Covered here? |
|---|---|
| Phase 2 (project setup, both DBs) | Partial — this repo's half (Express + MongoDB) is done; the PostgreSQL half (users, experts, otp_verifications) is a separate service |
| Phase 3 (auth, OTP, JWT issuing, expert verification) | Not here — this repo only *verifies* JWTs issued elsewhere |
| Phase 4 (disease detection, YOLO/TFLite) | Not here — separate Python/FastAPI + Flutter work |
| Phase 5 (social feed) | ✅ Fully implemented |
| Phase 6, Steps 6.1, 6.4, 6.5 (Q&A API, expert notification trigger, answer ordering) | ✅ Implemented (6.4 as a documented stub — see table above) |
| Phase 6, Step 6.2 (real AI pipeline: intent detection, NER, translation, LLM) | Not here — stubbed, needs a separate Python NLP microservice |
| Phase 6, Step 6.3 (knowledge base scraping) | Not here — separate Python project (Scrapy/BeautifulSoup/PDFMiner) |
| Phase 7 (voice, TTS, translation) | Not here — Flutter-side (already built in the mobile app) |
| Phases 8-12 (integration, testing, release) | Not here — app-wide concerns, not this service's job |

If you're checking this repo off against the guide: it's not meant to
be the whole checklist by itself, just the two boxes it was built for.

## Next steps to wire this into the real system

1. Build and test everything using Phase 1 (free, local) until the
   feature set feels solid.
2. Merge these routes into your existing API gateway (or run this as its
   own microservice behind the gateway — either works, since it's just
   Express).
3. Point `JWT_SECRET` at whatever your real auth service uses to sign
   tokens, so real login tokens work here too.
4. Replace `generateAiAnswer()` with a real HTTP call to the FastAPI NLP
   service.
5. Move to Phase 2 when you're ready to actually deploy.
"# krishokbondhon_backend" 
