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
      <h1>Proefformulier</h1>
      
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

      <button class="button" onclick="deleteWine(${wine.id})" style="width: 100%; margin-top: 1rem; background: #ffebee; color: #c62828;">Verwijderen</button>
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
window.toggleChip = toggleChip;
window.render = render;