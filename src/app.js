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

// ============= LOGIN SCREEN =============

function getCurrentUserId() {
  return currentUserId
}

function showLoginScreen() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div style="display: flex; min-height: 100vh; background: linear-gradient(90deg, #FFE6E6 0%, #FFE6E6 50%, #FF9999 50%, #FF9999 100%); margin: 0; padding: 0;">
      
      <!-- Links: Form -->
      <div style="width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px; position: relative;">
        <div style="text-align: center; width: 100%;">
          <h1 style="margin: 0 0 0 0; font-size: 120px; font-weight: bold; color: var(--color-accent-yellow); text-shadow: 6px 6px 0px #8B4513; letter-spacing: 8px;">WSET</h1>
          <div style="font-family: var(--font-family-heading); font-size: 36px; font-weight: bold; color: var(--color-accent-yellow); text-shadow: 4px 4px 0px #8B4513; letter-spacing: 4px; margin-bottom: 60px;">PROEFMETHODE</div>
          
          <input type="text" id="login-username" placeholder="Username" style="width: 100%; padding: 18px 20px; margin-bottom: 16px; border: 3px solid #D67A7A; border-radius: 8px; background: rgba(255, 153, 153, 0.6); color: white; font-size: 18px; font-family: var(--font-family-main); font-weight: 500;" onfocus="this.style.color='white'" onblur="this.style.color='white'">
          
          <input type="password" id="login-password" placeholder="Wachtwoord" style="width: 100%; padding: 18px 20px; margin-bottom: 12px; border: 3px solid #D67A7A; border-radius: 8px; background: rgba(255, 153, 153, 0.6); color: white; font-size: 18px; font-family: var(--font-family-main); font-weight: 500;" onfocus="this.style.color='white'" onblur="this.style.color='white'">
          
          <style>
            #login-username::placeholder, #login-password::placeholder {
              color: white !important;
              opacity: 0.9;
            }
          </style>
          
          <div style="text-align: right; margin-bottom: 40px; font-size: 16px;">
            <a onclick="alert('Coming soon')" style="color: var(--color-primary-pink); cursor: pointer; text-decoration: none; font-weight: 600;">Wachtwoord vergeten?</a>
          </div>
          
          <button onclick="handleLogin()" style="width: 100%; padding: 20px; background: white; color: var(--color-primary-pink); border: 3px solid var(--color-primary-pink); border-radius: 8px; font-size: 20px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">Login</button>
          
          <div style="text-align: center; margin-top: 24px; font-size: 16px; color: var(--color-text-dark);">
            Of <a onclick="showSignupScreen()" style="color: var(--color-primary-pink); cursor: pointer; text-decoration: none; font-weight: 600;">maak hier een account aan</a>
          </div>
        </div>
      </div>
      
      <!-- Rechts: Wine Glasses Logo -->
      <div style="width: 50%; display: flex; justify-content: center; align-items: center; padding: 60px;">
        <svg viewBox="0 0 300 350" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 350px; height: auto;">
          <!-- Champagne Flute (left) -->
          <g>
            <path d="M 40 80 L 35 160" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 70 80 L 75 160" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 35 160 Q 30 175 40 185" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 75 160 Q 80 175 70 185" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 40 80 Q 55 70 70 80" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="55" y1="185" x2="55" y2="260" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="55" cy="275" rx="22" ry="8" stroke="white" stroke-width="4" fill="none"/>
          </g>
          
          <!-- Wine Glass (middle) -->
          <g>
            <path d="M 110 60 L 100 180" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 170 60 L 180 180" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 100 180 Q 90 200 120 210" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 180 180 Q 190 200 160 210" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 110 60 Q 140 45 170 60" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="140" y1="210" x2="140" y2="280" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="140" cy="295" rx="26" ry="9" stroke="white" stroke-width="4" fill="none"/>
          </g>
          
          <!-- Wine Bottle (right) -->
          <g>
            <ellipse cx="240" cy="45" rx="15" ry="10" stroke="white" stroke-width="4" fill="none"/>
            <path d="M 230 55 L 225 100" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 250 55 L 255 100" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 225 100 Q 210 130 205 160" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 255 100 Q 270 130 275 160" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 205 160 L 200 280" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 275 160 L 280 280" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 200 280 Q 195 305 240 320" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 280 280 Q 285 305 240 320" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <ellipse cx="240" cy="320" rx="18" ry="6" stroke="white" stroke-width="4" fill="none"/>
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
    <div style="display: flex; min-height: 100vh; background: linear-gradient(90deg, #FFE6E6 0%, #FFE6E6 50%, #FF9999 50%, #FF9999 100%); margin: 0; padding: 0;">
      
      <!-- Links: Form -->
      <div style="width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px; position: relative;">
        <div style="text-align: center; width: 100%;">
          <h1 style="margin: 0 0 0 0; font-size: 120px; font-weight: bold; color: var(--color-accent-yellow); text-shadow: 6px 6px 0px #8B4513; letter-spacing: 8px;">WSET</h1>
          <div style="font-family: var(--font-family-heading); font-size: 36px; font-weight: bold; color: var(--color-accent-yellow); text-shadow: 4px 4px 0px #8B4513; letter-spacing: 4px; margin-bottom: 60px;">PROEFMETHODE</div>
          
          <input type="text" id="signup-username" placeholder="Kies je username" style="width: 100%; padding: 18px 20px; margin-bottom: 40px; border: 3px solid #D67A7A; border-radius: 8px; background: rgba(255, 153, 153, 0.6); color: white; font-size: 18px; font-family: var(--font-family-main); font-weight: 500;" onfocus="this.style.color='white'" onblur="this.style.color='white'">
          
          <style>
            #signup-username::placeholder {
              color: white !important;
              opacity: 0.9;
            }
          </style>
          
          <button onclick="handleSignup()" style="width: 100%; padding: 20px; background: white; color: var(--color-primary-pink); border: 3px solid var(--color-primary-pink); border-radius: 8px; font-size: 20px; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">Account maken</button>
          
          <div style="text-align: center; margin-top: 24px; font-size: 16px; color: var(--color-text-dark);">
            <a onclick="showLoginScreen()" style="color: var(--color-primary-pink); cursor: pointer; text-decoration: none; font-weight: 600;">Terug naar login</a>
          </div>
        </div>
      </div>
      
      <!-- Rechts: Wine Glasses Logo -->
      <div style="width: 50%; display: flex; justify-content: center; align-items: center; padding: 60px;">
        <svg viewBox="0 0 300 350" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 350px; height: auto;">
          <!-- Champagne Flute (left) -->
          <g>
            <path d="M 40 80 L 35 160" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 70 80 L 75 160" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 35 160 Q 30 175 40 185" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 75 160 Q 80 175 70 185" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 40 80 Q 55 70 70 80" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="55" y1="185" x2="55" y2="260" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="55" cy="275" rx="22" ry="8" stroke="white" stroke-width="4" fill="none"/>
          </g>
          
          <!-- Wine Glass (middle) -->
          <g>
            <path d="M 110 60 L 100 180" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 170 60 L 180 180" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 100 180 Q 90 200 120 210" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 180 180 Q 190 200 160 210" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 110 60 Q 140 45 170 60" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <line x1="140" y1="210" x2="140" y2="280" stroke="white" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="140" cy="295" rx="26" ry="9" stroke="white" stroke-width="4" fill="none"/>
          </g>
          
          <!-- Wine Bottle (right) -->
          <g>
            <ellipse cx="240" cy="45" rx="15" ry="10" stroke="white" stroke-width="4" fill="none"/>
            <path d="M 230 55 L 225 100" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 250 55 L 255 100" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 225 100 Q 210 130 205 160" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 255 100 Q 270 130 275 160" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 205 160 L 200 280" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 275 160 L 280 280" stroke="white" stroke-width="5" stroke-linecap="round"/>
            <path d="M 200 280 Q 195 305 240 320" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 280 280 Q 285 305 240 320" stroke="white" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <ellipse cx="240" cy="320" rx="18" ry="6" stroke="white" stroke-width="4" fill="none"/>
          </g>
        </svg>
      </div>
    </div>
  `
  
  document.getElementById('signup-username').focus()
}

async function handleLogin() {
  const username = document.getElementById('login-username').value.trim()
  const password = document.getElementById('login-password').value.toLowerCase()
  
  if (!username) {
    alert('Vul username in')
    return
  }
  
  if (password !== 'girlie') {
    const input = document.getElementById('login-password')
    input.style.borderColor = '#c62828'
    input.value = ''
    input.placeholder = 'Wrong password'
    setTimeout(() => {
      input.style.borderColor = 'var(--color-border)'
      input.placeholder = 'girlie'
    }, 2000)
    return
  }
  
  // Check username
  const { data: user, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()
  
  if (error || !user) {
    alert('Username niet gevonden')
    return
  }
  
  // Success!
  currentUserId = user.id
  isLoggedIn = true
  render()
}

async function handleSignup() {
  const username = document.getElementById('signup-username').value.trim()
  
  if (!username) {
    alert('Vul username in')
    return
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert([{
      username,
      email: username + '@local',
      password_hash: 'placeholder'
    }])
    .select()
  
  if (error) {
    alert('Fout: ' + error.message)
    return
  }
  
  alert('Account gemaakt! Log in.')
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
    <div class="app">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h1>Alle wijnen</h1>
        <div style="display: flex; gap: 8px;">
          <button class="button" onclick="switchScreen('nieuw')" style="font-size: 14px; padding: 8px 12px;">+ Nieuwe notitie</button>
          <button class="button" onclick="showMyWines()" style="font-size: 14px; padding: 8px 12px;">👤 Mijn wijnen</button>
        </div>
      </div>
      
      <input type="text" id="search" placeholder="Zoek op naam, druif, regio..." style="width: 100%; margin-bottom: 1rem; padding: 8px; border: 0.5px solid var(--color-border); border-radius: 4px;" oninput="filterAndSearch()">
      
      <div id="filters" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1rem;"></div>
      
      <div class="wine-list" id="wine-list"></div>
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

function showMyWines() {
  const myWines = wines.filter(w => w.user_id === currentUserId)
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="app">
      <button class="button" onclick="switchScreen('lijst')" style="margin-bottom: 1rem;">← Terug naar alle wijnen</button>
      
      <h2>Mijn wijnen</h2>
      <div class="wine-list" id="my-wines"></div>
    </div>
  `
  
  const list = document.getElementById('my-wines')
  if (myWines.length === 0) {
    list.innerHTML = '<div class="empty-state">Je hebt nog geen wijnen geproefd</div>'
  } else {
    list.innerHTML = myWines.map(w => `
      <div class="wine-card" onclick="showWineGroupDetail('${w.wine_id}')">
        <div style="font-weight: 500;">${w.naam}</div>
        <div style="font-size: 12px; color: #666;">
          ${[w.druif, w.regio, w.jaar].filter(Boolean).join(' · ')}
        </div>
        <div style="font-size: 11px; color: #999; margin-top: 4px;">
          ${w.created_at ? new Date(w.created_at).toLocaleDateString('nl-NL') : ''}
        </div>
      </div>
    `).join('')
  }
}

function showLeaderboard() {
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
  
  // Calculate averages and sort
  const leaderboard = Object.entries(userScores).map(([userId, data]) => {
    const avgScore = data.scores.length > 0 
      ? (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(1)
      : 0
    return { userId, avgScore: parseFloat(avgScore), scoredCount: data.scores.length, totalCount: data.count }
  }).sort((a, b) => b.avgScore - a.avgScore)
  
  app.innerHTML = `
    <div class="app">
      <button class="button" onclick="switchScreen('lijst')" style="margin-bottom: 1rem;">← Terug naar wijnen</button>
      
      <h1 style="text-align: center; color: #FFD700; text-shadow: 2px 2px 0px #FF9999; margin-bottom: 2rem;">LEADERBOARD</h1>
      
      <div class="wine-list" id="leaderboard-list"></div>
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
      <div class="wine-card" style="border-left: 4px solid ${isMe ? '#FFD700' : '#CCC'};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="font-size: 24px;">${medal}</div>
            <div>
              <div style="font-weight: 500; font-size: 16px;">${isMe ? 'Jij' : 'Gebruiker ' + entry.userId.substring(0, 8)}</div>
              <div style="font-size: 12px; color: #999; margin-top: 2px;">${entry.scoredCount}/${entry.totalCount} wijnen beoordeeld</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 28px; font-weight: bold; color: #FFD700;">${entry.avgScore}</div>
            <div style="font-size: 11px; color: #666;">gemiddeld</div>
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
      
      return `
        <div class="wine-card" onclick="showWineGroupDetail('${w.wine_id}')">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-weight: 500;">${w.naam}</div>
              <div style="font-size: 12px; color: #666;">
                ${[w.druif, w.regio, w.jaar].filter(Boolean).join(' · ')}
              </div>
              <div style="font-size: 11px; color: #999; margin-top: 4px;">
                ${allNotesForWine.length} notitie${allNotesForWine.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      `
    }).join('')
  }
}

function showWineGroupDetail(wineId) {
  const allNotes = getWineNotes(wineId)
  if (allNotes.length === 0) return
  
  const firstNote = allNotes[0]
  const myNote = allNotes.find(n => n.user_id === currentUserId)
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="app">
      <button class="button" onclick="switchScreen('lijst')" style="margin-bottom: 1rem;">← Terug</button>
      
      <h2>${firstNote.naam}</h2>
      <div style="font-size: 13px; color: #666; margin-bottom: 1rem;">
        ${[firstNote.druif, firstNote.regio, firstNote.jaar].filter(Boolean).join(' · ')}
      </div>
      
      <div id="notes-tabs" style="display: flex; gap: 8px; margin-bottom: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; overflow-x: auto;"></div>
      
      <div id="notes-content"></div>
      
      ${myNote ? `
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--color-border);">
          <button class="button" onclick="editWine('${myNote.id}')" style="width: 100%; background: #e3f2fd; color: #1976d2; margin-bottom: 0.5rem;">✏️ Mijn notitie bewerken</button>
          <button class="button" onclick="addNoteToWine('${wineId}')" style="width: 100%; background: #e8f5e9; color: #2e7d32;">+ Nog een notitie voor deze wijn</button>
        </div>
      ` : `
        <button class="button" onclick="addNoteToWine('${wineId}')" style="width: 100%; background: #e8f5e9; color: #2e7d32; margin-top: 2rem;">+ Voeg notitie toe</button>
      `}
    </div>
  `
  
  const tabsDiv = document.getElementById('notes-tabs')
  tabsDiv.innerHTML = allNotes.map((note, idx) => {
    const isMyNote = myNote?.id === note.id
    return `
      <button class="filter-chip ${idx === 0 ? 'active' : ''}" onclick="showNoteDetail('${note.id}', '${wineId}')" style="padding: 6px 12px;">
        ${note.user_id === currentUserId ? 'Jij' : 'Iemand'} ${isMyNote ? '' : ''}
      </button>
    `
  }).join('')
  
  showNoteDetail(allNotes[0].id, wineId)
}

function showNoteDetail(noteId, wineId) {
  const note = wines.find(w => w.id === noteId)
  if (!note) return
  
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

    <button class="button" onclick="checkWithAI('${note.id}')" style="width: 100%; margin-top: 1rem; background: #e8f5e9; color: #2e7d32; font-weight: 500;">🔍 Laat nakijken door AI-sommelier</button>
  `
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
  editingWineId = noteId
  const wine = wines.find(w => w.id === noteId)
  if (!wine) return
  
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
    
    if (wine.helderheid) selectChip('helderheid', wine.helderheid)
    if (wine.intensiteit) selectChip('intensiteit', wine.intensiteit)
    if (wine.kleur) selectChip('kleur', wine.kleur)
    if (wine.conditie) selectChip('conditie', wine.conditie)
    if (wine.geur_int) selectChip('geur-int', wine.geur_int)
    if (wine.zoetheid) selectChip('zoetheid', wine.zoetheid)
    if (wine.zuur) selectChip('zuur', wine.zuur)
    if (wine.tannine) selectChip('tannine', wine.tannine)
    if (wine.body) selectChip('body', wine.body)
    if (wine.smaak_int) selectChip('smaak-int', wine.smaak_int)
    if (wine.afdronk) selectChip('afdronk', wine.afdronk)
    if (wine.kwaliteit) selectChip('kwaliteit', wine.kwaliteit)
    
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

function renderForm(container) {
  const isEditing = editingWineId !== null;
  
  container.innerHTML = `
    <div class="app">
      <h1>${isEditing ? 'Wijzigingen opslaan' : 'Proefformulier'}</h1>
      
      <button class="button" onclick="switchScreen('scan')" style="width: 100%; margin-bottom: 1rem;">📸 Etiket scannen</button>
      
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
            <input type="text" id="f-druif" placeholder="bijv. Merlot, Cabernet Sauvignon">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="field">
            <label>Land / Gebied</label>
            <input type="text" id="f-regio" placeholder="bijv. Bordeaux, Frankrijk">
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
          <div class="chip-group" id="chips-intensiteit">
            <button class="chip" onclick="toggleChip(this, 'intensiteit')">Licht</button>
            <button class="chip" onclick="toggleChip(this, 'intensiteit')">Gemiddeld</button>
            <button class="chip" onclick="toggleChip(this, 'intensiteit')">Diep</button>
          </div>
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
          <div class="chip-group" id="chips-geur-int">
            <button class="chip" onclick="toggleChip(this, 'geur-int')">Licht</button>
            <button class="chip" onclick="toggleChip(this, 'geur-int')">Gemiddeld</button>
            <button class="chip" onclick="toggleChip(this, 'geur-int')">Sterk</button>
          </div>
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
          <div class="chip-group" id="chips-zoetheid">
            <button class="chip" onclick="toggleChip(this, 'zoetheid')">Droog</button>
            <button class="chip" onclick="toggleChip(this, 'zoetheid')">Iets zoet</button>
            <button class="chip" onclick="toggleChip(this, 'zoetheid')">Halfzoet</button>
            <button class="chip" onclick="toggleChip(this, 'zoetheid')">Zoet</button>
          </div>
        </div>

        <div class="field">
          <label>Zuur</label>
          <div class="chip-group" id="chips-zuur">
            <button class="chip" onclick="toggleChip(this, 'zuur')">Laag</button>
            <button class="chip" onclick="toggleChip(this, 'zuur')">Gemiddeld</button>
            <button class="chip" onclick="toggleChip(this, 'zuur')">Hoog</button>
          </div>
        </div>

        <div class="field">
          <label>Tannine</label>
          <div class="chip-group" id="chips-tannine">
            <button class="chip" onclick="toggleChip(this, 'tannine')">Geen</button>
            <button class="chip" onclick="toggleChip(this, 'tannine')">Laag</button>
            <button class="chip" onclick="toggleChip(this, 'tannine')">Gemiddeld</button>
            <button class="chip" onclick="toggleChip(this, 'tannine')">Hoog</button>
          </div>
        </div>

        <div class="field">
          <label>Body</label>
          <div class="chip-group" id="chips-body">
            <button class="chip" onclick="toggleChip(this, 'body')">Licht</button>
            <button class="chip" onclick="toggleChip(this, 'body')">Gemiddeld</button>
            <button class="chip" onclick="toggleChip(this, 'body')">Vol</button>
          </div>
        </div>

        <div class="field">
          <label>Smaakintensiteit</label>
          <div class="chip-group" id="chips-smaak-int">
            <button class="chip" onclick="toggleChip(this, 'smaak-int')">Licht</button>
            <button class="chip" onclick="toggleChip(this, 'smaak-int')">Gemiddeld</button>
            <button class="chip" onclick="toggleChip(this, 'smaak-int')">Sterk</button>
          </div>
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
          <div class="chip-group" id="chips-afdronk">
            <button class="chip" onclick="toggleChip(this, 'afdronk')">Kort</button>
            <button class="chip" onclick="toggleChip(this, 'afdronk')">Gemiddeld</button>
            <button class="chip" onclick="toggleChip(this, 'afdronk')">Lang</button>
          </div>
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
          <div class="chip-group" id="chips-kwaliteit">
            <button class="chip" onclick="toggleChip(this, 'kwaliteit')">Slecht</button>
            <button class="chip" onclick="toggleChip(this, 'kwaliteit')">Redelijk</button>
            <button class="chip" onclick="toggleChip(this, 'kwaliteit')">Goed</button>
            <button class="chip" onclick="toggleChip(this, 'kwaliteit')">Heel goed</button>
            <button class="chip" onclick="toggleChip(this, 'kwaliteit')">Voortreffelijk</button>
          </div>
        </div>
      </div>

      <button class="button" onclick="saveWine()" style="width: 100%;">${isEditing ? 'Wijzigingen opslaan' : 'Opslaan'}</button>
      <button class="button" onclick="switchScreen('lijst')" style="width: 100%; margin-top: 0.5rem;">Annuleren</button>
    </div>
  `;
  
  setupChips();
}

function renderScan(container) {
  container.innerHTML = `
    <div class="app">
      <button class="button" onclick="switchScreen('nieuw')" style="margin-bottom: 1rem;">← Terug naar formulier</button>
      <h2>Etiket herkennen</h2>
            
      <div class="card">
        <div style="border: 2px dashed var(--color-border); padding: 2rem; text-align: center; cursor: pointer;" 
             onclick="document.getElementById('img-input').click()">
          <div style="font-size: 32px; margin-bottom: 8px;">📸</div>
          <div style="font-weight: 500;">Upload een foto van het etiket</div>
        </div>
        
        <input type="file" id="img-input" accept="image/*" style="display: none;" onchange="handleImageUpload(event)">
        
        <div id="preview" style="display: none; margin-top: 1rem;">
          <img id="preview-img" style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;">
        </div>
        
        <button id="analyze-btn" class="button" onclick="analyzeLabel()" style="width: 100%; display: none; margin-top: 0.5rem;">Analyseer met AI</button>
        
        <div id="scan-status" style="display: none; margin-top: 1rem; padding: 1rem; background: var(--color-bg-secondary); border-radius: 4px;">
          <div id="scan-result-text"></div>
          <button id="use-btn" class="button" onclick="useScannedWine()" style="width: 100%; margin-top: 0.5rem; display: none;">→ Gebruik in formulier</button>
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
    document.querySelectorAll(`#chips-${group} .chip.selected`).forEach(c => {
      c.classList.remove('selected')
    })
    el.classList.add('selected')
    chipState[group] = el.textContent.trim()
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
      updated_at: new Date().toISOString()
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
  if (confirm('Weet je zeker?')) {
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
    
    resultText.innerHTML = `<strong>${info.naam || '?'}</strong><br><span style="color:#666;">${[info.druif, info.regio, info.jaar].filter(Boolean).join(' · ')}</span>`
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

    if (!response.ok) throw new Error('Server error')

    const result = await response.json()
    const { feedback, score } = result

    if (score > 0) {
      wine.ai_score = score
      wine.ai_score_date = new Date().toLocaleDateString('nl-NL')
      
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

// ============= INIT =============

async function init() {
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
window.showLeaderboard = showLeaderboard