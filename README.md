# 🧠 Qapitol Intel Agent
### AI-Powered Competitor & Market Intelligence — Automated Weekly Digest

> Built for Qapitol QA's AI Adoption Engineer assessment. Monitors 5 competitors across websites, news, LinkedIn, resources, and events — synthesises strategic insights using Claude AI — delivers a structured HTML email digest every Monday morning. Fully autonomous. Zero babysitting.

---

## 📸 What It Delivers

A CEO-readable HTML email every week:

- **Per competitor**: What's New · Key Signal · Watch Out For
- **Market Pulse**: Top 3 industry themes across the QA/testing space
- **Delta-only**: Never repeats last week's content — only surfaces what actually changed

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    cron-job.org                         │
│              POST /run  every Monday 9AM                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 Railway (Node.js server)                 │
│                      server.js                          │
│                  Express HTTP server                    │
└────────────────────────┬────────────────────────────────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    ┌─────────────┐ ┌──────────┐ ┌──────────────┐
    │  Firecrawl  │ │  Apify   │ │   Supabase   │
    │  Website    │ │ LinkedIn │ │   Storage    │
    │  Scraping   │ │ Scraping │ │  + Hashes    │
    └──────┬──────┘ └────┬─────┘ └──────┬───────┘
           └─────────────┼──────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    Claude Haiku     │
              │  Synthesis + Delta  │
              │   Prompt Engine     │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │       Resend        │
              │   HTML Email Send   │
              └─────────────────────┘
```

---

## 🧩 Tech Stack & Why

| Layer | Tool | Why |
|---|---|---|
| Website scraping | **Firecrawl** | Handles JS-rendered pages, returns clean markdown, built-in content extraction |
| LinkedIn scraping | **Apify** `harvestapi/linkedin-company-posts` | No cookies or login required — only reliable cookieless LinkedIn scraper |
| LLM synthesis | **Claude Haiku 4.5** | Fast, cheap, excellent instruction-following for structured digest output |
| Storage | **Supabase** | Postgres + JSON columns for hashes and post IDs — free tier sufficient |
| Email | **Resend** | Modern email API, excellent deliverability, simple Node.js SDK |
| Hosting | **Railway** | Auto-deploys from GitHub, always-on Node server, free trial |
| Scheduling | **cron-job.org** | Free external cron, hits Railway `/run` endpoint weekly |

---

## 📁 Project Structure

```
competitor-intelligence/
├── index.js              # Main orchestrator — runs the full pipeline
├── server.js             # Express HTTP server — exposes POST /run endpoint
├── competitors.js        # Competitor config — URLs, slice sizes, scraping options
├── scrapers/
│   ├── website.js        # Firecrawl scraper with MD5 hash-based change detection
│   └── linkedin.js       # Apify LinkedIn scraper with post ID deduplication
├── prompts/
│   └── digest.js         # Claude prompt builder — delta vs first-run logic
├── storage/
│   └── supabase.js       # Supabase read/write — digests, hashes, LinkedIn IDs
├── email/
│   └── send.js           # HTML email builder + Resend delivery
├── package.json
└── .env                  # API keys (never committed)
```

---

## ⚙️ Setup — From Zero to Running in 30 Minutes

### 1. Clone the repo

```bash
git clone https://github.com/asishcs2011010/competitor-intelligence.git
cd competitor-intelligence
npm install
```

### 2. Create your `.env` file

```bash
cp .env.example .env
```

Fill in your keys:

```env
# Scraping
FIRECRAWL_API_KEY=your_firecrawl_key
APIFY_API_TOKEN=your_apify_token

# LLM
ANTHROPIC_API_KEY=your_anthropic_key

# Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Email
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=digest@yourdomain.com
```

> **Optional** (unused in production but in .env):
> `GEMINI_API_KEY`, `GROQ_API_KEY` — kept for future LLM switching

### 3. Set up Supabase table

Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE digests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_of date NOT NULL,
  scraped_data text,
  digest text,
  created_at timestamp DEFAULT now(),
  content_hashes jsonb DEFAULT '{}'::jsonb,
  linkedin_post_ids jsonb
);
```

### 4. Run locally

```bash
# One-off run (scrape + synthesise + email)
node index.js

# Start HTTP server (for cron or manual triggers)
node server.js

# Trigger via HTTP
curl -X POST http://localhost:3000/run
```

---

## 🌐 Deploy to Railway

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add all `.env` variables in Railway → Variables tab
4. Settings → Networking → Generate Domain → Port `3000`
5. Railway auto-deploys on every `git push`

---

## ⏰ Set Up Weekly Cron (cron-job.org)

1. Go to [cron-job.org](https://cron-job.org) → Create Cronjob
2. URL: `https://your-app.up.railway.app/run`
3. Method: `POST`
4. Crontab expression: `0 9 * * 1` (Every Monday 9:00 AM UTC)
5. Save

---

## 🔍 How the Intelligence Pipeline Works

### Step 1 — Website Scraping (Firecrawl)
Each competitor has 4 URLs configured in `competitors.js`: blog, news, resources, events. Firecrawl scrapes each URL and returns clean markdown. Content is MD5-hashed and compared against last week's hash stored in Supabase.

Pages are labelled:
- `[FIRST RUN — report everything found]`
- `[CHANGED THIS WEEK — report what is new]`
- `[NO CHANGE SINCE LAST WEEK — skip this section]`

Only changed content reaches Claude — saving tokens and preventing stale intel.

### Step 2 — LinkedIn Scraping (Apify)
Apify's `harvestapi/linkedin-company-posts` actor scrapes the last 3 posts from each competitor's LinkedIn page without requiring cookies or a LinkedIn account. Post IDs are stored in Supabase — already-seen posts are filtered out before Claude sees them.

### Step 3 — Consent Wall Handling
Two strategies used:
- **RSS feeds** for QA Wolf — structured XML, no consent layer, always clean
- **Targeted deep URLs** for Infosys BPM — linking directly to `/blogs.html`, `/newsroom/press-releases.html` bypasses homepage consent walls

### Step 4 — Claude Synthesis
A structured prompt sends only the changed/new content to Claude Haiku. The prompt enforces:
- Delta-only reporting (no repeating last week's signals)
- Insight over summary ("4 blogs on AI testing suggests imminent product launch" not "they published blogs")
- Consistent output format across all 5 competitors
- Market Pulse themes grounded only in this week's data

### Step 5 — HTML Email (Resend)
The digest markdown is parsed into structured sections and rendered as a dark-themed HTML newsletter with competitor cards (ACTIVE/QUIET badges), key signal callouts, and a Market Pulse section. Delivered via Resend.

---

## 🛡️ Reliability Features

| Feature | Implementation |
|---|---|
| Concurrent run protection | `isRunning` mutex in `server.js` — returns 429 if a run is already in progress |
| Change detection | MD5 hash per page stored in Supabase — skip unchanged pages |
| LinkedIn deduplication | Post IDs stored in Supabase — filter seen posts each run |
| Scrape failure handling | Try/catch per URL — failed pages marked `[SCRAPE FAILED]`, run continues |
| Consent wall detection | Auto-detects "manage consent preferences" in scraped content, marks as `[BLOCKED]` |

---

## ➕ Adding a New Competitor

Just add one object to `competitors.js`:

```javascript
{
  name: "New Competitor",
  blog: "https://newcomp.com/blog",
  news: "https://newcomp.com/news",
  resources: "https://newcomp.com/resources",
  events: "https://newcomp.com/events",
  onlyMainContent: true,
  sliceSize: 8000,
}
```

No other code changes needed. The system handles it automatically.

---

## 📈 How to Scale to 20 Competitors

The architecture already supports it — no structural changes needed:

1. Add competitors to `competitors.js` (one object each)
2. Increase Claude `max_tokens` from 4000 to 8000
3. Consider upgrading to Claude Sonnet for richer synthesis at scale
4. Split email into sections if HTML grows large (>100KB Gmail clips)
5. Add Supabase index on `week_of` for faster digest lookups

**Estimated cost at 20 competitors:**
- Firecrawl: ~80 pages/week — well within free tier
- Apify: ~60 posts/week — minimal cost
- Claude Haiku: ~$0.05–0.10/run
- Resend: free tier (100 emails/day)

---

## 💬 How to Add Slack Delivery

Add this to `index.js` after `sendDigestEmail(digest)`:

```javascript
// Slack webhook delivery
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: `*Qapitol Intel Brief — ${weekOf}*\n\`\`\`${digest.slice(0, 3000)}\`\`\``
  })
});
```

Add `SLACK_WEBHOOK_URL` to your `.env` and Railway variables.

---

## ⚠️ Known Limitations

| Limitation | Detail |
|---|---|
| LinkedIn rate limits | Apify's free tier has credit limits — frequent testing depletes credits faster |
| CSP-blocked pages | Some Infosys BPM event pages blocked by Content Security Policy headers |
| Weekly cadence only | No real-time alerts — breaking news will wait until Monday |
| Single recipient | Email hardcoded to one address — change in `email/send.js` |
| Claude Haiku | Cost-optimised model — Sonnet would produce deeper strategic synthesis |

---

## 🔮 Future Improvements

- **Hiring signal tracking** — Monitor LinkedIn Jobs for competitor hiring patterns (engineering, sales, specific roles signal strategy shifts)
- **Real-time mode** — Trigger on RSS feed updates for breaking news alerts
- **Sentiment scoring** — Track whether competitor content is defensive, aggressive, or expansionary
- **Multi-recipient + role filtering** — CEO gets executive summary, GTM team gets full competitor detail
- **Analyst report monitoring** — Auto-detect when competitors appear in Gartner/Forrester/Everest reports
- **Slack + email** — Parallel delivery channels

---

## 🧑‍💻 Author

Built by **Asish** for the Qapitol QA AI Adoption Engineer Assessment — May 2026.

> *"A focused system that does 5 competitors really well — with clean output and a reliable schedule."*