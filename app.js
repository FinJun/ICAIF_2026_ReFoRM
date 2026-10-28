'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const MINUS = '−';

  /* ------------------------------------------------------------------
     Interactive example: September 2024 FOMC decision.
     A hand-built teaching example from public Federal Reserve sources,
     not a model-run trace.
     ------------------------------------------------------------------ */
  const SPEECH_2024 = 'https://www.federalreserve.gov/newsevents/speech/powell20240823a.htm';
  const FACTORS = {
    inflation: {
      name: 'Inflation trend',
      pastSign: '+', sign: '+', state: 'preserved',
      pastSignal: 'Moderating, still elevated',
      currentSignal: 'Progress toward 2% resumes',
      past: 'In September 2023, Powell described moderating inflation, but policy remained restrictive and inflation was still above the goal.',
      current: 'By 23 August 2024, Powell reported renewed progress on inflation and greater confidence in a sustainable return to 2%.',
      assessment: 'Preserved. Inflation progress still supports easing.',
      pastUrl: 'https://www.federalreserve.gov/mediacenter/files/FOMCpresconf20230920.pdf#page=2',
      pastLink: 'FOMC press conference, 20 Sep 2023',
      currentUrl: SPEECH_2024,
      currentLink: 'Powell speech, 23 Aug 2024'
    },
    labor: {
      name: 'Labor conditions',
      pastSign: MINUS, sign: '+', state: 'reversed',
      pastSignal: 'Tight, jobs remain strong',
      currentSignal: 'Cooling, July unemployment 4.3%',
      past: 'The 2023 press conference described a tight labor market. August unemployment was 3.8%, and labor demand still exceeded available workers.',
      current: 'Powell reported July unemployment of 4.3% and considerable cooling, and he emphasized protecting the labor market from further cooling.',
      assessment: 'Reversed. The labor signal now supports easing instead of restraining it.',
      pastUrl: 'https://www.federalreserve.gov/mediacenter/files/FOMCpresconf20230920.pdf#page=2',
      pastLink: 'FOMC press conference, 20 Sep 2023',
      currentUrl: SPEECH_2024,
      currentLink: 'Powell speech, 23 Aug 2024'
    },
    credit: {
      name: 'Credit conditions',
      pastSign: '+', sign: '?', state: 'unverified',
      pastSignal: 'Tighter credit conditions',
      currentSignal: 'Not addressed in the current source',
      past: 'The September 2023 statement expected tighter credit conditions to weigh on activity, hiring, and inflation, with an uncertain impact.',
      current: 'The selected August 2024 source does not establish whether credit conditions still support easing.',
      assessment: 'Unverified. The path stays visible but is excluded from current support.',
      pastUrl: 'https://www.federalreserve.gov/newsevents/pressreleases/monetary20230920a.htm',
      pastLink: 'FOMC statement, 20 Sep 2023',
      currentUrl: SPEECH_2024,
      currentLink: 'Powell speech, 23 Aug 2024'
    }
  };
  const FACTOR_KEYS = Object.keys(FACTORS);

  const STEPS = [
    {
      desc: 'The resolved September 2023 meeting provides three paths into the case for easing: inflation, labor, and credit conditions. The paths keep their factors and historical signs. The 2023 decision and its probabilities are removed before the structure is reused.',
      caseNote: 'Three historical paths',
      targetNote: 'New occurrence'
    },
    {
      desc: 'The three factors guide retrieval of sources published before the target meeting. In his 23 August 2024 speech, Powell reports renewed progress on inflation and a labor market that has cooled considerably. The selected source does not address the credit channel.',
      caseNote: 'Paths not yet tested',
      targetNote: 'New occurrence'
    },
    {
      desc: 'Each relation is tested against the 2024 evidence. Inflation progress still supports easing, so that relation is preserved. Labor now supports easing instead of restraining it, so its contribution is reversed. Credit support cannot be checked and is marked unverified.',
      caseNote: 'Two relations supported, one unverified',
      targetNote: 'New occurrence'
    },
    {
      desc: 'Only supported relations enter the forecast. The preserved inflation path and the reversed labor path both favor a cut, and the unverified credit path is set aside. The evidence does not settle the size of the cut, so the forecast keeps that uncertainty.',
      caseNote: 'Supported by inflation and labor',
      targetNote: 'Supported paths favor a cut. The size of the cut is unresolved.'
    }
  ];

  const graph = $('#graph');
  const svg = $('#graph-edges');
  let step = 0;
  let focus = 'inflation';
  let edges = null;

  function relation(key, s) {
    const f = FACTORS[key];
    if (s === 0) return { state: 'historical', sign: f.pastSign, label: f.pastSign === '+' ? 'Supports easing' : 'Restrains easing' };
    if (s === 1) return { state: 'untested', sign: f.pastSign, label: 'To be tested' };
    if (s === 3 && f.state === 'unverified') return { state: 'excluded', sign: '?', label: 'Set aside' };
    const labels = { preserved: 'Preserved', reversed: 'Reversed, was ' + f.pastSign, unverified: 'Unverified', contradicted: 'Contradicted' };
    return { state: f.state, sign: f.sign, label: labels[f.state] };
  }

  function buildEdges() {
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';
    const states = ['historical', 'untested', 'preserved', 'reversed', 'contradicted', 'unverified', 'excluded', 'idle', 'active'];
    const defs = document.createElementNS(ns, 'defs');
    states.forEach(state => {
      const marker = document.createElementNS(ns, 'marker');
      marker.setAttribute('id', 'arrow-' + state);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '7');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('markerUnits', 'userSpaceOnUse');
      marker.setAttribute('orient', 'auto');
      const tip = document.createElementNS(ns, 'path');
      tip.setAttribute('d', 'M0 1 L9 5 L0 9 Z');
      tip.setAttribute('class', 'arrow-' + state);
      marker.appendChild(tip);
      defs.appendChild(marker);
    });
    svg.appendChild(defs);
    edges = {};
    FACTOR_KEYS.concat('out').forEach((key, i) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('class', 'edge');
      path.style.setProperty('--i', key === 'out' ? 3 : i);
      svg.appendChild(path);
      edges[key] = path;
    });
  }

  function drawEdges() {
    if (!edges || getComputedStyle(svg).display === 'none') return;
    const g = graph.getBoundingClientRect();
    if (!g.width) return;
    svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
    const caseBox = $('#node-case').getBoundingClientRect();
    const targetBox = $('#node-target').getBoundingClientRect();
    const caseMid = caseBox.top + caseBox.height / 2 - g.top;
    const x2 = caseBox.left - g.left - 1;
    FACTOR_KEYS.forEach((key, i) => {
      const box = $(`[data-factor="${key}"]`).getBoundingClientRect();
      const x1 = box.right - g.left;
      const y1 = box.top + box.height / 2 - g.top;
      const y2 = caseMid + (i - 1) * 12;
      const dx = (x2 - x1) * 0.55;
      const state = relation(key, step).state;
      edges[key].setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + dx).toFixed(1)} ${y1.toFixed(1)} ${(x2 - dx).toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
      edges[key].dataset.state = state;
      edges[key].setAttribute('marker-end', `url(#arrow-${state})`);
    });
    const outState = step === 3 ? 'active' : 'idle';
    const ox1 = caseBox.right - g.left;
    const ox2 = targetBox.left - g.left - 1;
    edges.out.setAttribute('d', `M${ox1.toFixed(1)} ${caseMid.toFixed(1)} H${ox2.toFixed(1)}`);
    edges.out.dataset.state = outState;
    edges.out.setAttribute('marker-end', `url(#arrow-${outState})`);
  }

  function renderExample() {
    if (!graph) return;
    graph.dataset.step = String(step);
    FACTOR_KEYS.forEach(key => {
      const f = FACTORS[key];
      const r = relation(key, step);
      const button = $(`[data-factor="${key}"]`);
      button.dataset.state = r.state;
      button.setAttribute('aria-pressed', String(focus === key));
      button.setAttribute('aria-label', `${f.name}. ${step === 0 ? f.pastSignal : f.currentSignal}. ${r.label}.`);
      $(`[data-signal="${key}"]`).textContent = step === 0 ? f.pastSignal : f.currentSignal;
      const chip = $(`[data-relation="${key}"]`);
      chip.dataset.state = r.state;
      $('.relation-sign', chip).textContent = r.sign;
      $('.relation-label', chip).textContent = r.label;
    });
    $('#case-note').textContent = STEPS[step].caseNote;
    $('#target-note').textContent = STEPS[step].targetNote;
    $('#node-case').toggleAttribute('data-active', step === 3);
    $('#node-target').toggleAttribute('data-active', step === 3);
    $('#step-desc').textContent = STEPS[step].desc;
    $$('[data-step]').forEach(button => {
      const i = Number(button.dataset.step);
      button.setAttribute('aria-pressed', String(i === step));
      button.toggleAttribute('data-done', i < step);
    });
    $('#step-prev').disabled = step === 0;
    $('#step-next').textContent = step === 3 ? 'Start again' : 'Next step';

    const f = FACTORS[focus];
    $('#evidence-title').textContent = f.name;
    const assessment = $('#evidence-assessment');
    if (step < 2) {
      assessment.dataset.state = 'historical';
      assessment.textContent = `In 2023 this factor ${f.pastSign === '+' ? 'supported' : 'restrained'} easing. It is assessed in step 3.`;
    } else {
      assessment.dataset.state = f.state;
      assessment.textContent = f.assessment;
    }
    $('#evidence-past').textContent = f.past;
    $('#evidence-current').textContent = f.current;
    const pastSource = $('#evidence-past-source');
    pastSource.href = f.pastUrl;
    pastSource.textContent = f.pastLink;
    const currentSource = $('#evidence-current-source');
    currentSource.href = f.currentUrl;
    currentSource.textContent = f.currentLink;

    drawEdges();
  }

  function setStep(next) {
    step = Math.max(0, Math.min(STEPS.length - 1, next));
    renderExample();
  }

  if (graph) {
    buildEdges();
    $$('[data-step]').forEach(button => button.addEventListener('click', () => setStep(Number(button.dataset.step))));
    $('#step-prev').addEventListener('click', () => setStep(step - 1));
    $('#step-next').addEventListener('click', () => setStep(step === 3 ? 0 : step + 1));
    $$('[data-factor]').forEach(button => button.addEventListener('click', () => {
      focus = button.dataset.factor;
      renderExample();
    }));
    if ('ResizeObserver' in window) new ResizeObserver(drawEdges).observe(graph);
    window.addEventListener('resize', drawEdges, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawEdges);
    renderExample();
  }

  /* ------------------------------------------------------------------
     Results. Table 3 of the paper: per method,
     [accuracy, sd, Brier, sd, NLL, sd], means over three runs.
     ------------------------------------------------------------------ */
  const METHODS = ['Direct Forecast', 'Structured Reasoning', 'Factor Memory', 'Principle Memory', 'Case Memory', 'Structure Memory', 'ReFoRM'];
  const RESULTS = {
    average:  [[.497,.012,.231,.004,.991,.021],[.440,.006,.250,.001,1.046,.005],[.509,.008,.232,.003,.995,.011],[.486,.018,.237,.005,1.011,.020],[.490,.012,.241,.002,1.037,.012],[.492,.008,.236,.001,1.012,.007],[.550,.003,.217,.002,.922,.009]],
    gemini:   [[.523,.021,.235,.008,1.040,.034],[.387,.031,.285,.015,1.210,.055],[.523,.012,.235,.005,1.001,.018],[.460,.035,.260,.015,1.116,.067],[.453,.042,.262,.008,1.160,.049],[.483,.012,.250,.005,1.094,.003],[.530,.000,.212,.000,.914,.000]],
    gpt:      [[.490,.010,.229,.008,.976,.040],[.477,.051,.237,.013,1.006,.043],[.520,.036,.227,.010,.969,.033],[.513,.021,.226,.006,.956,.016],[.520,.020,.229,.008,.981,.027],[.493,.023,.228,.006,.966,.015],[.513,.015,.217,.008,.928,.030]],
    deepseek: [[.517,.025,.229,.009,.981,.041],[.463,.035,.238,.007,.999,.022],[.520,.026,.226,.002,.987,.011],[.520,.026,.225,.008,.962,.022],[.520,.020,.233,.011,.993,.026],[.500,.000,.227,.003,.969,.024],[.583,.025,.213,.006,.886,.019]],
    llama:    [[.433,.025,.238,.006,.976,.028],[.433,.012,.246,.005,.996,.010],[.453,.023,.239,.013,1.000,.041],[.427,.040,.241,.006,.994,.013],[.440,.026,.242,.008,1.002,.023],[.450,.026,.245,.008,1.004,.021],[.527,.025,.227,.003,.946,.014]],
    qwen:     [[.523,.021,.228,.005,.984,.035],[.440,.000,.244,.003,1.019,.013],[.530,.017,.233,.008,1.017,.054],[.507,.015,.234,.006,1.024,.059],[.517,.032,.237,.005,1.050,.029],[.533,.040,.232,.004,1.025,.027],[.597,.015,.217,.006,.936,.036]]
  };
  const MODELS = [
    { key: 'gemini', label: 'Gemini 2.5 Flash Lite', short: 'Gemini' },
    { key: 'gpt', label: 'GPT-5 mini', short: 'GPT-5 mini' },
    { key: 'deepseek', label: 'DeepSeek V3.2', short: 'DeepSeek' },
    { key: 'llama', label: 'Llama 4 Maverick', short: 'Llama 4' },
    { key: 'qwen', label: 'Qwen Plus', short: 'Qwen Plus' },
    { key: 'average', label: 'Five-model average', short: 'Average' }
  ];
  const METRICS = {
    brier: { index: 2, label: 'Brier score', higher: false },
    nll: { index: 4, label: 'NLL', higher: false },
    accuracy: { index: 0, label: 'Accuracy', higher: true }
  };
  const fmt = v => v.toFixed(3);
  let metric = 'brier';

  function niceTicks(lo, hi, count) {
    const raw = (hi - lo) / count;
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const unit = [1, 2, 2.5, 5, 10].map(m => m * power).find(s => s >= raw) || power * 10;
    const ticks = [];
    for (let t = Math.ceil(lo / unit) * unit; t <= hi + 1e-9; t += unit) ticks.push(Number(t.toFixed(6)));
    return ticks;
  }

  const strip = $('#strip');
  const tip = $('#strip-tip');

  function renderStrip() {
    if (!strip) return;
    const m = METRICS[metric];
    const width = Math.max(280, strip.clientWidth);
    const narrow = width < 560;
    const labelW = narrow ? 92 : 178;
    const padR = 14;
    const rowH = narrow ? 40 : 44;
    const sepGap = 14;
    const axisH = 28;
    const values = MODELS.flatMap(model => RESULTS[model.key].map(row => row[m.index]));
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    const span = hi - lo;
    lo -= span * 0.06;
    hi += span * 0.06;
    const x = v => labelW + (v - lo) / (hi - lo) * (width - labelW - padR);
    const rowY = r => r * rowH + rowH / 2 + (r === MODELS.length - 1 ? sepGap : 0);
    const plotBottom = MODELS.length * rowH + sepGap;
    const height = plotBottom + axisH;
    const ticks = niceTicks(lo, hi, narrow ? 4 : 6);

    let out = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">`;
    ticks.forEach(t => {
      const tx = x(t).toFixed(1);
      out += `<line class="grid-line" x1="${tx}" x2="${tx}" y1="0" y2="${plotBottom}"/>`;
      out += `<text class="tick" x="${tx}" y="${plotBottom + 19}" text-anchor="middle">${metric === 'accuracy' ? t.toFixed(2) : t.toFixed(t < 0.5 ? 3 : 2)}</text>`;
    });
    const sepY = (MODELS.length - 1) * rowH + sepGap / 2;
    out += `<line class="avg-sep" x1="0" x2="${width - padR}" y1="${sepY}" y2="${sepY}"/>`;
    MODELS.forEach((model, r) => {
      const y = rowY(r);
      const rows = RESULTS[model.key];
      out += `<text class="row-label${model.key === 'average' ? ' is-avg' : ''}" x="0" y="${y}" dominant-baseline="central">${narrow ? model.short : model.label}</text>`;
      out += `<line class="row-line" x1="${labelW}" x2="${width - padR}" y1="${y}" y2="${y}"/>`;
      const point = (j, cls, radius) => `<circle class="${cls}" cx="${x(rows[j][m.index]).toFixed(1)}" cy="${y}" r="${radius}" data-method="${METHODS[j]}" data-model="${model.label}" data-value="${fmt(rows[j][m.index])}"><title>${METHODS[j]}, ${model.label}: ${fmt(rows[j][m.index])}</title></circle>`;
      for (let j = 1; j <= 5; j++) out += point(j, 'pt-other', 4.5);
      out += point(0, 'pt-direct', 5.5);
      out += point(6, 'pt-reform', 6.5);
    });
    out += '</svg>';
    strip.innerHTML = out;

    const better = m.higher ? 'Higher' : 'Lower';
    $('#strip-caption').textContent = `${m.label} for each method and model, as a mean over three runs. ${better} is better. Hover over or tap a point to see the method.`;
    const lead = metric === 'accuracy'
      ? 'ReFoRM has the highest accuracy for four of the five models and on average.'
      : `ReFoRM has the lowest ${m.label} for every model.`;
    strip.setAttribute('aria-label', `${m.label} of seven methods for each of five models and their average. ${lead}`);
  }

  function showTip(circle) {
    const figure = strip.closest('figure');
    const fb = figure.getBoundingClientRect();
    const cb = circle.getBoundingClientRect();
    $$('circle.is-hot', strip).forEach(c => c.classList.remove('is-hot'));
    circle.classList.add('is-hot');
    tip.textContent = `${circle.dataset.method}: ${circle.dataset.value}`;
    tip.hidden = false;
    const left = cb.left + cb.width / 2 - fb.left;
    const half = tip.offsetWidth / 2;
    tip.style.left = Math.max(half + 6, Math.min(fb.width - half - 6, left)) + 'px';
    tip.style.top = (cb.top - fb.top) + 'px';
  }
  function hideTip() {
    if (!tip) return;
    tip.hidden = true;
    $$('circle.is-hot', strip).forEach(c => c.classList.remove('is-hot'));
  }

  if (strip) {
    strip.addEventListener('pointerover', event => { if (event.target.matches('circle')) showTip(event.target); });
    strip.addEventListener('pointerout', event => { if (event.target.matches('circle') && event.pointerType === 'mouse') hideTip(); });
    strip.addEventListener('pointerdown', event => { if (event.target.matches('circle')) showTip(event.target); else hideTip(); });
    document.addEventListener('pointerdown', event => { if (!strip.contains(event.target)) hideTip(); });
    $$('[data-metric]').forEach(button => button.addEventListener('click', () => {
      metric = button.dataset.metric;
      $$('[data-metric]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      hideTip();
      renderStrip();
    }));
    let lastWidth = 0;
    const onResize = () => {
      if (Math.abs(strip.clientWidth - lastWidth) < 2) return;
      lastWidth = strip.clientWidth;
      hideTip();
      renderStrip();
    };
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(strip);
    else window.addEventListener('resize', onResize, { passive: true });
    renderStrip();
  }

  function renderTable(model) {
    const body = $('#results-table tbody');
    if (!body) return;
    const rows = RESULTS[model];
    const marks = [0, 2, 4].map(c => {
      const higher = c === 0;
      const unique = [...new Set(rows.map(r => r[c]))].sort((a, b) => higher ? b - a : a - b);
      return { c, best: unique[0], second: unique[1] };
    });
    const cell = (value, sd, mark) => {
      let text = fmt(value);
      if (value === mark.best) text = `<b>${text}</b>`;
      else if (value === mark.second) text = `<u>${text}</u>`;
      return `<td>${text}<span class="sd">±${fmt(sd)}</span></td>`;
    };
    let html = '';
    rows.forEach((row, i) => {
      if (i === 0) html += '<tr class="group-row"><th scope="rowgroup" colspan="4">No-memory baselines</th></tr>';
      if (i === 2) html += '<tr class="group-row"><th scope="rowgroup" colspan="4">Resolved-event memory</th></tr>';
      html += `<tr${i === 6 ? ' class="is-ours"' : ''}><th scope="row">${METHODS[i]}</th>${marks.map(mk => cell(row[mk.c], row[mk.c + 1], mk)).join('')}</tr>`;
    });
    body.innerHTML = html;
  }

  $$('[data-model]').forEach(button => button.addEventListener('click', () => {
    $$('[data-model]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    renderTable(button.dataset.model);
  }));
  renderTable('average');

  /* ------------------------------------------------------------------
     Case study tabs
     ------------------------------------------------------------------ */
  const caseTabs = $$('.case-tabs [role="tab"]');
  function selectCase(index, moveFocus) {
    caseTabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    if (moveFocus) caseTabs[index].focus();
  }
  caseTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectCase(i, false));
    tab.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowRight') next = (i + 1) % caseTabs.length;
      if (event.key === 'ArrowLeft') next = (i - 1 + caseTabs.length) % caseTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = caseTabs.length - 1;
      if (next !== null) { event.preventDefault(); selectCase(next, true); }
    });
  });

  /* ------------------------------------------------------------------
     Copy BibTeX
     ------------------------------------------------------------------ */
  const copyButton = $('#copy-bibtex');
  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const pre = $('#bibtex');
      const status = $('#copy-status');
      try {
        await navigator.clipboard.writeText(pre.textContent);
        copyButton.textContent = 'Copied';
        status.textContent = 'BibTeX copied to the clipboard.';
        setTimeout(() => { copyButton.textContent = 'Copy BibTeX'; }, 2000);
      } catch (error) {
        const range = document.createRange();
        range.selectNodeContents(pre);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = 'The citation is selected. Press Ctrl+C or Cmd+C to copy it.';
      }
    });
  }

  /* ------------------------------------------------------------------
     Header state and section highlighting
     ------------------------------------------------------------------ */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.site-nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const byId = new Map(navLinks.map(a => [a.getAttribute('href').slice(1), a]));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(a => a.classList.remove('is-active'));
        const link = byId.get(entry.target.id);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    byId.forEach((link, id) => { const section = document.getElementById(id); if (section) observer.observe(section); });
  }
})();
