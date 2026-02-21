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
const base={ATK:[3,8],DEF:[2,6],HP:[8,20],'치명타':[1,2],'공격속도':[1,3],'관통':[2,6],'출혈 데미지':[3,8],
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
const en=LANG!=='ko';
if(skills.length===0){
const generic=en?[
{mod:'ATK x2 when HP < 30%'},
{mod:'Heal 10% HP on kill'},
{mod:'Reflect 15% damage taken'},
{mod:'All skill damage +20%'},
{mod:'Bonus attack every 5 hits'},
{mod:'Stun enemy 1s on crit'},
{mod:'20% chance invincible on hit'},
{mod:'Lifesteal 8% of damage'},
]:[
{mod:'HP 30% 이하 시 공격력 2배'},
{mod:'처치 시 HP 10% 회복'},
{mod:'받는 데미지 15% 반사'},
{mod:'전체 스킬 데미지 +20%'},
{mod:'5타마다 추가 공격 발동'},
{mod:'치명타 시 적 1초 스턴'},
{mod:'피격 시 20% 확률 무적 1턴'},
{mod:'공격 시 데미지의 8% 피흡'},
];
return generic[Math.floor(Math.random()*generic.length)];
}
const sk=skills[Math.floor(Math.random()*skills.length)];
const sn=en?t(sk.name):sk.name;
const templates=en?[
`${sn} damage +30%`,`${sn} damage +50%`,`${sn} crit damage +50%`,
`${sn} piercing effect`,`${sn} x3 damage on targets below 30% HP (execute)`,
`${sn} double shot`,`${sn} triple shot`,
`${sn} splits into 3 (hits 3 targets)`,`${sn} 50% chance extra cast on hit`,`${sn} range x2`,
`${sn} bleed on hit (DoT)`,`${sn} burn on hit (DoT)`,`${sn} poison on hit (DoT)`,
`${sn} 30% stun on hit (1 turn)`,`${sn} silence on hit (block skills)`,
`${sn} freeze on hit (next hit x1.5)`,`${sn} fear on hit (ATK -30%)`,
`${sn} heal 5% HP on cast`,`${sn} heal 10% HP on cast`,`${sn} DEF +30% on cast (1 turn)`,
`${sn} heal 15% HP on kill`,`${sn} x2 damage below 30% HP`,
`${sn} lifesteal 5%`,`${sn} lifesteal 10%`,`${sn} lifesteal 15%`,
`${sn} reflect 20% damage`,`${sn} double gold on hit`,`${sn} ignore enemy DEF on hit`,
`${sn} 20% cooldown reset on cast`,`${sn} x3 damage burst every 5 casts`,
`${sn} guaranteed crit after kill`,`${sn} steal +5 ATK on hit`,`${sn} team crit +10% on cast`,
]:[
`${sn} 데미지 +30%`,`${sn} 데미지 +50%`,`${sn} 치명타 데미지 +50%`,
`${sn} 관통 효과 추가`,`${sn} HP 30% 이하 적에게 데미지 3배 (처형)`,
`${sn} 2연속 발사`,`${sn} 3연속 발사`,
`${sn} 3갈래로 분산 (3타겟 동시 공격)`,`${sn} 적중 시 50% 확률 추가 시전`,`${sn} 범위 2배 확대`,
`${sn} 적중 시 출혈 부여 (매턴 피해)`,`${sn} 적중 시 화상 부여 (매턴 피해)`,`${sn} 적중 시 중독 부여 (매턴 피해)`,
`${sn} 적중 시 30% 확률 스턴 (1턴 행동불가)`,`${sn} 적중 시 침묵 부여 (적 스킬 사용 불가)`,
`${sn} 적중 시 빙결 (다음 피해 1.5배)`,`${sn} 적중 시 공포 부여 (적 공격력 -30%)`,
`${sn} 시전 시 HP 5% 회복`,`${sn} 시전 시 HP 10% 회복`,`${sn} 시전 시 방어력 +30% (1턴)`,
`${sn} 처치 시 HP 15% 회복`,`${sn} HP 30% 이하에서 데미지 2배`,
`${sn} 시전 시 데미지의 5% 피흡`,`${sn} 시전 시 데미지의 10% 피흡`,`${sn} 시전 시 데미지의 15% 피흡`,
`${sn} 데미지의 20% 반사`,`${sn} 적중 시 골드 2배 드롭`,`${sn} 적중 시 적 방어력 무시`,
`${sn} 시전 시 20% 확률 쿨타임 초기화`,`${sn} 5회 시전마다 데미지 3배 폭발`,
`${sn} 적 처치 시 다음 공격 반드시 크리티컬`,`${sn} 적중 시 적 공격력 흡수 (+5)`,`${sn} 시전 시 아군 전체 치명타 +10%`,
];
return{mod:templates[Math.floor(Math.random()*templates.length)],skillName:sk.name};
}

async function fetchRandomItemFromAPI(type){
try{
const res=await fetch(`https://symmetry-api.harpy922.workers.dev/api/items/random?type=${type}`);
if(!res.ok){console.warn('[SVG] API fail:',res.status);return null}
const data=await res.json();
console.log('[SVG] OK:',data.name,!!data.svg);
return data;
}catch(e){console.warn('[SVG] fetch error:',e.message);return null}}

async function generateItem(){
const allTypes=['helmet','chest','gloves','pants','boots','weapon','necklace','ring1','ring2','offhand'];
const type=allTypes[Math.floor(Math.random()*allTypes.length)];

// Try fetching from API
const apiItem=await fetchRandomItemFromAPI(type);

let name,emoji,svgData;
console.log('[ITEM] apiItem:',apiItem?'loaded':'null','type:',type);
if(apiItem){
emoji=apiItem.svg?'':ITEM_EMOJIS[type]?.[Math.floor(Math.random()*(ITEM_EMOJIS[type]?.length||1))]||'📦';
svgData=apiItem.svg||null;
if(LANG==='ko'){name=apiItem.name}else{
// API returns Korean names; generate English name locally
let suffixes;
if(type==='weapon'&&CLASS_WEAPONS[G.className]){suffixes=CLASS_WEAPONS[G.className].names}
else{suffixes=ITEM_SUFFIX[type]}
const si=Math.floor(Math.random()*suffixes.length);
const prefix=ITEM_PREFIX[Math.floor(Math.random()*ITEM_PREFIX.length)];
const material=ITEM_MATERIAL[Math.floor(Math.random()*ITEM_MATERIAL.length)];
name=`${t(prefix)} ${t(material)} ${t(suffixes[si])}`;
}
}else{
let suffixes,emojis;
if(type==='weapon'&&CLASS_WEAPONS[G.className]){
const cw=CLASS_WEAPONS[G.className];suffixes=cw.names;emojis=cw.emojis;
}else{suffixes=ITEM_SUFFIX[type];emojis=ITEM_EMOJIS[type]}
const si=Math.floor(Math.random()*suffixes.length);
const prefix=ITEM_PREFIX[Math.floor(Math.random()*ITEM_PREFIX.length)];
const material=ITEM_MATERIAL[Math.floor(Math.random()*ITEM_MATERIAL.length)];
name=LANG==='ko'?`${prefix} ${material}의 ${suffixes[si]}`:`${t(prefix)} ${t(material)} ${t(suffixes[si])}`;
emoji=emojis[si];svgData=null;
}

const roll=Math.random()*100;let grade='Normal';
// Normal45% Magic30% Rare15% Unique8% Epic2%
if(roll<2)grade='Epic';else if(roll<10)grade='Unique';else if(roll<25)grade='Rare';else if(roll<55)grade='Magic';
const gMult={Normal:1,Magic:1.3,Rare:1.5,Unique:2.2,Epic:3.5}[grade];
const floorMult=1+G.floor*0.1;

// 등급별 스탯 옵션 개수: Normal=1, Magic=2, Rare=3, Unique=3, Epic=3
const statCount={Normal:1,Magic:2,Rare:3,Unique:3,Epic:3}[grade];
const stats={};
const pool=[...STAT_POOL[type]];
for(let i=0;i<statCount&&pool.length>0;i++){
const idx=Math.floor(Math.random()*pool.length);
const stat=pool.splice(idx,1)[0];
stats[stat]=rollStatValue(stat,gMult,floorMult);
}

// 스킬 강화 커스텀 옵션: 유니크=1, 에픽=2 (AI 우선, fallback 로컬)
let skillMods=[];
const modCount=grade==='Epic'?2:grade==='Unique'?1:0;
if(modCount>0){
const aiMods=await generateSkillCustomAI(modCount);
if(aiMods&&aiMods.length>=modCount){skillMods=aiMods.slice(0,modCount)}
else{
const usedMods=new Set();
for(let m=0;m<modCount;m++){
let custom;let tries=0;
do{custom=generateSkillCustom();tries++}while(usedMods.has(custom.mod)&&tries<10);
usedMods.add(custom.mod);skillMods.push(custom);
}}}

const durability=Math.floor({Normal:50,Magic:65,Rare:80,Unique:120,Epic:180}[grade]*(0.8+Math.random()*0.4));
return{id:Date.now()+Math.random(),name,type,grade,emoji:emoji||'📦',svgData,stats,skillMods,durability,maxDurability:durability,desc:FLAVOR_TEXTS[Math.floor(Math.random()*FLAVOR_TEXTS.length)]}}

// ===== INVENTORY =====
let invFilter=null;
const GRADE_ORDER={Epic:0,Unique:1,Rare:2,Magic:3,Normal:4};
function renderInventory(filter){invFilter=filter||null;
const detail=document.getElementById('item-detail-area');detail.innerHTML='';
const grid=document.getElementById('inv-grid');grid.innerHTML='';
const isPC=window.innerWidth>=769;
// 등급순 정렬 (원본 인덱스 유지)
const sorted=G.inventory.map((item,i)=>({item,idx:i})).sort((a,b)=>{
if(!a.item&&!b.item)return 0;if(!a.item)return 1;if(!b.item)return -1;
return (GRADE_ORDER[a.item.grade]??5)-(GRADE_ORDER[b.item.grade]??5);
});
for(let i=0;i<30;i++){const entry=sorted[i];const item=entry?entry.item:null;const origIdx=entry?entry.idx:i;const d=document.createElement('div');d.className='inv-slot'+(item?' grade-'+item.grade:'');
if(item){
if(isPC){
// PC: 셀 안에 이름+스탯+옵션 + 배경 아이콘
const iconSmall=item.svgData?`<div class="item-svg">${item.svgData}</div>`:`<span style="font-size:16px">${item.emoji}</span>`;
const bgIcon=item.svgData?`<div class="inv-bg-icon"><div class="item-svg">${item.svgData}</div></div>`:`<div class="inv-bg-icon">${item.emoji}</div>`;
const nameColor=GRADE_COLORS[item.grade]||'var(--text1)';
const stats=Object.entries(item.stats).map(([k,v])=>`${tStat(k)}+${v}`).join(' / ');
const mods=(item.skillMods&&item.skillMods.length)?item.skillMods.map(m=>`✦ ${m.mod}`).join('<br>'):'';
d.innerHTML=`${bgIcon}<div class="inv-item-header">${iconSmall}<span class="inv-item-name" style="color:${nameColor}">${item.name}</span></div><div class="inv-item-stats">${stats}</div>${mods?`<div class="inv-item-mods">${mods}</div>`:''}<div class="dur-bar"><div class="dur-fill" style="width:${item.durability/item.maxDurability*100}%"></div></div>`;
}else{
// 모바일: 기존 아이콘만
const icon=item.svgData?`<div class="item-svg">${item.svgData}</div>`:`<span>${item.emoji}</span>`;
d.innerHTML=`${icon}<div class="dur-bar"><div class="dur-fill" style="width:${item.durability/item.maxDurability*100}%"></div></div>`;
}
d.onclick=()=>showItemDetail(origIdx)}
grid.appendChild(d)}}

function showItemDetail(idx){const item=G.inventory[idx];if(!item)return;
const d=document.getElementById('item-detail-area');
const statsHTML=Object.entries(item.stats).map(([k,v])=>`<div>${tStat(k)}: +${v}</div>`).join('');
const modsHTML=(item.skillMods&&item.skillMods.length)?`<div class="item-mods"><div style="color:var(--gold);font-size:11px;margin-top:6px">${t('✦ 스킬 옵션')}</div>`+item.skillMods.map(m=>`<div style="color:var(--cyan);font-size:12px">• ${m.mod}</div>`).join('')+'</div>':'';
const slotNameMap={weapon:t('주무기'),offhand:t('보조무기'),helmet:t('투구'),chest:t('상의'),gloves:t('장갑'),pants:t('바지'),boots:t('신발'),necklace:t('목걸이'),ring1:t('반지'),ring2:t('반지')};
const isEquipped=Object.values(G.equipment).some(e=>e&&e.id===item.id);
// 다른 캐릭에 장착되어있는지도 체크
let equippedBy=-1;
if(G.party){G.party.forEach((p,si)=>{if(p&&p.equipment){Object.values(p.equipment).forEach(e=>{if(e&&e.id===item.id)equippedBy=si})}})}
const sellPrice=Math.floor(({Normal:5,Magic:10,Rare:15,Unique:40,Epic:100}[item.grade]||5)*(1+G.floor*0.1));
const detailIcon=item.svgData?`<div class="item-svg item-svg-lg">${item.svgData}</div>`:`<div style="font-size:36px">${item.emoji}</div>`;
// 캐릭별 장착 버튼
let equipBtns='';
if(!isEquipped&&equippedBy<0){
for(let s=0;s<3;s++){
if(G.slotUnlocked&&G.slotUnlocked[s]&&G.party&&G.party[s]){
const cn=G.party[s].className||('캐릭'+(s+1));
equipBtns+=`<button class="btn btn-sm" onclick="equipItemToChar(${idx},${s})">${t(cn)}${s===G.activeSlot?' '+t('(현재)'):''}</button> `;
}}
}else if(isEquipped){
equipBtns=`<button class="btn btn-sm btn-secondary" onclick="unequipItem('${item.type}')">${t('해제')}</button>`;
}
d.innerHTML=`<div class="item-detail">${detailIcon}<div class="item-name grade-${item.grade}-text" style="color:${GRADE_COLORS[item.grade]}">${item.name}</div><div class="item-grade" style="color:${GRADE_COLORS[item.grade]}">${t(item.grade)} ${slotNameMap[item.type]||item.type}</div><div class="item-stats">${statsHTML}</div>${modsHTML}<div style="font-size:12px;color:var(--text2)">${t('내구도:')} ${item.durability}/${item.maxDurability}</div><div class="item-desc">${t(item.desc)}</div><div class="item-actions">${equipBtns}<button class="btn btn-sm btn-secondary" onclick="repairItem(${idx})">${t('수리')} (💰${Math.floor((item.maxDurability-item.durability)*0.5)})</button><button class="btn btn-sm btn-secondary" onclick="sellItem(${idx})">${t('판매')} (💰${sellPrice})</button></div></div>`}

function equipItem(idx){equipItemToChar(idx,G.activeSlot)}
function equipItemToChar(idx,slot){
const item=G.inventory[idx];if(!item)return;
saveCharToSlot(); // 현재 상태 저장
const targetChar=G.party[slot];if(!targetChar)return;
// 반지는 빈 슬롯 우선, 없으면 같은 타입 교체
let eqSlot=item.type;
if(item.type==='ring1'||item.type==='ring2'){
if(!targetChar.equipment)targetChar.equipment={};
if(!targetChar.equipment.ring1)eqSlot='ring1';
else if(!targetChar.equipment.ring2)eqSlot='ring2';
else eqSlot=item.type; // 둘 다 차있으면 같은 타입 교체
}
// 대상 캐릭 기존 장비 → 공용 인벤토리
if(targetChar.equipment&&targetChar.equipment[eqSlot]){
G.inventory.push(targetChar.equipment[eqSlot]);
}
// 인벤토리에서 제거 후 장착
G.inventory.splice(idx,1);
if(!targetChar.equipment)targetChar.equipment={};
targetChar.equipment[eqSlot]=item;
G.party[slot]=targetChar;
if(slot===G.activeSlot)loadSlotToG(slot);
const charName=targetChar.className||('캐릭'+(slot+1));
toast(`${item.name} → ${t(charName)} ${t('장착!')}`);
renderInventory();renderEquipRow();renderCharacter();saveGame();
}
function unequipItem(type){if(!G.equipment[type])return;G.inventory.push(G.equipment[type]);G.equipment[type]=null;
toast(t('장비 해제'));renderInventory();renderEquipRow();renderCharacter();saveGame()}
function repairItem(idx){const item=G.inventory[idx];if(!item)return;const cost=Math.floor((item.maxDurability-item.durability)*0.5);if(G.gold<cost){toast(t('골드가 부족합니다!'));return}G.gold-=cost;item.durability=item.maxDurability;toast(t('수리 완료!'));renderInventory();showItemDetail(idx);updateBars();saveGame()}
function sellItem(idx){const item=G.inventory[idx];if(!item)return;const price=Math.floor(({Normal:5,Magic:10,Rare:15,Unique:40,Epic:100}[item.grade]||5)*(1+G.floor*0.1));G.gold+=price;G.inventory.splice(idx,1);toast(t('판매 완료!')+` 💰+${price}`);document.getElementById('item-detail-area').innerHTML='';renderInventory();updateBars();saveGame()}

function bulkSell(belowGrade){
const gradeRank={Normal:0,Magic:1,Rare:2,Unique:3,Epic:4};
const threshold=gradeRank[belowGrade]||0;
// 장착된 아이템 id 수집
const equippedIds=new Set();
if(G.party){G.party.forEach(p=>{if(p&&p.equipment){Object.values(p.equipment).forEach(e=>{if(e)equippedIds.add(e.id)})}})}
const toSell=G.inventory.filter(item=>item&&(gradeRank[item.grade]??0)<threshold&&!equippedIds.has(item.id));
if(toSell.length===0)return toast(t('판매할 장비가 없습니다'));
if(!confirm(t('{0} 미만 장비 {1}개를 판매할까요?',t(belowGrade),toSell.length)))return;
let totalGold=0;
for(const item of toSell){
const price=Math.floor(({Normal:5,Magic:10,Rare:15,Unique:40,Epic:100}[item.grade]||5)*(1+G.floor*0.1));
totalGold+=price;
const idx=G.inventory.indexOf(item);
if(idx>=0)G.inventory.splice(idx,1);
}
G.gold+=totalGold;
toast(t('{0}개 판매! 💰+{1}',toSell.length,totalGold));
document.getElementById('item-detail-area').innerHTML='';
renderInventory();updateBars();saveGame();
}

// ===== SHOP =====
let currentShopTab='gold';

// 골드 상점: 소비 아이템 + 스탯 업그레이드
function getStatUpgradePrice(stat){
const count=G._statUpgrades?G._statUpgrades[stat]||0:0;
return Math.floor(100*(1.3**count)); // 130% 씩 증가
}
function getStatUpgradeCount(stat){return G._statUpgrades?G._statUpgrades[stat]||0:0}

const GOLD_CONSUMABLES=[
{name:'빵',icon:'🍞',desc:'배고픔 30 회복',price:20,action:()=>{G.hunger=Math.min(100,G.hunger+30);toast(t('빵을 먹었다! 🍞'))}},
{name:'스테이크',icon:'🥩',desc:'배고픔 70 회복',price:50,action:()=>{G.hunger=Math.min(100,G.hunger+70);toast(t('스테이크를 먹었다! 🥩'))}},
{name:'HP 포션',icon:'🧪',desc:'HP 50 회복',price:30,action:()=>{G.hp=Math.min(G.maxHP,G.hp+50);toast(t('HP 회복! 🧪'))}},
{name:'고급 HP 포션',icon:'⚗️',desc:'HP 완전 회복',price:80,action:()=>{G.hp=G.maxHP;toast(t('HP 완전 회복! ⚗️'))}},
{name:'기분전환 맥주',icon:'🍺',desc:'기분 40 회복',price:25,action:()=>{G.mood=Math.min(100,G.mood+40);toast(t('기분이 좋아졌다! 🍺'))}},
];

const STAT_UPGRADES=[
{stat:'maxHP',name:'HP 강화',icon:'❤️',desc:'최대 HP +10',value:10},
{stat:'atk',name:'공격력 강화',icon:'⚔️',desc:'공격력 +3',value:3},
{stat:'def',name:'방어력 강화',icon:'🛡️',desc:'방어력 +2',value:2},
{stat:'critBonus',name:'치명타 강화',icon:'💥',desc:'치명타 확률 +1%',value:1},
];

function buyStatUpgrade(idx){
const u=STAT_UPGRADES[idx];
const price=getStatUpgradePrice(u.stat);
if(G.gold<price)return toast('골드가 부족합니다!');
G.gold-=price;
if(!G._statUpgrades)G._statUpgrades={};
G._statUpgrades[u.stat]=(G._statUpgrades[u.stat]||0)+1;
G[u.stat]=(G[u.stat]||0)+u.value;
if(u.stat==='maxHP')G.hp=Math.min(G.hp+u.value,G.maxHP);
toast(`${u.icon} ${t(u.name)} ${t('완료')}! (+${u.value})`);
updateBars();renderCharacter();saveGame();renderShop('gold');
}

// 다이아 상점: 유니크/에픽 아이템 + 스킬 리셋
async function buyRandomItem(grade){
const prices={Unique:50,Epic:150};
const price=prices[grade];
if(G.points<price)return toast(t('💎가 부족합니다!'));
if(G.inventory.length>=30)return toast(t('인벤토리가 가득 찼습니다!'));
G.points-=price;
toast(t('아이템 생성 중...'));
// generateItem을 활용하되 등급 강제
const item=await generateItemForGrade(grade);
G.inventory.push(item);
updateBars();saveGame();renderShop('point');
showItemDropPopup(item);
}

async function generateItemForGrade(grade){
const allTypes=['helmet','chest','gloves','pants','boots','weapon','necklace','ring1','ring2','offhand'];
const type=allTypes[Math.floor(Math.random()*allTypes.length)];
const apiItem=await fetchRandomItemFromAPI(type);
let name,emoji,svgData;
if(apiItem){emoji=apiItem.svg?'':ITEM_EMOJIS[type]?.[Math.floor(Math.random()*(ITEM_EMOJIS[type]?.length||1))]||'📦';svgData=apiItem.svg||null;
if(LANG==='ko'){name=apiItem.name}else{const suffixes=ITEM_SUFFIX[type];const si=Math.floor(Math.random()*suffixes.length);const _p=ITEM_PREFIX[Math.floor(Math.random()*ITEM_PREFIX.length)];const _m=ITEM_MATERIAL[Math.floor(Math.random()*ITEM_MATERIAL.length)];name=`${t(_p)} ${t(_m)} ${t(suffixes[si])}`}}
else{const suffixes=ITEM_SUFFIX[type];const emojis=ITEM_EMOJIS[type];const si=Math.floor(Math.random()*suffixes.length);const _p=ITEM_PREFIX[Math.floor(Math.random()*ITEM_PREFIX.length)];const _m=ITEM_MATERIAL[Math.floor(Math.random()*ITEM_MATERIAL.length)];name=LANG==='ko'?`${_p} ${_m}의 ${suffixes[si]}`:`${t(_p)} ${t(_m)} ${t(suffixes[si])}`;emoji=emojis[si];svgData=null}
const gMult={Unique:2.2,Epic:3.5}[grade];
const floorMult=1+G.floor*0.1;
const stats={};const pool=[...STAT_POOL[type]];
for(let i=0;i<3&&pool.length>0;i++){const idx=Math.floor(Math.random()*pool.length);stats[pool.splice(idx,1)[0]]=rollStatValue(pool[0]||'ATK',gMult,floorMult)}
let skillMods=[];const modCount=grade==='Epic'?2:1;
const aiMods=await generateSkillCustomAI(modCount);
if(aiMods&&aiMods.length>=modCount){skillMods=aiMods.slice(0,modCount)}
else{for(let m=0;m<modCount;m++)skillMods.push(generateSkillCustom())}
const durability=Math.floor({Unique:120,Epic:180}[grade]*(0.8+Math.random()*0.4));
return{id:Date.now()+Math.random(),name,type,grade,emoji:emoji||'📦',svgData,stats,skillMods,durability,maxDurability:durability,desc:FLAVOR_TEXTS[Math.floor(Math.random()*FLAVOR_TEXTS.length)]}
}

function renderShop(tab){currentShopTab=tab;
document.querySelectorAll('.shop-tab').forEach((t,i)=>t.classList.toggle('active',i===(tab==='gold'?0:1)));
const container=document.getElementById('shop-items');
if(tab==='gold'){
// 소비 아이템
let html=`<div class="shop-section-title">🧪 ${t('소비 아이템')}</div>`;
html+=GOLD_CONSUMABLES.map((item,i)=>`<div class="shop-item" onclick="buyGoldConsumable(${i})"><div class="s-icon">${item.icon}</div><div class="s-info"><div class="s-name">${t(item.name)}</div><div class="s-desc">${t(item.desc)}</div></div><div class="s-price">💰 ${item.price}</div></div>`).join('');
// 스탯 업그레이드
html+=`<div class="shop-section-title" style="margin-top:16px">💪 ${t('스탯 강화')}</div>`;
// 전직
const changePrice=500+G.level*50;
html+=`<div class="shop-item" onclick="startCharChange()"><div class="s-icon">🔄</div><div class="s-info"><div class="s-name">${t('전직')}</div><div class="s-desc">${t('캐릭터의 직업을 변경합니다 (레벨 유지)')}</div></div><div class="s-price">💰 ${changePrice.toLocaleString()}</div></div>`;
html+=STAT_UPGRADES.map((u,i)=>{
const count=getStatUpgradeCount(u.stat);
const price=getStatUpgradePrice(u.stat);
return`<div class="shop-item" onclick="buyStatUpgrade(${i})"><div class="s-icon">${u.icon}</div><div class="s-info"><div class="s-name">${t(u.name)} <span style="color:var(--cyan);font-size:11px">Lv.${count}</span></div><div class="s-desc">${t(u.desc)}</div></div><div class="s-price">💰 ${price.toLocaleString()}</div></div>`}).join('');
container.innerHTML=html;
}else{
// 다이아 상점: 아이템 구매 + 스킬 리셋
let html=`<div class="shop-section-title">📦 ${t('아이템 구매')}</div>`;
html+=`<div class="shop-item" onclick="buyRandomItem('Unique')"><div class="s-icon" style="color:var(--purple)">💜</div><div class="s-info"><div class="s-name" style="color:var(--purple)">${t('유니크 아이템 상자')}</div><div class="s-desc">${t('랜덤 유니크 등급 장비 획득')}</div></div><div class="s-price">💎 50</div></div>`;
html+=`<div class="shop-item" onclick="buyRandomItem('Epic')"><div class="s-icon" style="color:var(--orange)">🧡</div><div class="s-info"><div class="s-name" style="color:var(--orange)">${t('에픽 아이템 상자')}</div><div class="s-desc">${t('랜덤 에픽 등급 장비 획득')}</div></div><div class="s-price">💎 150</div></div>`;
html+=`<div class="shop-section-title" style="margin-top:16px">⚙️ ${t('기타')}</div>`;
html+=`<div class="shop-item" onclick="buySkillReset()"><div class="s-icon">🔄</div><div class="s-info"><div class="s-name">${t('스킬 리셋')}</div><div class="s-desc">${t('장착된 스킬 초기화')}</div></div><div class="s-price">💎 30</div></div>`;
container.innerHTML=html;
}
}
function switchShopTab(tab,el){renderShop(tab)}
function buyGoldConsumable(idx){const item=GOLD_CONSUMABLES[idx];
if(G.gold<item.price)return toast(t('골드가 부족합니다!'));
G.gold-=item.price;item.action();updateBars();renderCharacter();saveGame()}
function buySkillReset(){
if(G.points<30)return toast(t('💎가 부족합니다!'));
G.points-=30;G.equippedSkills=[];G.equippedPassives=[];
toast('🔄 스킬이 초기화되었습니다!');updateBars();saveGame();renderShop('point');
}

// ===== CPQ MISSIONS =====
const CPQ_API='https://symmetry-api.harpy922.workers.dev';
let _cpqMissions=[];

// 유저 UUID (localStorage 영구 저장)
function getCPQUserId(){
let uid=localStorage.getItem('sym_uid');
if(uid){
// 기존 소문자 UUID → 대문자 IDFA 형식으로 마이그레이션
const upper=uid.toUpperCase();
if(uid!==upper){localStorage.setItem('sym_uid',upper);uid=upper}
return uid;
}
uid=crypto.randomUUID().toUpperCase();
localStorage.setItem('sym_uid',uid);
return uid;
}
// 접속 즉시 UUID 확보
getCPQUserId();

const NPC_POOL=[
{npc:'대장장이 모루스',avatar:'🔨',color:'#8B4513'},
{npc:'마법사 엘드린',avatar:'🧙',color:'#4B0082'},
{npc:'정찰병 카이',avatar:'🏹',color:'#2F4F4F'},
{npc:'주점주인 릴라',avatar:'🍺',color:'#8B008B'},
{npc:'상인 벨로',avatar:'💰',color:'#DAA520'},
{npc:'연금술사 니카',avatar:'⚗️',color:'#006400'},
];

// 미수령 보상 체크 + 지급
async function checkPendingRewards(){
try{
const uid=getCPQUserId();
const res=await fetch(CPQ_API+'/api/cpq/rewards?user_id='+uid);
const data=await res.json();
if(data.rewards&&data.rewards.length>0){
// 보상 수령
const claimRes=await fetch(CPQ_API+'/api/cpq/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:uid})});
const claimData=await claimRes.json();
if(claimData.claimed>0){
const goldPer=80;const pointsPer=15;
const totalGold=claimData.claimed*goldPer;
const totalPoints=claimData.claimed*pointsPer;
G.gold+=totalGold;G.points+=totalPoints;
updateBars();saveGame();
toast(t('🎁 미션 보상 {0}건 수령! 💰+{1} 💎+{2}',claimData.claimed,totalGold,totalPoints));
}
}
}catch(e){console.warn('[CPQ] reward check error:',e.message)}
}

// ── EN local missions ──
const LOCAL_MISSIONS=[
{id:'lm_kill50',name:'Kill 50 Monsters',desc:'Slay 50 creatures in battle',stat:'dailyKills',target:50,reward:{gold:500}},
{id:'lm_floor5',name:'Clear 5 Floors',desc:'Advance through 5 dungeon floors',stat:'_floor',target:5,reward:{gold:800}},
{id:'lm_boss3',name:'Defeat 3 Bosses',desc:'Take down 3 boss enemies',stat:'dailyBossKills',target:3,reward:{gold:1000}},
{id:'lm_level10',name:'Reach Level 10',desc:'Train until you reach level 10',stat:'_level',target:10,reward:{dia:5}},
{id:'lm_equip',name:'Equip All Gear Slots',desc:'Fill every equipment slot',stat:'_equipAll',target:1,reward:{dia:3}},
{id:'lm_nodeath5',name:'Win 5 Battles Unscathed',desc:'Win 5 battles without dying',stat:'dailyBattles',target:5,reward:{gold:600}},
{id:'lm_items3',name:'Collect 3 Items',desc:'Find 3 items from monsters',stat:'dailyItems',target:3,reward:{dia:2}},
{id:'lm_gold5k',name:'Earn 5,000 Gold',desc:'Accumulate 5,000 gold from battles',stat:'dailyGoldEarned',target:5000,reward:{dia:5}},
{id:'lm_battle20',name:'Complete 20 Hunts',desc:'Finish 20 hunting expeditions',stat:'dailyBattles',target:20,reward:{gold:1200}},
{id:'lm_crit30',name:'Land 30 Critical Hits',desc:'Strike critically 30 times',stat:'dailyCrits',target:30,reward:{dia:4}},
];

function _getLocalMissionProgress(m){
if(m.stat==='_floor')return G.floor||0;
if(m.stat==='_level')return G.level||1;
if(m.stat==='_equipAll'){
const slots=['weapon','armor','accessory','helmet','boots','gloves'];
const filled=slots.filter(s=>G.equipped&&G.equipped[s]).length;
return filled>=slots.length?1:0;
}
return (G.dailyStats&&G.dailyStats[m.stat])||0;
}

function claimLocalMission(idx){
const m=LOCAL_MISSIONS[idx];if(!m)return;
const prog=_getLocalMissionProgress(m);
if(prog<m.target)return toast('Not completed yet!');
if(G.missionCooldowns[m.id])return toast('Already claimed!');
G.missionCooldowns[m.id]=true;
if(m.reward.gold){G.gold+=m.reward.gold}
if(m.reward.dia){G.points=(G.points||0)+m.reward.dia}
toast(`🎁 Mission reward! ${m.reward.gold?'💰+'+m.reward.gold+' ':''}${m.reward.dia?'💎+'+m.reward.dia:''}`);
updateBars();saveGame();renderMissions();
}

async function renderMissions(){
const body=document.getElementById('mission-body');
body.innerHTML=`<div style="text-align:center;color:var(--text2);padding:20px">${t('📋 미션 불러오는 중...')}</div>`;

if(LANG==='ko'){
// ── Korean: ADBC campaigns ──
await checkPendingRewards();

try{
const res=await fetch(CPQ_API+'/api/cpq/campaigns?count=30');
const data=await res.json();
_cpqMissions=data.missions||[];
}catch(e){_cpqMissions=[];}

if(_cpqMissions.length===0){
body.innerHTML=`<div class="mission-empty">📋<br>${t('현재 진행 가능한 미션이 없습니다.')}<br><span style="font-size:12px;opacity:.6">${t('잠시 후 다시 확인해 주세요')}</span></div>`;
return;
}

const cards=[];
for(let i=0;i<_cpqMissions.length;i++){
const m=_cpqMissions[i];
const npc=NPC_POOL[i%NPC_POOL.length];
const joined=!!G.missionCooldowns['cpq_'+m.id];
const goldReward=80;
const pointReward=15;

let actionHTML='';
if(joined){
actionHTML=`<div class="mc-action"><div class="cooldown">${t('✅ 참여 완료')}</div></div>`;
}else{
actionHTML=`<div class="mc-action"><button class="btn cpq-link-btn" onclick="joinCPQ(${i})">${t('⚔️ 의뢰 수행')}</button></div>`;
}

cards.push(`<div class="mission-card${joined?' mission-done':''}">
<div class="mc-header"><div class="npc-avatar" style="background:${npc.color}">${npc.avatar}</div>
<div class="mc-header-info"><div class="npc-name">${t(npc.npc)}</div><div class="mission-title">${m.name||t('의뢰')}</div></div></div>
<div class="mc-body"><div class="mission-reward"><span class="reward-tag gold">💰 ${goldReward}</span><span class="reward-tag dia">💎 ${pointReward}</span></div></div>
${actionHTML}
</div>`);
}
body.innerHTML=`<div class="mission-list">${cards.join('')}</div>`;

}else{
// ── English: local gameplay missions ──
const cards=[];
for(let i=0;i<LOCAL_MISSIONS.length;i++){
const m=LOCAL_MISSIONS[i];
const npc=NPC_POOL[i%NPC_POOL.length];
const prog=_getLocalMissionProgress(m);
const claimed=!!G.missionCooldowns[m.id];
const done=prog>=m.target;

const rewardTags=`${m.reward.gold?'<span class="reward-tag gold">💰 '+m.reward.gold+'</span>':''}${m.reward.dia?'<span class="reward-tag dia">💎 '+m.reward.dia+'</span>':''}`;
const progressBar=`<div style="margin-top:4px;font-size:11px;color:var(--text2)">${Math.min(prog,m.target)} / ${m.target}</div>`;

let actionHTML='';
if(claimed){
actionHTML=`<div class="mc-action"><div class="cooldown">✅ Claimed</div></div>`;
}else if(done){
actionHTML=`<div class="mc-action"><button class="btn cpq-link-btn" onclick="claimLocalMission(${i})">🎁 Claim Reward</button></div>`;
}else{
actionHTML=`<div class="mc-action"><div class="cooldown" style="opacity:.5">⏳ In Progress</div></div>`;
}

cards.push(`<div class="mission-card${claimed?' mission-done':''}">
<div class="mc-header"><div class="npc-avatar" style="background:${npc.color}">${npc.avatar}</div>
<div class="mc-header-info"><div class="npc-name">${t(npc.npc)}</div><div class="mission-title">${m.name}</div></div></div>
<div class="mc-body"><div class="mission-desc" style="font-size:12px;color:var(--text2);margin-bottom:4px">${m.desc}</div><div class="mission-reward">${rewardTags}</div>${progressBar}</div>
${actionHTML}
</div>`);
}
body.innerHTML=`<div class="mission-list">${cards.join('')}</div>`;
}
}

async function joinCPQ(idx){
const m=_cpqMissions[idx];if(!m)return toast(t('미션 정보가 없습니다'));
const uid=getCPQUserId();
try{
const res=await fetch(CPQ_API+'/api/cpq/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:uid,campaign_id:m.id})});
const data=await res.json();
if(data.redirect_url){
// 영구 참여 기록
G.missionCooldowns['cpq_'+m.id]=true;
saveGame();
// 새 탭으로 광고 페이지 열기
window.open(data.redirect_url,'_blank');
toast(t('의뢰 수행 중... 완료되면 보상이 자동 지급됩니다!'));
// 탭 복귀 시 포스트백 보상 체크
const onReturn=()=>{
if(document.visibilityState==='visible'){
document.removeEventListener('visibilitychange',onReturn);
checkPendingRewards().then(()=>renderMissions());
}
};
document.addEventListener('visibilitychange',onReturn);
}else{
toast(t('미션 참여 실패:')+' '+(data.error||''));
}
}catch(e){toast(t('미션 참여 실패:')+' '+e.message)}
}
