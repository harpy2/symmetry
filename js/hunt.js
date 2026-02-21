// ===== HUNTING =====
let huntInProgress=false;
function renderHunt(){document.getElementById('hunt-floor').textContent=G.floor;var hl=document.getElementById('hunt-label');if(hl)hl.textContent=t('사냥');var hfp=document.getElementById('hunt-floor-prefix');if(hfp)hfp.textContent=LANG==='ko'?'':'Fl.';var hfs=document.getElementById('hunt-floor-suffix');if(hfs)hfs.textContent=LANG==='ko'?'층':'';updateAutoHuntUI();updateHuntStatus();
if(G.autoHunt&&!huntInProgress){setTimeout(()=>{if(G.autoHunt&&!huntInProgress)startHunt()},500)}}
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
var _etl=Math.floor(100+(G.level||1)*5);
var expBar=document.getElementById('hunt-exp-bar');if(expBar){expBar.style.width=Math.min(100,G.exp/_etl*100)+'%'}
var expText=document.getElementById('hunt-exp-text');if(expText){expText.textContent=G.exp+'/'+_etl}
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
function updateAutoHuntUI(){document.getElementById('auto-hunt-indicator').innerHTML=G.autoHunt?`<span class="auto-hunt-badge">${t('자동')}</span>`:'';if(typeof _challengeActive==='undefined'||!_challengeActive){document.getElementById('auto-hunt-btn').textContent=G.autoHunt?t('⏹️ 자동 중지'):t('🔄 자동사냥')}}
function toggleAutoHunt(){G.autoHunt=!G.autoHunt;updateAutoHuntUI();if(G.autoHunt&&!huntInProgress)startHunt()}

function getMoodMultiplier(){
if(G.mood>=80)return{exp:1.2,gold:1.2,drop:0.1};
if(G.mood>=50)return{exp:1.0,gold:1.0,drop:0};
if(G.mood>=20)return{exp:0.85,gold:0.85,drop:-0.1};
return{exp:0,gold:0,drop:0};
}

async function startHunt(forceBoss){
if(huntInProgress)return;if(G.hp<=0){toast(t('HP가 부족합니다!'));return}
if(G.mood<20){toast(t('기분이 너무 안 좋아서 사냥할 수 없습니다...'));G.autoHunt=false;updateAutoHuntUI();return}
huntInProgress=true;document.getElementById('hunt-btn').disabled=true;
const log=document.getElementById('hunt-log');log.innerHTML='';
showBgSprite(G.className,'walk');
const isBoss=forceBoss||Math.random()<0.15;
const moodMult=getMoodMultiplier();

// 구간 스토리 체크
initStats();
const stage=getStageInfo(G.floor);
if(!G._lastStage||G._lastStage!==stage.name){G._lastStage=stage.name;await showStageTransition(stage)}

const tmpl=HUNT_TEMPLATES[Math.floor(Math.random()*HUNT_TEMPLATES.length)];
const enemyRaw=isBoss?tmpl.boss:tmpl.enemies[Math.floor(Math.random()*tmpl.enemies.length)];
const enemy=t(enemyRaw);
// 도감 등록
addToCodex('monster',enemyRaw);
const maxByFloor=G.level<5?2:Math.min(20,Math.max(5,Math.floor(G.floor/10)+5));
const enemyCount=isBoss?1:Math.floor(Math.random()*maxByFloor)+1;

// === Phase 1: 이동 로딩 (1~8초) ===
const loadingText=LOADING_TEXTS[Math.floor(Math.random()*LOADING_TEXTS.length)];
await addHuntLine(t(loadingText),'loading',log);
const loadingDelay=1000+Math.floor(Math.random()*7000);
await wait(loadingDelay);

// === Phase 2: 조우 스토리 ===
const story=isBoss?BOSS_STORIES[Math.floor(Math.random()*BOSS_STORIES.length)]:NORMAL_STORIES[Math.floor(Math.random()*NORMAL_STORIES.length)];
await addHuntLine(t(story.intro).replace('{enemy}',enemy),'story',log);
await wait(700);
if(isBoss){await addHuntLine(t('⚠️ 보스 출현! {0} {1}!',tmpl.bossEmoji,enemy),'boss',log)}
else{await addHuntLine(t('{0} {1}마리가 나타났다!',enemy,enemyCount),'story',log)}
await wait(600);

// === Phase 3: AI 전투 생성 ===
showBgSprite(G.className,'idle');
await addHuntLine(t('⚔️ 전투 개시!'),'story',log);

let combat=generateCombatLocal(enemy,enemyCount,isBoss);

// === Phase 5: 한줄씩 표시 (HP 실시간 반영, buff는 묶어서 표시) ===
let _liveTaken={};
// buff 라인 묶기: 연속된 buff를 하나로 합침
const displayLines=[];
for(let li=0;li<combat.lines.length;li++){
const line=combat.lines[li];
if(line.type==='buff'){
const buffGroup=[line.text];
while(li+1<combat.lines.length&&combat.lines[li+1].type==='buff'){li++;buffGroup.push(combat.lines[li].text)}
displayLines.push({text:buffGroup.join(' | '),type:'buff',hits:null,charClass:null,_grouped:true});
}else{displayLines.push(line)}
}
for(const line of displayLines){
const type=mapLineType(line.type);
await addHuntLine(line.text,type,log,line.hits,line.charClass);
// enemy-atk 시 HP 실시간 차감 표시
if(line.type==='enemy-atk'&&line.dmg>0){
const tSlot=line.charClass&&G.party?G.party.findIndex(p=>p&&p.className===line.charClass):G.activeSlot;
const slot=tSlot>=0?tSlot:G.activeSlot;
_liveTaken[slot]=(_liveTaken[slot]||0)+line.dmg;
// 임시로 G.hp 반영 (표시용)
if(slot===G.activeSlot){G.hp=Math.max(0,G.hp-line.dmg)}
else if(G.party&&G.party[slot]){G.party[slot].hp=Math.max(0,G.party[slot].hp-line.dmg)}
updateHuntStatus();
}
// 힐/버프 시 HP 회복 표시
if(line.type==='buff'&&line.text&&(line.text.includes('+')&&line.text.includes('HP')||line.text.includes(t('흡혈'))||line.text.includes(t('재생'))||line.text.includes(t('힐')))){
updateHuntStatus();
}
await wait(500);
}

// === Phase 6: 결과 처리 (실시간 반영 안 된 나머지 피해 적용) ===
const won=combat.result==='win';
const takenMap=combat.totalTaken||{};
if(G.party){
  for(let s=0;s<3;s++){
    if(G.party[s]&&takenMap[s]){
      const remaining=Math.max(0,takenMap[s]-(_liveTaken[s]||0));
      if(remaining>0)G.party[s].hp=Math.max(0,G.party[s].hp-remaining);
    }
  }
  if(G.party[G.activeSlot])G.hp=G.party[G.activeSlot].hp;
}else{
  const remaining=Math.max(0,(takenMap[0]||0)-(_liveTaken[0]||0));
  if(remaining>0)G.hp=Math.max(0,G.hp-remaining);
}
G.hunger=Math.max(0,G.hunger-(isBoss?8:4));

if(won){
let goldReward=Math.floor((combat.goldReward||10)*moodMult.gold);
let expReward=Math.floor((combat.expReward||15)*moodMult.exp);
G.gold+=goldReward;G.exp+=expReward;
// 스탯 추적
G.stats.kills+=enemyCount;G.stats.goldEarned+=goldReward;
if(isBoss)G.stats.bossKills++;
const critLines=combat.lines.filter(l=>l.type==='critical').length;
G.stats.crits+=critLines;
updateQuestProgress('dailyBattles',1);
updateQuestProgress('dailyKills',enemyCount);
if(isBoss)updateQuestProgress('dailyBossKills',1);
updateQuestProgress('dailyCrits',critLines);
updateQuestProgress('dailyGoldEarned',goldReward);
// 서브 캐릭도 동일 경험치
for(let _s=0;_s<3;_s++){if(_s!==G.activeSlot&&G.slotUnlocked[_s]&&G.party[_s]){if(!G.party[_s].exp)G.party[_s].exp=0;G.party[_s].exp+=expReward;}}
G.mood=Math.min(100,G.mood+(isBoss?15:5));
await addHuntLine(t('획득: 💰 +{0}, 경험치 +{1}',goldReward,expReward),'loot',log);

// 아이템 드롭
const baseDropRate=isBoss?0.5:0.1;
const luckBonus=((G.luckBonus||0)+getEquipStat('드롭률')+getEquipStat('행운'))/100;
const adjustedDropRate=Math.min(1,Math.max(0,baseDropRate+moodMult.drop+luckBonus));
if(Math.random()<adjustedDropRate){
await addHuntLine(t('✨ 뭔가 반짝이는 것이 보인다...'),'loot',log);
const item=await generateItem();
G.inventory.push(item);
await addHuntLine(t('아이템 발견! [{0}] ({1})',item.name,t(item.grade)),'loot',log);
addToCodex('item',item.name);G.stats.itemsFound++;updateQuestProgress('dailyItems',1);
showItemDropPopup(item);
if(item.skillMods&&item.skillMods.length){
for(const m of item.skillMods){
await addHuntLine(`  ✦ ${m.mod}`,'loot',log);
}}}
if(isBoss){G.floor++;
if(!G.weeklyStats)G.weeklyStats={};G.weeklyStats.weeklyFloors=(G.weeklyStats.weeklyFloors||0)+1;
trackEvent('floor_clear',{floor:G.floor,level:G.level,class:G.className});
await addHuntLine(t('🏆 보스 클리어! {0}층으로 진출!',G.floor),'victory',log);
}
// 레벨업 처리
const expToLevel=()=>Math.floor(100+G.level*5);
while(G.exp>=expToLevel()){G.exp-=expToLevel();G.level++;G.maxHP+=8;G.atk+=1;G.def+=1;G.hp=G.maxHP;
trackEvent('level_up',{level:G.level,floor:G.floor,class:G.className});
const lvlMsgs=['기분이 한결 좋아진 것 같다...','승리를 자축하는 중...','새로운 힘이 깨어나고 있다...','몸 속에서 에너지가 솟구친다...','한층 강해진 기분이다...','전투의 여운을 느끼는 중...','깊은 숨을 내쉬며 집중한다...','성장의 빛이 감싸고 있다...'];
const lvlMsg=lvlMsgs[Math.floor(Math.random()*lvlMsgs.length)];
await addHuntLine(`✨ ${t(lvlMsg)}`,'loading',log);
const SKILL_LEVELS=[5,10,20,25];const PASSIVE_LEVELS=[15,30];
if(SKILL_LEVELS.includes(G.level)){await showSkillLearn('active',G.activeSlot);}
else if(PASSIVE_LEVELS.includes(G.level)){await showSkillLearn('passive',G.activeSlot);}
else{await showLevelUp(null,G.activeSlot);}}
// 서브 캐릭터 레벨업 (독립 EXP 기반)
for(let _s=0;_s<3;_s++){
if(_s===G.activeSlot||!G.slotUnlocked[_s]||!G.party[_s])continue;
const sub=G.party[_s];if(!sub.exp)sub.exp=0;
const SKILL_LEVELS=[5,10,20,25];const PASSIVE_LEVELS=[15,30];
const subExpToLevel=()=>Math.floor(100+(sub.level||1)*5);
while(sub.exp>=subExpToLevel()){sub.exp-=subExpToLevel();sub.level=(sub.level||1)+1;sub.maxHP=(sub.maxHP||100)+8;sub.atk=(sub.atk||15)+1;sub.def=(sub.def||8)+1;sub.hp=sub.maxHP;
await addHuntLine(`✨ ${t(sub.className)} ${t('레벨 업!')} Lv.${sub.level}`,'loading',log);
if(SKILL_LEVELS.includes(sub.level)){await showSkillLearn('active',_s);}
else if(PASSIVE_LEVELS.includes(sub.level)){await showSkillLearn('passive',_s);}
else{await showLevelUp(null,_s);}
}}
}else{
// 패배해도 경험치 획득
let expReward=Math.floor((combat.expReward||15)*moodMult.exp);
G.exp+=expReward;
for(let _s=0;_s<3;_s++){if(_s!==G.activeSlot&&G.slotUnlocked[_s]&&G.party[_s]){if(!G.party[_s].exp)G.party[_s].exp=0;G.party[_s].exp+=expReward;}}
await addHuntLine(t('패배했지만 경험치 +{0} 획득',expReward),'loot',log);
G.mood=Math.max(0,G.mood-10);trackEvent('battle_defeat',{floor:G.floor,level:G.level,class:G.className});
// 패배 시에도 레벨업 처리
const expToLevelD=()=>Math.floor(100+G.level*5);
while(G.exp>=expToLevelD()){G.exp-=expToLevelD();G.level++;G.maxHP+=8;G.atk+=1;G.def+=1;G.hp=G.maxHP;
const SKILL_LEVELS=[5,10,20,25];const PASSIVE_LEVELS=[15,30];
if(SKILL_LEVELS.includes(G.level)){await showSkillLearn('active',G.activeSlot);}
else if(PASSIVE_LEVELS.includes(G.level)){await showSkillLearn('passive',G.activeSlot);}
else{await showLevelUp(null,G.activeSlot);}}
for(let _s=0;_s<3;_s++){
if(_s===G.activeSlot||!G.slotUnlocked[_s]||!G.party[_s])continue;
const sub=G.party[_s];if(!sub.exp)sub.exp=0;
const subEtl=()=>Math.floor(100+(sub.level||1)*5);
while(sub.exp>=subEtl()){sub.exp-=subEtl();sub.level=(sub.level||1)+1;sub.maxHP=(sub.maxHP||100)+8;sub.atk=(sub.atk||15)+1;sub.def=(sub.def||8)+1;sub.hp=sub.maxHP;
const SKILL_LEVELS=[5,10,20,25];const PASSIVE_LEVELS=[15,30];
if(SKILL_LEVELS.includes(sub.level)){await showSkillLearn('active',_s);}
else if(PASSIVE_LEVELS.includes(sub.level)){await showSkillLearn('passive',_s);}
else{await showLevelUp(null,_s);}
}}
}

// 패배 시 처리
if(!won){
// 전멸(파티 전원 사망)일 때만 골드 패널티
if(combat.allPartyDead){
const penalty=Math.floor(G.gold*0.1);
if(penalty>0){G.gold-=penalty;await addHuntLine(t('전멸 패널티: 골드')+` -${penalty} 💸`,'defeat',log)}
}
// HP 50% 회복
G.hp=Math.max(1,Math.floor(G.maxHP*0.5));
if(G.party){for(let _s=0;_s<3;_s++){if(G.party[_s]&&G.slotUnlocked[_s]){G.party[_s].hp=Math.max(1,Math.floor((G.party[_s].maxHP||G.party[_s].hp)*0.5))}}}
}else{
if(G.hp<=0)G.hp=1;
if(G.party){for(let _s=0;_s<3;_s++){if(G.party[_s]&&G.party[_s].hp<=0)G.party[_s].hp=1}}
}

updateBars();updateHuntStatus();renderCharacter();renderEquipRow();saveGame();
huntInProgress=false;document.getElementById('hunt-btn').disabled=false;
checkAchievements();
if(G.autoHunt){setTimeout(()=>{if(G.autoHunt)startHunt()},1500)}else{updateAutoHuntUI()}}

// Map AI line types to CSS classes
function mapLineType(type){
const map={action:'action',damage:'damage','enemy-atk':'enemy-atk',critical:'critical',miss:'action',buff:'story',story:'story',victory:'victory',defeat:'defeat',loot:'loot'};
return map[type]||'story';
}

function renderHuntMods(){
var list=document.getElementById('hunt-mods-list');if(!list)return;
var html='';
var slotNames={helmet:t('투구'),chest:t('상의'),gloves:t('장갑'),pants:t('바지'),boots:t('신발'),weapon:t('주무기'),necklace:t('목걸이'),ring1:t('반지1'),ring2:t('반지2'),offhand:t('보조무기')};
Object.keys(G.equipment).forEach(function(slot){
var item=G.equipment[slot];if(!item)return;
var statsArr=[];
Object.entries(item.stats).forEach(function(e){if(e[1])statsArr.push(tStat(e[0])+' +'+e[1])});
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
html+=`<div class="hm-section-title">⭐ ${t('레벨업 버프')}</div>`;
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
if(!html){list.innerHTML=`<div class="hm-empty">${t('장착된 장비 없음')}</div>`;return}
list.innerHTML=html;
}

// 모바일 팝업
function showMobilePopup(type){
const overlay=document.getElementById('mobile-popup-overlay');
const title=document.getElementById('mobile-popup-title');
const body=document.getElementById('mobile-popup-body');
if(type==='stat'){
title.textContent=t('📊 상태');
const descs={};descs['❤️ HP']=t('체력 — 0이 되면 전투 불능');descs['⚔️ '+t('공격력')]=t('스킬/평타 데미지에 반영. 소환수도 ATK 기반');descs['🛡️ '+t('방어력')]=t('받는 피해 감소');descs['💥 '+t('치명타')]=t('크리티컬 확률 — 발동 시 1.5~2.5배 데미지');descs['⚡ '+t('공격속도')]=t('추가 공격 확률 — 턴당 2회 공격 (캡 50%)');descs['🍖 '+t('배고픔')]=t('낮으면 사냥 불가');descs['😊 '+t('기분')]=t('낮으면 사냥 불가, 패배 시 감소');
const el=document.getElementById('hunt-stat-list').cloneNode(true);
el.querySelectorAll('.hs-row').forEach(row=>{const label=row.querySelector('.hs-label');if(!label)return;const d=descs[label.textContent.trim()];if(d){const desc=document.createElement('div');desc.style.cssText='font-size:10px;color:var(--text2);margin-top:1px;padding-left:2px';desc.textContent=d;row.appendChild(desc);row.style.flexWrap='wrap'}});
let statHtml=el.innerHTML;
for(let s=0;s<3;s++){if(s===G.activeSlot||!G.slotUnlocked||!G.slotUnlocked[s]||!G.party||!G.party[s])continue;const c=G.party[s];const cls=CLASSES[c.className];if(!cls)continue;
statHtml+=`<div style="border-top:1px solid var(--border);margin-top:8px;padding-top:8px"><div style="color:var(--gold);font-weight:700;font-size:13px;margin-bottom:4px">${cls.weapon} ${t(c.className)} (Lv.${c.level})</div><div style="font-size:12px;line-height:1.8;color:var(--text1)">❤️ HP: ${Math.floor(c.hp)}/${c.maxHP}<br>⚔️ ATK: ${c.atk}<br>🛡️ DEF: ${c.def}<br>🎯 ${t('치명타')}: ${10+(c.critBonus||0)}%<br>📊 EXP: ${c.exp||0}%</div></div>`}
body.innerHTML=statHtml;
}else if(type==='skills'){
title.textContent=t('🗡️ 스킬');
let html='';
for(let s=0;s<3;s++){
let char,cls;
if(s===G.activeSlot||s===0){char={className:G.className,level:G.level,equippedSkills:G.equippedSkills,equippedPassives:G.equippedPassives};cls=CLASSES[G.className]}
else{if(!G.slotUnlocked||!G.slotUnlocked[s]||!G.party||!G.party[s])continue;char=G.party[s];cls=CLASSES[char.className]}
if(!cls)continue;
const actives=char.equippedSkills||[];const passives=char.equippedPassives||[];
html+=`<div style="margin-bottom:10px"><div style="color:var(--gold);font-weight:700;font-size:13px;margin-bottom:4px">${cls.weapon} ${t(char.className)} (Lv.${char.level})</div>`;
if(actives.length>0){actives.forEach(sk=>{html+=`<div style="font-size:12px;padding:2px 0">${sk.icon} <b>${sk.name}</b> <span style="color:var(--text2)">${sk.desc||''}</span></div>`})}
if(passives.length>0){passives.forEach(sk=>{html+=`<div style="font-size:12px;padding:2px 0;color:var(--cyan)">${sk.icon} <b>${sk.name}</b> <span style="opacity:.7">${sk.desc||''}</span></div>`})}
if(actives.length===0&&passives.length===0)html+=`<div style="font-size:12px;color:var(--text2)">${t('스킬 없음')}</div>`;
html+='</div>';
}
body.innerHTML=html||`<div style="color:var(--text2)">${t('스킬 없음')}</div>`;
}else if(type==='settings'){
title.textContent=t('⚙️ 설정');
body.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px">
<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px"><input type="checkbox" ${G.autoLevelUp?'checked':''} onchange="G.autoLevelUp=this.checked;saveGame()"> ${t('🤖 레벨업 자동 선택')}</label>
<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px"><input type="checkbox" ${G.autoHunt?'checked':''} onchange="G.autoHunt=this.checked;updateAutoHuntUI();saveGame()"> ${t('🔄 자동 사냥')}</label>
</div>`;
}else{
title.textContent=t('✦ 장비 효과');
body.innerHTML=document.getElementById('hunt-mods-list').innerHTML;
}
overlay.classList.add('active');
}
function closeMobilePopup(){document.getElementById('mobile-popup-overlay').classList.remove('active')}

// 클래스별 기본 공격 액션
// 클래스별 스킬 사용 시 기본 액션 (평타가 아닌 스킬)
const CLASS_SKILL_ACTION={거너:'shot',궁수:'shot',마법사:'cast',드루이드:'cast',소환사:'cast',흑마법사:'cast',힐러:'cast',엔지니어:'shot'};

function getActionType(text,charClass){
const n=text||'';
// 평타 → 클래스 기본 액션
if(n.includes('평타'))return CLASS_SKILL_ACTION[charClass||G.className]||'slash';
// 원거리 공격 → shot
if(n.includes('사격')||n.includes('저격')||n.includes('샷건')||n.includes('기관총')||n.includes('관통탄')||n.includes('화살')||n.includes('관통')||n.includes('터렛')||n.includes('드론')||n.includes('폭발'))return 'shot';
// 마법/주문 → cast
if(n.includes('마법')||n.includes('파이어')||n.includes('아이스')||n.includes('메테오')||n.includes('라이트닝')||n.includes('치유')||n.includes('소환')||n.includes('저주')||n.includes('힐')||n.includes('빛')||n.includes('정화')||n.includes('축복')||n.includes('보호막')||n.includes('노바')||n.includes('볼')||n.includes('정령')||n.includes('덩굴')||n.includes('벌떼')||n.includes('흡수')||n.includes('역병')||n.includes('공포')||n.includes('재생')||n.includes('시전')||n.includes('주문'))return 'cast';
// 방어 → block
if(n.includes('방패')||n.includes('방어')||n.includes('보호'))return 'block';
// 근접 키워드 → slash
if(n.includes('베기')||n.includes('찌르기')||n.includes('난도질')||n.includes('일격')||n.includes('참격')||n.includes('연타')||n.includes('기습')||n.includes('암살')||n.includes('백스탭'))return 'slash';
// 클래스별 기본 스킬 액션 (평타가 아닌 경우)
return CLASS_SKILL_ACTION[charClass||G.className]||'slash';
}

function showBgSprite(className,actionType,loops,keepAfter){
const el=document.getElementById('hunt-bg-sprite');
if(!el)return;
const charData=CHAR_SVG[className];
if(!charData||charData.type!=='sprite'){el.style.backgroundImage='';el.style.width='0';return}
const anim=charData[actionType]||charData.slash||charData.idle;
if(!anim){el.style.backgroundImage='';el.style.width='0';return}
// 512x512 고정 컨테이너 (128px 스프라이트 4배)
const BOX=512;
const scale=BOX/anim.h;
const stw=Math.round(anim.tw*scale);
const animName='bg-'+className+'-'+actionType;
if(!document.getElementById('style-'+animName)){
  const s=document.createElement('style');s.id='style-'+animName;
  s.textContent='@keyframes '+animName+'{from{background-position:0 0}to{background-position:-'+stw+'px 0}}';
  document.head.appendChild(s);
}
const loopCount=loops||1;
const isIdle=actionType==='idle'||actionType==='walk';
const oneCycleDur=8*0.1;
// 깜빡임 방지: animation만 교체, opacity 유지
el.style.backgroundImage="url('"+anim.src+SPRITE_VER+"')";
el.style.width=BOX+'px';
el.style.height=BOX+'px';
el.style.backgroundSize=stw+'px '+BOX+'px';
el.style.backgroundPosition='0 0';
el.style.animation='none';
void el.offsetHeight;
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
// 빗나감이면 idle 유지, 맞으면 block
const isMiss=text.includes('빗나감')||text.includes('Miss');
if(!isMiss)showBgSprite(hitChar,'block',1);
d.textContent=text;d.style.textAlign='left';d.style.marginRight='auto';d.style.marginLeft='8px';d.style.color='#ff6b6b';d.classList.add('hunt-slide-left');
const dmgMatch=text.match(/-(\d+)\s*HP/);
if(dmgMatch){const pop=document.createElement('span');pop.className='hunt-dmg-pop player-dmg';pop.textContent='-'+dmgMatch[1];d.appendChild(pop);setTimeout(()=>pop.remove(),1500)}
}
else if(cls==='victory'){
showBgSprite(G.className,'idle');
d.textContent=text;d.style.textAlign='center';d.style.margin='0 auto';
}
else if(cls==='defeat'){
d.textContent=text;d.style.textAlign='center';d.style.margin='0 auto';
}
else if(cls==='damage'){d.textContent=text;d.style.textAlign='right';d.style.marginLeft='auto';d.style.marginRight='8px';d.classList.add('hunt-hit-shake');
// 데미지 숫자 팝업
const dmgMatch=text.match(/(\d+)\s*(?:피해|damage)/);
if(dmgMatch){
const prevAtk=log.querySelector('.hunt-line.hunt-slide-right:last-of-type');
const pop=document.createElement('span');pop.className='hunt-dmg-pop enemy-dmg';pop.textContent=dmgMatch[1];
if(text.includes('처치')||text.includes('killed'))pop.textContent+=' 💀';
d.appendChild(pop);setTimeout(()=>pop.remove(),1500);
}
}
else if(cls==='loading'){d.textContent=text;d.style.textAlign='center';d.style.margin='0 auto';d.style.opacity='.6';d.style.fontStyle='italic'}
else{d.textContent=text;d.style.textAlign='center';d.style.margin='0 auto'}
log.appendChild(d);log.scrollTop=log.scrollHeight;updateHuntStatus();const spd=['buff','miss'].includes(cls)?250:500;setTimeout(r,spd)})}

// ===== BOSS SKILL CHECK POPUP =====
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
