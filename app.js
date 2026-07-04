'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  results: [],         // array of completed questionnaire result objects
  activeId: null,      // id of questionnaire being filled
  answers: [],         // current answers (index = item index)
  patient: '',
};

// ── IDB ───────────────────────────────────────────────────────────────────────
function _openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('physiq', 3);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('audio'))   db.createObjectStore('audio');
      if (!db.objectStoreNames.contains('session')) db.createObjectStore('session');
    };
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  });
}

async function _readSession() {
  const db = await _openDB();
  return new Promise((res, rej) => {
    const tx  = db.transaction('session', 'readonly');
    const req = tx.objectStore('session').get('active');
    req.onsuccess = () => { db.close(); res(req.result ?? null); };
    req.onerror   = e  => { db.close(); rej(e.target.error); };
  });
}

async function _loadFromSession() {
  try {
    const session = await _readSession();
    if (!session) return;
    const now = Date.now();
    if (session.updatedAt && now - session.updatedAt > 86400000) return;
    if (session.patient) state.patient = session.patient;
    if (Array.isArray(session.questionnaires)) state.results = session.questionnaires;
  } catch { /* IDB unavailable */ }
}

// ── BroadcastChannel ──────────────────────────────────────────────────────────
const _bc = new BroadcastChannel('physiq-session');

_bc.onmessage = e => {
  if (e.data?._relay) return;
  const { type } = e.data;
  if (type === 'SESSION_PATIENT') {
    state.patient = e.data.patient ?? '';
    _updatePatient();
  }
  if (type === 'SESSION_CLEAR') {
    state.results = [];
    state.patient = '';
    _updatePatient();
    renderHome();
  }
  if (type === 'SESSION_SYNC') {
    if (e.data.patient)                             state.patient = e.data.patient;
    if (Array.isArray(e.data.questionnaires))       state.results = e.data.questionnaires;
    _updatePatient();
    renderHome();
  }
};

function _broadcastResults() {
  _bc.postMessage({ type: 'SESSION_QUESTIONNAIRE', questionnaires: state.results });
}

// ── Routing ───────────────────────────────────────────────────────────────────
function goHome() {
  state.activeId = null;
  state.answers  = [];
  document.getElementById('view-home').hidden         = false;
  document.getElementById('view-questionnaire').hidden = true;
  document.getElementById('view-result').hidden        = true;
}

function goHubHome() {
  window.parent.postMessage({ type: 'PHYSIQ_GO_HOME' }, '*');
}

function openQuestionnaire(id) {
  const q = QUESTIONNAIRES.find(q => q.id === id);
  if (!q) return;
  state.activeId = id;
  state.answers  = new Array(q.items.length).fill(undefined);

  // Pre-fill EVA slider at 5
  if (q.type === 'slider') state.answers[0] = 5;

  document.getElementById('view-home').hidden          = true;
  document.getElementById('view-questionnaire').hidden = false;
  document.getElementById('view-result').hidden        = true;
  renderQuestionnaire(q);
}

// ── Renders ───────────────────────────────────────────────────────────────────
function _updatePatient() {
  const el = document.getElementById('patient-name');
  if (el) el.textContent = state.patient || '—';
}

function renderHome() {
  const grid = document.getElementById('q-grid');
  grid.innerHTML = '';

  QUESTIONNAIRES.forEach(q => {
    const result = state.results.find(r => r.id === q.id);
    const card = document.createElement('button');
    card.className = 'q-card' + (result ? ' q-card--done' : '');
    card.onclick = () => openQuestionnaire(q.id);
    card.innerHTML = `
      <div class="q-card-top">
        <span class="q-card-abbr">${q.abbr}</span>
        <span class="q-card-region">${q.region}</span>
      </div>
      <span class="q-card-name">${q.name}</span>
      <span class="q-card-desc">${q.description}</span>
      ${result ? `<span class="q-card-score" style="color:${result.color}">${result.formattedScore}</span>` : ''}
      ${result ? `<span class="q-card-interp" style="color:${result.color}">${result.interpretation}</span>` : ''}
    `;
    grid.appendChild(card);
  });
}

function renderQuestionnaire(q) {
  const container = document.getElementById('view-questionnaire');
  container.innerHTML = `
    <div class="qv-header">
      <button class="qv-back" onclick="goHome()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <div class="qv-title-wrap">
        <span class="qv-abbr">${q.abbr}</span>
        <span class="qv-name">${q.name}</span>
      </div>
      <span class="qv-region">${q.region}</span>
    </div>
    ${q.note ? `<p class="qv-note">${q.note}</p>` : ''}
    <div class="qv-items" id="qv-items"></div>
    <div class="qv-footer">
      <button class="qv-submit" id="qv-submit" onclick="submitQuestionnaire()" disabled>Finalizar y guardar</button>
    </div>
  `;

  const itemsEl = document.getElementById('qv-items');

  if (q.type === 'slider') {
    renderSliderItem(q, itemsEl);
  } else {
    q.items.forEach((item, idx) => renderRadioItem(q, item, idx, itemsEl));
  }
  updateSubmitBtn(q);
}

function renderSliderItem(q, container) {
  const item = q.items[0];
  const val  = state.answers[0] ?? 5;
  const div  = document.createElement('div');
  div.className = 'qi qi--slider';
  div.innerHTML = `
    <p class="qi-label">${item.label}</p>
    <p class="qi-sublabel">${item.sublabel}</p>
    <div class="qi-slider-wrap">
      <span class="qi-slider-min">0</span>
      <input type="range" class="qi-slider" id="eva-slider"
             min="${item.min}" max="${item.max}" step="1" value="${val}">
      <span class="qi-slider-max">10</span>
    </div>
    <div class="qi-slider-value" id="eva-value">${val}</div>
    <div class="qi-nrs-track">
      ${Array.from({length: 11}, (_, i) => `
        <button class="qi-nrs-dot ${i === val ? 'active' : ''}" data-v="${i}" onclick="setSliderValue(${i})">${i}</button>
      `).join('')}
    </div>
  `;
  container.appendChild(div);
  div.querySelector('.qi-slider').addEventListener('input', e => {
    setSliderValue(parseInt(e.target.value, 10));
  });
}

function setSliderValue(v) {
  state.answers[0] = v;
  const slider = document.getElementById('eva-slider');
  const valueEl = document.getElementById('eva-value');
  if (slider) slider.value = v;
  if (valueEl) valueEl.textContent = v;
  document.querySelectorAll('.qi-nrs-dot').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.v, 10) === v);
  });
  const q = QUESTIONNAIRES.find(q => q.id === state.activeId);
  if (q) updateSubmitBtn(q);
}

function renderRadioItem(q, item, idx, container) {
  const div = document.createElement('div');
  div.className = 'qi';
  div.id = `qi-${idx}`;
  const opts = item.options.map((opt, i) => `
    <label class="qi-option">
      <input type="radio" name="${q.id}-${item.id}" value="${i}"
             ${state.answers[idx] === i ? 'checked' : ''}
             onchange="selectAnswer(${idx}, ${i})">
      <span class="qi-option-label">
        <span class="qi-option-score">${i}</span>
        <span class="qi-option-text">${opt}</span>
      </span>
    </label>
  `).join('');
  div.innerHTML = `<p class="qi-label">${item.label}</p><div class="qi-options">${opts}</div>`;
  container.appendChild(div);
}

function selectAnswer(idx, val) {
  state.answers[idx] = val;
  const q = QUESTIONNAIRES.find(q => q.id === state.activeId);
  if (q) updateSubmitBtn(q);
}

function updateSubmitBtn(q) {
  const btn = document.getElementById('qv-submit');
  if (!btn) return;
  const answered = state.answers.filter(v => v !== undefined).length;
  btn.disabled = answered < q.items.length;
}

function submitQuestionnaire() {
  const q = QUESTIONNAIRES.find(q => q.id === state.activeId);
  if (!q) return;

  const rawScore = q.score(state.answers);
  const interp   = q.interpret(rawScore);

  const result = {
    id:             q.id,
    name:           q.name,
    abbr:           q.abbr,
    region:         q.region,
    completedAt:    Date.now(),
    answers:        [...state.answers],
    score:          rawScore,
    formattedScore: q.formatScore(rawScore),
    interpretation: interp.label,
    color:          interp.color,
  };

  const existing = state.results.findIndex(r => r.id === q.id);
  if (existing >= 0) state.results[existing] = result;
  else               state.results.push(result);

  _broadcastResults();
  showResult(result, q);
}

function showResult(result, q) {
  document.getElementById('view-home').hidden          = true;
  document.getElementById('view-questionnaire').hidden = true;
  document.getElementById('view-result').hidden        = false;

  const el = document.getElementById('view-result');
  el.innerHTML = `
    <div class="res-header">
      <button class="qv-back" onclick="goHome()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <span class="qv-abbr">${result.abbr}</span>
    </div>
    <div class="res-card">
      <p class="res-label">Resultado</p>
      <p class="res-score" style="color:${result.color}">${result.formattedScore}</p>
      <p class="res-interp" style="color:${result.color}">${result.interpretation}</p>
    </div>
    <div class="res-legend">
      ${_buildLegend(q)}
    </div>
    <button class="qv-submit" onclick="goHome()" style="margin-top:auto">Volver a cuestionarios</button>
  `;
}

function _buildLegend(q) {
  if (q.id === 'eva') return `
    <div class="res-legend-row"><span style="color:#38d9a9">0–3</span><span>Dolor leve</span></div>
    <div class="res-legend-row"><span style="color:#f59e0b">4–6</span><span>Dolor moderado</span></div>
    <div class="res-legend-row"><span style="color:#fb923c">7–8</span><span>Dolor intenso</span></div>
    <div class="res-legend-row"><span style="color:#ef4444">9–10</span><span>Dolor muy intenso</span></div>
  `;
  if (q.id === 'ndi' || q.id === 'odi') {
    const labels = q.id === 'ndi'
      ? [['0–4%','Sin discapacidad'], ['5–14%','Leve'], ['15–24%','Moderada'], ['25–34%','Grave'], ['≥35%','Completa']]
      : [['0–20%','Mínima'], ['21–40%','Moderada'], ['41–60%','Grave'], ['61–80%','Incapacitado'], ['81–100%','Inmovilizado']];
    const colors = ['#38d9a9','#38d9a9','#f59e0b','#fb923c','#ef4444'];
    return labels.map((l, i) => `
      <div class="res-legend-row"><span style="color:${colors[i]}">${l[0]}</span><span>${l[1]}</span></div>
    `).join('');
  }
  if (q.id === 'quickdash') return `
    <div class="res-legend-row"><span style="color:#38d9a9">0–25</span><span>Sin/mínima discapacidad</span></div>
    <div class="res-legend-row"><span style="color:#f59e0b">26–50</span><span>Leve–moderada</span></div>
    <div class="res-legend-row"><span style="color:#fb923c">51–75</span><span>Moderada–grave</span></div>
    <div class="res-legend-row"><span style="color:#ef4444">76–100</span><span>Grave</span></div>
  `;
  if (q.id === 'koos-ps') return `
    <div class="res-legend-row"><span style="color:#38d9a9">75–100</span><span>Función casi normal</span></div>
    <div class="res-legend-row"><span style="color:#f59e0b">50–74</span><span>Moderadamente limitada</span></div>
    <div class="res-legend-row"><span style="color:#fb923c">25–49</span><span>Gravemente limitada</span></div>
    <div class="res-legend-row"><span style="color:#ef4444">0–24</span><span>Muy gravemente limitada</span></div>
  `;
  return '';
}

// ── Hub messages ──────────────────────────────────────────────────────────────
window.addEventListener('message', e => {
  if (e.data?.type === 'PHYSIQ_SAT_HIDDEN') {
    // No open dialogs to close in this satellite
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: '/physiq/questionnaire/' });
}

(async () => {
  await _loadFromSession();
  _updatePatient();
  renderHome();
})();
