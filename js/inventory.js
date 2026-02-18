// ===== ITEM GENERATION =====
// 부위별 스탯 옵션 풀
const STAT_POOL={
weapon:['ATK','치명타','관통','출혈 데미지'],
offhand:['DEF','ATK','막기 확률','반사 데미지'],
helmet:['DEF','HP','저항력','기분 유지'],
chest:['DEF','HP','HP 회복','피해감소'],
gloves:['ATK','치명타','공격속도','연속공격'],
pants:['DEF','HP','회피율','이동속도'],
boots:['DEF','공격속도','선제공격','연속턴'],
necklace:['ATK','DEF','스킬 데미지','쿨다운 감소'],
ring1:['ATK','치명타','골드 획득','경험치 보너스'],
ring2:['ATK','치명타','드롭률','행운']
};
function rollStatValue(stat,gMult,floorMult){
const base={ATK:[3,8],DEF:[2,6],HP:[8,20],'치명타':[1,4],'공격속도':[1,3],'관통':[2,6],'출혈 데미지':[3,8],
'막기 확률':[2,5],'반사 데미지':[2,6],'저항력':[2,5],'기분 유지':[3,8],'HP 회복':[1,4],'피해감소':[2,5],
'연속공격':[2,5],'회피율':[1,4],'이동속도':[2,5],'선제공격':[3,8],'연속턴':[2,5],'스킬 데미지':[3,8],
'쿨다운 감소':[2,6],'골드 획득':[5,15],'경험치 보너스':[3,10],'드롭률':[2,8],'행운':[3,10]}[stat]||[2,6];
const v=Math.floor((base[0]+Math.random()*(base[1]-base[0]))*gMult*floorMult);
const pctStats=['치명타','공격속도','막기 확률','반사 데미지','저항력','기분 유지','HP 회복','피해감소','연속공격','회피율','이동속도','선제공격','연속턴','스킬 데미지','쿨다운 감소','골드 획득','경험치 보너스','드롭률','행운','출혈 데미지','관통'];
return pctStats.includes(stat)?v+'%':v;
}

// 스킬 강화 커스텀 옵션 생성 (장착 스킬 기반)
function generateSkillCustom(){
const skills=G.equippedSkills||[];
if(skills.length===0)return{mod:'전체 스킬 데미지 +15%'};
const sk=skills[Math.floor(Math.random()*skills.length)];
const templates=[
`${sk.name} 2연속 발사`,
`${sk.name} 3연속 발사`,
`${sk.name} 데미지 +30%`,
`${sk.name} 데미지 +50%`,
`${sk.name} 범위 2배 확대`,
`${sk.name} 3갈래로 분산 (3타겟 동시 공격)`,
`${sk.name} 시전 시 HP 5% 회복`,
`${sk.name} 시전 시 HP 8% 회복`,
`${sk.name} 적중 시 50% 확률 추가 시전`,
`${sk.name} 치명타 데미지 +50%`,
`${sk.name} 시전 시 방어력 +20% (3초)`,
`${sk.name} 관통 효과 추가`,
`${sk.name} 적중 시 출혈 부여 (지속 피해)`,
`${sk.name} 적중 시 화상 부여 (지속 피해)`,
`${sk.name} 적중 시 중독 부여 (지속 피해)`
];
return{mod:templates[Math.floor(Math.random()*templates.length)],skillName:sk.name};
}

function generateItem(){
const allTypes=['helmet','chest','gloves','pants','boots','weapon','necklace','ring1','ring2','offhand'];
const type=allTypes[Math.floor(Math.random()*allTypes.length)];
const suffixes=ITEM_SUFFIX[type];const emojis=ITEM_EMOJIS[type];
const si=Math.floor(Math.random()*suffixes.length);
const prefix=ITEM_PREFIX[Math.floor(Math.random()*ITEM_PREFIX.length)];
const material=ITEM_MATERIAL[Math.floor(Math.random()*ITEM_MATERIAL.length)];
const name=`${prefix} ${material}의 ${suffixes[si]}`;
const roll=Math.random()*100;let grade='일반';
if(roll<2)grade='에픽';else if(roll<10)grade='유니크';else if(roll<25)grade='레어';else if(roll<55)grade='매직';
const gMult={일반:1,매직:1.3,레어:1.5,유니크:2.2,에픽:3.5}[grade];
const floorMult=1+G.floor*0.1;

// 등급별 스탯 옵션 개수: 일반=0, 매직=2, 레어=3, 유니크=3, 에픽=3
const statCount={일반:0,매직:2,레어:3,유니크:3,에픽:3}[grade];
const stats={};
const pool=[...STAT_POOL[type]];
for(let i=0;i<statCount&&pool.length>0;i++){
const idx=Math.floor(Math.random()*pool.length);
const stat=pool.splice(idx,1)[0];
stats[stat]=rollStatValue(stat,gMult,floorMult);
}

// 스킬 강화 커스텀 옵션: 유니크=1, 에픽=2
let skillMods=[];
const modCount=grade==='에픽'?2:grade==='유니크'?1:0;
const usedMods=new Set();
for(let m=0;m<modCount;m++){
let custom;let tries=0;
do{custom=generateSkillCustom();tries++}while(usedMods.has(custom.mod)&&tries<10);
usedMods.add(custom.mod);
skillMods.push(custom);
}

const durability=Math.floor({일반:50,매직:65,레어:80,유니크:120,에픽:180}[grade]*(0.8+Math.random()*0.4));
return{id:Date.now()+Math.random(),name,type,grade,emoji:emojis[si],stats,skillMods,durability,maxDurability:durability,desc:FLAVOR_TEXTS[Math.floor(Math.random()*FLAVOR_TEXTS.length)]}}

// ===== INVENTORY =====
let invFilter=null;
function renderInventory(filter){invFilter=filter||null;
const detail=document.getElementById('item-detail-area');detail.innerHTML='';
const grid=document.getElementById('inv-grid');grid.innerHTML='';
for(let i=0;i<30;i++){const item=G.inventory[i];const d=document.createElement('div');d.className='inv-slot'+(item?' grade-'+item.grade:'');
if(item){d.innerHTML=`<span>${item.emoji}</span><div class="dur-bar"><div class="dur-fill" style="width:${item.durability/item.maxDurability*100}%"></div></div>`;d.onclick=()=>showItemDetail(i)}
grid.appendChild(d)}}

function showItemDetail(idx){const item=G.inventory[idx];if(!item)return;
const d=document.getElementById('item-detail-area');
const statsHTML=Object.entries(item.stats).map(([k,v])=>`<div>${k}: +${v}</div>`).join('');
const modsHTML=(item.skillMods&&item.skillMods.length)?'<div class="item-mods"><div style="color:var(--gold);font-size:11px;margin-top:6px">✦ 스킬 옵션</div>'+item.skillMods.map(m=>`<div style="color:var(--cyan);font-size:12px">• ${m.mod}</div>`).join('')+'</div>':'';
const isEquipped=Object.values(G.equipment).some(e=>e&&e.id===item.id);
const sellPrice=Math.floor(({일반:5,매직:10,레어:15,유니크:40,에픽:100}[item.grade]||5)*(1+G.floor*0.1));
d.innerHTML=`<div class="item-detail"><div class="item-name grade-${item.grade}-text" style="color:${GRADE_COLORS[item.grade]}">${item.name}</div><div class="item-grade" style="color:${GRADE_COLORS[item.grade]}">${item.grade} ${{weapon:'주무기',offhand:'보조무기',helmet:'투구',chest:'상의',gloves:'장갑',pants:'바지',boots:'신발',necklace:'목걸이',ring1:'반지',ring2:'반지'}[item.type]||item.type}</div><div class="item-stats">${statsHTML}</div>${modsHTML}<div style="font-size:12px;color:var(--text2)">내구도: ${item.durability}/${item.maxDurability}</div><div class="item-desc">${item.desc}</div><div class="item-actions">${isEquipped?`<button class="btn btn-sm btn-secondary" onclick="unequipItem('${item.type}')">해제</button>`:`<button class="btn btn-sm" onclick="equipItem(${idx})">장착</button>`}<button class="btn btn-sm btn-secondary" onclick="repairItem(${idx})">수리 (💰${Math.floor((item.maxDurability-item.durability)*0.5)})</button><button class="btn btn-sm btn-secondary" onclick="sellItem(${idx})">판매 (💰${sellPrice})</button></div></div>`}

function equipItem(idx){const item=G.inventory[idx];if(!item)return;
if(G.equipment[item.type])G.inventory.push(G.equipment[item.type]);
G.equipment[item.type]=item;G.inventory.splice(idx,1);
toast(`${item.name} 장착!`);renderInventory();renderEquipRow();renderCharacter();saveGame()}
function unequipItem(type){if(!G.equipment[type])return;G.inventory.push(G.equipment[type]);G.equipment[type]=null;
toast('장비 해제');renderInventory();renderEquipRow();renderCharacter();saveGame()}
function repairItem(idx){const item=G.inventory[idx];if(!item)return;const cost=Math.floor((item.maxDurability-item.durability)*0.5);if(G.gold<cost){toast('골드가 부족합니다!');return}G.gold-=cost;item.durability=item.maxDurability;toast('수리 완료!');renderInventory();showItemDetail(idx);updateBars();saveGame()}
function sellItem(idx){const item=G.inventory[idx];if(!item)return;const price=Math.floor(({일반:5,매직:10,레어:15,유니크:40,에픽:100}[item.grade]||5)*(1+G.floor*0.1));G.gold+=price;G.inventory.splice(idx,1);toast(`판매 완료! 💰+${price}`);document.getElementById('item-detail-area').innerHTML='';renderInventory();updateBars();saveGame()}

// ===== SHOP =====
let currentShopTab='gold';
const GOLD_SHOP=[
{name:'빵',icon:'🍞',desc:'배고픔 30 회복',price:20,currency:'gold',action:()=>{G.hunger=Math.min(100,G.hunger+30);toast('빵을 먹었다! 🍞')}},
{name:'스테이크',icon:'🥩',desc:'배고픔 70 회복',price:50,currency:'gold',action:()=>{G.hunger=Math.min(100,G.hunger+70);toast('스테이크를 먹었다! 🥩')}},
{name:'HP 포션',icon:'🧪',desc:'HP 50 회복',price:30,currency:'gold',action:()=>{G.hp=Math.min(G.maxHP,G.hp+50);toast('HP 회복! 🧪')}},
{name:'고급 HP 포션',icon:'⚗️',desc:'HP 완전 회복',price:80,currency:'gold',action:()=>{G.hp=G.maxHP;toast('HP 완전 회복! ⚗️')}},
{name:'기분전환 맥주',icon:'🍺',desc:'기분 40 회복',price:25,currency:'gold',action:()=>{G.mood=Math.min(100,G.mood+40);toast('기분이 좋아졌다! 🍺')}},
];
const POINT_SHOP=[
{name:'엘릭서',icon:'✨',desc:'장비 내구도 영구화 (미구현)',price:50,currency:'point',action:()=>{toast('준비 중입니다!')}},
{name:'스킬 리셋',icon:'🔄',desc:'스킬 로드아웃 초기화',price:30,currency:'point',action:()=>{showScreen('skill-screen');renderSkillSelect();toast('스킬을 다시 선택하세요!')}},
{name:'캐릭터 슬롯',icon:'👤',desc:'추가 캐릭터 슬롯',price:100,currency:'point',disabled:true,action:()=>{toast('준비중...')}},
];
function renderShop(tab){currentShopTab=tab;
document.querySelectorAll('.shop-tab').forEach((t,i)=>t.classList.toggle('active',i===(tab==='gold'?0:1)));
const items=tab==='gold'?GOLD_SHOP:POINT_SHOP;
document.getElementById('shop-items').innerHTML=items.map((item,i)=>`<div class="shop-item ${item.disabled?'style="opacity:.4"':''}" onclick="buyShopItem('${tab}',${i})"><div class="s-icon">${item.icon}</div><div class="s-info"><div class="s-name">${item.name}</div><div class="s-desc">${item.desc}</div></div><div class="s-price">${tab==='gold'?'💰':'💎'} ${item.price}</div></div>`).join('')}
function switchShopTab(tab,el){renderShop(tab)}
function buyShopItem(tab,idx){const items=tab==='gold'?GOLD_SHOP:POINT_SHOP;const item=items[idx];if(item.disabled)return toast('준비중입니다!');
const cur=tab==='gold'?'gold':'points';if(G[cur]<item.price)return toast('재화가 부족합니다!');
G[cur]-=item.price;item.action();updateBars();renderCharacter();saveGame()}

// ===== MISSIONS =====
async function renderMissions(){const body=document.getElementById('mission-body');body.innerHTML='<div style="text-align:center;color:var(--text2);padding:20px">NPC 소환 중...</div>';
const cards=[];
for(let i=0;i<MISSIONS.length;i++){
const m=MISSIONS[i];
const cd=G.missionCooldowns[i]||0;const remaining=Math.max(0,cd-Date.now());const onCD=remaining>0;
// AI 대사 생성 시도
let dialogue=m.dialogue;
const aiDialogue=await generateNPCDialogueAI(m.npc,{reward:m.reward});
if(aiDialogue)dialogue=aiDialogue;
cards.push(`<div class="mission-card"><div class="cpq-badge">CPQ 미션</div><div class="npc-row"><div class="npc-avatar" style="background:${m.color}">${m.avatar}</div><div><div class="npc-name">${m.npc}</div></div></div><div class="npc-dialogue">"${dialogue}"</div><div class="mission-reward">보상: ${m.reward}</div>${onCD?`<div class="cooldown">⏳ 대기 중... ${Math.ceil(remaining/1000)}초</div>`:`<button class="btn btn-sm" onclick="completeMission(${i})">완료</button>`}</div>`);}
body.innerHTML=cards.join('');}
function completeMission(i){const m=MISSIONS[i];G.gold+=m.gold;G.points+=m.points;G.missionCooldowns[i]=Date.now()+30000;
toast(`미션 완료! 💰+${m.gold} 💎+${m.points}`);updateBars();saveGame();renderMissions();
const refreshTimer=setInterval(()=>{if(!document.getElementById('overlay-mission').classList.contains('active')){clearInterval(refreshTimer);return}renderMissions()},1000)}
