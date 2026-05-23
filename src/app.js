import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

// App state
let wines = [];
let currentScreen = 'lijst';
let chipState = {};
let scannedWineData = null;
let currentFilter = null;
let currentSearch = '';
let db;
let profiles = [];
let currentProfile = null;
let editingWineId = null;
let isLoggedIn = false;

// ============= LOGIN SCREEN =============

async function initLogin() {
  if (!db) await initDB();
  
  return new Promise((resolve) => {
    const tx = db.transaction('profiles', 'readonly');
    const store = tx.objectStore('profiles');
    const req = store.getAll();
    
    req.onsuccess = () => {
      profiles = req.result;
      if (profiles.length > 0) {
        currentProfile = profiles[0].id;
        isLoggedIn = true;
      }
      resolve();
    };
    req.onerror = () => resolve();
  });
}

function showLoginScreen() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh;">
      <div style="display: flex; gap: 12px; align-items: center;">
        <h1 style="font-size: 32px; margin: 0;">Hi</h1>
        <input 
          type="text" 
          id="login-password" 
          style="padding: 12px 16px; border: 0.5px solid var(--color-border); border-radius: 4px; font-size: 16px; width: 200px;"
          onkeypress="if(event.key==='Enter') handleLogin()"
        />
        <h1 style="font-size: 32px; margin: 0;">👋</h1>
      </div>
    </div>
  `;
  
  setTimeout(() => {
    document.getElementById('login-password').focus();
  }, 100);
}

function handleLogin() {
  const password = document.getElementById('login-password').value.toLowerCase();
  
  if (password === 'girlie') {
    if (profiles.length === 0) {
      createProfile('Mijn profiel').then(() => {
        isLoggedIn = true;
        render();
      });
    } else if (profiles.length === 1) {
      currentProfile = profiles[0].id;
      isLoggedIn = true;
      render();
    } else {
      showProfileSelector();
    }
  } else {
    const input = document.getElementById('login-password');
    input.style.borderColor = '#c62828';
    input.value = '';
    input.placeholder = 'Wrong password';
    setTimeout(() => {
      input.style.borderColor = 'var(--color-border)';
      input.placeholder = 'Password...';
    }, 2000);
  }
}

function showProfileSelector() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; gap: 2rem;">
      <div style="text-align: center;">
        <h1 style="font-size: 24px; margin-bottom: 2rem;">Who are you?</h1>
      </div>
      
      <div style="width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 10px;">
        ${profiles.map(p => `
          <button 
            class="wine-card" 
            onclick="selectProfile(${p.id})"
            style="padding: 16px; text-align: left; cursor: pointer;">
            <div style="font-weight: 500; font-size: 16px;">${p.name}</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Created: ${p.createdAt}</div>
          </button>
        `).join('')}
        
        <button 
          class="button"
          onclick="createNewProfileFromLogin()"
          style="width: 100%; margin-top: 1rem; background: #e8f5e9; color: #2e7d32;">
          + Create new profile
        </button>
      </div>
    </div>
  `;
}

function selectProfile(profileId) {
  currentProfile = profileId;
  isLoggedIn = true;
  render();
}

function createNewProfileFromLogin() {
  const name = prompt('Profile name:');
  if (name && name.trim()) {
    createProfile(name.trim()).then(() => {
      showProfileSelector();
    });
  }
}

// ============= OPSLAG =============

async function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('WsetApp', 2);
    
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      
      if (!database.objectStoreNames.contains('wines')) {
        database.createObjectStore('wines', { keyPath: 'id' });
      }
      
      if (!database.objectStoreNames.contains('profiles')) {
        database.createObjectStore('profiles', { keyPath: 'id' });
      }
    };
    
    req.onsuccess = () => { 
      db = req.result;
      resolve(); 
    };
    req.onerror = () => reject(req.error);
  });
}

async function loadWines() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('wines', 'readonly');
    const store = tx.objectStore('wines');
    const req = store.getAll();
    req.onsuccess = () => {
      wines = req.result.reverse();
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

async function saveWines() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('wines', 'readwrite');
    const store = tx.objectStore('wines');
    
    wines.forEach(wine => {
      store.put(wine);
    });
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============= PROFIEL SYSTEM =============

async function initProfiles() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('profiles', 'readonly');
    const store = tx.objectStore('profiles');
    const req = store.getAll();
    
    req.onsuccess = () => {
      profiles = req.result;
      if (profiles.length === 0) {
        createProfile('Mijn profiel').then(resolve);
      } else {
        currentProfile = profiles[0].id;
        resolve();
      }
    };
    req.onerror = () => {
      console.error('Fout bij laden profielen');
      createProfile('Mijn profiel').then(resolve);
    };
  });
}

async function createProfile(name) {
  if (!db) await initDB();
  
  const profile = {
    id: Date.now(),
    name: name,
    createdAt: new Date().toLocaleDateString('nl-NL'),
    wines: []
  };
  
  profiles.unshift(profile);
  currentProfile = profile.id;
  await saveProfiles();
}

async function saveProfiles() {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('profiles', 'readwrite');
    const store = tx.objectStore('profiles');
    
    store.clear();
    
    profiles.forEach(profile => {
      store.add(profile);
    });
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function getCurrentProfile() {
  return profiles.find(p => p.id === currentProfile);
}

// ============= WINE ID & DEDUP =============

function generateWineId(naam, druif, jaar, regio) {
  return `${naam.toLowerCase()}-${druif.toLowerCase()}-${jaar}-${regio.toLowerCase()}`;
}

function findExistingWine(naam, druif, jaar, regio) {
  const wineId = generateWineId(naam, druif, jaar, regio);
  return wines.find(w => w.wineId === wineId);
}

function getWineNotes(wineId) {
  return wines.filter(w => w.wineId === wineId);
}

function addWineToProfile(wine) {
  const profile = getCurrentProfile();
  if (profile) {
    if (!profile.wines.find(w => w.noteId === wine.id)) {
      profile.wines.push({
        noteId: wine.id,
        wineId: wine.wineId,
        addedDate: new Date().toLocaleDateString('nl-NL'),
        aiScore: wine.aiScore || null,
        aiScoreDate: wine.aiScoreDate || null
      });
      saveProfiles();
    }
  }
}

function getProfileStats(profileId) {
  const profile = profiles.find(p => p.id === profileId);
  if (!profile || profile.wines.length === 0) return null;
  
  const scoresWithAI = profile.wines.filter(w => w.aiScore);
  
  if (scoresWithAI.length === 0) return null;
  
  const avgScore = (scoresWithAI.reduce((sum, w) => sum + w.aiScore, 0) / scoresWithAI.length).toFixed(1);
  
  return {
    totalWines: profile.wines.length,
    scoredWines: scoresWithAI.length,
    averageScore: avgScore
  };
}

// ============= INTERFACE =============

function render() {
  if (!isLoggedIn) {
    showLoginScreen();
    return;
  }
  
  const app = document.getElementById('app');
  
  if (currentScreen === 'lijst') {
    renderList(app);
  } else if (currentScreen === 'nieuw') {
    renderForm(app);
  } else if (currentScreen === 'scan') {
    renderScan(app);
  } else if (currentScreen === 'profielen') {
    renderProfiles(app);
  } else if (currentScreen === 'wijndetails') {
    renderWineDetails(app);
  }
}

function renderList(container) {
  const currentProf = getCurrentProfile();
  container.innerHTML = `
    <div class="app">
      <div style="background: #e8f5e9; padding: 10px; border-radius: 4px; margin-bottom: 1rem; font-size: 13px;">
        👤 Actief profiel: <strong>${currentProf?.name || 'Geen'}</strong>
        <button class="button" onclick="switchScreen('profielen')" style="float: right; font-size: 11px; padding: 4px 8px; height: auto;">Wisselen</button>
      </div>
      <h1>Mijn wijnen</h1>
      <button class="button" onclick="switchScreen('nieuw')" style="width: 100%; margin-bottom: 1rem;">+ Nieuwe notitie</button>
      
      <input type="text" id="search" placeholder="Zoek op naam, druif, regio..." style="width: 100%; margin-bottom: 1rem; padding: 8px; border: 0.5px solid var(--color-border); border-radius: 4px;" oninput="filterAndSearch()">
      
      <div id="filters" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1rem;"></div>
      
      <div class="wine-list" id="wine-list"></div>
    </div>
  `;
  
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', filterAndSearch);
  }
  
  renderFiltersAndList();
}

function renderFiltersAndList() {
  const uniqueWines = [...new Map(wines.map(w => [w.wineId, w])).values()];
  const druiven = [...new Set(uniqueWines.map(w => w.druif).filter(Boolean))];
  const filterDiv = document.getElementById('filters');
  
  if (!filterDiv) return;
  
  filterDiv.innerHTML = '';
  
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-chip' + (currentFilter === null ? ' active' : '');
  allBtn.textContent = 'Alles';
  allBtn.onclick = () => { currentFilter = null; renderFiltersAndList(); filterAndSearch(); };
  filterDiv.appendChild(allBtn);
  
  druiven.forEach(druif => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip' + (druif === currentFilter ? ' active' : '');
    btn.textContent = druif;
    btn.onclick = () => { currentFilter = druif; renderFiltersAndList(); filterAndSearch(); };
    filterDiv.appendChild(btn);
  });
  
  filterAndSearch();
}

function renderProfiles(container) {
  container.innerHTML = `
    <div class="app">
      <button class="button" onclick="switchScreen('lijst')" style="margin-bottom: 1rem;">← Terug naar wijnen</button>
      <h1>Mijn Profielen</h1>
      <button class="button" onclick="promptNewProfile()" style="width: 100%; margin-bottom: 1rem;">+ Nieuw profiel</button>
      
      <div id="profiles-list"></div>
    </div>
  `;
  
  const list = document.getElementById('profiles-list');
  
  if (profiles.length === 0) {
    list.innerHTML = '<div class="empty-state">Geen profielen</div>';
    return;
  }
  
  const profilesWithStats = profiles.map(p => ({
    ...p,
    stats: getProfileStats(p.id)
  })).sort((a, b) => {
    const scoreA = a.stats?.averageScore || 0;
    const scoreB = b.stats?.averageScore || 0;
    return scoreB - scoreA;
  });
  
  list.innerHTML = profilesWithStats.map((p, idx) => {
    const stats = p.stats;
    const isCurrent = p.id === currentProfile;
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
    
    return `
      <div class="wine-card" style="border-left: 4px solid ${isCurrent ? '#4caf50' : '#ccc'}; cursor: pointer;" onclick="switchProfile(${p.id})">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-weight: 500; font-size: 15px;">${medal} ${p.name}</div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">Aangemaakt: ${p.createdAt}</div>
          </div>
          ${stats ? `
            <div style="text-align: right;">
              <div style="font-size: 24px; font-weight: bold; color: #4caf50;">${stats.averageScore}</div>
              <div style="font-size: 11px; color: #666;">gemiddeld</div>
            </div>
          ` : ''}
        </div>
        ${stats ? `
          <div style="margin-top: 8px; font-size: 12px; color: #666;">
            ${stats.scoredWines}/${stats.totalWines} wijnen beoordeeld
          </div>
        ` : `
          <div style="margin-top: 8px; font-size: 12px; color: #666; font-style: italic;">
            Nog geen wijnen beoordeeld
          </div>
        `}
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;">
          <button class="button" onclick="selectProfileAndNew(${p.id})" style="font-size: 12px; padding: 6px; background: #e8f5e9; color: #2e7d32;">+ Nieuw</button>
          <button class="button" onclick="viewProfileWines(event, ${p.id})" style="font-size: 12px; padding: 6px;">Geschiedenis</button>
        </div>
        <button class="button" onclick="deleteProfile(event, ${p.id})" style="width: 100%; margin-top: 4px; font-size: 12px; padding: 6px; background: #ffebee; color: #c62828;">Verwijderen</button>
      </div>
    `;
  }).join('');
}

function promptNewProfile() {
  const name = prompt('Naam voor nieuw profiel:');
  if (name && name.trim()) {
    createProfile(name.trim());
    renderProfiles(document.getElementById('app'));
  }
}

function switchProfile(profileId) {
  currentProfile = profileId;
  renderProfiles(document.getElementById('app'));
}

function viewProfileWines(event, profileId) {
  event.stopPropagation();
  const profile = profiles.find(p => p.id === profileId);
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app">
      <button class="button" onclick="switchScreen('profielen')" style="margin-bottom: 1rem;">← Terug naar profielen</button>
      <h2>${profile.name} - Geschiedenis</h2>
      <div class="wine-list" id="profile-wines"></div>
    </div>
  `;
  
  const list = document.getElementById('profile-wines');
  if (profile.wines.length === 0) {
    list.innerHTML = '<div class="empty-state">Geen wijnen in dit profiel</div>';
    return;
  }
  
  const profileWinesSorted = [...profile.wines].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
  
  list.innerHTML = profileWinesSorted.map(pw => {
    const w = wines.find(wine => wine.id === pw.noteId);
    if (!w) return '';
    return `
      <div class="wine-card" onclick="showWineGroupDetail('${w.wineId}')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-weight: 500;">${w.naam}</div>
            <div style="font-size: 12px; color: #999; margin-top: 2px;">
              ${[w.druif, w.regio, w.jaar].filter(Boolean).join(' · ')}
            </div>
          </div>
          ${pw.aiScore ? `
            <div style="font-size: 20px; font-weight: bold; color: #4caf50;">${pw.aiScore}</div>
          ` : ''}
        </div>
        ${pw.aiScoreDate ? `<div style="font-size: 11px; color: #999; margin-top: 4px;">Beoordeeld: ${pw.aiScoreDate}</div>` : ''}
      </div>
    `;
  }).join('');
}

function deleteProfile(event, profileId) {
  event.stopPropagation();
  if (confirm('Weet je zeker? Je kunt dit niet ongedaan maken.')) {
    profiles = profiles.filter(p => p.id !== profileId);
    if (profiles.length === 0) {
      createProfile('Mijn profiel');
    } else if (currentProfile === profileId) {
      currentProfile = profiles[0].id;
    }
    saveProfiles();
    renderProfiles(document.getElementById('app'));
  }
}

function selectProfileAndNew(profileId) {
  currentProfile = profileId;
  editingWineId = null;
  switchScreen('nieuw');
}

function setFilter(druif) {
  currentFilter = druif;
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  filterAndSearch();
}

function filterAndSearch() {
  const searchInput = document.getElementById('search');
  currentSearch = searchInput ? searchInput.value.toLowerCase() : '';
  
  const uniqueWines = [...new Map(wines.map(w => [w.wineId, w])).values()];
  
  let filtered = currentFilter 
    ? uniqueWines.filter(w => w.druif === currentFilter)
    : uniqueWines;
  
  if (currentSearch) {
    filtered = filtered.filter(w => 
      (w.naam && w.naam.toLowerCase().includes(currentSearch)) ||
      (w.druif && w.druif.toLowerCase().includes(currentSearch)) ||
      (w.regio && w.regio.toLowerCase().includes(currentSearch))
    );
  }
  
  const list = document.getElementById('wine-list');
  if (!list) return;
  
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">Geen wijnen gevonden</div>';
  } else {
    list.innerHTML = filtered.map(w => {
      const allNotesForWine = getWineNotes(w.wineId);
      const reviewingProfiles = profiles.filter(p => 
        p.wines.find(pw => pw.wineId === w.wineId)
      );
      
      return `
        <div class="wine-card" onclick="showWineGroupDetail('${w.wineId}')">
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
            ${reviewingProfiles.length > 0 ? `
              <div style="display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end;">
                ${reviewingProfiles.map(p => {
                  const profileWine = p.wines.find(pw => pw.wineId === w.wineId);
                  return `
                    <button class="chip" onclick="event.stopPropagation(); showWineReviews('${w.wineId}')" style="font-size: 11px; padding: 4px 8px; cursor: pointer;">
                      ${p.name} ${profileWine.aiScore ? '(' + profileWine.aiScore + ')' : ''}
                    </button>
                  `;
                }).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

// ============= WINE GROUP DETAIL =============

function showWineGroupDetail(wineId) {
  const allNotes = getWineNotes(wineId);
  if (allNotes.length === 0) return;
  
  const firstNote = allNotes[0];
  const currentProf = getCurrentProfile();
  const myNote = allNotes.find(n => {
    const profileNote = currentProf?.wines.find(pw => pw.noteId === n.id);
    return !!profileNote;
  });
  
  const app = document.getElementById('app');
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
          <button class="button" onclick="editWine(${myNote.id})" style="width: 100%; background: #e3f2fd; color: #1976d2; margin-bottom: 0.5rem;">✏️ Mijn notitie bewerken</button>
          <button class="button" onclick="addNoteToWine('${wineId}')" style="width: 100%; background: #e8f5e9; color: #2e7d32;">+ Nog een notitie voor deze wijn</button>
        </div>
      ` : `
        <button class="button" onclick="addNoteToWine('${wineId}')" style="width: 100%; background: #e8f5e9; color: #2e7d32; margin-top: 2rem;">+ Voeg notitie toe</button>
      `}
    </div>
  `;
  
  const tabsDiv = document.getElementById('notes-tabs');
  tabsDiv.innerHTML = allNotes.map((note, idx) => {
    const profile = profiles.find(p => p.wines.find(pw => pw.noteId === note.id));
    const isMyNote = myNote?.id === note.id;
    return `
      <button class="filter-chip ${idx === 0 ? 'active' : ''}" onclick="showNoteDetail(${note.id}, '${wineId}')" style="padding: 6px 12px;">
        ${profile?.name || 'Onbekend'} ${isMyNote ? '(jij)' : ''}
      </button>
    `;
  }).join('');
  
  showNoteDetail(allNotes[0].id, wineId);
}

function showNoteDetail(noteId, wineId) {
  const note = wines.find(w => w.id === noteId);
  if (!note) return;
  
  const row = (label, val) => val ? `<tr><td style="padding: 8px 0; border-bottom: 0.5px solid var(--color-border); color: #666; width: 120px;">${label}</td><td style="padding: 8px 0; border-bottom: 0.5px solid var(--color-border); font-weight: 500;">${val}</td></tr>` : '';
  
  const contentDiv = document.getElementById('notes-content');
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
        ${row('Intensiteit', note.geurInt)}
        ${row('Aroma' + "'" + 's', note.aroma)}
      </table>
      ${note.notitieGeur ? `<div style="margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 13px;">${note.notitieGeur}</div>` : ''}
    </div>

    <div class="card">
      <div class="section-title">Smaak</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Zoetheid', note.zoetheid)}
        ${row('Zuur', note.zuur)}
        ${row('Tannine', note.tannine)}
        ${row('Body', note.body)}
        ${row('Intensiteit', note.smaakInt)}
        ${row('Smaken', note.smaak)}
        ${row('Afdronk', note.afdronk)}
      </table>
      ${note.notitieSmaak ? `<div style="margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 13px;">${note.notitieSmaak}</div>` : ''}
    </div>

    <div class="card">
      <div class="section-title">Conclusie</div>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Kwaliteit', note.kwaliteit)}
      </table>
    </div>

    <button class="button" onclick="checkWithAI(${note.id})" style="width: 100%; margin-top: 1rem; background: #e8f5e9; color: #2e7d32; font-weight: 500;">🔍 Laat nakijken door AI-sommelier</button>
  `;
}

function addNoteToWine(wineId) {
  editingWineId = null;
  const existingNote = wines.find(w => w.wineId === wineId);
  if (existingNote) {
    scannedWineData = {
      naam: existingNote.naam,
      druif: existingNote.druif,
      jaar: existingNote.jaar,
      regio: existingNote.regio,
      type: existingNote.type
    };
  }
  switchScreen('nieuw');
  
  setTimeout(() => {
    if (existingNote) {
      document.getElementById('f-naam').value = existingNote.naam;
      document.getElementById('f-jaar').value = existingNote.jaar;
      document.getElementById('f-druif').value = existingNote.druif;
      document.getElementById('f-regio').value = existingNote.regio;
    }
    window.scrollTo(0, 0);
  }, 50);
}

function editWine(noteId) {
  editingWineId = noteId;
  const wine = wines.find(w => w.id === noteId);
  if (!wine) return;
  
  switchScreen('nieuw');
  
  setTimeout(() => {
    // Pre-fill text fields
    document.getElementById('f-naam').value = wine.naam;
    document.getElementById('f-jaar').value = wine.jaar;
    document.getElementById('f-druif').value = wine.druif;
    document.getElementById('f-regio').value = wine.regio;
    document.getElementById('f-prijs').value = wine.prijs;
    document.getElementById('f-gastro').value = wine.gastro;
    
    // Reset all chips first
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    chipState = {};
    
    // Helper to select single chips
    const selectChip = (groupId, value) => {
      document.querySelectorAll(`#chips-${groupId} .chip`).forEach(btn => {
        if (btn.textContent.trim() === value.trim()) {
          btn.classList.add('selected');
          chipState[groupId] = value;
        }
      });
    };
    
    // Select single-select chips
    if (wine.helderheid) selectChip('helderheid', wine.helderheid);
    if (wine.intensiteit) selectChip('intensiteit', wine.intensiteit);
    if (wine.kleur) selectChip('kleur', wine.kleur);
    if (wine.conditie) selectChip('conditie', wine.conditie);
    if (wine.geurInt) selectChip('geur-int', wine.geurInt);
    if (wine.zoetheid) selectChip('zoetheid', wine.zoetheid);
    if (wine.zuur) selectChip('zuur', wine.zuur);
    if (wine.tannine) selectChip('tannine', wine.tannine);
    if (wine.body) selectChip('body', wine.body);
    if (wine.smaakInt) selectChip('smaak-int', wine.smaakInt);
    if (wine.afdronk) selectChip('afdronk', wine.afdronk);
    if (wine.kwaliteit) selectChip('kwaliteit', wine.kwaliteit);
    
    // Multi-select: aroma
    if (wine.aroma) {
      const aromaList = wine.aroma.split(', ');
      chipState['aroma'] = aromaList;
      document.querySelectorAll('#chips-aroma .chip').forEach(btn => {
        if (aromaList.includes(btn.textContent.trim())) {
          btn.classList.add('selected');
        }
      });
    }
    
    // Multi-select: smaak
    if (wine.smaak) {
      const smaakList = wine.smaak.split(', ');
      chipState['smaak'] = smaakList;
      document.querySelectorAll('#chips-smaak .chip').forEach(btn => {
        if (smaakList.includes(btn.textContent.trim())) {
          btn.classList.add('selected');
        }
      });
    }
    
    // Textareas
    document.getElementById('f-notitie-geur').value = wine.notitieGeur;
    document.getElementById('f-notitie-smaak').value = wine.notitieSmaak;
    
    window.scrollTo(0, 0);
  }, 100);
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
  `;
}

function useScannedWine() {
  if (!scannedWineData) return;
  
  editingWineId = null;
  switchScreen('nieuw');
  
  setTimeout(() => {
    if (scannedWineData.naam) document.getElementById('f-naam').value = scannedWineData.naam;
    if (scannedWineData.druif) document.getElementById('f-druif').value = scannedWineData.druif;
    if (scannedWineData.jaar) document.getElementById('f-jaar').value = scannedWineData.jaar;
    if (scannedWineData.regio) document.getElementById('f-regio').value = scannedWineData.regio;
    
    window.scrollTo(0, 0);
  }, 100);
}

function toggleChip(el, group) {
  const multiSelect = ['aroma', 'smaak'].includes(group);
  
  if (!multiSelect) {
    document.querySelectorAll(`#chips-${group} .chip.selected`).forEach(c => {
      c.classList.remove('selected');
    });
    el.classList.add('selected');
    chipState[group] = el.textContent.trim();
  } else {
    el.classList.toggle('selected');
    if (!chipState[group]) chipState[group] = [];
    const text = el.textContent.trim();
    if (el.classList.contains('selected')) {
      if (!chipState[group].includes(text)) chipState[group].push(text);
    } else {
      chipState[group] = chipState[group].filter(x => x !== text);
    }
  }
}

function setupChips() {
  // Chip listeners already set via onclick
}

function getChips(group) {
  const v = chipState[group];
  if (!v) return '';
  return Array.isArray(v) ? v.join(', ') : v;
}

function saveWine() {
  const naam = document.getElementById('f-naam').value.trim();
  if (!naam) {
    alert('Vul minimaal de naam in');
    return;
  }
  
  const druif = document.getElementById('f-druif').value.trim();
  const jaar = document.getElementById('f-jaar').value.trim();
  const regio = document.getElementById('f-regio').value.trim();
  
  const wineId = generateWineId(naam, druif, jaar, regio);
  
  if (editingWineId) {
    // EDIT MODE
    const wineIdx = wines.findIndex(w => w.id === editingWineId);
    if (wineIdx === -1) return;
    
    wines[wineIdx] = {
      ...wines[wineIdx],
      naam,
      druif,
      jaar,
      regio,
      wineId,
      prijs: document.getElementById('f-prijs').value.trim(),
      gastro: document.getElementById('f-gastro').value.trim(),
      helderheid: getChips('helderheid'),
      intensiteit: getChips('intensiteit'),
      kleur: getChips('kleur'),
      conditie: getChips('conditie'),
      geurInt: getChips('geur-int'),
      aroma: getChips('aroma'),
      notitieGeur: document.getElementById('f-notitie-geur').value.trim(),
      zoetheid: getChips('zoetheid'),
      zuur: getChips('zuur'),
      tannine: getChips('tannine'),
      body: getChips('body'),
      smaakInt: getChips('smaak-int'),
      smaak: getChips('smaak'),
      afdronk: getChips('afdronk'),
      notitieSmaak: document.getElementById('f-notitie-smaak').value.trim(),
      kwaliteit: getChips('kwaliteit'),
      editedAt: new Date().toLocaleDateString('nl-NL')
    };
    
    editingWineId = null;
  } else {
    // NEW MODE
    const existingWine = findExistingWine(naam, druif, jaar, regio);
    
    if (existingWine) {
      const confirmed = confirm(`Deze wijn bestaat al (${getWineNotes(wineId).length} notitie${getWineNotes(wineId).length !== 1 ? 's' : ''}). Wil je een nieuwe notitie toevoegen?`);
      if (!confirmed) {
        resetForm();
        return;
      }
    }
    
    const wine = {
      id: Date.now(),
      wineId,
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
      geurInt: getChips('geur-int'),
      aroma: getChips('aroma'),
      notitieGeur: document.getElementById('f-notitie-geur').value.trim(),
      zoetheid: getChips('zoetheid'),
      zuur: getChips('zuur'),
      tannine: getChips('tannine'),
      body: getChips('body'),
      smaakInt: getChips('smaak-int'),
      smaak: getChips('smaak'),
      afdronk: getChips('afdronk'),
      notitieSmaak: document.getElementById('f-notitie-smaak').value.trim(),
      kwaliteit: getChips('kwaliteit'),
      datum: new Date().toLocaleDateString('nl-NL')
    };
    
    wines.unshift(wine);
    addWineToProfile(wine);
  }
  
  saveWines();
  resetForm();
  switchScreen('lijst');
}

function resetForm() {
  ['f-naam', 'f-jaar', 'f-druif', 'f-regio', 'f-prijs', 'f-gastro', 'f-notitie-geur', 'f-notitie-smaak'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
  chipState = {};
}

function switchScreen(screen) {
  currentScreen = screen;
  render();
}

function showWineReviews(wineId) {
  const note = wines.find(w => w.wineId === wineId);
  const reviewingProfiles = profiles.filter(p => 
    p.wines.find(pw => pw.wineId === wineId)
  );
  
  const reviewsDiv = document.createElement('div');
  reviewsDiv.id = 'wine-reviews-modal';
  reviewsDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
  
  reviewsDiv.innerHTML = `
    <div style="background: white; border-radius: 8px; padding: 2rem; max-width: 500px; max-height: 80vh; overflow-y: auto; width: 90%;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="margin: 0;">${note.naam}</h2>
        <button onclick="document.getElementById('wine-reviews-modal').remove()" style="background: none; border: none; font-size: 20px; cursor: pointer;">✕</button>
      </div>
      
      <div style="display: flex; gap: 8px; margin-bottom: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 1rem; overflow-x: auto;">
        ${reviewingProfiles.map(p => {
          const profileWine = p.wines.find(pw => pw.wineId === wineId);
          return `
            <button class="filter-chip" onclick="showReviewTab('${p.id}', '${wineId}')" id="tab-${p.id}" style="border: none; padding: 8px 12px;">
              ${p.name} ${profileWine.aiScore ? '(' + profileWine.aiScore + ')' : ''}
            </button>
          `;
        }).join('')}
      </div>
      
      <div id="review-content"></div>
    </div>
  `;
  
  document.body.appendChild(reviewsDiv);
  
  if (reviewingProfiles.length > 0) {
    showReviewTab(reviewingProfiles[0].id, wineId);
  }
}

function showReviewTab(profileId, wineId) {
  const wine = wines.find(w => w.wineId === wineId);
  const profile = profiles.find(p => p.id === profileId);
  const profileWine = profile.wines.find(w => w.wineId === wineId);
  
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`tab-${profileId}`).classList.add('active');
  
  document.getElementById('review-content').innerHTML = `
    <div style="font-size: 13px; line-height: 1.6; color: #666;">
      <div style="margin-bottom: 1rem;">
        <div style="font-weight: 500; color: #000;">Profiel:</div>
        ${profile.name}
      </div>
      
      ${profileWine.aiScore ? `
        <div style="margin-bottom: 1rem;">
          <div style="font-weight: 500; color: #000;">Score:</div>
          <div style="font-size: 24px; font-weight: bold; color: #4caf50;">${profileWine.aiScore}/10</div>
        </div>
      ` : `
        <div style="margin-bottom: 1rem; font-style: italic;">Nog niet beoordeeld met AI</div>
      `}
      
      ${profileWine.aiScoreDate ? `
        <div style="font-size: 11px; color: #999;">
          Beoordeeld: ${profileWine.aiScoreDate}
        </div>
      ` : ''}
    </div>
  `;
}

function deleteWine(id) {
  if (confirm('Weet je zeker?')) {
    wines = wines.filter(w => w.id !== id);
    
    profiles.forEach(p => {
      p.wines = p.wines.filter(w => w.noteId !== id);
    });
    
    saveWines();
    saveProfiles();
    switchScreen('lijst');
  }
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target.result;
    const mediaType = file.type || 'image/jpeg';
    scannedWineData = { 
      base64: result.split(',')[1],
      mediaType: mediaType
    };
    document.getElementById('preview-img').src = result;
    document.getElementById('preview').style.display = 'block';
    document.getElementById('analyze-btn').style.display = 'block';
    document.getElementById('scan-status').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ============= AI SERVICE =============

const AI_PROVIDER = 'gemini';

async function analyzeWineLabel(imageBase64, mediaType) {
  if (AI_PROVIDER === 'gemini') {
    return analyzeWithGemini(imageBase64, mediaType);
  }
}

async function analyzeWithGemini(imageBase64, mediaType) {
  try {
    const response = await fetch('/api/analyze-wine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mediaType,
        analyzeType: 'label'   // ← VOEG DIT TOE
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Server error');
    }

    return await response.json();
  } catch (err) {
    console.error('API error:', err);
    throw new Error('Kon etiket niet herkennen');
  }
}

async function checkWithAI(noteId) {
  const wine = wines.find(w => w.id === noteId);
  if (!wine) return;
  
  const app = document.getElementById('app');
  let resultDiv = document.getElementById('ai-check-result');
  
  if (!resultDiv) {
    resultDiv = document.createElement('div');
    resultDiv.id = 'ai-check-result';
    resultDiv.style.marginTop = '1rem';
    resultDiv.style.padding = '1.5rem';
    resultDiv.style.background = '#f5f5f5';
    resultDiv.style.borderRadius = '4px';
    resultDiv.style.border = '2px solid #4caf50';
    app.appendChild(resultDiv);
  }
  
  resultDiv.innerHTML = 'AI analyseert jouw notitie...';
  
  try {
    // Verzamel alle notities van gebruiker
    const userNotes = `
Uiterlijk: ${wine.kleur} | ${wine.helderheid}
Neus: ${wine.aroma}
Notitie geur: ${wine.notitieGeur}
Smaak: ${wine.smaak} | Body: ${wine.body} | Zuur: ${wine.zuur}
Notitie smaak: ${wine.notitieSmaak}
Kwaliteit: ${wine.kwaliteit}
`;

    const wineInfo = {
      naam: wine.naam,
      jaar: wine.jaar,
      druif: wine.druif,
      regio: wine.regio
    };

    // Roep serverless function aan
    const response = await fetch('/api/check-wine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wineInfo,
        userNotes
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const result = await response.json();
    const { feedback, score } = result;

    // Sla score op
    if (score > 0) {
      wine.aiScore = score;
      wine.aiScoreDate = new Date().toLocaleDateString('nl-NL');
      await saveWines();
      
      const profile = getCurrentProfile();
      if (profile) {
        const profileWine = profile.wines.find(w => w.noteId === wine.id);
        if (profileWine) {
          profileWine.aiScore = score;
          profileWine.aiScoreDate = new Date().toLocaleDateString('nl-NL');
          saveProfiles();
        }
      }
    }

    resultDiv.innerHTML = `
      <div style="color: #4caf50; font-weight: bold; margin-bottom: 1rem;">✓ AI FEEDBACK</div>
      ${feedback.split('\n').map(line => {
        if (line.includes('**')) {
          return `<div style="font-weight: 500; margin-top: 0.75rem; font-size: 13px;">${line.replace(/\*\*/g, '')}</div>`;
        }
        if (line.trim() === '') return '';
        return `<div style="font-size: 13px; color: #666; line-height: 1.6; margin-bottom: 0.5rem;">${line}</div>`;
      }).join('')}
    `;
  } catch (err) {
    resultDiv.innerHTML = `<span style="color: #c62828;">❌ Fout: ${err.message}</span>`;
  }
}

async function analyzeLabel() {
  if (!scannedWineData) return;
  
  const analyzeBtn = document.getElementById('analyze-btn');
  const status = document.getElementById('scan-status');
  const resultText = document.getElementById('scan-result-text');
  const useBtn = document.getElementById('use-btn');
  
  analyzeBtn.disabled = true;
  analyzeBtn.style.opacity = '0.5';
  
  status.style.display = 'block';
  resultText.innerHTML = 'AI analyseert het etiket...';
  useBtn.style.display = 'none';
  
  const base64 = scannedWineData.base64;
  const mediaType = scannedWineData.mediaType || 'image/jpeg';
  
  try {
    const info = await analyzeWineLabel(base64, mediaType);
    scannedWineData = { ...scannedWineData, ...info };
    
    resultText.innerHTML = `<strong>${info.naam || '?'}</strong><br><span style="color:#666;">${[info.druif, info.regio, info.jaar].filter(Boolean).join(' · ')}</span>`;
    useBtn.style.display = 'block';
  } catch (err) {
    resultText.innerHTML = `<span style="color: #c62828;">${err.message}</span>`;
    analyzeBtn.disabled = false;
    analyzeBtn.style.opacity = '1';
  }
}
// ============= INIT =============

async function init() {
  await initDB();
  await loadWines();
  await initLogin();
  
  if (!isLoggedIn) {
    showLoginScreen();
  } else {
    await initProfiles();
    render();
  }
}

document.addEventListener('DOMContentLoaded', init);

// Global window functions
window.handleLogin = handleLogin;
window.selectProfile = selectProfile;
window.createNewProfileFromLogin = createNewProfileFromLogin;
window.switchScreen = switchScreen;
window.saveWine = saveWine;
window.switchProfile = switchProfile;
window.viewProfileWines = viewProfileWines;
window.promptNewProfile = promptNewProfile;
window.deleteProfile = deleteProfile;
window.selectProfileAndNew = selectProfileAndNew;
window.deleteWine = deleteWine;
window.toggleChip = toggleChip;
window.handleImageUpload = handleImageUpload;
window.analyzeLabel = analyzeLabel;
window.useScannedWine = useScannedWine;
window.render = render;
window.setFilter = setFilter;
window.filterAndSearch = filterAndSearch;
window.checkWithAI = checkWithAI;
window.showWineReviews = showWineReviews;
window.showReviewTab = showReviewTab;
window.showWineGroupDetail = showWineGroupDetail;
window.showNoteDetail = showNoteDetail;
window.addNoteToWine = addNoteToWine;
window.editWine = editWine;