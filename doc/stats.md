# Tabela: stats_daily

id: bigint PK
user_id: uuid NOT NULL
date: date NOT NULL
ai_proposed: integer NOT NULL DEFAULT 0 // liczba fiszek zaproponowanych przez AI tego dnia
ai_accepted: integer NOT NULL DEFAULT 0 // liczba fiszek zaakceptowanych tego dnia
manually_created: integer NOT NULL DEFAULT 0 // fiszki utworzone ręcznie tego dnia
reviews_total: integer NOT NULL DEFAULT 0 // liczba ocen/fiszko-odpowiedzi w sesjach powtórek
reviews_correct: integer NOT NULL DEFAULT 0 // liczba odpowiedzi ocenionych jako „dobrze” (wg Leitnera)
time_spent_seconds: integer NOT NULL DEFAULT 0 // łączny czas spędzony na nauce (sumowany w sesjach)
sessions_count: integer NOT NULL DEFAULT 0 // liczba sesji powtórek rozpoczętych tego dnia
cards_due: integer NOT NULL DEFAULT 0 // liczba fiszek zaplanowanych na ten dzień (snapshot rano lub przy pierwszym wejściu)
cards_completed: integer NOT NULL DEFAULT 0 // liczba fiszek z due, które zostały przerobione tego dnia
avg_backend_crud_ms: integer // średni czas odpowiedzi CRUD (opcjonalnie, z logów)
p95_backend_crud_ms: integer // p95 CRUD (opcjonalnie)
ai_tasks_count: integer NOT NULL DEFAULT 0 // liczba zadań AI (generacja, deduplikacja semantyczna)
ai_tasks_p95_seconds: integer // p95 czasu zadań AI (opcjonalnie)
created_at: timestamptz NOT NULL DEFAULT now()
updated_at: timestamptz NOT NULL DEFAULT now()
Unikalność/indeksy:
UNIQUE (user_id, date)
INDEX (date), INDEX (user_id, date DESC)
Wzory KPI, które można liczyć w widoku lub w aplikacji:
AI Acceptance Rate = ai_accepted / NULLIF(ai_proposed, 0)
AI Usage Share = ai_accepted / NULLIF(ai_accepted + manually_created, 0)
Session Efficiency = cards_completed / NULLIF(cards_due, 0)
Learning Streak, 7/30-day aggregates = SUM per window

## Widoki dla UI:

view_kpi_daily: SELECT date, ai_proposed, ai_accepted, manually_created, reviews_total, reviews_correct, time_spent_seconds, sessions_count, cards_due, cards_completed, ai_accepted::float/NULLIF(ai_proposed,0) AS ai_acceptance, ai_accepted::float/NULLIF(ai_accepted+manually_created,0) AS ai_usage