'use strict';

const stages = [
  {
    kicker: 'REFERENCE / SEPTEMBER 2023',
    title: 'Keep the paths.<br>Drop old answers.',
    description: 'From the resolved September 2023 event, retain connected paths linking inflation, labor, and credit conditions to the policy balance. Remove the old answer and probabilities before reusing this structure.',
    principle: 'Use past relationships to choose which current evidence to investigate.',
    diagram: '<div class="diagram-caption">HISTORICAL MEMORY / 20 SEP 2023</div><div class="diagram-ledger"><h4>Three paths to revisit</h4><div class="ledger-row"><span>Inflation moderation</span><b>Progress, but still elevated</b></div><div class="ledger-row"><span>Labor conditions</span><b>Still tight</b></div><div class="ledger-row"><span>Credit conditions</span><b>Headwinds</b></div></div>'
  },
  {
    kicker: 'EVIDENCE / AUGUST 2024',
    title: 'Find new evidence.<br>Name the gaps.',
    description: 'Use these factors to retrieve pre-target evidence. In his 23 August 2024 speech, Powell describes renewed inflation progress and a cooler labor market. Keep the old credit path marked as an evidence gap.',
    principle: 'Build the forecast from sources published before the target date.',
    diagram: '<div class="diagram-caption">SELECTED EVIDENCE / BY 23 AUG 2024</div><div class="diagram-ledger"><h4>What changed?</h4><div class="ledger-row"><span>Inflation</span><b>Progress resumed</b></div><div class="ledger-row"><span>Labor</span><b>Cooled considerably</b></div><div class="ledger-row"><span>Old credit channel</span><b>Unverified</b></div></div>'
  },
  {
    kicker: 'RECONSTRUCT / TEST EACH PATH',
    title: 'Retest the links.<br>Keep what holds.',
    description: 'Recheck the 2024 evidence: retain inflation progress, update the labor contribution, and mark the credit path unverified.',
    principle: 'Carry verified relations into the forecast and keep unresolved links visible.',
    diagram: '<div class="diagram-caption">EXPLORE THE EVENT GRAPH BELOW</div><div class="stage-path-summary"><div><span class="path-summary-state kept">PRESERVED</span><p>Inflation progress → easing support</p></div><div><span class="path-summary-state reversed">REVERSED CONTRIBUTION</span><p>Tight labor → cooler labor</p></div><div><span class="path-summary-state removed">EXCLUDED · UNVERIFIED</span><p>Credit channel → unverified</p></div></div>'
  },
  {
    kicker: 'FORECAST / CURRENT STRUCTURE',
    title: 'Form a forecast.<br>Keep uncertainty.',
    description: 'Combine supported paths into a current estimate. Map that estimate to the answer boundaries, then assign probabilities that reflect the remaining uncertainty.',
    principle: 'Check the estimate, selected interval, and probabilities for consistency.',
    diagram: '<div class="diagram-caption">CURRENT STRUCTURE → NEXT DECISION</div><div class="diagram-ledger forecast-reasoning"><h4>A stronger easing case</h4><div class="ledger-row"><span>Inflation progress</span><b>Retained support</b></div><div class="ledger-row"><span>Labor cooling</span><b>Updated support</b></div><div class="ledger-row"><span>Cut size</span><b>Unresolved</b></div></div>'
  }
];

const methodNames = ['Direct Forecast', 'Structured Reasoning', 'Factor Memory', 'Principle Memory', 'Case Memory', 'Structure Memory', 'ReFoRM'];
// Table 3: each entry is [accuracy mean, sd, Brier mean, sd, NLL mean, sd].
const reportedResults = {
  average: [[.497,.012,.231,.004,.991,.021],[.440,.006,.250,.001,1.046,.005],[.509,.008,.232,.003,.995,.011],[.486,.018,.237,.005,1.011,.020],[.490,.012,.241,.002,1.037,.012],[.492,.008,.236,.001,1.012,.007],[.550,.003,.217,.002,.922,.009]],
  gemini: [[.523,.021,.235,.008,1.040,.034],[.387,.031,.285,.015,1.210,.055],[.523,.012,.235,.005,1.001,.018],[.460,.035,.260,.015,1.116,.067],[.453,.042,.262,.008,1.160,.049],[.483,.012,.250,.005,1.094,.003],[.530,.000,.212,.000,.914,.000]],
  gpt: [[.490,.010,.229,.008,.976,.040],[.477,.051,.237,.013,1.006,.043],[.520,.036,.227,.010,.969,.033],[.513,.021,.226,.006,.956,.016],[.520,.020,.229,.008,.981,.027],[.493,.023,.228,.006,.966,.015],[.513,.015,.217,.008,.928,.030]],
  deepseek: [[.517,.025,.229,.009,.981,.041],[.463,.035,.238,.007,.999,.022],[.520,.026,.226,.002,.987,.011],[.520,.026,.225,.008,.962,.022],[.520,.020,.233,.011,.993,.026],[.500,.000,.227,.003,.969,.024],[.583,.025,.213,.006,.886,.019]],
  llama: [[.433,.025,.238,.006,.976,.028],[.433,.012,.246,.005,.996,.010],[.453,.023,.239,.013,1.000,.041],[.427,.040,.241,.006,.994,.013],[.440,.026,.242,.008,1.002,.023],[.450,.026,.245,.008,1.004,.021],[.527,.025,.227,.003,.946,.014]],
  qwen: [[.523,.021,.228,.005,.984,.035],[.440,.000,.244,.003,1.019,.013],[.530,.017,.233,.008,1.017,.054],[.507,.015,.234,.006,1.024,.059],[.517,.032,.237,.005,1.050,.029],[.533,.040,.232,.004,1.025,.027],[.597,.015,.217,.006,.936,.036]]
};
const metrics = {
  brier: {index: 2, description: 'Brier score measures probability error. Lower is better.', format: v => v.toFixed(3)},
  accuracy: {index: 0, description: 'Accuracy measures how often the top-probability answer is correct. Higher is better.', format: v => (v*100).toFixed(1)+'%'},
  nll: {index: 4, description: 'NLL penalizes assigning low probability to the actual outcome. Lower is better.', format: v => v.toFixed(3)}
};
let selectedMetric = 'brier';
const modelSelect = document.querySelector('#model-select');
let selectedStage = -1;

// All copies share grid rows, so each row reserves the tallest stage at any width.
document.querySelector('#method-copy').innerHTML = stages.map((stage,index) => '<div class="method-text" data-stage-copy="'+index+'" aria-hidden="'+String(index!==0)+'"><span class="pill">'+stage.kicker+'</span><h3 class="stage-copy-title">'+stage.title+'</h3><p class="stage-copy-description">'+stage.description+'</p><div class="method-principle"><span aria-hidden="true">↳</span><p>'+stage.principle+'</p></div></div>').join('');

function setStage(index) {
  if (index === selectedStage) return;
  selectedStage = index;
  const stage = stages[index];
  document.querySelectorAll('[data-stage]').forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    tab.classList.toggle('is-traversed', i < index);
  });
  document.querySelector('#stage-panel').setAttribute('aria-labelledby', 'stage-tab-'+index);
  document.querySelectorAll('[data-stage-copy]').forEach((copy,i) => copy.setAttribute('aria-hidden',String(i!==index)));
  document.querySelector('#stage-diagram').innerHTML = stage.diagram;
  document.dispatchEvent(new CustomEvent('reform:stage',{detail:index}));
}

function renderResults() {
  const data = reportedResults[modelSelect.value];
  const metric = metrics[selectedMetric];
  const maximum = selectedMetric === 'accuracy' ? 1 : Math.max(...data.map(r=>r[metric.index]))*1.1;
  document.querySelector('#metric-description').textContent = metric.description;
  document.querySelector('#results-chart').innerHTML = data.map((row,i)=>'<div class="chart-row'+(i===6?' highlight':'')+'"><span class="chart-label">'+methodNames[i]+'</span><div class="chart-track" aria-hidden="true"><div class="chart-bar" style="width:'+(row[metric.index]/maximum*100).toFixed(2)+'%"></div></div><span class="chart-number">'+metric.format(row[metric.index])+'</span></div>').join('');
  document.querySelector('#data-caption').textContent = modelSelect.selectedOptions[0].textContent+' — Table 3 (mean ± standard deviation)';
  document.querySelector('#results-table').innerHTML = data.map((r,i)=>'<tr><th scope="row">'+methodNames[i]+'</th><td>'+r[0].toFixed(3)+' ± '+r[1].toFixed(3)+'</td><td>'+r[2].toFixed(3)+' ± '+r[3].toFixed(3)+'</td><td>'+r[4].toFixed(3)+' ± '+r[5].toFixed(3)+'</td></tr>').join('');
}

const cases = [
  {
    period:'CASE I / JUNE 2025 U.S. CPI',
    question:'Which range will the monthly CPI change fall into?',
    boundaries:'Below: < 0.146% · Within: 0.146% to < 0.299% · Above: ≥ 0.299%',
    changeLabel:'A DIFFERENT SELECTED INTERVAL',
    difference:'Extrapolate the last reading—or examine what drives the next one.',
    sharedEvidence:'Same question, same current evidence. Both start from May’s +0.10% CPI reading.',
    directTitle:'Extend the aggregate reading.',
    directSteps:[
      {label:'OBSERVE',text:'May CPI was +0.10%, a soft recent reading.'},
      {label:'ASSUME PERSISTENCE',text:'Carry May’s slowdown into June.',caution:true},
      {label:'MAP TO THE TARGET',text:'Estimate June at +0.099%, below the 0.146% boundary.'}
    ],
    directOption:'BELOW · 85%',
    reformTitle:'Balance the component pressures.',
    reformSteps:[
      {label:'ESTABLISH A BASELINE',text:'Set May’s +0.10% as the baseline for the component analysis.'},
      {label:'RECONSTRUCT THE MECHANISM',text:'Balance housing pressure against May moderation; energy and food are approximately neutral.'},
      {label:'MAP TO THE TARGET',text:'Estimate June at about +0.20%, inside the middle interval.'}
    ],
    reformOption:'WITHIN · 60%',
    takeaway:'Balancing component pressures shifts the June estimate from +0.099% to approximately +0.20%, changing the selected interval from BELOW to WITHIN.'
  },
  {
    period:'CASE II / WALMART 2026-Q1',
    question:'Which range will revenue-growth acceleration fall into?',
    boundaries:'Below: < −1.385 pp · Within: −1.385 to < +1.349 pp · Above: ≥ +1.349 pp',
    changeLabel:'SAME ANSWER, DIFFERENT JUSTIFICATION',
    difference:'Revenue momentum is supported. A large acceleration is still unverified.',
    sharedEvidence:'Same question and current evidence: positive business drivers alongside consumer headwinds.',
    directTitle:'Fall back to a near-zero estimate.',
    directSteps:[
      {label:'WEIGH MIXED SIGNALS',text:'Positive business drivers and consumer headwinds point in opposite directions.'},
      {label:'IDENTIFY A GAP',text:'The exact acceleration magnitude is unsupported.',caution:true},
      {label:'USE A BASE RATE',text:'Choose a near-zero estimate of −0.018 pp, inside the middle interval.'}
    ],
    directOption:'WITHIN · 50%',
    reformTitle:'Separate direction from magnitude.',
    reformSteps:[
      {label:'IDENTIFY SUPPORTED DRIVERS',text:'Raised guidance, 27% e-commerce growth, and grocery growth support revenue momentum.'},
      {label:'USE THE DIRECTIONAL SIGNAL',text:'Positive momentum makes a below-range realization less likely.'},
      {label:'KEEP THE MISSING LINK VISIBLE',text:'The link to acceleration at or above +1.349 pp remains unverified.',caution:true}
    ],
    reformOption:'WITHIN · 65%',
    directProbabilities:[25,50,25],
    reformProbabilities:[5,65,30],
    takeaway:'Both select WITHIN. ReFoRM lowers BELOW from 25% to 5% and raises WITHIN from 50% to 65%. Direct Forecast scores 0.1250 Brier; ReFoRM scores 0.0717.'
  }
];
function setCase(index) {
  const data = cases[index];
  document.querySelectorAll('[data-case]').forEach((tab,i)=>{
    tab.setAttribute('aria-selected',String(i===index));
    tab.tabIndex = i===index ? 0 : -1;
  });
  document.querySelector('#case-panel').setAttribute('aria-labelledby','case-tab-'+index);
  const bindings = {'case-period':'period','case-question':'question','case-boundaries':'boundaries','case-change-label':'changeLabel','case-difference':'difference','case-shared-evidence':'sharedEvidence','direct-title':'directTitle','direct-option':'directOption','reform-title':'reformTitle','reform-option':'reformOption','case-takeaway':'takeaway'};
  Object.entries(bindings).forEach(([id,key])=>{document.getElementById(id).textContent=data[key];});
  const trace = steps => steps.map(step => '<li'+(step.caution?' class="trace-caution"':'')+'><span>'+step.label+'</span><p>'+step.text+'</p></li>').join('');
  document.querySelector('#direct-trace').innerHTML = trace(data.directSteps);
  document.querySelector('#reform-trace').innerHTML = trace(data.reformSteps);
  const visual = document.querySelector('#case-result-visual');
  if (data.directProbabilities) {
    const labels = ['Below','Within','Above'];
    const rows = labels.map((label,i)=>'<tr><th scope="row">'+label+'</th><td><div class="probability-cell"><span class="probability-track"><i style="width:'+data.directProbabilities[i]+'%"></i></span><b>'+data.directProbabilities[i]+'%</b></div></td><td><div class="probability-cell reform-probability"><span class="probability-track"><i style="width:'+data.reformProbabilities[i]+'%"></i></span><b>'+data.reformProbabilities[i]+'%</b></div></td></tr>').join('');
    visual.innerHTML = '<div class="case-visual-heading"><h4>Same interval. Different probability allocation.</h4><span>Reported in Figure 3</span></div><div class="table-scroll"><table class="probability-table"><caption>Probability assigned to each Walmart outcome</caption><thead><tr><th scope="col">Outcome</th><th scope="col">Direct Forecast</th><th scope="col">ReFoRM</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  } else {
    visual.innerHTML = '<div class="case-visual-heading"><h4>Two estimates, on opposite sides of a boundary.</h4><span>Reported in Figure 3</span></div><div class="boundary-comparison"><div><span>Direct Forecast</span><strong>+0.099%</strong><p>Below the 0.146% boundary</p><b>BELOW</b></div><span class="boundary-arrow" aria-hidden="true">→</span><div><span>ReFoRM</span><strong>≈ +0.20%</strong><p>Inside [0.146%, 0.299%)</p><b>WITHIN</b></div></div>';
  }
}

function bindTabs(selector, callback) {
  const tabs = Array.from(document.querySelectorAll(selector));
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>callback(index));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key === 'ArrowRight' || event.key === 'ArrowDown') next=(index+1)%tabs.length;
      else if(event.key === 'ArrowLeft' || event.key === 'ArrowUp') next=(index-1+tabs.length)%tabs.length;
      else if(event.key === 'Home') next=0;
      else if(event.key === 'End') next=tabs.length-1;
      else return;
      event.preventDefault(); callback(next); tabs[next].focus();
    });
  });
}
bindTabs('[data-stage]',setStage);
bindTabs('[data-case]',setCase);
document.querySelectorAll('[data-stage]').forEach((tab,index)=>{
  tab.addEventListener('pointerenter',event=>{ if(event.pointerType === 'mouse') setStage(index); });
  tab.addEventListener('focus',()=>setStage(index));
});
const explorer = document.querySelector('#method-explorer');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let spotlightFrame = null;
explorer.addEventListener('pointermove',event=>{
  if(event.pointerType !== 'mouse' || reduceMotion.matches) return;
  const bounds = explorer.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  if(spotlightFrame !== null) cancelAnimationFrame(spotlightFrame);
  spotlightFrame = requestAnimationFrame(()=>{
    explorer.style.setProperty('--pointer-x',x+'px');
    explorer.style.setProperty('--pointer-y',y+'px');
    explorer.classList.add('pointer-active');
    spotlightFrame = null;
  });
});
explorer.addEventListener('pointerleave',()=>{
  if(spotlightFrame !== null) cancelAnimationFrame(spotlightFrame);
  spotlightFrame = null;
  explorer.classList.remove('pointer-active');
});
modelSelect.addEventListener('change',renderResults);
document.querySelectorAll('[data-metric]').forEach(button=>button.addEventListener('click',()=>{
  selectedMetric=button.dataset.metric;
  document.querySelectorAll('[data-metric]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  renderResults();
}));

const citation = `@misc{jin_reform,
  title = {From Hindsight to Foresight: Adapting Reusable Reasoning Structures from Recurring Financial Events},
  author = {Jin, Sangjin and Lee, Junhyeong and Han, Daehee and Kim, Kangmin and Park, Suhwan and Jeong, Seonghun and Park, Daekyung and Szpruch, Lukasz and Wang, Zhangyang and Choi, Chanyeol and Kwak, Youngjun and Lee, Yongjae},
  note = {Research manuscript}
}`;
document.querySelector('#citation-text').textContent=citation;
document.querySelector('#copy-citation').addEventListener('click',async()=>{
  const status=document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(citation);
    status.textContent='BibTeX citation copied to your clipboard.';
  } catch {
    const detail=document.querySelector('.citation-fallback');
    detail.open=true;
    document.querySelector('#citation-text').focus();
    status.textContent='Select and copy the citation text shown below.';
  }
});
setStage(0); setCase(0); renderResults();
