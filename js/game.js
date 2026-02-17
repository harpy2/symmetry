// ===== GAME STATE =====
let G={};
function newGame(){return{className:'',classData:null,level:1,exp:0,hp:100,maxHP:100,atk:15,def:8,gold:100,points:10,hunger:100,mood:80,floor:1,equippedSkills:[],equippedPassives:[],allSkills:[],allPassives:[],equipment:{weapon:null,armor:null,accessory:null},inventory:[],critBonus:0,autoHunt:false,missionCooldowns:{},lastTick:Date.now()}}

// ===== SCREENS =====
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');if(id==='class-screen')renderClassSelect();if(id==='main-screen'){renderMainScreen();startTicking()}}

// ===== MAIN SCREEN =====
function renderMainScreen(){updateBars();renderCharacter();renderEquipRow();renderSkillRow()}
function updateBars(){
document.getElementById('player-level').textContent=G.level;
document.getElementById('player-gold').textContent=G.gold;
document.getElementById('player-points').textContent=G.points;
document.getElementById('hp-bar').style.width=(G.hp/G.maxHP*100)+'%';
document.getElementById('hp-text').textContent=`${Math.floor(G.hp)}/${G.maxHP}`;
document.getElementById('hunger-bar').style.width=G.hunger+'%';
document.getElementById('hunger-text').textContent=Math.floor(G.hunger)+'%';
document.getElementById('mood-bar').style.width=G.mood+'%';
document.getElementById('mood-text').textContent=Math.floor(G.mood)+'%'}

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

// ===== TICKING (hunger, mood) =====
let tickInterval;
function startTicking(){if(tickInterval)clearInterval(tickInterval);
const elapsed=(Date.now()-G.lastTick)/1000;
const hungerLoss=elapsed/30;
G.hunger=Math.max(0,G.hunger-hungerLoss);
if(G.hunger<=0)G.hp=Math.max(1,G.hp-elapsed/60*5);
G.lastTick=Date.now();
tickInterval=setInterval(()=>{
G.hunger=Math.max(0,G.hunger-0.033);
if(G.hunger<=0){G.hp=Math.max(1,G.hp-0.08);G.mood=Math.max(0,G.mood-0.02)}
if(G.hunger<20)G.mood=Math.max(0,G.mood-0.01);
G.lastTick=Date.now();
updateBars();renderCharacter();saveGame()},1000)}

// ===== TOAST =====
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2500)}

// ===== SAVE/LOAD =====
function saveGame(){const s={...G};delete s.classData;s.className_=G.className;localStorage.setItem('symmetry_save',JSON.stringify(s))}
function loadGame(){const raw=localStorage.getItem('symmetry_save');if(!raw){toast('저장된 데이터가 없습니다');return}
try{const s=JSON.parse(raw);G=s;G.className=s.className_;G.classData=CLASSES[G.className];if(!G.classData){toast('잘못된 세이브 데이터');return}
G.allSkills=G.classData.skills;G.allPassives=G.classData.passives;
G.equippedSkills=G.equippedSkills.map(es=>G.allSkills.find(s=>s.name===es.name)||es);
G.equippedPassives=G.equippedPassives.map(ep=>G.allPassives.find(p=>p.name===ep.name)||ep);
if(!G.missionCooldowns)G.missionCooldowns={};if(!G.critBonus)G.critBonus=0;
showScreen('main-screen');toast('게임 로드 완료!')}catch(e){toast('로드 실패: '+e.message)}}

// Init
renderClassSelect();
