// ===== TITLE PARTICLES =====
(function(){const c=document.getElementById('title-particles');for(let i=0;i<30;i++){const s=document.createElement('span');s.style.left=Math.random()*100+'%';s.style.animationDuration=(4+Math.random()*6)+'s';s.style.animationDelay=Math.random()*5+'s';s.style.width=s.style.height=(1+Math.random()*3)+'px';c.appendChild(s)}})();

// ===== CLASS SELECT =====
function renderClassSelect(){const c=document.getElementById('class-cards');c.innerHTML='';
Object.entries(CLASSES).forEach(([name,cls])=>{
const d=document.createElement('div');d.className='class-card';d.onclick=()=>{document.querySelectorAll('.class-card').forEach(x=>x.classList.remove('selected'));d.classList.add('selected');G=newGame();G.className=name;G.classData=cls;G.maxHP=cls.baseHP;G.hp=cls.baseHP;G.atk=cls.baseATK;G.def=cls.baseDEF;G.allSkills=[...cls.skills];G.allPassives=[...cls.passives];document.getElementById('class-confirm-btn').disabled=false};
d.innerHTML=`<div class="class-avatar" style="background:${cls.bodyColor}"><span style="font-size:36px">${cls.weapon}</span></div><div class="class-info"><h3>${name}</h3><p>${cls.desc}</p><div class="class-stats"><span>❤️${cls.baseHP}</span><span>⚔️${cls.baseATK}</span><span>🛡️${cls.baseDEF}</span></div></div>`;
c.appendChild(d)})}
function confirmClass(){if(!G.className)return;
// Auto-equip first 3 skills and first 2 passives
G.equippedSkills=G.allSkills.slice(0,3);G.equippedPassives=G.allPassives.slice(0,2);
saveGame();showScreen('main-screen')}

// ===== SKILL SELECT =====
let selectedActive=new Set(),selectedPassive=new Set(),hoveredSkill=null;
function renderSkillSelect(){selectedActive.clear();selectedPassive.clear();
const ag=document.getElementById('active-skill-grid');ag.innerHTML='';
G.allSkills.forEach((s,i)=>{const d=document.createElement('div');d.className='skill-item';d.onclick=()=>{if(selectedActive.has(i))selectedActive.delete(i);else if(selectedActive.size<3)selectedActive.add(i);renderSkillHighlights();showSkillDesc(s)};d.innerHTML=`<span class="icon">${s.icon}</span><span class="name">${s.name}</span>`;d.id='askill-'+i;ag.appendChild(d)});
const pg=document.getElementById('passive-skill-grid');pg.innerHTML='';
G.allPassives.forEach((s,i)=>{const d=document.createElement('div');d.className='skill-item';d.onclick=()=>{if(selectedPassive.has(i))selectedPassive.delete(i);else if(selectedPassive.size<2)selectedPassive.add(i);renderSkillHighlights();showSkillDesc(s)};d.innerHTML=`<span class="icon">${s.icon}</span><span class="name">${s.name}</span>`;d.id='pskill-'+i;pg.appendChild(d)});
renderSkillHighlights()}
function renderSkillHighlights(){G.allSkills.forEach((_,i)=>{const el=document.getElementById('askill-'+i);if(el)el.className='skill-item'+(selectedActive.has(i)?' selected':'')});
G.allPassives.forEach((_,i)=>{const el=document.getElementById('pskill-'+i);if(el)el.className='skill-item'+(selectedPassive.has(i)?' selected':'')});
document.getElementById('active-count').textContent=`선택: ${selectedActive.size}/3`;
document.getElementById('passive-count').textContent=`선택: ${selectedPassive.size}/2`;
document.getElementById('skill-confirm-btn').disabled=!(selectedActive.size===3&&selectedPassive.size===2)}
function showSkillDesc(s){document.getElementById('skill-desc-box').innerHTML=`<div class="title">${s.icon} ${s.name}</div><div class="desc">${s.desc}</div>`}
function confirmSkills(){G.equippedSkills=[...selectedActive].map(i=>G.allSkills[i]);G.equippedPassives=[...selectedPassive].map(i=>G.allPassives[i]);saveGame();showScreen('main-screen')}

// ===== OVERLAYS =====
function openOverlay(name,extra){document.getElementById('overlay-'+name).classList.add('active');
if(name==='hunt')renderHunt();
if(name==='mission')renderMissions();
if(name==='shop')renderShop('gold');
if(name==='inventory')renderInventory(extra);
if(name==='skills')renderSkillManage()}
function closeOverlay(name){document.getElementById('overlay-'+name).classList.remove('active');if(name==='hunt'){G.autoHunt=false;updateAutoHuntUI()}}

// ===== SKILL MANAGE =====
function renderSkillManage(){const body=document.getElementById('skills-body');body.innerHTML='<h3 style="color:var(--gold);margin-bottom:12px;font-size:15px">🗡️ 액티브 스킬</h3>';
G.allSkills.forEach((s,i)=>{const equipped=G.equippedSkills.some(e=>e.name===s.name);
body.innerHTML+=`<div class="skill-manage-item ${equipped?'equipped':''}" onclick="toggleSkillEquip(${i},'active')"><div class="sk-icon">${s.icon}</div><div class="sk-info"><div class="sk-name">${s.name} ${equipped?'✅':''}</div><div class="sk-desc">${s.desc}</div></div></div>`});
body.innerHTML+='<h3 style="color:var(--gold);margin:18px 0 12px;font-size:15px">🛡️ 패시브 스킬</h3>';
G.allPassives.forEach((s,i)=>{const equipped=G.equippedPassives.some(e=>e.name===s.name);
body.innerHTML+=`<div class="skill-manage-item ${equipped?'equipped':''}" onclick="toggleSkillEquip(${i},'passive')"><div class="sk-icon">${s.icon}</div><div class="sk-info"><div class="sk-name">${s.name} ${equipped?'✅':''}</div><div class="sk-desc">${s.desc}</div></div></div>`})}
function toggleSkillEquip(idx,type){
if(type==='active'){const s=G.allSkills[idx];const ei=G.equippedSkills.findIndex(e=>e.name===s.name);
if(ei>=0)G.equippedSkills.splice(ei,1);else if(G.equippedSkills.length<3)G.equippedSkills.push(s);else{toast('최대 3개까지 장착 가능합니다');return}}
else{const s=G.allPassives[idx];const ei=G.equippedPassives.findIndex(e=>e.name===s.name);
if(ei>=0)G.equippedPassives.splice(ei,1);else if(G.equippedPassives.length<2)G.equippedPassives.push(s);else{toast('최대 2개까지 장착 가능합니다');return}}
renderSkillManage();renderSkillRow();saveGame()}

// ===== LEVEL UP =====
async function showLevelUp(){const ol=document.getElementById('levelup-overlay');ol.classList.add('active');
document.getElementById('levelup-sub').textContent=`Lv.${G.level} 달성! HP+20, ATK+3, DEF+2`;

// AI 레벨업 보상 시도, 실패 시 기존 랜덤
let choices = await generateLevelUpAI();
if(!choices){
const pool=[...LEVELUP_BUFFS];choices=[];
for(let i=0;i<3;i++){const idx=Math.floor(Math.random()*pool.length);choices.push(pool.splice(idx,1)[0])}
}

document.getElementById('levelup-choices').innerHTML=choices.map((c,i)=>`<div class="levelup-choice" onclick="pickLevelBuff(${i})"><div class="lc-name">${c.name}</div><div class="lc-desc">${c.desc}</div></div>`).join('');
const pc=document.getElementById('levelup-particles');pc.innerHTML='';
for(let i=0;i<30;i++){const p=document.createElement('div');p.className='particle';p.style.left=Math.random()*100+'%';p.style.top=Math.random()*100+'%';p.style.width=p.style.height=(4+Math.random()*8)+'px';p.style.background=['var(--gold)','#fff','var(--accent)','var(--success)'][Math.floor(Math.random()*4)];p.style.animationDelay=Math.random()*2+'s';p.style.animationDuration=(0.5+Math.random())+'s';pc.appendChild(p)}
window._levelChoices=choices;
if(!G._appliedBuffs)G._appliedBuffs=[];
document.getElementById('auto-levelup-toggle').checked=!!G.autoLevelUp;
if(G.autoLevelUp){setTimeout(()=>pickLevelBuff(Math.floor(Math.random()*3)),500);return}}
function pickLevelBuff(i){window._levelChoices[i].apply(G);
if(!G._appliedBuffs)G._appliedBuffs=[];
G._appliedBuffs.push(window._levelChoices[i].name);
document.getElementById('levelup-overlay').classList.remove('active');
toast(`${window._levelChoices[i].name} 획득!`);updateBars();renderCharacter();saveGame()}

// ===== PARTY SYSTEM =====
let activeSlot=0;
const partySlots=[{unlocked:true},{unlocked:false},{unlocked:false}];

function switchCharacter(idx){
if(!partySlots[idx].unlocked){toast('💎 포인트로 슬롯을 구매하세요');return}
activeSlot=idx;
document.querySelectorAll('.char-tab').forEach((t,i)=>t.classList.toggle('active',i===idx));
document.querySelectorAll('.char-panel').forEach((p,i)=>{p.classList.toggle('active',i===idx)});
}

function renderPartyLayout(){
const tabs=document.getElementById('char-tab-bar');
if(tabs){tabs.innerHTML='';
partySlots.forEach((_,i)=>{
const t=document.createElement('button');
t.className='char-tab'+(i===activeSlot?' active':'');
t.onclick=()=>switchCharacter(i);
t.textContent=partySlots[i].unlocked?`캐릭${i+1}`:`캐릭${i+1}🔒`;
tabs.appendChild(t)})}
}
