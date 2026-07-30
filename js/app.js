(() => {
  "use strict";
  function startAJITOAssist(){

const faqs = (window.AJITO_DATA.faq || []).map(item => ({...item}));
const chapters={"1": "Welcome from Gota", "2": "What is Groove Activator", "3": "System Requirements", "4": "Installation", "5": "License Activation", "6": "First Launch & Quick Start", "7": "Interface Overview", "8": "Pad System", "9": "Sample Editing", "10": "Velocity Layers", "11": "Variations", "12": "Mixer", "13": "Analog Activator", "14": "Slice Activator", "15": "Instant Activator", "16": "Pitch Bend", "17": "Hi-Hat & Pad Settings", "18": "MIDI LEARN", "19": "Keyboard Shortcuts", "20": "Presets & Kit Management", "21": "Multi-Output Routing", "22": "Recording & Bouncing", "23": "Backup & Recovery", "24": "Troubleshooting", "25": "Credits", "26": "About AJITO SOUNDS", "27": "Legal & Credits"}; let lang='ja';
const chat=document.getElementById('chat'), q=document.getElementById('q'), cat=document.getElementById('category');
const STORAGE_KEYS={
 unresolved:'ga_unresolved_v1',
 feedback:'ga_feedback_v1',
 learned:'ga_learned_faqs_v1'
};
function loadStore(key,fallback=[]){
 try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}
 catch(e){return fallback}
}
function saveStore(key,value){localStorage.setItem(key,JSON.stringify(value))}
let unresolved=loadStore(STORAGE_KEYS.unresolved);
let feedbackLog=loadStore(STORAGE_KEYS.feedback);
let learnedFaqs=loadStore(STORAGE_KEYS.learned);
learnedFaqs.forEach(f=>faqs.push(f));


// AJITO Assist Media Router
// Default policy: official manual visuals first. Video is used only where change over time or sound must be demonstrated.
const embeddedManualPages={"ja":{"3":"./manual-pages/ja/page-03.jpg","4":"./manual-pages/ja/page-04.jpg","5":"./manual-pages/ja/page-05.jpg","6":"./manual-pages/ja/page-06.jpg","7":"./manual-pages/ja/page-07.jpg","8":"./manual-pages/ja/page-08.jpg","9":"./manual-pages/ja/page-09.jpg","10":"./manual-pages/ja/page-10.jpg","11":"./manual-pages/ja/page-11.jpg","12":"./manual-pages/ja/page-12.jpg","13":"./manual-pages/ja/page-13.jpg","14":"./manual-pages/ja/page-14.jpg","15":"./manual-pages/ja/page-15.jpg","16":"./manual-pages/ja/page-16.jpg","17":"./manual-pages/ja/page-17.jpg","18":"./manual-pages/ja/page-18.jpg","19":"./manual-pages/ja/page-19.jpg","20":"./manual-pages/ja/page-20.jpg","21":"./manual-pages/ja/page-21.jpg","22":"./manual-pages/ja/page-22.jpg","23":"./manual-pages/ja/page-23.jpg","24":"./manual-pages/ja/page-24.jpg","25":"./manual-pages/ja/page-25.jpg","26":"./manual-pages/ja/page-26.jpg","27":"./manual-pages/ja/page-27.jpg","28":"./manual-pages/ja/page-28.jpg","29":"./manual-pages/ja/page-29.jpg","30":"./manual-pages/ja/page-30.jpg","31":"./manual-pages/ja/page-31.jpg","32":"./manual-pages/ja/page-32.jpg","33":"./manual-pages/ja/page-33.jpg","34":"./manual-pages/ja/page-34.jpg","35":"./manual-pages/ja/page-35.jpg","36":"./manual-pages/ja/page-36.jpg","37":"./manual-pages/ja/page-37.jpg","38":"./manual-pages/ja/page-38.jpg","39":"./manual-pages/ja/page-39.jpg","40":"./manual-pages/ja/page-40.jpg","41":"./manual-pages/ja/page-41.jpg","42":"./manual-pages/ja/page-42.jpg","43":"./manual-pages/ja/page-43.jpg"},"en":{"3":"./manual-pages/en/page-03.jpg","4":"./manual-pages/en/page-04.jpg","5":"./manual-pages/en/page-05.jpg","6":"./manual-pages/en/page-06.jpg","7":"./manual-pages/en/page-07.jpg","8":"./manual-pages/en/page-08.jpg","9":"./manual-pages/en/page-09.jpg","10":"./manual-pages/en/page-10.jpg","11":"./manual-pages/en/page-11.jpg","12":"./manual-pages/en/page-12.jpg","13":"./manual-pages/en/page-13.jpg","14":"./manual-pages/en/page-14.jpg","15":"./manual-pages/en/page-15.jpg","16":"./manual-pages/en/page-16.jpg","17":"./manual-pages/en/page-17.jpg","18":"./manual-pages/en/page-18.jpg","19":"./manual-pages/en/page-19.jpg","20":"./manual-pages/en/page-20.jpg","21":"./manual-pages/en/page-21.jpg","22":"./manual-pages/en/page-22.jpg","23":"./manual-pages/en/page-23.jpg","24":"./manual-pages/en/page-24.jpg","25":"./manual-pages/en/page-25.jpg","26":"./manual-pages/en/page-26.jpg","27":"./manual-pages/en/page-27.jpg","28":"./manual-pages/en/page-28.jpg","29":"./manual-pages/en/page-29.jpg","30":"./manual-pages/en/page-30.jpg","31":"./manual-pages/en/page-31.jpg","32":"./manual-pages/en/page-32.jpg","33":"./manual-pages/en/page-33.jpg","34":"./manual-pages/en/page-34.jpg","35":"./manual-pages/en/page-35.jpg","36":"./manual-pages/en/page-36.jpg","37":"./manual-pages/en/page-37.jpg","38":"./manual-pages/en/page-38.jpg","39":"./manual-pages/en/page-39.jpg","40":"./manual-pages/en/page-40.jpg","41":"./manual-pages/en/page-41.jpg","42":"./manual-pages/en/page-42.jpg","43":"./manual-pages/en/page-43.jpg","44":"./manual-pages/en/page-44.jpg"}};
const embeddedChapterPages={"ja":{"1":[3],"2":[4],"3":[5],"4":[5,6,7,8,9],"5":[10,11],"6":[12],"7":[13,14,15],"8":[16,17],"9":[18,19],"10":[20,21],"11":[22],"12":[22,23,24],"13":[25,26],"14":[27,28],"15":[29,30],"16":[31],"17":[31,32],"18":[33],"19":[34,35],"20":[36,37],"21":[38],"22":[39],"23":[40],"24":[41],"25":[41],"26":[42],"27":[43]},"en":{"1":[3],"2":[4],"3":[5],"4":[5,6,7,8,9],"5":[10,11],"6":[12],"7":[13,14,15],"8":[16,17],"9":[18,19],"10":[20,21],"11":[22],"12":[22,23,24],"13":[25,26],"14":[27,28],"15":[29,30],"16":[31],"17":[31,32],"18":[33],"19":[33,34,35],"20":[36,37],"21":[38],"22":[39],"23":[40,41],"24":[42],"25":[42],"26":[43],"27":[44]}};
const ORIGINAL_MANUAL_PDF={
 ja:'./manual-pdf/GrooveActivator_UserManual_v1.0.2_QueenEdition_JP.pdf',
 en:'./manual-pdf/GrooveActivator_UserManual_v1.0.2_QueenEdition_EN.pdf'
};

const MANUAL_PDF_FILE='GrooveActivator_Manual_v1.0.2_QueenEdition_JP.pdf';
const chapterPages={1:3,2:4,3:5,4:5,5:10,6:12,7:13,8:16,9:18,10:20,11:22,12:22,13:25,14:27,15:29,16:31,17:31,18:33,19:34,20:36,21:38,22:39,23:40,24:41,25:41,26:42,27:43};
const mediaRegistry={
 default:{type:'screenshot',label_ja:'マニュアル画像',label_en:'Manual visual'},
 'VIS':{type:'video',label_ja:'動画推奨',label_en:'Video recommended',reason_ja:'音と画面の変化を同時に確認する機能のため、動画が最も伝わります。'},
 'Instant Activator':{type:'both',label_ja:'画像＋動画候補',label_en:'Visual + video candidate',reason_ja:'操作場所はマニュアル画像、音の変化は動画が適しています。'},
 'Installation':{type:'screenshot',label_ja:'スクリーンショット',label_en:'Screenshots'},
 'License Activation':{type:'screenshot',label_ja:'スクリーンショット',label_en:'Screenshots'},
 'Backup & Recovery':{type:'screenshot',label_ja:'スクリーンショット',label_en:'Screenshots'},
 'Presets & Kit Management':{type:'screenshot',label_ja:'スクリーンショット',label_en:'Screenshots'},
 'Multi-Output Routing':{type:'screenshot',label_ja:'スクリーンショット',label_en:'Screenshots'}
};

function mediaForFaq(f){
 const title=chapters[String(inferChapter(f))]||'';
 const hay=[f.id,f.category,f.q_ja,f.q_en,f.a_ja,f.a_en,title].join(' ');
 if(/\bVIS\b/i.test(hay))return mediaRegistry.VIS;
 if(/Instant Activator|インスタント[・ ]?アクティベーター/i.test(hay))return mediaRegistry['Instant Activator'];
 return mediaRegistry[title]||mediaRegistry.default;
}
function mediaTypeLabel(media){
 const icon=media.type==='video'?'🎥':media.type==='both'?'📄🎥':'📄';
 return `${icon} ${lang==='ja'?media.label_ja:media.label_en}`;
}
function manualPagesForChapter(chapter){
 const code=lang==='en'?'en':'ja';
 return (embeddedChapterPages[code][String(chapter)]||[]).map(page=>({page,src:embeddedManualPages[code][String(page)]})).filter(x=>x.src);
}
const manualImageLightbox=document.getElementById('manualImageLightbox');
const manualImageLarge=document.getElementById('manualImageLarge');
const manualImageCaption=document.getElementById('manualImageCaption');
const manualImageClose=document.getElementById('manualImageClose');

function openManualImage(src,page){
 const code=lang==='en'?'EN':'JP';
 if(!manualImageLightbox||!manualImageLarge||!manualImageCaption)return;
 manualImageLarge.src=src;
 manualImageLarge.alt=`${code} Manual page ${page}`;
 manualImageCaption.textContent=`${code} Manual · Page ${page}`;
 manualImageLightbox.classList.add('open');
 manualImageLightbox.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 requestAnimationFrame(()=>manualImageClose?.focus());
}
function closeManualImage(){
 if(!manualImageLightbox||!manualImageLarge)return;
 manualImageLightbox.classList.remove('open');
 manualImageLightbox.setAttribute('aria-hidden','true');
 manualImageLarge.removeAttribute('src');
 document.body.style.overflow='';
}
function manualGalleryHtml(chapter){
 const code=lang==='en'?'en':'ja';
 const pages=embeddedChapterPages[code][String(chapter)]||[];
 const page=pages[0]||1;
 const label=lang==='ja'?'日本語公式マニュアル':'Official English Manual';
 return `<div class="manual-pdf-launch">
   <div>
     <strong>📖 ${label}</strong>
     <span>${lang==='ja'?`第${chapter}章・${page}ページから開きます`:`Chapter ${chapter}, starting at page ${page}`}</span>
   </div>
   <button type="button" class="open-fullscreen-pdf" data-lang="${code}" data-page="${page}" data-chapter="${chapter}">
     ${lang==='ja'?'全画面で読む':'Read full screen'}
   </button>
 </div>`;
}
function mediaPanelForChapter(chapter,entries=[]){
 const title=chapters[String(chapter)]||'';
 let media=mediaRegistry[title]||mediaRegistry.default;
 const hay=entries.map(f=>[f.q_ja,f.q_en,f.a_ja,f.a_en].join(' ')).join(' ');
 if(/\bVIS\b/i.test(hay))media=mediaRegistry.VIS;
 else if(/Instant Activator|インスタント[・ ]?アクティベーター/i.test(hay))media=mediaRegistry['Instant Activator'];
 const cls=media.type;
 let html=`<section class="media-strip"><div class="media-head"><strong>${lang==='ja'?'メディア案内':'Media guide'}</strong><span class="media-type ${cls}">${mediaTypeLabel(media)}</span></div>`;
 if(media.type==='screenshot'||media.type==='both')html+=manualGalleryHtml(chapter);
 if(media.type==='video'||media.type==='both'){
  html+=`<div class="video-candidate"><strong>🎥 ${lang==='ja'?'動画候補':'Video candidate'}</strong><div>${esc(lang==='ja'?(media.reason_ja||'変化を見せるため動画が適しています。'):'A video is recommended where motion or sound change must be demonstrated.')}</div><div class="media-note">${lang==='ja'?'承認済み動画を登録した時点で、この枠をプレーヤーへ差し替えます。':'This slot becomes a player after an approved video is registered.'}</div></div>`;
 }
 return html+'</section>';
}
function answerMediaHtml(f){
 const ch=inferChapter(f);if(!ch)return'';
 const media=mediaForFaq(f);
 const title=chapters[String(ch)]||'';
 let inline='';
 if(media.type==='screenshot'||media.type==='both'){
   inline=`<div class="inline-manual-head"><strong>📖 ${lang==='ja'?`公式マニュアル 第${ch}章`:`Official Manual Chapter ${ch}`}</strong><span>${esc(title)}</span></div>${manualGalleryHtml(ch)}`;
 }
 if(media.type==='video'||media.type==='both'){
   inline+=`<div class="video-candidate"><strong>🎥 ${lang==='ja'?'動画ガイド候補':'Video guide candidate'}</strong><div>${esc(lang==='ja'?(media.reason_ja||'動きや音の変化を示す項目には動画を使用します。'):'Video is used where motion or sound change must be demonstrated.')}</div></div>`;
 }
 return `<div class="answer-media">${inline}<div class="inline-manual-actions"><button class="manual-link" data-manual-chapter="${ch}">${lang==='ja'?`第${ch}章のFAQと詳細を見る`:`View Chapter ${ch} FAQs and details`}</button></div></div>`;
}
const diagnosticFlows={
 sound_no_output:{title_ja:'音が出ない',title_en:'No Sound',start:'env',nodes:{
  env:{type:'choice',q_ja:'どの環境で音が出ませんか？',q_en:'Where are you getting no sound?',reason_ja:'DAWごとに確認するプラグイン形式と設定が異なるためです。',choices:[['Logic Pro','logic_visible'],['Cubase','generic_visible'],['Ableton Live','generic_visible'],['Studio One','generic_visible'],['Pro Tools','generic_visible'],['Reaper','generic_visible'],['Standalone','standalone_device']]},
  logic_visible:{type:'yesno',q_ja:'Logic Proのソフトウェア音源スロットにGroove Activatorは表示されていますか？',q_en:'Is Groove Activator visible in Logic Pro?',reason_ja:'表示されない場合は、音の問題より先にAUのインストールと認識を確認します。',yes:'logic_output',no:'logic_visible_fix'},
  logic_visible_fix:{type:'solution',title_ja:'AUの認識を確認します',body_ja:'AUコンポーネントのインストール、Logic Proの再起動、プラグインマネージャでの検証状態を確認してください。',manual:'Installation / Logic Pro / Troubleshooting',tip_ja:'Gota’s Tip：Logic Proを完全終了して再起動し、それでも表示されなければプラグインマネージャを確認します。'},
  logic_output:{type:'yesno',q_ja:'マスターフェーダーは上がっていて、ミュート／ソロの状態も正常ですか？',q_en:'Is the master fader up and are mute/solo states correct?',reason_ja:'出力段で音が止められていないかを切り分けます。',yes:'logic_trigger_method',no:'logic_output_fix'},
  logic_output_fix:{type:'solution',title_ja:'出力状態を戻します',body_ja:'マスターフェーダーを上げ、不要なミュートを解除し、Groove Activatorのトラックが聞こえる状態に戻してください。',manual:'Audio Output / Troubleshooting'},
  logic_trigger_method:{type:'choice',q_ja:'何でGroove Activatorを操作していますか？',q_en:'How are you triggering Groove Activator?',reason_ja:'操作方法によって確認する場所が異なります。',choices:[['MIDIキーボード','logic_midi'],['画面上のパッド／マウス','logic_meter'],['MIDIリージョン','logic_region']]},
  logic_midi:{type:'yesno',q_ja:'MIDIキーボードを弾くと、Logic ProのMIDI入力またはトラックメーターは反応しますか？',q_en:'Does Logic Pro show MIDI or meter activity?',reason_ja:'MIDI信号がLogic Proまで届いているかを確認します。',yes:'logic_meter',no:'logic_midi_fix'},
  logic_midi_fix:{type:'solution',title_ja:'MIDI入力を確認します',body_ja:'MIDIキーボードの電源と接続、Logic ProのMIDI入力、対象トラックの選択、入力ポートを確認してください。',manual:'MIDI / Logic Pro / Troubleshooting',tip_ja:'Gota’s Tip：別のソフト音源を同じキーボードで鳴らせるか試すと、原因を早く切り分けられます。'},
  logic_region:{type:'yesno',q_ja:'MIDIリージョン再生中に、トラックまたはGroove Activator内のメーターは反応しますか？',q_en:'Do meters react during MIDI region playback?',reason_ja:'MIDIイベントがGroove Activatorまで届いているかを確認します。',yes:'logic_meter',no:'logic_region_fix'},
  logic_region_fix:{type:'solution',title_ja:'MIDIリージョンを確認します',body_ja:'リージョンがGroove Activatorを挿したトラック上にあるか、ノート範囲とトラック割り当てを確認してください。',manual:'MIDI / Logic Pro'},
  logic_meter:{type:'yesno',q_ja:'Groove Activator内のメーターやパッドは反応していますか？',q_en:'Do Groove Activator’s internal meters or pads react?',reason_ja:'MIDI入力と音声出力のどちらに問題があるかを分けます。',yes:'logic_preset',no:'logic_trigger_fix'},
  logic_trigger_fix:{type:'solution',title_ja:'トリガー入力を確認します',body_ja:'使用ノート、トリガーパッド、MIDIチャンネル、選択トラックを確認し、画面上のパッドもクリックしてください。',manual:'MIDI / Trigger Pad / Troubleshooting'},
  logic_preset:{type:'yesno',q_ja:'別のプリセットを一度読み込み、その後で使いたいプリセットに戻すと音は出ますか？',q_en:'Does loading another preset and returning restore sound?',reason_ja:'プリセット状態の再読み込みで復旧するかを確認します。',yes:'logic_preset_ok',no:'logic_other'},
  logic_preset_ok:{type:'solution',title_ja:'プリセット再読み込みで復旧しました',body_ja:'現在のセッションでは音が復旧しています。再発する場合は、使用プリセット名と再現手順を記録してください。',manual:'Preset / Troubleshooting',tip_ja:'Gota’s Tip：別プリセットを読み込んで戻すと、内部状態が再初期化される場合があります。'},
  logic_other:{type:'yesno',q_ja:'同じLogic Proプロジェクトで、ほかのソフト音源は鳴りますか？',q_en:'Do other software instruments play in the same project?',reason_ja:'Logic Pro全体の問題か、Groove Activator固有の問題かを切り分けます。',yes:'logic_specific',no:'logic_global'},
  logic_global:{type:'solution',title_ja:'Logic Pro全体のオーディオ設定を確認します',body_ja:'オーディオ出力デバイス、I/O設定、サンプルレート、Core Audioの状態を確認してください。',manual:'Logic Pro Audio Settings / Troubleshooting'},
  logic_specific:{type:'solution',title_ja:'Groove Activator固有の状態を確認します',body_ja:'出力、プリセット、MIDIチャンネル、トリガー設定を再確認し、必要なら新規トラックへ挿し直してください。',manual:'Groove Activator / Logic Pro / Troubleshooting',tip_ja:'Gota’s Tip：新規トラックに新しいGroove Activatorを挿し、初期状態で鳴るか試すと切り分けが早いです。'},
  generic_visible:{type:'yesno',q_ja:'DAWのインストゥルメント一覧にGroove Activatorは表示されていますか？',q_en:'Is Groove Activator visible in the DAW instrument list?',reason_ja:'まずプラグインのインストールと認識を確認します。',yes:'generic_basic',no:'generic_fix'},
  generic_fix:{type:'solution',title_ja:'プラグインの認識を確認します',body_ja:'Cubase・Ableton Live・Studio One・Reaperでは通常VST3、Pro ToolsではAAXを確認し、DAWの再スキャンを実行してください。',manual:'Installation / DAW Setup / Troubleshooting'},
  generic_basic:{type:'solution',title_ja:'基本信号経路を確認します',body_ja:'ミュート／ソロ、マスターフェーダー、MIDI入力、内部メーター、別プリセット、ほかのソフト音源の順に確認してください。',manual:'DAW Troubleshooting',tip_ja:'このDAW専用フローは、豪太さんの確認を受けながら詳細化します。'},
  standalone_device:{type:'yesno',q_ja:'StandaloneのAudio DeviceとOutputは、実際に使う機器へ設定されていますか？',q_en:'Are Standalone Audio Device and Output set correctly?',reason_ja:'Standaloneではアプリ自身のオーディオ設定が音の出口を決めます。',yes:'standalone_pad',no:'standalone_fix'},
  standalone_fix:{type:'solution',title_ja:'Standaloneの出力先を設定します',body_ja:'Audio DeviceとOutputを使用中の機器へ設定し、サンプルレートとバッファも確認してください。',manual:'Standalone / Audio Settings'},
  standalone_pad:{type:'yesno',q_ja:'画面上のパッドをクリックすると音は出ますか？',q_en:'Do on-screen pads produce sound?',reason_ja:'MIDI入力の問題か、オーディオ出力の問題かを分けます。',yes:'standalone_midi_fix',no:'standalone_audio_fix'},
  standalone_midi_fix:{type:'solution',title_ja:'MIDI入力側を確認します',body_ja:'MIDI Device、入力ポート、MIDIチャンネル、キーボード接続を確認してください。',manual:'Standalone / MIDI Settings'},
  standalone_audio_fix:{type:'solution',title_ja:'Standaloneの音声出力を再確認します',body_ja:'Audio Device、Output、サンプルレート、マスター音量、プリセットを順に確認してください。',manual:'Standalone / Audio / Troubleshooting'}
 }}
};
let diagnosticState=null;
function diagnosticStart(){diagnosticState={flowId:'sound_no_output',nodeId:'env',history:[],started_at:nowISO()};chat.innerHTML='';add('<span class="badge">Diagnostic Engine</span><br>'+(lang==='ja'?'音が出ない診断':'No Sound Diagnostic'));renderDiagnosticNode()}
function renderDiagnosticNode(){
 const flow=diagnosticFlows[diagnosticState.flowId],node=flow.nodes[diagnosticState.nodeId];
 const card=document.createElement('div');card.className='diag-card';
 const prog=document.createElement('div');prog.className='diag-progress';prog.textContent=(lang==='ja'?'診断ステップ ':'Diagnostic step ')+(diagnosticState.history.length+1);card.appendChild(prog);
 if(node.type==='solution'){
  const h=document.createElement('h3');h.textContent=node.title_ja||node.title_en;
  const b=document.createElement('div');b.className='solution';b.textContent=lang==='ja'?node.body_ja:(node.body_en||node.body_ja);card.append(h,b);
  if(node.manual){const m=document.createElement('div');m.className='manual-ref';m.textContent=(lang==='ja'?'📖 マニュアル参照：':'📖 Manual reference: ')+node.manual;card.appendChild(m)}
  if(node.tip_ja&&lang==='ja'){const t=document.createElement('div');t.className='tip';t.textContent=node.tip_ja;card.appendChild(t)}
  const a=document.createElement('div');a.className='diag-actions';
  [['👍 '+(lang==='ja'?'解決した':'Solved'),'up'],['👎 '+(lang==='ja'?'解決しなかった':'Not solved'),'down']].forEach(([lab,val])=>{const x=document.createElement('button');x.textContent=lab;x.onclick=()=>{if(val==='up')saveFeedback('Diagnostic: no sound',{id:'DIAG-NO-SOUND',a_ja:node.body_ja,a_en:node.body_en||node.body_ja},'up');else saveUnresolved('Diagnostic unresolved: no sound','diagnostic_unresolved','DIAG-NO-SOUND');x.disabled=true};a.appendChild(x)});
  const r=document.createElement('button');r.textContent=lang==='ja'?'最初から':'Restart';r.onclick=diagnosticStart;a.appendChild(r);card.appendChild(a);chat.appendChild(card);return;
 }
 const h=document.createElement('h3');h.textContent=lang==='ja'?node.q_ja:node.q_en;card.appendChild(h);
 if(node.reason_ja){const rr=document.createElement('div');rr.className='diag-reason';rr.textContent=(lang==='ja'?'確認する理由：':'Why: ')+node.reason_ja;card.appendChild(rr)}
 const a=document.createElement('div');a.className='diag-actions';
 const go=(label,next)=>{diagnosticState.history.push({nodeId:diagnosticState.nodeId,answer:label,at:nowISO()});diagnosticState.nodeId=next;chat.appendChild(card);renderDiagnosticNode()};
 if(node.type==='yesno'){[['はい','Yes',node.yes],['いいえ','No',node.no]].forEach(v=>{const b=document.createElement('button');b.textContent=lang==='ja'?v[0]:v[1];b.onclick=()=>go(b.textContent,v[2]);a.appendChild(b)})}
 else node.choices.forEach(c=>{const b=document.createElement('button');b.textContent=c[0];b.onclick=()=>go(b.textContent,c[1]);a.appendChild(b)});
 const exit=document.createElement('button');exit.textContent=lang==='ja'?'診断を終了':'Exit';exit.onclick=welcome;a.appendChild(exit);card.appendChild(a);chat.appendChild(card);card.scrollIntoView({behavior:'smooth',block:'end'});
}

function nowISO(){return new Date().toISOString()}
function updateLearningStatus(){
 const pending=unresolved.filter(x=>x.status==='pending').length;
 const learned=learnedFaqs.length;
 const pc=document.getElementById('pendingCount');
 const ks=document.getElementById('kbStatus');
 if(pc)pc.textContent=pending;
 if(ks)ks.textContent=`${faqs.length} FAQs · ${learned} approved learning · ${pending} pending`;
}
function saveUnresolved(question,reason='no_match',suggestedFaqId=''){
 const clean=String(question).trim();
 if(!clean)return;
 const duplicate=unresolved.find(x=>x.status==='pending'&&norm(x.question)===norm(clean));
 if(duplicate){duplicate.count=(duplicate.count||1)+1;duplicate.updated_at=nowISO()}
 else unresolved.unshift({
   id:'U-'+Date.now(),question:clean,reason,suggestedFaqId,
   status:'pending',count:1,created_at:nowISO(),updated_at:nowISO()
 });
 saveStore(STORAGE_KEYS.unresolved,unresolved);
 updateLearningStatus();
}
function saveFeedback(question,faq,value){
 feedbackLog.unshift({
   id:'F-'+Date.now(),question,faqId:faq?.id||'',rating:value,
   answer_ja:faq?.a_ja||'',answer_en:faq?.a_en||'',created_at:nowISO()
 });
 saveStore(STORAGE_KEYS.feedback,feedbackLog);
 if(value==='down')saveUnresolved(question,'negative_feedback',faq?.id||'');
}

function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

const smartManualOverlay=document.getElementById('smartManualOverlay');
const smartManualTitle=document.getElementById('smartManualTitle');
const smartManualBody=document.getElementById('smartManualBody');
function chapterLabel(n){return `Ch.${String(n).padStart(2,'0')} ${chapters[String(n)]||''}`.trim()}
function inferChapter(f){
 if(f.chapter)return Number(f.chapter);
 const hay=[f.a_ja,f.a_en,f.source].join(' ');
 let m=hay.match(/(?:マニュアル第|Chapter\s*|Ch\.?\s*)(\d{1,2})/i);
 return m?Number(m[1]):null;
}
function linkManualReferences(text){
 let html=esc(text);
 html=html.replace(/マニュアル第(\d{1,2})章/g,(_,n)=>`<button class="manual-link" data-manual-chapter="${n}">マニュアル第${n}章</button>`);
 html=html.replace(/Chapter\s+(\d{1,2})/gi,(_,n)=>`<button class="manual-link" data-manual-chapter="${n}">Chapter ${n}</button>`);
 return html;
}
function bindManualLinks(root=document){
 root.querySelectorAll('[data-manual-chapter]').forEach(el=>{
   el.onclick=(e)=>{e.preventDefault();e.stopPropagation();openManualChapter(Number(el.dataset.manualChapter));};
 });
}
function openManualChapter(chapter){
 const entries=faqs.filter(f=>Number(inferChapter(f))===Number(chapter));
 smartManualTitle.textContent=lang==='ja'?`第${chapter}章「${chapters[String(chapter)]||'Manual'}」`:chapterLabel(chapter);
 const notice=lang==='ja'
  ?'このSmart Manualでは、現在の公式マニュアルを基に登録された該当章の確認済み項目を表示しています。回答から離れず、その場で関連手順を確認できます。'
  :'Smart Manual shows verified knowledge-base excerpts from this manual chapter, without leaving the support answer.';
 let html=`<div class="manual-notice">${esc(notice)}</div><div class="manual-toolbar"><button onclick="showChapterFaqs(${chapter})">${lang==='ja'?'この章のFAQ一覧':'Chapter FAQ list'}</button><button onclick="closeSmartManual()">${lang==='ja'?'回答へ戻る':'Back to answer'}</button></div>`+mediaPanelForChapter(chapter,entries);
 if(entries.length){
  html+=entries.map(f=>`<article class="manual-entry"><h3>${esc(lang==='ja'?f.q_ja:f.q_en)}</h3><p>${linkManualReferences(lang==='ja'?f.a_ja:f.a_en)}</p><div class="manual-source">${esc(f.id)} · ${esc(f.source||'Manual')}</div></article>`).join('');
 }else html+=`<div class="manual-empty">${lang==='ja'?'この章の抜粋はまだ登録されていません。':'No verified excerpts are registered for this chapter yet.'}</div>`;
 smartManualBody.innerHTML=html;bindManualLinks(smartManualBody);
 smartManualOverlay.classList.add('open');smartManualOverlay.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
}
function closeSmartManual(){smartManualOverlay.classList.remove('open');smartManualOverlay.setAttribute('aria-hidden','true');document.body.style.overflow=''}
function showChapterFaqs(chapter){closeSmartManual();chat.innerHTML='';const arr=faqs.filter(f=>Number(inferChapter(f))===Number(chapter));add(`${chapterLabel(chapter)} — ${arr.length} FAQ`);arr.forEach(f=>{const x=document.createElement('button');x.className='faqbtn';x.textContent=lang==='ja'?f.q_ja:f.q_en;x.onclick=()=>answer(lang==='ja'?f.q_ja:f.q_en);chat.appendChild(x)});}
document.getElementById('smartManualClose').onclick=closeSmartManual;
if(manualImageClose)manualImageClose.onclick=closeManualImage;
if(manualImageLightbox)manualImageLightbox.onclick=e=>{if(e.target===manualImageLightbox)closeManualImage()};

smartManualOverlay.onclick=e=>{if(e.target===smartManualOverlay)closeSmartManual()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(manualImageLightbox.classList.contains('open'))closeManualImage();else closeSmartManual();}});

function add(t,who='bot',meta=''){const d=document.createElement('div');d.className='msg '+who;d.innerHTML=t+(meta?`<span class="meta">${esc(meta)}</span>`:'');chat.appendChild(d);window.scrollTo(0,document.body.scrollHeight)}
const grooveTerms=[
 {
  canonical:'Instant Activator',
  aliases:[
   'instant activator','instantactivator',
   'インスタントアクティベーター','インスタント アクティベーター',
   'インスタント・アクティベーター','インスタント',
   'ia','instant'
  ]
 },
 {
  canonical:'Groove Activator',
  aliases:[
   'groove activator','grooveactivator',
   'グルーヴアクティベーター','グルーブアクティベーター',
   'グルーヴ アクティベーター','グルーブ アクティベーター',
   'ga'
  ]
 },
 {
  canonical:'Trigger Pad',
  aliases:[
   'trigger pad','triggerpad',
   'トリガーパッド','トリガー パッド',
   'pad','パッド'
  ]
 },
 {
  canonical:'Preset',
  aliases:[
   'preset','presets','プリセット'
  ]
 },
 {
  canonical:'Standalone',
  aliases:[
   'standalone','stand alone','スタンドアロン',
   '単体起動','単体版'
  ]
 },
 {
  canonical:'Audio Unit',
  aliases:[
   'audio unit','audiounit','au',
   'オーディオユニット','オーディオ ユニット'
  ]
 },
 {
  canonical:'VST3',
  aliases:[
   'vst3','vst 3','vst'
  ]
 },
 {
  canonical:'AAX',
  aliases:[
   'aax'
  ]
 }
];

function normalizeGrooveTerms(input){
 let source=String(input).toLowerCase().normalize('NFKC');
 let expanded=source;
 for(const term of grooveTerms){
   const canonical=term.canonical.toLowerCase();
   for(const alias of term.aliases){
     const a=String(alias).toLowerCase().normalize('NFKC');
     if(source.includes(a)){
       expanded+=' '+canonical+' '+term.aliases.join(' ');
       break;
     }
   }
 }
 return expanded;
}

const synonyms={
'出ない':['表示されない','見つからない','認識されない','not appear','missing','not found'],
'表示されない':['出ない','見つからない','not appear','missing'],
'見つからない':['表示されない','出ない','not found','missing'],
'音が出ない':['無音','鳴らない','サウンドが出ない','no sound','silent'],
'鳴らない':['音が出ない','無音','no sound','silent'],
'重い':['cpu使用率が高い','動作が遅い','負荷が高い','overload','high cpu'],
'遅い':['レイテンシー','遅延','latency'],
'認証できない':['ライセンス認証に失敗','アクティベーション失敗','activation failed','license error'],
'アップデート':['更新','update','upgrade'],
'インストール':['導入','install','setup'],
'アンインストール':['削除','remove','uninstall'],
'バックアップ':['保存','退避','backup'],
'復元':['戻す','restore','recovery'],
'ロジック':['logic','logic pro'],
'プロツールス':['pro tools','aax'],
'キューベース':['cubase'],
'エイブルトン':['ableton','live'],
'スタジオワン':['studio one'],
'プラグイン':['plugin','au','vst3','aax'],
'ウィンドウズ':['windows','win','pc'],
'マック':['mac','macos'],
'小さい':['音量が小さい','quiet','low volume'],
'ノイズ':['音切れ','crackle','dropout'],
'同じ音':['同じサンプル','毎回同じ','repetition','same sample'],
'保存':['save','backup'],
'読み込み':['load','import'],
'書き出し':['export','bounce','recording','record'],
'録音':['rec','record','recording','レコーディング','録る','収録','bounce','export'],
'レコーディング':['録音','rec','record','recording','録る'],
'rec':['録音','レコーディング','record','recording','録る'],
'recording':['録音','レコーディング','rec','record','録る'],
'record':['録音','レコーディング','rec','recording','録る'],
'録る':['録音','レコーディング','rec','record','recording']
};
function norm(s){
 return String(s).toLowerCase().normalize('NFKC')
 .replace(/[ぁ-ん]/g,ch=>String.fromCharCode(ch.charCodeAt(0)+0x60))
 .replace(/[\s　・。、？?！!／\/()（）→:：\-_'".]/g,'');
}
function expandQuery(query){
 const raw=normalizeGrooveTerms(query);
 const base=raw
  .replace(/(の仕方|やり方|方法|教えて|知りたい|どうやる|どうすれば|できますか|したい)/g,' ')
  .replace(/\s+/g,' ')
  .trim();
 const variants=new Set([raw,base]);
 for(const [key,vals] of Object.entries(synonyms)){
   if(base.includes(key)){vals.forEach(v=>variants.add(base.replaceAll(key,v)));vals.forEach(v=>variants.add(v));}
   for(const v of vals){if(base.includes(v)){variants.add(base.replaceAll(v,key));variants.add(key);}}
 }
 return [...variants];
}
function bigrams(s){
 const n=norm(s),out=[];
 for(let i=0;i<n.length-1;i++)out.push(n.slice(i,i+2));
 return out;
}
function similarity(a,b){
 const A=bigrams(a),B=bigrams(b);
 if(!A.length||!B.length)return 0;
 const setB=new Set(B);let hit=0;
 A.forEach(x=>{if(setB.has(x))hit++});
 return (2*hit)/(A.length+B.length);
}
function score(f,query){
 let s=0;
 const variants=expandQuery(query);
 const nq=norm(normalizeGrooveTerms(query));
 for(const term of grooveTerms){
   const canonical=norm(term.canonical);
   if(nq.includes(canonical)){
     const termText=norm([f.q_ja,f.q_en,f.a_ja,f.a_en,...(f.keywords||[])].join(' '));
     if(termText.includes(canonical) || term.aliases.some(a=>termText.includes(norm(a)))) s+=240;
   }
 }
 const recordingIntent=['rec','record','recording','録音','レコーディング','録る'].some(x=>nq.includes(norm(x)));
 if(recordingIntent){
   const recordingText=norm([f.q_ja,f.q_en,f.a_ja,f.a_en,...(f.keywords||[])].join(' '));
   if(['rec','record','recording','録音','レコーディング','録る','bounce','export'].some(x=>recordingText.includes(norm(x)))) s+=180;
 }
 const fields=[
  {v:f.q_ja,w:7},{v:f.q_en,w:7},{v:f.keywords||[],w:6},
  {v:f.a_ja,w:2},{v:f.a_en,w:2},{v:f.category,w:4}
 ];
 for(const group of fields){
   const arr=Array.isArray(group.v)?group.v:[group.v];
   for(const field of arr){
     const nf=norm(field);
     for(const variant of variants){
       const nv=norm(variant);
       if(!nv)continue;
       if(nf===nv)s+=30*group.w;
       else if(nf.includes(nv)||nv.includes(nf))s+=12*group.w;
       const sim=similarity(nf,nv);
       if(sim>.75)s+=10*group.w;
       else if(sim>.55)s+=5*group.w;
       const tokens=String(variant).split(/[\s　、。?？/]+/).filter(x=>x.length>1);
       for(const t of tokens)if(String(field).toLowerCase().includes(t))s+=3*group.w;
     }
   }
 }
 return s;
}
function addFeedbackControls(question,faq){
 const w=document.createElement('div');w.className='feedback';
 const up=document.createElement('button');up.textContent=lang==='ja'?'👍 解決した':'👍 Solved';
 const down=document.createElement('button');down.textContent=lang==='ja'?'👎 解決しなかった':'👎 Not solved';
 up.onclick=()=>{saveFeedback(question,faq,'up');up.disabled=true;down.disabled=true;add(lang==='ja'?'評価ありがとうございます。この回答を維持します。':'Thanks. This answer will be retained.')}
 down.onclick=()=>{saveFeedback(question,faq,'down');up.disabled=true;down.disabled=true;add(lang==='ja'?'未解決リストへ保存しました。学習管理から正しい回答を登録できます。':'Saved to the unresolved list. Add an approved answer from Learning Management.')}
 w.append(up,down);chat.appendChild(w);
}
function answer(query){
 add(esc(query),'user');
 const nqDiag=norm(query);
 if(['音ガ出ナイ','鳴ラナイ','無音','nosound','silent'].some(x=>nqDiag.includes(norm(x)))){add(lang==='ja'?'「音が出ない」診断を開始します。':'Starting the no-sound diagnostic.');diagnosticState={flowId:'sound_no_output',nodeId:'env',history:[],started_at:nowISO()};renderDiagnosticNode();return;}
 let pool=faqs;if(cat.value)pool=pool.filter(f=>f.category===cat.value);
 const r=pool.map(f=>[f,score(f,query)]).sort((a,b)=>b[1]-a[1]);
 if(!r[0]||r[0][1]<8){
   saveUnresolved(query,'no_match');
   add(lang==='ja'?'この質問には、まだ確実な回答候補を特定できません。質問は未解決リストに保存しました。学習管理で正しい回答を承認すると、次回から回答できるようになります。':'I could not identify a reliable answer. The question was saved to the unresolved list. Once an answer is approved in Learning Management, it will be available next time.');
   return;
 }
 const f=r[0][0];const type=f.source_type||'Manual';const cls=type.startsWith('Manual')?'badge manual':'badge';
 const ch=inferChapter(f);
 const chapterBadge=ch?`<button class="manual-link" data-manual-chapter="${ch}">Ch.${ch}</button>`:'Ch.-';
 add(`<span class="${cls}">${esc(type)} · ${esc(f.id)} · ${chapterBadge}</span><br>${linkManualReferences(lang==='ja'?f.a_ja:f.a_en)}${ch?`<br><br><button class="manual-link" data-manual-chapter="${ch}">📖 ${lang==='ja'?`マニュアル第${ch}章を開く`:`Open Manual Chapter ${ch}`}</button>`:''}${answerMediaHtml(f)}`,'bot',f.source);
 bindManualLinks(chat);
 addFeedbackControls(query,f);
 if(r[1]&&r[1][1]>=r[0][1]*.55){
   const w=document.createElement('div');w.className='chips';
   r.slice(1,4).filter(x=>x[1]>=8).forEach(x=>{
     const b=document.createElement('button');
     b.textContent=(lang==='ja'?'関連：':'Related: ')+(lang==='ja'?x[0].q_ja:x[0].q_en);
     b.onclick=()=>answer(lang==='ja'?x[0].q_ja:x[0].q_en);w.appendChild(b)
   });chat.appendChild(w)
 }
}
function welcome(){chat.innerHTML='';add(lang==='ja'?`こんにちは。AJITO Assistでは、回答の直下に公式マニュアル画像を自動表示し、VISなど変化を見せる項目だけを動画候補として案内します。<br>ユーザーとして、普通の言葉で質問してください。`:`Hello. AJITO Assist automatically shows official manual visuals beneath each answer and reserves video for features where change must be demonstrated.<br>Ask naturally as a customer would.`);const w=document.createElement('div');w.className='chips';(lang==='ja'?['Slice Activatorとは？','キットのバックアップ方法は？','Logicで17xStereoを選ぶ理由は？','ピッチはどこまで変えられる？']:['What is Slice Activator?','How do I back up my kits?','Why should I choose 17xStereo in Logic?','What is the pitch range?']).forEach(x=>{const b=document.createElement('button');b.textContent=x;b.onclick=()=>answer(x);w.appendChild(b)});chat.appendChild(w)}
[...new Set(faqs.map(f=>f.category))].sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;cat.appendChild(o)})
document.getElementById('send').onclick=()=>{if(q.value.trim()){answer(q.value.trim());q.value=''}};q.onkeydown=e=>{if(e.key==='Enter')document.getElementById('send').click()};
document.querySelectorAll('.lang').forEach(b=>b.onclick=()=>{lang=b.dataset.lang;document.querySelectorAll('.lang').forEach(x=>x.classList.toggle('active',x===b));q.placeholder=lang==='ja'?'例：Slice Activatorの使い方は？':'Example: How do I use Slice Activator?';welcome()});
document.getElementById('reset').onclick=welcome;
document.getElementById('faqList').onclick=()=>{chat.innerHTML='';const pool=cat.value?faqs.filter(f=>f.category===cat.value):faqs;add((lang==='ja'?'登録FAQ：':'FAQ entries: ')+pool.length);pool.forEach(f=>{const b=document.createElement('button');b.className='faqbtn';b.textContent=`${f.id} · Ch.${f.chapter??'-'} · ${lang==='ja'?f.q_ja:f.q_en}`;b.onclick=()=>{chat.innerHTML='';answer(lang==='ja'?f.q_ja:f.q_en)};chat.appendChild(b)})};

cat.onchange=()=>{
  chat.innerHTML='';
  if(!cat.value){
    welcome();
    return;
  }
  const pool=faqs.filter(f=>f.category===cat.value);
  add((lang==='ja'?'カテゴリー：':'Category: ')+esc(cat.value)+'<br>'+(lang==='ja'?'FAQ件数：':'FAQ entries: ')+pool.length);
  if(pool.length===0){
    add(lang==='ja'?'このカテゴリーにはまだFAQがありません。':'There are no FAQ entries in this category yet.');
    return;
  }
  pool.forEach(f=>{
    const b=document.createElement('button');
    b.className='faqbtn';
    b.textContent=`${f.id} · Ch.${f.chapter??'-'} · ${lang==='ja'?f.q_ja:f.q_en}`;
    b.onclick=()=>{
      chat.innerHTML='';
      answer(lang==='ja'?f.q_ja:f.q_en);
    };
    chat.appendChild(b);
  });
};


function renderLearningPanel(){
 chat.innerHTML='';
 updateLearningStatus();
 const pending=unresolved.filter(x=>x.status==='pending');
 add(`<span class="badge">Approved Learning</span><br>${lang==='ja'?'未解決・低評価の質問を確認し、正しい回答だけを承認してください。':'Review unresolved or negatively rated questions and approve only verified answers.'}`);
 if(!pending.length){
   add(lang==='ja'?'現在、未解決質問はありません。':'There are currently no unresolved questions.');
   return;
 }
 pending.forEach(item=>{
   const card=document.createElement('div');card.className='admin-card';
   const title=document.createElement('h3');title.textContent=`${item.question} × ${item.count||1}`;
   const meta=document.createElement('div');meta.className='small';
   meta.textContent=`${item.reason} · ${item.suggestedFaqId||'no FAQ'} · ${item.created_at}`;
   const ja=document.createElement('textarea');ja.placeholder='承認する日本語回答';ja.value='';
   const en=document.createElement('textarea');en.placeholder='Approved English answer (optional)';en.value='';
   const category=document.createElement('input');category.placeholder='カテゴリー';category.value='学習済みFAQ';
   const chapter=document.createElement('input');chapter.placeholder='Manual chapter number (optional)';
   const source=document.createElement('input');source.placeholder='Manual reference / source';source.value='Approved by Gota';
   const keywords=document.createElement('input');keywords.placeholder='キーワード（カンマ区切り）';keywords.value=item.question;
   const actions=document.createElement('div');actions.className='admin-actions';
   const approve=document.createElement('button');approve.className='success';approve.textContent=lang==='ja'?'承認してFAQ追加':'Approve and add FAQ';
   const dismiss=document.createElement('button');dismiss.className='danger';dismiss.textContent=lang==='ja'?'却下':'Dismiss';
   approve.onclick=()=>{
     if(!ja.value.trim()){alert('日本語回答を入力してください。');return}
     const faq={
       id:'LRN-'+String(Date.now()).slice(-8),
       category:category.value.trim()||'学習済みFAQ',
       q_ja:item.question,
       a_ja:ja.value.trim(),
       q_en:item.question,
       a_en:en.value.trim()||ja.value.trim(),
       keywords:keywords.value.split(',').map(x=>x.trim()).filter(Boolean),
       source:source.value.trim()||'Approved by Gota',
       chapter:chapter.value.trim()?Number(chapter.value):null,
       source_type:'Approved Learning'
     };
     learnedFaqs.push(faq);faqs.push(faq);
     item.status='approved';item.approved_at=nowISO();item.learnedFaqId=faq.id;
     saveStore(STORAGE_KEYS.learned,learnedFaqs);saveStore(STORAGE_KEYS.unresolved,unresolved);
     updateLearningStatus();renderLearningPanel();
   };
   dismiss.onclick=()=>{
     item.status='dismissed';item.dismissed_at=nowISO();
     saveStore(STORAGE_KEYS.unresolved,unresolved);updateLearningStatus();renderLearningPanel();
   };
   actions.append(approve,dismiss);
   card.append(title,meta,ja,en,category,chapter,source,keywords,actions);
   chat.appendChild(card);
 });
}
document.getElementById('diagnosticStart').onclick=diagnosticStart;
document.getElementById('learningPanel').onclick=renderLearningPanel;
document.getElementById('exportLearning').onclick=()=>{
 const payload={
   exported_at:nowISO(),
   unresolved,
   feedback:feedbackLog,
   approved_faqs:learnedFaqs
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='Groove_Activator_Learning_Data.json';a.click();
 URL.revokeObjectURL(url);
};

document.getElementById('chapterList').onclick=()=>{chat.innerHTML='';for(const [n,name] of Object.entries(chapters)){const count=faqs.filter(f=>String(inferChapter(f))===String(n)).length;const b=document.createElement('button');b.className='faqbtn';b.textContent=`Ch.${String(n).padStart(2,'0')} ${name} — ${count} FAQ`;b.onclick=()=>{chat.innerHTML='';const arr=faqs.filter(f=>String(inferChapter(f))===String(n));add(`Ch.${n} ${name} — ${arr.length} FAQ`);arr.forEach(f=>{const x=document.createElement('button');x.className='faqbtn';x.textContent=lang==='ja'?f.q_ja:f.q_en;x.onclick=()=>answer(lang==='ja'?f.q_ja:f.q_en);chat.appendChild(x)})};chat.appendChild(b)}};
updateLearningStatus();
welcome();

  }
  if (document.documentElement.dataset.ajitoDataReady === 'true') startAJITOAssist();
  else window.addEventListener('ajito-data-ready', startAJITOAssist, {once:true});
})();
