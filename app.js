'use strict';

// ── Scroll lock (dialogs / bottom sheets) ──────────────────────────────────────
let _scrollLockCount = 0;
function lockBodyScroll() {
  _scrollLockCount++;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}
function unlockBodyScroll() {
  _scrollLockCount = Math.max(0, _scrollLockCount - 1);
  if (_scrollLockCount === 0) {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }
}

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  results: [],         // array of completed questionnaire result objects
  activeId: null,      // id of questionnaire being filled
  answers: [],         // current answers (index = item index)
  patient: '',
};

let _sessionGen      = 0;     // incremented on clear; stale writeSession .then() calls detect mismatch
let _sessionCleared  = false; // true after a clear; blocks new writes until real data appears
let _patientDebounce = null;

function _todayStr() {
  return new Date().toLocaleDateString('es-ES');
}

// ── Session persistence ─────────────────────────────────────────────────────────
async function _loadFromSession() {
  try {
    const session = await readSession();
    if (!session) return;
    if (session.patient) state.patient = session.patient;
    if (Array.isArray(session.questionnaires)) state.results = session.questionnaires;
  } catch { /* IDB unavailable */ }
}

function _persistPatient() {
  const patient = state.patient;
  if (patient) _bc.postMessage({ type: 'SESSION_PATIENT', patient });
  if (!patient) return;
  _sessionCleared = false;
  const gen = _sessionGen;
  writeSession({ patient, date: _todayStr() }).then(() => {
    if (_sessionGen !== gen) clearSession();
  });
}

function _persistResults() {
  const hasResults = state.results.length > 0;
  if (!state.patient && !hasResults) return;
  _sessionCleared = false;
  const gen = _sessionGen;
  const patch = { questionnaires: hasResults ? state.results : null };
  if (state.patient) { patch.patient = state.patient; patch.date = _todayStr(); }
  writeSession(patch).then(() => {
    if (_sessionGen !== gen) clearSession();
  });
}

// ── BroadcastChannel ──────────────────────────────────────────────────────────
const _bc = new BroadcastChannel('physiq-session');

_bc.onmessage = e => {
  if (e.data?._relay) return;
  const { type } = e.data;
  if (type === 'SESSION_PATIENT') {
    const input = document.getElementById('patientInput');
    if (document.activeElement === input) return;
    state.patient = e.data.patient ?? '';
    if (input) input.value = state.patient;
    _updateSessionChip();
  }
  if (type === 'SESSION_CLEAR') {
    _sessionGen++;
    _sessionCleared = true;
    clearTimeout(_patientDebounce);
    state.results = [];
    state.patient = '';
    const input = document.getElementById('patientInput');
    if (input) input.value = '';
    _updateSessionChip();
    _updateResetBtn();
    goHome();
  }
  if (type === 'SESSION_SYNC') {
    if (e.data.patient)                       state.patient = e.data.patient;
    if (Array.isArray(e.data.questionnaires)) state.results = e.data.questionnaires;
    _updateSessionChip();
    _updateResetBtn();
    renderHome();
  }
};

function _broadcastResults() {
  _bc.postMessage({ type: 'SESSION_QUESTIONNAIRE', questionnaires: state.results.length ? state.results : null });
}

// ── Routing ───────────────────────────────────────────────────────────────────
function goHome() {
  state.activeId = null;
  state.answers  = [];
  document.getElementById('view-home').hidden         = false;
  document.getElementById('view-questionnaire').hidden = true;
  document.getElementById('view-result').hidden        = true;
  renderHome();
}

function openQuestionnaire(id) {
  const q = QUESTIONNAIRES.find(q => q.id === id);
  if (!q) return;
  const existing = state.results.find(r => r.id === id);
  state.activeId = id;
  state.answers  = existing ? [...existing.answers] : new Array(q.items.length).fill(undefined);

  // Pre-fill EVA slider at 5 when starting fresh
  if (q.type === 'slider' && state.answers[0] === undefined) state.answers[0] = 5;

  document.getElementById('view-home').hidden          = true;
  document.getElementById('view-questionnaire').hidden = false;
  document.getElementById('view-result').hidden        = true;
  renderQuestionnaire(q);
}

// ── Session UI ────────────────────────────────────────────────────────────────
function _updateSessionChip() {
  const btn = document.getElementById('sessionBtn');
  if (btn) btn.classList.toggle('active', !!state.patient);
  _updateSessionPanelTitle();
}

function _updateSessionPanelTitle() {
  const panelTitle = document.getElementById('sessionPanelTitle');
  const panel      = document.getElementById('sessionPanel');
  if (!panelTitle) return;
  if (state.patient) {
    panelTitle.textContent = `${state.patient} · ${_todayStr()}`;
    panel?.classList.add('has-session');
  } else {
    panelTitle.textContent = 'Sin sesión activa';
    panel?.classList.remove('has-session');
  }
}

function _updateResetBtn() {
  const btn = document.getElementById('headerResetBtn');
  if (!btn) return;
  btn.style.display = state.results.length > 0 ? '' : 'none';
}

function toggleSessionPanel() {
  const overlay = document.getElementById('sessionPanelOverlay');
  if (!overlay) return;
  if (overlay.classList.contains('open')) { closeSessionPanel(); return; }
  _showSessionState('edit');
  overlay.classList.add('open');
  lockBodyScroll();
  window.parent.postMessage({ type: 'PHYSIQ_WIDGET_HIDE' }, '*');
}
window.toggleSessionPanel = toggleSessionPanel;

function closeSessionPanel() {
  const panel   = document.getElementById('sessionPanel');
  const overlay = document.getElementById('sessionPanelOverlay');
  const wasOpen = overlay?.classList.contains('open');
  overlay?.classList.remove('open');
  if (wasOpen) { unlockBodyScroll(); window.parent.postMessage({ type: 'PHYSIQ_WIDGET_SHOW' }, '*'); }
  if (panel) { panel.style.transition = ''; panel.style.transform = ''; }
}
window.closeSessionPanel = closeSessionPanel;

function _showSessionState(st) {
  const panel = document.getElementById('sessionPanel');
  if (!panel) return;
  const hasSession = !!state.patient;
  const label = hasSession ? `${state.patient} · ${_todayStr()}` : '';
  panel.classList.toggle('has-session', hasSession);

  if (st === 'edit') {
    panel.innerHTML = `
      <div class="session-panel-handle"></div>
      <div class="session-panel-title" id="sessionPanelTitle">${label || 'Sin sesión activa'}</div>
      <div class="field">
        <label class="field-label">Paciente</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <input class="field-input" type="text" id="patientInput" style="flex:1;"
                 placeholder="Nombre (opcional)" autocomplete="off">
          <button class="session-panel-clear" id="sessionPanelClear" title="Borrar sesión">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h9M5 4V2h3v2M3.5 4l.5 7h5l.5-7"/></svg>
          </button>
        </div>
      </div>`;
    const input = panel.querySelector('#patientInput');
    input.value = state.patient;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') closeSessionPanel(); });
    input.addEventListener('input', () => {
      state.patient = input.value.trim();
      _sessionCleared = false;
      _updateSessionChip();
      clearTimeout(_patientDebounce);
      _patientDebounce = setTimeout(_persistPatient, 800);
    });
    panel.querySelector('#sessionPanelClear').onclick = () => _showSessionState('delete');
    setTimeout(() => input.focus(), 60);

  } else if (st === 'delete') {
    panel.innerHTML = `
      <div class="session-panel-handle"></div>
      <div class="session-panel-title">${label || 'Sin sesión activa'}</div>
      <div class="confirm-box-text" style="margin:12px 0 0;">¿Borrar y empezar de nuevo?</div>
      <div class="confirm-box-btns" style="margin-top:1rem;">
        <button class="confirm-btn-cancel" id="confirmCancel">Cancelar</button>
        <button class="confirm-btn-ok" id="confirmAction">Borrar sesión</button>
      </div>`;
    panel.querySelector('#confirmCancel').onclick = () => _showSessionState('edit');
    panel.querySelector('#confirmAction').onclick = () => {
      closeSessionPanel();
      _fullClearSession();
    };
  }
}

function _fullClearSession() {
  clearTimeout(_patientDebounce);
  _sessionGen++;
  _sessionCleared = true;
  state.patient = '';
  state.results = [];
  goHome();
  _updateResetBtn();
  _updateSessionChip();
  clearSession().then(() => {
    _bc.postMessage({ type: 'SESSION_QUESTIONNAIRE', questionnaires: null });
    _bc.postMessage({ type: 'SESSION_CLEAR' });
  });
}

function promptClearSession() {
  _showSessionState('delete');
  const overlay = document.getElementById('sessionPanelOverlay');
  if (overlay && !overlay.classList.contains('open')) {
    overlay.classList.add('open');
    lockBodyScroll();
    window.parent.postMessage({ type: 'PHYSIQ_WIDGET_HIDE' }, '*');
  }
}
window.promptClearSession = promptClearSession;

function _setupSessionPanelDrag() {
  const panel = document.getElementById('sessionPanel');
  if (!panel) return;
  const EASE = 'transform 0.3s cubic-bezier(0.32,0.72,0,1)';
  let startY = 0, startTime = 0, dragging = false, delta = 0, snapTimer = null;
  let vvHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const newHeight = window.visualViewport.height;
      if (dragging) startY += newHeight - vvHeight;
      vvHeight = newHeight;
    });
  }

  panel.addEventListener('touchstart', e => {
    if (window.innerWidth > 768) return;
    if (e.touches[0].clientY - panel.getBoundingClientRect().top > 72) return;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    startY = e.touches[0].clientY;
    startTime = Date.now();
    delta = 0;
    dragging = true;
    clearTimeout(snapTimer);
    panel.style.transition = 'none';
  }, { passive: true });

  panel.addEventListener('touchmove', e => {
    if (!dragging) return;
    delta = Math.max(0, e.touches[0].clientY - startY);
    panel.style.transform = delta > 0 ? `translateY(${delta}px)` : 'translateY(0)';
  }, { passive: true });

  function onRelease() {
    if (!dragging) return;
    dragging = false;
    const velocity = delta / (Date.now() - startTime);
    if (delta > 80 || velocity > 0.3) {
      panel.style.transition = EASE;
      panel.style.transform = 'translateY(110%)';
      setTimeout(() => {
        panel.style.transition = 'none';
        closeSessionPanel();
        panel.style.transform = '';
        panel.style.transition = '';
      }, 300);
    } else {
      panel.style.transition = EASE;
      panel.style.transform = 'translateY(0)';
      snapTimer = setTimeout(() => {
        panel.style.transform = '';
        panel.style.transition = '';
      }, 310);
    }
  }

  panel.addEventListener('touchend', onRelease, { passive: true });
  panel.addEventListener('touchcancel', () => {
    if (!dragging) return;
    dragging = false;
    panel.style.transform = '';
    panel.style.transition = '';
  }, { passive: true });
}

// ── Soft reset (this satellite's results only) ─────────────────────────────────
function promptSoftResetQuestionnaires() {
  showConfirmBanner(
    '↺ Borrar resultados',
    'Se eliminarán los resultados de los cuestionarios. Los datos de otros satélites se conservarán.',
    'Borrar',
    () => {
      state.results = [];
      renderHome();
      _updateResetBtn();
      _broadcastResults();
      updateSession({ questionnaires: null });
    }
  );
}
window.promptSoftResetQuestionnaires = promptSoftResetQuestionnaires;

// ── Delete a single result ──────────────────────────────────────────────────────
function confirmDeleteResult(id) {
  const q = QUESTIONNAIRES.find(q => q.id === id);
  showConfirmBanner(
    'Borrar resultado',
    `Se eliminará el resultado de ${q?.abbr || id}.`,
    'Borrar',
    () => {
      state.results = state.results.filter(r => r.id !== id);
      renderHome();
      _updateResetBtn();
      _broadcastResults();
      updateSession({ questionnaires: state.results.length ? state.results : null });
    }
  );
}
window.confirmDeleteResult = confirmDeleteResult;

// ── Renders ───────────────────────────────────────────────────────────────────
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
      ${result ? `
        <div class="q-card-bottom">
          <span class="q-card-score" style="color:${result.color}">${result.formattedScore}</span>
          <span role="button" class="btn-clear" title="Borrar resultado" aria-label="Borrar resultado">✕</span>
        </div>
        <span class="q-card-interp" style="color:${result.color}">${result.interpretation}</span>
      ` : ''}
    `;
    if (result) {
      card.querySelector('.btn-clear').onclick = e => {
        e.stopPropagation();
        confirmDeleteResult(q.id);
      };
    }
    grid.appendChild(card);
  });

  renderGlobalSummary();
}

function renderGlobalSummary() {
  const card  = document.getElementById('globalSummaryCard');
  const chips = document.getElementById('globalSummaryChips');
  if (!card) return;
  if (!state.results.length) { card.style.display = 'none'; return; }
  chips.innerHTML = state.results.map(r => `
    <span class="result-chip" onclick="openQuestionnaire('${r.id}')">${r.abbr} <span class="chip-score" style="color:${r.color}">${r.formattedScore}</span></span>
  `).join('');
  card.style.display = 'block';
}

function copyResultsToClipboard() {
  if (!state.results.length) return;
  const patient = state.patient ? `\nPaciente: ${state.patient}` : '';
  const lines = state.results.map(r => `  ${r.abbr} — ${r.name}: ${r.formattedScore}  (${r.interpretation})`);
  const text = `RESULTADOS PhysiQ-Questionnaires${patient}\nFecha: ${_todayStr()}\n\n${lines.join('\n')}`;
  navigator.clipboard.writeText(text).then(() => showCopyFeedback());
}
window.copyResultsToClipboard = copyResultsToClipboard;

function showCopyFeedback() {
  const existing = document.getElementById('copyFeedback');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'copyFeedback';
  toast.className = 'copy-feedback';
  toast.textContent = '✓ Resultados copiados al portapapeles';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function renderQuestionnaire(q) {
  const container = document.getElementById('view-questionnaire');
  container.innerHTML = `
    <div class="qv-header">
      <button class="btn-back" onclick="goHome()">← Volver</button>
      <span class="qv-name-badge">${q.name}</span>
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
  _persistResults();
  _updateResetBtn();
  showResult(result, q);
}

function showResult(result, q) {
  document.getElementById('view-home').hidden          = true;
  document.getElementById('view-questionnaire').hidden = true;
  document.getElementById('view-result').hidden        = false;

  const el = document.getElementById('view-result');
  el.innerHTML = `
    <div class="res-header">
      <button class="btn-back" onclick="goHome()">← Volver</button>
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

// ── Confirm banner ────────────────────────────────────────────────────────────
function showConfirmBanner(title, text, actionLabel, onConfirm) {
  const existing = document.getElementById('confirmBanner');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.className = 'confirm-banner';
  overlay.id = 'confirmBanner';
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-box-title">${title}</div>
      <div class="confirm-box-text">${text}</div>
      <div class="confirm-box-btns">
        <button class="confirm-btn-cancel" id="confirmCancel"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancelar</button>
        <button class="confirm-btn-ok" id="confirmAction"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> ${actionLabel}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  lockBodyScroll();
  window.parent.postMessage({ type: 'PHYSIQ_WIDGET_HIDE' }, '*');
  const dismiss = () => { overlay.remove(); unlockBodyScroll(); window.parent.postMessage({ type: 'PHYSIQ_WIDGET_SHOW' }, '*'); };
  document.getElementById('confirmCancel').onclick = dismiss;
  document.getElementById('confirmAction').onclick = () => { dismiss(); onConfirm(); };
}

// ── Hub messages ──────────────────────────────────────────────────────────────
function _closeAllOverlays() {
  closeSessionPanel();
  const banner = document.getElementById('confirmBanner');
  if (banner) {
    banner.remove();
    unlockBodyScroll();
    window.parent.postMessage({ type: 'PHYSIQ_WIDGET_SHOW' }, '*');
  }
}

window.addEventListener('message', e => {
  if (e.data?.type === 'PHYSIQ_SAT_HIDDEN') _closeAllOverlays();
});

// ── Boot ──────────────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', { scope: '/physiq/questionnaire/' });
}

(async () => {
  await _loadFromSession();
  _updateSessionChip();
  _updateResetBtn();
  renderHome();
  _setupSessionPanelDrag();
})();
