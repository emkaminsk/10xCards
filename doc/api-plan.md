# REST API Plan

## 1. Resources

| Resource | DB Table(s) | Description |
|----------|-------------|-------------|
| AuthSession | – | In-memory HTTP session representing the logged-in user |
| User | users, user_settings | Single application user and their configurable settings |
| ImportSession | import_sessions | Metadata about each article import & AI generation batch |
| ProposedCard | proposed_cards | Temporary AI-generated flash-card suggestions |
| Card | cards | Accepted flash-cards owned by the user (soft-deletable) |
| LeitnerBox | leitner_boxes | Leitner box state for each accepted card |
| Review | reviews | Historical record of every review performed by the user |
| Stats | – (views) | Aggregate analytical data derived from the above tables |

Notes:
- Only **one** user is expected in MVP, but endpoints are designed for multi-user compatibility & future RLS.
- All write operations implicitly scope `user_id` to the authenticated user (taken from the session); clients must **never** send `user_id`.

## 2. Endpoints

### Conventions
- Base URL: `/api/v1`
- Pagination: `?page=<int>&limit=<int>` (default limit = 20, max = 100)
- Sorting: `?sort=<field>&order=asc|desc`
- Filtering uses explicit query parameters (`/cards?tag=noun&status=active`).
- Standard success envelope:
```json
{
  "data": <payload>,
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```
- Standard error envelope:
```json
{
  "error": "ValidationError",
  "message": "front must be non-empty and <= 500 chars"
}
```

### 2.1 Authentication
| Method | Path | Description | Req Body | Res Body | Success | Errors |
|--------|------|-------------|----------|----------|---------|--------|
| POST | `/auth/login` | Start session with the single application password | `{ "password": "string" }` | `{ "message": "Login successful" }` (sets `Set-Cookie: session=<token>; HttpOnly`) | 200 | 401 InvalidPassword, 400 ValidationError |
| POST | `/auth/logout` | Destroy current session | – | `{ "message": "Logout successful" }` | 200 | 401 NotAuthenticated |
| GET | `/auth/session` | Return info about current session | – | `{ "authenticated": true, "user_id": "uuid" }` | 200 | 401 NotAuthenticated |

### 2.2 User & Settings
| Method | Path | Description | Req Body | Res Body | Success | Errors |
|--------|------|-------------|----------|----------|---------|--------|
| POST | `/user/password` | Change password | `{ "old": "string", "new": "string" }` | `{ "message": "Password updated" }` | 200 | 400 ValidationError, 401 InvalidOldPassword |
| GET | `/user/settings` | Retrieve settings | – | `{ "proficiency_level": "B1" }` | 200 | 401 NotAuthenticated |
| PUT | `/user/settings` | Update settings | `{ "proficiency_level": "A1|A2|B1|B2|C1|C2" }` | `{ "proficiency_level": "B1" }` | 200 | 400 ValidationError, 401 NotAuthenticated |

### 2.3 Import Sessions
| Method | Path | Description | Req Body | Res Body | Success | Errors |
|--------|------|-------------|----------|----------|---------|--------|
| POST | `/import-sessions` | Create new import from article URL (triggers async fetch & AI generation) | `{ "source_url": "https://..." }` | `{ "id": "uuid", "status": "processing" }` | 201 | 400 InvalidURL, 401 NotAuthenticated |
| GET | `/import-sessions` | List import sessions (paged) | – | `{ "data": [...], "meta": {...} }` | 200 | 401 NotAuthenticated |
| GET | `/import-sessions/{id}` | Fetch single session with stats | – | `{ "id": "uuid", "source_url": "...", "total_generated": 15, "total_accepted": 8, "status": "completed", "created_at": "..." }` | 200 | 401 NotAuthenticated, 404 NotFound |

### 2.4 Proposed Cards
| Method | Path | Description | Req Body | Res Body | Success | Errors |
|--------|------|-------------|----------|----------|---------|--------|
| GET | `/import-sessions/{id}/proposed-cards` | List proposed cards for session (supports `?selected=true`) | – | `{ "data": [{"id": "...", "front": "...", "back": "...", "context": "...", "tags": {...}, "is_selected": false}], "meta": {...} }` | 200 | 401 NotAuthenticated, 404 SessionNotFound |
| PATCH | `/proposed-cards/{id}` | Update single proposed card (select/unselect) | `{ "is_selected": true }` | `{ "id": "...", "is_selected": true }` | 200 | 400 ValidationError, 401 NotAuthenticated, 404 NotFound |
| POST | `/import-sessions/{id}/proposed-cards/accept` | Bulk accept **selected** proposals (moves to `cards`, creates `leitner_boxes`) | – | `{ "accepted_count": 5, "message": "5 cards accepted successfully" }` | 200 | 401 NotAuthenticated, 404 SessionNotFound, 409 NoneSelected |
| POST | `/import-sessions/{id}/proposed-cards/reject` | Bulk reject **selected** proposals (deletes rows) | – | `{ "rejected_count": 3, "message": "3 proposals rejected" }` | 200 | 401 NotAuthenticated, 404 SessionNotFound, 409 NoneSelected |

### 2.5 Cards
| Method | Path | Description | Req Body | Res Body | Success | Errors |
|--------|------|-------------|----------|----------|---------|--------|
| GET | `/cards` | List accepted cards (filters: `?tag=noun&status=active&q=search`) | – | `{ "data": [{"id": "...", "front": "...", "back": "...", "context": "...", "tags": {...}, "status": "active", "created_at": "..."}], "meta": {...} }` | 200 | 401 NotAuthenticated |
| POST | `/cards` | Manually create card | `{ "front": "string", "back": "string", "context": "string?", "tags": {...} }` | `{ "id": "uuid", "front": "...", "back": "...", "context": "...", "tags": {...}, "status": "active" }` | 201 | 400 ValidationError, 401 NotAuthenticated, 409 DuplicateCard |
| GET | `/cards/{id}` | Retrieve single card | – | `{ "id": "...", "front": "...", "back": "...", "context": "...", "tags": {...}, "status": "active", "created_at": "...", "updated_at": "..." }` | 200 | 401 NotAuthenticated, 404 NotFound |
| PUT | `/cards/{id}` | Update card | `{ "front": "string?", "back": "string?", "context": "string?", "tags": {...}? }` | `{ "id": "...", "front": "...", "back": "...", "context": "...", "tags": {...}, "updated_at": "..." }` | 200 | 400 ValidationError, 401 NotAuthenticated, 404 NotFound, 409 DuplicateCard |
| DELETE | `/cards/{id}` | Soft-delete card (sets `deleted_at`) | – | `{ "message": "Card deleted successfully" }` | 200 | 401 NotAuthenticated, 404 NotFound |

### 2.6 Review Workflow
| Method | Path | Description | Req Body | Res Body | Success | Errors |
|--------|------|-------------|----------|----------|---------|--------|
| GET | `/reviews/scheduled` | List cards due for review today (ordered by `next_review_date`) | – | `{ "data": [{"card_id": "...", "front": "...", "back": "...", "context": "...", "box_level": 2, "next_review_date": "..."}], "meta": {"total": 15} }` | 200 | 401 NotAuthenticated |
| POST | `/reviews/{card_id}` | Submit review rating (creates row in `reviews`, updates `leitner_boxes`) | `{ "rating": "again|hard|good|easy", "response_time_ms": 350? }` | `{ "card_id": "...", "new_box_level": 3, "next_review_date": "...", "rating": "good" }` | 201 | 400 ValidationError, 401 NotAuthenticated, 404 CardNotFound |
| GET | `/reviews/session/{id}` | Retrieve historical review session summary | – | `{ "session_id": "...", "total_reviews": 10, "ratings": {"easy": 3, "good": 5, "hard": 2}, "duration_ms": 850000, "completed_at": "..." }` | 200 | 401 NotAuthenticated, 404 SessionNotFound |

### 2.7 Statistics
| Method | Path | Description | Req Body | Res Body | Success | Errors |
|--------|------|-------------|----------|----------|---------|--------|
| GET | `/stats/overview` | Return aggregated learning statistics | – | `{ "total_cards": 150, "cards_due_today": 12, "cards_learned": 45, "study_streak_days": 7, "avg_daily_reviews": 15, "proficiency_distribution": {"box_1": 20, "box_2": 35, "box_3": 50, "box_4": 30, "box_5": 15} }` | 200 | 401 NotAuthenticated |

## 3. Authentication & Authorization
- **Mechanism**: Session-based auth with HTTP-only secure cookie; initial login with single master password stored hashed (`argon2`)
- **Middleware** in FastAPI validates cookie → `current_user_id` and sets `app.current_user_id` (used by PostgreSQL RLS policies already defined).
- **Rate Limiting**: Global 60 requests/minute per IP; tighter (10/min) on expensive endpoints (`/import-sessions`, `/reviews`). Use FastAPI-Limiter + Redis or in-memory for MVP.
- **RBAC**: Only one role (`user`) in MVP; future-proof by reserving `admin`.

## 4. Validation & Business Logic

### 4.1 Validation Rules (subset)
| Field | Rule | Source |
|-------|------|--------|
| `card.context` | max 500 characters | `CHECK (length(context) <= 500)` – schema line 64 |
| `leitner_boxes.box_level` | 1 – 5 | `CHECK (box_level >= 1 AND box_level <= 5)` – schema line 97 |
| `cards` uniqueness | `(user_id, front, back)` must be unique | UNIQUE constraint – schema line 71 |
| Card similarity | Reject insert if similarity(front/back) > 0.8 | Trigger `check_card_similarity` – schema 187–207 |
| Proposal TTL | `expires_at` auto set + cleanup job | schema lines 210-218 |
| Password length | ≥ 8 chars (assumed) | PRD US-001 |

### 4.2 Business Logic Mapping
| PRD Feature | Endpoint(s) | Logic inside service layer |
|-------------|-------------|---------------------------|
| US-002 Import Article | `POST /import-sessions` | Validate URL, enqueue article parsing job; on success populate `source_content`, generate proposed cards via AI -> `proposed_cards` |
| US-002.b Redirect to proposals | FE consumes create response, client-side redirect to `/import-sessions/{id}/proposed-cards`; BE provides session stats & progress endpoints |
| US-003 AI Card Generation | Background task invoked by Import Session creation; respects `user_settings.proficiency_level` and deduplicates against `cards` table |
| US-005 Select Proposals | `PATCH /proposed-cards/{id}` with body `{"is_selected": true/false}` |
| US-006 Accept Selected | `POST /import-sessions/{id}/proposed-cards/accept` bulk moves selected rows; creates rows in `cards` & `leitner_boxes` |
| US-007 Reject Selected | `.../reject` bulk delete |
| US-008 Manual Card | `POST /cards` with same validation as AI; runs dedupe trigger |
| US-012 Start Review Session | `GET /reviews/scheduled` list due cards |
| US-013 Rate Card | `POST /reviews/{card_id}` updates `leitner_boxes`, stores review, calculates next review date via Leitner algorithm |
| US-014 End Session Summary | FE aggregates results returned from `/reviews/session/{id}` |
| US-015 Learning Stats | `GET /stats/overview` aggregates `reviews`, `cards`, `leitner_boxes` |
| US-016 Change Proficiency | `PUT /user/settings` |
| US-017 Parser Errors | `import-sessions` background job records failure reason; FE polls `/import-sessions/{id}` to show `status` & `error` fields |

### 4.3 Additional Security & Performance
- **Indexes** (`idx_leitner_boxes_next_review`, trigram on cards `front+back`) ensure `/reviews/scheduled` and `/cards?q=` remain < 400 ms (PRD performance requirement).
- **Async jobs** for article parsing & AI generation ensure request timeout < 30 s (PRD operational limit).
- **CORS** configuration for frontend-backend communication in Docker Compose setup.
- **Request validation** using Pydantic models aligned with database constraints.
