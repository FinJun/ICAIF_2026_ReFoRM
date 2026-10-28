'use strict';

// A manually interpreted, source-linked teaching example; not a model-run trace.
const fedPaths = {
  inflation: {
    name:'Inflation trend', state:'kept', badge:'PRESERVED', sign:'+', pastSign:'+',
    title:'Inflation progress still supports the easing case.',
    pastSignal:'Moderating, still elevated', currentSignal:'Progress toward 2% resumes',
    past:'In September 2023, Powell described moderating inflation, but policy remained restrictive and inflation was still above the goal.',
    current:'By 23 August 2024, Powell reported renewed inflation progress and greater confidence in a sustainable return to 2%.',
    interpretation:'Retain inflation progress as support for easing.',
    pastUrl:'https://www.federalreserve.gov/mediacenter/files/FOMCpresconf20230920.pdf#page=2',
    currentUrl:'https://www.federalreserve.gov/newsevents/speech/powell20240823a.htm',
    currentLink:'Powell’s 23 Aug 2024 speech ↗'
  },
  labor: {
    name:'Labor conditions', state:'reversed', badge:'REVERSED CONTRIBUTION', sign:'+', pastSign:'−',
    title:'The labor signal shifts from restraining easing to supporting it.',
    pastSignal:'Jobs remain strong', currentSignal:'Cooling; July jobless rate 4.3%',
    past:'The 2023 press conference described a tight labor market. August unemployment was 3.8%, and labor demand still exceeded available workers.',
    current:'Powell’s August 2024 speech reported July unemployment of 4.3% and considerable cooling. He emphasized protecting the labor market from further cooling.',
    interpretation:'The labor signal’s contribution to easing changes from − to + as cooling replaces tightness.',
    pastUrl:'https://www.federalreserve.gov/mediacenter/files/FOMCpresconf20230920.pdf#page=2',
    currentUrl:'https://www.federalreserve.gov/newsevents/speech/powell20240823a.htm',
    currentLink:'Powell’s 23 Aug 2024 speech ↗'
  },
  credit: {
    name:'Credit conditions', state:'removed', badge:'REMOVED · UNVERIFIED', sign:'?', pastSign:'+',
    title:'Exclude the unverified credit path.',
    pastSignal:'Tighter credit headwinds', currentSignal:'Current support unverified',
    past:'The September 2023 statement expected tighter credit conditions to weigh on activity, hiring, and inflation, with an uncertain impact.',
    current:'Credit-channel support remains unverified in the August 2024 source.',
    interpretation:'Mark the path UNVERIFIED and exclude it from current support pending further evidence.',
    pastUrl:'https://www.federalreserve.gov/newsevents/pressreleases/monetary20230920a.htm',
    currentUrl:'https://www.federalreserve.gov/newsevents/speech/powell20240823a.htm',
    currentLink:'Inspect the selected 2024 source ↗'
  }
};

const fedGraph = document.querySelector('#finance-graph');
let fedView = 'history';
let fedFocus = 'inflation';

function renderFedGraph() {
  fedGraph.dataset.view = fedView;
  fedGraph.dataset.focus = fedFocus;
  const current = fedView === 'current';
  Object.entries(fedPaths).forEach(([key,path]) => {
    const applied = current && (fedFocus === 'all' || fedFocus === key);
    const muted = current && fedFocus !== 'all' && fedFocus !== key;
    const edge = fedGraph.querySelector('[data-finance-edge="'+key+'"]');
    const node = fedGraph.querySelector('[data-finance-node="'+key+'"]');
    const label = fedGraph.querySelector('[data-finance-path="'+key+'"]');
    edge.dataset.state = applied ? path.state : 'historical';
    node.dataset.state = applied ? path.state : 'historical';
    label.dataset.state = applied ? path.state : 'historical';
    edge.classList.toggle('is-muted',muted);
    node.classList.toggle('is-muted',muted);
    label.classList.toggle('is-muted',muted);
    fedGraph.querySelector('[data-finance-signal="'+key+'"]').textContent = applied ? path.currentSignal : path.pastSignal;
    fedGraph.querySelector('[data-finance-sign="'+key+'"]').textContent = applied ? path.sign : path.pastSign;
    fedGraph.querySelector('[data-finance-status="'+key+'"]').textContent = applied ? (key === 'inflation' ? 'Preserved' : key === 'labor' ? 'Reversed' : 'Excluded') : 'Historical';
    label.setAttribute('aria-pressed',String(applied));
    document.querySelector('[data-finance-card="'+key+'"]').setAttribute('aria-pressed',String(current && fedFocus === key));
  });
  document.querySelectorAll('[data-finance-view]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.financeView === fedView)));
  document.querySelector('#finance-show-all').setAttribute('aria-pressed',String(current && fedFocus === 'all'));
  document.querySelector('#finance-view-label').textContent = current ? (fedFocus === 'all' ? 'CURRENT STRUCTURE / ALL CHANGES' : 'RECHECKING ONE HISTORICAL PATH') : 'HISTORICAL STRUCTURE / 2023';
  document.querySelector('#finance-balance-note').textContent = current && fedFocus === 'all' ? 'Inflation + labor support retained.' : 'Each path needs current support.';
  document.querySelector('#finance-graph-status').textContent = !current ? '2023 paths. Hover a card to apply the 2024 evidence.' : fedFocus === 'all' ? '2024 structure: inflation preserved, labor contribution reversed, credit unverified.' : 'Rechecked: '+fedPaths[fedFocus].name.toLowerCase()+'. Other paths: 2023 structure.';

  const selected = fedPaths[fedFocus === 'all' ? 'credit' : fedFocus];
  document.querySelector('#finance-inspector').dataset.state = current ? selected.state : 'historical';
  document.querySelector('#finance-inspector-badge').textContent = current ? selected.badge : selected.name.toUpperCase()+' / HISTORICAL PATH';
  document.querySelector('#finance-inspector-title').textContent = current ? selected.title : 'Past path: '+selected.name.toLowerCase();
  document.querySelector('#finance-past-evidence').textContent = selected.past;
  document.querySelector('#finance-current-evidence').textContent = selected.current;
  document.querySelector('#finance-past-source').href = selected.pastUrl;
  document.querySelector('#finance-current-source').href = selected.currentUrl;
  document.querySelector('#finance-current-source').textContent = selected.currentLink;
  document.querySelector('#finance-interpretation').textContent = current ? selected.interpretation : 'Use the 2024 evidence to assess this historical path.';
}

function inspectFedPath(key) {
  if(fedView === 'current' && fedFocus === key) return;
  fedView = 'current';
  fedFocus = key;
  document.querySelector('[data-stage="2"]').click();
  renderFedGraph();
}

document.querySelectorAll('[data-finance-path],[data-finance-card],[data-finance-hover]').forEach(control => {
  const key = control.dataset.financePath || control.dataset.financeCard || control.dataset.financeHover;
  const inspect = () => inspectFedPath(key);
  control.addEventListener('pointerenter',event => { if(event.pointerType === 'mouse') inspect(); });
  if(!control.hasAttribute('data-finance-hover')) {
    control.addEventListener('click',inspect);
    control.addEventListener('focus',inspect);
  }
});

document.querySelectorAll('[data-finance-view]').forEach(button => button.addEventListener('click',() => {
  fedView = button.dataset.financeView;
  renderFedGraph();
}));
document.querySelector('#finance-show-all').addEventListener('click',() => {
  fedView = 'current';
  fedFocus = 'all';
  renderFedGraph();
});
document.addEventListener('reform:stage',event => {
  fedView = event.detail === 0 ? 'history' : 'current';
  if(event.detail === 3) fedFocus = 'all';
  else if(fedFocus === 'all') fedFocus = 'inflation';
  renderFedGraph();
});
renderFedGraph();
