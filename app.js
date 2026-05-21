// ===== INITIAL DATA =====
const SEED_ARTICLES = [
  { id: '0121-00000001', name: 'Temperatursensor DS18B20',          kategorie: 'Sensor', bestand: 120, mindestbestand: 70,  preis: 20.99 },
  { id: '0121-00000002', name: 'Ultraschall-Abstandssensor',        kategorie: 'Sensor', bestand: 80,  mindestbestand: 30,  preis: 35.99 },
  { id: '0121-00000003', name: 'Bewegungssensor',                   kategorie: 'Sensor', bestand: 150, mindestbestand: 100, preis: 15.99 },
  { id: '0121-00000004', name: 'Lichtsensor BH1750',                kategorie: 'Sensor', bestand: 95,  mindestbestand: 40,  preis: 19.99 },
  { id: '0121-00000005', name: 'Feuchtigkeitssensor DHT 22',        kategorie: 'Sensor', bestand: 50,  mindestbestand: 15,  preis: 25.99 },
  { id: '0121-00000006', name: 'Gas- und Rauchsensor MQ-2',         kategorie: 'Sensor', bestand: 70,  mindestbestand: 35,  preis: 34.99 },
  { id: '0121-00000007', name: 'Gyroskop & Beschleunigungssensor',  kategorie: 'Sensor', bestand: 65,  mindestbestand: 20,  preis: 42.99 },
  { id: '0121-00000008', name: 'Hall-Sensor A3144',                 kategorie: 'Sensor', bestand: 200, mindestbestand: 180, preis: 12.99 },
  { id: '0121-00000009', name: 'Vibrationssensor SW-420',           kategorie: 'Sensor', bestand: 110, mindestbestand: 75,  preis: 45.99 },
  { id: '0121-00000010', name: 'Drucksensor BMP280',                kategorie: 'Sensor', bestand: 40,  mindestbestand: 10,  preis: 17.99 },
];

const SEED_LOG = [
  { user: 'Admin', action: 'Hat 10x von Artikel Hall-Sensor A3144 eingebucht',      datum: '12.04.2026', uhrzeit: '09:00 Uhr' },
  { user: 'Admin', action: 'Hat 5x Artikel Bewegungssensor abgebucht',              datum: '15.04.2026', uhrzeit: '12:00 Uhr' },
  { user: 'Admin', action: 'Hat 7x Artikel Temperatursensor DS18B20 eingebucht',    datum: '17.04.2026', uhrzeit: '15:00 Uhr' },
];

// ===== STATE =====
let articles = JSON.parse(localStorage.getItem('lager_articles')) || SEED_ARTICLES.map(a => ({...a}));
let logbook  = JSON.parse(localStorage.getItem('lager_log'))      || SEED_LOG.map(e => ({...e}));
let statsCustom = JSON.parse(localStorage.getItem('lager_stats')) || {
  wertMonat: '19.500,00 €', wertJahr: '90.750,00 €',
  bestandMonat: '900 Stück', bestandJahr: '10.000 Stück'
};

let currentView  = 'alle';
let deleteTarget = null;

// ===== ARTICLE ICONS =====
const ICONS = [
  { key: 'Temperatur',  icon: '🌡️', bg: '#FEF3C7' },
  { key: 'Ultraschall', icon: '📡', bg: '#E0F2FE' },
  { key: 'Bewegung',    icon: '🕵️', bg: '#F0FDF4' },
  { key: 'Licht',       icon: '💡', bg: '#FFFBEB' },
  { key: 'Feuchtigkeit',icon: '💧', bg: '#EFF6FF' },
  { key: 'Gas',         icon: '💨', bg: '#F5F3FF' },
  { key: 'Gyroskop',    icon: '🔄', bg: '#FDF4FF' },
  { key: 'Hall',        icon: '🧲', bg: '#F0FDF4' },
  { key: 'Vibration',   icon: '📳', bg: '#FFF7ED' },
  { key: 'Druck',       icon: '🔵', bg: '#EFF6FF' },
];

function getIcon(name) {
  for (const i of ICONS) if (name.includes(i.key)) return i;
  return { icon: '🔌', bg: '#F3F4F6' };
}

// ===== HELPERS =====
function save() {
  localStorage.setItem('lager_articles', JSON.stringify(articles));
  localStorage.setItem('lager_log',      JSON.stringify(logbook));
  localStorage.setItem('lager_stats',    JSON.stringify(statsCustom));
}

function fmtEur(v) {
  return v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
function fmtNum(v) {
  return v.toLocaleString('de-DE');
}
function nowDatum() {
  return new Date().toLocaleDateString('de-DE');
}
function nowUhr() {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

function stockStatus(a) {
  if (a.bestand <= a.mindestbestand)       return 'danger';
  if (a.bestand <= a.mindestbestand * 1.4) return 'warn';
  return 'ok';
}

function isLow(a) { return a.bestand <= a.mindestbestand * 1.4; }

function gesamtwert()    { return articles.reduce((s, a) => s + a.bestand * a.preis, 0); }
function gesamtbestand() { return articles.reduce((s, a) => s + a.bestand, 0); }

// Deterministic barcode from ID string
function barcode(id) {
  let h = 5381;
  for (const c of id) h = ((h << 5) + h) ^ c.charCodeAt(0);
  h = Math.abs(h);
  let bars = '';
  for (let i = 0; i < 22; i++) {
    const bit = (h >> (i % 28)) & 1;
    const w   = bit ? 3 : 1.5;
    const ht  = 12 + ((h >> ((i * 3) % 28)) & 7);
    bars += `<span style="width:${w}px;height:${ht}px"></span>`;
  }
  return bars;
}

function nextId() {
  if (!articles.length) return '0121-00000011';
  const nums = articles.map(a => parseInt(a.id.split('-')[1] || '0', 10)).filter(n => !isNaN(n));
  const max = Math.max(...nums, 10);
  return '0121-' + String(max + 1).padStart(8, '0');
}

// ===== RENDER =====
function render() {
  renderTable();
  renderLog();
  renderWarnings();
  renderStats();
  renderNavLinks();
  renderNotifBadge();
}

function filteredArticles() {
  const search  = (document.getElementById('tableSearch')?.value  || '').toLowerCase();
  const global  = (document.getElementById('globalSearch')?.value || '').toLowerCase();
  const kat     = document.getElementById('filterKat')?.value     || '';
  const bestF   = document.getElementById('filterBestand')?.value || '';
  const q = search || global;

  return articles.filter(a => {
    if (q && !a.name.toLowerCase().includes(q) && !a.id.includes(q) && !a.kategorie.toLowerCase().includes(q)) return false;
    if (kat && a.kategorie !== kat) return false;
    if (bestF === 'low' && !isLow(a)) return false;
    if (bestF === 'ok'  && isLow(a))  return false;
    if (currentView === 'mindestbestand' && !isLow(a)) return false;
    if (currentView === 'sensoren' && a.kategorie !== 'Sensor') return false;
    return true;
  });
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  const rows = filteredArticles();

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
      <div class="empty-state-icon">📦</div><p>Keine Artikel gefunden</p>
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(a => {
    const ic = getIcon(a.name);
    const st = stockStatus(a);
    const pct = Math.min(100, Math.round((a.bestand / Math.max(a.mindestbestand * 2, 1)) * 100));

    return `<tr>
      <td>
        <div class="art-cell">
          <div class="art-icon" style="background:${ic.bg}">${ic.icon}</div>
          <span class="art-name">${a.name}</span>
        </div>
      </td>
      <td><span class="kat-badge">${a.kategorie}</span></td>
      <td>
        <div class="bestand-cell">
          <span class="bestand-num ${st}">${fmtNum(a.bestand)}</span>
          <div class="stock-bar"><div class="stock-bar-fill ${st}" style="width:${pct}%"></div></div>
        </div>
      </td>
      <td>${fmtNum(a.mindestbestand)}</td>
      <td>
        <div class="barcode-cell">
          <div class="barcode-visual">${barcode(a.id)}</div>
          <span class="barcode-id">${a.id}</span>
        </div>
      </td>
      <td><span class="price">${fmtEur(a.preis)}</span></td>
      <td>
        <div class="actions">
          <button class="act-btn in"  title="Wareneingang" onclick="openBuchung('${a.id}','eingang')">↑</button>
          <button class="act-btn out" title="Warenausgang" onclick="openBuchung('${a.id}','ausgang')">↓</button>
          <button class="act-btn"     title="Bearbeiten"   onclick="openEditModal('${a.id}')">✏️</button>
          <button class="act-btn del" title="Löschen"      onclick="openDeleteModal('${a.id}')">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderLog() {
  const tbody = document.getElementById('logBody');
  if (!tbody) return;
  const recent = [...logbook].reverse().slice(0, 6);
  tbody.innerHTML = recent.map(e => `<tr>
    <td><div class="log-user"><div class="log-avatar">A</div><span>${e.user}</span></div></td>
    <td class="log-action">${e.action}</td>
    <td class="log-time">${e.datum} / ${e.uhrzeit}</td>
  </tr>`).join('');
}

function renderWarnings() {
  const el = document.getElementById('warningItems');
  if (!el) return;
  const low = articles.filter(isLow);
  if (!low.length) {
    el.innerHTML = '<p class="no-warnings">✓ Alle Bestände ausreichend</p>';
    return;
  }
  el.innerHTML = low.map(a => {
    const crit = a.bestand <= a.mindestbestand;
    return `<div class="warning-item">
      <div class="warn-item-left">
        <div class="warn-item-name" title="${a.name}">${a.name}</div>
        <div class="warn-item-bestand">Bestand: ${fmtNum(a.bestand)} Stück</div>
      </div>
      <div class="warn-item-min ${crit ? 'crit' : ''}">${fmtNum(a.mindestbestand)}</div>
    </div>`;
  }).join('');
}

function renderStats() {
  const el = id => document.getElementById(id);
  if (el('statWertAktuell'))    el('statWertAktuell').textContent    = fmtEur(gesamtwert());
  if (el('statBestandAktuell')) el('statBestandAktuell').textContent = fmtNum(gesamtbestand()) + ' Stück';
  if (el('statWertMonat'))    el('statWertMonat').textContent    = statsCustom.wertMonat;
  if (el('statWertJahr'))     el('statWertJahr').textContent     = statsCustom.wertJahr;
  if (el('statBestandMonat')) el('statBestandMonat').textContent = statsCustom.bestandMonat;
  if (el('statBestandJahr'))  el('statBestandJahr').textContent  = statsCustom.bestandJahr;
}

function renderNavLinks() {
  const el = document.getElementById('articleNavLinks');
  if (!el) return;
  el.innerHTML = articles.map(a =>
    `<a href="#" class="nav-article-link" title="${a.name}"
        onclick="filterSingleArticle('${a.id}'); return false;">${a.name}</a>`
  ).join('');

  // Refresh kategorie filter options
  const sel = document.getElementById('filterKat');
  if (!sel) return;
  const cats = [...new Set(articles.map(a => a.kategorie))];
  const cur = sel.value;
  sel.innerHTML = '<option value="">Kategorie: Alle</option>' +
    cats.map(c => `<option value="${c}" ${c === cur ? 'selected' : ''}>Kategorie: ${c}en</option>`).join('');
}

function renderNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const n = articles.filter(isLow).length;
  badge.textContent = n;
  badge.style.display = n > 0 ? 'flex' : 'none';
}

// ===== NAVIGATION =====
function setView(view, el) {
  currentView = view;
  document.querySelectorAll('.nav-link, .nav-sub').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  // Sync filter dropdowns for specific views
  const bestF = document.getElementById('filterBestand');
  if (bestF && view !== 'mindestbestand') bestF.value = '';

  // Reset single-article filter if switching view
  if (view !== 'single') {
    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch) tableSearch.value = '';
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) globalSearch.value = '';
  }
  render();
  return false;
}

function filterSingleArticle(id) {
  currentView = 'single';
  const a = articles.find(x => x.id === id);
  if (!a) return;
  const gs = document.getElementById('globalSearch');
  const ts = document.getElementById('tableSearch');
  if (gs) gs.value = a.name;
  if (ts) ts.value = a.name;
  document.querySelectorAll('.nav-link, .nav-sub').forEach(n => n.classList.remove('active'));
  render();
}

function onGlobalSearch(val) {
  currentView = 'alle';
  const ts = document.getElementById('tableSearch');
  if (ts) ts.value = val;
  renderTable();
}

function onNotifClick() {
  const low = articles.filter(isLow);
  if (!low.length) showToast('Alle Bestände sind ausreichend.', 'success');
  else showToast(`${low.length} Artikel mit niedrigem Bestand!`, 'warning');
}

// ===== MODALS: ARTIKEL =====
function openAddModal() {
  document.getElementById('editId').value        = '';
  document.getElementById('modalHeading').textContent = 'Neuer Artikel';
  document.getElementById('fId').value           = nextId();
  document.getElementById('fId').readOnly        = false;
  document.getElementById('fName').value         = '';
  document.getElementById('fKat').value          = 'Sensor';
  document.getElementById('fBestand').value      = '';
  document.getElementById('fMind').value         = '';
  document.getElementById('fPreis').value        = '';
  document.getElementById('articleBackdrop').classList.add('open');
  document.getElementById('fName').focus();
}

function openEditModal(id) {
  const a = articles.find(x => x.id === id);
  if (!a) return;
  document.getElementById('editId').value             = id;
  document.getElementById('modalHeading').textContent = 'Artikel bearbeiten';
  document.getElementById('fId').value                = a.id;
  document.getElementById('fId').readOnly             = true;
  document.getElementById('fName').value              = a.name;
  document.getElementById('fKat').value               = a.kategorie;
  document.getElementById('fBestand').value           = a.bestand;
  document.getElementById('fMind').value              = a.mindestbestand;
  document.getElementById('fPreis').value             = a.preis;
  document.getElementById('articleBackdrop').classList.add('open');
  document.getElementById('fName').focus();
}

function closeArticleModal() {
  document.getElementById('articleBackdrop').classList.remove('open');
}

function saveArticle() {
  const editId = document.getElementById('editId').value;
  const id     = document.getElementById('fId').value.trim();
  const name   = document.getElementById('fName').value.trim();
  const kat    = document.getElementById('fKat').value.trim();
  const best   = parseInt(document.getElementById('fBestand').value, 10);
  const mind   = parseInt(document.getElementById('fMind').value, 10);
  const preis  = parseFloat(document.getElementById('fPreis').value);

  if (!id || !name || !kat || isNaN(best) || isNaN(mind) || isNaN(preis)) {
    showToast('Bitte alle Felder ausfüllen.', 'error'); return;
  }
  if (best < 0 || mind < 0 || preis < 0) {
    showToast('Werte dürfen nicht negativ sein.', 'error'); return;
  }

  if (editId) {
    const i = articles.findIndex(a => a.id === editId);
    if (i !== -1) {
      articles[i] = { id, name, kategorie: kat, bestand: best, mindestbestand: mind, preis };
      addLog(`Hat Artikel "${name}" bearbeitet`);
      showToast('Artikel aktualisiert.', 'success');
    }
  } else {
    if (articles.some(a => a.id === id)) {
      showToast('Artikelnummer bereits vergeben.', 'error'); return;
    }
    articles.push({ id, name, kategorie: kat, bestand: best, mindestbestand: mind, preis });
    addLog(`Hat Artikel "${name}" angelegt`);
    showToast('Artikel angelegt.', 'success');
  }
  save(); closeArticleModal(); render();
}

// ===== MODALS: BUCHUNG =====
function openBuchung(id, type) {
  const a = articles.find(x => x.id === id);
  if (!a) return;
  document.getElementById('bId').value       = id;
  document.getElementById('bType').value     = type;
  document.getElementById('buchungHeading').textContent = type === 'eingang' ? '↑ Wareneingang' : '↓ Warenausgang';
  document.getElementById('bName').textContent = a.name;
  document.getElementById('bMenge').value    = '';
  document.getElementById('buchungBackdrop').classList.add('open');
  document.getElementById('bMenge').focus();
}

function closeBuchungModal() {
  document.getElementById('buchungBackdrop').classList.remove('open');
}

function doBuchung() {
  const id    = document.getElementById('bId').value;
  const type  = document.getElementById('bType').value;
  const menge = parseInt(document.getElementById('bMenge').value, 10);
  if (isNaN(menge) || menge <= 0) { showToast('Bitte eine gültige Menge eingeben.', 'error'); return; }

  const a = articles.find(x => x.id === id);
  if (!a) return;

  if (type === 'eingang') {
    a.bestand += menge;
    addLog(`Hat ${menge}x von Artikel "${a.name}" eingebucht`);
    showToast(`${menge}x eingebucht. Neuer Bestand: ${fmtNum(a.bestand)}`, 'success');
  } else {
    if (a.bestand < menge) { showToast('Nicht genügend Bestand vorhanden.', 'error'); return; }
    a.bestand -= menge;
    addLog(`Hat ${menge}x Artikel "${a.name}" abgebucht`);
    showToast(`${menge}x abgebucht. Neuer Bestand: ${fmtNum(a.bestand)}`, 'success');
  }
  save(); closeBuchungModal(); render();
}

// ===== MODALS: LÖSCHEN =====
function openDeleteModal(id) {
  const a = articles.find(x => x.id === id);
  if (!a) return;
  deleteTarget = id;
  document.getElementById('deleteNameDisplay').textContent = a.name;
  document.getElementById('deleteBackdrop').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('deleteBackdrop').classList.remove('open');
  deleteTarget = null;
}

function doDelete() {
  if (!deleteTarget) return;
  const a = articles.find(x => x.id === deleteTarget);
  if (a) {
    addLog(`Hat Artikel "${a.name}" gelöscht`);
    articles = articles.filter(x => x.id !== deleteTarget);
    save();
    showToast(`Artikel "${a.name}" gelöscht.`, 'success');
  }
  closeDeleteModal(); render();
}

// ===== MODALS: STATISTIK BEARBEITEN =====
function openEditStatsModal(type) {
  document.getElementById('statsType').value = type;
  if (type === 'wert') {
    document.getElementById('statsModalHeading').textContent = 'Gesamtwert bearbeiten';
    document.getElementById('statsLabel1').textContent = 'Letzter Monat (€)';
    document.getElementById('statsLabel2').textContent = 'Letztes Jahr (€)';
    document.getElementById('statsVal1').value = statsCustom.wertMonat;
    document.getElementById('statsVal2').value = statsCustom.wertJahr;
  } else {
    document.getElementById('statsModalHeading').textContent = 'Gesamtbestand bearbeiten';
    document.getElementById('statsLabel1').textContent = 'Letzter Monat';
    document.getElementById('statsLabel2').textContent = 'Letztes Jahr';
    document.getElementById('statsVal1').value = statsCustom.bestandMonat;
    document.getElementById('statsVal2').value = statsCustom.bestandJahr;
  }
  document.getElementById('statsBackdrop').classList.add('open');
}

function closeStatsModal() {
  document.getElementById('statsBackdrop').classList.remove('open');
}

function saveStats() {
  const type = document.getElementById('statsType').value;
  const v1   = document.getElementById('statsVal1').value.trim();
  const v2   = document.getElementById('statsVal2').value.trim();
  if (!v1 || !v2) { showToast('Bitte alle Felder ausfüllen.', 'error'); return; }
  if (type === 'wert') {
    statsCustom.wertMonat = v1; statsCustom.wertJahr = v2;
  } else {
    statsCustom.bestandMonat = v1; statsCustom.bestandJahr = v2;
  }
  save(); closeStatsModal(); renderStats();
  showToast('Gespeichert.', 'success');
}

// ===== LOG =====
function addLog(action) {
  logbook.push({ user: 'Admin', action, datum: nowDatum(), uhrzeit: nowUhr() });
  if (logbook.length > 60) logbook = logbook.slice(-60);
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; }, 2700);
  setTimeout(() => t.remove(), 3000);
}

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    deleteTarget = null;
  }
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Set initial nav active state
  const dashLink = document.querySelector('[data-view="alle"].nav-sub');
  if (dashLink) dashLink.classList.add('active');
  render();
});
