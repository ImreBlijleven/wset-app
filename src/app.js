import { supabase } from './supabase.js'

// App state
let wines = []
let currentScreen = 'lijst'
let chipState = {}
let scannedWineData = null
let currentFilter = null
let currentSearch = ''
let db
let editingWineId = null
let isLoggedIn = false
let currentUserId = null
const userCache = {}  // { user_id: username }

// ============= AUTH HELPERS =============

async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============= LOGIN SCREEN =============

function getCurrentUserId() {
  return currentUserId
}

function showLoginScreen() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="login-layout">

      <!-- Links: Form -->
      <div class="login-form-col">
        <div style="text-align: center; width: 100%;">
          <h1 class="login-title">WSET</h1>
          <div class="login-subtitle">PROEFMETHODE</div>

          <input type="text" id="login-username" placeholder="Username" class="login-input">

          <input type="password" id="login-password" placeholder="Wachtwoord" class="login-input" style="margin-bottom: 12px;">

          <div style="text-align: right; margin-bottom: 40px; font-size: 16px;">
            <a onclick="alert('Wat vervelend! Stuur Imre even een berichtje en die zal dit voor je oplossen. 😊')" style="color: var(--color-primary-pink); cursor: pointer; text-decoration: none; font-weight: 600;">Wachtwoord vergeten?</a>
          </div>

          <button onclick="handleLogin()" style="width: 100%; padding: 20px; background: white; color: var(--color-primary-pink); border: 3px solid var(--color-primary-pink); border-radius: 8px; font-size: 20px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">Login</button>

          <div style="text-align: center; margin-top: 24px; font-size: 16px; color: var(--color-text-dark);">
            Of <a onclick="showSignupScreen()" style="color: var(--color-primary-pink); cursor: pointer; text-decoration: none; font-weight: 600;">maak hier een account aan</a>
          </div>
        </div>
      </div>

      <!-- Rechts: Wine Glasses Logo -->
      <div class="login-logo-col">
        <svg viewBox="0 0 300 350" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 350px; height: auto;">
          <!-- Champagne Flute: taper from wide top to narrow bottom -->
          <g>
            <path d="M 39 62 C 41 110 44 155 47 186" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 71 62 C 69 110 66 155 63 186" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 47 186 Q 55 196 63 186" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 39 62 Q 55 54 71 62" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="55" y1="196" x2="55" y2="264" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="55" cy="272" rx="22" ry="7" stroke="white" stroke-width="4" fill="none"/>
          </g>

          <!-- Wine Glass: tulip bowl with outward belly -->
          <g>
            <path d="M 109 62 C 94 110 96 165 128 200" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 171 62 C 186 110 184 165 152 200" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 128 200 Q 140 212 152 200" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 109 62 Q 140 52 171 62" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="140" y1="212" x2="140" y2="278" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="140" cy="286" rx="26" ry="9" stroke="white" stroke-width="4" fill="none"/>
          </g>

          <!-- Wine Bottle: capsule, narrow neck, curved shoulders, straight body -->
          <g>
            <path d="M 233 38 L 233 22 Q 240 14 247 22 L 247 38" stroke="white" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="232" y1="38" x2="248" y2="38" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
            <line x1="233" y1="38" x2="233" y2="92" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <line x1="247" y1="38" x2="247" y2="92" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 233 92 C 228 100 218 112 218 124" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 247 92 C 252 100 262 112 262 124" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="218" y1="124" x2="218" y2="304" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <line x1="262" y1="124" x2="262" y2="304" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 218 304 Q 240 316 262 304" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
          </g>
        </svg>
      </div>
    </div>
  `
  
  document.getElementById('login-username').focus()
}

function showSignupScreen() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="login-layout">

      <!-- Links: Form -->
      <div class="login-form-col">
        <div style="text-align: center; width: 100%;">
          <h1 class="login-title">WSET</h1>
          <div class="login-subtitle">PROEFMETHODE</div>

          <input type="text" id="signup-username" placeholder="Kies je username" class="login-input">

          <input type="password" id="signup-password" placeholder="Kies een wachtwoord" class="login-input">

          <input type="password" id="signup-password-confirm" placeholder="Bevestig wachtwoord" class="login-input" style="margin-bottom: 40px;">

          <button onclick="handleSignup()" style="width: 100%; padding: 20px; background: white; color: var(--color-primary-pink); border: 3px solid var(--color-primary-pink); border-radius: 8px; font-size: 20px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">Account maken</button>

          <div style="text-align: center; margin-top: 24px; font-size: 16px; color: var(--color-text-dark);">
            <a onclick="showLoginScreen()" style="color: var(--color-primary-pink); cursor: pointer; text-decoration: none; font-weight: 600;">Terug naar login</a>
          </div>
        </div>
      </div>

      <!-- Rechts: Wine Glasses Logo -->
      <div class="login-logo-col">
        <svg viewBox="0 0 300 350" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 350px; height: auto;">
          <!-- Champagne Flute: taper from wide top to narrow bottom -->
          <g>
            <path d="M 39 62 C 41 110 44 155 47 186" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 71 62 C 69 110 66 155 63 186" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 47 186 Q 55 196 63 186" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 39 62 Q 55 54 71 62" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="55" y1="196" x2="55" y2="264" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="55" cy="272" rx="22" ry="7" stroke="white" stroke-width="4" fill="none"/>
          </g>

          <!-- Wine Glass: tulip bowl with outward belly -->
          <g>
            <path d="M 109 62 C 94 110 96 165 128 200" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 171 62 C 186 110 184 165 152 200" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 128 200 Q 140 212 152 200" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 109 62 Q 140 52 171 62" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="140" y1="212" x2="140" y2="278" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="140" cy="286" rx="26" ry="9" stroke="white" stroke-width="4" fill="none"/>
          </g>

          <!-- Wine Bottle: capsule, narrow neck, curved shoulders, straight body -->
          <g>
            <path d="M 233 38 L 233 22 Q 240 14 247 22 L 247 38" stroke="white" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="232" y1="38" x2="248" y2="38" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
            <line x1="233" y1="38" x2="233" y2="92" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <line x1="247" y1="38" x2="247" y2="92" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 233 92 C 228 100 218 112 218 124" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 247 92 C 252 100 262 112 262 124" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="218" y1="124" x2="218" y2="304" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <line x1="262" y1="124" x2="262" y2="304" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 218 304 Q 240 316 262 304" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
          </g>
        </svg>
      </div>
    </div>
  `
  
  document.getElementById('signup-username').focus()
}

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim()
  const password = document.getElementById('login-password').value

  if (!username) {
    alert('Vul username in')
    return
  }

  if (!password) {
    alert('Vul je wachtwoord in')
    return
  }

  const passwordHash = await hashPassword(password)

  const { data: user, error } = await supabase
    .from('users')
    .select('id, password_hash')
    .eq('username', username)
    .single()

  if (error || !user) {
    alert('Username niet gevonden')
    return
  }

  if (user.password_hash !== passwordHash) {
    const input = document.getElementById('login-password')
    input.style.borderColor = '#c62828'
    input.value = ''
    input.placeholder = 'Verkeerd wachtwoord'
    setTimeout(() => {
      input.style.borderColor = '#D67A7A'
      input.placeholder = 'Wachtwoord'
    }, 2000)
    return
  }

  // Success!
  currentUserId = user.id
  isLoggedIn = true
  localStorage.setItem('wset_user_id', user.id)
  render()
}

async function handleSignup() {
  const username = document.getElementById('signup-username').value.trim()
  const password = document.getElementById('signup-password').value
  const passwordConfirm = document.getElementById('signup-password-confirm').value

  if (!username) {
    alert('Vul een username in')
    return
  }

  if (!password) {
    alert('Kies een wachtwoord')
    return
  }

  if (password !== passwordConfirm) {
    const confirmInput = document.getElementById('signup-password-confirm')
    confirmInput.style.borderColor = '#c62828'
    confirmInput.value = ''
    confirmInput.placeholder = 'Wachtwoorden komen niet overeen'
    setTimeout(() => {
      confirmInput.style.borderColor = '#D67A7A'
      confirmInput.placeholder = 'Bevestig wachtwoord'
    }, 2000)
    return
  }

  const passwordHash = await hashPassword(password)

  const { data, error } = await supabase
    .from('users')
    .insert([{
      username,
      email: username + '@local',
      password_hash: passwordHash
    }])
    .select()

  if (error) {
    if (error.code === '23505') {
      alert('Deze username is al bezet, kies een andere.')
    } else {
      alert('Fout: ' + error.message)
    }
    return
  }

  alert('Account gemaakt! Je kunt nu inloggen.')
  showLoginScreen()
}

// ============= DATABASE =============

async function loadWines() {
  const { data, error } = await supabase
    .from('wines')
    .select('*')
  
  if (error) {
    console.error('Supabase error:', error)
    wines = []
  } else {
    wines = data || []
  }
}

// ============= WINE HELPERS =============

function generateWineId(naam, druif, jaar, regio) {
  return `${naam.toLowerCase()}-${druif.toLowerCase()}-${jaar}-${regio.toLowerCase()}`
}

function findExistingWine(naam, druif, jaar, regio) {
  const wineId = generateWineId(naam, druif, jaar, regio)
  return wines.find(w => w.wine_id === wineId)
}

function getWineNotes(wineId) {
  return wines.filter(w => w.wine_id === wineId)
}

// ============= RENDER MAIN =============

function render() {
  if (!isLoggedIn) {
    showLoginScreen()
    return
  }
  
  const app = document.getElementById('app')
  
  if (currentScreen === 'lijst') {
    renderList(app)
  } else if (currentScreen === 'nieuw') {
    renderForm(app)
  } else if (currentScreen === 'scan') {
    renderScan(app)
  }
}

function renderList(container) {
  container.innerHTML = `
    <div class="app-outer">
      <div class="app-card">
        <h1 class="page-hero-title">Wijncatalogus</h1>

        <input type="text" id="search" class="search-input" placeholder="Zoek op naam, druif, regio..." oninput="filterAndSearch()">

        <div id="filters" class="filter-chips-wrap"></div>

        <div class="wine-list" id="wine-list"></div>
      </div>

      <nav class="bottom-nav">
        <button class="bottom-nav-item" onclick="showLeaderboard()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3M7 7c0 4 2 7 5 8 3-1 5-4 5-8M12 15v5M9 20h6"/></svg>
          <span class="bottom-nav-label">Leaderboard</span>
        </button>
        <button class="bottom-nav-item" onclick="switchScreen('nieuw')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span class="bottom-nav-label">Nieuwe Notitie</span>
        </button>
        <button class="bottom-nav-item" onclick="showMyWines()">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span class="bottom-nav-label">Mijn Profiel</span>
        </button>
      </nav>
    </div>
  `

  renderFiltersAndList()
}

function renderFiltersAndList() {
  const uniqueWines = [...new Map(wines.map(w => [w.wine_id, w])).values()]
  const druiven = [...new Set(uniqueWines.map(w => w.druif).filter(Boolean))]
  const filterDiv = document.getElementById('filters')
  
  if (!filterDiv) return
  
  filterDiv.innerHTML = ''
  
  const allBtn = document.createElement('button')
  allBtn.className = 'filter-chip' + (currentFilter === null ? ' active' : '')
  allBtn.textContent = 'Alles'
  allBtn.onclick = () => { currentFilter = null; renderFiltersAndList(); filterAndSearch() }
  filterDiv.appendChild(allBtn)
  
  druiven.forEach(druif => {
    const btn = document.createElement('button')
    btn.className = 'filter-chip' + (druif === currentFilter ? ' active' : '')
    btn.textContent = druif
    btn.onclick = () => { currentFilter = druif; renderFiltersAndList(); filterAndSearch() }
    filterDiv.appendChild(btn)
  })
  
  filterAndSearch()
}

async function showMyWines() {
  const myNotes = wines.filter(w => w.user_id === currentUserId)
  const scores = myNotes.filter(w => w.ai_score).map(w => w.ai_score)
  const avgScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : null

  const { data: userData } = await supabase
    .from('users')
    .select('username, created_at')
    .eq('id', currentUserId)
    .single()

  const username = userData?.username || 'Onbekend'
  const lidSinds = userData?.created_at
    ? new Date(userData.created_at).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long' })
    : 'Onbekend'
  const initial = username.charAt(0).toUpperCase()

  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="app-outer">
      <div class="app-card">
        <button class="back-link" onclick="switchScreen('lijst')">← Terug naar overzicht</button>

        <h1 class="page-hero-title">Mijn Profiel</h1>

        <!-- Profielkaart -->
        <div class="profile-header">
          <div class="profile-avatar">${initial}</div>
          <div class="profile-username">${username}</div>
          <div class="profile-since">Lid sinds ${lidSinds}</div>
          <button class="profile-change-pw-btn" onclick="showChangePassword()">Wachtwoord wijzigen</button>
        </div>

        <!-- Stats -->
        <div class="profile-stats-row">
          <div class="profile-stat-box">
            <div class="profile-stat-value">${myNotes.length}</div>
            <div class="profile-stat-label">Proefnotities</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-value">${avgScore ?? '–'}</div>
            <div class="profile-stat-label">Gem. score</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-value">${scores.length}</div>
            <div class="profile-stat-label">Beoordeeld</div>
          </div>
        </div>

        <!-- Wijnlijst -->
        <div class="section-title" style="margin-top: 24px; margin-bottom: 12px;">Mijn wijnen</div>
        <div class="wine-list" id="my-wines"></div>

        <!-- Uitloggen -->
        <button class="profile-logout-btn" onclick="handleLogout()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Uitloggen
        </button>
      </div>
    </div>
  `

  const list = document.getElementById('my-wines')
  if (myNotes.length === 0) {
    list.innerHTML = '<div class="empty-state">Je hebt nog geen wijnen geproefd</div>'
  } else {
    list.innerHTML = myNotes.map(w => `
      <div class="wine-card" onclick="showWineGroupDetail('${w.wine_id}')">
        <div class="flex-between">
          <div>
            <div class="wine-card-title">${w.naam}</div>
            <div class="wine-card-meta">${[w.druif, w.regio, w.jaar].filter(Boolean).join(' · ')}</div>
            ${w.created_at ? `<div class="wine-card-meta">${new Date(w.created_at).toLocaleDateString('nl-NL')}</div>` : ''}
            ${w.lekker_rating ? `<div style="margin-top:6px;">${miniGlassRating(w.lekker_rating)}</div>` : ''}
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
            ${w.ai_score ? `<div style="font-size:20px; font-weight:bold; color:var(--color-accent-yellow);">${w.ai_score}</div>` : ''}
            <div class="wine-chevron">›</div>
          </div>
        </div>
      </div>
    `).join('')
  }
}

function showChangePassword() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="app-outer">
      <div class="app-card">
        <button class="back-link" onclick="showMyWines()">← Terug naar profiel</button>

        <h1 class="page-hero-title">Wachtwoord</h1>

        <div style="display:flex; flex-direction:column; gap:16px; margin-top:8px;">
          <input type="password" id="pw-current" placeholder="Huidig wachtwoord"
            class="form-input" style="width:100%; box-sizing:border-box;">
          <input type="password" id="pw-new" placeholder="Nieuw wachtwoord"
            class="form-input" style="width:100%; box-sizing:border-box;">
          <input type="password" id="pw-confirm" placeholder="Bevestig nieuw wachtwoord"
            class="form-input" style="width:100%; box-sizing:border-box;">
          <button class="button" onclick="handleChangePasswordSubmit()" style="width:100%; margin-top:8px;">Opslaan</button>
        </div>
      </div>
    </div>
  `
}

async function handleChangePasswordSubmit() {
  const current = document.getElementById('pw-current').value
  const newPw = document.getElementById('pw-new').value
  const confirmPw = document.getElementById('pw-confirm').value

  if (!current || !newPw || !confirmPw) {
    alert('Vul alle velden in')
    return
  }

  if (newPw !== confirmPw) {
    const el = document.getElementById('pw-confirm')
    el.style.borderColor = '#c62828'
    el.value = ''
    el.placeholder = 'Wachtwoorden komen niet overeen'
    setTimeout(() => { el.style.borderColor = ''; el.placeholder = 'Bevestig nieuw wachtwoord' }, 2000)
    return
  }

  const currentHash = await hashPassword(current)
  const { data: userData } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', currentUserId)
    .single()

  if (!userData || userData.password_hash !== currentHash) {
    const el = document.getElementById('pw-current')
    el.style.borderColor = '#c62828'
    el.value = ''
    el.placeholder = 'Huidig wachtwoord klopt niet'
    setTimeout(() => { el.style.borderColor = ''; el.placeholder = 'Huidig wachtwoord' }, 2000)
    return
  }

  const newHash = await hashPassword(newPw)
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', currentUserId)

  if (error) {
    alert('Fout bij opslaan: ' + error.message)
    return
  }

  alert('Wachtwoord gewijzigd!')
  showMyWines()
}

async function showLeaderboard() {
  const app = document.getElementById('app')

  // Get all unique users with scores
  const userScores = {}
  wines.forEach(wine => {
    if (wine.user_id) {
      if (!userScores[wine.user_id]) {
        userScores[wine.user_id] = { scores: [], count: 0 }
      }
      userScores[wine.user_id].count++
      if (wine.ai_score) {
        userScores[wine.user_id].scores.push(wine.ai_score)
      }
    }
  })

  // Haal usernames op voor onbekende user IDs
  const unknownIds = Object.keys(userScores).filter(id => !userCache[id])
  if (unknownIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, username')
      .in('id', unknownIds)
    if (data) data.forEach(u => { userCache[u.id] = u.username })
  }

  // Calculate averages and sort
  const leaderboard = Object.entries(userScores).map(([userId, data]) => {
    const avgScore = data.scores.length > 0
      ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)
      : 0
    return { userId, avgScore: parseFloat(avgScore), scoredCount: data.scores.length, totalCount: data.count }
  }).sort((a, b) => b.avgScore - a.avgScore)
  
  app.innerHTML = `
    <div class="app-outer">
      <div class="app-card">
        <button class="back-link" onclick="switchScreen('lijst')">← Terug naar overzicht</button>

        <h1 class="page-hero-title">Leaderboard</h1>

        <div class="wine-list" id="leaderboard-list"></div>
      </div>
    </div>
  `

  const list = document.getElementById('leaderboard-list')
  if (leaderboard.length === 0) {
    list.innerHTML = '<div class="empty-state">Nog geen scores</div>'
    return
  }

  list.innerHTML = leaderboard.map((entry, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`
    const isMe = entry.userId === currentUserId

    return `
      <div class="wine-card" style="border-left: 4px solid ${isMe ? '#FFD700' : 'var(--color-border)'};">
        <div class="flex-between">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 26px;">${medal}</div>
            <div>
              <div class="wine-card-title">${isMe ? 'Jij' : (userCache[entry.userId] || 'Onbekend')}</div>
              <div class="wine-card-meta">${entry.scoredCount}/${entry.totalCount} wijnen beoordeeld</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 28px; font-weight: bold; color: var(--color-accent-yellow);">${entry.avgScore}</div>
            <div class="wine-card-meta">gemiddeld</div>
          </div>
        </div>
      </div>
    `
  }).join('')
}

function filterAndSearch() {
  const searchInput = document.getElementById('search')
  currentSearch = searchInput ? searchInput.value.toLowerCase() : ''
  
  const uniqueWines = [...new Map(wines.map(w => [w.wine_id, w])).values()]
  
  let filtered = currentFilter 
    ? uniqueWines.filter(w => w.druif === currentFilter)
    : uniqueWines
  
  if (currentSearch) {
    filtered = filtered.filter(w => 
      (w.naam && w.naam.toLowerCase().includes(currentSearch)) ||
      (w.druif && w.druif.toLowerCase().includes(currentSearch)) ||
      (w.regio && w.regio.toLowerCase().includes(currentSearch))
    )
  }
  
  const list = document.getElementById('wine-list')
  if (!list) return
  
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">Geen wijnen gevonden</div>'
  } else {
    list.innerHTML = filtered.map(w => {
      const allNotesForWine = wines.filter(note => note.wine_id === w.wine_id)
      const count = allNotesForWine.length
      const ratings = allNotesForWine.map(n => n.lekker_rating).filter(Boolean)
      const avgRating = ratings.length > 0
        ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : null

      return `
        <div class="wine-card" onclick="showWineGroupDetail('${w.wine_id}')">
          <div class="flex-between">
            <div>
              <div class="wine-card-title">${w.naam}</div>
              <div class="wine-card-meta">${[w.druif, w.regio, w.jaar].filter(Boolean).join(' · ')}</div>
              <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
                <span class="note-badge">${count} notitie${count !== 1 ? 's' : ''}</span>
                ${avgRating ? miniGlassRating(avgRating) : ''}
              </div>
            </div>
            <div class="wine-chevron">›</div>
          </div>
        </div>
      `
    }).join('')
  }
}

async function showWineGroupDetail(wineId) {
  const allNotes = getWineNotes(wineId)
  if (allNotes.length === 0) return

  const firstNote = allNotes[0]
  const myNote = allNotes.find(n => n.user_id === currentUserId)

  // Haal usernames op voor alle unieke users in deze notities
  const unknownIds = [...new Set(allNotes.map(n => n.user_id))].filter(id => !userCache[id])
  if (unknownIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, username')
      .in('id', unknownIds)
    if (data) data.forEach(u => { userCache[u.id] = u.username })
  }

  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="app-outer">
      <div class="app-card">
        <button class="back-link" onclick="switchScreen('lijst')">← Terug naar overzicht</button>

        <h2 style="color: var(--color-primary-dark-pink); text-align: center; font-size: 26px; margin-bottom: 4px;">${firstNote.naam}</h2>
        <div style="text-align: center; font-size: 13px; color: var(--color-text-light); margin-bottom: 20px;">${[firstNote.druif, firstNote.regio, firstNote.jaar].filter(Boolean).join(' · ')}</div>

        <div id="notes-tabs" class="tabs-bar"></div>

        <div id="notes-content"></div>

        <div id="note-actions" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--color-border);"></div>
      </div>
    </div>
  `

  const startNote = myNote || allNotes[0]

  const tabsDiv = document.getElementById('notes-tabs')
  tabsDiv.innerHTML = allNotes.map((note) => {
    const isMe = note.user_id === currentUserId
    const label = isMe ? 'Jij' : (userCache[note.user_id] || 'Onbekend')
    return `
      <button class="filter-chip ${note.id === startNote.id ? 'active' : ''}" data-note-id="${note.id}" onclick="showNoteDetail('${note.id}', '${wineId}')" style="padding: 6px 12px;">
        ${label}
      </button>
    `
  }).join('')

  showNoteDetail(startNote.id, wineId)
}

function showNoteDetail(noteId, wineId) {
  const note = wines.find(w => w.id === noteId)
  if (!note) return

  // Update actieve tab
  document.querySelectorAll('#notes-tabs [data-note-id]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.noteId === noteId)
  })

  const isOwnNote = note.user_id === currentUserId
  const row = (label, val) => val ? `<tr><td style="padding: 8px 0; border-bottom: 0.5px solid var(--color-border); color: #666; width: 120px;">${label}</td><td style="padding: 8px 0; border-bottom: 0.5px solid var(--color-border); font-weight: 500;">${val}</td></tr>` : ''

  const contentDiv = document.getElementById('notes-content')
  contentDiv.innerHTML = `
    <div class="card">
      <div class="section-title">Wijninfo</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Jaar', note.jaar)}
        ${row('Druif', note.druif)}
        ${row('Regio', note.regio)}
        ${row('Prijs', note.prijs)}
        ${row('Gastronomie', note.gastro)}
      </table>
    </div>

    <div class="card">
      <div class="section-title">Uiterlijk</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Helderheid', note.helderheid)}
        ${row('Intensiteit', note.intensiteit)}
        ${row('Kleur', note.kleur)}
      </table>
    </div>

    <div class="card">
      <div class="section-title">Geur</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Conditie', note.conditie)}
        ${row('Intensiteit', note.geur_int)}
        ${row('Aroma' + "'" + 's', note.aroma)}
      </table>
      ${note.notitie_geur ? `<div style="margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 13px;">${note.notitie_geur}</div>` : ''}
    </div>

    <div class="card">
      <div class="section-title">Smaak</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Zoetheid', note.zoetheid)}
        ${row('Zuur', note.zuur)}
        ${row('Tannine', note.tannine)}
        ${row('Body', note.body)}
        ${row('Intensiteit', note.smaak_int)}
        ${row('Smaken', note.smaak)}
        ${row('Afdronk', note.afdronk)}
      </table>
      ${note.notitie_smaak ? `<div style="margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 13px;">${note.notitie_smaak}</div>` : ''}
    </div>

    <div class="card">
      <div class="section-title">Conclusie</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Kwaliteit', note.kwaliteit)}
      </table>
    </div>

    ${(() => {
      if (!isOwnNote) return ''
      if (note.ai_score) {
        return `<div style="margin-top:1rem; padding:14px 16px; background:#e8f5e9; border-radius:8px; display:flex; align-items:center; justify-content:space-between;">
          <span style="color:#2e7d32; font-weight:500;">🔍 AI-score: <strong>${note.ai_score}/10</strong></span>
          <span style="color:#888; font-size:12px;">Pas je notitie aan om opnieuw te beoordelen</span>
        </div>`
      }
      return `<button class="button" onclick="checkWithAI('${note.id}')" style="width: 100%; margin-top: 1rem; background: #e8f5e9; color: #2e7d32; font-weight: 500;">🔍 Laat nakijken door AI-sommelier</button>`
    })()}
  `

  // Actieknoppen onderaan — alleen voor eigen notitie
  const actionsDiv = document.getElementById('note-actions')
  if (actionsDiv) {
    const alreadyHaveOwnNote = wines.some(w => w.wine_id === note.wine_id && w.user_id === currentUserId)
    if (isOwnNote) {
      actionsDiv.innerHTML = `
        <button class="button" onclick="editWine('${note.id}')" style="width: 100%; margin-bottom: 0.5rem;">✏️ Mijn notitie bewerken</button>
        <button class="button" onclick="deleteWine('${note.id}')" style="width: 100%; margin-bottom: 0.5rem; color: #c62828; border-color: #c62828;">🗑️ Notitie verwijderen</button>
        <button class="button" onclick="addNoteToWine('${note.wine_id}')" style="width: 100%;">+ Nog een notitie</button>
      `
    } else if (!alreadyHaveOwnNote) {
      actionsDiv.innerHTML = `
        <button class="button" onclick="addNoteToWine('${note.wine_id}')" style="width: 100%;">+ Voeg jouw notitie toe</button>
      `
    } else {
      actionsDiv.innerHTML = ''
    }
  }
}

function addNoteToWine(wineId) {
  editingWineId = null
  const existingNote = wines.find(w => w.wine_id === wineId)
  if (existingNote) {
    scannedWineData = {
      naam: existingNote.naam,
      druif: existingNote.druif,
      jaar: existingNote.jaar,
      regio: existingNote.regio
    }
  }
  switchScreen('nieuw')
  
  setTimeout(() => {
    if (existingNote) {
      document.getElementById('f-naam').value = existingNote.naam
      document.getElementById('f-jaar').value = existingNote.jaar
      document.getElementById('f-druif').value = existingNote.druif
      document.getElementById('f-regio').value = existingNote.regio
    }
    window.scrollTo(0, 0)
  }, 50)
}

function editWine(noteId) {
  const wine = wines.find(w => w.id === noteId)
  if (!wine) return
  if (wine.user_id !== currentUserId) return
  editingWineId = noteId
  
  switchScreen('nieuw')
  
  setTimeout(() => {
    document.getElementById('f-naam').value = wine.naam
    document.getElementById('f-jaar').value = wine.jaar
    document.getElementById('f-druif').value = wine.druif
    document.getElementById('f-regio').value = wine.regio
    document.getElementById('f-prijs').value = wine.prijs || ''
    document.getElementById('f-gastro').value = wine.gastro || ''
    
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'))
    chipState = {}

    const selectChip = (groupId, value) => {
      document.querySelectorAll(`#chips-${groupId} .chip`).forEach(btn => {
        if (btn.textContent.trim() === value.trim()) {
          btn.classList.add('selected')
          chipState[groupId] = value
        }
      })
    }

    // Chips (categorisch)
    if (wine.helderheid) selectChip('helderheid', wine.helderheid)
    if (wine.kleur) selectChip('kleur', wine.kleur)
    if (wine.conditie) selectChip('conditie', wine.conditie)

    // Schalen (lineair)
    if (wine.intensiteit) selectScaleByValue('intensiteit', wine.intensiteit)
    if (wine.geur_int) selectScaleByValue('geur-int', wine.geur_int)
    if (wine.zoetheid) selectScaleByValue('zoetheid', wine.zoetheid)
    if (wine.zuur) selectScaleByValue('zuur', wine.zuur)
    if (wine.tannine) selectScaleByValue('tannine', wine.tannine)
    if (wine.body) selectScaleByValue('body', wine.body)
    if (wine.smaak_int) selectScaleByValue('smaak-int', wine.smaak_int)
    if (wine.afdronk) selectScaleByValue('afdronk', wine.afdronk)
    if (wine.kwaliteit) selectScaleByValue('kwaliteit', wine.kwaliteit)

    // Wijnglas-rating
    if (wine.lekker_rating) setWineRating(wine.lekker_rating)
    
    if (wine.aroma) {
      const aromaList = wine.aroma.split(', ')
      chipState['aroma'] = aromaList
      document.querySelectorAll('#chips-aroma .chip').forEach(btn => {
        if (aromaList.includes(btn.textContent.trim())) {
          btn.classList.add('selected')
        }
      })
    }
    
    if (wine.smaak) {
      const smaakList = wine.smaak.split(', ')
      chipState['smaak'] = smaakList
      document.querySelectorAll('#chips-smaak .chip').forEach(btn => {
        if (smaakList.includes(btn.textContent.trim())) {
          btn.classList.add('selected')
        }
      })
    }
    
    document.getElementById('f-notitie-geur').value = wine.notitie_geur || ''
    document.getElementById('f-notitie-smaak').value = wine.notitie_smaak || ''
    
    window.scrollTo(0, 0)
  }, 100)
}

function makeScale(group, options) {
  const nodes = options.map(opt =>
    `<div class="scale-node" onclick="selectScale(this,'${group}','${opt}')"><div class="scale-dot"></div><div class="scale-label">${opt}</div></div>`
  ).join('')
  return `<div class="scale-selector" id="scale-${group}"><div class="scale-track-wrapper">${nodes}</div></div>`
}

function miniGlassRating(rating, max = 5) {
  if (!rating) return ''
  const svg = (filled) => `<svg viewBox="0 0 24 42" width="14" height="20" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4C3 14 5 22 12 27C19 22 21 14 20 4Z"/><line x1="12" y1="27" x2="12" y2="38"/><line x1="7" y1="38" x2="17" y2="38"/></svg>`
  const glasses = Array.from({ length: max }, (_, i) =>
    `<span style="color:var(--color-primary-pink);opacity:${i < rating ? '1' : '0.2'}">${svg(i < rating)}</span>`
  ).join('')
  return `<div style="display:flex;gap:1px;align-items:center;">${glasses}</div>`
}

function makeWineRating() {
  const glassSvg = `<svg viewBox="0 0 24 42" width="34" height="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path class="glass-fill" d="M4 4C3 14 5 22 12 27C19 22 21 14 20 4Z"/><line x1="12" y1="27" x2="12" y2="38"/><line x1="7" y1="38" x2="17" y2="38"/></svg>`
  return `<div class="wineglass-rating" id="rating-lekker">${[1,2,3,4,5].map(n => `<div class="wineglass-item" onclick="setWineRating(${n})">${glassSvg}</div>`).join('')}</div>`
}

function renderForm(container) {
  const isEditing = editingWineId !== null;

  container.innerHTML = `
    <div class="app-outer">
      <div class="app-card">
        <button class="back-link" onclick="switchScreen('lijst')">← Terug naar overzicht</button>

        <h1 class="page-hero-title">${isEditing ? 'Bewerken' : 'Proefnotitie'}</h1>

        <!-- WIJNINFO -->
        <div class="card">
          <div class="section-title">Wijninfo</div>
          <div class="field">
            <label>Naam wijn</label>
            <input type="text" id="f-naam" placeholder="bijv. Château Margaux">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="field">
              <label>Oogstjaar</label>
              <input type="text" id="f-jaar" placeholder="2021">
            </div>
            <div class="field">
              <label>Druif / Druiven</label>
              <input type="text" id="f-druif" placeholder="bijv. Merlot">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="field">
              <label>Land / Gebied</label>
              <input type="text" id="f-regio" placeholder="bijv. Bordeaux">
            </div>
            <div class="field">
              <label>Consumentenprijs</label>
              <input type="text" id="f-prijs" placeholder="bijv. €25">
            </div>
          </div>
          <div class="field">
            <label>Gastronomie / Pairing</label>
            <input type="text" id="f-gastro" placeholder="bijv. Lam, kaas">
          </div>
          <button class="scan-btn" onclick="switchScreen('scan')">📷 Of scan het etiket hier</button>
        </div>

        <!-- UITERLIJK -->
        <div class="card">
          <div class="section-title">Uiterlijk</div>

          <div class="field">
            <label>Helderheid</label>
            <div class="chip-group" id="chips-helderheid">
              <button class="chip" onclick="toggleChip(this, 'helderheid')">Helder</button>
              <button class="chip" onclick="toggleChip(this, 'helderheid')">Troebel</button>
            </div>
          </div>

          <div class="field">
            <label>Intensiteit</label>
            ${makeScale('intensiteit', ['Licht', 'Gemiddeld', 'Diep'])}
          </div>

          <div class="field">
            <label>Kleur</label>
            <div class="chip-group-section">
              <div class="chip-group-section-label">Wit</div>
              <div class="chip-group" id="chips-kleur">
                <button class="chip" onclick="toggleChip(this, 'kleur')">Groengeel</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Citroengeel</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Goudgeel</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Ambergeel</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Bruin</button>
              </div>
            </div>
            <div class="chip-group-section">
              <div class="chip-group-section-label">Rosé</div>
              <div class="chip-group" id="chips-kleur">
                <button class="chip" onclick="toggleChip(this, 'kleur')">Roze</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Oranjeroze</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Oranje</button>
              </div>
            </div>
            <div class="chip-group-section">
              <div class="chip-group-section-label">Rood</div>
              <div class="chip-group" id="chips-kleur">
                <button class="chip" onclick="toggleChip(this, 'kleur')">Paars</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Robijnrood</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Granaatrood</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Bruinrood</button>
                <button class="chip" onclick="toggleChip(this, 'kleur')">Bruin</button>
              </div>
            </div>
          </div>
        </div>

        <!-- GEUR -->
        <div class="card">
          <div class="section-title">Geur</div>

          <div class="field">
            <label>Conditie</label>
            <div class="chip-group" id="chips-conditie">
              <button class="chip" onclick="toggleChip(this, 'conditie')">Zuiver</button>
              <button class="chip" onclick="toggleChip(this, 'conditie')">Onzuiver</button>
            </div>
          </div>

          <div class="field">
            <label>Intensiteit</label>
            ${makeScale('geur-int', ['Licht', 'Gemiddeld', 'Sterk'])}
          </div>

          <div class="field">
            <label>Aromakenmerken (meerdere mogelijk)</label>
            <div class="chip-group" id="chips-aroma">
              <button class="chip" onclick="toggleChip(this, 'aroma')">Fruit</button>
              <button class="chip" onclick="toggleChip(this, 'aroma')">Bloemen & kruiden</button>
              <button class="chip" onclick="toggleChip(this, 'aroma')">Vegetaal & noten</button>
              <button class="chip" onclick="toggleChip(this, 'aroma')">Dierlijk</button>
              <button class="chip" onclick="toggleChip(this, 'aroma')">Hout & toast</button>
              <button class="chip" onclick="toggleChip(this, 'aroma')">Aards & chemisch</button>
            </div>
          </div>

          <div class="field">
            <label>Notitie</label>
            <textarea id="f-notitie-geur" placeholder="Beschrijf de geuren in detail..."></textarea>
          </div>
        </div>

        <!-- SMAAK -->
        <div class="card">
          <div class="section-title">Smaak</div>

          <div class="field">
            <label>Zoetheid</label>
            ${makeScale('zoetheid', ['Droog', 'Iets zoet', 'Halfzoet', 'Zoet'])}
          </div>

          <div class="field">
            <label>Zuur</label>
            ${makeScale('zuur', ['Laag', 'Gemiddeld', 'Hoog'])}
          </div>

          <div class="field">
            <label>Tannine</label>
            ${makeScale('tannine', ['Geen', 'Laag', 'Gemiddeld', 'Hoog'])}
          </div>

          <div class="field">
            <label>Body</label>
            ${makeScale('body', ['Licht', 'Gemiddeld', 'Vol'])}
          </div>

          <div class="field">
            <label>Smaakintensiteit</label>
            ${makeScale('smaak-int', ['Licht', 'Gemiddeld', 'Sterk'])}
          </div>

          <div class="field">
            <label>Smaakkenmerken (meerdere mogelijk)</label>
            <div class="chip-group" id="chips-smaak">
              <button class="chip" onclick="toggleChip(this, 'smaak')">Fruit</button>
              <button class="chip" onclick="toggleChip(this, 'smaak')">Bloemen & kruiden</button>
              <button class="chip" onclick="toggleChip(this, 'smaak')">Vegetaal & noten</button>
              <button class="chip" onclick="toggleChip(this, 'smaak')">Dierlijk</button>
              <button class="chip" onclick="toggleChip(this, 'smaak')">Hout & toast</button>
              <button class="chip" onclick="toggleChip(this, 'smaak')">Aards & chemisch</button>
            </div>
          </div>

          <div class="field">
            <label>Afdronk</label>
            ${makeScale('afdronk', ['Kort', 'Gemiddeld', 'Lang'])}
          </div>

          <div class="field">
            <label>Notitie</label>
            <textarea id="f-notitie-smaak" placeholder="Beschrijf de smaken en afwerking in detail..."></textarea>
          </div>
        </div>

        <!-- CONCLUSIE -->
        <div class="card">
          <div class="section-title">Conclusie</div>

          <div class="field">
            <label>Kwaliteit</label>
            ${makeScale('kwaliteit', ['Slecht', 'Redelijk', 'Goed', 'Heel goed', 'Voortreffelijk'])}
          </div>

          <div class="field" style="margin-top: 24px;">
            <label style="text-align: center; display: block; margin-bottom: 16px; font-size: 15px;">Jouw persoonlijke rating</label>
            ${makeWineRating()}
          </div>
        </div>

        <button class="button" onclick="saveWine()" style="width: 100%;">${isEditing ? 'Wijzigingen opslaan' : 'Opslaan'}</button>
        <button class="button" onclick="switchScreen('lijst')" style="width: 100%; margin-top: 0.5rem;">Annuleren</button>
      </div>
    </div>
  `;

  setupChips();
}

function renderScan(container) {
  container.innerHTML = `
    <div class="app-outer">
      <div class="app-card">
        <button class="back-link" onclick="switchScreen('nieuw')">← Terug naar formulier</button>

        <h1 class="page-hero-title">Etiket scannen</h1>

        <div class="card">
          <div class="upload-zone" onclick="document.getElementById('img-input').click()">
            <span class="upload-zone-icon">📸</span>
            <div class="upload-zone-label">Upload een foto van het etiket</div>
          </div>

          <input type="file" id="img-input" accept="image/*" style="display: none;" onchange="handleImageUpload(event)">

          <div id="preview" style="display: none; margin-top: 1rem;">
            <img id="preview-img" style="width: 100%; max-height: 200px; object-fit: contain; border-radius: var(--radius-md);">
          </div>

          <button id="analyze-btn" class="button" onclick="analyzeLabel()" style="width: 100%; display: none; margin-top: 0.5rem;">Analyseer met AI</button>

          <div id="scan-status" style="display: none; margin-top: 1rem; padding: 1rem; background: white; border-radius: var(--radius-md); border: 2px solid var(--color-border);">
            <div id="scan-result-text"></div>
            <button id="use-btn" class="button" onclick="useScannedWine()" style="width: 100%; margin-top: 0.5rem; display: none;">→ Gebruik in formulier</button>
          </div>
        </div>
      </div>
    </div>
  `
}

function useScannedWine() {
  if (!scannedWineData) return
  
  editingWineId = null
  switchScreen('nieuw')
  
  setTimeout(() => {
    if (scannedWineData.naam) document.getElementById('f-naam').value = scannedWineData.naam
    if (scannedWineData.druif) document.getElementById('f-druif').value = scannedWineData.druif
    if (scannedWineData.jaar) document.getElementById('f-jaar').value = scannedWineData.jaar
    if (scannedWineData.regio) document.getElementById('f-regio').value = scannedWineData.regio
    
    window.scrollTo(0, 0)
  }, 100)
}

function setupChips() {
  // Chips werken via inline onclick handlers
  // Kan later uitgebreid worden voor meer complex behavior
}

function toggleChip(el, group) {
  const multiSelect = ['aroma', 'smaak'].includes(group)

  if (!multiSelect) {
    const isAlreadySelected = el.classList.contains('selected')
    document.querySelectorAll(`#chips-${group} .chip.selected`).forEach(c => {
      c.classList.remove('selected')
    })
    if (!isAlreadySelected) {
      el.classList.add('selected')
      chipState[group] = el.textContent.trim()
    } else {
      delete chipState[group]
    }
  } else {
    el.classList.toggle('selected')
    if (!chipState[group]) chipState[group] = []
    const text = el.textContent.trim()
    if (el.classList.contains('selected')) {
      if (!chipState[group].includes(text)) chipState[group].push(text)
    } else {
      chipState[group] = chipState[group].filter(x => x !== text)
    }
  }
}

function getChips(group) {
  const v = chipState[group]
  if (!v) return ''
  return Array.isArray(v) ? v.join(', ') : v
}

function selectScale(el, group, value) {
  const nodes = [...document.querySelectorAll(`#scale-${group} .scale-node`)]
  const idx = nodes.indexOf(el)
  const isAlreadySelected = el.classList.contains('selected')

  nodes.forEach(n => n.classList.remove('filled', 'selected'))

  if (!isAlreadySelected) {
    nodes.forEach((n, i) => {
      if (i === idx) n.classList.add('selected')
    })
    chipState[group] = value
  } else {
    delete chipState[group]
  }
}

function selectScaleByValue(group, value) {
  const nodes = [...document.querySelectorAll(`#scale-${group} .scale-node`)]
  const idx = nodes.findIndex(n => n.querySelector('.scale-label')?.textContent.trim() === value)
  if (idx !== -1) selectScale(nodes[idx], group, value)
}

function setWineRating(value) {
  const isAlreadySelected = chipState['lekker_rating'] === value
  if (isAlreadySelected) {
    chipState['lekker_rating'] = null
    document.querySelectorAll('.wineglass-item').forEach(el => el.classList.remove('active'))
  } else {
    chipState['lekker_rating'] = value
    document.querySelectorAll('.wineglass-item').forEach((el, i) => {
      el.classList.toggle('active', i < value)
    })
  }
}

async function saveWine() {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    alert('No user found')
    return
  }
  
  const naam = document.getElementById('f-naam').value.trim()
  if (!naam) {
    alert('Vul minimaal de naam in')
    return
  }
  const druif = document.getElementById('f-druif').value.trim()
  const jaar = document.getElementById('f-jaar').value.trim()
  const regio = document.getElementById('f-regio').value.trim()  
  const wineId = generateWineId(naam, druif, jaar, regio)
  
  if (editingWineId) {
    // EDIT MODE
    const wineIdx = wines.findIndex(w => w.id === editingWineId)
    if (wineIdx === -1) return
    const updatedWine = {
      ...wines[wineIdx],
      naam,
      druif,
      jaar,
      regio,
      wine_id: wineId,
      prijs: document.getElementById('f-prijs').value.trim(),
      gastro: document.getElementById('f-gastro').value.trim(),
      helderheid: getChips('helderheid'),
      intensiteit: getChips('intensiteit'),
      kleur: getChips('kleur'),
      conditie: getChips('conditie'),
      geur_int: getChips('geur-int'),
      aroma: getChips('aroma'),
      notitie_geur: document.getElementById('f-notitie-geur').value.trim(),
      zoetheid: getChips('zoetheid'),
      zuur: getChips('zuur'),
      tannine: getChips('tannine'),
      body: getChips('body'),
      smaak_int: getChips('smaak-int'),
      smaak: getChips('smaak'),
      afdronk: getChips('afdronk'),
      notitie_smaak: document.getElementById('f-notitie-smaak').value.trim(),
      kwaliteit: getChips('kwaliteit'),
      lekker_rating: chipState['lekker_rating'] || null,
      updated_at: new Date().toISOString(),
      ai_score: null,
      ai_score_date: null
    }

    wines[wineIdx] = updatedWine
    
    const { error } = await supabase
      .from('wines')
      .update(updatedWine)
      .eq('id', editingWineId)
    
    if (error) {
      alert('Fout bij opslaan: ' + error.message)
      return
    }
    
    editingWineId = null
  } else {
    // NEW MODE
    const existingWine = findExistingWine(naam, druif, jaar, regio)
    
    if (existingWine) {
      const confirmed = confirm(`Deze wijn bestaat al. Wil je een nieuwe notitie toevoegen?`)
      if (!confirmed) {
        resetForm()
        return
      }
    }
    
    const wine = {
      id: crypto.randomUUID(),
      wine_id: wineId,
      naam,
      druif,
      jaar,
      regio,
      prijs: document.getElementById('f-prijs').value.trim(),
      gastro: document.getElementById('f-gastro').value.trim(),
      helderheid: getChips('helderheid'),
      intensiteit: getChips('intensiteit'),
      kleur: getChips('kleur'),
      conditie: getChips('conditie'),
      geur_int: getChips('geur-int'),
      aroma: getChips('aroma'),
      notitie_geur: document.getElementById('f-notitie-geur').value.trim(),
      zoetheid: getChips('zoetheid'),
      zuur: getChips('zuur'),
      tannine: getChips('tannine'),
      body: getChips('body'),
      smaak_int: getChips('smaak-int'),
      smaak: getChips('smaak'),
      afdronk: getChips('afdronk'),
      notitie_smaak: document.getElementById('f-notitie-smaak').value.trim(),
      kwaliteit: getChips('kwaliteit'),
      lekker_rating: chipState['lekker_rating'] || null,
      user_id: currentUserId,
      ai_score: null,
      ai_score_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('wines')
      .insert([wine])
    
    if (error) {
      alert('Fout bij opslaan: ' + error.message)
      return  // NIET toevoegen aan array
    }
    
    // Nu pas toevoegen
    wines.unshift(wine)
  }
  
  resetForm()
  switchScreen('lijst')
}

function resetForm() {
  ['f-naam', 'f-jaar', 'f-druif', 'f-regio', 'f-prijs', 'f-gastro', 'f-notitie-geur', 'f-notitie-smaak'].forEach(id => {
    const el = document.getElementById(id)
    if (el) el.value = ''
  })
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'))
  chipState = {}
}

function switchScreen(screen) {
  currentScreen = screen
  render()
}

async function deleteWine(id) {
  const wine = wines.find(w => w.id === id)
  if (!wine || wine.user_id !== currentUserId) return
  if (confirm('Weet je zeker dat je deze notitie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
    wines = wines.filter(w => w.id !== id)
    
    const { error } = await supabase
      .from('wines')
      .delete()
      .eq('id', id)
    
    if (error) {
      alert('Fout bij verwijderen')
      return
    }
    
    switchScreen('lijst')
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target.result
    const mediaType = file.type || 'image/jpeg'
    scannedWineData = { 
      base64: result.split(',')[1],
      mediaType: mediaType
    }
    document.getElementById('preview-img').src = result
    document.getElementById('preview').style.display = 'block'
    document.getElementById('analyze-btn').style.display = 'block'
  }
  reader.readAsDataURL(file)
}

async function analyzeWithGemini(imageBase64, mediaType) {
  try {
    const response = await fetch('/api/analyze-wine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mediaType, analyzeType: 'label' })
    })

    if (!response.ok) throw new Error('Server error')
    return await response.json()
  } catch (err) {
    throw new Error('Kon etiket niet herkennen')
  }
}

async function analyzeLabel() {
  if (!scannedWineData) return
  
  const analyzeBtn = document.getElementById('analyze-btn')
  const status = document.getElementById('scan-status')
  const resultText = document.getElementById('scan-result-text')
  const useBtn = document.getElementById('use-btn')
  
  analyzeBtn.disabled = true
  analyzeBtn.style.opacity = '0.5'
  
  status.style.display = 'block'
  resultText.innerHTML = 'AI analyseert het etiket...'
  useBtn.style.display = 'none'
  
  try {
    const info = await analyzeWithGemini(scannedWineData.base64, scannedWineData.mediaType)
    scannedWineData = { ...scannedWineData, ...info }
    
    const confidenceLabel = info.confidence === 'high' ? '✓ Zeker gevonden' : info.confidence === 'medium' ? '~ Waarschijnlijk gevonden' : '? Onzeker'
    const confidenceColor = info.confidence === 'high' ? '#2e7d32' : info.confidence === 'medium' ? '#e65100' : '#c62828'
    resultText.innerHTML = `
      <strong>${info.naam || '?'}</strong><br>
      <span style="color:#666;">${[info.druif, info.regio, info.jaar].filter(Boolean).join(' · ')}</span>
      ${info.beschrijving ? `<br><span style="color:#888; font-size:12px; font-style:italic;">${info.beschrijving}</span>` : ''}
      <br><span style="font-size:11px; color:${confidenceColor};">${confidenceLabel}</span>
    `
    useBtn.style.display = 'block'
  } catch (err) {
    resultText.innerHTML = `<span style="color: #c62828;">${err.message}</span>`
    analyzeBtn.disabled = false
    analyzeBtn.style.opacity = '1'
  }
}

async function checkWithAI(noteId) {
  const wine = wines.find(w => w.id === noteId)
  if (!wine) return
  
  const app = document.getElementById('app')
  let resultDiv = document.getElementById('ai-check-result')
  
  if (!resultDiv) {
    resultDiv = document.createElement('div')
    resultDiv.id = 'ai-check-result'
    resultDiv.style.marginTop = '1rem'
    resultDiv.style.padding = '1.5rem'
    resultDiv.style.background = '#f5f5f5'
    resultDiv.style.borderRadius = '4px'
    resultDiv.style.border = '2px solid #4caf50'
    app.appendChild(resultDiv)
  }
  
  resultDiv.innerHTML = 'AI analyseert jouw notitie...'
  
  try {
    const userNotes = `
Uiterlijk: ${wine.kleur} | ${wine.helderheid}
Neus: ${wine.aroma}
Notitie geur: ${wine.notitie_geur}
Smaak: ${wine.smaak} | Body: ${wine.body} | Zuur: ${wine.zuur}
Notitie smaak: ${wine.notitie_smaak}
Kwaliteit: ${wine.kwaliteit}
`
    
    const wineInfo = {
      naam: wine.naam,
      jaar: wine.jaar,
      druif: wine.druif,
      regio: wine.regio
    }

    const response = await fetch('/api/check-wine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wineInfo, userNotes })
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      throw new Error(errBody.error || `Server error ${response.status}`)
    }

    const result = await response.json()

    if (result.error === 'wine_not_found') {
      resultDiv.innerHTML = `
        <div style="color:#c62828; font-weight:bold; margin-bottom:0.5rem;">⚠️ Wijn niet herkend</div>
        <div style="font-size:13px; color:#666; line-height:1.6;">${result.message}</div>
      `
      return
    }

    const { feedback, score } = result

    if (score > 0) {
      wine.ai_score = score
      wine.ai_score_date = new Date().toISOString()
      
      const { error } = await supabase
        .from('wines')
        .update({ ai_score: score, ai_score_date: wine.ai_score_date })
        .eq('id', wine.id)
    }
    resultDiv.innerHTML = `
      <div style="color: #4caf50; font-weight: bold; margin-bottom: 1rem;">✓ AI FEEDBACK</div>
      ${feedback.split('\n').map(line => {
        if (line.includes('**')) {
          return `<div style="font-weight: 500; margin-top: 0.75rem; font-size: 13px;">${line.replace(/\*\*/g, '')}</div>`
        }
        if (line.trim() === '') return ''
        return `<div style="font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 0.5rem;">${line}</div>`
      }).join('')}
    `
  } catch (err) {
    resultDiv.innerHTML = `<span style="color: #c62828;">❌ Fout: ${err.message}</span>`
  }
}

// ============= LOGOUT =============

function handleLogout() {
  isLoggedIn = false
  currentUserId = null
  localStorage.removeItem('wset_user_id')
  wines = []
  currentFilter = null
  currentSearch = ''
  showLoginScreen()
}

// ============= INIT =============

async function init() {
  const savedUserId = localStorage.getItem('wset_user_id')
  if (savedUserId) {
    currentUserId = savedUserId
    isLoggedIn = true
  }

  await loadWines()

  if (!isLoggedIn) {
    showLoginScreen()
  } else {
    render()
  }
}


document.addEventListener('DOMContentLoaded', init)

// Global functions
window.handleLogin = handleLogin
window.switchScreen = switchScreen
window.saveWine = saveWine
window.deleteWine = deleteWine
window.toggleChip = toggleChip
window.handleImageUpload = handleImageUpload
window.analyzeLabel = analyzeLabel
window.useScannedWine = useScannedWine
window.render = render
window.filterAndSearch = filterAndSearch
window.checkWithAI = checkWithAI
window.showWineGroupDetail = showWineGroupDetail
window.showNoteDetail = showNoteDetail
window.addNoteToWine = addNoteToWine
window.editWine = editWine
window.showSignupScreen = showSignupScreen
window.handleSignup = handleSignup
window.showMyWines = showMyWines
window.showChangePassword = showChangePassword
window.handleChangePasswordSubmit = handleChangePasswordSubmit
window.selectScale = selectScale
window.setWineRating = setWineRating
window.showLeaderboard = showLeaderboard
window.handleLogout = handleLogout
window.showLoginScreen = showLoginScreen