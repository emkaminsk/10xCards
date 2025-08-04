# 10xCards

A web application that generates and manages high‑quality educational flashcards using AI, designed to help Spanish learners study efficiently with spaced repetition.

## Table of Contents
- [Project description](#project-description)
- [Tech stack](#tech-stack)
- [Getting started locally](#getting-started-locally)
- [Available scripts](#available-scripts)
- [Project scope](#project-scope)
- [Project status](#project-status)
- [License](#license)

## Project description

10xCards automates the most time‑consuming part of learning with flashcards: creating them. Paste a Spanish article URL, and the app will parse the content, filter vocabulary by your proficiency, deduplicate against your collection, and generate well‑structured flashcards with context and tags. You can review, bulk accept/reject, and manage cards, then learn them with a simple Leitner spaced‑repetition system.

### Key goals
- Reduce time to create quality flashcards.
- Achieve high user acceptance of AI‑generated cards.
- Maintain a smooth local developer experience with Docker Compose.

### Core capabilities (PoC)
- AI card generation from web content with context and tags.
- Manual card CRUD.
- Browse, filter, search cards.
- Simple authentication (single password).
- Simple spaced repetition (Leitner) with basic stats.

### Success criteria
- 75%+ of AI‑generated cards accepted by users.
- 75%+ of new cards created via AI.
- Backend average response time under 400 ms.

For detailed requirements and user stories, see [doc/prd.md](doc/prd.md).
For architectural stack details, see [doc/stack.md](doc/stack.md).

## Tech stack

### Frontend
- Next.js 14
- React 18 (HTML/HTMLX in PoC; migration to React 19 planned in Phase 3)
- TypeScript 5
- CSS Modules

### Backend
- Python 3.13 with FastAPI
- PostgreSQL (tables: cards, reviews, boxes, stats)
- NLP: hybrid approach with spaCy + LLM (as needed)
- Content parser: httpx + selectolax/readability, timeouts, SSRF guard
- Authentication: argon2/bcrypt password hashing, HTTP‑only session, simple FastAPI middleware
- Rate limiting/throttling and minimal latency/error monitoring
- Docker Compose for local development and deployment

### AI
- OpenRouter.ai for model access (OpenAI, Anthropic, Google, etc.) with budget controls
- API keys stored server‑side only

### CI/CD and Hosting
- GitHub Actions for pipelines
  - PoC pipeline (local): unit tests, build images
  - Target pipeline: unit tests, build images, push to GHCR, deploy via SSH, DB migrations, smoke tests
- Local PoC: Docker Compose
- Target production: DigitalOcean VPS using Docker Compose

## Getting started locally

### Prerequisites
- Node.js 22.14.0 (nvm recommended; see [.nvmrc](src_poc/frontend/.nvmrc))
- Docker and Docker Compose
- Python 3.13 (for backend development)
- An OpenRouter API key for AI features (stored on backend only)

### Repository layout (PoC focus)
- Frontend: `src_poc/frontend`
- Documentation: `doc/stack.md`, `doc/prd.md`
- Backend and Docker assets: planned as part of PoC; ensure Compose configuration matches the stack in [doc/stack.md](doc/stack.md).

### Setup

1) Clone the repository
```bash
git clone https://github.com/<your-org>/10xCards.git
cd 10xCards
```

2) Frontend environment
```bash
cd src_poc/frontend
nvm use
npm install
```

3) Run the frontend in development
```bash
npm run dev
```
The app will start on http://localhost:3000 by default.

4) Backend and database
- Ensure Docker and Docker Compose are installed.
- Create a `.env` file for backend service (not included here) with, at minimum:
  - `OPENROUTER_API_KEY=<your-key>`
  - `DATABASE_URL=postgresql://<user>:<pass>@db:5432/10xcards`
  - `SESSION_SECRET=<random-strong-secret>`
- Start services via Docker Compose from the repository root when compose files are available:
```bash
docker compose up -d
```
- Apply database migrations as defined in the backend project (scripts TBD).

5) Linting
From `src_poc/frontend`:
```bash
npm run lint
```

### Notes
- Authentication is a single-password scheme with hashed storage. Credentials are stored locally.
- All AI requests are routed through the backend; no frontend exposure of the OpenRouter API key.
- Parsing and AI operations are asynchronous with a 10s timeout target.

## Available scripts

### Frontend (`src_poc/frontend/package.json`)
- `dev`: Start Next.js in development mode
  ```bash
  npm run dev
  ```
- `build`: Build the production bundle
  ```bash
  npm run build
  ```
- `start`: Start the production server
  ```bash
  npm run start
  ```
- `lint`: Run ESLint
  ```bash
  npm run lint
  ```

### Backend and database
- Will be managed via Docker Compose (build/up/down/logs) and backend‑specific scripts (TBD).
- Example commands once compose files are present:
  - Build images: `docker compose build`
  - Start services: `docker compose up -d`
  - View logs: `docker compose logs -f`

## Project scope

### In scope (PoC)
- Parser: fetch article by URL, longest‑text‑block heuristic with `<article>` fallback, paywall awareness, Spanish text focus.
- AI generation: proficiency filtering (A1–C2), global deduplication per user, card structure (front/back/context), context soft limit 500 chars, auto tags (POS/tense/mood/domain), per‑import session grouping.
- Card management: manual create/edit/delete, bulk accept/reject, browse with filters and search.
- Repetition: simple Leitner algorithm, stats table, scheduling, progress tracking.
- Auth: single password, hashed, HTTP‑only session, no registration.

### Out of scope (PoC)
- Advanced SRS algorithms (e.g., SuperMemo/Anki)
- Multi‑format imports (PDF/DOCX/etc.)
- Sharing sets, external platform integrations
- Mobile apps (web only)
- Export features
- Multi‑user support
- Data reset utilities, versioning of card changes
- Advanced learning analytics and cross‑device sync

### Constraints and targets
- Up to 100k cards
- Single user
- CRUD < 400 ms; parsing/AI async with 10s timeout
- Local environment via Docker Compose

## Project status

### Roadmap and phases
- **Phase 1** (Weeks 1–4): Parser + LLM + basic frontend
- **Phase 2** (Weeks 5–6): Spaced repetition system
- **Phase 3** (post‑PoC): spaCy integrations, improved frontend (React 19), production hardening

### Quality gates and metrics
- ≥ 50% test coverage (backend via PyTest, frontend via Jest)
- Stability: no critical PoC bugs, ≤ 5% generation errors, 24h stable runtime
- Performance: backend average response < 400 ms

### Current versions
- Frontend: Next 14.0.3, React 18.2, TypeScript ^5.3.2, ESLint ^8.54.0
- Node: 22.14.0 ([.nvmrc](src_poc/frontend/.nvmrc))

### Documentation
- Product requirements: [doc/prd.md](doc/prd.md)
- Architecture and stack: [doc/stack.md](doc/stack.md)

## License

This project's license is not specified yet. Add a LICENSE file and update this section accordingly. Example:
- License: MIT
- Badge: ![MIT](https://img.shields.io/badge/License-MIT-blue.svg)

### Badges (optional placeholders)
- Status: PoC in progress
- Version: 0.1.0 (frontend package)
- CI: GitHub Actions (to be configured)

### Links
- Product Requirements: [doc/prd.md](doc/prd.md)
- Technical Stack: [doc/stack.md](doc/stack.md)