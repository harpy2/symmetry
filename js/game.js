// ===== GAME STATE =====
let G={};

// ===== PARTY SYSTEM =====
// G.party[0..2] = character slots, G.activeSlot = current, G.slotUnlocked = which are available

function createCharData(opts){
return{
className:opts.className||'',classData:opts.classData||null,
level:1,exp:0,hp:opts.baseHP||100,maxHP:opts.baseHP||100,
atk:opts.baseATK||15,def:opts.baseDEF||8,
gold:999999,points:9999999,hunger:100,mood:80,floor:1,
equippedSkills:[],equippedPassives:[],allSkills:[],allPassives:[],
equipment:{helmet:null,chest:null,gloves:null,pants:null,boots:null,weapon:null,necklace:null,ring1:null,ring2:null,offhand:null},inventory:[],
critBonus:0,hpBonus:0,atkBonus:0,defBonus:0,expBonus:0,
autoHunt:false,autoLevelUp:false,missionCooldowns:{},lastTick:Date.now()
}}

function newGame(){
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
renderMainScreen();
updateSlotUI();
}

const SLOT_COST=[0,2000,5000];
function unlockSlot(slot){
const cost=SLOT_COST[slot];
if(G.gold<cost){toast(`골드가 부족합니다! (${G.gold}/${cost})`);return}
if(confirm(`💰 ${cost.toLocaleString()} 골드로 캐릭터 슬롯 ${slot+1}을 해제할까요?`)){
G.gold-=cost;
G.slotUnlocked[slot]=true;
updateBars();saveGame();
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
tabs[0].textContent=G.slotUnlocked[1]?(G.party[1]?G.party[1].className||'캐릭2':'캐릭2 (빈)'):'캐릭2🔒';
tabs[1].textContent=G.party&&G.party[0]?G.party[0].className||'캐릭1':'캐릭1';
tabs[2].textContent=G.slotUnlocked[2]?(G.party[2]?G.party[2].className||'캐릭3':'캐릭3 (빈)'):'캐릭3🔒';
tabs.forEach((t,i)=>{t.classList.toggle('active',slotOrder[i]===G.activeSlot)});
}
}

function syncActiveChar(){saveCharToSlot()}

// ===== SCREENS =====
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');if(id==='class-screen')renderClassSelect();if(id==='main-screen'){renderMainScreen();startTicking()}}

// ===== MAIN SCREEN =====
function renderMainScreen(){updateBars();renderCharacter();renderEquipRow();renderSkillRow();updateSlotUI()}

function getMoodStatus(){
if(G.mood>=80)return'😊 좋음';
if(G.mood>=50)return'😐 보통';
if(G.mood>=20)return'😟 나쁨';
return'😢 최악';
}

function updateBars(){
document.getElementById('player-level').textContent=G.level;
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
charHTML=`<div class="char-sprite" style="background-image:url('${anim.src}');width:${anim.w}px;height:${anim.h}px;background-size:${anim.tw}px ${anim.h}px;animation:sprite-${G.className} ${charData.frames*0.12}s steps(${charData.frames}) infinite"></div>
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
const slotNames={helmet:'투구',chest:'상의',gloves:'장갑',pants:'바지',boots:'신발',weapon:'주무기',necklace:'목걸이',ring1:'반지1',ring2:'반지2',offhand:'보조무기'};
const statsHTML=Object.entries(item.stats).map(([k,v])=>`<div>${k}: +${v}</div>`).join('');
const modsHTML=(item.skillMods&&item.skillMods.length)?item.skillMods.map(m=>`<div style="color:var(--cyan)">✦ ${m.mod}</div>`).join(''):'';
const el=document.createElement('div');el.id='equip-detail-popup';
el.innerHTML=`<div class="edp-overlay" onclick="closeEquipPopup()"><div class="edp-card" onclick="event.stopPropagation()">
<div class="edp-name" style="color:${GRADE_COLORS[item.grade]}">${item.svgData?'<span class="item-svg" style="display:inline-block;vertical-align:middle;margin-right:4px">'+item.svgData+'</span>':item.emoji+' '}${item.name}</div>
<div class="edp-grade" style="color:${GRADE_COLORS[item.grade]}">${item.grade} ${slotNames[slot]||slot}</div>
<div class="edp-stats">${statsHTML}</div>
${modsHTML?'<div class="edp-mods">'+modsHTML+'</div>':''}
<div class="edp-dur">내구도: ${item.durability}/${item.maxDurability}</div>
<div class="edp-desc">${item.desc||''}</div>
<button class="btn btn-sm btn-secondary" onclick="unequipFromPopup('${slot}')">해제</button>
</div></div>`;
document.body.appendChild(el);
}
function closeEquipPopup(){const el=document.getElementById('equip-detail-popup');if(el)el.remove()}
function unequipFromPopup(slot){if(!G.equipment[slot])return;G.inventory.push(G.equipment[slot]);G.equipment[slot]=null;closeEquipPopup();toast('장비 해제');renderEquipRow();renderCharacter();updateBars();saveGame()}

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
const gradeColors={일반:'#999',매직:'#2ecc71',레어:'var(--blue)',유니크:'var(--purple)',에픽:'var(--orange)'};
const statsText=Object.entries(item.stats).map(([k,v])=>`${k}+${v}`).join('  ');
const modsText=(item.skillMods&&item.skillMods.length)?item.skillMods.map(m=>`<div style="color:#00d4ff;font-size:11px">✦ ${m.mod}</div>`).join(''):'';
const el=document.createElement('div');
el.className='item-drop-popup';
const isAuto=G.autoHunt;
const dropIcon=item.svgData?`<div class="item-svg item-svg-drop">${item.svgData}</div>`:`<div class="idp-emoji">${item.emoji}</div>`;
// 캐릭별 장착 버튼 생성
let equipBtns='';
const slotNames=['캐릭1','캐릭2','캐릭3'];
for(let s=0;s<3;s++){
if(G.slotUnlocked[s]&&G.party[s]){
const charName=G.party[s].className||slotNames[s];
equipBtns+=`<button class="btn btn-sm idp-equip-btn" onclick="equipFromPopupToChar(this,${s})">⚔️ ${charName}${s===G.activeSlot?' (현재)':''}</button>`;
}
}
equipBtns+=`<button class="btn btn-sm btn-secondary idp-equip-btn" onclick="closeDropPopup(this)" style="margin-top:4px">📦 인벤토리에 보관</button>`;
el.innerHTML=`<div class="idp-shine"></div>${dropIcon}<div class="idp-label">✦ 아이템 획득 ✦</div><div class="idp-name" style="color:${gradeColors[item.grade]||'#fff'}">${item.name}</div><div class="idp-grade" style="color:${gradeColors[item.grade]||'#999'}">${item.grade}</div><div class="idp-stats">${statsText}</div>${modsText}<div class="idp-desc">${item.desc||''}</div><div class="idp-buttons">${equipBtns}</div>`;
document.body.appendChild(el);
el._item=item;

// 자동사냥: 3초 후 자동 닫힘 → 인벤토리에 보관
let autoTimer=null;
if(isAuto){
autoTimer=setTimeout(()=>{if(el.parentNode){el.classList.add('closing');setTimeout(()=>el.remove(),300)}},3000);
}

// 팝업 배경 클릭으로 닫기 (버튼 영역 제외)
el.onclick=(e)=>{
if(e.target.closest('.idp-equip-btn'))return;
if(autoTimer)clearTimeout(autoTimer);
el.classList.add('closing');setTimeout(()=>el.remove(),300);
};
}

function closeDropPopup(btn){
const el=btn.closest('.item-drop-popup');
if(el){el.classList.add('closing');setTimeout(()=>el.remove(),300)}
toast('인벤토리에 보관!');
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
function saveGame(){
syncActiveChar();
const s={...G};delete s.classData;s.className_=G.className;
// Save party data (strip classData from each slot)
if(s.party){
s.party=s.party.map(slot=>{
if(!slot)return null;
const c={...slot};delete c.classData;return c;
});
}
localStorage.setItem('symmetry_save',JSON.stringify(s))
}
function loadGame(){const raw=localStorage.getItem('symmetry_save');if(!raw){toast('저장된 데이터가 없습니다');return}
try{const s=JSON.parse(raw);G=s;G.className=s.className_;G.classData=CLASSES[G.className];if(!G.classData){toast('잘못된 세이브 데이터');return}
G.allSkills=G.classData.skills;G.allPassives=G.classData.passives;
G.equippedSkills=G.equippedSkills.map(es=>G.allSkills.find(s=>s.name===es.name)||es);
G.equippedPassives=G.equippedPassives.map(ep=>G.allPassives.find(p=>p.name===ep.name)||ep);
if(!G.missionCooldowns)G.missionCooldowns={};if(!G.critBonus)G.critBonus=0;
// Restore party system defaults if missing
if(!G.party)G.party=[null,null,null];
if(G.activeSlot===undefined)G.activeSlot=0;
if(!G.slotUnlocked)G.slotUnlocked=[true,false,false];
// Restore classData in party slots
if(G.party){G.party.forEach(slot=>{if(slot&&slot.className)slot.classData=CLASSES[slot.className]})}
// Sync current G into party[0] if party[0] is null (migration)
if(!G.party[0])saveCharToSlot();
// Bonus stat defaults
if(!G.hpBonus)G.hpBonus=0;if(!G.atkBonus)G.atkBonus=0;if(!G.defBonus)G.defBonus=0;if(!G.expBonus)G.expBonus=0;
// 장비 슬롯 마이그레이션 (3슬롯→10슬롯)
if(G.equipment.armor&&!G.equipment.chest){G.equipment.chest=G.equipment.armor;delete G.equipment.armor}
if(G.equipment.accessory&&!G.equipment.necklace){G.equipment.necklace=G.equipment.accessory;delete G.equipment.accessory}
['helmet','chest','gloves','pants','boots','weapon','necklace','ring1','ring2','offhand'].forEach(k=>{if(!G.equipment.hasOwnProperty(k))G.equipment[k]=null});
showScreen('main-screen');toast('게임 로드 완료!')}catch(e){toast('로드 실패: '+e.message)}}

// Init
renderClassSelect();
