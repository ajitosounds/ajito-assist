(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const els = {};
  let data, faqs = [], lang = 'ja';
  let diagnosticStep = 0;
  const diagnosticSteps = [
    {ja:'どの環境で音が出ませんか？',en:'Where is there no sound?',options:[['DAWプラグイン','daw'],['Standalone','standalone']]},
    {ja:'画面上のパッドをクリックすると音は出ますか？',en:'Do the on-screen pads produce sound?',options:[['はい','yes'],['いいえ','no']]},
    {ja:'MIDI入力メーターは反応していますか？',en:'Does the MIDI input meter respond?',options:[['はい','yes'],['いいえ','no']]}
  ];
  const t = (ja,en) => lang === 'ja' ? ja : en;
  const esc = v => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const chapter = f => Number(f.chapter) || null;
  const page = f => lang === 'ja' ? f.manual_page_ja : f.manual_page_en;

  function init(){
    data = window.AJITO_DATA; faqs = data.faq || [];
    ['hero','workspace','browse','diagnostic','conversation','searchForm','searchInput','suggestions','faqCount','coverageText','browseButton','diagnosticButton','languageButton','homeLink','backButton','closeBrowse','closeDiagnostic','browseSearch','categorySelect','faqGrid','diagnosticCard','heroTitle','heroCopy','searchSubmit','browseTitle','diagnosticTitle'].forEach(id=>els[id]=$(`#${id}`));
    bind(); fillCategories(); renderSuggestions(); applyLanguage(); els.faqCount.textContent=faqs.length;
  }
  function bind(){
    els.searchForm.addEventListener('submit',e=>{e.preventDefault();const q=els.searchInput.value.trim();if(q) ask(q)});
    els.homeLink.onclick=e=>{e.preventDefault();show('hero')}; els.backButton.onclick=()=>show('hero');
    els.browseButton.onclick=()=>{show('browse');renderFAQGrid()}; els.closeBrowse.onclick=()=>show('hero');
    els.diagnosticButton.onclick=()=>{diagnosticStep=0;show('diagnostic');renderDiagnostic()}; els.closeDiagnostic.onclick=()=>show('hero');
    els.languageButton.onclick=()=>{lang=lang==='ja'?'en':'ja';applyLanguage();renderSuggestions();fillCategories();if(!els.browse.classList.contains('hidden'))renderFAQGrid()};
    els.browseSearch.oninput=renderFAQGrid; els.categorySelect.onchange=renderFAQGrid;
  }
  function show(name){['hero','workspace','browse','diagnostic'].forEach(x=>els[x].classList.toggle('hidden',x!==name));window.scrollTo({top:0,behavior:'smooth'})}
  function applyLanguage(){
    document.documentElement.lang=lang; els.languageButton.textContent=lang==='ja'?'JA':'EN';
    els.heroTitle.textContent=t('音楽の流れを、止めない。','Keep the music flowing.');
    els.heroCopy.textContent=t('Groove Activatorについて、普段の言葉で質問してください。回答から公式マニュアルまで、ひとつの流れで案内します。','Ask about Groove Activator in your own words. Get a clear answer and the exact official manual reference in one flow.');
    els.searchInput.placeholder=t('例：Logicでプラグインが見つからない','Example: Logic cannot find the plug-in'); els.searchSubmit.textContent=t('質問する','Ask');
    els.browseButton.textContent='FAQ'; els.diagnosticButton.textContent=t('診断','Diagnostics'); els.browseTitle.textContent=t('FAQを探す','Browse FAQs'); els.diagnosticTitle.textContent=t('音が出ないときの診断','No-sound diagnostic');
    els.browseSearch.placeholder=t('FAQを絞り込む','Filter FAQs'); els.coverageText.textContent=t('27章を網羅','27 chapters covered');
  }
  function renderSuggestions(){
    const arr=lang==='ja'?['Slice Activatorとは？','キットをバックアップしたい','Logicでプラグインが見つからない','ピッチの変更範囲は？']:['What is Slice Activator?','How do I back up a kit?','Logic cannot find the plug-in','What is the pitch range?'];
    els.suggestions.innerHTML='';arr.forEach(q=>{const b=document.createElement('button');b.textContent=q;b.onclick=()=>ask(q);els.suggestions.appendChild(b)})
  }
  function fillCategories(){
    const current=els.categorySelect.value;els.categorySelect.innerHTML=`<option value="">${t('すべてのカテゴリー','All categories')}</option>`;
    [...new Set(faqs.map(f=>f.category))].sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;els.categorySelect.appendChild(o)});els.categorySelect.value=current;
  }
  function search(query){
    if(window.AJITOSearch){const r=window.AJITOSearch.search(faqs,query,lang,8);if(r.length)return r}
    const q=query.toLowerCase();return faqs.map(f=>({faq:f,score:[f.q_ja,f.q_en,f.a_ja,f.a_en,...(f.keywords||[])].join(' ').toLowerCase().includes(q)?10:0})).filter(x=>x.score).slice(0,8)
  }
  function ask(query){
    const results=search(query);show('workspace');els.conversation.innerHTML='';addUser(query);
    if(!results.length){addEmpty();return}
    addAnswer(results[0].faq,results[0].score,results.slice(1,4).map(x=>x.faq));
  }
  function addUser(query){els.conversation.insertAdjacentHTML('beforeend',`<div class="message user"><div class="bubble">${esc(query)}</div></div>`)}
  function addEmpty(){els.conversation.insertAdjacentHTML('beforeend',`<div class="message"><div class="avatar">A</div><div class="bubble"><div class="answer-title">${t('確実な回答を特定できませんでした','I could not identify a reliable answer')}</div>${t('言葉を少し変えるか、FAQ一覧または診断をお試しください。','Try different wording, browse the FAQ, or start Diagnostics.')}</div></div>`)}
  function addAnswer(f,score,related){
    const ch=chapter(f),pg=page(f),answer=lang==='ja'?f.a_ja:f.a_en,question=lang==='ja'?f.q_ja:f.q_en;
    const confidence=Math.min(99,Math.max(72,Math.round(70+score/4)));
    els.conversation.insertAdjacentHTML('beforeend',`
      <div class="message"><div class="avatar">A</div><div class="bubble"><div class="answer-title">${esc(question)}</div><div class="answer-meta"><span class="pill">${esc(f.category)}</span><span class="pill">${esc(f.id)}</span><span class="pill confidence">● ${confidence}% match</span></div><div>${esc(answer)}</div></div></div>
      <div class="support-stack">
        <details class="support-card" open><summary><span>📖 ${t('公式マニュアル','Official Manual')}</span><b>⌄</b></summary><div class="support-card-body">${ch?t(`第${ch}章・${pg||'-'}ページ`,`Chapter ${ch} · Page ${pg||'-'}`):t('関連ページを編集中','Reference under review')}<div class="manual-actions">${ch&&pg?`<button class="primary-action open-fullscreen-pdf" data-lang="${lang}" data-page="${pg}" data-chapter="${ch}">${t('このページを開く','Open this page')}</button>`:''}<button class="secondary-action open-fullscreen-pdf" data-lang="${lang}" data-page="1" data-chapter="1">${t('マニュアル全体','Full manual')}</button></div></div></details>
        <details class="support-card"><summary><span>🎥 ${t('動画','Video')}</span><b>⌄</b></summary><div class="support-card-body">${t('この項目に関連する公式動画は、現在準備中です。','An official video for this topic is being prepared.')}</div></details>
        <details class="support-card"><summary><span>💡 Gota’s Tips</span><b>⌄</b></summary><div class="support-card-body">${t('公式マニュアル外の制作ヒントは、確認済みのものだけここに表示します。','Only verified production tips outside the manual will appear here.')}</div></details>
        <details class="support-card"><summary><span>↗ ${t('関連FAQ','Related FAQs')}</span><b>⌄</b></summary><div class="support-card-body"><div class="related-list">${related.length?related.map(r=>`<button data-question="${esc(lang==='ja'?r.q_ja:r.q_en)}">${esc(lang==='ja'?r.q_ja:r.q_en)}</button>`).join(''):t('関連FAQはありません。','No related FAQs found.')}</div></div></details>
      </div><div class="feedback-row"><span class="feedback-note">${t('この回答は役に立ちましたか？','Was this answer useful?')}</span><button data-feedback="yes">👍</button><button data-feedback="no">👎</button></div>`);
    els.conversation.querySelectorAll('[data-question]').forEach(b=>b.onclick=()=>ask(b.dataset.question));
    els.conversation.querySelectorAll('[data-feedback]').forEach(b=>b.onclick=()=>{b.parentElement.innerHTML=`<span class="feedback-note">${t('ありがとうございます。','Thank you.')}</span>`});
  }
  function renderFAQGrid(){
    const q=els.browseSearch.value.trim().toLowerCase(),cat=els.categorySelect.value;
    const pool=faqs.filter(f=>(!cat||f.category===cat)&&(!q||[f.q_ja,f.q_en,f.a_ja,f.a_en,...(f.keywords||[])].join(' ').toLowerCase().includes(q)));
    els.faqGrid.innerHTML=pool.map(f=>`<button class="faq-card" data-id="${f.id}"><small>${esc(f.category)} · ${esc(f.id)}</small>${esc(lang==='ja'?f.q_ja:f.q_en)}<span>${chapter(f)?`Ch.${chapter(f)}`:'Editorial review'}</span></button>`).join('');
    els.faqGrid.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const f=faqs.find(x=>x.id===b.dataset.id);ask(lang==='ja'?f.q_ja:f.q_en)})
  }
  function renderDiagnostic(){
    const step=diagnosticSteps[Math.min(diagnosticStep,diagnosticSteps.length-1)];
    if(diagnosticStep>=diagnosticSteps.length){els.diagnosticCard.innerHTML=`<div class="diagnostic-progress">RESULT</div><h3>${t('確認するポイント','Things to check')}</h3><p>${t('Audio Device、Output、MIDI入力ポート、MIDIチャンネル、プリセット、マスター音量を順番に確認してください。','Check Audio Device, Output, MIDI input port, MIDI channel, preset, and master volume in that order.')}</p><div class="diagnostic-options"><button class="primary-action" id="diagManual">${t('トラブルシューティングを開く','Open troubleshooting')}</button><button class="diagnostic-option" id="diagRestart">${t('最初から','Restart')}</button></div>`;$('#diagManual').onclick=()=>ask(t('音が出ません','There is no sound'));$('#diagRestart').onclick=()=>{diagnosticStep=0;renderDiagnostic()};return}
    els.diagnosticCard.innerHTML=`<div class="diagnostic-progress">STEP ${diagnosticStep+1} / ${diagnosticSteps.length}</div><h3>${t(step.ja,step.en)}</h3><p>${t('原因を切り分けるための確認です。','This check narrows down the cause.')}</p><div class="diagnostic-options"></div>`;
    const holder=els.diagnosticCard.querySelector('.diagnostic-options');step.options.forEach(([label])=>{const b=document.createElement('button');b.className='diagnostic-option';b.textContent=label;b.onclick=()=>{diagnosticStep++;renderDiagnostic()};holder.appendChild(b)})
  }
  if(document.documentElement.dataset.ajitoDataReady==='true')init();else window.addEventListener('ajito-data-ready',init,{once:true});
})();
