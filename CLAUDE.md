# CLAUDE.md — Polla Mundial ProntoPaga 2026

Guía de referencia para Claude. Lee esto al inicio de cada sesión.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Vanilla JS SPA, sin frameworks |
| Hosting | GitHub Pages (`briansc243-spec.github.io/polla-mundial-2026`) |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Config | `js/config.js` → `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| Estilos | `css/styles.css` |
| App | `js/app.js` (único archivo JS principal) |

---

## Supabase

**Proyecto:** `wrnywkjdobouenvssrgm.supabase.co`

### Tablas

| Tabla | Propósito |
|-------|-----------|
| `polla_users` | Usuarios: `username`, `password_hash`, `role`, `display_name` |
| `polla_data` | Key-value store general. Keys usadas: `results`, `participant:<displayName>`, `displayName:<username>` |
| `polla_logs` | Log de acciones admin (create_user, save_results, etc.) |
| `polla_live` | Cache de scores en vivo (stand-by — se activa con API-Football) |

### `polla_data` — keys importantes

- `results` → `[{matchId, score1, score2}, ...]` — resultados reales de partidos
- `participant:<DisplayName>` → `{name, timestamp, predictions:[{matchId, score1, score2}], specialPredictions:{champion, runnerUp, thirdPlace, topScorer}}`
- `displayName:<username>` → string con el nombre de display del usuario

### Edge Function

- **Nombre:** `live-scores`
- **Función:** Proxy a football-data.org para obtener estado de partidos del Mundial WC
- **Limitación actual:** Plan gratuito football-data.org devuelve `TIMED` (no scores en vivo)
- **Pendiente:** Migrar a API-Football (`v3.football.api-sports.io`, key ya obtenida) para scores en tiempo real. Al hacerlo, también activar escritura en `polla_live`.

---

## Estructura de archivos

```
index.html          — HTML completo incluyendo tabla de grupos estática (Grupo A–L)
js/
  config.js         — SUPABASE_URL y SUPABASE_ANON_KEY (público, anon key)
  app.js            — Toda la lógica SPA
css/
  styles.css        — Estilos con breakpoints responsive
```

---

## Tabs de la app

| Tab ID | Nombre visible | Quién la ve |
|--------|---------------|-------------|
| `predictions` | 📝 Predicciones | Todos |
| `myPredictions` | 📋 Mis picks | Todos |
| `groups` | 🌍 Grupos | Todos |
| `leaderboard` | 🏆 Tabla | Todos |
| `results` | ⚽ Resultados | Solo admin (oculto en `applyRoleUI`) |
| `stats` | 📊 Estadísticas | Todos |

---

## Sistema de puntos

| Resultado | Puntos |
|-----------|--------|
| Marcador exacto | +3 pts |
| Tendencia correcta (ganador o empate) | +1 pt |
| Incorrecto | 0 pts |
| Predicción especial correcta | +5 pts cada una |

Calculado en `calculatePoints(predictions, results)`.

---

## Fechas clave

- **SPECIAL_DEADLINE:** `2026-06-17T00:00:00-05:00` — fecha límite para predicciones especiales
- **Lock por partido:** 1 minuto antes del inicio (`isMatchLocked`)
- **Reveal picks:** 2 minutos después del inicio (`renderAllPicks`)
- **Badge ámbar "closing soon":** cuando faltan < 12 horas para el cierre (`msLeft < 12 * 60 * 60 * 1000`)

---

## Funciones principales de `app.js`

| Función | Qué hace |
|---------|---------|
| `init()` | Carga participants y results desde DB, renderiza todo |
| `fetchLiveScores()` | Llama Edge Function, aplica STATUS_RANK, auto-guarda FINISHED |
| `startLivePolling()` | Inicia polling cada 60 segundos |
| `renderMatches()` | Tab Predicciones — inputs de predicción + badges live/FINAL |
| `renderMyPredictions()` | Tab Mis picks — resultado real + tu pick + puntos |
| `renderResults()` | Tab Resultados (admin) — inputs para ingresar scores |
| `saveResults()` | Admin guarda resultados. **Re-lee DB antes de guardar** para no perder datos |
| `submitPredictions()` | Usuario guarda sus predicciones |
| `calculatePoints(preds, results)` | Retorna `{points, exact, tendency}` |
| `updateLeaderboard()` | Renderiza tabla de posiciones |
| `renderAllPicks()` | Tab Estadísticas — "Pronósticos de todos" (visible 2 min post-inicio) |
| `updateStats()` + `renderCharts()` | Gráficos de estadísticas |
| `applyRoleUI(username)` | Muestra/oculta elementos según rol. Mobile: ⋮ menu |
| `stripFlag(name)` | Elimina emoji de bandera del nombre del equipo |
| `isMatchLocked(match)` | true si now >= kickoff - 1 min |
| `getTimeUntilLock(match)` | Texto "Cierra en Xh Ym" |
| `storage.get/set/list` | Wrapper de polla_data (key-value) |

---

## STATUS_RANK — prevenir downgrade de estado

```javascript
const STATUS_RANK = { 'FINISHED': 4, 'IN_PLAY': 3, 'PAUSED': 2, 'TIMED': 0, 'SCHEDULED': 0 };
```

Si la API devuelve un estado de menor rango que el ya conocido, se mantiene el existente. Evita que "EN VIVO" desaparezca si la API devuelve TIMED inconsistentemente.

---

## Guardar resultados (admin)

**Nunca usar el botón "Guardar" del tab Resultados sin antes recargar la página.** Si la app cargó con resultados viejos en memoria, puede sobreescribir la DB.

`saveResults()` ahora:
1. Re-lee DB fresca antes de guardar
2. Hace merge (inputs del UI + existentes en DB)
3. Los inputs vacíos no borran resultados ya guardados

Para guardar un resultado manualmente desde terminal:
```bash
curl -X PATCH "https://wrnywkjdobouenvssrgm.supabase.co/rest/v1/polla_data?key=eq.results" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"value": [{"score1":X,"score2":Y,"matchId":Z}, ...]}'
```
**Siempre incluir TODOS los resultados existentes** en el array, no solo el nuevo.

---

## Tabla de grupos (index.html)

La tabla de grupos es **HTML estático** en `index.html`. Debe actualizarse manualmente después de cada partido con:
- PJ, G, E, P, GF, GC, DG, PTS
- Badges de forma: `G` (verde `#00FF88`), `E` (amarillo), `P` (rojo `#FF4444`)
- Posiciones ordenadas por PTS → DG → GF

**Estado actual (Grupo A):**
| Pos | Equipo | PJ | G | E | P | GF | GC | DG | PTS |
|-----|--------|----|----|---|---|----|----|-----|-----|
| 1 | 🇲🇽 México | 1 | 1 | 0 | 0 | 2 | 0 | +2 | 3 |
| 2 | 🇰🇷 Corea del Sur | 1 | 1 | 0 | 0 | 2 | 1 | +1 | 3 |
| 3 | 🇨🇿 Chequia | 1 | 0 | 0 | 1 | 1 | 2 | -1 | 0 |
| 4 | 🇿🇦 Sudáfrica | 1 | 0 | 0 | 1 | 0 | 2 | -2 | 0 |

---

## Cache-busting (GitHub Pages)

GitHub Pages cachea archivos con `max-age=600`. Cada vez que se sube código nuevo, actualizar la versión en `index.html`:

```html
<link rel="stylesheet" href="css/styles.css?v=<COMMIT_HASH>">
<script src="js/app.js?v=<COMMIT_HASH>"></script>
```

Usar el hash del commit actual: `git rev-parse --short HEAD`

---

## Responsive — breakpoints

| Breakpoint | Cambios |
|-----------|---------|
| ≤1100px | Schedule items ajustan grid |
| ≤900px | Schedule: oculta venue |
| ≤850px | Groups: una columna |
| ≤768px | Leaderboard: solo 3 cols. Stats: una columna |
| ≤600px | Groups table: oculta cols 7,8,10. Inputs score: 44px. Nombres con ellipsis |
| ≤480px | Pick cards: wrap a múltiples líneas |

---

## Mobile — ⋮ menu

En `applyRoleUI()`, detecta `window.innerWidth <= 600`:
- **Mobile:** muestra `#mobileMenu` (botón ⋮ → dropdown con usuario, cambiar pwd, cerrar sesión)
- **Desktop:** muestra `#desktopBtns` (botones individuales)
- Admin también ve botón 👥 Usuarios en ambos modos

---

## Pendientes

1. **API-Football integration** — actualizar Edge Function `live-scores` para usar `v3.football.api-sports.io/fixtures?live=all`. Requiere Supabase Personal Access Token para deploy via CLI (`supabase functions deploy`). Al integrar, activar escritura en `polla_live`.
2. **Regenerar API key football-data.org** — la original fue expuesta en chat.
3. **Tabla de grupos** — actualizar HTML manualmente después de cada jornada.
