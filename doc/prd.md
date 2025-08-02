# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu

### 1.1 Nazwa produktu
10xCards - Aplikacja do generowania i nauki fiszek edukacyjnych z wykorzystaniem AI

### 1.2 Opis produktu
10xCards to aplikacja webowa umożliwiająca automatyczne generowanie wysokiej jakości fiszek edukacyjnych na podstawie artykułów internetowych z wykorzystaniem sztucznej inteligencji. Aplikacja wspiera studentów języka hiszpańskiego w efektywnej nauce poprzez metodę spaced repetition.

### 1.3 Docelowa grupa użytkowników
Główną grupą docelową są studenci uczący się języka hiszpańskiego na różnych poziomach zaawansowania. Aplikacja została zaprojektowana z myślą o rozszerzeniu wsparcia dla innych języków w przyszłości.

### 1.4 Cel produktu
Rozwiązanie problemu czasochłonnego manualnego tworzenia fiszek edukacyjnych poprzez automatyzację procesu generowania przy zachowaniu wysokiej jakości treści dostosowanych do poziomu użytkownika.

## 2. Problem użytkownika

### 2.1 Główny problem
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest procesem niezwykle czasochłonnym, co stanowi znaczącą barierę w wykorzystaniu spaced repetition - jednej z najefektywniejszych metod nauki. Studenci często rezygnują z tworzenia fiszek lub tworzą fiszki niskiej jakości ze względu na wymagany nakład czasu.

### 2.2 Szczegółowe wyzwania
- Identyfikacja odpowiednich słów i zwrotów do nauki na danym poziomie
- Tworzenie kontekstu dla lepszego zapamiętywania
- Unikanie duplikatów w zbiorze fiszek
- Kategoryzacja i tagowanie materiału edukacyjnego
- Integracja z systemem powtórek rozłożonych w czasie

### 2.3 Konsekwencje problemu
- Niższa motywacja do systematycznej nauki
- Mniejsza efektywność procesu edukacyjnego
- Rezygnacja z wykorzystania metody spaced repetition
- Strata czasu na nieefektywne metody nauki

## 3. Wymagania funkcjonalne

### 3.1 Parser treści
- Pobieranie treści z artykułów internetowych na podstawie URL
- Implementacja heurystyki "najdłuższy blok tekstu" z fallbackiem do elementu `<article>`
- Obsługa stron z paywall poprzez informowanie użytkownika o ograniczonym dostępie
- Przetwarzanie tekstu w języku hiszpańskim

### 3.2 Moduł generowania fiszek przez AI
- Filtrowanie słów i zwrotów według poziomu biegłości użytkownika
- Globalna deduplikacja w całej bazie danych użytkownika
- Generowanie struktury fiszki: przód zawierający tagi, słowo lub zdanie oraz kontekst, tył (odpowiedź)
- Automatyczne skracanie kontekstu do miękkiego limitu 500 znaków na stronę
- Automatyczne generowanie tagów (część mowy, czas, tryb, domena)

### 3.3 Zarządzanie fiszkami
- Ręczne tworzenie, edycja i usuwanie fiszek
- Grupowanie fiszek według sesji importu
- Masowa akceptacja/odrzucenie proponowanych fiszek
- Przeglądanie fiszek z możliwością filtrowania i wyszukiwania

### 3.4 System powtórek
- Implementacja prostego algorytmu Leitnera
- Osobna tabela statystyk powtórek w bazie danych
- Planowanie sesji powtórek na podstawie wyników poprzednich sesji
- Śledzenie postępów w nauce

### 3.5 System uwierzytelniania
- Prosty system autoryzacji oparty na jednym haśle
- Hashowanie hasła w bazie danych
- Lokalny dostęp bez wymagań RODO
- Brak funkcjonalności rejestracji nowych użytkowników

### 3.6 Architektura techniczna
- Frontend: React
- Backend: FastAPI 
- Baza danych: PostgreSQL
- Konteneryzacja: Docker Compose
- Analiza językowa: spaCy (es_core_news_sm), LLM. Podział zadań: tagowanie POS spaCy, generacja kart i deduplikacja semantyczna LLM.

## 4. Granice produktu

### 4.1 Co nie wchodzi w zakres MVP
- Własny, zaawansowany algorytm powtórek (jak SuperMemo, Anki)
- Import wielu formatów plików (PDF, DOCX, itp.)
- Współdzielenie zestawów fiszek między użytkownikami
- Integracje z innymi platformami edukacyjnymi
- Aplikacje mobilne (tylko wersja webowa)
- Export fiszek do innych formatów
- Reset całej bazy danych
- Wersjonowanie zmian w fiszek
- Obsługa wielu użytkowników jednocześnie

### 4.2 Ograniczenia wydajnościowe
- Maksymalnie 100,000 fiszek w bazie danych
- Jeden użytkownik systemu
- CRUD <400 ms, operacje AI/parsing asynchronicznie z timeout 10s
- Lokalne uruchomienie w środowisku Docker

### 4.3 Ograniczenia funkcjonalne
- Obsługa wyłącznie języka hiszpańskiego w MVP
- Brak szyfrowania danych (lokalne przechowywanie)
- Brak zaawansowanych statystyk nauki
- Brak synchronizacji między urządzeniami

## 5. Historyjki użytkowników

### US-001: Logowanie do aplikacji
**Tytuł:** Autoryzacja dostępu do aplikacji  
**Opis:** Jako użytkownik chcę zalogować się do aplikacji używając hasła, aby uzyskać dostęp do moich fiszek.  
**Kryteria akceptacji:**
- System wyświetla formularz logowania z polem hasła
- Po wpisaniu poprawnego hasła użytkownik zostaje przekierowany do głównego panelu
- Niepoprawne hasło powoduje wyświetlenie komunikatu o błędzie
- Sesja użytkownika jest utrzymywana przez określony czas
- Hasło jest bezpiecznie hashowane w bazie danych

### US-002: Import artykułu z URL
**Tytuł:** Pobieranie treści artykułu do generowania fiszek  
**Opis:** Jako student chcę wkleić URL artykułu hiszpańskiego, aby system pobrał jego treść i przygotował propozycje fiszek.  
**Kryteria akceptacji:**
- System akceptuje poprawne URL artykułów
- Parser wybiera najdłuższy blok tekstu z artykułu
- System informuje o problemach z dostępem do treści (paywall, błędy)
- Pobrana treść jest przekazywana do modułu AI
- Użytkownik widzi potwierdzenie pomyślnego pobrania treści

### US-003: Generowanie fiszek przez AI
**Tytuł:** Automatyczne tworzenie propozycji fiszek  
**Opis:** Jako student chcę, aby AI automatycznie wygenerowało fiszki na podstawie pobranego tekstu, dostosowane do mojego poziomu hiszpańskiego.  
**Kryteria akceptacji:**
- AI filtruje słownictwo według poziomu biegłości użytkownika
- System pomija słowa już obecne w bazie danych użytkownika
- Każda fiszka zawiera: przód (słowo/pytanie), tył (odpowiedź), kontekst
- Kontekst jest skrócony do maksymalnie 500 znaków
- AI automatycznie generuje tagi (część mowy, czas, tryb, domena)
- Lista proponowanych fiszek jest pogrupowana według sesji importu

### US-004: Przeglądanie propozycji fiszek
**Tytuł:** Przegląd wygenerowanych przez AI propozycji fiszek  
**Opis:** Jako student chcę przejrzeć listę fiszek zaproponowanych przez AI przed ich zaakceptowaniem.  
**Kryteria akceptacji:**
- Fiszki są wyświetlane w czytelnej liście z podziałem na sesje
- Każda fiszka pokazuje przód, tył, kontekst i tagi
- Użytkownik może rozwinąć/zwinąć kontekst dla każdej fiszki
- System wyświetla informację o liczbie proponowanych fiszek w sesji
- Interface umożliwia łatwe przewijanie przez długie listy

### US-005: Selekcja fiszek do akceptacji
**Tytuł:** Wybór fiszek do dodania do bazy  
**Opis:** Jako student chcę wybrać które z zaproponowanych fiszek chcę dodać do mojej kolekcji.  
**Kryteria akceptacji:**
- Użytkownik może zaznaczyć/odznaczyć poszczególne fiszki
- Dostępna jest opcja "zaznacz wszystkie" i "odznacz wszystkie"
- System pokazuje liczbę zaznaczonych fiszek
- Możliwość filtrowania fiszek według tagów przed selekcją
- Zaznaczone fiszki są wizualnie wyróżnione

### US-006: Masowa akceptacja fiszek
**Tytuł:** Hurtowe zatwierdzanie wybranych fiszek  
**Opis:** Jako student chcę zaakceptować wszystkie wybrane fiszki jednym kliknięciem, aby szybko dodać je do mojej kolekcji.  
**Kryteria akceptacji:**
- Przycisk "Akceptuj wybrane" jest aktywny tylko gdy zaznaczono fiszki
- System potwierdza liczbę fiszek do dodania przed wykonaniem akcji
- Zaakceptowane fiszki są dodawane do głównej bazy użytkownika
- System wyświetla potwierdzenie pomyślnego dodania fiszek
- Zaakceptowane fiszki znikają z listy propozycji

### US-007: Masowe odrzucenie fiszek
**Tytuł:** Hurtowe odrzucanie niepożądanych fiszek  
**Opis:** Jako student chcę odrzucić wszystkie niechciane fiszki jednym kliknięciem.  
**Kryteria akceptacji:**
- Przycisk "Odrzuć wybrane" jest aktywny tylko gdy zaznaczono fiszki
- System prosi o potwierdzenie przed usunięciem propozycji
- Odrzucone fiszki są trwale usuwane z listy propozycji
- System wyświetla informację o liczbie odrzuconych fiszek
- Akcja nie wpływa na już zaakceptowane fiszki w bazie

### US-008: Ręczne tworzenie fiszki
**Tytuł:** Dodawanie fiszki bez wykorzystania AI  
**Opis:** Jako student chcę ręcznie utworzyć fiszkę, aby dodać specyficzne słownictwo lub pojęcia.  
**Kryteria akceptacji:**
- Formularz zawiera pola: przód, tył, kontekst (opcjonalny)
- Możliwość dodania tagów ręcznie lub wyboru z listy
- Walidacja wymaganych pól przed zapisem
- System sprawdza czy fiszka już nie istnieje w bazie
- Nowa fiszka jest automatycznie dodawana do systemu powtórek

### US-009: Edycja istniejącej fiszki
**Tytuł:** Modyfikacja zawartości fiszki  
**Opis:** Jako student chcę edytować istniejącą fiszkę, aby poprawić jej treść lub dodać informacje.  
**Kryteria akceptacji:**
- Wszystkie pola fiszki można edytować (przód, tył, kontekst, tagi)
- Zmiany są zapisywane po potwierdzeniu
- System zachowuje historię statystyk powtórek po edycji
- Walidacja poprawności danych przed zapisem
- Opcja anulowania zmian bez zapisywania

### US-010: Usuwanie fiszki
**Tytuł:** Trwałe usunięcie fiszki z kolekcji  
**Opis:** Jako student chcę usunąć fiszkę z mojej kolekcji, gdy nie jest już potrzebna.  
**Kryteria akceptacji:**
- System prosi o potwierdzenie przed usunięciem
- Usunięcie fiszki usuwa także powiązane statystyki powtórek
- Akcja jest nieodwracalna
- System wyświetla potwierdzenie usunięcia
- Fiszka znika z wszystkich widoków i sesji powtórek

### US-011: Przeglądanie kolekcji fiszek
**Tytuł:** Przegląd wszystkich posiadanych fiszek  
**Opis:** Jako student chcę przeglądać wszystkie moje fiszki, aby zarządzać swoją kolekcją.  
**Kryteria akceptacji:**
- Lista wyświetla wszystkie fiszki z podstawowymi informacjami
- Możliwość sortowania według różnych kryteriów (data, tagi, wyniki)
- Funkcja wyszukiwania w treści fiszek
- Filtrowanie według tagów i kategorii
- Paginacja dla dużej liczby fiszek

### US-012: Rozpoczęcie sesji powtórek
**Tytuł:** Uruchamianie nauki zaplanowanych fiszek  
**Opis:** Jako student chcę rozpocząć sesję powtórek, aby uczyć się zaplanowanych na dziś fiszek.  
**Kryteria akceptacji:**
- System wyświetla liczbę fiszek zaplanowanych do powtórki
- Użytkownik może rozpocząć sesję lub odłożyć na później
- Fiszki są prezentowane zgodnie z algorytmem Leitnera
- System pokazuje postęp sesji (np. 5/20 fiszek)
- Możliwość pauzowania i wznowienia sesji

### US-013: Ocena fiszki podczas powtórki
**Tytuł:** Oznaczanie trudności fiszki w sesji  
**Opis:** Jako student chcę ocenić jak trudna była dla mnie fiszka, aby system odpowiednio zaplanował następną powtórkę.  
**Kryteria akceptacji:**
- Dostępne opcje oceny zgodne z algorytmem Leitnera
- Każda ocena wpływa na następny termin powtórki fiszki
- System natychmiast przechodzi do następnej fiszki po ocenie
- Opcja cofnięcia ostatniej oceny w ramach sesji
- Wyświetlanie poprawnej odpowiedzi przed oceną

### US-014: Zakończenie sesji powtórek
**Tytuł:** Podsumowanie ukończonej sesji nauki  
**Opis:** Jako student chcę zobaczyć podsumowanie mojej sesji powtórek po jej zakończeniu.  
**Kryteria akceptacji:**
- System wyświetla statystyki sesji (liczba fiszek, wyniki)
- Informacja o następnej planowanej sesji
- Opcja rozpoczęcia dodatkowej sesji powtórek
- Zapisanie wyników sesji w statystykach użytkownika
- Możliwość powrotu do głównego menu

### US-015: Wyświetlanie statystyk nauki
**Tytuł:** Przegląd postępów w nauce  
**Opis:** Jako student chcę zobaczyć moje statystyki nauki, aby śledzić postępy.  
**Kryteria akceptacji:**
- Wyświetlanie podstawowych metryk (fiszki nauczone, w trakcie, nowe)
- Informacja o planowanych sesjach na najbliższe dni
- Historia ostatnich sesji powtórek
- Prosty wykres postępów w czasie
- Czas spędzony na nauce

### US-016: Konfiguracja poziomu biegłości
**Tytuł:** Ustawienie poziomu znajomości języka  
**Opis:** Jako student chcę ustawić swój poziom hiszpańskiego, aby AI generowało odpowiednie fiszki.  
**Kryteria akceptacji:**
- Dostępne standardowe poziomy (A1, A2, B1, B2, C1, C2)
- Możliwość zmiany poziomu w dowolnym momencie
- Nowy poziom wpływa na przyszłe generowanie fiszek
- System informuje o wpływie zmiany poziomu
- Ustawienie jest zapamiętywane między sesjami

### US-017: Obsługa błędów parsera
**Tytuł:** Informowanie o problemach z pobieraniem treści  
**Opis:** Jako student chcę otrzymać jasną informację gdy system nie może pobrać treści z podanego URL.  
**Kryteria akceptacji:**
- Rozpoznawanie różnych typów błędów (paywall, 404, timeout)
- Wyświetlanie odpowiednich komunikatów dla każdego typu błędu
- Sugestie rozwiązania problemu gdzie to możliwe
- Opcja ponowienia próby pobrania
- Logowanie błędów dla celów diagnostycznych

### US-018: Wylogowanie z aplikacji
**Tytuł:** Bezpieczne zakończenie sesji  
**Opis:** Jako użytkownik chcę wylogować się z aplikacji, aby zabezpieczyć dostęp do moich danych.  
**Kryteria akceptacji:**
- Przycisk wylogowania dostępny z głównego menu
- System usuwa informacje o sesji użytkownika
- Przekierowanie do strony logowania
- Potwierdzenie pomyślnego wylogowania
- Wszystkie dane sesji są wyczyszczone

## 6. Metryki sukcesu

### 6.1 Kluczowe wskaźniki wydajności (KPI)

#### 6.1.1 Akceptacja AI
- 75% lub więcej fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika w każdej sesji importu
- Pomiar: stosunek zaakceptowanych fiszek do wszystkich zaproponowanych przez AI

#### 6.1.2 Wykorzystanie AI
- 75% lub więcej nowych fiszek w systemie jest tworzonych z wykorzystaniem AI (vs. ręczne tworzenie)
- Pomiar: stosunek fiszek utworzonych przez AI do wszystkich nowych fiszek

#### 6.1.3 Wydajność techniczna
- Średni czas odpowiedzi backendu poniżej 400ms
- System obsługuje do 100,000 fiszek bez degradacji wydajności
- Pomiar: monitoring czasów odpowiedzi API i wydajności bazy danych

### 6.2 Kryteria jakości

#### 6.2.1 Pokrycie testami
- Minimum 50% pokrycia kodu testami automatycznymi
- Testy jednostkowe (PyTest dla backendu, Jest dla frontendu)
- Testy integracyjne dla kluczowych przepływów

#### 6.2.2 Stabilność
- Brak krytycznych błędów w funkcjonalnościach MVP
- Maksymalnie 5% błędów w generowaniu fiszek przez AI
- System działa stabilnie przez minimum 24 godziny bez restartów

### 6.3 Metryki użytkowania

#### 6.3.1 Efektywność sesji importu
- Średni czas sesji importu (od wklejenia URL do zaakceptowania fiszek): poniżej 5 minut
- Średnia liczba fiszek akceptowanych na sesję: minimum 10

#### 6.3.2 Zaangażowanie w powtórki
- Użytkownik wykonuje sesje powtórek minimum 5 dni w tygodniu
- Średnia sesja powtórek trwa 10-15 minut
- 80% lub więcej zaplanowanych fiszek jest przerobione w terminie

### 6.4 Kryteria wydania

#### 6.4.1 Funkcjonalność
- Wszystkie historie użytkownika (US-001 do US-018) są zaimplementowane i przetestowane
- Parser poprawnie pobiera treść z minimum 80% testowanych stron hiszpańskich
- AI generuje fiszki wysokiej jakości dla poziomów A2-B2

#### 6.4.2 Stabilność i wydajność
- Aplikacja uruchamia się poprawnie w środowisku Docker Compose
- Brak krytycznych błędów wykrytych w testach manualnych
- System obsługuje typowe scenariusze użycia bez błędów

#### 6.4.3 Harmonogram
- Planowane wydanie MVP: 4 tygodnie od rozpoczęcia implementacji
- Wszystkie kryteria wydania spełnione przed datą publikacji 