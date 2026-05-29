# WSET Proefnotitie App — Claude Code Handoff Document

**Project:** WSET Wine Tasting Notes App (Dutch)  
**Status:** Beta — Login, Auth, Profile, Dynamic Form Working  
**Tech Stack:** Vanilla JS + Vite + Supabase + Vercel  
**Team:** Non-developer building with Claude assistance  
**Last Updated:** May 29, 2026

---

## 📁 PROJECT STRUCTURE

```
wset-app/
├── api/
│   ├── analyze-wine.js          (Gemini label scanning - candidate for Claude swap)
│   └── check-wine.js            (AI sommelier feedback - candidate for Claude swap)
├── src/
│   ├── app.js                   (ALL logic - 1500+ lines)
│   ├── vite.config.js           (Vite config, root: 'src', outDir: '../dist')
│   ├── supabase.js              (Supabase client init)
│   ├── styles.css               (Design system - CSS variables + component styles)
│   ├── .env                     (Local env vars — NOT committed)
│   └── index.html               (Entry point)
├── package.json
├── node_modules/
└── public/
```

---

## 🎨 DESIGN SYSTEM

**Colors:**
- Primary Pink: `#FF9999`
- Dark Pink: `#FF6B6B`
- Accent Yellow: `#FFD700`
- Background: `linear-gradient(135deg, #FF9999 0%, #FFB3B3 100%)`

**Typography:**
- App title (login): 120px, yellow with 6px dark brown shadow
- PROEFMETHODE: 36px, yellow with 4px shadow
- Body: Segoe UI

**Login/Signup Layout:** 50/50 split (`.login-layout`)
- Left (`.login-form-col`): Form with semi-transparent white inputs, dark text
- Right (`.login-logo-col`): Wine glasses SVG logo (white lines)
- **Mobile (`max-width: 600px`):** Logo column hidden, form full-width, gradient background

**App Pages:** Card-based layout
- `.app-outer` wraps everything in pink, `.app-card` is the rounded white/light inner card
- Yellow headers with brown shadow, pink borders, white cards

**Logo:** Champagne flute + wine glass + wine bottle (white lines, 300×350 SVG)

---

## 🗄️ SUPABASE SCHEMA

### `users` Table
```
id:            UUID (primary key)
username:      TEXT (unique)
email:         TEXT
password_hash: TEXT  ← SHA-256 hash (see Auth section)
created_at:    TIMESTAMP
```

### `wines` Table
```
id:             UUID (primary key)
user_id:        UUID (foreign key → users.id)
wine_id:        TEXT (generated: naam-druif-jaar-regio)

-- Wine Info
naam:           TEXT
druif:          TEXT
jaar:           TEXT
regio:          TEXT
prijs:          TEXT
gastro:         TEXT

-- Appearance (Uiterlijk)
helderheid:     TEXT  ← chip (binair)
intensiteit:    TEXT  ← SCALE
kleur:          TEXT  ← chip (kleurpalet)

-- Nose (Geur)
conditie:       TEXT  ← chip (binair)
geur_int:       TEXT  ← SCALE
aroma:          TEXT  ← comma-separated (multi-select chips)
notitie_geur:   TEXT

-- Palate (Smaak)
zoetheid:       TEXT  ← SCALE
zuur:           TEXT  ← SCALE
tannine:        TEXT  ← SCALE
body:           TEXT  ← SCALE
smaak_int:      TEXT  ← SCALE
smaak:          TEXT  ← comma-separated (multi-select chips)
afdronk:        TEXT  ← SCALE
notitie_smaak:  TEXT

-- Conclusion
kwaliteit:      TEXT  ← SCALE
lekker_rating:  INTEGER (1–5)  ← wine glass rating

-- AI Scoring
ai_score:       INT (1–10 or null)
ai_score_date:  TEXT

-- Metadata
created_at:     TIMESTAMP
updated_at:     TIMESTAMP
```

> ⚠️ **`lekker_rating` column must be manually added if not present:**
> ```sql
> ALTER TABLE wines ADD COLUMN lekker_rating INTEGER;
> ```

**Notes:**
- RLS currently DISABLED (TODO: implement proper auth)
- All users see all wines (by design — community catalogue)
- Multiple notes per wine_id allowed (different users)
- wine_id is NOT unique (same wine, different tasters)

---

## 🔐 ENVIRONMENT VARIABLES

**`src/.env` (local only, not committed)**
```
VITE_SUPABASE_URLSUPABASE_URL=https://ztgxykcctnrjkrarvyrg.supabase.co
VITE_SUPABASE_URLSUPABASE_ANON_KEY=[your-key]
VITE_GEMINI_API_KEY=[your-key]
```

> Note: The env var names have a redundant prefix (`VITE_SUPABASE_URLSUPABASE_URL`) — this is intentional, `supabase.js` reads them with these exact names.

**Vercel:** Same vars set in project settings (auto-deploy reads them)

---

## 🔐 AUTHENTICATION

### How it works
- **Passwords:** SHA-256 hashed client-side via Web Crypto API (no plaintext stored)
- **Session persistence:** User ID stored in `localStorage` as `wset_user_id`
- **On load:** `init()` reads `localStorage.getItem('wset_user_id')` — if found, skips login and loads app directly

### Key functions
```javascript
hashPassword(password)            // SHA-256 via crypto.subtle.digest
handleLogin()                     // Hash pw, fetch user+hash from Supabase, compare
handleSignup()                    // Username + pw + confirm; store password_hash in DB
handleLogout()                    // Clear isLoggedIn, currentUserId, localStorage
init()                            // Reads localStorage, restores session or shows login
```

### Error codes
- Duplicate username on signup: Supabase error code `23505`

### Test Accounts
- Username: `imre` (created before password hashing — may need password reset)
- Create new accounts freely via signup screen

---

## 🎯 APP STATE (Global Variables in app.js)

```javascript
let wines = []                    // All wines from DB
let currentScreen = 'lijst'       // Current page
let chipState = {}                // Form field selections (chips + scales + rating)
let scannedWineData = null        // Label scan result
let currentFilter = null          // Active filter (druif)
let currentSearch = ''            // Search query
let editingWineId = null          // Editing mode flag (UUID or null)
let isLoggedIn = false            // Auth state
let currentUserId = null          // UUID of logged-in user
```

---

## 📱 SCREENS/PAGES

### ✅ DONE
- **Login Screen** — Split layout, semi-transparent white inputs, readable dark text
- **Signup Screen** — Same style as login, username + password + confirm
- **Wine List (wijncatalogus)** — Shows all wines, search, filter by druif
- **Wine Detail** — Tabs per proefnotitie, edit/delete own notes
- **Proefnotitie Form** — All WSET fields, horizontal scales + chips + wine glass rating
- **Profile Page** — Avatar, username, "lid sinds", stats, rated wines list, uitloggen
- **Change Password** — Current + new + confirm, updates `password_hash` in DB
- **Leaderboard** — Users ranked by avg AI score

### 🚧 IN PROGRESS / KNOWN ISSUES
- **Scan Etiket** — Works only on Vercel (uses `/api`), not locally
- **`lekker_rating` column** — Must be added manually to Supabase if not present (see schema section)

### ⚠️ TODO (PRIORITY ORDER)
1. **Security:** Implement RLS policies + switch to Supabase Auth
2. **Replace Gemini with Claude** in `/api/analyze-wine.js` and `/api/check-wine.js`
3. **Code cleanup:** Split app.js into modules (auth, ui, db, forms)
4. **Add loading states** throughout the app

---

## 📋 FORM SYSTEM (IMPORTANT)

The tasting form uses `chipState` as central state. Two types of interactive elements:

### Horizontal Scale Selectors (linear/ordinal attributes)
Used for: `intensiteit`, `geur-int`, `zoetheid`, `zuur`, `tannine`, `body`, `smaak-int`, `afdronk`, `kwaliteit`

```javascript
makeScale(group, options)         // Returns HTML string for scale selector
selectScale(el, group, value)     // Select or deselect a scale node
selectScaleByValue(group, value)  // Restore scale by value (used in editWine)
```

- Clicking selected node again → **deselects** (clears `chipState[group]`)
- CSS: `.scale-selector`, `.scale-node`, `.scale-dot`, `.scale-label`
- Track line via `.scale-track-wrapper::before` pseudo-element at `top: 11px`

### Chip Selectors (categorical attributes)
Used for: `helderheid` (binair), `conditie` (binair), `kleur` (kleurpalet), `aroma` (multi), `smaak` (multi)

```javascript
toggleChip(el, group)             // Toggle chip; single-select supports deselect
getChips(group)                   // Get selected value(s) for a group
```

- Single-select chips also support **deselect** by clicking again
- Multi-select (`aroma`, `smaak`): clicking always toggles

### Wine Glass Rating (1–5)
```javascript
makeWineRating()                  // Returns HTML with 5 SVG wine glass items
setWineRating(value)              // Set or deselect rating (stored as integer in chipState['lekker_rating'])
```

- Clicking same rating again → **deselects** (clears to `null`)
- Stored as `lekker_rating` INTEGER in Supabase
- Label shown: **"Jouw persoonlijke rating"**

### Restoring form state (edit mode)
```javascript
editWine(wine)                    // Populates chipState + DOM from existing wine object
// Uses: selectChip() for chips, selectScaleByValue() for scales, setWineRating() for rating
```

---

## 🔧 KEY FUNCTIONS REFERENCE

### Auth
| Function | Description |
|---|---|
| `showLoginScreen()` | Render login UI |
| `showSignupScreen()` | Render signup UI |
| `handleLogin()` | Verify credentials, save to localStorage |
| `handleSignup()` | Create account with hashed password |
| `handleLogout()` | Clear session and return to login |
| `showChangePassword()` | Password change screen |
| `handleChangePasswordSubmit()` | Verify + update password_hash |

### Data
| Function | Description |
|---|---|
| `loadWines()` | Fetch all wines from Supabase |
| `saveWine()` | INSERT or UPDATE wine note (includes lekker_rating) |
| `deleteWine(id)` | Delete note |

### UI / Navigation
| Function | Description |
|---|---|
| `render()` | Main router (shows current screen) |
| `renderList()` | Wine catalogue view |
| `renderForm()` | Tasting form (scales + chips + rating) |
| `renderScan()` | Label scanner |
| `showWineGroupDetail(wineId)` | Detail view with tabs |
| `showMyWines()` | Profile page with stats and wine list |
| `showLeaderboard()` | User rankings by AI score |

### Form
| Function | Description |
|---|---|
| `makeScale(group, options)` | Build horizontal scale HTML |
| `selectScale(el, group, value)` | Scale interaction (with deselect) |
| `selectScaleByValue(group, value)` | Restore scale from saved value |
| `makeWineRating()` | Build wine glass rating HTML |
| `setWineRating(value)` | Wine glass interaction (with deselect) |
| `toggleChip(el, group)` | Chip interaction (with deselect for single-select) |
| `getChips(group)` | Read selected chip value(s) |

### Window Exports (required for inline onclick handlers)
All interactive functions must be on `window.*`:
```javascript
window.handleLogin, window.handleSignup, window.handleLogout
window.showLoginScreen, window.showSignupScreen
window.showMyWines, window.showChangePassword, window.handleChangePasswordSubmit
window.selectScale, window.setWineRating, window.toggleChip
window.showLeaderboard, window.renderForm, window.saveWine
// ... and many more — see bottom of app.js
```

---

## 🔄 DATA FLOW

### Save Wine
1. User fills form → `saveWine()` called
2. Generate wine_id from name/druif/jaar/regio
3. Collect all `chipState` values (chips, scales, lekker_rating)
4. INSERT or UPDATE in Supabase wines table
5. Navigate to list

### Login Flow
1. Enter username + password
2. SHA-256 hash the password client-side
3. Fetch `password_hash` from Supabase for that username
4. Compare hashes
5. On match: set `currentUserId`, `isLoggedIn = true`, save to `localStorage`
6. Load wines and render app

### Session Restore
1. `init()` calls `localStorage.getItem('wset_user_id')`
2. If found: set `currentUserId`, `isLoggedIn = true` (no password re-check)
3. Load wines and render app directly (no login screen)

---

## 🚀 DEPLOYMENT (Vercel)

**Auto-Deploy:** Any push to GitHub triggers Vercel build
```bash
git add src/app.js src/styles.css   # Be specific, avoid adding .env
git commit -m "message"
git push
```

**Build Process:** Install → Vite build (src → dist) → Deploy

**Live:** https://wset-app.vercel.app  
**GitHub:** https://github.com/ImreBlijleven/wset-app

---

## 🐛 KNOWN ISSUES / GOTCHAS

1. **`lekker_rating` column** — If missing from Supabase, saving will silently fail for that field. Run: `ALTER TABLE wines ADD COLUMN lekker_rating INTEGER;`
2. **Old accounts** — Accounts created before password hashing have `password_hash = 'placeholder'` and cannot log in normally. Workaround: use `localStorage.setItem('wset_user_id', '[uuid]')` in browser console + reload.
3. **Scan Etiket** — Only works on Vercel deployment (needs `/api` serverless functions). Shows error locally.
4. **RLS disabled** — All users can read/write all wines. Intentional for now, but not production-safe.
5. **No email verification** — Signup accepts any username, no email required.

---

## 💡 IMPORTANT NOTES FOR CLAUDE CODE

1. **Always stop preview server** after verification — never leave localhost running after a session
2. **Test locally** before deploying: `npm run dev` (from `src/` directory or use `preview_start`)
3. **Inline onclick handlers** — All JS functions called from HTML must be on `window.*`
4. **chipState is the source of truth** for the form — never read DOM values directly in saveWine
5. **Supabase** — All data persists. Don't accidentally drop tables!
6. **Env var names** are oddly prefixed (e.g. `VITE_SUPABASE_URLSUPABASE_URL`) — keep them as-is in both `.env` and `supabase.js`
7. **Co-authored commits:** Always append `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
8. **Scale groups list:** `intensiteit`, `geur-int`, `zoetheid`, `zuur`, `tannine`, `body`, `smaak-int`, `afdronk`, `kwaliteit` — these use `makeScale()`, NOT `toggleChip()`

---

## 📋 RECENT CHANGES (Session Log)

### May 29, 2026
- Fixed login/signup input text invisible (white text on light pink → dark text on semi-transparent white)
- Renamed "Was het lekker?" label to "Jouw persoonlijke rating"

### Earlier in May 2026
- Added deselect/unselect to scales, single-select chips, and wine glass rating
- Implemented dynamic horizontal scale selectors for all linear/ordinal WSET attributes
- Added "Jouw persoonlijke rating" (1–5 wine glass rating) to Conclusie card
- Added `lekker_rating` field to `saveWine()` and `editWine()`
- Moved logout button from main page to profile page
- Restored pink gradient on mobile login screen
- Fixed mobile login layout (logo column hidden, form full-width)
- Implemented enhanced profile page (avatar, stats, wine list, change password)
- Added per-user hashed passwords (SHA-256 via Web Crypto API)
- Implemented session persistence via localStorage

---

**For:** Claude Code Handoff  
**Status:** Active development
