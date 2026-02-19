// ===== AI MODULE =====
const AI_API = 'https://symmetry-api.harpy922.workers.dev/api/generate';

async function aiGenerate(type, context, fallback) {
  try {
    const res = await fetch(AI_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, context })
    });
    if (!res.ok) throw new Error('API ' + res.status);
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn('AI fallback:', e);
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}

// ===== AI ITEM GENERATION =====
async function generateItemAI() {
  const ctx = {
    class: G.className,
    level: G.level,
    floor: G.floor,
    skills: G.equippedSkills.map(s => s.name)
  };
  const fallbackItem = await generateItem();

  const result = await aiGenerate('item', ctx, fallbackItem);

  if (result && result.name && result.type && result.grade && result.stats) {
    if (!result.id) result.id = Date.now() + Math.random();
    if (!result.emoji) result.emoji = result.type === 'weapon' ? '🗡️' : result.type === 'armor' ? '🛡️' : '📿';
    if (!result.durability) {
      const baseDur = { 일반: 50, 매직: 65, 레어: 80, 유니크: 120, 에픽: 180 }[result.grade] || 60;
      result.durability = Math.floor(baseDur * (0.8 + Math.random() * 0.4));
    }
    if (!result.maxDurability) result.maxDurability = result.durability;
    if (!result.desc) result.desc = FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)];
    if (!result.skillMods) result.skillMods = [];
    return result;
  }
  return fallbackItem;
}

// ===== AI COMBAT GENERATION =====
// Gather all skillMods from equipped items
function getActiveSkillMods() {
  const mods = [];
  Object.keys(G.equipment).forEach(slot => {
    const item = G.equipment[slot];
    if (item && item.skillMods && item.skillMods.length) {
      item.skillMods.forEach(m => mods.push({ ...m, fromItem: item.name }));
    }
  });
  return mods;
}

// Get effective skills (base + mods applied description)
function getEffectiveSkills() {
  const mods = getActiveSkillMods();
  return G.equippedSkills.map(s => {
    const applied = mods.filter(m => m.skillName === s.name);
    return {
      name: s.name,
      icon: s.icon,
      desc: s.desc,
      dmg: s.dmg || 0,
      aoe: s.aoe || false,
      dot: s.dot || false,
      hits: s.hits || 1,
      buff: s.buff || false,
      mods: applied.map(m => m.mod)
    };
  });
}

async function generateCombatAI(enemy, enemyCount, isBoss) {
  const skills = getEffectiveSkills();
  const hasSkills = G.equippedSkills.length > 0 && G.level >= 1;
  const mods = getActiveSkillMods();

  // 전투 시퀀스를 미리 로컬에서 결정 (스킬 순서, 데미지 등)
  const availSkills = hasSkills ? skills : [{ name: '평타', icon: '👊', desc: '기본 공격', dmg: 10, hits: 1, mods: [] }];
  const rounds = isBoss ? 5 + Math.floor(Math.random()*3) : 3 + Math.floor(Math.random()*2);
  const sequence = [];
  for(let r=0;r<rounds;r++){
    const sk = availSkills[r % availSkills.length];
    sequence.push({ round: r+1, skillName: sk.name, skillIcon: sk.icon });
  }

  const ctx = {
    class: G.className,
    level: G.level,
    floor: G.floor,
    hp: Math.floor(G.hp),
    maxHP: G.maxHP,
    atk: G.atk + getEquipStat('ATK'),
    def: G.def + getEquipStat('DEF'),
    critBonus: G.critBonus || 0,
    equippedSkillNames: availSkills.map(s => s.name),
    equippedSkillDetails: availSkills.map(s => ({name:s.name,icon:s.icon,desc:s.desc||'',dmg:s.dmg||0,aoe:!!s.aoe,dot:!!s.dot,hits:s.hits||1,buff:!!s.buff,summon:s.summon?s.summon.name:null})),
    equippedPassives: (G.equippedPassives||[]).map(p => ({name:p.name,icon:p.icon,desc:p.desc||''})),
    battleSequence: sequence,
    partyInfo: (G.party||[]).filter(p=>p&&p.className).map(p=>({
      class:p.className,level:p.level||1,
      skills:(p.equippedSkills||[]).map(s=>({name:s.name,icon:s.icon,desc:s.desc||'',dmg:s.dmg||0,aoe:!!s.aoe,buff:!!s.buff})),
      passives:(p.equippedPassives||[]).map(p2=>({name:p2.name,desc:p2.desc||''}))
    })),
    enemy,
    enemyCount,
    isBoss
  };

  const result = await aiGenerate('combat', ctx, null);

  if (result && result.lines && Array.isArray(result.lines) && result.lines.length > 0) {
    return result;
  }

  // Fallback: generate combat locally
  return generateCombatLocal(enemy, enemyCount, isBoss);
}

// Local fallback combat (no AI)
// 장착된 스킬 커스텀 옵션을 스킬명 기준으로 수집
function getSkillMods(skillName){
  const mods=[];
  Object.keys(G.equipment).forEach(slot=>{
    const item=G.equipment[slot];
    if(item&&item.skillMods){
      item.skillMods.forEach(m=>{
        if(m.mod&&m.mod.startsWith(skillName)){mods.push(m.mod)}
      });
    }
  });
  return mods;
}

// 커스텀 옵션 파싱
function parseCustomMod(mod,skillName){
  const r={hits:1,dmgBonus:0,aoe:false,multiTarget:1,healPct:0,extraCast:0,critDmgBonus:0,defBuff:0,penetrate:false,atkSpdBuff:0,dot:0,
    stun:0,silence:false,freeze:false,fear:0,execute:false,reflect:0,defIgnore:false,killHeal:0,lowHpDmg:0,goldDrop:false,coolReset:0,burstEvery:0,killCrit:false,atkSteal:0};
  const s=mod.replace(skillName+' ','');
  // 연속/멀티
  if(s.includes('2연속'))r.hits=2;
  if(s.includes('3연속'))r.hits=3;
  if(s.includes('3갈래')||s.includes('3타겟'))r.multiTarget=3;
  if(s.includes('범위')&&s.includes('확대'))r.aoe=true;
  // 딜 강화
  if(s.match(/데미지 \+(\d+)%/)){r.dmgBonus=parseInt(RegExp.$1)}
  if(s.match(/치명타 데미지 \+(\d+)%/))r.critDmgBonus=parseInt(RegExp.$1);
  if(s.includes('관통')&&!s.includes('방어력'))r.penetrate=true;
  if(s.includes('방어력 무시'))r.defIgnore=true;
  // 상태이상
  if(s.includes('출혈')||s.includes('화상')||s.includes('중독'))r.dot=Math.floor(5+G.floor*0.5);
  if(s.includes('스턴'))r.stun=s.match(/(\d+)%/)?parseInt(RegExp.$1):30;
  if(s.includes('침묵'))r.silence=true;
  if(s.includes('빙결'))r.freeze=true;
  if(s.includes('공포'))r.fear=30;
  // 처형/저HP
  if(s.includes('처형')||s.includes('HP 30% 이하 적'))r.execute=true;
  if(s.match(/HP (\d+)% 이하에서 데미지 (\d+)배/))r.lowHpDmg=parseInt(RegExp.$2);
  if(s.match(/HP (\d+)% 이하 시 공격력 (\d+)배/))r.lowHpDmg=parseInt(RegExp.$2);
  // 회복/방어
  if(s.match(/HP (\d+)% 회복/))r.healPct=parseInt(RegExp.$1);
  if(s.match(/처치 시 HP (\d+)%/))r.killHeal=parseInt(RegExp.$1);
  if(s.match(/방어력 \+(\d+)%/))r.defBuff=parseInt(RegExp.$1);
  if(s.match(/(\d+)% 반사/))r.reflect=parseInt(RegExp.$1);
  // 특수
  if(s.match(/(\d+)% 확률 추가 시전/))r.extraCast=parseInt(RegExp.$1);
  if(s.match(/(\d+)% 확률 쿨타임/))r.coolReset=parseInt(RegExp.$1);
  if(s.includes('골드 2배'))r.goldDrop=true;
  if(s.match(/(\d+)회 시전마다/))r.burstEvery=parseInt(RegExp.$1);
  if(s.includes('반드시 크리티컬'))r.killCrit=true;
  if(s.match(/공격력 흡수 \(\+(\d+)\)/))r.atkSteal=parseInt(RegExp.$1);
  return r;
}

function generateCombatLocal(enemy, enemyCount, isBoss) {
  const lines = [];
  const floorScale = 1 + G.floor * 0.03; // 층수당 3% 강화 (50층=2.5x, 100층=4x, 200층=7x)
  const singleHP = Math.floor((isBoss ? (40 + G.floor * 6) : (12 + G.floor * 2)) * floorScale);
  let enemies = [];
  for (let i = 0; i < enemyCount; i++) enemies.push({ hp: singleHP, alive: true, dot: 0 });
  let totalDmg = 0, totalTaken = {};

  // 파티 멤버 수집 (해금 + 캐릭 존재)
  const partyMembers = [];
  if(G.party){
    for(let s=0;s<3;s++){
      if(G.slotUnlocked[s]&&G.party[s]){
        const c=G.party[s];
        const cls=CLASSES[c.className];
        if(!cls)continue;
        const eAtk=c.atk+(s===G.activeSlot?getEquipStat('ATK'):0);
        const eDef=c.def+(s===G.activeSlot?getEquipStat('DEF'):0);
        const eCrit=(s===G.activeSlot?getEquipStat('치명타'):0)+(c.critBonus||0);
        const eEvade=(s===G.activeSlot?getEquipStat('회피율'):0);
        const ePen=(s===G.activeSlot?getEquipStat('관통'):0);
        const skills=c.equippedSkills||[];
        partyMembers.push({slot:s,name:c.className,atk:eAtk,def:eDef,critBonus:eCrit,evade:eEvade,penetrate:ePen,
          skills:skills,skillDmgBonus:c.skillDmgBonus||0,hp:c.hp,maxHP:c.maxHP,weapon:cls.weapon});
        totalTaken[s]=0;
      }
    }
  }
  if(partyMembers.length===0){
    // 폴백: G 자체를 사용
    partyMembers.push({slot:0,name:G.className,atk:G.atk+getEquipStat('ATK'),def:G.def+getEquipStat('DEF'),
      critBonus:(G.critBonus||0)+getEquipStat('치명타'),evade:getEquipStat('회피율'),penetrate:getEquipStat('관통'),
      skills:G.equippedSkills||[],skillDmgBonus:G.skillDmgBonus||0,hp:G.hp,maxHP:G.maxHP,weapon:'⚔️'});
    totalTaken[0]=0;
  }

  // 소환수 수집 (소환 스킬 보유 파티 멤버의 소환수)
  const summons = [];
  for (const member of partyMembers) {
    const hasSummonBuff = member.skills.some(s => s.summonBuff);
    for (const sk of member.skills) {
      if (sk.summon) {
        for (let i = 0; i < sk.summon.count; i++) {
          const sAtk = hasSummonBuff ? Math.floor(sk.summon.atk * 1.5) : sk.summon.atk;
          summons.push({ name: sk.summon.name, icon: sk.summon.icon, atk: sAtk, hp: sk.summon.hp + G.floor * 2, maxHP: sk.summon.hp + G.floor * 2, taunt: sk.summon.taunt || false, ownerSlot: member.slot });
        }
      }
    }
  }
  if (summons.length > 0) {
    lines.push({ text: `🔮 소환수 ${summons.length}마리 전투 참여! (${[...new Set(summons.map(s=>s.icon+s.name))].join(', ')})`, type: 'buff' });
  }

  // === 패시브 스킬 적용 ===
  for (const member of partyMembers) {
    const char = member.slot === G.activeSlot ? G : (G.party && G.party[member.slot] ? G.party[member.slot] : G);
    const passives = char.equippedPassives || [];
    member._reflect = 0; member._lifesteal = 0; member._regen = 0; member._dotBoost = 0;
    member._doubleCast = 0; member._killAtk = 0; member._killAtkMax = 0; member._autoHeal = false;
    for (const p of passives) {
      const d = p.desc || '';
      if (/치명타.*(\d+)%/.test(d)) { const v = parseInt(d.match(/치명타.*?(\d+)%/)[1]); member.critBonus += v; }
      else if (/반사.*(\d+)%/.test(d)) { const v = parseInt(d.match(/반사.*?(\d+)%/)[1]); member._reflect += v; }
      else if (/피흡.*(\d+)%|흡혈.*(\d+)%/.test(d)) { const m = d.match(/(\d+)%/); if (m) member._lifesteal += parseInt(m[1]); }
      else if (/HP.*(\d+)%.*증가|최대 HP.*(\d+)%/.test(d)) { const m = d.match(/(\d+)%/); if (m) { const v = parseInt(m[1]); member.maxHP = Math.floor(member.maxHP * (1 + v / 100)); member.hp = Math.min(member.hp, member.maxHP); } }
      else if (/DEF.*(\d+)%.*증가|방어력.*(\d+)%/.test(d)) { const m = d.match(/(\d+)%/); if (m) member.def = Math.floor(member.def * (1 + parseInt(m[1]) / 100)); }
      else if (/회피.*(\d+)%/.test(d)) { const m = d.match(/(\d+)%/); if (m) member.evade += parseInt(m[1]); }
      else if (/매 턴 HP.*(\d+)%|자동 회복|재생/.test(d)) { const m = d.match(/(\d+)%/); if (m) member._regen += parseInt(m[1]); }
      else if (/독.*(\d+)%|저주.*(\d+)%/.test(d)) { const m = d.match(/(\d+)%/); if (m) member._dotBoost += parseInt(m[1]); }
      else if (/2회 시전|두발/.test(d)) { const m = d.match(/(\d+)%/); member._doubleCast = m ? parseInt(m[1]) : 50; }
      else if (/킬.*ATK.*(\d+)%.*누적/.test(d)) { const m = d.match(/(\d+)%.*최대.*\+(\d+)%/); if (m) { member._killAtk = parseInt(m[1]); member._killAtkMax = parseInt(m[2]); } }
      else if (/자동 힐|피격 시.*힐/.test(d)) { member._autoHeal = true; }
    }
    // 적용된 패시브 라인 출력 (패시브가 있을 때만)
    if (passives.length > 0) {
      const memberLabel = partyMembers.length > 1 ? `[${member.weapon}${member.name}] ` : '';
      lines.push({ text: `${memberLabel}패시브 발동: ${passives.map(p => p.icon + p.name).join(', ')}`, type: 'buff' });
    }
  }

  // === 전투 시작 전 버프 시전 ===
  for (const member of partyMembers) {
    const memberLabel = partyMembers.length > 1 ? `[${member.weapon}${member.name}] ` : '';
    const buffSkills = member.skills.filter(s => s.buff && !s.summon);
    for (const bs of buffSkills) {
      // 버프 효과 적용
      if (/ATK|공격|공속|딜러/.test(bs.desc)) { member.atk = Math.floor(member.atk * 1.3); lines.push({ text: `${memberLabel}${bs.icon} ${bs.name} 시전! ATK 강화!`, type: 'buff' }); }
      else if (/DEF|방어|보호|방패/.test(bs.desc)) { member.def = Math.floor(member.def * 1.5); lines.push({ text: `${memberLabel}${bs.icon} ${bs.name} 시전! DEF 강화!`, type: 'buff' }); }
      else if (/무적|회피/.test(bs.desc)) { member._invincible = true; lines.push({ text: `${memberLabel}${bs.icon} ${bs.name} 시전! 무적 상태!`, type: 'buff' }); }
      else if (/치명타|집중/.test(bs.desc)) { member.critBonus += 50; lines.push({ text: `${memberLabel}${bs.icon} ${bs.name} 시전! 치명타 대폭 강화!`, type: 'buff' }); }
      else if (/힐|회복|정화/.test(bs.desc)) { member.hp = Math.min(member.maxHP, member.hp + Math.floor(member.maxHP * 0.3)); lines.push({ text: `${memberLabel}${bs.icon} ${bs.name} 시전! HP 회복!`, type: 'buff' }); }
      else if (/변신/.test(bs.desc)) {
        if (/ATK|딜러|늑대/.test(bs.desc)) { member.atk = Math.floor(member.atk * 2); lines.push({ text: `${memberLabel}${bs.icon} ${bs.name}! ATK 2배!`, type: 'buff' }); }
        else { member.def = Math.floor(member.def * 2); lines.push({ text: `${memberLabel}${bs.icon} ${bs.name}! DEF 2배!`, type: 'buff' }); }
      }
      else { lines.push({ text: `${memberLabel}${bs.icon} ${bs.name} 시전!`, type: 'buff' }); }
    }
  }

  const maxRounds = isBoss ? 8 : 3 + enemyCount + Math.floor(Math.random() * 2);

  for (let r = 0; r < maxRounds; r++) {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) break;

    // DoT 처리 (매 턴 시작)
    for (const e of aliveEnemies) {
      if (e.dot > 0) {
        const dotDmg = e.dot;
        e.hp -= dotDmg; totalDmg += dotDmg;
        lines.push({ text: `🔥 ${enemy} 지속 피해! -${dotDmg}`, type: 'damage' });
        if (e.hp <= 0) { e.alive = false; lines.push({ text: `${enemy} 지속 피해로 쓰러졌다!`, type: 'damage' }); }
      }
    }
    if (enemies.filter(e => e.alive).length === 0) break;

    // 패시브: 매 턴 재생
    for (const member of partyMembers) {
      if (member._regen > 0) {
        const healAmt = Math.floor(member.maxHP * member._regen / 100);
        totalTaken[member.slot] = Math.max(0, (totalTaken[member.slot]||0) - healAmt);
        const memberLabel = partyMembers.length > 1 ? `[${member.weapon}${member.name}] ` : '';
        lines.push({ text: `💚 ${memberLabel}재생! +${healAmt} HP`, type: 'buff' });
      }
    }

    // 각 파티 멤버가 순서대로 공격 → 적 반격
    for (const member of partyMembers) {
      const curAlive = enemies.filter(e => e.alive);
      if (curAlive.length === 0) break;

      const isMain = member.slot === G.activeSlot;
      const memberLabel = partyMembers.length > 1 ? `[${member.weapon}${member.name}] ` : '';
      const basicAtk = { name: '평타', icon: '👊', dmg: 10, aoe: false };
      const nonSummonSkills = member.skills.filter(s => !s.summon && !s.buff);
      const hasSkills = nonSummonSkills.length > 0;
      const skillPool = hasSkills ? [basicAtk, ...nonSummonSkills] : [basicAtk];
      const skill = skillPool[Math.floor(Math.random() * skillPool.length)];
      const skillDmgMult = 1 + member.skillDmgBonus / 100;

      // 커스텀 효과 (메인 캐릭만 장비 효과 적용)
      const mods = isMain ? getSkillMods(skill.name) : [];
      const fx = { hits:1, dmgBonus:0, aoe:skill.aoe||false, multiTarget:1, healPct:0, extraCast:0, critDmgBonus:0, defBuff:0, penetrate:false, atkSpdBuff:0, dot:0,
        stun:0, silence:false, freeze:false, fear:0, execute:false, reflect:0, defIgnore:false, killHeal:0, lowHpDmg:0, goldDrop:false, coolReset:0, burstEvery:0, killCrit:false, atkSteal:0 };
      const modTexts = [];
      mods.forEach(m => {
        const p = parseCustomMod(m, skill.name);
        fx.hits = Math.max(fx.hits, p.hits); fx.dmgBonus += p.dmgBonus;
        if(p.aoe) fx.aoe = true; fx.multiTarget = Math.max(fx.multiTarget, p.multiTarget);
        fx.healPct += p.healPct; fx.extraCast = Math.max(fx.extraCast, p.extraCast);
        fx.critDmgBonus += p.critDmgBonus; fx.defBuff += p.defBuff;
        if(p.penetrate) fx.penetrate = true; fx.atkSpdBuff += p.atkSpdBuff; fx.dot += p.dot;
        fx.stun = Math.max(fx.stun, p.stun); if(p.silence) fx.silence = true;
        if(p.freeze) fx.freeze = true; fx.fear = Math.max(fx.fear, p.fear);
        if(p.execute) fx.execute = true; fx.reflect += p.reflect;
        if(p.defIgnore) fx.defIgnore = true; fx.killHeal = Math.max(fx.killHeal, p.killHeal);
        fx.lowHpDmg = Math.max(fx.lowHpDmg, p.lowHpDmg); if(p.goldDrop) fx.goldDrop = true;
        if(p.killCrit) fx.killCrit = true; fx.atkSteal += p.atkSteal;
        modTexts.push(m);
      });

      const isSkillAoe = skill.aoe || false;
      const targetMult = isSkillAoe ? 0.8 : 1.5;
      let baseDmg = Math.floor((skill.dmg || 10) * (1 + member.atk / 30) * skillDmgMult * targetMult);
      baseDmg = Math.floor(baseDmg * (1 + fx.dmgBonus / 100));
      const roll = Math.random() * 100;
      const critChance = (isBoss ? 15 : 10) + member.critBonus;
      let dmgMult = 1, tag = '', isCrit = false;
      if (roll < critChance) { isCrit = true; dmgMult = (isBoss ? 2.5 : 1.5) + fx.critDmgBonus / 100; tag = '💥크리티컬! '; }
      else if (isBoss && roll > 70) { dmgMult = 0.3; tag = '❌빗나감... '; }
      else { dmgMult = 0.8 + Math.random() * 0.4; }
      const isMiss = tag.includes('빗나감');
      const isAoe = fx.aoe;

      // 공격 실행
      for (let hit = 0; hit < fx.hits; hit++) {
        const alive2 = enemies.filter(e => e.alive);
        if (alive2.length === 0) break;
        let dmgRaw = Math.floor(baseDmg * dmgMult);
        if (fx.lowHpDmg > 0 && member.hp <= member.maxHP * 0.3) dmgRaw = Math.floor(dmgRaw * fx.lowHpDmg);
        const dmg = dmgRaw + member.penetrate;
        if (isMiss && hit === 0) { lines.push({ text: `${memberLabel}${skill.icon} ${skill.name} 시전! — ${tag.trim()}`, type: 'miss' }); break; }
        if (isAoe) {
          let killed = 0;
          alive2.forEach(e => { e.hp -= dmg; if(e.hp<=0){e.alive=false;killed++} });
          totalDmg += dmg * alive2.length;
          const remaining = enemies.filter(e => e.alive).length;
          const hitLabel = fx.hits > 1 ? ` [${hit+1}/${fx.hits}타]` : '';
          lines.push({ text: `${memberLabel}${skill.icon} ${skill.name}${hitLabel} — ${tag}전체 공격!`, type: isCrit ? 'critical' : 'action', hits: fx.hits, charClass: member.name });
          const avgHp=remaining>0?Math.floor(enemies.filter(e=>e.alive).reduce((s,e)=>s+e.hp,0)/remaining):0;
          lines.push({ text: `${enemy} ${alive2.length}마리에게 각 ${dmg} 피해!${killed>0?` ${killed}마리 처치!`:''}${remaining>0?` 남은 적: ${remaining} (평균 HP: ${avgHp}/${singleHP})`:''}`, type: 'damage' });
          // 네크로맨서: AoE 처치 시 망령 소환
          if(killed>0){const hasNecro=member.skills.some(s=>s.necro);
          if(hasNecro){for(let nk=0;nk<killed;nk++){const necroHP=Math.floor(singleHP*0.5);summons.push({name:'망령 '+enemy,icon:'👻',atk:Math.floor(member.atk*0.6),hp:necroHP,maxHP:necroHP,taunt:false,ownerSlot:member.slot});}
          lines.push({text:`${memberLabel}💀 네크로맨서! ${killed}구의 시체가 아군 망령으로 부활!`,type:'buff'});}}
        } else {
          const target = alive2[0];
          let finalDmg = dmg;
          if (fx.execute && target.hp <= singleHP * 0.3) { finalDmg = dmg * 3; if (hit === 0) lines.push({ text: `${memberLabel}⚰️ 처형 발동! 데미지 3배!`, type: 'buff' }); }
          if (target.frozen) { finalDmg = Math.floor(finalDmg * 1.5); target.frozen = false; }
          target.hp -= finalDmg; totalDmg += finalDmg;
          const hitLabel = fx.hits > 1 ? ` [${hit+1}/${fx.hits}타]` : '';
          lines.push({ text: `${memberLabel}${skill.icon} ${skill.name}${hitLabel} 시전!${tag ? ' — '+tag.trim() : ''}`, type: isCrit ? 'critical' : 'action', hits: fx.hits, charClass: member.name });
          if(target.hp<=0){target.alive=false;const remaining=enemies.filter(e=>e.alive).length;
          lines.push({ text: `${enemy}에게 ${finalDmg} 피해! 처치!${enemyCount>1&&remaining>0?' 남은 적: '+remaining:''}`, type: 'damage' });
          // 네크로맨서: 처치한 적을 아군 소환수로 부활
          const hasNecro=member.skills.some(s=>s.necro);
          if(hasNecro){const necroHP=Math.floor(singleHP*0.5);summons.push({name:'망령 '+enemy,icon:'👻',atk:Math.floor(member.atk*0.6),hp:necroHP,maxHP:necroHP,taunt:false,ownerSlot:member.slot});
          lines.push({text:`${memberLabel}💀 네크로맨서! ${enemy}의 시체가 아군 망령으로 부활!`,type:'buff'});}}
          else{lines.push({ text: `${enemy}에게 ${finalDmg} 피해! (HP: ${target.hp}/${singleHP})`, type: 'damage' });}
        }
        if (fx.dot > 0) { enemies.filter(e => e.alive).forEach(e => { e.dot = fx.dot; }); if (hit === 0) lines.push({ text: `${memberLabel}✦ ${skill.name} — 지속 피해 부여! (매 턴 ${fx.dot})`, type: 'buff' }); }
      }

      if (modTexts.length > 0 && !isMiss) { modTexts.forEach(m => lines.push({ text: `${memberLabel}⚡ 장비 효과 발동! [${m}]`, type: 'buff' })); }

      // 패시브: 흡혈
      if (!isMiss && member._lifesteal > 0 && totalDmg > 0) {
        const stealAmt = Math.floor(totalDmg * member._lifesteal / 100);
        if (stealAmt > 0) { totalTaken[member.slot] = Math.max(0, (totalTaken[member.slot]||0) - stealAmt); lines.push({ text: `🩸 ${memberLabel}흡혈! +${stealAmt} HP`, type: 'buff' }); }
      }

      // 상태이상
      let enemyStunned = false, enemyFeared = false;
      if (!isMiss) {
        const desc = skill.desc || '';
        if (desc.includes('스턴') || desc.includes('행동 불가') || (fx.stun > 0 && Math.random()*100 < fx.stun)) { enemyStunned = true; lines.push({ text: `${memberLabel}💫 ${enemy} 스턴! 행동 불가!`, type: 'buff' }); }
        if (desc.includes('무적') || desc.includes('방어 스킬')) { lines.push({ text: `${memberLabel}🧊 ${skill.name} — 무적 상태!`, type: 'buff' }); enemyStunned = true; }
        if (fx.freeze) { enemies.filter(e=>e.alive).forEach(e=>{e.frozen=true}); lines.push({ text: `${memberLabel}🧊 ${enemy} 빙결! 다음 피해 1.5배!`, type: 'buff' }); }
        if (fx.fear > 0 && Math.random()*100 < fx.fear) { enemyFeared = true; lines.push({ text: `${memberLabel}😱 ${enemy} 공포! 공격력 -30%!`, type: 'buff' }); }
        if (fx.reflect > 0) { lines.push({ text: `${memberLabel}🪞 데미지 ${fx.reflect}% 반사 활성화!`, type: 'buff' }); }
      }

      // 적 반격 → 이 멤버에게 피해
      const stillAlive = enemies.filter(e => e.alive);
      if (stillAlive.length > 0 && !enemyStunned && !member._invincible) {
        const attackers = isBoss ? stillAlive : stillAlive.filter(() => Math.random() < 0.7);
        const actualAttackers = attackers.length > 0 ? attackers : [stillAlive[0]];
        const fearMult = enemyFeared ? 0.7 : 1;
        for (const attacker of actualAttackers) {
          const eRoll = Math.random();
          const evadeChance = 0.15 + member.evade / 100;
          if (eRoll < evadeChance) {
            lines.push({ text: `${enemy}의 공격 → ${memberLabel}빗나감!`, type: 'enemy-atk', dmg: 0, charClass: member.name });
          } else {
            const eCrit = eRoll > 0.9;
            const rawDmg = (isBoss ? (8 + G.floor * 2) : (10 + G.floor * 1)) * floorScale * (eCrit ? 2.0 : (0.7 + Math.random() * 0.5)) * fearMult;
            let eDmg = Math.max(1, Math.floor(rawDmg - member.def / 3));
            totalTaken[member.slot] = (totalTaken[member.slot]||0) + eDmg;
            lines.push({ text: `${eCrit ? '💥 ' : ''}${enemy}의 공격 → ${memberLabel}-${eDmg} HP`, type: 'enemy-atk', dmg: eDmg, charClass: member.name });
            const totalReflect = (fx.reflect || 0) + (member._reflect || 0);
            if (totalReflect > 0) {
              const reflDmg = Math.floor(eDmg * totalReflect / 100);
              attacker.hp -= reflDmg; totalDmg += reflDmg;
              lines.push({ text: `🪞 반사 데미지! ${enemy}에게 ${reflDmg} 피해!${attacker.hp<=0?' 처치!':''}`, type: 'buff' });
              if(attacker.hp<=0)attacker.alive=false;
            }
            // 패시브: 피격 시 힐
            if (member._autoHeal && Math.random() < 0.1) {
              const healAmt = Math.floor(member.maxHP * 0.1);
              totalTaken[member.slot] = Math.max(0, (totalTaken[member.slot]||0) - healAmt);
              lines.push({ text: `💚 ${memberLabel}피격 시 힐 발동! +${healAmt} HP`, type: 'buff' });
            }
          }
        }
      }
    } // end party member loop

    // 소환수 공격 턴
    const aliveSummons = summons.filter(s => s.hp > 0);
    for (const sm of aliveSummons) {
      const curAlive = enemies.filter(e => e.alive);
      if (curAlive.length === 0) break;
      const target = curAlive[Math.floor(Math.random() * curAlive.length)];
      const dmg = Math.max(1, Math.floor(sm.atk * (0.8 + Math.random() * 0.4) * (1 + G.floor * 0.05)));
      target.hp -= dmg; totalDmg += dmg;
      if (target.hp <= 0) {
        target.alive = false;
        lines.push({ text: `${sm.icon} ${sm.name} → ${enemy}에게 ${dmg} 피해! 처치!`, type: 'action' });
      } else {
        lines.push({ text: `${sm.icon} ${sm.name} → ${enemy}에게 ${dmg} 피해!`, type: 'action' });
      }
    }

    // 적이 소환수 공격 (도발 소환수 우선, 아니면 랜덤)
    if (aliveSummons.length > 0) {
      const stillAliveE = enemies.filter(e => e.alive);
      for (const attacker of stillAliveE) {
        if (Math.random() < 0.4) { // 40% 확률로 소환수 타겟
          const tauntSummons = aliveSummons.filter(s => s.taunt && s.hp > 0);
          const targetSm = tauntSummons.length > 0 ? tauntSummons[0] : aliveSummons[Math.floor(Math.random() * aliveSummons.length)];
          if (targetSm && targetSm.hp > 0) {
            const eDmg = Math.max(1, Math.floor((isBoss ? (6 + G.floor * 1.5) : (3 + G.floor * 0.8)) * floorScale * (0.6 + Math.random() * 0.4)));
            targetSm.hp -= eDmg;
            if (targetSm.hp <= 0) {
              lines.push({ text: `${enemy} → ${targetSm.icon} ${targetSm.name} -${eDmg} HP — 소환수 소멸!`, type: 'enemy-atk' });
            } else {
              lines.push({ text: `${enemy} → ${targetSm.icon} ${targetSm.name} -${eDmg} HP`, type: 'enemy-atk' });
            }
          }
        }
      }
    }
  } // end round loop

  const won = enemies.every(e => !e.alive);
  const goldMult = 1 + (G.goldBonus || 0) / 100 + getEquipStat('골드 획득') / 100;
  const expMult = 1 + (G.expBonus || 0) / 100 + getEquipStat('경험치 보너스') / 100;
  const goldReward = won ? Math.floor((10 + G.floor * 5) * (isBoss ? 3 : 1) * enemyCount * (0.8 + Math.random() * 0.4) * goldMult) : 0;
  const expReward = won ? Math.floor((15 + G.floor * 3) * (isBoss ? 2.5 : 1) * enemyCount * expMult) : 0;

  if (won) { lines.push({ text: '전투 승리! 🎉', type: 'victory' }); }
  else { lines.push({ text: '전투 패배... 💀', type: 'defeat' }); }

  return { lines, result: won ? 'win' : 'lose', totalDmg, totalTaken, goldReward, expReward };
}

// ===== AI SKILL GENERATION =====
async function generateSkillAI(isPassive) {
  const ctx = {
    class: G.className,
    level: G.level,
    existingSkills: isPassive
      ? G.allPassives.map(s => s.name)
      : G.allSkills.map(s => s.name),
    isPassive
  };

  const result = await aiGenerate('skill', ctx, null);

  if (result && result.name && result.icon && result.desc) {
    if (!isPassive && result.dmg === undefined) result.dmg = 20;
    return result;
  }
  return null;
}

// ===== AI SKILL CUSTOM OPTIONS =====
async function generateSkillCustomAI(count) {
  const skills = G.equippedSkills || [];
  if (skills.length === 0) return null;
  const ctx = {
    class: G.className,
    level: G.level,
    floor: G.floor,
    skills: skills.map(s => ({ name: s.name, icon: s.icon, desc: s.desc, dmg: s.dmg || 0, aoe: s.aoe || false })),
    count: count
  };
  const result = await aiGenerate('skillcustom', ctx, null);
  if (result && result.mods && Array.isArray(result.mods) && result.mods.length >= count) {
    return result.mods.slice(0, count).map(m => ({
      mod: m.mod || m.text || '',
      skillName: m.skillName || ''
    }));
  }
  return null;
}

// ===== AI NPC DIALOGUE =====
async function generateNPCDialogueAI(npcName, missionContext) {
  const ctx = { npc_name: npcName, playerClass: G.className, level: G.level, floor: G.floor, ...missionContext };

  const result = await aiGenerate('npc', ctx, null);
  return result && result.dialogue ? result.dialogue : null;
}

// ===== AI LEVEL-UP CHOICES =====
async function generateLevelUpAI() {
  const ctx = {
    class: G.className,
    level: G.level,
    existingBuffs: (G._appliedBuffs || []).slice(-5)
  };

  const result = await aiGenerate('levelup', ctx, null);

  if (result && result.choices && result.choices.length === 3) {
    return result.choices.map(c => ({
      name: c.name,
      desc: c.desc,
      apply: (p) => {
        if (c.effect) {
          const stat = c.effect.stat;
          const val = c.effect.value || 0;
          if (stat === 'hp' || stat === 'HP') { p.maxHP += val; p.hp = Math.min(p.hp + val, p.maxHP); }
          else if (stat === 'atk' || stat === 'ATK') p.atk += val;
          else if (stat === 'def' || stat === 'DEF') p.def += val;
          else if (stat === 'gold') p.gold += val;
          else if (stat === 'mood') p.mood = Math.min(100, p.mood + val);
          else if (stat === 'hunger') p.hunger = Math.min(100, p.hunger + val);
          else if (stat === 'critBonus') p.critBonus = (p.critBonus || 0) + val;
          else if (stat === 'expBonus') p.expBonus = (p.expBonus || 0) + val;
          else { p.atk += Math.floor(val / 2); p.def += Math.floor(val / 3); }
        }
      }
    }));
  }
  return null;
}
