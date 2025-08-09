# Schema bazy danych PostgreSQL - 10xCards MVP

## 1. Lista tabel z kolumnami, typami danych i ograniczeniami

### PostgreSQL Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### ENUM Types
```sql
CREATE TYPE card_status AS ENUM ('active', 'archived');
CREATE TYPE proficiency_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');
```

### users
Główna tabela użytkowników zgodna ze strukturą Supabase.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator użytkownika |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Adres email użytkownika |
| encrypted_password | VARCHAR | NOT NULL | Zahashowane hasło |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data utworzenia konta |
| confirmed_at | TIMESTAMPTZ | NULL | Data potwierdzenia konta |

### user_settings
Ustawienia użytkownika, w tym poziom biegłości językowej.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE, UNIQUE | Identyfikator użytkownika |
| proficiency_level | proficiency_level | NOT NULL, DEFAULT 'A2' | Poziom znajomości języka |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data ostatniej modyfikacji |

### import_sessions
Sesje importu artykułów z metadanymi źródła i statystykami.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator sesji |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Identyfikator użytkownika |
| source_url | TEXT | NULL | URL źródłowego artykułu |
| source_content | TEXT | NULL | Pobrana treść artykułu |
| total_generated | INTEGER | DEFAULT 0 | Liczba wygenerowanych propozycji |
| total_accepted | INTEGER | DEFAULT 0 | Liczba zaakceptowanych fiszek |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data utworzenia sesji |
| expires_at | TIMESTAMPTZ | NOT NULL, DEFAULT (now() + INTERVAL '1 month') | Data wygaśnięcia |

### cards
Zaakceptowane fiszki edukacyjne z pełnymi metadanymi.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator fiszki |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Identyfikator użytkownika |
| import_session_id | UUID | REFERENCES import_sessions(id) ON DELETE SET NULL | Identyfikator sesji importu |
| front | TEXT | NOT NULL | Przód fiszki (pytanie/słowo) |
| back | TEXT | NOT NULL | Tył fiszki (odpowiedź) |
| context | TEXT | CHECK (length(context) <= 500) | Kontekst (max 500 znaków) |
| tags | JSONB | DEFAULT '{}' | Tagi wygenerowane przez AI |
| status | card_status | NOT NULL, DEFAULT 'active' | Status fiszki |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data ostatniej modyfikacji |
| deleted_at | TIMESTAMPTZ | NULL | Data usunięcia (soft delete) |

**Unique Constraint:** UNIQUE(user_id, front, back) - globalna deduplikacja

### proposed_cards
Tymczasowe propozycje fiszek wygenerowane przez AI z TTL 1 miesiąc.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator propozycji |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Identyfikator użytkownika |
| import_session_id | UUID | NOT NULL, REFERENCES import_sessions(id) ON DELETE CASCADE | Identyfikator sesji importu |
| front | TEXT | NOT NULL | Przód fiszki (pytanie/słowo) |
| back | TEXT | NOT NULL | Tył fiszki (odpowiedź) |
| context | TEXT | CHECK (length(context) <= 500) | Kontekst (max 500 znaków) |
| tags | JSONB | DEFAULT '{}' | Tagi wygenerowane przez AI |
| is_selected | BOOLEAN | NOT NULL, DEFAULT false | Czy propozycja jest zaznaczona |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data utworzenia |
| expires_at | TIMESTAMPTZ | NOT NULL, DEFAULT (now() + INTERVAL '1 month') | Data wygaśnięcia |

### leitner_boxes
System pudełek Leitnera dla algorytmu spaced repetition.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Identyfikator użytkownika |
| card_id | UUID | NOT NULL, REFERENCES cards(id) ON DELETE CASCADE | Identyfikator fiszki |
| box_level | INTEGER | NOT NULL, CHECK (box_level >= 1 AND box_level <= 5), DEFAULT 1 | Poziom pudełka (1-5) |
| next_review_date | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data następnej powtórki |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data utworzenia |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data ostatniej modyfikacji |

**Unique Constraint:** UNIQUE(user_id, card_id) - jedna fiszka na użytkownika

### reviews
Historia wszystkich powtórek z metrykami wydajności.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator |
| user_id | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Identyfikator użytkownika |
| card_id | UUID | NOT NULL, REFERENCES cards(id) ON DELETE CASCADE | Identyfikator fiszki |
| rating | review_rating | NOT NULL | Ocena trudności (again/hard/good/easy) |
| response_time_ms | INTEGER | NULL | Czas odpowiedzi w milisekundach |
| box_level_before | INTEGER | NOT NULL | Poziom pudełka przed oceną |
| box_level_after | INTEGER | NOT NULL | Poziom pudełka po ocenie |
| session_id | UUID | NULL | Identyfikator sesji nauki |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Data utworzenia |

## 2. Relacje między tabelami

### Relacje jeden-do-jeden (1:1)
- **users ↔ user_settings**: Każdy użytkownik ma dokładnie jedno ustawienie profilu
- **cards ↔ leitner_boxes**: Każda zaakceptowana fiszka ma dokładnie jedno pudełko Leitnera

### Relacje jeden-do-wielu (1:N)
- **users → import_sessions**: Użytkownik może mieć wiele sesji importu
- **users → cards**: Użytkownik może mieć wiele fiszek
- **users → proposed_cards**: Użytkownik może mieć wiele propozycji fiszek
- **users → leitner_boxes**: Użytkownik może mieć wiele pudełek Leitnera
- **users → reviews**: Użytkownik może mieć wiele powtórek
- **import_sessions → proposed_cards**: Sesja importu może generować wiele propozycji
- **cards → reviews**: Fiszka może mieć wiele powtórek

### Relacje opcjonalne
- **import_sessions ↔ cards**: Fiszka może, ale nie musi być powiązana z sesją importu (ON DELETE SET NULL)

## 3. Indeksy

### Indeksy wydajnościowe
```sql
-- Podstawowe indeksy dla filtrowania użytkowników
CREATE INDEX idx_cards_user_id ON cards(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_proposed_cards_import_session ON proposed_cards(import_session_id);
CREATE INDEX idx_proposed_cards_expires ON proposed_cards(expires_at);

-- Indeks composite dla zapytań o powtórki (kluczowy dla algorytmu Leitnera)
CREATE INDEX idx_leitner_boxes_next_review ON leitner_boxes(user_id, next_review_date, box_level);

-- Indeksy dla historii powtórek
CREATE INDEX idx_reviews_card_created ON reviews(card_id, created_at DESC);
CREATE INDEX idx_reviews_user_session ON reviews(user_id, session_id) WHERE session_id IS NOT NULL;

-- Indeksy GIN dla przeszukiwania JSONB tagów
CREATE INDEX idx_tags_gin ON cards USING GIN (tags);
CREATE INDEX idx_proposed_tags_gin ON proposed_cards USING GIN (tags);

-- Indeks trigram dla podobieństwa tekstów (deduplikacja)
CREATE INDEX idx_cards_front_back_trgm ON cards USING GIN ((front || ' ' || back) gin_trgm_ops);
```

## 4. Triggery PostgreSQL

### Automatyczne aktualizowanie timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON cards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leitner_boxes_updated_at 
    BEFORE UPDATE ON leitner_boxes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Sprawdzanie podobieństwa fiszek (deduplikacja)
```sql
CREATE OR REPLACE FUNCTION check_card_similarity()
RETURNS TRIGGER AS $$
BEGIN
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
```

### Automatyczne czyszczenie wygasłych propozycji
```sql
CREATE OR REPLACE FUNCTION cleanup_expired_proposals()
RETURNS void AS $$
BEGIN
    DELETE FROM proposed_cards WHERE expires_at < now();
    DELETE FROM import_sessions 
    WHERE expires_at < now() 
    AND id NOT IN (
        SELECT DISTINCT import_session_id 
        FROM cards 
        WHERE import_session_id IS NOT NULL
    );
END;
$$ language 'plpgsql';
```

## 5. Row Level Security (RLS)

### Włączenie RLS dla wszystkich tabel
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposed_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leitner_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
```

### Polityki dostępu oparte na user_id
```sql
-- Polityki dla każdej tabeli ograniczające dostęp do własnych danych
CREATE POLICY "Users can only access own cards" 
    ON cards FOR ALL 
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can only access own settings" 
    ON user_settings FOR ALL 
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can only access own sessions" 
    ON import_sessions FOR ALL 
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can only access own proposals" 
    ON proposed_cards FOR ALL 
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can only access own boxes" 
    ON leitner_boxes FOR ALL 
    USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can only access own reviews" 
    ON reviews FOR ALL 
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

## 6. Dodatkowe uwagi i wyjaśnienia decyzji projektowych

### Architektura danych
- **Separacja fiszek aktywnych od propozycji**: Optymalizacja wydajności przez oddzielenie tabel `cards` i `proposed_cards`
- **TTL dla propozycji**: Automatyczne czyszczenie po miesiącu zapobiega nadmiernemu wzrostowi bazy danych
- **Soft delete**: Zachowanie `deleted_at` w tabeli `cards` dla integralności statystyk historycznych

### Wydajność
- **Composite index dla Leitnera**: Indeks `(user_id, next_review_date, box_level)` optymalizuje kluczowe zapytania algorytmu
- **JSONB dla tagów**: Elastyczne przechowywanie metadanych AI z indeksami GIN dla szybkiego wyszukiwania
- **Trigram similarity**: Zaawansowana deduplikacja wykorzystująca podobieństwo tekstów

### Bezpieczeństwo
- **UUID jako klucze główne**: Zwiększenie bezpieczeństwa przez nieprzewidywalne identyfikatory
- **RLS przygotowanie**: Row Level Security gotowe na przyszłe multi-tenancy
- **Hashowane hasła**: Zgodność ze standardami Supabase

### Skalowalność
- **Optymalizacja dla 100K fiszek**: Struktura zaprojektowana dla wymaganej skali MVP
- **Indeksy wydajnościowe**: Wszystkie częste zapytania pokryte odpowiednimi indeksami
- **Connection pooling ready**: Struktura gotowa na środowisko Docker z poolingiem połączeń

### Integralność danych
- **Foreign keys z CASCADE**: Zachowanie spójności przy usuwaniu rekordów
- **CHECK constraints**: Walidacja na poziomie bazy danych (długość kontekstu, poziomy Leitnera)
- **Unique constraints**: Zapobieganie duplikacji na poziomie użytkownika

### AI Integration
- **JSONB tags**: Elastyczne przechowywanie metadanych generowanych przez AI (część mowy, czas, tryb, domena)
- **Deduplikacja AI-aware**: Algorytm podobieństwa uwzględniający kontekst językowy
- **Session tracking**: Pełne śledzenie procesu generowania i akceptacji fiszek
