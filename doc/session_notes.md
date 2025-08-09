# Podsumowanie planowania bazy danych - 10xCards MVP

## Decyzje podjęte podczas planowania

1. **Struktura tabel dla fiszek**: Zaprojektowanie dwóch osobnych tabel - `cards` (zaakceptowane fiszki) oraz `proposed_cards` (propozycje od AI)
2. **System pudełek Leitnera**: Wykorzystanie INTEGER z ograniczeniami CHECK (1-5) dla optymalnej wydajności algorytmu
3. **Sesje importu**: Implementacja osobnej tabeli `import_sessions` z metadanymi źródła i statystykami
4. **Przechowywanie tagów**: Wykorzystanie formatu JSON dla tagów AI (część mowy, czas, tryb, domena)
5. **Struktura użytkowników**: Zastosowanie dokładnej struktury Supabase dla tabeli `users`
6. **TTL propozycji**: Przechowywanie propozycji fiszek przez jeden miesiąc z automatycznym czyszczeniem
7. **Historia powtórek**: Przechowywanie pełnej historii wszystkich ocen w tabeli `reviews`
8. **Ustawienia użytkownika**: Osobna tabela `user_settings` dla poziomu biegłości i preferencji per użytkownik
9. **Deduplikacja**: Implementacja triggera sprawdzającego podobieństwo fiszek przy użyciu pg_trgm
10. **Auditing**: Wybór tylko istotnych mechanizmów audytowania z perspektywy użytkownika i sesji powtórkowych

## Kluczowe zalecenia dopasowane do rozmowy

1. **ENUM dla statusów**: Zastosowanie ENUM dla statusów fiszek zamiast boolean flags dla lepszej czytelności
2. **UUID jako PRIMARY KEY**: Wykorzystanie UUID dla tabel `cards` i `import_sessions` dla bezpieczeństwa
3. **PostgreSQL JSONB**: Implementacja JSONB dla tagów z indeksami GIN dla wydajnego wyszukiwania
4. **Row Level Security (RLS)**: Przygotowanie systemu na przyszłe multi-tenancy mimo single-user MVP
5. **CHECK constraints**: Walidacja długości kontekstu (≤500 znaków) i poziomów Leitnera (1-5)
6. **Composite index**: Optymalizacja zapytań o powtórki przez indeks na (next_review_date, box_level)
7. **UNIQUE constraint**: Globalna deduplikacja przez ograniczenie na (user_id, front, back)
8. **TIMESTAMP WITH TIME ZONE**: Unikanie problemów ze strefami czasowymi
9. **Database triggers**: Automatyczne updateowanie timestamps zamiast polegania na aplikacji
10. **Foreign keys z CASCADE**: Zachowanie integralności referencjalnej

## Szczegółowe podsumowanie planowania bazy danych

### Główne wymagania dotyczące schematu

Schemat bazy danych został zaprojektowany dla aplikacji MVP 10xCards - systemu do generowania i nauki fiszek edukacyjnych z wykorzystaniem AI. Kluczowe wymagania obejmują:

- **Wydajność**: Operacje CRUD poniżej 400ms
- **Skalowalność**: Obsługa do 100,000 fiszek
- **Single-user w MVP**: Jeden użytkownik systemu z przygotowaniem na multi-tenancy
- **Algorytm Leitnera**: Prosty system powtórek rozłożonych w czasie
- **AI Integration**: Obsługa propozycji fiszek generowanych przez AI

### Kluczowe encje i ich relacje

1. **Users**: Struktura zgodna z Supabase (id, email, encrypted_password, timestamps)
2. **User Settings**: Poziom biegłości (A1-C2) i preferencje użytkownika
3. **Import Sessions**: Metadane sesji importu z URL źródła i statystykami
4. **Cards**: Zaakceptowane fiszki (front, back, context, tags JSONB)
5. **Proposed Cards**: Tymczasowe propozycje AI z TTL 1 miesiąc
6. **Leitner Boxes**: System pudełek dla algorytmu powtórek (box_level 1-5)
7. **Reviews**: Pełna historia ocen z metrykami wydajności

**Relacje**:
- Users 1:1 User Settings
- Users 1:N Import Sessions
- Import Sessions 1:N Proposed Cards
- Users 1:N Cards
- Cards 1:1 Leitner Boxes
- Cards 1:N Reviews

### Kwestie bezpieczeństwa i skalowalności

**Bezpieczeństwo**:
- Row Level Security (RLS) na wszystkich tabelach
- Polityki dostępu oparte na user_id
- Hashowane hasła zgodnie z wymaganiami Supabase
- UUID jako klucze główne dla lepszego bezpieczeństwa

**Skalowalność**:
- Indeksy zoptymalizowane dla najczęstszych zapytań
- Composite index dla zapytań o powtórki
- GIN indeksy dla przeszukiwania JSONB tagów
- Trigram indeksy dla podobieństwa tekstów
- Automatyczne czyszczenie wygasłych propozycji

**Wydajność**:
- Rozdzielenie aktywnych fiszek od propozycji
- Optymalizacja algorytmu Leitnera przez INTEGER box_level
- Soft delete dla zachowania integralności statystyk
- Connection pooling dla środowiska Docker

### Funkcjonalności specjalne

- **Deduplikacja**: Trigger sprawdzający podobieństwo przy użyciu pg_trgm
- **TTL Management**: Automatyczne czyszczenie po miesiącu
- **Audit Trail**: Timestamps z automatycznymi triggerami
- **Full Text Search**: Przygotowanie pod wyszukiwanie w treści fiszek
- **JSON Support**: Elastyczne przechowywanie tagów AI

## Nierozwiązane kwestie

**Brak nierozwiązanych kwestii** - wszystkie kluczowe decyzje zostały podjęte podczas planowania. Schema jest gotowy do implementacji z uwzględnieniem:

- Wszystkich wymagań funkcjonalnych z PRD
- Ograniczeń wydajnościowych (100K fiszek, <400ms CRUD)
- Przygotowania na przyszłą rozbudowę
- Zgodności ze stackiem technologicznym (PostgreSQL, FastAPI, Docker)

Schemat można bezpośrednio wykorzystać do implementacji MVP z możliwością ewolucyjnej rozbudowy w kolejnych fazach projektu.

## Draft schematu bazy danych

``` sql

-- Rozszerzenia PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Typy ENUM
CREATE TYPE card_status AS ENUM ('active', 'archived');
CREATE TYPE proficiency_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');

-- Tabela użytkowników (struktura Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  encrypted_password VARCHAR NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

-- Ustawienia użytkownika
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proficiency_level proficiency_level NOT NULL DEFAULT 'A2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Sesje importu
CREATE TABLE import_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_url TEXT,
  source_content TEXT,
  total_generated INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 month')
);

-- Zaakceptowane fiszki
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  import_session_id UUID REFERENCES import_sessions(id) ON DELETE SET NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  context TEXT CHECK (length(context) <= 500),
  tags JSONB DEFAULT '{}',
  status card_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT unique_card_per_user UNIQUE(user_id, front, back)
);

-- Propozycje fiszek (TTL 1 miesiąc)
CREATE TABLE proposed_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  import_session_id UUID NOT NULL REFERENCES import_sessions(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  context TEXT CHECK (length(context) <= 500),
  tags JSONB DEFAULT '{}',
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 month')
);

-- System pudełek Leitnera (optymalny dla wydajności)
CREATE TABLE leitner_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  box_level INTEGER NOT NULL CHECK (box_level >= 1 AND box_level <= 5) DEFAULT 1,
  next_review_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id)
);

-- Historia wszystkich powtórek
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating review_rating NOT NULL,
  response_time_ms INTEGER,
  box_level_before INTEGER NOT NULL,
  box_level_after INTEGER NOT NULL,
  session_id UUID, -- opcjonalny identyfikator sesji nauki
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeksy dla wydajności
CREATE INDEX idx_cards_user_id ON cards(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cards_front_back_trgm ON cards USING GIN ((front || ' ' || back) gin_trgm_ops);
CREATE INDEX idx_proposed_cards_import_session ON proposed_cards(import_session_id);
CREATE INDEX idx_proposed_cards_expires ON proposed_cards(expires_at);
CREATE INDEX idx_leitner_boxes_next_review ON leitner_boxes(user_id, next_review_date, box_level);
CREATE INDEX idx_reviews_card_created ON reviews(card_id, created_at DESC);
CREATE INDEX idx_reviews_user_session ON reviews(user_id, session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_tags_gin ON cards USING GIN (tags);
CREATE INDEX idx_proposed_tags_gin ON proposed_cards USING GIN (tags);

-- Trigger do automatycznego updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leitner_boxes_updated_at BEFORE UPDATE ON leitner_boxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger do sprawdzania podobieństwa fiszek przed wstawieniem
CREATE OR REPLACE FUNCTION check_card_similarity()
RETURNS TRIGGER AS $$
BEGIN
    -- Sprawdź czy istnieje podobna fiszka (similarity > 0.8)
    IF EXISTS (
        SELECT 1 FROM cards 
        WHERE user_id = NEW.user_id 
        AND deleted_at IS NULL
        AND similarity(front, NEW.front) > 0.8
        AND similarity(back, NEW.back) > 0.8
    ) THEN
        RAISE EXCEPTION 'Podobna fiszka już istnieje dla tego użytkownika';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_card_similarity_trigger 
    BEFORE INSERT ON cards 
    FOR EACH ROW 
    EXECUTE FUNCTION check_card_similarity();

-- Automatyczne czyszczenie wygasłych propozycji
CREATE OR REPLACE FUNCTION cleanup_expired_proposals()
RETURNS void AS $$
BEGIN
    DELETE FROM proposed_cards WHERE expires_at < now();
    DELETE FROM import_sessions WHERE expires_at < now() AND id NOT IN (SELECT DISTINCT import_session_id FROM cards WHERE import_session_id IS NOT NULL);
END;
$$ language 'plpgsql';

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposed_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leitner_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Polityki RLS (przykładowe - wymagają kontekstu autoryzacji)
CREATE POLICY "Users can only see own data" ON cards FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY "Users can only see own settings" ON user_settings FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY "Users can only see own sessions" ON import_sessions FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY "Users can only see own proposals" ON proposed_cards FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY "Users can only see own boxes" ON leitner_boxes FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
CREATE POLICY "Users can only see own reviews" ON reviews FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

```