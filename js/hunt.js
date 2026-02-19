// ===== HUNTING =====
let huntInProgress=false;
function renderHunt(){document.getElementById('hunt-floor').textContent=G.floor;updateAutoHuntUI();updateHuntStatus()}
function updateHuntStatus(){
// 왼쪽 상태 패널
var hp=document.getElementById('hs-hp');if(!hp)return;
hp.textContent=Math.floor(G.hp)+'/'+G.maxHP;
var effectiveAtk=G.atk+getEquipStat('ATK');
var effectiveDef=G.def+getEquipStat('DEF');
document.getElementById('hs-atk').textContent=effectiveAtk;
document.getElementById('hs-def').textContent=effectiveDef;
document.getElementById('hs-crit').textContent=(10+(G.critBonus||0))+'%';
document.getElementById('hs-aspd').textContent=(1+(G.atkSpeed||0)*0.1).toFixed(1)+'x';
document.getElementById('hs-hunger').textContent=Math.floor(G.hunger)+'%';
document.getElementById('hs-mood').textContent=Math.floor(G.mood)+'%';
document.getElementById('hs-level').textContent=G.level;
document.getElementById('hs-gold').textContent=G.gold;
document.getElementById('hs-floor').textContent=G.floor;
var hf=document.getElementById('hunt-floor');if(hf)hf.textContent=G.floor;
// 경험치 바
var expBar=document.getElementById('hunt-exp-bar');if(expBar){expBar.style.width=Math.min(100,G.exp)+'%'}
var expText=document.getElementById('hunt-exp-text');if(expText){expText.textContent=G.exp+'%'}
// HP 색상
hp.style.color=G.hp/G.maxHP>0.5?'var(--success)':G.hp/G.maxHP>0.25?'var(--hunger)':'var(--danger)';
// 모바일 미니 상태
var mlv=document.getElementById('hm-level');if(mlv)mlv.textContent=G.level;
var mhp=document.getElementById('hm-hp');if(mhp){mhp.textContent=Math.floor(G.hp)+'/'+G.maxHP;mhp.style.color=hp.style.color}
var mhu=document.getElementById('hm-hunger');if(mhu)mhu.textContent=Math.floor(G.hunger)+'%';
var mmo=document.getElementById('hm-mood');if(mmo)mmo.textContent=Math.floor(G.mood)+'%';
// 오른쪽 장비효과 패널
renderHuntMods();
}
function updateAutoHuntUI(){document.getElementById('auto-hunt-indicator').innerHTML=G.autoHunt?'<span class="auto-hunt-badge">자동</span>':'';document.getElementById('auto-hunt-btn').textContent=G.autoHunt?'⏹️ 자동 중지':'🔄 자동사냥'}
function toggleAutoHunt(){G.autoHunt=!G.autoHunt;updateAutoHuntUI();if(G.autoHunt&&!huntInProgress)startHunt()}

function getMoodMultiplier(){
if(G.mood>=80)return{exp:1.2,gold:1.2,drop:0.1};
if(G.mood>=50)return{exp:1.0,gold:1.0,drop:0};
if(G.mood>=20)return{exp:0.85,gold:0.85,drop:-0.1};
return{exp:0,gold:0,drop:0};
}

async function startHunt(){
if(huntInProgress)return;if(G.hp<=0){toast('HP가 부족합니다!');return}
if(G.mood<20){toast('기분이 너무 안 좋아서 사냥할 수 없습니다...');G.autoHunt=false;updateAutoHuntUI();return}
huntInProgress=true;document.getElementById('hunt-btn').disabled=true;
const log=document.getElementById('hunt-log');log.innerHTML='';
showBgSprite(G.className,'walk');
const isBoss=Math.random()<0.1;
const moodMult=getMoodMultiplier();

const tmpl=HUNT_TEMPLATES[Math.floor(Math.random()*HUNT_TEMPLATES.length)];
const enemy=isBoss?tmpl.boss:tmpl.enemies[Math.floor(Math.random()*tmpl.enemies.length)];
const enemyCount=isBoss?1:Math.floor(Math.random()*3)+1;

// === Phase 1: 이동 로딩 (1~8초) ===
const loadingText=LOADING_TEXTS[Math.floor(Math.random()*LOADING_TEXTS.length)];
await addHuntLine(loadingText,'loading',log);
const loadingDelay=1000+Math.floor(Math.random()*7000);
await wait(loadingDelay);

// === Phase 2: 조우 스토리 ===
const story=isBoss?BOSS_STORIES[Math.floor(Math.random()*BOSS_STORIES.length)]:NORMAL_STORIES[Math.floor(Math.random()*NORMAL_STORIES.length)];
await addHuntLine(story.intro.replace('{enemy}',enemy),'story',log);
await wait(700);
if(isBoss){await addHuntLine(`⚠️ 보스 출현! ${tmpl.bossEmoji} ${enemy}!`,'boss',log)}
else{await addHuntLine(`${enemy} ${enemyCount}마리가 나타났다!`,'story',log)}
await wait(600);

// === Phase 3: 보스 스킬체크 (수동만) ===
let skillCheckResults=null;
if(isBoss&&!G.autoHunt){
const rounds=5;
skillCheckResults=await bossSkillCheckPopup(rounds);
}

// === Phase 4: AI 전투 생성 (한번에) ===
showBgSprite(G.className,'idle');
await addHuntLine('⚔️ 전투 개시!','story',log);

// 전투 생성 (항상 로컬 — 스킬은 로컬이 제어)
let combat=generateCombatLocal(enemy,enemyCount,isBoss);

// 보스 스킬체크 결과 반영
if(skillCheckResults){
// 스킬체크에 따라 보상 보정
let scBonus=0;
skillCheckResults.rounds.forEach(r=>{
if(r.type==='critical')scBonus+=0.3;
else if(r.type==='hit')scBonus+=0.1;
else scBonus-=0.1;
});
combat.goldReward=Math.floor((combat.goldReward||0)*(1+scBonus));
combat.expReward=Math.floor((combat.expReward||0)*(1+scBonus));
}

// === Phase 5: 한줄씩 표시 ===
for(const line of combat.lines){
const type=mapLineType(line.type);
await addHuntLine(line.text,type,log,line.hits,line.charClass);
await wait(500);
}

// === Phase 6: 결과 처리 (파티 전체 피해 적용) ===
const won=combat.result==='win';
const takenMap=combat.totalTaken||{};
// 각 파티 멤버에게 피해 적용
if(G.party){
  for(let s=0;s<3;s++){
    if(G.party[s]&&takenMap[s]){
      G.party[s].hp=Math.max(1,G.party[s].hp-takenMap[s]);
    }
  }
  // 현재 활성 슬롯 G에 반영
  if(G.party[G.activeSlot])G.hp=G.party[G.activeSlot].hp;
}else{
  const totalTaken=takenMap[0]||0;
  G.hp=Math.max(1,G.hp-totalTaken);
}
G.hunger=Math.max(0,G.hunger-(isBoss?8:4));

if(won){
let goldReward=Math.floor((combat.goldReward||10)*moodMult.gold);
let expReward=Math.floor((combat.expReward||15)*moodMult.exp);
G.gold+=goldReward;G.exp+=expReward;
G.mood=Math.min(100,G.mood+(isBoss?15:5));
await addHuntLine(`획득: 💰 +${goldReward}, 경험치 +${expReward}`,'loot',log);

// 아이템 드롭
const baseDropRate=isBoss?0.5:0.1;
const luckBonus=((G.luckBonus||0)+getEquipStat('드롭률')+getEquipStat('행운'))/100;
const adjustedDropRate=Math.min(1,Math.max(0,baseDropRate+moodMult.drop+luckBonus));
if(Math.random()<adjustedDropRate){
await addHuntLine('✨ 뭔가 반짝이는 것이 보인다...','loot',log);
const item=await generateItem();
G.inventory.push(item);
await addHuntLine(`아이템 발견! [${item.name}] (${item.grade})`,'loot',log);
showItemDropPopup(item);
if(item.skillMods&&item.skillMods.length){
for(const m of item.skillMods){
await addHuntLine(`  ✦ ${m.mod}`,'loot',log);
}}}
if(isBoss){G.floor++;await addHuntLine(`🏆 보스 클리어! ${G.floor}층으로 진출!`,'victory',log);
}
// 레벨업 처리
while(G.exp>=100){G.exp-=100;G.level++;G.maxHP+=20;G.atk+=3;G.def+=2;G.hp=G.maxHP;
const lvlMsgs=['기분이 한결 좋아진 것 같다...','승리를 자축하는 중...','새로운 힘이 깨어나고 있다...','몸 속에서 에너지가 솟구친다...','한층 강해진 기분이다...','전투의 여운을 느끼는 중...','깊은 숨을 내쉬며 집중한다...','성장의 빛이 감싸고 있다...'];
const lvlMsg=lvlMsgs[Math.floor(Math.random()*lvlMsgs.length)];
await addHuntLine(`✨ ${lvlMsg}`,'loading',log);
const SKILL_LEVELS=[5,10,20,25];const PASSIVE_LEVELS=[15,30];
if(SKILL_LEVELS.includes(G.level)){await showSkillLearn('active');}
else if(PASSIVE_LEVELS.includes(G.level)){await showSkillLearn('passive');}
else{await showLevelUp(null);}}
}else{
G.mood=Math.max(0,G.mood-10)}

updateBars();updateHuntStatus();renderCharacter();renderEquipRow();saveGame();
huntInProgress=false;document.getElementById('hunt-btn').disabled=false;
if(G.autoHunt&&G.hp>G.maxHP*0.2){setTimeout(()=>{if(G.autoHunt)startHunt()},1500)}else{G.autoHunt=false;updateAutoHuntUI()}}

// Map AI line types to CSS classes
function mapLineType(type){
const map={action:'action',damage:'damage','enemy-atk':'enemy-atk',critical:'action',miss:'action',buff:'story',story:'story',victory:'victory',defeat:'damage',loot:'loot'};
return map[type]||'story';
}

function renderHuntMods(){
var list=document.getElementById('hunt-mods-list');if(!list)return;
var html='';
var slotNames={helmet:'투구',chest:'상의',gloves:'장갑',pants:'바지',boots:'신발',weapon:'주무기',necklace:'목걸이',ring1:'반지1',ring2:'반지2',offhand:'보조무기'};
Object.keys(G.equipment).forEach(function(slot){
var item=G.equipment[slot];if(!item)return;
var statsArr=[];
Object.entries(item.stats).forEach(function(e){if(e[1])statsArr.push(e[0]+' +'+e[1])});
var modsArr=[];
if(item.skillMods&&item.skillMods.length){item.skillMods.forEach(function(m){modsArr.push(m.mod||m)})}
var itemIcon=item.svgData?'<span class="item-svg item-svg-sm">'+item.svgData+'</span>':(item.emoji||'');
var gradeColor=GRADE_COLORS&&GRADE_COLORS[item.grade]||'#ccc';
html+='<div class="hm-item"><div class="hm-item-name">'+itemIcon+' <span style="color:'+gradeColor+'">'+item.name+'</span> <span style="opacity:.5;font-size:10px">'+(slotNames[slot]||slot)+'</span></div>';
if(statsArr.length)html+='<div class="hm-item-stat">'+statsArr.join(', ')+'</div>';
modsArr.forEach(function(m){html+='<div class="hm-item-mod">✦ '+m+'</div>'});
html+='</div>';
});
// 레벨업 버프 (같은 이름 합산)
if(G._appliedBuffs&&G._appliedBuffs.length){
html+='<div class="hm-divider"></div>';
html+='<div class="hm-section-title">⭐ 레벨업 버프</div>';
var buffMap={};var buffOrder=[];
G._appliedBuffs.forEach(function(b){
var name=typeof b==='string'?b:b.name;
var desc=typeof b==='object'&&b.desc?b.desc:'';
if(buffMap[name]){buffMap[name].count++}
else{buffMap[name]={desc:desc,count:1};buffOrder.push(name)}
});
buffOrder.forEach(function(name){
var b=buffMap[name];
var countText=b.count>1?' x'+b.count:'';
html+='<div class="hm-item"><div class="hm-item-mod">⭐ '+name+countText+(b.desc?' - '+b.desc:'')+'</div></div>';
});
}
if(!html){list.innerHTML='<div class="hm-empty">장착된 장비 없음</div>';return}
list.innerHTML=html;
}

// 모바일 팝업
function showMobilePopup(type){
const overlay=document.getElementById('mobile-popup-overlay');
const title=document.getElementById('mobile-popup-title');
const body=document.getElementById('mobile-popup-body');
if(type==='stat'){
title.textContent='📊 상태';
body.innerHTML=document.getElementById('hunt-stat-list').innerHTML;
}else{
title.textContent='✦ 장비 효과';
body.innerHTML=document.getElementById('hunt-mods-list').innerHTML;
}
overlay.classList.add('active');
}
function closeMobilePopup(){document.getElementById('mobile-popup-overlay').classList.remove('active')}

// 클래스별 기본 공격 액션
const CLASS_DEFAULT_ACTION={거너:'shot',궁수:'shot',마법사:'cast',드루이드:'cast',소환사:'cast',흑마법사:'cast',힐러:'cast'};

function getActionType(text,charClass){
const n=text||'';
if(n.includes('사격')||n.includes('저격')||n.includes('샷건')||n.includes('기관총')||n.includes('관통탄')||n.includes('화살')||n.includes('관통'))return 'shot';
if(n.includes('마법')||n.includes('파이어')||n.includes('아이스')||n.includes('메테오')||n.includes('라이트닝')||n.includes('치유')||n.includes('소환')||n.includes('저주')||n.includes('힐')||n.includes('빛')||n.includes('정화')||n.includes('축복')||n.includes('보호막')||n.includes('노바')||n.includes('볼')||n.includes('정령')||n.includes('덩굴')||n.includes('벌떼')||n.includes('흡수')||n.includes('역병')||n.includes('공포')||n.includes('재생'))return 'cast';
if(n.includes('방패')||n.includes('방어')||n.includes('보호'))return 'block';
// 평타는 모든 클래스 slash (스킬과 구별)
if(n.includes('평타'))return 'slash';
return CLASS_DEFAULT_ACTION[charClass||G.className]||'slash';
}

function showBgSprite(className,actionType,loops,keepAfter){
const el=document.getElementById('hunt-bg-sprite');
if(!el)return;
const charData=CHAR_SVG[className];
if(!charData||charData.type!=='sprite'){el.style.backgroundImage='';el.style.width='0';return}
const anim=charData[actionType]||charData.slash||charData.idle;
if(!anim){el.style.backgroundImage='';el.style.width='0';return}
// 고정 크기 컨테이너 — 모든 액션에서 동일한 위치 유지
const FIXED_W=200;
const FIXED_H=200;
const scale=FIXED_H/anim.h;
const sw=Math.round(anim.w*scale);
const sh=FIXED_H;
const stw=Math.round(anim.tw*scale);
// 프레임을 고정 컨테이너 중앙에 배치
const offsetX=Math.round((FIXED_W-sw)/2);
const animName='bg-'+className+'-'+actionType;
if(!document.getElementById('style-'+animName)){
  const s=document.createElement('style');s.id='style-'+animName;
  s.textContent='@keyframes '+animName+'{from{background-position:'+offsetX+'px 0}to{background-position:'+(offsetX-stw)+'px 0}}';
  document.head.appendChild(s);
}
const loopCount=loops||1;
const isIdle=actionType==='idle'||actionType==='walk';
const oneCycleDur=8*0.1;
el.style.animation='none';
el.style.backgroundImage="url('"+anim.src+SPRITE_VER+"')";
el.style.width=FIXED_W+'px';
el.style.height=sh+'px';
el.style.backgroundSize=stw+'px '+sh+'px';
el.style.backgroundPosition=offsetX+'px 0';
el.offsetHeight;
el.style.animation=animName+' '+oneCycleDur+'s steps(8) '+(isIdle?'infinite':loopCount);
el.classList.add('active');
clearTimeout(el._idleTimer);
if(!isIdle){
  el._idleTimer=setTimeout(function(){showBgSprite(className,'idle')},oneCycleDur*loopCount*1000);
}
}

function addHuntLine(text,cls,log,hits,charClass){return new Promise(r=>{const d=document.createElement('div');d.className='hunt-line '+cls;d.style.width='fit-content';d.style.maxWidth='90%';d.style.position='relative';
if(cls==='action'||cls==='critical'){
const spriteClass=charClass||G.className;
const actionType=getActionType(text,spriteClass);
const loops=hits||1;
showBgSprite(spriteClass,actionType,loops,true);
d.textContent=text;
d.style.textAlign='left';d.style.marginRight='auto';d.style.marginLeft='8px';d.classList.add('hunt-slide-right');
d._isAttack=true;d._isCrit=cls==='critical';
}
else if(cls==='enemy-atk'){
const hitChar=charClass||G.className;
showBgSprite(hitChar,'block',1);
d.textContent=text;d.style.textAlign='left';d.style.marginRight='auto';d.style.marginLeft='8px';d.style.color='#ff6b6b';d.classList.add('hunt-slide-left');
// 적 공격 데미지 팝업
const dmgMatch=text.match(/-(\d+)\s*HP/);
if(dmgMatch){const pop=document.createElement('span');pop.className='hunt-dmg-pop player-dmg';pop.textContent='-'+dmgMatch[1];d.appendChild(pop);setTimeout(()=>pop.remove(),1500)}
}
else if(cls==='damage'){d.textContent=text;d.style.textAlign='right';d.style.marginLeft='auto';d.style.marginRight='8px';d.classList.add('hunt-hit-shake');
// 데미지 숫자 팝업
const dmgMatch=text.match(/(\d+)\s*피해/);
if(dmgMatch){
const prevAtk=log.querySelector('.hunt-line.hunt-slide-right:last-of-type');
const pop=document.createElement('span');pop.className='hunt-dmg-pop enemy-dmg';pop.textContent=dmgMatch[1];
if(text.includes('처치'))pop.textContent+=' 💀';
d.appendChild(pop);setTimeout(()=>pop.remove(),1500);
}
}
else if(cls==='loading'){d.textContent=text;d.style.textAlign='center';d.style.margin='0 auto';d.style.opacity='.6';d.style.fontStyle='italic'}
else{d.textContent=text;d.style.textAlign='center';d.style.margin='0 auto'}
log.appendChild(d);log.scrollTop=log.scrollHeight;updateHuntStatus();const spd=['buff','miss'].includes(cls)?250:500;setTimeout(r,spd)})}

// ===== BOSS SKILL CHECK POPUP =====
function bossSkillCheckPopup(totalRounds){
return new Promise(resolve=>{
const results=[];let round=0;
const speed=2.5+G.floor*0.15;
const normalZone=18;const critZone=5;

const overlay=document.createElement('div');
overlay.className='sc-popup-overlay';
overlay.innerHTML='<div class="sc-popup"><div class="sc-popup-title">⚡ 스킬 체크</div><div class="sc-popup-content" id="sc-popup-content"></div></div>';
document.body.appendChild(overlay);
requestAnimationFrame(()=>overlay.classList.add('active'));
const content=overlay.querySelector('#sc-popup-content');

function runRound(){
if(round>=totalRounds){
overlay.classList.remove('active');
setTimeout(()=>overlay.remove(),300);
resolve({rounds:results});return}

const critStart=Math.floor(Math.random()*360);
const normalStart=(critStart-normalZone+360)%360;
const critEnd=(critStart+critZone)%360;
const skill=G.equippedSkills[round%G.equippedSkills.length]||{icon:'👊',name:'평타'};

content.innerHTML=`
<div class="sc-round-info">${skill.icon} ${skill.name} — 라운드 ${round+1}/${totalRounds}</div>
<div class="sc-gauge"><svg viewBox="0 0 200 200">
<circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14"/>
<path d="${descArc(100,100,85,normalStart,(normalStart+normalZone*2+critZone)%360)}" fill="none" stroke="rgba(0,232,143,.3)" stroke-width="14" stroke-linecap="round"/>
<path d="${descArc(100,100,85,critStart,critEnd)}" fill="none" stroke="rgba(255,68,102,.5)" stroke-width="14" stroke-linecap="round"/>
<line id="sc-needle" x1="100" y1="100" x2="100" y2="20" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"/>
</svg></div>
<div class="sc-info"><span>🟢 일반</span><span>🔴 크리티컬</span></div>
<button class="btn sc-popup-btn" id="sc-popup-btn">⚡ 공격!</button>
<div class="sc-result" id="sc-popup-result"></div>`;

let angle=0,running=true,anim;
const needle=()=>content.querySelector('#sc-needle');
function tick(){if(!running)return;angle=(angle+speed)%360;const n=needle();if(n)n.setAttribute('transform','rotate('+angle+',100,100)');anim=requestAnimationFrame(tick)}
tick();

const btn=content.querySelector('#sc-popup-btn');
function doCheck(){
if(!running)return;
running=false;if(anim)cancelAnimationFrame(anim);btn.disabled=true;btn.style.opacity='.4';
const a=angle;
const inCrit=isInArc(a,critStart,critEnd);
const inNormal=isInArc(a,normalStart,(normalStart+normalZone*2+critZone)%360);
const res=content.querySelector('#sc-popup-result');
let type='miss';
if(inCrit){type='critical';res.innerHTML='<span style="color:var(--danger);font-size:20px;font-weight:700">💥 크리티컬!!!</span>'}
else if(inNormal){type='hit';res.innerHTML='<span style="color:var(--success);font-size:18px;font-weight:700">✅ 적중!</span>'}
else{res.innerHTML='<span style="color:var(--text2);font-size:16px">❌ 빗나감...</span>'}
results.push({skillIdx:round,type});round++;
setTimeout(runRound,800);
}

btn.addEventListener('touchstart',function(e){e.preventDefault();doCheck()},{passive:false,once:true});
btn.addEventListener('mousedown',function(e){e.preventDefault();doCheck()},{once:true});
}
runRound();
})}

function descArc(cx,cy,r,s,e){s=s-90;e=e-90;const sr=s*Math.PI/180,er=e*Math.PI/180;const x1=cx+r*Math.cos(sr),y1=cy+r*Math.sin(sr),x2=cx+r*Math.cos(er),y2=cy+r*Math.sin(er);const large=((e-s+360)%360>180)?1:0;return`M${x1},${y1}A${r},${r},0,${large},1,${x2},${y2}`}
function isInArc(a,s,e){if(e>s)return a>=s&&a<=e;return a>=s||a<=e}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
