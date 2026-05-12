const GEN_RANGES = [
  { id: 1, label: 'Gen 1 · Kanto', start: 1, end: 151 },
  { id: 2, label: 'Gen 2 · Johto', start: 152, end: 251 },
  { id: 3, label: 'Gen 3 · Hoenn', start: 252, end: 386 },
  { id: 4, label: 'Gen 4 · Sinnoh', start: 387, end: 493 },
  { id: 5, label: 'Gen 5 · Unys', start: 494, end: 649 },
];

const STORAGE_KEY = 'site-shiny-v3';
const LEGACY_SPLIT_GAMES = {
  'HeartGold / SoulSilver': ['HeartGold', 'SoulSilver'],
  'HeartGold/SoulSilver': ['HeartGold', 'SoulSilver'],
  'HGSS': ['HeartGold', 'SoulSilver'],
  'Rouge Feu / Vert Feuille': ['Rouge Feu', 'Vert Feuille'],
  'Rouge Feu/Vert Feuille': ['Rouge Feu', 'Vert Feuille'],
  'RFVF': ['Rouge Feu', 'Vert Feuille'],
  'Noir / Blanc': ['Noir', 'Blanc'],
  'Noir/Blanc': ['Noir', 'Blanc'],
  'Noir 2 / Blanc 2': ['Noir 2', 'Blanc 2'],
  'Noir 2/Blanc 2': ['Noir 2', 'Blanc 2'],
};
const LOCAL_SPRITE_BASE = 'Icones/pokesprite-master/pokesprite-master/icons/pokemon';
const API_LIST = 'https://pokeapi.co/api/v2/pokemon?limit=649';
const FALLBACK_NAMES = ['bulbasaur','ivysaur','venusaur','charmander','charmeleon','charizard','squirtle','wartortle','blastoise','caterpie','metapod','butterfree','weedle','kakuna','beedrill','pidgey','pidgeotto','pidgeot','rattata','raticate','spearow','fearow','ekans','arbok','pikachu','raichu','sandshrew','sandslash','nidoran-f','nidorina','nidoqueen','nidoran-m','nidorino','nidoking','clefairy','clefable','vulpix','ninetales','jigglypuff','wigglytuff','zubat','golbat','oddish','gloom','vileplume','paras','parasect','venonat','venomoth','diglett','dugtrio','meowth','persian','psyduck','golduck','mankey','primeape','growlithe','arcanine','poliwag','poliwhirl','poliwrath','abra','kadabra','alakazam','machop','machoke','machamp','bellsprout','weepinbell','victreebel','tentacool','tentacruel','geodude','graveler','golem','ponyta','rapidash','slowpoke','slowbro','magnemite','magneton','farfetchd','doduo','dodrio','seel','dewgong','grimer','muk','shellder','cloyster','gastly','haunter','gengar','onix','drowzee','hypno','krabby','kingler','voltorb','electrode','exeggcute','exeggutor','cubone','marowak','hitmonlee','hitmonchan','lickitung','koffing','weezing','rhyhorn','rhydon','chansey','tangela','kangaskhan','horsea','seadra','goldeen','seaking','staryu','starmie','mr-mime','scyther','jynx','electabuzz','magmar','pinsir','tauros','magikarp','gyarados','lapras','ditto','eevee','vaporeon','jolteon','flareon','porygon','omanyte','omastar','kabuto','kabutops','aerodactyl','snorlax','articuno','zapdos','moltres','dratini','dragonair','dragonite','mewtwo','mew'];

let pokemon = [];
let currentGen = 1;
let currentView = 'dex';
let selectedPokemon = null;
let state = loadState();

const $ = (id) => document.getElementById(id);

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function slug(name) { return name.toLowerCase().replace(/♀/g, '-f').replace(/♂/g, '-m').replace(/[.’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function displayName(name) { return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace('Nidoran F','Nidoran♀').replace('Nidoran M','Nidoran♂').replace('Mr Mime','M. Mime'); }
function dexNo(id) { return `#${String(id).padStart(3, '0')}`; }
function getEntry(id) {
  const entry = state[id] || {};
  return { shiny: Boolean(entry.shiny), hunts: Array.isArray(entry.hunts) ? entry.hunts : [], shinies: Array.isArray(entry.shinies) ? entry.shinies : [] };
}
function setEntry(id, patch) { state[id] = { ...getEntry(id), ...patch }; saveState(); }
function generationOf(id) { return GEN_RANGES.find(g => id >= g.start && id <= g.end)?.id || 1; }
function spriteSrc(mon, shiny = false) { return `${LOCAL_SPRITE_BASE}/${shiny ? 'shiny' : 'regular'}/${slug(mon.name)}.png`; }
function fallbackSprite(mon, shiny = false) { return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${shiny ? 'shiny/' : ''}${mon.id}.png`; }

async function init() {
  buildViewTabs();
  buildTabs();
  bindEvents();
  await loadPokemon();
  render();
}

async function loadPokemon() {
  try {
    const res = await fetch(API_LIST);
    if (!res.ok) throw new Error('PokéAPI indisponible');
    const data = await res.json();
    pokemon = data.results.map((p, i) => ({ id: i + 1, name: p.name, gen: generationOf(i + 1) }));
    $('notice').innerHTML = 'Pokédex chargé. Les données sont sauvegardées automatiquement dans ce navigateur.';
  } catch (err) {
    pokemon = FALLBACK_NAMES.map((name, i) => ({ id: i + 1, name, gen: 1 }));
    $('notice').innerHTML = 'Mode hors-ligne partiel : seule la Gen 1 est disponible sans connexion. Ouvre la page avec Internet une fois pour charger les 649 Pokémon.';
  }
}

function buildViewTabs() {
  const tabs = [
    { id: 'dex', label: 'Pokédex' },
    { id: 'collection', label: 'Mes shinys obtenus' },
    { id: 'games', label: 'Shasses par jeu' },
  ];
  $('viewTabs').innerHTML = tabs.map(t => `<button class="tab ${t.id === currentView ? 'active' : ''}" data-view="${t.id}">${t.label}</button>`).join('');
}

function buildTabs() {
  $('generationTabs').innerHTML = GEN_RANGES.map(g => `<button class="tab ${g.id === currentGen ? 'active' : ''}" data-gen="${g.id}">${g.label}</button>`).join('');
}

function bindEvents() {
  $('viewTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    currentView = btn.dataset.view;
    buildViewTabs();
    render();
  });

  $('generationTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-gen]');
    if (!btn) return;
    currentGen = Number(btn.dataset.gen);
    buildTabs();
    render();
  });
  ['searchInput', 'onlyHunted', 'onlyMissing'].forEach(id => $(id).addEventListener('input', render));
  $('huntForm').addEventListener('submit', saveHuntFromDialog);
  $('resetPokemonBtn').addEventListener('click', resetSelectedPokemon);
  $('closeDialogBtn').addEventListener('click', closeHuntDialog);
  $('exportDataBtn').addEventListener('click', exportData);
  $('importDataInput').addEventListener('change', importData);

  // Sécurité : tout bouton du formulaire qui n'est pas explicitement submit ne doit jamais valider la shasse.
  $('huntForm').querySelectorAll('button:not([type])').forEach(btn => { btn.type = 'button'; });
  enhanceSelects();
}

function filteredPokemon() {
  const term = $('searchInput').value.trim().toLowerCase();
  const onlyHunted = $('onlyHunted').checked;
  const onlyMissing = $('onlyMissing').checked;
  return pokemon.filter(mon => {
    const entry = getEntry(mon.id);
    if (mon.gen !== currentGen) return false;
    if (term && !mon.name.includes(term) && !String(mon.id).includes(term)) return false;
    if (onlyHunted && !entry.hunts.length) return false;
    if (onlyMissing && entry.shiny) return false;
    return true;
  });
}

function render() {
  renderStats();
  $('dexToolbar').style.display = currentView === 'dex' ? 'flex' : 'none';

  if (currentView === 'collection') {
    renderCollectionView();
    return;
  }

  if (currentView === 'games') {
    renderGamesView();
    return;
  }

  const list = filteredPokemon();
  $('dexGrid').className = 'dex-grid';
  $('dexGrid').innerHTML = list.map(mon => cardHTML(mon)).join('') || '<p class="notice">Aucun Pokémon ne correspond aux filtres.</p>';
  bindCardButtons();
}

function bindCardButtons() {
  $('dexGrid').querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => openDialog(Number(btn.dataset.open))));
  $('dexGrid').querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => openDialog(Number(btn.dataset.toggle), true)));
  $('dexGrid').querySelectorAll('[data-delete-hunt]').forEach(btn => btn.addEventListener('click', () => deleteHunt(Number(btn.dataset.deleteHunt), Number(btn.dataset.huntIndex), btn.dataset.huntKey)));
  $('dexGrid').querySelectorAll('[data-delete-shiny]').forEach(btn => btn.addEventListener('click', () => deleteShiny(Number(btn.dataset.deleteShiny), Number(btn.dataset.shinyIndex))));
}

function renderCollectionView() {
  const rows = [];
  pokemon.forEach(mon => {
    getEntry(mon.id).shinies.forEach((shiny, index) => rows.push({ mon, shiny, index }));
  });

  $('dexGrid').className = 'dex-grid collection-view-grid';
  $('dexGrid').innerHTML = rows.length ? rows.map(({ mon, shiny, index }) => collectionCardHTML(mon, shiny, index)).join('') : `
    <section class="empty-panel">
      <h2>Aucun shiny enregistré pour le moment</h2>
      <p>Va dans le Pokédex, clique sur <b>J’ai le shiny</b>, puis renseigne le jeu, le lieu, les rencontres et les phases.</p>
    </section>`;
  bindCardButtons();
}

function renderGamesView() {
  const games = collectHuntsByGame();
  const gameNames = Object.keys(games).sort((a, b) => a.localeCompare(b, 'fr'));

  $('dexGrid').className = 'game-hunts-view';
  $('dexGrid').innerHTML = gameNames.length ? gameNames.map(game => gameSectionHTML(game, games[game])).join('') : `
    <section class="empty-panel">
      <h2>Aucune shasse préparée</h2>
      <p>Ajoute une shasse depuis une carte Pokémon. Les jeux sont maintenant séparés : Rouge Feu et Vert Feuille auront chacun leur propre section.</p>
    </section>`;
  bindCardButtons();
}

function collectHuntsByGame() {
  const grouped = {};
  pokemon.forEach(mon => {
    getEntry(mon.id).hunts.forEach((hunt, index) => {
      const names = expandGameNames(hunt.game || 'Jeu non indiqué');
      names.forEach(game => {
        if (!grouped[game]) grouped[game] = [];
        grouped[game].push({ mon, hunt, index, game });
      });
    });
  });
  return grouped;
}

function expandGameNames(game) {
  const clean = String(game || '').trim() || 'Jeu non indiqué';
  if (LEGACY_SPLIT_GAMES[clean]) return LEGACY_SPLIT_GAMES[clean];
  if (clean.includes('/')) {
    return clean.split('/').map(part => part.trim()).filter(Boolean);
  }
  return [clean];
}

const GAME_CLASS_MAP = {
  'Rouge': 'version-rouge',
  'Bleu': 'version-bleu',
  'Jaune': 'version-jaune',
  'Or': 'version-or',
  'Argent': 'version-argent',
  'Cristal': 'version-cristal',
  'Rubis': 'version-rubis',
  'Saphir': 'version-saphir',
  'Émeraude': 'version-emeraude',
  'Emeraude': 'version-emeraude',
  'Rouge Feu': 'version-rouge-feu',
  'Vert Feuille': 'version-vert-feuille',
  'Diamant': 'version-diamant',
  'Perle': 'version-perle',
  'Platine': 'version-platine',
  'HeartGold': 'version-heartgold',
  'SoulSilver': 'version-soulsilver',
  'Noir': 'version-noir',
  'Blanc': 'version-blanc',
  'Noir 2': 'version-noir',
  'Blanc 2': 'version-blanc',
};


const METHOD_CLASS_MAP = {
  'Rencontres aléatoires': 'method-random',
  'Reset': 'method-reset',
  'Œufs / Masuda': 'method-masuda',
  'Oeufs / Masuda': 'method-masuda',
  'Poké Radar': 'method-radar',
  'Pêche': 'method-fishing',
  'Safari': 'method-safari',
  'Hordes / doubles rencontres': 'method-horde',
  'Événement': 'method-event',
  'Evenement': 'method-event',
  'Autre': 'method-other',
};

const STATUS_CLASS_MAP = {
  planned: 'status-planned',
  active: 'status-active',
  done: 'status-done',
};

function selectThemeClass(select) {
  if (!select) return '';
  const value = select.value;
  if (select.id === 'gameInput') return GAME_CLASS_MAP[value] || 'version-other';
  if (select.id === 'methodInput') return METHOD_CLASS_MAP[value] || 'method-other';
  if (select.id === 'statusInput') return STATUS_CLASS_MAP[value] || 'status-planned';
  return '';
}

function refreshSelectTheme(select) {
  if (!select) return;
  const removable = [...Object.values(GAME_CLASS_MAP), 'version-other', ...Object.values(METHOD_CLASS_MAP), ...Object.values(STATUS_CLASS_MAP)];
  select.classList.add('themed-select');
  select.classList.remove(...removable);
  select.classList.add(selectThemeClass(select));
}

function enhanceSelects() {
  ['gameInput', 'methodInput', 'statusInput'].forEach(id => {
    const select = $(id);
    if (!select) return;
    [...select.options].forEach(option => {
      const value = option.value || option.textContent.trim();
      const cls = id === 'gameInput' ? GAME_CLASS_MAP[value] : id === 'methodInput' ? METHOD_CLASS_MAP[value] : STATUS_CLASS_MAP[value];
      if (cls) option.className = cls;
    });
    refreshSelectTheme(select);
    select.addEventListener('change', () => refreshSelectTheme(select));
    select.addEventListener('input', () => refreshSelectTheme(select));
  });
}

function huntKey(hunt, index = 0) {
  return encodeURIComponent([hunt.createdAt || '', hunt.game || '', hunt.method || '', hunt.location || '', index].join('||'));
}

function gameNameHTML(game) {
  const clean = String(game || '').trim() || 'Jeu non indiqué';
  if (clean.includes('/')) {
    return clean.split('/').map(part => gameNameHTML(part.trim())).join(' <span class="game-separator">/</span> ');
  }
  const cls = GAME_CLASS_MAP[clean] || 'version-other';
  return `<span class="game-name ${cls}">${escapeHTML(clean)}</span>`;
}

function gameTitleHTML(game) {
  return `<span class="pkm-prefix">Pokémon</span> ${gameNameHTML(game)}`;
}

function collectionCardHTML(mon, shiny, index) {
  return `<article class="pokemon-card collection-card">
    <div class="dex-number">${dexNo(mon.id)} · shiny #${index + 1}</div>
    <div class="sprite-wrap"><img src="${spriteSrc(mon, true)}" alt="${displayName(mon.name)} shiny" onerror="this.onerror=null;this.src='${fallbackSprite(mon, true)}'"></div>
    <h3>${displayName(mon.name)}</h3>
    <div class="mini-details">
      <p><b>Jeu :</b> ${gameNameHTML(shiny.game || 'Non indiqué')}</p>
      <p><b>Méthode :</b> ${escapeHTML(shiny.method || 'Non indiquée')}</p>
      ${shiny.location ? `<p><b>Lieu :</b> ${escapeHTML(shiny.location)}</p>` : ''}
      ${shiny.seen ? `<p><b>Rencontres :</b> ${escapeHTML(String(shiny.seen))}</p>` : ''}
      ${shiny.phases ? `<p><b>Phases :</b> ${escapeHTML(String(shiny.phases))}</p>` : ''}
    </div>
    <div class="card-actions"><button data-open="${mon.id}">Voir / modifier</button><button class="danger-btn" data-delete-shiny="${mon.id}" data-shiny-index="${index}">Supprimer</button></div>
  </article>`;
}

function gameSectionHTML(game, rows) {
  return `<section class="game-section">
    <div class="game-section-head">
      <h2>${gameTitleHTML(game)}</h2>
      <span>${rows.length} shasse${rows.length > 1 ? 's' : ''}</span>
    </div>
    <div class="game-hunt-list">
      ${rows.map(({ mon, hunt, index, game }) => gameHuntRowHTML(mon, hunt, index, game)).join('')}
    </div>
  </section>`;
}

function gameHuntRowHTML(mon, hunt, index, visibleGame = '') {
  const entry = getEntry(mon.id);
  const key = huntKey(hunt, index);
  return `<article class="game-hunt-row">
    <img src="${entry.shiny ? spriteSrc(mon, true) : spriteSrc(mon, false)}" class="${entry.shiny ? '' : 'missing'}" alt="${displayName(mon.name)}" onerror="this.onerror=null;this.src='${fallbackSprite(mon, entry.shiny)}'">
    <div>
      <h3>${dexNo(mon.id)} · ${displayName(mon.name)}</h3>
      <p><b>Jeu :</b> ${gameNameHTML(visibleGame || hunt.game || 'Jeu non indiqué')}</p>
      <p><b>${escapeHTML(hunt.method || 'Méthode non indiquée')}</b> · ${escapeHTML(String(hunt.encounter || 0))}% · ${statusLabel(hunt.status)}</p>
      ${hunt.location ? `<p><b>Lieu :</b> ${escapeHTML(hunt.location)}</p>` : ''}
      ${hunt.seen ? `<p><b>Rencontres :</b> ${escapeHTML(String(hunt.seen))}</p>` : ''}
      ${hunt.phases ? `<p><b>Phases :</b> ${escapeHTML(String(hunt.phases))}</p>` : ''}
      ${hunt.notes ? `<p>${escapeHTML(hunt.notes)}</p>` : ''}
    </div>
    <div class="row-actions">
      <button data-open="${mon.id}">Ouvrir</button>
      <button class="danger-btn" data-delete-hunt="${mon.id}" data-hunt-index="${index}" data-hunt-key="${key}">Supprimer</button>
    </div>
  </article>`;
}

function cardHTML(mon) {
  const entry = getEntry(mon.id);
  const src = entry.shiny ? spriteSrc(mon, true) : spriteSrc(mon, false);
  return `<article class="pokemon-card">
    <div class="dex-number">${dexNo(mon.id)}</div>
    <div class="sprite-wrap"><img class="${entry.shiny ? '' : 'missing'}" src="${src}" alt="${displayName(mon.name)}" onerror="this.onerror=null;this.src='${fallbackSprite(mon, entry.shiny)}'"></div>
    <h3>${displayName(mon.name)}</h3>
    <div class="badges">
      <span class="badge ${entry.shiny ? 'shiny' : ''}">${entry.shiny ? 'Shiny obtenu' : 'À obtenir'}</span>
      ${entry.shinies.length ? `<span class="badge shiny">${entry.shinies.length} shiny${entry.shinies.length > 1 ? 's' : ''}</span>` : ''}
      ${entry.hunts.length ? `<span class="badge hunt">${entry.hunts.length} shasse${entry.hunts.length > 1 ? 's' : ''}</span>` : ''}
    </div>
    <div class="card-actions">
      <button data-open="${mon.id}">Ajouter</button>
      <button data-toggle="${mon.id}">J’ai le shiny</button>
    </div>
  </article>`;
}

function closeHuntDialog() {
  $('huntDialog').close();
  $('huntForm').reset();
  selectedPokemon = null;
}

function renderStats() {
  const total = pokemon.length || 649;
  const shiny = pokemon.filter(mon => getEntry(mon.id).shiny).length;
  const hunts = pokemon.reduce((sum, mon) => sum + getEntry(mon.id).hunts.length, 0);
  const shinyCopies = pokemon.reduce((sum, mon) => sum + getEntry(mon.id).shinies.length, 0);
  $('stats').innerHTML = `
    <div class="stat-card"><strong>${shiny}</strong><span>espèces shiny</span></div>
    <div class="stat-card"><strong>${shinyCopies}</strong><span>shinys collection</span></div>
    <div class="stat-card"><strong>${hunts}</strong><span>shasses notées</span></div>`;
}

function openDialog(id, shinyMode = false) {
  selectedPokemon = pokemon.find(p => p.id === id);
  const entry = getEntry(id);
  $('dialogTitle').textContent = displayName(selectedPokemon.name);
  $('dialogNumber').textContent = dexNo(id);
  $('dialogSprite').src = entry.shiny ? spriteSrc(selectedPokemon, true) : spriteSrc(selectedPokemon, false);
  $('dialogSprite').onerror = () => { $('dialogSprite').onerror = null; $('dialogSprite').src = fallbackSprite(selectedPokemon, entry.shiny); };
  $('dialogFamily').textContent = 'Astuce : coche “évolutions” pour copier cette shasse à toute la famille via PokéAPI.';
  $('markShinyInput').checked = shinyMode || entry.shiny;
  $('statusInput').value = shinyMode ? 'done' : 'planned';
  ['gameInput', 'methodInput', 'statusInput'].forEach(id => refreshSelectTheme($(id)));
  renderCollectionList(id);
  renderHuntList(id);
  $('huntDialog').showModal();
}

function renderHuntList(id) {
  const hunts = getEntry(id).hunts;
  $('huntList').innerHTML = `<h3 class="list-title">Shasses préparées</h3>` + (hunts.length ? hunts.map((h, index) => `<div class="hunt-row hunt-row-with-action ${h.status === 'active' ? 'hunt-active' : ''}">
    <div>
      <strong>${gameNameHTML(h.game || 'Jeu non indiqué')}</strong> · ${escapeHTML(h.method)} · ${escapeHTML(String(h.encounter || 0))}% · ${statusLabel(h.status)}
      ${h.location ? `<p><b>Lieu :</b> ${escapeHTML(h.location)}</p>` : ''}
      ${h.seen ? `<p><b>Rencontres :</b> ${escapeHTML(String(h.seen))}</p>` : ''}
      ${h.phases ? `<p><b>Phases :</b> ${escapeHTML(String(h.phases))}</p>` : ''}
      ${h.notes ? `<p>${escapeHTML(h.notes)}</p>` : ''}
    </div>
    <button type="button" class="danger-btn" data-delete-hunt="${id}" data-hunt-index="${index}" data-hunt-key="${huntKey(h, index)}">Supprimer</button>
  </div>`).join('') : '<p class="family-line">Aucune shasse enregistrée pour ce Pokémon.</p>');
  $('huntList').querySelectorAll('[data-delete-hunt]').forEach(btn => btn.addEventListener('click', () => deleteHunt(Number(btn.dataset.deleteHunt), Number(btn.dataset.huntIndex), btn.dataset.huntKey)));
}

function renderCollectionList(id) {
  const shinies = getEntry(id).shinies;
  $('collectionList').innerHTML = `<h3 class="list-title">Collection shiny</h3>` + (shinies.length ? shinies.map((s, index) => `<div class="hunt-row shiny-row hunt-row-with-action">
    <div>
      <strong>${gameNameHTML(s.game || 'Jeu non indiqué')}</strong> · ${escapeHTML(s.method || 'Méthode non indiquée')}
      ${s.location ? `<p><b>Lieu :</b> ${escapeHTML(s.location)}</p>` : ''}
      ${s.seen ? `<p><b>Rencontres :</b> ${escapeHTML(String(s.seen))}</p>` : ''}
      ${s.phases ? `<p><b>Phases :</b> ${escapeHTML(String(s.phases))}</p>` : ''}
      ${s.notes ? `<p>${escapeHTML(s.notes)}</p>` : ''}
    </div>
    <button type="button" class="danger-btn" data-delete-shiny="${id}" data-shiny-index="${index}">Supprimer</button>
  </div>`).join('') : '<p class="family-line">Aucun shiny dans la collection pour ce Pokémon.</p>');
  $('collectionList').querySelectorAll('[data-delete-shiny]').forEach(btn => btn.addEventListener('click', () => deleteShiny(Number(btn.dataset.deleteShiny), Number(btn.dataset.shinyIndex))));
}

function statusLabel(s) { return ({ planned: 'prévue', active: 'en cours', done: 'shiny obtenu' }[s] || s); }
function escapeHTML(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

async function saveHuntFromDialog(e) {
  e.preventDefault();
  if (!selectedPokemon) return;
  const hunt = {
    game: $('gameInput').value,
    method: $('methodInput').value,
    encounter: $('encounterInput').value,
    seen: $('seenInput').value,
    phases: $('phaseInput').value,
    location: $('locationInput').value.trim(),
    status: $('statusInput').value,
    notes: $('notesInput').value.trim(),
    createdAt: new Date().toISOString(),
  };
  const isShinyObtained = $('markShinyInput').checked || hunt.status === 'done';
  const shinyRecord = {
    game: hunt.game,
    method: hunt.method,
    encounter: hunt.encounter,
    seen: hunt.seen,
    phases: hunt.phases,
    location: hunt.location,
    notes: hunt.notes,
    createdAt: hunt.createdAt,
  };
  const ids = $('applyEvolutionInput').checked ? await getEvolutionFamilyIds(selectedPokemon.id) : [selectedPokemon.id];
  ids.forEach(id => {
    const entry = getEntry(id);
    const nextShinies = isShinyObtained ? [...entry.shinies, shinyRecord] : entry.shinies;
    setEntry(id, {
      shiny: isShinyObtained || entry.shiny,
      hunts: [...entry.hunts, hunt],
      shinies: nextShinies,
    });
  });
  e.target.reset();
  ['gameInput', 'methodInput', 'statusInput'].forEach(id => refreshSelectTheme($(id)));
  $('markShinyInput').checked = getEntry(selectedPokemon.id).shiny;
  renderCollectionList(selectedPokemon.id);
  renderHuntList(selectedPokemon.id);
  render();
}

function toggleShiny(id) {
  // Conservé pour compatibilité : le bouton ouvre maintenant la fiche d'ajout collection.
  openDialog(id, true);
}

function resetSelectedPokemon() {
  if (!selectedPokemon) return;
  delete state[selectedPokemon.id];
  saveState();
  renderHuntList(selectedPokemon.id);
  render();
}


function deleteHunt(id, index, key = '') {
  const entry = getEntry(id);
  let targetIndex = Number.isInteger(index) ? index : -1;
  if (key) {
    const decoded = String(key);
    const found = entry.hunts.findIndex((h, i) => huntKey(h, i) === decoded);
    if (found >= 0) targetIndex = found;
  }
  if (!entry.hunts[targetIndex]) return;
  const hunt = entry.hunts[targetIndex];
  const name = pokemon.find(p => p.id === id)?.name || `Pokémon ${id}`;
  const ok = confirm(`Supprimer cette shasse de ${displayName(name)} ?\n${hunt.game || 'Jeu non indiqué'} · ${hunt.method || 'Méthode non indiquée'}`);
  if (!ok) return;
  const hunts = entry.hunts.filter((_, i) => i !== targetIndex);
  setEntry(id, { hunts });
  if (selectedPokemon && selectedPokemon.id === id) renderHuntList(id);
  render();
}

function deleteShiny(id, index) {
  const entry = getEntry(id);
  if (!entry.shinies[index]) return;
  const shiny = entry.shinies[index];
  const name = pokemon.find(p => p.id === id)?.name || `Pokémon ${id}`;
  const ok = confirm(`Supprimer ce shiny de la collection ?\n${displayName(name)} · ${shiny.game || 'Jeu non indiqué'}`);
  if (!ok) return;
  const shinies = entry.shinies.filter((_, i) => i !== index);
  setEntry(id, { shinies, shiny: shinies.length > 0 });
  if (selectedPokemon && selectedPokemon.id === id) renderCollectionList(id);
  render();
}

function exportData() {
  const payload = {
    app: 'Site Shiny',
    version: 10,
    exportedAt: new Date().toISOString(),
    storageKey: STORAGE_KEY,
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `site-shiny-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const importedState = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      if (!importedState || typeof importedState !== 'object' || Array.isArray(importedState)) throw new Error('Format invalide');
      const ok = confirm('Importer cette sauvegarde ? Cela remplacera les shinys et shasses actuellement enregistrés dans ce navigateur.');
      if (!ok) return;
      state = importedState;
      saveState();
      if ($('huntDialog').open) closeHuntDialog();
      render();
      $('notice').innerHTML = 'Sauvegarde importée avec succès. Les données sont à nouveau sauvegardées automatiquement dans ce navigateur.';
    } catch (err) {
      alert('Impossible d’importer ce fichier. Vérifie que c’est bien un export JSON du site.');
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

async function getEvolutionFamilyIds(id) {
  try {
    const species = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}/`).then(r => r.json());
    const chain = await fetch(species.evolution_chain.url).then(r => r.json());
    const names = [];
    walkChain(chain.chain, names);
    return pokemon.filter(p => names.includes(p.name) && p.id <= 649).map(p => p.id);
  } catch {
    alert('Impossible de récupérer les évolutions. La shasse sera ajoutée uniquement à ce Pokémon.');
    return [id];
  }
}
function walkChain(node, out) {
  if (!node) return;
  out.push(node.species.name);
  node.evolves_to.forEach(child => walkChain(child, out));
}

init();
