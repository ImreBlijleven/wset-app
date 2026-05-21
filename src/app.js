import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

// App state (je gegevens in het geheugen)
let wines = [];
let currentScreen = 'lijst';
let chipState = {};
let scannedWineData = null;
let currentFilter = null;
let currentSearch = '';
let db;


// ============= OPSLAG =============

async function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('WsetApp', 1);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains('wines')) {
        database.createObjectStore('wines', { keyPath: 'id' });
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
      wines = req.result.reverse(); // Nieuwste eerst
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

async function deleteWineDB(id) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction('wines', 'readwrite');
    const store = tx.objectStore('wines');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ============= INTERFACE =============
function render() {
  const app = document.getElementById('app');
  
  if (currentScreen === 'lijst') {
    renderList(app);
  } else if (currentScreen === 'nieuw') {
    renderForm(app);
  } else if (currentScreen === 'scan') {
    renderScan(app);
  }
}

function renderList(container) {
  container.innerHTML = `
    <div class="app">
      <h1>Mijn wijnen</h1>
      <button class="button" onclick="switchScreen('nieuw')" style="width: 100%; margin-bottom: 1rem;">+ Nieuwe notitie</button>
      
      <!-- ZOEKBALK -->
      <input type="text" id="search" placeholder="Zoek op naam, druif, regio..." style="width: 100%; margin-bottom: 1rem; padding: 8px; border: 0.5px solid var(--color-border); border-radius: 4px;" oninput="filterAndSearch()">
      
      <!-- FILTERS -->
      <div id="filters" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1rem;"></div>
      
      <div class="wine-list" id="wine-list"></div>
    </div>
  `;
  
  // Setup zoeken
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', filterAndSearch);
  }
  
  renderFiltersAndList();
}

function renderFiltersAndList() {
  const druiven = [...new Set(wines.map(w => w.druif).filter(Boolean))];
  const filterDiv = document.getElementById('filters');
  
  if (!filterDiv) return;
  
  filterDiv.innerHTML = '';
  
  // "Alles" knop
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-chip' + (currentFilter === null ? ' active' : '');
  allBtn.textContent = 'Alles';
  allBtn.onclick = () => { currentFilter = null; renderFiltersAndList(); filterAndSearch(); };
  filterDiv.appendChild(allBtn);
  
  // Druif knoppen
  druiven.forEach(druif => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip' + (druif === currentFilter ? ' active' : '');
    btn.textContent = druif;
    btn.onclick = () => { currentFilter = druif; renderFiltersAndList(); filterAndSearch(); };
    filterDiv.appendChild(btn);
  });
  
  filterAndSearch();
}

function setFilter(druif) {
  currentFilter = druif;
  // Update alle filter buttons
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.classList.remove('active');
  });
  // Activeer de geklikt button
  event.target.classList.add('active');
  filterAndSearch();
}

function filterAndSearch() {
  const searchInput = document.getElementById('search');
  currentSearch = searchInput ? searchInput.value.toLowerCase() : '';
  
  // Filter op druivenras
  let filtered = currentFilter 
    ? wines.filter(w => w.druif === currentFilter)
    : wines;
  
  // Filter op zoekterm
  if (currentSearch) {
    filtered = filtered.filter(w => 
      (w.naam && w.naam.toLowerCase().includes(currentSearch)) ||
      (w.druif && w.druif.toLowerCase().includes(currentSearch)) ||
      (w.regio && w.regio.toLowerCase().includes(currentSearch))
    );
  }
  
  // Render de lijst
  const list = document.getElementById('wine-list');
  if (!list) return;
  
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">Geen wijnen gevonden</div>';
  } else {
    list.innerHTML = filtered.map(w => `
      <div class="wine-card" onclick="showDetail(${w.id})">
        <div style="font-weight: 500;">
          ${w.naam}
        </div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">
          ${[w.druif, w.regio, w.jaar].filter(Boolean).join(' · ')}
        </div>
        <div style="font-size: 11px; color: var(--color-text-secondary); margin-top: 4px;">
          ${w.datum}
        </div>
      </div>
    `).join('');
  }
}

function renderForm(container) {
  container.innerHTML = `
    <div class="app">
      <h1>Proefformulier</h1>
      
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

      <button class="button" onclick="saveWine()" style="width: 100%;">Opslaan</button>
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
  
  // Ga naar formulier
  switchScreen('nieuw');
  
  // Wacht even zodat formulier geladen is
  setTimeout(() => {
    // Vul velden in (laat leeg als niet aanwezig)
    if (scannedWineData.naam) document.getElementById('f-naam').value = scannedWineData.naam;
    if (scannedWineData.druif) document.getElementById('f-druif').value = scannedWineData.druif;
    if (scannedWineData.jaar) document.getElementById('f-jaar').value = scannedWineData.jaar;
    if (scannedWineData.regio) document.getElementById('f-regio').value = scannedWineData.regio;
    if (scannedWineData.type) document.getElementById('f-type').value = scannedWineData.type;
    
    // Scroll naar top
    window.scrollTo(0, 0);
  }, 100);
}

function toggleChip(el, group) {
  const multiSelect = ['aroma', 'smaak'].includes(group);
  
  if (!multiSelect) {
    // Single select
    document.querySelectorAll(`#chips-${group} .chip.selected`).forEach(c => {
      c.classList.remove('selected');
    });
    el.classList.add('selected');
    chipState[group] = el.textContent.trim();
  } else {
    // Multi select
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
  // Chip-listeners zijn al ingesteld via onclick
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
  
  const wine = {
    id: Date.now(),
    naam,
    jaar: document.getElementById('f-jaar').value.trim(),
    druif: document.getElementById('f-druif').value.trim(),
    regio: document.getElementById('f-regio').value.trim(),
    prijs: document.getElementById('f-prijs').value.trim(),
    gastro: document.getElementById('f-gastro').value.trim(),
    
    // Uiterlijk
    helderheid: getChips('helderheid'),
    intensiteit: getChips('intensiteit'),
    kleur: getChips('kleur'),
    
    // Geur
    conditie: getChips('conditie'),
    geurInt: getChips('geur-int'),
    aroma: getChips('aroma'),
    notitieGeur: document.getElementById('f-notitie-geur').value.trim(),
    
    // Smaak
    zoetheid: getChips('zoetheid'),
    zuur: getChips('zuur'),
    tannine: getChips('tannine'),
    body: getChips('body'),
    smaakInt: getChips('smaak-int'),
    smaak: getChips('smaak'),
    afdronk: getChips('afdronk'),
    notitieSmaak: document.getElementById('f-notitie-smaak').value.trim(),
    
    // Conclusie
    kwaliteit: getChips('kwaliteit'),
    
    datum: new Date().toLocaleDateString('nl-NL')
  };
  
  wines.unshift(wine);
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

function getSelectedChips(groupId) {
  const selected = document.querySelectorAll(`#chips-${groupId} .chip.selected`);
  return Array.from(selected).map(el => el.textContent).join(', ');
}

function showDetail(id) {
  const wine = wines.find(w => w.id === id);
  if (!wine) return;
  
  const app = document.getElementById('app');
  const row = (label, val) => val ? `<tr><td style="padding: 8px 0; border-bottom: 0.5px solid var(--color-border); color: var(--color-text-secondary); width: 120px;">${label}</td><td style="padding: 8px 0; border-bottom: 0.5px solid var(--color-border); font-weight: 500;">${val}</td></tr>` : '';
  
  app.innerHTML = `
    <div class="app">
      <button class="button" onclick="switchScreen('lijst')" style="margin-bottom: 1rem;">← Terug</button>
      
      <div class="card">
        <h2 style="margin-bottom: 0.5rem;">${wine.naam}</h2>
        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 1rem;">${wine.datum}</div>
        
        <table style="width: 100%; border-collapse: collapse;">
          ${row('Jaar', wine.jaar)}
          ${row('Druif', wine.druif)}
          ${row('Regio', wine.regio)}
          ${row('Prijs', wine.prijs)}
          ${row('Gastronomie', wine.gastro)}
        </table>
      </div>

      <div class="card">
        <div class="section-title">Uiterlijk</div>
        <table style="width: 100%; border-collapse: collapse;">
          ${row('Helderheid', wine.helderheid)}
          ${row('Intensiteit', wine.intensiteit)}
          ${row('Kleur', wine.kleur)}
        </table>
      </div>

      <div class="card">
        <div class="section-title">Geur</div>
        <table style="width: 100%; border-collapse: collapse;">
          ${row('Conditie', wine.conditie)}
          ${row('Intensiteit', wine.geurInt)}
          ${row('Aroma\'s', wine.aroma)}
        </table>
        ${wine.notitieGeur ? `<div style="margin-top: 8px; padding: 8px; background: var(--color-bg-secondary); border-radius: 4px; font-size: 13px;">${wine.notitieGeur}</div>` : ''}
      </div>

      <div class="card">
        <div class="section-title">Smaak</div>
        <table style="width: 100%; border-collapse: collapse;">
          ${row('Zoetheid', wine.zoetheid)}
          ${row('Zuur', wine.zuur)}
          ${row('Tannine', wine.tannine)}
          ${row('Body', wine.body)}
          ${row('Intensiteit', wine.smaakInt)}
          ${row('Smaken', wine.smaak)}
          ${row('Afdronk', wine.afdronk)}
        </table>
        ${wine.notitieSmaak ? `<div style="margin-top: 8px; padding: 8px; background: var(--color-bg-secondary); border-radius: 4px; font-size: 13px;">${wine.notitieSmaak}</div>` : ''}
      </div>

      <div class="card">
        <div class="section-title">Conclusie</div>
        <table style="width: 100%; border-collapse: collapse;">
          ${row('Kwaliteit', wine.kwaliteit)}
        </table>
      </div>
      <div class="card" style="background: #f5f5f5; border-left: 4px solid #4caf50;">
        <div class="section-title">Expert vs. Jij</div>
        <div style="font-size: 12px; color: var(--color-text-secondary); line-height: 1.6;">
          Heb je de AI-checker al gebruikt? Klik op "Laat nakijken door AI-sommelier" om je antwoorden te vergelijken met een expert sommelier.
        </div>
      </div>

      <button class="button" onclick="checkWithAI(${wine.id})" style="width: 100%; margin-top: 1rem; background: #e8f5e9; color: #2e7d32; font-weight: 500;">🔍 Laat nakijken door AI-sommelier</button>
      
      <button class="button" onclick="deleteWine(${wine.id})" style="width: 100%; margin-top: 0.5rem; background: #ffebee; color: #c62828;">Verwijderen</button>
    </div>
  `;
}

function deleteWine(id) {
  wines = wines.filter(w => w.id !== id);
  saveWines();
  showToast('Notitie verwijderd');
  showScreen('lijst');
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

// ============= AI SERVICE (pluggable) =============
const AI_PROVIDER = 'gemini'; // 'gemini' of 'claude' — wissel hier later!

async function analyzeWineLabel(imageBase64, mediaType) {
  if (AI_PROVIDER === 'gemini') {
    return analyzeWithGemini(imageBase64, mediaType);
  } else if (AI_PROVIDER === 'claude') {
    return analyzeWithClaude(imageBase64, mediaType);
  }
}

async function analyzeWithGemini(imageBase64, mediaType) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mediaType,
              data: imageBase64
            }
          },
          {
            text: 'Analyseer dit wijnetiket. Geef ALLEEN een JSON object (geen markdown, geen backticks) met deze velden: naam, druif, jaar, regio, type (Rood/Wit/Rosé/Mousseux/Dessertwijn). Zet null voor onleesbare velden.'
          }
        ]
      }]
    });

    console.log('Gemini response:', response.text);
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Kon JSON niet uit respons halen');
    
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini fout:', err);
    throw new Error('Kon etiket niet herkennen met Gemini');
  }
}

async function analyzeWithClaude(imageBase64, mediaType) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Claude API key niet ingesteld');
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: 'Analyseer dit wijnetiket. Geef ALLEEN een JSON object (geen markdown, geen backticks) met deze velden: naam, druif, jaar, regio, type (Rood/Wit/Rosé/Mousseux/Dessertwijn). Zet null voor onleesbare velden.'
            }
          ]
        }]
      })
    });
    
    const data = await response.json();
    if (!data.content?.[0]?.text) {
      throw new Error('Geen respons van Claude');
    }
    
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Kon JSON niet uit respons halen');
    
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Claude fout:', err);
    throw new Error('Kon etiket niet herkennen met Claude');
  }
}

async function analyzeLabel() {
  if (!scannedWineData) return;
  
  const analyzeBtn = document.getElementById('analyze-btn');
  const status = document.getElementById('scan-status');
  const resultText = document.getElementById('scan-result-text');
  const useBtn = document.getElementById('use-btn');
  
  // Disable analyze button zodat je niet opnieuw kan klikken
  analyzeBtn.disabled = true;
  analyzeBtn.style.opacity = '0.5';
  
  status.style.display = 'block';
  resultText.innerHTML = '<span class="spinner"></span> AI analyseert het etiket...';
  useBtn.style.display = 'none';
  
  const base64 = scannedWineData.base64;
  const mediaType = scannedWineData.mediaType || 'image/jpeg';
  
  try {
    const info = await analyzeWineLabel(base64, mediaType);
    scannedWineData = { ...scannedWineData, ...info };
    
    resultText.innerHTML = `<strong>${info.naam || '?'}</strong><br><span style="color:var(--color-text-secondary);">${[info.druif, info.regio, info.jaar].filter(Boolean).join(' · ')}</span>`;
    
    useBtn.style.display = 'block';
  } catch (err) {
    resultText.innerHTML = `<span style="color: #c62828;">${err.message}</span>`;
    analyzeBtn.disabled = false;
    analyzeBtn.style.opacity = '1';
  }
}

async function checkWithAI(wineId) {
  const wine = wines.find(w => w.id === wineId);
  if (!wine) return;
  
  const app = document.getElementById('app');
  let resultDiv = document.getElementById('ai-check-result');
  
  if (!resultDiv) {
    resultDiv = document.createElement('div');
    resultDiv.id = 'ai-check-result';
    resultDiv.style.marginTop = '1rem';
    resultDiv.style.padding = '1.5rem';
    resultDiv.style.background = 'var(--color-bg-secondary)';
    resultDiv.style.borderRadius = '4px';
    resultDiv.style.border = '2px solid #4caf50';
    app.appendChild(resultDiv);
  }
  
  resultDiv.innerHTML = '<span class="spinner"></span> AI analyseert wijn...';
  
  try {
    // Stap 1: AI analyseert wijn online
    const analysisPrompt = `Je bent een WSET Level 2 sommelier en wijncriticus. Je taak:

1. ANALYSEER online deze wijn (Vivino, recensies, technische fiches):
${wine.naam} ${wine.jaar} - ${wine.druif} - ${wine.regio}

2. SCHRIJF je eigen korte proefnotitie (max 8 regels) in dit format:
UITERLIJK: [kleur + intensiteit]
NEUS: [dominante aroma's]
SMAAK: [smaakkenmerken, body, afdronk]
KWALITEIT: [waardering slecht/redelijk/goed/heel goed/voortreffelijk]`;

    const expertNotice = await callGemini(analysisPrompt);
    resultDiv.innerHTML = '<span class="spinner"></span> Vergelijkt met jouw notitie...';
    
    // Stap 2: AI vergelijkt en geeft feedback
    const comparisonPrompt = `Je bent een WSET Level 2 sommelier. Je hebt zojuist deze proefnotitie geschreven:

${expertNotice}

---

Nu vergelijk je met de student-notitie voor dezelfde wijn:

STUDENT NOTITIE:
Uiterlijk: ${wine.kleur || 'niet ingevuld'} | ${wine.helderheid || ''} | ${wine.intensiteit || ''}
Neus: ${wine.aroma || 'niet ingevuld'}
${wine.notitieGeur ? 'Geur notities: ' + wine.notitieGeur : ''}
Smaak: ${wine.smaak || 'niet ingevuld'} | Body: ${wine.body || ''} | Afdronk: ${wine.afdronk || ''}
${wine.notitieSmaak ? 'Smaak notities: ' + wine.notitieSmaak : ''}
Kwaliteit: ${wine.kwaliteit || 'niet ingevuld'}

---

GEEF OUTPUT in EXACT dit format (niets anders):

**EXPERT ANALYSE**
[Jouw korte 2-3 zin samenvatting van wat deze wijn bijzonder maakt]

**SCORE: X/10**
[1 zin waarom deze score]

**FEEDBACK (3 punten)**
✓ Dit ging goed: [1 ding dat de student goed deed]
△ Dit kon beter: [1 ding om te verbeteren]
→ Tip: [1 concrete tip]

Zorg dat alles KORT, DUIDELIJK en CONSTRUCTIEF is. Geen lange teksten.`;

    const feedback = await callGemini(comparisonPrompt);
    
    // Parse en display
    resultDiv.innerHTML = `
      <div style="color: #4caf50; font-weight: bold; margin-bottom: 1rem; font-size: 14px;">✓ AI FEEDBACK</div>
      ${feedback.split('\n').map(line => {
        if (line.includes('**')) {
          return `<div style="font-weight: 500; margin-top: 0.75rem; margin-bottom: 0.5rem; font-size: 13px;">${line.replace(/\*\*/g, '')}</div>`;
        }
        if (line.trim() === '') return '';
        return `<div style="font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 0.5rem;">${line}</div>`;
      }).join('')}
    `;
    
  } catch (err) {
    resultDiv.innerHTML = `<span style="color: #c62828;">❌ Fout: ${err.message}</span>`;
  }
}

async function callGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key niet ingesteld');
  
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [{
      role: "user",
      parts: [{ text: prompt }]
    }]
  });
  
  return response.text;
}


// ============= INIT =============
async function init() {
  await initDB();
  await loadWines();
  render();
}

// Wacht tot DOM geladen is, dan init
document.addEventListener('DOMContentLoaded', init);

// Zet functies globaal zodat HTML ze kan aanroepen
window.switchScreen = switchScreen;
window.saveWine = saveWine;
window.showDetail = showDetail;
window.deleteWine = deleteWine;
window.toggleChip = toggleChip;
window.handleImageUpload = handleImageUpload;
window.analyzeLabel = analyzeLabel;
window.useScannedWine = useScannedWine;
window.render = render;
window.setFilter = setFilter;
window.filterAndSearch = filterAndSearch;
window.checkWithAI = checkWithAI;