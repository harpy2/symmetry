// ===== HUNTING =====
let huntInProgress=false;
function renderHunt(){document.getElementById('hunt-floor').textContent=G.floor;updateAutoHuntUI();updateHuntStatus()}
function updateHuntStatus(){var h=document.getElementById('hunt-hp');if(h){h.textContent=Math.floor(G.hp)+'/'+G.maxHP;document.getElementById('hunt-hunger').textContent=Math.floor(G.hunger)+'%';document.getElementById('hunt-mood').textContent=Math.floor(G.mood)+'%';document.getElementById('hunt-level').textContent=G.level;document.getElementById('hunt-gold').textContent=G.gold}}
function updateAutoHuntUI(){document.getElementById('auto-hunt-indicator').innerHTML=G.autoHunt?'<span class="auto-hunt-badge">자동</span>':'';document.getElementById('auto-hunt-btn').textContent=G.autoHunt?'⏹️ 자동 중지':'🔄 자동사냥'}
function toggleAutoHunt(){G.autoHunt=!G.autoHunt;updateAutoHuntUI();if(G.autoHunt&&!huntInProgress)startHunt()}

// Mood multiplier helper
function getMoodMultiplier(){
if(G.mood>=80)return{exp:1.2,gold:1.2,drop:0.1};
if(G.mood>=50)return{exp:1.0,gold:1.0,drop:0};
if(G.mood>=20)return{exp:0.85,gold:0.85,drop:-0.1};
return{exp:0,gold:0,drop:0}; // 0-19: can't hunt
}

async function startHunt(){
if(huntInProgress)return;if(G.hp<=0){toast('HP가 부족합니다!');return}
// Mood check: 0-19 cannot hunt
if(G.mood<20){toast('기분이 너무 안 좋아서 사냥할 수 없습니다...');G.autoHunt=false;updateAutoHuntUI();return}
huntInProgress=true;document.getElementById('hunt-btn').disabled=true;
const log=document.getElementById('hunt-log');log.innerHTML='';
const isBoss=G.floor%5===0;
const moodMult=getMoodMultiplier();

const tmpl=HUNT_TEMPLATES[Math.floor(Math.random()*HUNT_TEMPLATES.length)];
const enemy=isBoss?tmpl.boss:tmpl.enemies[Math.floor(Math.random()*tmpl.enemies.length)];
const enemyCount=isBoss?1:Math.floor(Math.random()*3)+1;
const enemyHP=isBoss?(30+G.floor*8):(10+G.floor*3);
let totalEnemyHP=enemyHP*enemyCount;

// 로딩 텍스트 표시 + AI 스토리 생성 병렬
const loadingText = LOADING_TEXTS[Math.floor(Math.random()*LOADING_TEXTS.length)];
const loadingEl = document.createElement('div');
loadingEl.className='hunt-line story loading-line';
loadingEl.textContent=loadingText;
loadingEl.style.cssText='width:fit-content;max-width:90%;text-align:center;margin:0 auto;opacity:.6;font-style:italic';
log.appendChild(loadingEl);
const aiStory = await generateHuntStoryAI(enemy, isBoss, G.floor);
loadingEl.remove();
const introText = aiStory.intro || tmpl.intro[0];
await addHuntLine(introText,'story',log);
await wait(700);
if(isBoss){await addHuntLine(`⚠️ 보스 출현! ${tmpl.bossEmoji} ${enemy}!`,'boss',log)}
else{await addHuntLine(`${enemy} ${enemyCount}마리가 나타났다!`,'story',log)}
await wait(600);

let rounds=isBoss?5:3+Math.floor(Math.random()*2);
let playerHPLoss=0;
if(isBoss&&!G.autoHunt){
await addHuntLine('⚡ 스킬체크! 타이밍을 맞춰라!','boss',log);
const scResult=await bossSkillCheck(rounds,log);
for(const r of scResult.rounds){
const skill=G.equippedSkills[r.skillIdx%G.equippedSkills.length];
let baseDmg=Math.floor((skill.dmg||20)*(1+G.atk/30));
if(G.equipment.weapon)baseDmg+=Math.floor(G.equipment.weapon.stats.ATK||0);
let dmg=r.type==='critical'?Math.floor(baseDmg*2.5):r.type==='hit'?Math.floor(baseDmg*1):Math.floor(baseDmg*0.3);
totalEnemyHP-=dmg;
const tag=r.type==='critical'?'💥크리티컬!! ':r.type==='hit'?'✅ ':'❌빗나감... ';
await addHuntLine(`${skill.icon} ${skill.name} → ${tag}${dmg} 데미지`,'action',log);
if(r.type==='miss'){const eDmg=Math.max(1,Math.floor((5+G.floor*2)*(0.8+Math.random()*0.4)-G.def/3));playerHPLoss+=eDmg;await addHuntLine(`${enemy}의 반격! → -${eDmg} HP`,'damage',log)}
await wait(600)}
}else{
for(let r=0;r<rounds&&totalEnemyHP>0;r++){
const skill=G.equippedSkills[r%G.equippedSkills.length];
let baseDmg=Math.floor((skill.dmg||20)*(1+G.atk/30));
if(G.equipment.weapon)baseDmg+=Math.floor(G.equipment.weapon.stats.ATK||0);
const roll=Math.random()*100;
let dmg,tag;
if(isBoss){
if(roll<15){dmg=Math.floor(baseDmg*2.5);tag='💥크리티컬!! '}
else if(roll<70){dmg=Math.floor(baseDmg*(0.8+Math.random()*0.4));tag=''}
else{dmg=Math.floor(baseDmg*0.3);tag='❌빗나감... '}
}else{
const critChance=10+(G.critBonus||0);
if(roll<critChance){dmg=Math.floor(baseDmg*1.5);tag='💥크리티컬! '}
else{dmg=Math.floor(baseDmg*(0.8+Math.random()*0.4));tag=''}
}
totalEnemyHP-=dmg;
await addHuntLine(`${skill.icon} ${skill.name} 시전! → ${tag}${dmg} 데미지`,'action',log);
await wait(600);
if(tag.includes('빗나감')){const eDmg=Math.max(1,Math.floor((5+G.floor*2)*(0.8+Math.random()*0.4)-G.def/3));playerHPLoss+=eDmg;await addHuntLine(`${enemy}의 반격! → -${eDmg} HP`,'damage',log);await wait(500)}
else if(totalEnemyHP>0&&Math.random()<0.4){const eDmg=Math.max(1,Math.floor((3+G.floor)*(0.6+Math.random()*0.4)-G.def/3));playerHPLoss+=eDmg;await addHuntLine(`${enemy}의 반격! → -${eDmg} HP`,'damage',log);await wait(500)}}
}

const won=totalEnemyHP<=0;
G.hp=Math.max(1,G.hp-playerHPLoss);
G.hunger=Math.max(0,G.hunger-(isBoss?8:4));
if(won){
await addHuntLine('전투 승리! 🎉','victory',log);
let goldReward=Math.floor((10+G.floor*5)*(isBoss?3:1)*(0.8+Math.random()*0.4));
let expReward=Math.floor((15+G.floor*3)*(isBoss?2.5:1));
// Apply mood multipliers
goldReward=Math.floor(goldReward*moodMult.exp);
expReward=Math.floor(expReward*moodMult.exp);
G.gold+=goldReward;G.exp+=expReward;
G.mood=Math.min(100,G.mood+(isBoss?15:5));
await addHuntLine(`획득: 💰 +${goldReward}, 경험치 +${expReward}`,'loot',log);
// Item drop with mood bonus
const baseDropRate=isBoss?0.9:0.4;
const adjustedDropRate=Math.min(1,Math.max(0,baseDropRate+moodMult.drop));
if(Math.random()<adjustedDropRate){
const item=await generateItemAI();
G.inventory.push(item);
await addHuntLine(`아이템 발견! [${item.name}] (${item.grade})`,'loot',log);
showItemDropPopup(item)}
if(!isBoss)G.floor++;
else{G.floor++;await addHuntLine(`🏆 보스 클리어! ${G.floor}층으로 진출!`,'victory',log)}
while(G.exp>=100){G.exp-=100;G.level++;G.maxHP+=20;G.atk+=3;G.def+=2;G.hp=G.maxHP;showLevelUp()}
}else{
await addHuntLine('전투 패배... 💀','damage',log);
G.mood=Math.max(0,G.mood-10)}
updateBars();updateHuntStatus();renderCharacter();renderEquipRow();saveGame();
huntInProgress=false;document.getElementById('hunt-btn').disabled=false;
if(G.autoHunt&&G.hp>G.maxHP*0.2){setTimeout(()=>{if(G.autoHunt)startHunt()},1500)}else{G.autoHunt=false;updateAutoHuntUI()}}

function addHuntLine(text,cls,log){return new Promise(r=>{const d=document.createElement('div');d.className='hunt-line '+cls;d.textContent=text;d.style.width='fit-content';d.style.maxWidth='90%';d.style.textAlign='center';d.style.margin='0 auto';log.appendChild(d);log.scrollTop=log.scrollHeight;updateHuntStatus();setTimeout(r,500)})}

function bossSkillCheck(totalRounds,log){
return new Promise(resolve=>{
const results=[];let round=0;
const speed=2.5+G.floor*0.15;
const normalZone=18;const critZone=5;

function runRound(){
if(round>=totalRounds){resolve({rounds:results});return}
const wrap=document.createElement('div');wrap.className='sc-wrap';
const critStart=Math.floor(Math.random()*360);
const normalStart=(critStart-normalZone+360)%360;
const normalEnd=(critStart+critZone+normalZone)%360;
const critEnd=(critStart+critZone)%360;
const skill=G.equippedSkills[round%G.equippedSkills.length];

wrap.innerHTML=`
<div style="font-size:13px;color:var(--text2)">${skill.icon} ${skill.name} — 라운드 ${round+1}/${totalRounds}</div>
<div class="sc-gauge"><svg viewBox="0 0 200 200">
<circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14"/>
<path d="${descArc(100,100,85,normalStart,(normalStart+normalZone*2+critZone)%360)}" fill="none" stroke="rgba(0,232,143,.3)" stroke-width="14" stroke-linecap="round"/>
<path d="${descArc(100,100,85,critStart,critEnd)}" fill="none" stroke="rgba(255,68,102,.5)" stroke-width="14" stroke-linecap="round"/>
<line id="sc-needle-${round}" x1="100" y1="100" x2="100" y2="20" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"/>
</svg></div>
<div class="sc-info"><span>🟢 일반</span><span>🔴 크리티컬</span></div>
<button class="sc-btn" id="sc-btn-${round}">⚡ 클릭!</button>
<div class="sc-result" id="sc-res-${round}"></div>`;
log.appendChild(wrap);log.scrollTop=log.scrollHeight;

let angle=0,running=true,anim;
const needle=()=>wrap.querySelector('#sc-needle-'+round);
function tick(){if(!running)return;angle=(angle+speed)%360;const n=needle();if(n)n.setAttribute('transform','rotate('+angle+',100,100)');anim=requestAnimationFrame(tick)}
tick();

const btn=wrap.querySelector('#sc-btn-'+round);
btn.onclick=()=>{
running=false;if(anim)cancelAnimationFrame(anim);btn.disabled=true;
const a=angle;
const inCrit=isInArc(a,critStart,critEnd);
const inNormal=isInArc(a,normalStart,(normalStart+normalZone*2+critZone)%360);
const res=wrap.querySelector('#sc-res-'+round);
let type='miss';
if(inCrit){type='critical';res.innerHTML='<span style="color:var(--danger)">💥 크리티컬!!!</span>'}
else if(inNormal){type='hit';res.innerHTML='<span style="color:var(--success)">✅ 적중!</span>'}
else{res.innerHTML='<span style="color:var(--text2)">❌ 빗나감...</span>'}
results.push({skillIdx:round,type});round++;
setTimeout(runRound,600)}}
runRound()})
}
function descArc(cx,cy,r,s,e){s=s-90;e=e-90;const sr=s*Math.PI/180,er=e*Math.PI/180;const x1=cx+r*Math.cos(sr),y1=cy+r*Math.sin(sr),x2=cx+r*Math.cos(er),y2=cy+r*Math.sin(er);const large=((e-s+360)%360>180)?1:0;return`M${x1},${y1}A${r},${r},0,${large},1,${x2},${y2}`}
function isInArc(a,s,e){if(e>s)return a>=s&&a<=e;return a>=s||a<=e}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
