Jesteś doświadczonym menedżerem produktu, którego zadaniem jest stworzenie kompleksowego dokumentu wymagań produktu (PRD) w oparciu o poniższe opisy:

<project_description>

### Główny problem
Manualne tworzenie wysokiej jakości fiszek edukacyjnych jest czasochłonne, co zniechęca do korzystania z efektywnej metody nauki jaką jest spaced repetition.

### Najmniejszy zestaw funkcjonalności
- Generowanie fiszek przez AI na podstawie wprowadzonego tekstu (kopiuj-wklej)
- Manualne tworzenie fiszek
- Przeglądanie, edycja i usuwanie fiszek
- Prosty system kont użytkowników do przechowywania fiszek
- Integracja fiszek z gotowym algorytmem powtórek

### Co NIE wchodzi w zakres MVP
- Własny, zaawansowany algorytm powtórek (jak SuperMemo, Anki)
- Import wielu formatów (PDF, DOCX, itp.)
- Współdzielenie zestawów fiszek między użytkownikami
- Integracje z innymi platformami edukacyjnymi
- Aplikacje mobilne (na początek tylko web)

### Kryteria sukcesu
- 75% fiszek wygenerowanych przez AI jest akceptowane przez użytkownika
- Użytkownicy tworzą 75% fiszek z wykorzystaniem AI

</project_description>

<project_details>

<conversation_summary>

<decisions>
1. Źródłem danych jest link do artykułu; parser wybiera **najdłuższy blok tekstu** (element &lt;article&gt; lub heurystyka „najdłuższy ciągły tekst”).  
2. Docelowa grupa – **studenci uczący się języka hiszpańskiego**; aplikacja ma wspierać inne języki w przyszłości.  
3. AI generuje fiszki tylko dla **słów/zwrotów ≥ poziom biegłości użytkownika** oraz **bez duplikatów w całej bazie**.  
4. Fiszki są **grupowane według sesji importu**; interfejs umożliwia masową akceptację/odrzucenie lub selekcję.  
5. Struktura fiszki:  
   • przód = pytanie / słowo,  
   • tył  = poprawna odpowiedź,  
   • kontekst (zawsze widoczny) skracany, miękki limit **500 znaków na stronę**.  
6. AI nadaje tagi (część mowy, czas, tryb, domena) **bez ręcznej edycji**.  
7. Baza danych → dwie tabele: `flashcards` i `review_stats` (algorytm powtórek).  
8. Algorytm powtórek: **prosty wariant Leitnera** z parametrami wystarczającymi do działania.  
9. Dostęp do aplikacji zabezpiecza **jedno hasło** (hash w bazie); brak RODO/-szyfrowania, dane lokalne.  
10. Brak eksportu, resetu bazy i wersjonowania w MVP.  
11. Założenia wydajnościowe: **1 użytkownik, ≤ 100 k fiszek, avg response &lt; 400 ms**.  
12. Release po ~ 1 miesiącu; kryteria: brak krytycznych błędów, ≥ 50 % pokrycia testami, prosty UI.  
13. Przy stronach pay-wall: aplikacja **informuje** o braku dostępu i pomija import.  
</decisions>

<matched_recommendations>
1. Zastosować heurystykę „najdłuższy blok tekstu” z fallbackiem do &lt;article&gt; dla ekstrakcji treści.  
2. Wykorzystać spaCy (`es_core_news_sm`) lub podobny model do automatycznego tagowania części mowy, czasów i trybów w języku hiszpańskim.  
3. Implementować deduplikację globalną na poziomie bazy oraz identyfikator sesji importu do śledzenia metryk.  
4. Utrzymywać osobne tabele dla fiszek i statystyk Leitnera, ułatwiając późniejszą wymianę algorytmu.  
5. Prezentować kontekst w UI w formie rozwijanego panelu/tooltipu, aby nie przekraczać miękkiego limitu 500 znaków.  
6. Zabezpieczyć aplikację prostym uwierzytelnianiem (hasło + hash) i uruchamiać całość lokalnie w Docker Compose.  
</matched_recommendations>

<prd_planning_summary>
Produkt ma pomagać studentom języka hiszpańskiego w szybkim tworzeniu i powtarzaniu fiszek opartych na treści artykułów WWW.  
Główne wymagania funkcjonalne:  
• Parser URL pobierający najdłuższy blok tekstu i przekazujący go do modułu AI.  
• Moduł AI: filtrowanie słów/zwrotów wg poziomu użytkownika, deduplikacja globalna, generowanie tagów i fiszek (front, back, kontekst).  
• Interfejs React: lista fiszek pogrupowanych wg sesji, z masowym akceptowaniem/odrzucaniem, widocznym kontekstem i tagami.  
• Backend FastAPI: endpointy importu, zapisu fiszek, algorytm Leitnera (osobna tabela statystyk), autoryzacja hasłem.  
• Baza Postgres: `flashcards`, `review_stats`, `users`.  

Kluczowe historie użytkownika:  
1. Jako student wklejam URL artykułu → otrzymuję listę proponowanych fiszek z hiszpańskim słownictwem pasującym do mojego poziomu.  
2. Jako student akceptuję/odrzucam wybrane fiszki hurtowo, widząc kontekst i tagi.  
3. Jako student uruchamiam codzienną sesję powtórek; system planuje kolejne terminy wg algorytmu Leitnera.  
4. Jako jedyny użytkownik loguję się prostym hasłem, a dane pozostają lokalnie w Dockerze.  

Kryteria sukcesu i pomiary:  
• ≥ 75 % fiszek generowanych przez AI akceptowanych w każdej sesji importu.  
• ≥ 75 % wszystkich nowych fiszek tworzonych z wykorzystaniem AI.  
• Śr. czas odpowiedzi backendu &lt; 400 ms przy ≤ 100 k rekordów.  
• Brak krytycznych błędów, ≥ 50 % pokrycia testami (PyTest/Jest).  

</prd_planning_summary>

<unresolved_issues>
1. Metoda określania „poziomu biegłości użytkownika” i progu filtrowania słownictwa.  
2. Dokładne parametry inicjalizacji i progresji przegródek Leitnera.  
3. Szczegóły UX akceptacji/odrzucenia (klawisze skrótów, paginacja listy przy dużych importach).  
4. Algorytm AI dla generowania własnych etykiet domenowych i potencjalna kontrola jakości tych tagów.  
5. Dokładny format i poziom hashowania hasła (np. bcrypt, argon2).  
</unresolved_issues>

</conversation_summary>

</project_details>

Wykonaj następujące kroki, aby stworzyć kompleksowy i dobrze zorganizowany dokument:

1. Podziel PRD na następujące sekcje:
   a. Przegląd projektu
   b. Problem użytkownika
   c. Wymagania funkcjonalne
   d. Granice projektu
   e. Historie użytkownika
   f. Metryki sukcesu

2. W każdej sekcji należy podać szczegółowe i istotne informacje w oparciu o opis projektu i odpowiedzi na pytania wyjaśniające. Upewnij się, że:
   - Używasz jasnego i zwięzłego języka
   - W razie potrzeby podajesz konkretne szczegóły i dane
   - Zachowujesz spójność w całym dokumencie
   - Odnosisz się do wszystkich punktów wymienionych w każdej sekcji

3. Podczas tworzenia historyjek użytkownika i kryteriów akceptacji
   - Wymień WSZYSTKIE niezbędne historyjki użytkownika, w tym scenariusze podstawowe, alternatywne i skrajne.
   - Przypisz unikalny identyfikator wymagań (np. US-001) do każdej historyjki użytkownika w celu bezpośredniej identyfikowalności.
   - Uwzględnij co najmniej jedną historię użytkownika specjalnie dla bezpiecznego dostępu lub uwierzytelniania, jeśli aplikacja wymaga identyfikacji użytkownika lub ograniczeń dostępu.
   - Upewnij się, że żadna potencjalna interakcja użytkownika nie została pominięta.
   - Upewnij się, że każda historia użytkownika jest testowalna.

Użyj następującej struktury dla każdej historii użytkownika:
- ID
- Tytuł
- Opis
- Kryteria akceptacji

4. Po ukończeniu PRD przejrzyj go pod kątem tej listy kontrolnej:
   - Czy każdą historię użytkownika można przetestować?
   - Czy kryteria akceptacji są jasne i konkretne?
   - Czy mamy wystarczająco dużo historyjek użytkownika, aby zbudować w pełni funkcjonalną aplikację?
   - Czy uwzględniliśmy wymagania dotyczące uwierzytelniania i autoryzacji (jeśli dotyczy)?

5. Formatowanie PRD:
   - Zachowaj spójne formatowanie i numerację.
   - Nie używaj pogrubionego formatowania w markdown ( ** ).
   - Wymień WSZYSTKIE historyjki użytkownika.
   - Sformatuj PRD w poprawnym markdown.

Przygotuj PRD z następującą strukturą:

```markdown
# Dokument wymagań produktu (PRD) - {{app-name}}
## 1. Przegląd produktu
## 2. Problem użytkownika
## 3. Wymagania funkcjonalne
## 4. Granice produktu
## 5. Historyjki użytkowników
## 6. Metryki sukcesu
```

Pamiętaj, aby wypełnić każdą sekcję szczegółowymi, istotnymi informacjami w oparciu o opis projektu i nasze pytania wyjaśniające. Upewnij się, że PRD jest wyczerpujący, jasny i zawiera wszystkie istotne informacje potrzebne do dalszej pracy nad produktem.

Ostateczny wynik powinien składać się wyłącznie z PRD zgodnego ze wskazanym formatem w markdown, który zapiszesz w pliku .ai/prd.md