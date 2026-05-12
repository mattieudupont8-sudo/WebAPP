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
let dialogMode = 'hunt';
let editingHunt = null;
const shinyCardColorCache = {};

// Couleurs stables inspirées des sprites shiny.
// La Gen 1 est fixée à la main pour éviter les erreurs de navigateur/cache.
// Les Gen 2 à 5 utilisent d'abord une détection depuis le sprite, puis un fallback varié.
const SHINY_COLOR_MAP = {
  1:'95, 225, 86', 2:'92, 205, 82', 3:'92, 180, 95',
  4:'255, 192, 43', 5:'255, 203, 38', 6:'178, 64, 66',
  7:'105, 210, 242', 8:'100, 192, 220', 9:'96, 170, 205',
  10:'245, 205, 54', 11:'226, 100, 52', 12:'210, 176, 255',
  13:'245, 196, 48', 14:'98, 98, 108', 15:'128, 134, 150',
  16:'220, 186, 92', 17:'226, 198, 98', 18:'212, 178, 92',
  19:'245, 190, 70', 20:'190, 130, 80', 21:'205, 160, 92', 22:'170, 125, 72',
  23:'170, 115, 210', 24:'170, 115, 210', 25:'245, 168, 50', 26:'220, 145, 42',
  27:'116, 210, 106', 28:'116, 185, 98', 29:'175, 112, 205', 30:'152, 98, 190', 31:'138, 90, 178',
  32:'98, 170, 226', 33:'88, 150, 208', 34:'78, 130, 190',
  35:'152, 238, 238', 36:'120, 212, 225', 37:'210, 178, 82', 38:'206, 160, 74',
  39:'118, 224, 128', 40:'95, 205, 112', 41:'105, 220, 92', 42:'96, 200, 86',
  43:'92, 210, 118', 44:'88, 190, 110', 45:'206, 150, 78',
  46:'238, 176, 72', 47:'210, 160, 68', 48:'96, 170, 238', 49:'86, 150, 220',
  50:'92, 185, 210', 51:'82, 160, 198', 52:'206, 112, 190', 53:'185, 98, 175',
  54:'116, 205, 245', 55:'90, 178, 226', 56:'120, 210, 100', 57:'105, 190, 90',
  58:'245, 204, 82', 59:'220, 180, 70', 60:'90, 205, 115', 61:'88, 188, 110', 62:'82, 170, 105',
  63:'210, 190, 70', 64:'196, 175, 66', 65:'178, 160, 62',
  66:'210, 190, 90', 67:'190, 170, 82', 68:'170, 150, 76',
  69:'215, 196, 80', 70:'190, 176, 72', 71:'175, 160, 68',
  72:'180, 116, 210', 73:'160, 100, 190', 74:'195, 160, 96', 75:'170, 140, 88', 76:'150, 125, 82',
  77:'116, 210, 242', 78:'100, 190, 226', 79:'185, 135, 210', 80:'165, 118, 195',
  81:'200, 170, 70', 82:'178, 150, 66', 83:'210, 178, 105', 84:'112, 210, 112', 85:'100, 190, 100',
  86:'230, 206, 102', 87:'210, 185, 92', 88:'105, 200, 100', 89:'92, 180, 92',
  90:'238, 186, 76', 91:'190, 145, 70', 92:'96, 200, 230', 93:'88, 180, 210', 94:'78, 160, 198',
  95:'190, 176, 112', 96:'205, 160, 80', 97:'185, 145, 75', 98:'238, 190, 76', 99:'220, 170, 68',
  100:'116, 210, 242', 101:'100, 190, 226', 102:'240, 210, 86', 103:'225, 188, 78',
  104:'180, 145, 105', 105:'160, 125, 95', 106:'205, 172, 100', 107:'205, 172, 100',
  108:'212, 166, 92', 109:'100, 200, 110', 110:'90, 180, 100', 111:'180, 150, 92', 112:'160, 132, 84',
  113:'125, 210, 135', 114:'118, 205, 128', 115:'150, 120, 210', 116:'115, 205, 235', 117:'100, 180, 215',
  118:'240, 205, 74', 119:'220, 185, 68', 120:'112, 205, 242', 121:'92, 180, 225',
  122:'130, 195, 220', 123:'120, 210, 106', 124:'210, 116, 210', 125:'238, 178, 70', 126:'206, 116, 70',
  127:'170, 120, 230', 128:'170, 120, 95', 129:'212, 170, 68', 130:'202, 72, 72',
  131:'172, 116, 226', 132:'105, 205, 116', 133:'205, 185, 105', 134:'176, 116, 226',
  135:'112, 210, 128', 136:'236, 178, 66', 137:'116, 205, 242', 138:'210, 170, 92', 139:'190, 150, 84',
  140:'116, 205, 242', 141:'96, 180, 220', 142:'175, 120, 90', 143:'92, 195, 120',
  144:'150, 116, 230', 145:'238, 190, 70', 146:'220, 108, 75', 147:'226, 150, 206', 148:'210, 130, 190', 149:'120, 210, 110',
  150:'120, 210, 105', 151:'102, 210, 220'
};

const SHINY_COLOR_OVERRIDE_MAP = {
  197:'88, 188, 235', 208:'205, 180, 95', 229:'160, 118, 210', 248:'145, 104, 210',
  249:'236, 188, 82', 250:'210, 110, 78', 249:'236,188,82',
  250:'210,110,78', 251:'110, 220, 150',
  303:'236, 190, 82', 334:'245, 198, 88', 373:'92, 188, 112', 376:'222, 185, 80',
  380:'238, 182, 82', 381:'102, 210, 112', 382:'205, 92, 92', 383:'205, 178, 82',
  384:'236, 198, 86', 385:'255, 218, 110', 386:'206, 120, 88',
  389:'152, 188, 96', 390:'238, 138, 188', 391:'232, 112, 168', 392:'224, 98, 156',
  393:'112, 198, 242', 394:'98, 180, 225', 395:'86, 164, 212',
  448:'230, 198, 82', 460:'225, 218, 110', 475:'110, 220, 180',
  483:'232, 178, 110', 484:'205, 112, 188', 487:'188, 206, 92', 491:'188, 92, 205',
  494:'255, 188, 82', 495:'120, 228, 120', 496:'104, 212, 108', 497:'88, 196, 96',
  498:'242, 188, 82', 499:'224, 160, 74', 500:'210, 138, 68',
  501:'112, 205, 242', 502:'96, 186, 224', 503:'82, 166, 208',
  609:'170, 132, 240', 612:'225, 98, 110', 635:'110, 205, 110', 644:'235, 212, 96', 645:'186, 122, 92', 646:'112, 218, 226',
  647:'102, 208, 196', 648:'238, 132, 196', 649:'188, 208, 96'
};

const SHINY_PROCEDURAL_PALETTE = [
  [114, 225, 118], [245, 202, 74], [118, 205, 242], [238, 150, 196], [236, 128, 78],
  [176, 146, 235], [102, 210, 165], [210, 182, 98], [226, 112, 156], [110, 198, 92],
  [132, 190, 236], [236, 170, 108], [204, 130, 224], [152, 225, 112], [242, 214, 104],
  [106, 214, 214], [220, 126, 106], [188, 170, 235], [116, 220, 142], [230, 188, 122]
];

const SHINY_FALLBACK_COLORS = [
  '103, 232, 165', '255, 203, 5', '120, 217, 255', '253, 201, 239',
  '255, 135, 48', '160, 132, 246', '245, 110, 130', '166, 208, 93',
  '208, 208, 216', '238, 164, 106'
];


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
  $('dexGrid').querySelectorAll('[data-open-hunt]').forEach(btn => btn.addEventListener('click', () => openDialog(Number(btn.dataset.openHunt), false, { huntIndex: Number(btn.dataset.huntIndex), huntKey: btn.dataset.huntKey || '' })));
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
  applyShinyCardThemes();
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
  const seenByGame = new Set();
  pokemon.forEach(mon => {
    getEntry(mon.id).hunts.forEach((hunt, index) => {
      const names = expandGameNames(hunt.game || 'Jeu non indiqué');
      names.forEach(game => {
        const dedupeKey = [game, hunt.createdAt || '', hunt.game || '', hunt.method || '', hunt.encounter || '', hunt.location || '', hunt.notes || ''].join('||');
        if (seenByGame.has(dedupeKey)) return;
        seenByGame.add(dedupeKey);
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


function shinyThemeStyle(mon) {
  const rgb = shinyThemeColor(Number(mon.id), mon.name || '');
  return rgb ? `style="--shiny-rgb: ${rgb};"` : '';
}

function collectionCardHTML(mon, shiny, index) {
  return `<article class="pokemon-card collection-card shiny-owned" data-shiny-theme="1" data-mon-id="${mon.id}" data-mon-name="${mon.name}" ${shinyThemeStyle(mon)}>
    <div class="dex-number">${dexNo(mon.id)} · shiny #${index + 1}</div>
    <div class="sprite-wrap"><img crossorigin="anonymous" src="${spriteSrc(mon, true)}" alt="${displayName(mon.name)} shiny" onerror="this.onerror=null;this.src='${fallbackSprite(mon, true)}'"></div>
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
      <button data-open-hunt="${mon.id}" data-hunt-index="${index}" data-hunt-key="${key}">Ouvrir</button>
      <button class="danger-btn" data-delete-hunt="${mon.id}" data-hunt-index="${index}" data-hunt-key="${key}">Supprimer</button>
    </div>
  </article>`;
}

function cardHTML(mon) {
  const entry = getEntry(mon.id);
  const src = entry.shiny ? spriteSrc(mon, true) : spriteSrc(mon, false);
  return `<article class="pokemon-card ${entry.shiny ? 'shiny-owned' : ''}" ${entry.shiny ? `data-shiny-theme="1" data-mon-id="${mon.id}" data-mon-name="${mon.name}" ${shinyThemeStyle(mon)}` : ''}>
    <div class="dex-number">${dexNo(mon.id)}</div>
    <div class="sprite-wrap"><img crossorigin="anonymous" class="${entry.shiny ? '' : 'missing'}" src="${src}" alt="${displayName(mon.name)}" onerror="this.onerror=null;this.src='${fallbackSprite(mon, entry.shiny)}'"></div>
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

function setCardTheme(card, rgb) {
  if (!card || !rgb) return;
  card.style.setProperty('--shiny-rgb', rgb);
}

function applyShinyCardThemes() {
  document.querySelectorAll('.pokemon-card.shiny-owned[data-shiny-theme="1"]').forEach(card => {
    const monId = Number(card.dataset.monId || 0);
    const monName = card.dataset.monName || '';
    const rgb = shinyThemeColor(monId, monName) || shinyFallbackColor(monId, monName);
    setCardTheme(card, rgb);
  });
}

function shinyThemeColor(id, name = '') {
  if (SHINY_COLOR_MAP[id]) return SHINY_COLOR_MAP[id];
  if (SHINY_COLOR_OVERRIDE_MAP[id]) return SHINY_COLOR_OVERRIDE_MAP[id];
  return proceduralShinyColor(id, name);
}

function shinyFallbackColor(id, name = '') {
  return proceduralShinyColor(id, name) || SHINY_FALLBACK_COLORS[id % SHINY_FALLBACK_COLORS.length];
}

function proceduralShinyColor(id, name = '') {
  const paletteIndex = Math.abs(Math.floor((id - 1) / 3) + hashName(name)) % SHINY_PROCEDURAL_PALETTE.length;
  const variant = (id - 1) % 3;
  let [r, g, b] = SHINY_PROCEDURAL_PALETTE[paletteIndex];

  // petites variations par évolution pour garder une famille cohérente
  const tweak = variant === 0 ? 1.06 : variant === 1 ? 0.98 : 0.9;
  r = Math.max(52, Math.min(255, Math.round(r * tweak)));
  g = Math.max(52, Math.min(255, Math.round(g * tweak)));
  b = Math.max(52, Math.min(255, Math.round(b * tweak)));

  return `${r}, ${g}, ${b}`;
}

function hashName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = ((h * 31) + name.charCodeAt(i)) % 9973;
  return h;
}

function extractDominantColor() {
  return null;
}

function closeHuntDialog() {
  $('huntDialog').close();
  $('huntForm').reset();
  selectedPokemon = null;
  dialogMode = 'hunt';
  editingHunt = null;
  setDialogMode('hunt');
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

function setDialogMode(mode, isEditing = false) {
  dialogMode = mode;
  const submit = $('submitDialogBtn');
  const markLabel = $('markShinyInput')?.closest('label');
  const status = $('statusInput');

  if (mode === 'shiny') {
    if (submit) submit.textContent = 'Ajouter le shiny';
    if (markLabel) markLabel.style.display = 'none';
    if (status) status.value = 'done';
    $('dialogFamily').textContent = 'Mode collection : ce bouton ajoute uniquement un shiny, sans créer de shasse.';
  } else if (isEditing) {
    if (submit) submit.textContent = 'Mettre à jour la shasse';
    if (markLabel) markLabel.style.display = '';
    $('dialogFamily').textContent = 'Modification : les infos de la shasse sélectionnée sont préremplies.';
  } else {
    if (submit) submit.textContent = 'Enregistrer la shasse';
    if (markLabel) markLabel.style.display = '';
    $('dialogFamily').textContent = 'Astuce : “évolutions” ne duplique plus les shasses. Si le shiny est obtenu, la famille sera marquée shiny.';
  }
  ['gameInput', 'methodInput', 'statusInput'].forEach(id => refreshSelectTheme($(id)));
}

function fillFormFromHunt(hunt = {}) {
  $('gameInput').value = hunt.game || '';
  $('methodInput').value = hunt.method || '';
  $('encounterInput').value = hunt.encounter || '';
  $('seenInput').value = hunt.seen || '';
  $('phaseInput').value = hunt.phases || '';
  $('locationInput').value = hunt.location || '';
  $('statusInput').value = hunt.status || 'planned';
  $('notesInput').value = hunt.notes || '';
  $('applyEvolutionInput').checked = Boolean(hunt.applyToEvolutions);
  $('markShinyInput').checked = hunt.status === 'done';
  ['gameInput', 'methodInput', 'statusInput'].forEach(id => refreshSelectTheme($(id)));
}

function findHuntIndex(entry, index, key = '') {
  let targetIndex = Number.isInteger(index) ? index : -1;
  if (key) {
    const decoded = String(key);
    const found = entry.hunts.findIndex((h, i) => huntKey(h, i) === decoded);
    if (found >= 0) targetIndex = found;
  }
  return targetIndex;
}

function openDialog(id, shinyMode = false, options = {}) {
  selectedPokemon = pokemon.find(p => p.id === id);
  const entry = getEntry(id);
  $('huntForm').reset();
  editingHunt = null;

  $('dialogTitle').textContent = displayName(selectedPokemon.name);
  $('dialogNumber').textContent = dexNo(id);
  $('dialogSprite').src = entry.shiny ? spriteSrc(selectedPokemon, true) : spriteSrc(selectedPokemon, false);
  $('dialogSprite').onerror = () => { $('dialogSprite').onerror = null; $('dialogSprite').src = fallbackSprite(selectedPokemon, entry.shiny); };

  if (options && Number.isInteger(options.huntIndex)) {
    const targetIndex = findHuntIndex(entry, options.huntIndex, options.huntKey || '');
    if (entry.hunts[targetIndex]) {
      editingHunt = { id, index: targetIndex, key: options.huntKey || '', createdAt: entry.hunts[targetIndex].createdAt || '' };
      fillFormFromHunt(entry.hunts[targetIndex]);
      setDialogMode('hunt', true);
    } else {
      setDialogMode('hunt', false);
    }
  } else if (shinyMode) {
    $('statusInput').value = 'done';
    $('markShinyInput').checked = true;
    setDialogMode('shiny');
  } else {
    $('statusInput').value = 'planned';
    $('markShinyInput').checked = false;
    setDialogMode('hunt');
  }

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

  const existingCreatedAt = editingHunt?.createdAt || '';
  const hunt = {
    game: $('gameInput').value,
    method: $('methodInput').value,
    encounter: $('encounterInput').value,
    seen: $('seenInput').value,
    phases: $('phaseInput').value,
    location: $('locationInput').value.trim(),
    status: $('statusInput').value,
    notes: $('notesInput').value.trim(),
    applyToEvolutions: $('applyEvolutionInput').checked,
    createdAt: existingCreatedAt || new Date().toISOString(),
  };

  const isShinyObtained = dialogMode === 'shiny' || $('markShinyInput').checked || hunt.status === 'done';
  const shinyRecord = {
    game: hunt.game,
    method: hunt.method,
    encounter: hunt.encounter,
    seen: hunt.seen,
    phases: hunt.phases,
    location: hunt.location,
    notes: hunt.notes,
    createdAt: new Date().toISOString(),
    sourceHuntCreatedAt: hunt.createdAt,
  };

  const shouldApplyToEvolutions = $('applyEvolutionInput').checked || Boolean(hunt.applyToEvolutions);
  const shinyIds = shouldApplyToEvolutions ? await getEvolutionFamilyIds(selectedPokemon.id) : [selectedPokemon.id];

  if (isShinyObtained) {
    // Un shiny obtenu ne crée pas de nouvelle shasse.
    // Si on modifiait une shasse existante, elle est retirée car elle est terminée.
    shinyIds.forEach(id => addShinyRecord(id, shinyRecord));
    if (editingHunt) removeMatchingHunt(editingHunt.id, editingHunt.index, editingHunt.key, editingHunt.createdAt);
  } else if (editingHunt) {
    const entry = getEntry(editingHunt.id);
    const targetIndex = findHuntIndex(entry, editingHunt.index, editingHunt.key || '');
    if (entry.hunts[targetIndex]) {
      const hunts = entry.hunts.map((oldHunt, i) => i === targetIndex ? hunt : oldHunt);
      setEntry(editingHunt.id, { hunts });
    }
  } else {
    // Une shasse reste unique : la case évolutions ne duplique plus la shasse dans toute la famille.
    const entry = getEntry(selectedPokemon.id);
    setEntry(selectedPokemon.id, { hunts: [...entry.hunts, hunt] });
  }

  const keepId = selectedPokemon.id;
  e.target.reset();
  editingHunt = null;
  setDialogMode('hunt');
  renderCollectionList(keepId);
  renderHuntList(keepId);
  render();
}

function addShinyRecord(id, shinyRecord) {
  const entry = getEntry(id);
  setEntry(id, {
    shiny: true,
    shinies: [...entry.shinies, shinyRecord],
  });
}

function removeMatchingHunt(id, index, key = '', createdAt = '') {
  const entry = getEntry(id);
  const targetIndex = findHuntIndex(entry, index, key || '');
  if (entry.hunts[targetIndex]) {
    const target = entry.hunts[targetIndex];
    const created = createdAt || target.createdAt || '';
    if (created) {
      Object.keys(state).forEach(entryId => {
        const current = getEntry(entryId);
        const hunts = current.hunts.filter(h => h.createdAt !== created);
        if (hunts.length !== current.hunts.length) setEntry(entryId, { hunts });
      });
      return;
    }
    setEntry(id, { hunts: entry.hunts.filter((_, i) => i !== targetIndex) });
  }
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
  if (hunt.createdAt) {
    Object.keys(state).forEach(entryId => {
      const current = getEntry(entryId);
      const hunts = current.hunts.filter(h => h.createdAt !== hunt.createdAt);
      if (hunts.length !== current.hunts.length) setEntry(entryId, { hunts });
    });
  } else {
    const hunts = entry.hunts.filter((_, i) => i !== targetIndex);
    setEntry(id, { hunts });
  }
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
    version: 18,
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
