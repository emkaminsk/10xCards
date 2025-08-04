# Scripts

## Najczęściej modyfikowane pliki

``` bash
git log --since="1 year ago" --pretty=format:"" --name-only --no-merges | \
  grep -vE "${EXCLUDE_PATTERN_GREP:-^$}" | \
  grep '.' | \
  sort | \
  uniq -c | \
  sort -nr | \
  head -n 10 | \
  awk '{count=$1; $1=""; sub(/^[ \t]+/, ""); print $0 ": " count " changes"}' | cat
  ```

Ten sam skrypt z użyciem wzorca wykluczeń
  ``` bash
  # Wykluczenie plików konfiguracyjnych
EXCLUDE_PATTERN_GREP='(\.yml$|\.yaml$|\.config\.js$)'

# Wykluczenie testów i dokumentacji
EXCLUDE_PATTERN_GREP='(test|spec|docs?/)'

# Wykluczenie plików z node_modules i build
EXCLUDE_PATTERN_GREP='(node_modules|dist|build|\.gitignore)'

# Złożony wzorzec - wyklucza wiele typów plików
EXCLUDE_PATTERN_GREP='(\.svg$|\.png$|\.jpg$|package-lock\.json|yarn\.lock|\.md$)'

# Użycie w skrypcie
EXCLUDE_PATTERN_GREP='(test|spec)' 
git log --since="1 year ago" --pretty=format:"" --name-only --no-merges | \
  grep -vE "${EXCLUDE_PATTERN_GREP:-^$}" | \
  grep '.' | \
  sort | \
  uniq -c | \
  sort -nr | \
  head -n 10 | \
  awk '{count=$1; $1=""; sub(/^[ \t]+/, ""); print $0 ": " count " changes"}' | cat
  ```

Ten sam dla Windows

  ``` bash
    git log --since="1 year ago" --pretty=format:"" --name-only --no-merges | 
  Where-Object { $_ -match '\S' } | 
  Where-Object { $_ -notmatch "" } | 
  Group-Object | 
  Sort-Object -Property Count -Descending | 
  Select-Object -First 10 | 
  ForEach-Object { "$($_.Name): $($_.Count) changes" }
  ```

## Najczęściej modyfikowane moduły

  ``` bash
  git log --since="1 year ago" --pretty=format:"" --name-only --no-merges | \
  grep -vE "${EXCLUDE_PATTERN_GREP:-^$}" | \
  grep '.' | \
  awk -F/ -v OFS=/ 'NF > 1 {$NF = ""; print $0 } NF <= 1 { print "." }' | \
  sed 's|/*$||' | \
  sed 's|^\\.$|project root|' | \
  sort | \
  uniq -c | \
  sort -nr | \
  head -n 10 | \
  awk '{count=$1; $1=""; sub(/^[ \t]+/, ""); print $0 ": " count " changes"}' | cat    
  ```

Windows

  ``` bash
  git log --since="1 year ago" --pretty=format:"" --name-only --no-merges | 
  Where-Object { $_ -match '\S' } | 
  Where-Object { $_ -notmatch "(package\.json$|package-lock\.json$|yarn\.lock$|^node_modules/|^dist/|^build/|\.log$|\.svg$|\.png$|\.ico$|\.map$|\.d\.ts$|README\.md$|\.gitignore$|CHANGELOG\.md$|LICENSE$)" } | 
  ForEach-Object {
    if ($_ -match "/") {
      $parts = $_ -split "/"
      $parts[0..($parts.Length-2)] -join "/"
    } else {
      "project root"
    }
  } | 
  Group-Object | 
  Sort-Object -Property Count -Descending | 
  Select-Object -First 10 | 
  ForEach-Object { "$($_.Name): $($_.Count) changes" }
  ```

## Analiza kontrybutorów

  ``` bash
  git log --since="1 year ago" --pretty=format:"%an <%ae>" --no-merges |\
  sort |\
  uniq -c |\
  sort -nr |\
  head -n 5 |\
  awk '{count=$1; $1=""; sub(/^[ \t]+/, ""); print $0 ": " count " commits"}'
```

``` bash
git log --since="1 year ago" --pretty=format:"%an <%ae>" --no-merges | 
  Group-Object | 
  Sort-Object -Property Count -Descending | 
  Select-Object -First 5 | 
  ForEach-Object { "$($_.Name): $($_.Count) commits" }
```
