// ===== ACHIEVEMENT SYSTEM =====
const ACHIEVEMENTS=[
// 전투
{id:'first_win',name:'첫 승리',desc:'첫 전투에서 승리',icon:'⚔️',reward:{dia:5},check:s=>s.kills>=1},
{id:'kill_100',name:'백인참',desc:'몬스터 100마리 처치',icon:'💀',reward:{dia:10},check:s=>s.kills>=100},
{id:'kill_500',name:'학살자',desc:'몬스터 500마리 처치',icon:'☠️',reward:{dia:20},check:s=>s.kills>=500},
{id:'kill_1000',name:'전설의 사냥꾼',desc:'몬스터 1000마리 처치',icon:'🏆',reward:{dia:50},check:s=>s.kills>=1000},
{id:'crit_50',name:'급소 사냥꾼',desc:'크리티컬 50회 달성',icon:'💥',reward:{dia:10},check:s=>s.crits>=50},
{id:'crit_200',name:'크리티컬 마스터',desc:'크리티컬 200회 달성',icon:'🎯',reward:{dia:20},check:s=>s.crits>=200},
{id:'boss_1',name:'보스 슬레이어',desc:'보스 1마리 처치',icon:'👹',reward:{dia:10},check:s=>s.bossKills>=1},
{id:'boss_10',name:'보스 헌터',desc:'보스 10마리 처치',icon:'🐉',reward:{dia:30},check:s=>s.bossKills>=10},
{id:'boss_50',name:'보스의 천적',desc:'보스 50마리 처치',icon:'👑',reward:{dia:50},check:s=>s.bossKills>=50},
// 성장
{id:'lv10',name:'견습 모험가',desc:'레벨 10 달성',icon:'⭐',reward:{dia:10},check:s=>(G.level||1)>=10},
{id:'lv30',name:'숙련 모험가',desc:'레벨 30 달성',icon:'🌟',reward:{dia:20},check:s=>(G.level||1)>=30},
{id:'lv50',name:'베테랑',desc:'레벨 50 달성',icon:'✨',reward:{dia:30},check:s=>(G.level||1)>=50},
{id:'lv100',name:'전설',desc:'레벨 100 달성',icon:'🏅',reward:{dia:100},check:s=>(G.level||1)>=100},
{id:'party_2',name:'동료 합류',desc:'파티원 2명 구성',icon:'👥',reward:{dia:15},check:s=>{let c=0;if(G.slotUnlocked)G.slotUnlocked.forEach(u=>{if(u)c++});return c>=2}},
{id:'party_3',name:'풀 파티',desc:'파티원 3명 구성',icon:'👨‍👩‍👦',reward:{dia:30},check:s=>{let c=0;if(G.slotUnlocked)G.slotUnlocked.forEach(u=>{if(u)c++});return c>=3}},
{id:'fullset',name:'풀 장비',desc:'모든 장비 슬롯 장착',icon:'🛡️',reward:{dia:20},check:s=>{const eq=G.equipment;return eq&&eq.helmet&&eq.chest&&eq.gloves&&eq.pants&&eq.boots&&eq.weapon&&eq.necklace&&eq.ring1&&eq.ring2&&eq.offhand}},
// 층 진행
{id:'floor10',name:'10층 돌파',desc:'10층 도달',icon:'🏔️',reward:{dia:10},check:s=>(G.floor||1)>=10},
{id:'floor25',name:'25층 돌파',desc:'25층 도달',icon:'⛰️',reward:{dia:20},check:s=>(G.floor||1)>=25},
{id:'floor50',name:'50층 돌파',desc:'50층 도달',icon:'🗻',reward:{dia:50},check:s=>(G.floor||1)>=50},
{id:'floor100',name:'100층 정복',desc:'100층 도달',icon:'🌌',reward:{dia:100},check:s=>(G.floor||1)>=100},
// 재화
{id:'gold_10k',name:'부자의 길',desc:'골드 10,000 보유',icon:'💰',reward:{dia:10},check:s=>(G.gold||0)>=10000},
{id:'gold_100k',name:'거부',desc:'골드 100,000 보유',icon:'💎',reward:{dia:30},check:s=>(G.gold||0)>=100000},
// 도전
{id:'tower_10',name:'탑 10층',desc:'무한의 탑 10층 돌파',icon:'🗼',reward:{dia:20},check:s=>(G.towerBest||0)>=10},
{id:'tower_30',name:'탑 30층',desc:'무한의 탑 30층 돌파',icon:'🏗️',reward:{dia:50},check:s=>(G.towerBest||0)>=30},
{id:'tower_50',name:'탑의 지배자',desc:'무한의 탑 50층 돌파',icon:'🏛️',reward:{dia:100},check:s=>(G.towerBest||0)>=50},
{id:'pvp_1',name:'첫 대전',desc:'PvP 1회 참여',icon:'🤺',reward:{dia:10},check:s=>(G.pvpCount||0)>=1},
{id:'pvp_10',name:'투사',desc:'PvP 10회 승리',icon:'🏆',reward:{dia:30},check:s=>(G.pvpWins||0)>=10},
{id:'daily_7',name:'개근상',desc:'일일 퀘스트 7일 완료',icon:'📅',reward:{dia:30},check:s=>(G.dailyStreak||0)>=7},
{id:'horde_1',name:'군단 정복자',desc:'무한의 적 100마리 전멸',icon:'💀',reward:{dia:50},check:s=>(G.hordeClears||0)>=1},
];

function initStats(){
if(!G.stats)G.stats={kills:0,crits:0,bossKills:0,totalDmg:0,deaths:0,itemsFound:0,goldEarned:0};
if(!G.achievements)G.achievements=[];
if(!G.towerBest)G.towerBest=0;
if(!G.pvpCount)G.pvpCount=0;
if(!G.pvpWins)G.pvpWins=0;
if(!G.dailyQuests)G.dailyQuests={date:'',quests:[],completed:[]};
if(!G.weeklyQuests)G.weeklyQuests={week:'',quests:[],completed:[]};
if(!G.dailyStreak)G.dailyStreak=0;
if(!G.dailyBossUsed)G.dailyBossUsed=false;
if(!G.dailyHordeUsed)G.dailyHordeUsed=false;
if(!G.codex)G.codex={monsters:[],items:[]};
}

function checkAchievements(){
initStats();
let newCount=0;
for(const a of ACHIEVEMENTS){
if(G.achievements.includes(a.id))continue;
if(a.check(G.stats)){
G.achievements.push(a.id);
if(a.reward.dia){G.points=(G.points||0)+a.reward.dia}
if(a.reward.gold){G.gold=(G.gold||0)+a.reward.gold}
toast(`🏆 업적 달성! [${a.name}] 💎+${a.reward.dia||0}`);
newCount++;
}
}
if(newCount>0){updateBars();saveGame()}
}

function renderAchievements(){
const body=document.getElementById('achieve-body');
initStats();
const done=G.achievements||[];
let html='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;font-size:12px;color:var(--text2)">';
html+=`<span>완료: ${done.length}/${ACHIEVEMENTS.length}</span>`;
html+=`<span style="margin-left:auto">💎 총 획득: ${ACHIEVEMENTS.filter(a=>done.includes(a.id)).reduce((s,a)=>s+(a.reward.dia||0),0)}</span>`;
html+='</div>';
for(const a of ACHIEVEMENTS){
const isDone=done.includes(a.id);
html+=`<div class="achieve-card ${isDone?'done':''}">
<div class="achieve-icon">${a.icon}</div>
<div class="achieve-info"><div class="achieve-name">${a.name}</div><div class="achieve-desc">${a.desc}</div></div>
<div class="achieve-reward">${isDone?'✅':'💎'+a.reward.dia}</div>
</div>`;
}
body.innerHTML=html;
}

// ===== STAGE STORY =====
const STAGE_STORIES=[
{floor:1,name:'🌿 푸른 초원',story:'마을 밖 초원에 몬스터가 출몰하기 시작했다...',color:'#4ade80'},
{floor:11,name:'🌲 어둠의 숲',story:'빛이 닿지 않는 숲. 나무 사이로 붉은 눈이 반짝인다.',color:'#166534'},
{floor:21,name:'🌋 용암 동굴',story:'땅이 갈라지고 용암이 흐른다. 열기가 장비를 녹일 듯하다.',color:'#dc2626'},
{floor:31,name:'❄️ 얼음 성',story:'영원한 겨울의 성. 벽마다 얼어붙은 전사들의 흔적이...',color:'#38bdf8'},
{floor:41,name:'🏰 마왕성',story:'어둠의 마왕이 기다리는 최후의 성. 끝이 보인다.',color:'#7c3aed'},
{floor:51,name:'🌌 차원의 틈',story:'마왕을 넘어선 자만이 볼 수 있는 세계. 차원이 뒤틀린다.',color:'#ec4899'},
{floor:71,name:'⚡ 천공의 탑',story:'하늘 위의 탑. 번개가 내리치는 시련의 장소.',color:'#f59e0b'},
{floor:91,name:'🔥 혼돈의 심연',story:'세계의 끝. 모든 것이 혼돈으로 뒤섞인 곳.',color:'#ef4444'},
{floor:121,name:'💫 신들의 영역',story:'신조차 두려워하는 금단의 영역. 여기까지 온 자는 없었다.',color:'#fbbf24'},
{floor:151,name:'🌀 무한의 나선',story:'끝이 없는 나선. 시간과 공간이 의미를 잃는다.',color:'#a78bfa'},
{floor:181,name:'☀️ 기원의 빛',story:'모든 것의 시작이자 끝. 최후의 진실이 기다린다.',color:'#fff'},
];

function getStageInfo(floor){
let stage=STAGE_STORIES[0];
for(const s of STAGE_STORIES){if(floor>=s.floor)stage=s;else break}
return stage;
}

function showStageTransition(stage){
return new Promise(r=>{
const el=document.createElement('div');
el.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.95);opacity:0;transition:opacity 0.5s';
el.innerHTML=`<div style="font-size:48px;margin-bottom:16px">${stage.name.split(' ')[0]}</div>
<div style="font-size:22px;font-weight:700;color:${stage.color};margin-bottom:12px">${stage.name}</div>
<div style="font-size:14px;color:var(--text2);max-width:300px;text-align:center;line-height:1.6">${stage.story}</div>`;
document.body.appendChild(el);
requestAnimationFrame(()=>{el.style.opacity='1'});
setTimeout(()=>{el.style.opacity='0';setTimeout(()=>{el.remove();r()},500)},2500);
});
}

// ===== DAILY / WEEKLY QUESTS =====
const DAILY_QUEST_POOL=[
{id:'battle_20',name:'전투 20회',desc:'전투 20회 수행',icon:'⚔️',target:20,stat:'dailyBattles',reward:{gold:500,dia:5}},
{id:'battle_50',name:'전투 50회',desc:'전투 50회 수행',icon:'⚔️',target:50,stat:'dailyBattles',reward:{gold:1000,dia:10}},
{id:'kill_50',name:'처치 50마리',desc:'몬스터 50마리 처치',icon:'💀',target:50,stat:'dailyKills',reward:{gold:800,dia:8}},
{id:'boss_3',name:'보스 사냥',desc:'보스 3마리 처치',icon:'👹',target:3,stat:'dailyBossKills',reward:{gold:1500,dia:10}},
{id:'crit_30',name:'크리티컬 30회',desc:'크리티컬 30회 달성',icon:'💥',target:30,stat:'dailyCrits',reward:{gold:600,dia:5}},
{id:'equip_3',name:'장비 수집',desc:'장비 3개 획득',icon:'🎒',target:3,stat:'dailyItems',reward:{gold:400,dia:5}},
{id:'gold_5k',name:'골드 수집',desc:'골드 5,000 획득',icon:'💰',target:5000,stat:'dailyGoldEarned',reward:{dia:8}},
];

const WEEKLY_QUEST_POOL=[
{id:'w_battle_200',name:'주간 전투 200회',desc:'이번 주 전투 200회',icon:'⚔️',target:200,stat:'weeklyBattles',reward:{gold:5000,dia:30}},
{id:'w_boss_20',name:'주간 보스 20마리',desc:'이번 주 보스 20마리 처치',icon:'🐉',target:20,stat:'weeklyBossKills',reward:{gold:8000,dia:50}},
{id:'w_floor_5',name:'5층 진행',desc:'이번 주 5층 이상 진행',icon:'🏔️',target:5,stat:'weeklyFloors',reward:{gold:3000,dia:20}},
];

function getTodayStr(){return new Date().toISOString().slice(0,10)}
function getWeekStr(){const d=new Date();const w=Math.floor(d.getTime()/(7*86400000));return 'w'+w}

function initDailyQuests(){
const today=getTodayStr();
if(!G.dailyQuests||G.dailyQuests.date!==today){
// 연속 출석 체크
if(G.dailyQuests&&G.dailyQuests.date){
const last=new Date(G.dailyQuests.date);const now=new Date(today);
const diff=Math.floor((now-last)/(86400000));
if(diff===1)G.dailyStreak=(G.dailyStreak||0)+1;
else if(diff>1)G.dailyStreak=1;
}else{G.dailyStreak=1}
// 새 일일 퀘스트 3개 뽑기
const shuffled=[...DAILY_QUEST_POOL].sort(()=>Math.random()-0.5);
G.dailyQuests={date:today,quests:shuffled.slice(0,3).map(q=>({...q,progress:0})),completed:[]};
G.dailyStats={dailyBattles:0,dailyKills:0,dailyBossKills:0,dailyCrits:0,dailyItems:0,dailyGoldEarned:0};
G.dailyBossUsed=false;
G.dailyHordeUsed=false;
saveGame();
}
}

function initWeeklyQuests(){
const week=getWeekStr();
if(!G.weeklyQuests||G.weeklyQuests.week!==week){
G.weeklyQuests={week:week,quests:WEEKLY_QUEST_POOL.map(q=>({...q,progress:0})),completed:[]};
G.weeklyStats={weeklyBattles:0,weeklyBossKills:0,weeklyFloors:0};
saveGame();
}
}

function updateQuestProgress(stat,amount){
if(!G.dailyStats)G.dailyStats={};
if(!G.weeklyStats)G.weeklyStats={};
G.dailyStats[stat]=(G.dailyStats[stat]||0)+amount;
// weekly mapping
const wMap={dailyBattles:'weeklyBattles',dailyBossKills:'weeklyBossKills',dailyKills:'weeklyKills'};
if(wMap[stat])G.weeklyStats[wMap[stat]]=(G.weeklyStats[wMap[stat]]||0)+amount;
// 퀘스트 진행도 업데이트
if(G.dailyQuests&&G.dailyQuests.quests){
G.dailyQuests.quests.forEach(q=>{if(q.stat===stat)q.progress=G.dailyStats[stat]||0});
}
if(G.weeklyQuests&&G.weeklyQuests.quests){
G.weeklyQuests.quests.forEach(q=>{if(q.stat===stat||q.stat===wMap[stat])q.progress=G.weeklyStats[q.stat]||0});
}
}

function claimQuest(type,idx){
const qs=type==='daily'?G.dailyQuests:G.weeklyQuests;
if(!qs||!qs.quests[idx])return;
const q=qs.quests[idx];
if(q.progress<q.target)return toast('아직 완료되지 않았습니다');
if(qs.completed.includes(q.id))return toast('이미 수령했습니다');
qs.completed.push(q.id);
if(q.reward.gold)G.gold+=q.reward.gold;
if(q.reward.dia)G.points=(G.points||0)+q.reward.dia;
toast(`🎁 퀘스트 보상! ${q.reward.gold?'💰+'+q.reward.gold+' ':''}${q.reward.dia?'💎+'+q.reward.dia:''}`);
updateBars();saveGame();renderQuests();
}

function renderQuests(){
const body=document.getElementById('quest-body');
initDailyQuests();initWeeklyQuests();
let html=`<div style="color:var(--gold);font-weight:700;margin-bottom:8px">📅 일일 퀘스트 <span style="font-size:11px;color:var(--text2)">(연속 ${G.dailyStreak||0}일)</span></div>`;
G.dailyQuests.quests.forEach((q,i)=>{
const done=G.dailyQuests.completed.includes(q.id);
const pct=Math.min(100,Math.floor(q.progress/q.target*100));
const rwdText=`${q.reward.gold?'💰'+q.reward.gold+' ':''}${q.reward.dia?'💎'+q.reward.dia:''}`;
html+=`<div class="quest-card ${done?'done':''}">
<div class="quest-icon">${q.icon}</div>
<div class="quest-info"><div class="quest-name">${q.name}</div><div class="quest-desc">${q.desc}</div>
<div class="quest-bar"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
<div class="quest-progress">${Math.min(q.progress,q.target)}/${q.target}</div></div>
<div class="quest-reward"><div style="font-size:11px;color:var(--gold);margin-bottom:4px">${rwdText}</div>${done?'✅':`<button class="btn btn-sm" onclick="claimQuest('daily',${i})" ${q.progress>=q.target?'':'disabled'}>수령</button>`}</div>
</div>`;
});
html+=`<div style="color:var(--cyan);font-weight:700;margin:16px 0 8px">📋 주간 퀘스트</div>`;
G.weeklyQuests.quests.forEach((q,i)=>{
const done=G.weeklyQuests.completed.includes(q.id);
const pct=Math.min(100,Math.floor(q.progress/q.target*100));
const rwdText=`${q.reward.gold?'💰'+q.reward.gold+' ':''}${q.reward.dia?'💎'+q.reward.dia:''}`;
html+=`<div class="quest-card ${done?'done':''}">
<div class="quest-icon">${q.icon}</div>
<div class="quest-info"><div class="quest-name">${q.name}</div><div class="quest-desc">${q.desc}</div>
<div class="quest-bar"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
<div class="quest-progress">${Math.min(q.progress,q.target)}/${q.target}</div></div>
<div class="quest-reward"><div style="font-size:11px;color:var(--gold);margin-bottom:4px">${rwdText}</div>${done?'✅':`<button class="btn btn-sm" onclick="claimQuest('weekly',${i})" ${q.progress>=q.target?'':'disabled'}>수령</button>`}</div>
</div>`;
});
body.innerHTML=html;
}

// ===== CHALLENGE MODE HELPERS =====
let _challengeOrigAuto=false;
let _challengeActive=false;
function enterChallengeMode(title){
closeOverlay('challenge');
openOverlay('hunt');
_challengeActive=true;
_challengeOrigAuto=G.autoHunt;
G.autoHunt=false;updateAutoHuntUI();
document.getElementById('hunt-btn').style.display='none';
document.getElementById('auto-hunt-btn').style.display='none';
const hdr=document.querySelector('#overlay-hunt .overlay-header h2');
if(hdr)hdr.innerHTML=title;
}
function exitChallengeMode(){
_challengeActive=false;
G.autoHunt=_challengeOrigAuto;updateAutoHuntUI();
// 버튼은 숨긴 채로 유지 — hunt overlay 닫을 때 복원
updateBars();saveGame();checkAchievements();
}
function restoreHuntUI(){
document.getElementById('hunt-btn').style.display='';
document.getElementById('auto-hunt-btn').style.display='';
const hdr=document.querySelector('#overlay-hunt .overlay-header h2');
if(hdr)hdr.innerHTML='⚔️ 사냥 — <span id="hunt-floor">'+G.floor+'</span>층';
}

// ===== CHALLENGE BOSS =====
function startDailyBoss(){
if(G.dailyBossUsed)return toast('오늘의 도전 보스는 이미 도전했습니다!');
G.dailyBossUsed=true;saveGame();
enterChallengeMode('👹 일일 도전 보스');

setTimeout(async()=>{
const log=document.getElementById('hunt-log');log.innerHTML='';
showBgSprite(G.className,'idle');

const bossFloor=Math.max(G.floor*2,20);
const bossName='🔥 도전 보스';
await addHuntLine('👹 일일 도전 보스 출현!','story',log);
await addHuntLine(`난이도: ${bossFloor}층 상당 (현재 ${G.floor}층 x2)`,'story',log);
await addHuntLine('⚔️ 전투 개시!','story',log);
showBgSprite(G.className,'walk');

const oldFloor=G.floor;
G.floor=bossFloor;
const combat=generateCombatLocal(bossName,1,true);
G.floor=oldFloor;

// 버프 묶기 + 전투 로그
const displayLines=[];
for(let li=0;li<combat.lines.length;li++){
const line=combat.lines[li];
if(line.type==='buff'){
const buffGroup=[line.text];
while(li+1<combat.lines.length&&combat.lines[li+1].type==='buff'){li++;buffGroup.push(combat.lines[li].text)}
displayLines.push({text:buffGroup.join(' | '),type:'buff',hits:null,charClass:null});
}else{displayLines.push(line)}
}
for(const line of displayLines){
const type=mapLineType(line.type);
await addHuntLine(line.text,type,log,line.hits,line.charClass);
}

const taken=Object.values(combat.totalTaken).reduce((a,b)=>a+b,0);

if(combat.won){
G.hp=Math.max(1,G.hp-Math.floor(taken*0.5));
G.points=(G.points||0)+20;
showBgSprite(G.className,'idle');
await addHuntLine('🏆 도전 보스 격파! 💎+20','victory',log);
}else{
G.hp=Math.max(1,G.hp-Math.floor(taken*0.5));
await addHuntLine('💀 도전 보스에게 패배...','defeat',log);
}
updateBars();updateHuntStatus();
exitChallengeMode();
},500);
}

// ===== INFINITE TOWER =====
let _towerFloor=0;
let _towerActive=false;

function startTower(){
if(_towerActive)return;
_towerActive=true;_towerFloor=0;
enterChallengeMode('🗼 무한의 탑');

setTimeout(async()=>{
const log=document.getElementById('hunt-log');log.innerHTML='';
showBgSprite(G.className,'idle');
await addHuntLine('🗼 무한의 탑 도전 시작!','story',log);

while(_towerActive){
_towerFloor++;
// 헤더 층수 업데이트
const hdr=document.querySelector('#overlay-hunt .overlay-header h2');
if(hdr)hdr.innerHTML=`🗼 무한의 탑 — ${_towerFloor}층`;

const enemyCount=Math.min(5,1+Math.floor(_towerFloor/5));
const isBoss=_towerFloor%10===0;
const enemy=isBoss?`🏛️ 탑의 수호신 ${_towerFloor}층`:`탑의 수호자 ${_towerFloor}층`;

await addHuntLine(`── 🗼 ${_towerFloor}층 ${isBoss?'⚠️ 보스!':''} ──`,'story',log);
showBgSprite(G.className,'walk');

const oldFloor=G.floor;
G.floor=_towerFloor*2;
const combat=generateCombatLocal(enemy,enemyCount,isBoss);
G.floor=oldFloor;

const displayLines=[];
for(let li=0;li<combat.lines.length;li++){
const line=combat.lines[li];
if(line.type==='buff'){
const buffGroup=[line.text];
while(li+1<combat.lines.length&&combat.lines[li+1].type==='buff'){li++;buffGroup.push(combat.lines[li].text)}
displayLines.push({text:buffGroup.join(' | '),type:'buff',hits:null,charClass:null});
}else{displayLines.push(line)}
}
for(const line of displayLines){
const type=mapLineType(line.type);
await addHuntLine(line.text,type,log,line.hits,line.charClass);
}

const taken=Object.values(combat.totalTaken).reduce((a,b)=>a+b,0);

if(combat.won){
const reward=Math.floor(100*_towerFloor);
G.gold+=reward;
if(_towerFloor>(G.towerBest||0))G.towerBest=_towerFloor;
G.hp=Math.max(1,G.hp-Math.floor(taken*0.5));
showBgSprite(G.className,'idle');
await addHuntLine(`✨ ${_towerFloor}층 클리어! 💰+${reward} (최고: ${G.towerBest}층)`,'victory',log);
updateBars();updateHuntStatus();saveGame();
}else{
G.hp=Math.max(1,G.hp-Math.floor(taken*0.5));
await addHuntLine(`💀 ${_towerFloor}층에서 패배! 최고 기록: ${G.towerBest||0}층`,'defeat',log);
_towerActive=false;
}
}

exitChallengeMode();
},500);
}

// ===== ENDLESS HORDE (무한의 적) =====
let _hordeActive=false;
function startHorde(){
if(G.dailyHordeUsed)return toast('오늘의 무한의 적은 이미 도전했습니다!');
if(_hordeActive)return;
G.dailyHordeUsed=true;_hordeActive=true;saveGame();
enterChallengeMode('💀 무한의 적');

setTimeout(async()=>{
const log=document.getElementById('hunt-log');log.innerHTML='';
showBgSprite(G.className,'idle');

const totalEnemies=100;
let killed=0,wave=0;

await addHuntLine('💀 무한의 적 — 100마리와의 사투!','story',log);
await addHuntLine(`전력: ⚔️${G.atk+getEquipStat('ATK')} 🛡️${G.def+getEquipStat('DEF')} ❤️${Math.floor(G.hp)}/${G.maxHP}`,'story',log);

while(killed<totalEnemies&&G.hp>0){
wave++;
const remaining=totalEnemies-killed;
const count=Math.min(remaining,Math.floor(3+Math.random()*5));
const isBoss=wave%10===0;
const enemyName=isBoss?`💀 어둠의 대장 (웨이브${wave})`:`어둠의 군단 (웨이브${wave})`;

await addHuntLine(`── 웨이브 ${wave} | ${enemyName} ${count}마리 ──`,'story',log);
showBgSprite(G.className,'walk');

const oldFloor=G.floor;
G.floor=Math.max(G.floor,10+wave*2);
const combat=generateCombatLocal(enemyName,count,isBoss);
G.floor=oldFloor;

// 전투 로그를 일반 전투처럼 표시 (버프 묶기)
const displayLines=[];
for(let li=0;li<combat.lines.length;li++){
const line=combat.lines[li];
if(line.type==='buff'){
const buffGroup=[line.text];
while(li+1<combat.lines.length&&combat.lines[li+1].type==='buff'){li++;buffGroup.push(combat.lines[li].text)}
displayLines.push({text:buffGroup.join(' | '),type:'buff',hits:null,charClass:null});
}else{displayLines.push(line)}
}
for(const line of displayLines){
const type=mapLineType(line.type);
await addHuntLine(line.text,type,log,line.hits,line.charClass);
}

const dmgTaken=Object.values(combat.totalTaken).reduce((a,b)=>a+b,0);

if(combat.won){
killed+=count;
G.hp=Math.max(1,G.hp-dmgTaken);
await addHuntLine(`✨ 웨이브 ${wave} 클리어! (처치: ${killed}/${totalEnemies})`,'victory',log);
if(isBoss)await addHuntLine(`🔥 ${wave}웨이브 보스 돌파!`,'victory',log);
}else{
const partialKill=combat.lines.filter(l=>l.text&&l.text.includes('처치')).length;
killed+=partialKill;
G.hp=Math.max(0,G.hp-dmgTaken);
await addHuntLine(`💀 웨이브 ${wave}에서 쓰러졌다... (처치: ${killed}/${totalEnemies})`,'defeat',log);
break;
}
updateBars();updateHuntStatus();
}

const won=killed>=totalEnemies;
if(won){
const goldReward=5000+G.floor*100;const diaReward=50;
G.gold+=goldReward;G.points=(G.points||0)+diaReward;
G.hordeClears=(G.hordeClears||0)+1;
G.hp=Math.max(1,Math.floor(G.maxHP*0.3));
showBgSprite(G.className,'idle');
await addHuntLine(`🏆 무한의 적 정복! 💰+${goldReward} 💎+${diaReward}`,'victory',log);
}else{
const consolation=Math.floor(killed*30);
G.gold+=consolation;
G.hp=Math.max(1,Math.floor(G.maxHP*0.5));
await addHuntLine(`${killed}마리 처치 보상: 💰+${consolation}`,'loot',log);
}

exitChallengeMode();
_hordeActive=false;
},500);
}

// ===== PVP =====
let _pvpActive=false;
function startPvP(){
if(_pvpActive)return;
_pvpActive=true;
enterChallengeMode('🤺 PvP 대전');

setTimeout(async()=>{
const log=document.getElementById('hunt-log');log.innerHTML='';
showBgSprite(G.className,'idle');

// AI 상대 생성
const classes=Object.keys(CLASSES);
const oppClass=classes[Math.floor(Math.random()*classes.length)];
const oppData=CLASSES[oppClass];
const lvl=Math.max(1,G.level+Math.floor(Math.random()*11)-5);
const oppAtk=oppData.baseATK+lvl*1;
const oppDef=oppData.baseDEF+lvl*1;
const oppHP=oppData.baseHP+lvl*8;

const myAtk=G.atk+getEquipStat('ATK');
const myDef=G.def+getEquipStat('DEF');
const myCrit=10+(G.critBonus||0)+getEquipStat('치명타');
const myAtkSpd=Math.min(getEquipStat('공격속도')+(G.atkSpd||0),50);

await addHuntLine(`🤺 PvP 대전!`,'story',log);
await addHuntLine(`상대: ${oppData.weapon}${oppClass} Lv.${lvl}`,'story',log);
await addHuntLine(`ATK ${oppAtk} / DEF ${oppDef} / HP ${oppHP}`,'story',log);
await addHuntLine('⚔️ 전투 개시!','story',log);

let myHP=G.hp,eHP=oppHP;

for(let r=0;r<10&&myHP>0&&eHP>0;r++){
// 내 공격
const skills=G.equippedSkills&&G.equippedSkills.length>0?G.equippedSkills:null;
const skill=skills?skills[Math.floor(Math.random()*skills.length)]:{name:'평타',icon:CLASSES[G.className]?.weapon||'⚔️',dmg:10};
const baseDmg=Math.max(1,Math.floor((skill.dmg||10)*(1+myAtk/30)*(0.8+Math.random()*0.4)-oppDef*0.3));
const isCrit=Math.random()*100<myCrit;
const finalDmg=isCrit?Math.floor(baseDmg*1.8):baseDmg;
eHP-=finalDmg;

showBgSprite(G.className,getActionType(skill.name,G.className),1,true);
const critTag=isCrit?'💥크리티컬! ':'';
await addHuntLine(`${skill.icon} ${skill.name} — ${critTag}${finalDmg} 데미지!`,isCrit?'critical':'action',log,1,G.className);

if(eHP<=0){
await addHuntLine(`${oppClass}에게 ${finalDmg} 피해! 쓰러졌다!`,'damage',log);
break;
}
await addHuntLine(`${oppClass} HP: ${eHP}/${oppHP}`,'damage',log);

// 공격속도 보너스
if(myAtkSpd>0&&Math.random()*100<myAtkSpd){
const bonusDmg=Math.max(1,Math.floor(myAtk*(0.8+Math.random()*0.4)-oppDef*0.3));
eHP-=bonusDmg;
showBgSprite(G.className,getActionType('',G.className),1,true);
await addHuntLine(`⚡ 연속 공격! ${bonusDmg} 추가 데미지!`,'action',log,1,G.className);
if(eHP<=0){await addHuntLine(`${oppClass} 쓰러졌다!`,'damage',log);break}
}

// 상대 공격
const eDmg=Math.max(1,Math.floor(oppAtk*(0.8+Math.random()*0.4)-myDef*0.3));
const eCrit=Math.random()*100<15;
const finalEDmg=eCrit?Math.floor(eDmg*1.5):eDmg;
myHP-=finalEDmg;
showBgSprite(G.className,'block',1);
await addHuntLine(`${eCrit?'💥 ':''}${oppClass}의 공격 → -${finalEDmg} HP`,'enemy-atk',log,1,G.className);
if(myHP<=0){
await addHuntLine(`${G.className} 쓰러졌다...`,'defeat',log);
break;
}
}

const won=eHP<=0;
G.pvpCount=(G.pvpCount||0)+1;
if(won){
G.pvpWins=(G.pvpWins||0)+1;
const reward=Math.floor(200+G.level*10);
G.gold+=reward;G.points=(G.points||0)+5;
showBgSprite(G.className,'idle');
await addHuntLine(`🏆 PvP 승리! 💰+${reward} 💎+5`,'victory',log);
await addHuntLine(`전적: ${G.pvpWins}승 ${G.pvpCount-G.pvpWins}패`,'loot',log);
}else{
const consolation=Math.floor(50+G.level*3);
G.gold+=consolation;
await addHuntLine(`패배... 위로금 💰+${consolation}`,'defeat',log);
await addHuntLine(`전적: ${G.pvpWins||0}승 ${(G.pvpCount||0)-(G.pvpWins||0)}패`,'loot',log);
}
G.hp=Math.max(1,myHP);
exitChallengeMode();
_pvpActive=false;
},500);
}

// ===== CODEX (도감) =====
function addToCodex(type,name){
if(!G.codex)G.codex={monsters:[],items:[]};
if(type==='monster'&&!G.codex.monsters.includes(name)){G.codex.monsters.push(name);return true}
if(type==='item'&&!G.codex.items.includes(name)){G.codex.items.push(name);return true}
return false;
}

function renderCodex(){
const body=document.getElementById('codex-body');
if(!G.codex)G.codex={monsters:[],items:[]};
let html=`<div style="color:var(--gold);font-weight:700;margin-bottom:8px">👹 몬스터 도감 (${G.codex.monsters.length}종)</div>`;
if(G.codex.monsters.length===0)html+='<div style="color:var(--text2);font-size:12px;padding:8px">아직 발견한 몬스터가 없습니다</div>';
else{G.codex.monsters.forEach(m=>{html+=`<div style="font-size:12px;padding:3px 0;color:var(--text1)">• ${m}</div>`})}
html+=`<div style="color:var(--cyan);font-weight:700;margin:16px 0 8px">🎒 아이템 도감 (${G.codex.items.length}종)</div>`;
if(G.codex.items.length===0)html+='<div style="color:var(--text2);font-size:12px;padding:8px">아직 발견한 아이템이 없습니다</div>';
else{G.codex.items.forEach(m=>{html+=`<div style="font-size:12px;padding:3px 0;color:var(--text1)">• ${m}</div>`})}
body.innerHTML=html;
}
