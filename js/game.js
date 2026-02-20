// ===== ANALYTICS =====
function trackEvent(name,params){try{if(typeof gtag==='function')gtag('event',name,params)}catch(e){}}

// ===== GAME STATE =====
let G={};

// ===== PARTY SYSTEM =====
// G.party[0..2] = character slots, G.activeSlot = current, G.slotUnlocked = which are available

function createCharData(opts){
return{
className:opts.className||'',classData:opts.classData||null,
level:1,exp:0,hp:opts.baseHP||100,maxHP:opts.baseHP||100,
atk:opts.baseATK||15,def:opts.baseDEF||8,
gold:0,points:0,hunger:100,mood:80,floor:1,
equippedSkills:[],equippedPassives:[],allSkills:[],allPassives:[],
equipment:{helmet:null,chest:null,gloves:null,pants:null,boots:null,weapon:null,necklace:null,ring1:null,ring2:null,offhand:null},inventory:[],
critBonus:0,hpBonus:0,atkBonus:0,defBonus:0,expBonus:0,
autoHunt:false,autoLevelUp:false,missionCooldowns:{},lastTick:Date.now()
}}

function newGame(){
trackEvent('game_start',{type:'new'});
const g=createCharData({});
// Party structure
g.party=[null,null,null];
g.activeSlot=0;
g.slotUnlocked=[true,false,false];
return g;
}

function getActiveChar(){return G.party?G.party[G.activeSlot]:null}

function saveCharToSlot(){
if(!G.party)return;
// inventory는 공용이므로 캐릭별로 저장하지 않음
const charProps=['className','classData','level','exp','hp','maxHP','atk','def','gold','points',
'hunger','mood','floor','equippedSkills','equippedPassives','allSkills','allPassives',
'equipment','critBonus','hpBonus','atkBonus','defBonus','expBonus',
'autoHunt','autoLevelUp','missionCooldowns','lastTick','_appliedBuffs',
'skillDmgBonus','atkSpeed','luckBonus','goldBonus'];
const obj={};
charProps.forEach(k=>{if(G[k]!==undefined)obj[k]=G[k]});
G.party[G.activeSlot]=obj;
}

function loadSlotToG(slot){
if(!G.party||!G.party[slot])return;
const obj=G.party[slot];
Object.keys(obj).forEach(k=>{G[k]=obj[k]});
G.activeSlot=slot;
}

function switchCharacter(slot){
if(!G.slotUnlocked[slot]){unlockSlot(slot);return}
if(!G.party[slot]){showScreen('class-screen');G._pendingSlot=slot;return}
saveCharToSlot();
loadSlotToG(slot);
saveGame();
renderMainScreen();
updateSlotUI();
}

const SLOT_COST=[0,2000,5000];
function unlockSlot(slot){
const cost=SLOT_COST[slot];
if(G.gold<cost){toast(t('골드가 부족합니다!')+` (${G.gold}/${cost})`);return}
if(confirm(LANG==='ko'?`💰 ${cost.toLocaleString()} 골드로 캐릭터 슬롯 ${slot+1}을 해제할까요?`:`💰 Unlock character slot ${slot+1} for ${cost.toLocaleString()} gold?`)){
G.gold-=cost;
G.slotUnlocked[slot]=true;
trackEvent('slot_unlock',{slot:slot+1,level:G.level});
updateBars();saveGame();
// 슬롯 해금은 즉시 클라우드 저장 (디바운스 무시)
cloudSave(serializeState());
updateSlotUI();
toast(`캐릭터 슬롯 ${slot+1} 해제 완료! 🎉`);
// 해제 후 바로 캐릭터 선택으로
if(!G.party[slot]){showScreen('class-screen');G._pendingSlot=slot}
}
}

function updateSlotUI(){
// 잠금 오버레이 — 다른 슬롯 패널은 숨기고 메인 패널만 사용
for(let i=1;i<=2;i++){
const overlay=document.getElementById('lock-overlay-'+i);
if(overlay){overlay.style.display=G.slotUnlocked[i]?'none':'flex'}
}
// slot0 패널만 메인 UI — 항상 active, 나머지는 데스크탑에서만 표시
document.querySelectorAll('.char-panel').forEach(p=>{
const s=parseInt(p.dataset.slot);
if(s===0){p.classList.add('active')}
else{p.classList.remove('active')}
});
// 탭 버튼 업데이트 + active 표시
const tabs=document.querySelectorAll('.char-tab');
const slotOrder=[1,0,2]; // HTML 탭 순서: 캐릭2, 캐릭1, 캐릭3
if(tabs.length>=3){
tabs[0].textContent=G.slotUnlocked[1]?(G.party[1]?t(G.party[1].className)||t('캐릭2'):t('캐릭2')+' '+t('(빈)')):(t('캐릭2')+'🔒');
tabs[1].textContent=G.party&&G.party[0]?t(G.party[0].className)||t('캐릭1'):t('캐릭1');
tabs[2].textContent=G.slotUnlocked[2]?(G.party[2]?t(G.party[2].className)||t('캐릭3'):t('캐릭3')+' '+t('(빈)')):(t('캐릭3')+'🔒');
tabs.forEach((t,i)=>{t.classList.toggle('active',slotOrder[i]===G.activeSlot)});
}
// 사이드 패널에 캐릭터 렌더링
if(typeof renderSidePanel==='function'){renderSidePanel(1);renderSidePanel(2)}
}

function syncActiveChar(){saveCharToSlot()}

// ===== SCREENS =====
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');if(id==='class-screen')renderClassSelect();if(id==='main-screen'){renderMainScreen();startTicking()}}

// ===== MAIN SCREEN =====
function renderMainScreen(){updateBars();renderCharacter();renderEquipRow();renderSkillRow();updateSlotUI();checkPendingRewards();
if(typeof renderSkillPanel==='function'&&G.party&&G.party[G.activeSlot])renderSkillPanel(0,G.party[G.activeSlot]||G);
if(G.autoHunt){setTimeout(()=>{openOverlay('hunt')},300)}}

function getMoodStatus(){
if(G.mood>=80)return t('😊 좋음');
if(G.mood>=50)return t('😐 보통');
if(G.mood>=20)return t('😟 나쁨');
return t('😢 최악');
}

function updateBars(){
const pl0=document.getElementById('panel-level-0');if(pl0)pl0.textContent='⭐ Lv.'+G.level;
document.getElementById('player-gold').textContent=G.gold;
document.getElementById('player-points').textContent=G.points;
document.getElementById('hp-bar').style.width=(G.hp/G.maxHP*100)+'%';
document.getElementById('hp-text').textContent=`${Math.floor(G.hp)}/${G.maxHP}`;
document.getElementById('hunger-bar').style.width=G.hunger+'%';
document.getElementById('hunger-text').textContent=Math.floor(G.hunger)+'%';
const moodBar=document.getElementById('mood-bar');
moodBar.style.width=G.mood+'%';
// Mood bar color and pulse for critical mood
if(G.mood<20){
moodBar.style.background='#8b0000';
moodBar.classList.add('mood-pulse');
}else{
moodBar.style.background='';
moodBar.classList.remove('mood-pulse');
}
const moodText=document.getElementById('mood-text');
moodText.textContent=Math.floor(G.mood)+'% '+getMoodStatus();
}

function renderCharacter(){const area=document.getElementById('char-area');const cls=CLASSES[G.className];if(!cls)return;
const charData=CHAR_SVG[G.className];
let charHTML='';
if(charData&&charData.type==='sprite'){
const anim=charData.idle;
charHTML=`<div class="char-sprite" style="background-image:url('${anim.src}${SPRITE_VER}');width:${anim.w}px;height:${anim.h}px;background-size:${anim.tw}px ${anim.h}px;animation:sprite-${G.className} ${charData.frames*0.12}s steps(${charData.frames}) infinite"></div>
<style>@keyframes sprite-${G.className}{from{background-position:0 0}to{background-position:-${anim.tw}px 0}}</style>`;
}else if(typeof charData==='string'){
charHTML=`<div class="char-svg-wrap">${charData}</div>`;
}
// Build sparkles
let sparklesHTML='<div class="char-sparkles">';
for(let i=0;i<6;i++){const x=20+Math.random()*160;const y=20+Math.random()*160;const delay=Math.random()*3;const dur=1.5+Math.random()*2;sparklesHTML+=`<span style="left:${x}px;top:${y}px;animation-delay:${delay}s;animation-duration:${dur}s"></span>`}
sparklesHTML+='</div>';
area.innerHTML=`<div class="character">${sparklesHTML}<div class="char-glow" style="background:${cls.glow}"></div>${charHTML}</div>`}

// 장비 스탯 합산 헬퍼 (% 문자열도 숫자로 파싱)
function getEquipStat(stat){
var total=0;
for(var k in G.equipment){if(G.equipment[k]&&G.equipment[k].stats){
var v=G.equipment[k].stats[stat];
if(v!==undefined&&v!==null)total+=typeof v==='string'?parseInt(v)||0:v;
}}
return total;
}

const EQUIP_SLOTS_LEFT=[
{key:'helmet',icon:'🪖',label:'투구'},
{key:'chest',icon:'👕',label:'상의'},
{key:'gloves',icon:'🧤',label:'장갑'},
{key:'pants',icon:'👖',label:'바지'},
{key:'boots',icon:'👢',label:'신발'},
{key:'weapon',icon:'⚔️',label:'주무기'}
];
const EQUIP_SLOTS_RIGHT=[
{key:'necklace',icon:'📿',label:'목걸이'},
{key:'ring1',icon:'💍',label:'반지1'},
{key:'ring2',icon:'💍',label:'반지2'},
{key:'offhand',icon:'🛡️',label:'보조무기'}
];
function renderEquipRow(){
const left=document.getElementById('equip-col-left');
const right=document.getElementById('equip-col-right');
if(!left||!right)return;
function equipSlotIcon(item,fallback){return item?(item.svgData?`<div class="item-svg">${item.svgData}</div>`:item.emoji):fallback}
left.innerHTML=EQUIP_SLOTS_LEFT.map(s=>{const item=G.equipment[s.key];return`<div class="equip-slot ${item?'has-item':''}" onclick="${item?`showEquipPopup('${s.key}')`:`openOverlay('inventory','${s.key}')`}" title="${s.label}" style="${item?'border-color:'+GRADE_COLORS[item.grade]:''}">${equipSlotIcon(item,s.icon)}</div>`}).join('');
right.innerHTML=EQUIP_SLOTS_RIGHT.map(s=>{const item=G.equipment[s.key];return`<div class="equip-slot ${item?'has-item':''}" onclick="${item?`showEquipPopup('${s.key}')`:`openOverlay('inventory','${s.key}')`}" title="${s.label}" style="${item?'border-color:'+GRADE_COLORS[item.grade]:''}">${equipSlotIcon(item,s.icon)}</div>`}).join('');
}

// 장비 상세 팝업
function showEquipPopup(slot){
const item=G.equipment[slot];if(!item)return;
const existing=document.getElementById('equip-detail-popup');
if(existing){existing.remove();return}
const slotNames={helmet:t('투구'),chest:t('상의'),gloves:t('장갑'),pants:t('바지'),boots:t('신발'),weapon:t('주무기'),necklace:t('목걸이'),ring1:t('반지1'),ring2:t('반지2'),offhand:t('보조무기')};
const statsHTML=Object.entries(item.stats).map(([k,v])=>`<div>${k}: +${v}</div>`).join('');
const modsHTML=(item.skillMods&&item.skillMods.length)?item.skillMods.map(m=>`<div style="color:var(--cyan)">✦ ${m.mod}</div>`).join(''):'';
const el=document.createElement('div');el.id='equip-detail-popup';
el.innerHTML=`<div class="edp-overlay" onclick="closeEquipPopup()"><div class="edp-card" onclick="event.stopPropagation()">
<div class="edp-name" style="color:${GRADE_COLORS[item.grade]}">${item.svgData?'<span class="item-svg" style="display:inline-block;vertical-align:middle;margin-right:4px">'+item.svgData+'</span>':item.emoji+' '}${item.name}</div>
<div class="edp-grade" style="color:${GRADE_COLORS[item.grade]}">${t(item.grade)} ${slotNames[slot]||slot}</div>
<div class="edp-stats">${statsHTML}</div>
${modsHTML?'<div class="edp-mods">'+modsHTML+'</div>':''}
<div class="edp-dur">${t('내구도:')} ${item.durability}/${item.maxDurability}</div>
<div class="edp-desc">${item.desc||''}</div>
<button class="btn btn-sm btn-secondary" onclick="unequipFromPopup('${slot}')">${t('해제')}</button>
</div></div>`;
document.body.appendChild(el);
}
function closeEquipPopup(){const el=document.getElementById('equip-detail-popup');if(el)el.remove()}
function unequipFromPopup(slot){if(!G.equipment[slot])return;G.inventory.push(G.equipment[slot]);G.equipment[slot]=null;closeEquipPopup();toast(t('장비 해제'));renderEquipRow();renderCharacter();updateBars();saveGame()}

function renderSkillRow(){const row=document.getElementById('skill-equip-row');
if(!row)return;
row.innerHTML=G.equippedSkills.map(s=>`<div class="skill-slot" title="${s.name}">${s.icon}</div>`).join('')}

// ===== TICKING (hunger, mood, passive mood recovery) =====
let tickInterval;
function startTicking(){if(tickInterval)clearInterval(tickInterval);
const elapsed=(Date.now()-G.lastTick)/1000;
const hungerLoss=elapsed/30;
G.hunger=Math.max(0,G.hunger-hungerLoss);
if(G.hunger<=0)G.hp=Math.max(1,G.hp-elapsed/60*5);
// Passive mood recovery: +1 per 60s of elapsed time
const moodRecovery=elapsed/60;
G.mood=Math.min(100,G.mood+moodRecovery);
G.lastTick=Date.now();
tickInterval=setInterval(()=>{
G.hunger=Math.max(0,G.hunger-0.033);
if(G.hunger<=0){G.hp=Math.max(1,G.hp-0.08);G.mood=Math.max(0,G.mood-0.02)}
if(G.hunger<20)G.mood=Math.max(0,G.mood-0.01);
// Passive mood recovery: +1 per minute = +1/60 per second
G.mood=Math.min(100,G.mood+(1/60));
G.lastTick=Date.now();
updateBars();renderCharacter();saveGame()},1000)}

// ===== FOOD MOOD RECOVERY =====
// Call this when buying/eating food from shop to also recover mood
function onEatFood(){
G.mood=Math.min(100,G.mood+10);
}

// ===== TOAST =====
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2500)}

// ===== ITEM DROP POPUP =====
function showItemDropPopup(item){
const gradeColors={Normal:'#999',Magic:'#2ecc71',Rare:'var(--blue)',Unique:'var(--purple)',Epic:'var(--orange)'};
const statsText=Object.entries(item.stats).map(([k,v])=>`${k}+${v}`).join('  ');
const modsText=(item.skillMods&&item.skillMods.length)?item.skillMods.map(m=>`<div style="color:#00d4ff;font-size:11px">✦ ${m.mod}</div>`).join(''):'';
const el=document.createElement('div');
el.className='item-drop-popup';
const isAuto=G.autoHunt;
const dropIcon=item.svgData?`<div class="item-svg item-svg-drop">${item.svgData}</div>`:`<div class="idp-emoji">${item.emoji}</div>`;
// 캐릭별 장착 버튼 (캐릭2, 캐릭1, 캐릭3 순서)
const slotOrder=[1,0,2];
let charBtns='<div class="idp-char-row">';
for(const s of slotOrder){
if(G.slotUnlocked[s]&&G.party[s]){
const cls=CLASSES[G.party[s].className];
const icon=cls?cls.weapon:'⚔️';
const charName=t(G.party[s].className)||t('캐릭'+(s+1));
charBtns+=`<button class="idp-char-btn" onclick="equipFromPopupToChar(this,${s})" title="${charName}">${icon}<span>${charName}</span></button>`;
}else if(G.slotUnlocked[s]){
charBtns+=`<button class="idp-char-btn disabled" disabled>🔓<span>${t('빈 슬롯')}</span></button>`;
}else{
charBtns+=`<button class="idp-char-btn disabled" disabled>🔒<span>${t('잠김')}</span></button>`;
}
}
charBtns+='</div>';
const actionBtns=`<div class="idp-action-row"><button class="idp-action-btn" onclick="closeDropPopup(this)">📦 인벤토리</button><button class="idp-action-btn idp-discard" onclick="discardFromPopup(this)">🗑️ 버리기</button></div>`;
el.innerHTML=`<div class="idp-shine"></div>${dropIcon}<div class="idp-label">✦ 아이템 획득 ✦</div><div class="idp-name" style="color:${gradeColors[item.grade]||'#fff'}">${item.name}</div><div class="idp-grade" style="color:${gradeColors[item.grade]||'#999'}">${item.grade}</div><div class="idp-stats">${statsText}</div>${modsText}<div class="idp-desc">${item.desc||''}</div><div class="idp-buttons">${charBtns}${actionBtns}</div>`;
document.body.appendChild(el);
el._item=item;

// 자동사냥: 3초 후 자동 닫힘 → 인벤토리에 보관
let autoTimer=null;
if(isAuto){
const cdEl=document.createElement('div');
cdEl.className='idp-countdown';
cdEl.style.cssText='text-align:center;color:var(--text2);font-size:11px;margin-top:6px';
let sec=5;
cdEl.textContent=`${sec}초 후 자동으로 닫힙니다`;
el.appendChild(cdEl);
const cdInterval=setInterval(()=>{sec--;if(sec>0)cdEl.textContent=`${sec}초 후 자동으로 닫힙니다`;else clearInterval(cdInterval)},1000);
autoTimer=setTimeout(()=>{clearInterval(cdInterval);if(el.parentNode){el.classList.add('closing');setTimeout(()=>el.remove(),300)}},5000);
el._cdInterval=cdInterval;
}

// 팝업 배경 클릭으로 닫기 (버튼 영역 제외)
el.onclick=(e)=>{
if(e.target.closest('.idp-char-btn')||e.target.closest('.idp-action-btn'))return;
if(autoTimer)clearTimeout(autoTimer);
if(el._cdInterval)clearInterval(el._cdInterval);
el.classList.add('closing');setTimeout(()=>el.remove(),300);
};
}

function closeDropPopup(btn){
const el=btn.closest('.item-drop-popup');
if(el){el.classList.add('closing');setTimeout(()=>el.remove(),300)}
toast('인벤토리에 보관!');
}

function discardFromPopup(btn){
const el=btn.closest('.item-drop-popup');
const item=el._item;
if(item){
  const idx=G.inventory.findIndex(i=>i.id===item.id);
  if(idx>=0)G.inventory.splice(idx,1);
}
if(el){el.classList.add('closing');setTimeout(()=>el.remove(),300)}
toast('아이템을 버렸습니다');saveGame();
}

function equipFromPopupToChar(btn,slot){
const el=btn.closest('.item-drop-popup');
const item=el._item;
if(!item)return;
saveCharToSlot(); // 현재 캐릭 저장
const targetChar=G.party[slot];
if(!targetChar)return;
// 대상 캐릭의 기존 장비 → 공용 인벤토리
if(targetChar.equipment&&targetChar.equipment[item.type]){
G.inventory.push(targetChar.equipment[item.type]);
}
// 인벤토리에서 이 아이템 제거 후 대상 캐릭에 장착
const idx=G.inventory.findIndex(i=>i.id===item.id);
if(idx>=0)G.inventory.splice(idx,1);
if(!targetChar.equipment)targetChar.equipment={};
targetChar.equipment[item.type]=item;
G.party[slot]=targetChar;
// 현재 캐릭이면 G에도 반영
if(slot===G.activeSlot)loadSlotToG(slot);
const charName=targetChar.className||('캐릭'+(slot+1));
toast(`${item.name} → ${charName} 장착!`);
renderEquipRow();renderCharacter();updateBars();saveGame();
el.classList.add('closing');setTimeout(()=>el.remove(),300);
}

// ===== SAVE/LOAD =====
let _cloudSaveTimer=null;
function serializeState(){
syncActiveChar();
const s={...G};delete s.classData;s.className_=G.className;
s.savedAt=Date.now();
if(s.party){s.party=s.party.map(slot=>{if(!slot)return null;const c={...slot};delete c.classData;return c})}
return s;
}
// 로컬 저장 인코딩/디코딩
function _encLocal(s){return btoa(unescape(encodeURIComponent(JSON.stringify(s))))}
function _decLocal(str){try{return JSON.parse(decodeURIComponent(escape(atob(str))))}catch(e){return null}}

function saveGame(){
const s=serializeState();
// 로컬은 오프라인 백업용 (인코딩)
localStorage.setItem('symmetry_save',_encLocal(s));
// 서버 저장 (디바운스 2초)
if(_cloudSaveTimer)clearTimeout(_cloudSaveTimer);
_cloudSaveTimer=setTimeout(()=>{cloudSave(s)},2000);
}
async function cloudSave(s){
try{
const uid=getCPQUserId();
const res=await fetch(CPQ_API+'/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:uid,data:s})});
if(!res.ok)throw new Error('status '+res.status);
}catch(e){console.warn('[CloudSave] error:',e.message);localStorage.setItem('symmetry_save',_encLocal(s))}
}
// 페이지 나갈 때 즉시 서버 저장
window.addEventListener('beforeunload',()=>{
if(_cloudSaveTimer){clearTimeout(_cloudSaveTimer);const s=serializeState();const uid=getCPQUserId();navigator.sendBeacon(CPQ_API+'/api/save',JSON.stringify({user_id:uid,data:s}))}
});
window.addEventListener('visibilitychange',()=>{
if(document.visibilityState==='hidden'){const s=serializeState();const uid=getCPQUserId();navigator.sendBeacon(CPQ_API+'/api/save',JSON.stringify({user_id:uid,data:s}))}
});

function restoreState(s){
G=s;G.className=s.className_;G.classData=CLASSES[G.className];
if(!G.classData)return false;
G.allSkills=G.classData.skills;G.allPassives=G.classData.passives;
G.equippedSkills=(G.equippedSkills||[]).map(es=>G.allSkills.find(s=>s.name===es.name)||es);
G.equippedPassives=(G.equippedPassives||[]).map(ep=>G.allPassives.find(p=>p.name===ep.name)||ep);
if(!G.missionCooldowns)G.missionCooldowns={};if(!G.critBonus)G.critBonus=0;
initStats();
if(!G._statUpgrades)G._statUpgrades={};
if(!G.party)G.party=[null,null,null];
if(G.activeSlot===undefined)G.activeSlot=0;
if(!G.slotUnlocked)G.slotUnlocked=[true,false,false];
if(G.party){G.party.forEach(slot=>{if(slot&&slot.className)slot.classData=CLASSES[slot.className]})}
if(!G.party[0])saveCharToSlot();
if(!G.hpBonus)G.hpBonus=0;if(!G.atkBonus)G.atkBonus=0;if(!G.defBonus)G.defBonus=0;if(!G.expBonus)G.expBonus=0;
if(G.equipment){
if(G.equipment.armor&&!G.equipment.chest){G.equipment.chest=G.equipment.armor;delete G.equipment.armor}
if(G.equipment.accessory&&!G.equipment.necklace){G.equipment.necklace=G.equipment.accessory;delete G.equipment.accessory}
['helmet','chest','gloves','pants','boots','weapon','necklace','ring1','ring2','offhand'].forEach(k=>{if(!G.equipment.hasOwnProperty(k))G.equipment[k]=null});
}
return true;
}

function _readLocal(){
const raw=localStorage.getItem('symmetry_save');
if(!raw)return null;
// 인코딩된 데이터 시도 → 구버전 평문 JSON 폴백
const dec=_decLocal(raw);
if(dec)return dec;
try{return JSON.parse(raw)}catch(e){return null}
}
function loadGame(){
const s=_readLocal();
if(!s){toast('저장된 데이터가 없습니다');return}
try{
if(!restoreState(s)){toast('잘못된 세이브 데이터');return}
showScreen('main-screen');toast('게임 로드 완료!');
}catch(e){toast('로드 실패: '+e.message)}
}

// 클라우드에서 로드 (타이틀 화면의 '이어하기'에서 사용)
async function loadFromCloud(){
try{
const uid=getCPQUserId();
const res=await fetch(CPQ_API+'/api/save?user_id='+uid);
const json=await res.json();
if(json.data){
if(restoreState(json.data)){
localStorage.setItem('symmetry_save',_encLocal(json.data));
showScreen('main-screen');toast('☁️ 클라우드 세이브 로드 완료!');return true;
}
}
}catch(e){console.warn('[CloudLoad]',e.message)}
return false;
}

// 세이브 데이터 점수 (높을수록 진행도 높음)
// 이어하기: 서버 우선, 실패 시 로컬 폴백
async function continueGame(){
toast('서버에서 데이터 불러오는 중...');
let cloudData=null;
try{
const uid=getCPQUserId();
const res=await fetch(CPQ_API+'/api/save?user_id='+uid);
const json=await res.json();
cloudData=json.data||null;
}catch(e){console.warn('[Load] cloud fetch failed:',e.message)}
let localData=_readLocal();
if(!cloudData&&!localData){toast('저장된 데이터가 없습니다');return}
// 서버 데이터 우선, 없으면 로컬 폴백
let chosen,isCloud=false;
if(cloudData){
const ct=cloudData.savedAt||0;
const lt=localData&&localData.savedAt?localData.savedAt:0;
// 로컬이 더 최신이면 로컬 사용 후 서버 동기화
if(lt>ct&&localData){chosen=localData;isCloud=false}
else{chosen=cloudData;isCloud=true}
}else{chosen=localData;isCloud=false}
if(!chosen){toast('저장된 데이터가 없습니다');return}
if(restoreState(chosen)){
localStorage.setItem('symmetry_save',_encLocal(chosen));
showScreen('main-screen');toast(isCloud?'☁️ 서버 세이브 로드 완료!':'📱 로컬 세이브 로드 완료!');
trackEvent('game_start',{type:'continue',level:G.level,floor:G.floor,class:G.className});
if(!isCloud&&localData)cloudSave(localData);
}else{toast('잘못된 세이브 데이터')}
}

// ===== CHARACTER CHANGE (골드 상점) =====
let _changeSlot=-1;
function startCharChange(){
const price=500+G.level*50;
if(G.gold<price)return toast(`골드가 부족합니다! (${price} 필요)`);
// 슬롯 선택 팝업
const el=document.createElement('div');el.id='char-change-popup';
el.innerHTML=`<div class="edp-overlay" onclick="closeCharChange()"><div class="edp-card" onclick="event.stopPropagation()" style="max-width:320px">
<div style="font-size:16px;font-weight:700;margin-bottom:12px;text-align:center">🔄 직업 변경 (💰${price})</div>
<div style="font-size:13px;color:var(--text2);margin-bottom:12px;text-align:center">변경할 캐릭터를 선택하세요</div>
<div style="display:flex;gap:8px;justify-content:center">${[0,1,2].map(s=>{
if(!G.slotUnlocked[s]||!G.party[s])return'';
const cn=G.party[s].className||'빈 슬롯';
const cls=CLASSES[G.party[s].className];
return`<button class="btn btn-sm" onclick="selectChangeSlot(${s})" style="min-width:80px">${cls?cls.weapon:''} ${cn}</button>`;
}).join('')}</div>
</div></div>`;
document.body.appendChild(el);
}
function closeCharChange(){const el=document.getElementById('char-change-popup');if(el)el.remove()}
function selectChangeSlot(slot){
_changeSlot=slot;closeCharChange();
// 직업 선택 화면으로
G._pendingClassChange=true;
G._changeSlotTarget=slot;
showScreen('class-screen');
}
function confirmClassChange(className){
const slot=G._changeSlotTarget;
const price=500+G.level*50;
if(G.gold<price)return toast('골드가 부족합니다!');
G.gold-=price;
const cls=CLASSES[className];
// 기존 장비 → 인벤토리
const oldChar=G.party[slot];
if(oldChar&&oldChar.equipment){Object.values(oldChar.equipment).forEach(e=>{if(e)G.inventory.push(e)})}
// 새 캐릭 생성
G.party[slot]={className,classData:cls,level:oldChar?oldChar.level:1,exp:0,
hp:cls.baseHP,maxHP:cls.baseHP,atk:cls.baseATK,def:cls.baseDEF,
hunger:100,mood:80,floor:oldChar?oldChar.floor:1,
equippedSkills:[],equippedPassives:[],allSkills:[...cls.skills],allPassives:[...cls.passives],
equipment:{helmet:null,chest:null,gloves:null,pants:null,boots:null,weapon:null,necklace:null,ring1:null,ring2:null,offhand:null},
critBonus:0,hpBonus:0,atkBonus:0,defBonus:0,expBonus:0,_appliedBuffs:[],_statUpgrades:{}};
if(slot===G.activeSlot){loadSlotToG(slot)}
delete G._pendingClassChange;delete G._changeSlotTarget;
saveGame();showScreen('main-screen');
toast(`${className}(으)로 전직 완료! ⚔️`);
}

// Init
renderClassSelect();
