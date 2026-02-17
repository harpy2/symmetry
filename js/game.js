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
equipment:{weapon:null,armor:null,accessory:null},inventory:[],
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
let armorStyle=cls.bodyColor;if(G.equipment.armor){const ac=GRADE_COLORS[G.equipment.armor.grade];armorStyle=`linear-gradient(180deg,${ac},#111)`}
// Build sparkles
let sparklesHTML='<div class="char-sparkles">';
for(let i=0;i<6;i++){const x=20+Math.random()*160;const y=20+Math.random()*160;const delay=Math.random()*3;const dur=1.5+Math.random()*2;sparklesHTML+=`<span style="left:${x}px;top:${y}px;animation-delay:${delay}s;animation-duration:${dur}s"></span>`}
sparklesHTML+='</div>';
area.innerHTML=`<div class="character">${sparklesHTML}<div class="char-glow" style="background:${cls.glow}"></div><div class="char-body" style="background:${armorStyle}"><div class="char-face"><div class="char-eyes"><div class="char-eye"></div><div class="char-eye"></div></div><div class="char-mouth ${mouthClass}"></div></div></div><div class="char-weapon">${weaponEmoji}</div></div>`}

function renderEquipRow(){const row=document.getElementById('equip-row');
const slots=['weapon','armor','accessory'];const labels=['⚔️','🛡️','📿'];
row.innerHTML=slots.map((s,i)=>{const item=G.equipment[s];return`<div class="equip-slot ${item?'has-item':''}" onclick="openOverlay('inventory','${s}')" style="${item?'border-color:'+GRADE_COLORS[item.grade]:''}">${item?item.emoji:labels[i]}</div>`}).join('')}

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
const gradeColors={일반:'#999',레어:'var(--blue)',유니크:'var(--purple)',에픽:'var(--orange)'};
const statsText=Object.entries(item.stats).map(([k,v])=>`${k}+${v}`).join('  ');
const el=document.createElement('div');
el.className='item-drop-popup';
el.innerHTML=`<div class="idp-shine"></div><div class="idp-emoji">${item.emoji}</div><div class="idp-label">✦ 아이템 획득 ✦</div><div class="idp-name" style="color:${gradeColors[item.grade]||'#fff'}">${item.name}</div><div class="idp-grade" style="color:${gradeColors[item.grade]||'#999'}">${item.grade}</div><div class="idp-stats">${statsText}</div><div class="idp-desc">${item.desc||''}</div>`;
document.body.appendChild(el);
el.onclick=()=>{el.classList.add('closing');setTimeout(()=>el.remove(),300)};
setTimeout(()=>{if(el.parentNode){el.classList.add('closing');setTimeout(()=>el.remove(),300)}},3000);
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
showScreen('main-screen');toast('게임 로드 완료!')}catch(e){toast('로드 실패: '+e.message)}}

// Init
renderClassSelect();
