// App state (je gegevens in het geheugen)
let wines = [];
let currentScreen = 'lijst';
let chipState = {};

// ============= OPSLAG =============
async function loadWines() {
  try {
    const stored = localStorage.getItem('wset-wines');
    wines = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Fout bij laden:', e);
  }
}

async function saveWines() {
  try {
    localStorage.setItem('wset-wines', JSON.stringify(wines));
  } catch (e) {
    console.error('Fout bij opslaan:', e);
  }
}

// ============= INTERFACE =============
function render() {
  const app = document.getElementById('app');
  
  if (currentScreen === 'lijst') {
    renderList(app);
  } else if (currentScreen === 'nieuw') {
    renderForm(app);
  }
}

function renderList(container) {
  container.innerHTML = `
    <div class="app">
      <h1>Mijn wijnen</h1>
      <button class="button" onclick="switchScreen('nieuw')">+ Nieuwe notitie</button>
      <div class="wine-list" id="wine-list"></div>
    </div>
  `;
  
  const list = document.getElementById('wine-list');
  if (wines.length === 0) {
    list.innerHTML = '<div class="empty-state">Nog geen wijnen. Voeg je eerste toe!</div>';
  } else {
    list.innerHTML = wines.map(w => `
      <div class="wine-card" onclick="showDetail(${w.id})">
        <div style="font-weight: 500;">${w.naam}</div>
        <div style="font-size: 12px; color: var(--color-text-secondary);">
          ${[w.druif, w.regio, w.jaar].filter(Boolean).join(' · ')}
        </div>
      </div>
    `).join('');
  }
}

function renderForm(container) {
  container.innerHTML = `
    <div class="app">
      <h1>Proefformulier WSET L1</h1>
      <div class="card">
        <div class="section-title">Wijninfo</div>
        <div class="field">
          <label>Naam / producent</label>
          <input type="text" id="f-naam" placeholder="bijv. Jacob's Creek Shiraz">
        </div>
        <div class="field">
          <label>Druivenras</label>
          <input type="text" id="f-druif" placeholder="bijv. Shiraz">
        </div>
        <div class="field">
          <label>Type</label>
          <select id="f-type">
            <option>Rood</option>
            <option>Wit</option>
            <option>Rosé</option>
          </select>
        </div>
      </div>
      
      <button class="button" onclick="saveWine()" style="width: 100%;">Opslaan</button>
      <button class="button" onclick="switchScreen('lijst')" style="width: 100%; margin-top: 0.5rem;">Annuleren</button>
    </div>
  `;
}

function switchScreen(screen) {
  currentScreen = screen;
  render();
}

function saveWine() {
  const naam = document.getElementById('f-naam').value.trim();
  if (!naam) {
    alert('Vul minimaal de naam in');
    return;
  }
  
  wines.push({
    id: Date.now(),
    naam,
    druif: document.getElementById('f-druif').value.trim(),
    type: document.getElementById('f-type').value,
    datum: new Date().toLocaleDateString('nl-NL')
  });
  
  saveWines();
  switchScreen('lijst');
}

function showDetail(id) {
  const wine = wines.find(w => w.id === id);
  if (!wine) return;
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="app">
      <button onclick="switchScreen('lijst')">← Terug</button>
      <h1>${wine.naam}</h1>
      <p>Druif: ${wine.druif}</p>
      <p>Type: ${wine.type}</p>
      <p>Datum: ${wine.datum}</p>
      <button class="button" onclick="deleteWine(${wine.id})">Verwijderen</button>
    </div>
  `;
}

function deleteWine(id) {
  wines = wines.filter(w => w.id !== id);
  saveWines();
  switchScreen('lijst');
}

// ============= INIT =============
async function init() {
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
window.render = render;
