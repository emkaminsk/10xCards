Frontend - Next.js z React dla komponentów interaktywnych:
- Next.js
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- CSS Modules

Backend - złożone kompleksowe rozwiązanie:
- baza danych PostgreSQL. Schemat DB (tabele cards, reviews, boxes, stats).
- NLP robiony hybrydowo z wykorzystaniem spaCy oraz LLM (w razie potrzeby)
- backend w Python 3.13 z FastAPI
- parser treści z internetu: Python (httpx + selectolax/readability + timeouts + SSRF guard).
- autentykacja: hash (argon2/bcrypt), sesja HTTP-only, prosty middleware w FastAPI, trzymaniu kluczy OpenRouter tylko po stronie BE i rate limiting/throttling
- minimalny monitoring czasów odpowiedzi i błędów w logach BE
- całość zbudowana w docker compose

AI - Komunikacja z modelami przez usługę Openrouter.ai:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

CI/CD i Hosting:
- Github Actions do tworzenia pipeline’ów CI/CD. 
    - pipeline MVP (na localhost): unit testy, build obrazów
    - Pipeline docelowy: unit testy, build obrazów, rejestr GHCR, deploy na serwerze (ssh action), migracje DB, smoke tests
- MVP lokalnie z użyciem docker compose
- DigitalOcean jako docelowe rozwiązanie produkcyjne: Compose na VPS, bez zmian architektonicznych.