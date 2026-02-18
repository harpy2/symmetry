// ===== GAME STATE =====
let G={};

// ===== PARTY SYSTEM =====
// G.party[0..2] = character slots, G.activeSlot = current, G.slotUnlocked = which are available

function createCharData(opts){
return{
className:opts.className||'',classData:opts.classData||null,
level:1,exp:0,hp:opts.baseHP||100,maxHP:opts.baseHP||100,
atk:opts.baseATK||15,def:opts.baseDEF||8,
gold:100,points:10,hunger:100,mood:80,floor:1,
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
const charProps=['className','classData','level','exp','hp','maxHP','atk','def','gold','points',
'hunger','mood','floor','equippedSkills','equippedPassives','allSkills','allPassives',
'equipment','inventory','critBonus','hpBonus','atkBonus','defBonus','expBonus',
'autoHunt','autoLevelUp','missionCooldowns','lastTick'];
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
if(!G.slotUnlocked[slot]||!G.party[slot]){toast('잠긴 슬롯입니다');return}
saveCharToSlot();
loadSlotToG(slot);
renderMainScreen();
}

function syncActiveChar(){saveCharToSlot()}

// ===== SCREENS =====
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');if(id==='class-screen')renderClassSelect();if(id==='main-screen'){renderMainScreen();startTicking()}}

// ===== MAIN SCREEN =====
function renderMainScreen(){updateBars();renderCharacter();renderEquipRow();renderSkillRow()}

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
let mouthClass='';if(G.mood>=70)mouthClass='happy';else if(G.mood>=40)mouthClass='';else if(G.mood>=20)mouthClass='sad';else mouthClass='angry';
let weaponEmoji=cls.weapon;if(G.equipment.weapon)weaponEmoji=G.equipment.weapon.emoji||cls.weapon;
let armorStyle=cls.bodyColor;if(G.equipment.chest){const ac=GRADE_COLORS[G.equipment.chest.grade];armorStyle=`linear-gradient(180deg,${ac},#111)`}
// Build sparkles
let sparklesHTML='<div class="char-sparkles">';
for(let i=0;i<6;i++){const x=20+Math.random()*160;const y=20+Math.random()*160;const delay=Math.random()*3;const dur=1.5+Math.random()*2;sparklesHTML+=`<span style="left:${x}px;top:${y}px;animation-delay:${delay}s;animation-duration:${dur}s"></span>`}
sparklesHTML+='</div>';
area.innerHTML=`<div class="character">${sparklesHTML}<div class="char-glow" style="background:${cls.glow}"></div><div class="char-body" style="background:${armorStyle}"><div class="char-face"><div class="char-eyes"><div class="char-eye"></div><div class="char-eye"></div></div><div class="char-mouth ${mouthClass}"></div></div></div><div class="char-weapon">${weaponEmoji}</div></div>`}

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
left.innerHTML=EQUIP_SLOTS_LEFT.map(s=>{const item=G.equipment[s.key];return`<div class="equip-slot ${item?'has-item':''}" onclick="${item?`showEquipPopup('${s.key}')`:`openOverlay('inventory','${s.key}')`}" title="${s.label}" style="${item?'border-color:'+GRADE_COLORS[item.grade]:''}">${item?item.emoji:s.icon}</div>`}).join('');
right.innerHTML=EQUIP_SLOTS_RIGHT.map(s=>{const item=G.equipment[s.key];return`<div class="equip-slot ${item?'has-item':''}" onclick="${item?`showEquipPopup('${s.key}')`:`openOverlay('inventory','${s.key}')`}" title="${s.label}" style="${item?'border-color:'+GRADE_COLORS[item.grade]:''}">${item?item.emoji:s.icon}</div>`}).join('');
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
<div class="edp-name" style="color:${GRADE_COLORS[item.grade]}">${item.emoji} ${item.name}</div>
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
el.innerHTML=`<div class="idp-shine"></div><div class="idp-emoji">${item.emoji}</div><div class="idp-label">✦ 아이템 획득 ✦</div><div class="idp-name" style="color:${gradeColors[item.grade]||'#fff'}">${item.name}</div><div class="idp-grade" style="color:${gradeColors[item.grade]||'#999'}">${item.grade}</div><div class="idp-stats">${statsText}</div>${modsText}<div class="idp-desc">${item.desc||''}</div><div class="idp-buttons"><button class="btn btn-sm idp-equip-btn" onclick="equipFromPopup(this)">⚔️ 바로 착용</button></div>`;
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

function equipFromPopup(btn){
const el=btn.closest('.item-drop-popup');
const item=el._item;
if(!item)return;
// 기존 장비 → 인벤토리
if(G.equipment[item.type]){
G.inventory.push(G.equipment[item.type]);
}
// 인벤토리에서 이 아이템 제거 후 장착
const idx=G.inventory.findIndex(i=>i.id===item.id);
if(idx>=0)G.inventory.splice(idx,1);
G.equipment[item.type]=item;
toast(`${item.name} 장착!`);
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
