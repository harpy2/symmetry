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
    battleSequence: sequence,
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
  const r={hits:1,dmgBonus:0,aoe:false,multiTarget:1,healPct:0,extraCast:0,critDmgBonus:0,defBuff:0,penetrate:false,atkSpdBuff:0,dot:0};
  const s=mod.replace(skillName+' ','');
  if(s.includes('2연속'))r.hits=2;
  if(s.includes('3연속'))r.hits=3;
  if(s.match(/데미지 \+(\d+)%/)){r.dmgBonus=parseInt(RegExp.$1)}
  if(s.includes('범위')&&s.includes('확대'))r.aoe=true;
  if(s.includes('3갈래')||s.includes('3타겟'))r.multiTarget=3;
  if(s.match(/HP (\d+)% 회복/))r.healPct=parseInt(RegExp.$1);
  if(s.match(/(\d+)% 확률 추가 시전/))r.extraCast=parseInt(RegExp.$1);
  if(s.match(/치명타 데미지 \+(\d+)%/))r.critDmgBonus=parseInt(RegExp.$1);
  if(s.match(/방어력 \+(\d+)%/))r.defBuff=parseInt(RegExp.$1);
  if(s.includes('관통'))r.penetrate=true;
  if(s.match(/공격속도 \+(\d+)%/))r.atkSpdBuff=parseInt(RegExp.$1);
  if(s.includes('출혈')||s.includes('화상')||s.includes('중독'))r.dot=Math.floor(5+G.floor*0.5);
  return r;
}

function generateCombatLocal(enemy, enemyCount, isBoss) {
  const lines = [];
  const singleHP = isBoss ? (30 + G.floor * 8) : (10 + G.floor * 3);
  let enemies = [];
  for (let i = 0; i < enemyCount; i++) enemies.push({ hp: singleHP, alive: true, dot: 0 });
  let totalDmg = 0, totalTaken = 0;
  const effectiveAtk = G.atk + getEquipStat('ATK');
  let effectiveDef = G.def + getEquipStat('DEF');
  let tempDefBuff = 0;
  const equipCrit = getEquipStat('치명타');
  const equipAspd = getEquipStat('공격속도');
  const equipEvade = getEquipStat('회피율');
  const equipPenetrate = getEquipStat('관통');
  const hasSkills = G.equippedSkills.length > 0;
  const maxRounds = isBoss ? 8 : 3 + enemyCount + Math.floor(Math.random() * 2);
  const skillDmgMult = 1 + (G.skillDmgBonus || 0) / 100;

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
    const stillAliveAfterDot = enemies.filter(e => e.alive);
    if (stillAliveAfterDot.length === 0) break;

    const basicAtk = { name: '평타', icon: '👊', dmg: 10, aoe: false };
    const skillPool = hasSkills ? [basicAtk, ...G.equippedSkills] : [basicAtk];
    const skill = skillPool[Math.floor(Math.random() * skillPool.length)];
    const mods = getSkillMods(skill.name);
    // 커스텀 효과 합산
    const fx = { hits:1, dmgBonus:0, aoe:skill.aoe||false, multiTarget:1, healPct:0, extraCast:0, critDmgBonus:0, defBuff:0, penetrate:false, atkSpdBuff:0, dot:0 };
    const modTexts = [];
    mods.forEach(m => {
      const p = parseCustomMod(m, skill.name);
      fx.hits = Math.max(fx.hits, p.hits);
      fx.dmgBonus += p.dmgBonus;
      if(p.aoe) fx.aoe = true;
      fx.multiTarget = Math.max(fx.multiTarget, p.multiTarget);
      fx.healPct += p.healPct;
      fx.extraCast = Math.max(fx.extraCast, p.extraCast);
      fx.critDmgBonus += p.critDmgBonus;
      fx.defBuff += p.defBuff;
      if(p.penetrate) fx.penetrate = true;
      fx.atkSpdBuff += p.atkSpdBuff;
      fx.dot += p.dot;
      modTexts.push(m);
    });

    let baseDmg = Math.floor((skill.dmg || 10) * (1 + effectiveAtk / 30) * skillDmgMult);
    baseDmg = Math.floor(baseDmg * (1 + fx.dmgBonus / 100));
    const roll = Math.random() * 100;
    const critChance = (isBoss ? 15 : 10) + (G.critBonus || 0) + equipCrit;
    let dmgMult = 1, tag = '', isCrit = false;

    if (roll < critChance) {
      isCrit = true;
      dmgMult = (isBoss ? 2.5 : 1.5) + fx.critDmgBonus / 100;
      tag = '💥크리티컬! ';
    } else if (isBoss && roll > 70) {
      dmgMult = 0.3;
      tag = '❌빗나감... ';
    } else {
      dmgMult = 0.8 + Math.random() * 0.4;
    }

    const isMiss = tag.includes('빗나감');
    const totalHits = fx.hits;
    const isAoe = fx.aoe;
    const multiTarget = fx.multiTarget;

    // 공격 실행 (연속 발사 지원)
    for (let hit = 0; hit < totalHits; hit++) {
      const curAlive = enemies.filter(e => e.alive);
      if (curAlive.length === 0) break;
      const dmgRaw = Math.floor(baseDmg * dmgMult);
      const dmg = dmgRaw + (fx.penetrate ? 0 : 0) + equipPenetrate; // 관통 스탯은 추가 고정 데미지

      if (isMiss && hit === 0) {
        lines.push({ text: `${skill.icon} ${skill.name} 시전! — ${tag.trim()}`, type: 'miss' });
        break;
      }

      if (isAoe || multiTarget >= curAlive.length) {
        // 전체/멀티타겟 공격
        let killed = 0;
        curAlive.forEach(e => { e.hp -= dmg; if(e.hp<=0){e.alive=false;killed++} });
        totalDmg += dmg * curAlive.length;
        const remaining = enemies.filter(e => e.alive).length;
        const hitLabel = totalHits > 1 ? ` [${hit+1}/${totalHits}타]` : '';
        lines.push({ text: `${skill.icon} ${skill.name}${hitLabel} — ${tag}${multiTarget>1?multiTarget+'갈래 ':''}전체 공격!`, type: isCrit ? 'critical' : 'action' });
        lines.push({ text: `${enemy} ${curAlive.length}마리에게 각 ${dmg} 피해!${killed>0?` ${killed}마리 처치!`:''}${remaining>0?` 남은 적: ${remaining}`:''}`, type: 'damage' });
      } else if (multiTarget > 1) {
        // 멀티타겟 (적보다 타겟 수가 많을 경우 위에서 처리)
        const targets = curAlive.slice(0, multiTarget);
        let killed = 0;
        targets.forEach(e => { e.hp -= dmg; if(e.hp<=0){e.alive=false;killed++} });
        totalDmg += dmg * targets.length;
        const remaining = enemies.filter(e => e.alive).length;
        const hitLabel = totalHits > 1 ? ` [${hit+1}/${totalHits}타]` : '';
        lines.push({ text: `${skill.icon} ${skill.name}${hitLabel} — ${tag}${multiTarget}갈래 공격!`, type: isCrit ? 'critical' : 'action' });
        lines.push({ text: `${enemy} ${targets.length}마리에게 각 ${dmg} 피해!${killed>0?` ${killed}마리 처치!`:''}${remaining>0?` 남은 적: ${remaining}`:''}`, type: 'damage' });
      } else {
        // 단일 공격
        const target = curAlive[0];
        target.hp -= dmg;
        totalDmg += dmg;
        const hitLabel = totalHits > 1 ? ` [${hit+1}/${totalHits}타]` : '';
        lines.push({ text: `${skill.icon} ${skill.name}${hitLabel} 시전!${tag ? ' — '+tag.trim() : ''}`, type: isCrit ? 'critical' : 'action' });
        const killText = target.hp <= 0 ? ' 처치!' : '';
        if(target.hp<=0){target.alive=false;const remaining=enemies.filter(e=>e.alive).length;
        lines.push({ text: `${enemy}에게 ${dmg} 피해!${killText}${enemyCount>1&&remaining>0?' 남은 적: '+remaining:''}`, type: 'damage' });}
        else{lines.push({ text: `${enemy}에게 ${dmg} 피해!`, type: 'damage' });}
      }

      // DoT 부여
      if (fx.dot > 0) {
        enemies.filter(e => e.alive).forEach(e => { e.dot = fx.dot; });
        if (hit === 0) lines.push({ text: `✦ ${skill.name} — 지속 피해 부여! (매 턴 ${fx.dot})`, type: 'buff' });
      }
    }

    // 커스텀 옵션 발동 로그
    if (modTexts.length > 0 && !isMiss) {
      modTexts.forEach(m => lines.push({ text: `⚡ 장비 효과 발동! [${m}]`, type: 'buff' }));
    }

    // HP 회복
    if (fx.healPct > 0 && !isMiss) {
      const heal = Math.floor(G.maxHP * fx.healPct / 100);
      lines.push({ text: `💚 ${skill.name} 시전으로 HP +${heal} 회복!`, type: 'buff' });
      // heal은 hunt.js에서 적용 (여기서는 로그만)
      totalTaken -= heal;
    }

    // 방어 버프
    if (fx.defBuff > 0 && !isMiss) {
      tempDefBuff = Math.floor(effectiveDef * fx.defBuff / 100);
      lines.push({ text: `🛡️ 방어력 일시 증가! +${tempDefBuff}`, type: 'buff' });
    }

    // 추가 시전 (확률)
    if (fx.extraCast > 0 && !isMiss && Math.random() * 100 < fx.extraCast) {
      const curAlive2 = enemies.filter(e => e.alive);
      if (curAlive2.length > 0) {
        const extraDmg = Math.floor(baseDmg * (0.8 + Math.random() * 0.4));
        const et = curAlive2[0];
        et.hp -= extraDmg; totalDmg += extraDmg;
        lines.push({ text: `⚡ ${skill.name} 추가 시전 발동!`, type: 'action' });
        lines.push({ text: `${enemy}에게 추가 ${extraDmg} 피해!${et.hp<=0?' 처치!':''}`, type: 'damage' });
        if(et.hp<=0)et.alive=false;
      }
    }

    // 스킬 특수 효과 (스턴/버프)
    let enemyStunned = false;
    const desc = skill.desc || '';
    if (!isMiss) {
      if (desc.includes('스턴') || desc.includes('행동 불가')) {
        enemyStunned = true;
        lines.push({ text: `💫 ${enemy} 스턴! 행동 불가!`, type: 'buff' });
      }
      if (desc.includes('무적') || desc.includes('방어 스킬')) {
        lines.push({ text: `🧊 ${skill.name} — 무적 상태! 이번 턴 피해 무효!`, type: 'buff' });
        enemyStunned = true; // 무적=적 공격 무효화
      }
      if (skill.buff && desc.includes('ATK')) {
        lines.push({ text: `🔥 ${skill.name} — 공격력 강화!`, type: 'buff' });
      }
      if (skill.buff && desc.includes('공속')) {
        lines.push({ text: `⚡ ${skill.name} — 공격 속도 강화!`, type: 'buff' });
      }
    }

    // 적 반격 (스턴 시 스킵)
    const stillAlive = enemies.filter(e => e.alive);
    if (stillAlive.length > 0 && !enemyStunned) {
      const attackers = isBoss ? stillAlive : stillAlive.filter(() => Math.random() < 0.7);
      const actualAttackers = attackers.length > 0 ? attackers : [stillAlive[0]];
      const curDef = effectiveDef + tempDefBuff;
      for (const attacker of actualAttackers) {
        const eRoll = Math.random();
        const evadeChance = 0.15 + equipEvade / 100;
        if (eRoll < evadeChance) {
          lines.push({ text: `${enemy}의 공격이 빗나갔다!${equipEvade>0?' (회피!)':''}`, type: 'damage', dmg: 0 });
        } else {
          const eCrit = eRoll > 0.9;
          const rawDmg = (isBoss ? (5 + G.floor * 2) : (3 + G.floor)) * (eCrit ? 1.8 : (0.6 + Math.random() * 0.4));
          const eDmg = Math.max(1, Math.floor(rawDmg - curDef / 3));
          totalTaken += eDmg;
          lines.push({ text: `${eCrit ? '💥 ' : ''}${enemy}의 공격! → -${eDmg} HP`, type: 'damage', dmg: eDmg });
        }
      }
      tempDefBuff = 0; // 방어 버프 1턴만
    }
  }

  const won = enemies.every(e => !e.alive);
  const goldMult = 1 + (G.goldBonus || 0) / 100 + getEquipStat('골드 획득') / 100;
  const expMult = 1 + (G.expBonus || 0) / 100 + getEquipStat('경험치 보너스') / 100;
  const goldReward = won ? Math.floor((10 + G.floor * 5) * (isBoss ? 3 : 1) * enemyCount * (0.8 + Math.random() * 0.4) * goldMult) : 0;
  const expReward = won ? Math.floor((15 + G.floor * 3) * (isBoss ? 2.5 : 1) * enemyCount * expMult) : 0;

  if (won) {
    lines.push({ text: '전투 승리! 🎉', type: 'victory' });
  } else {
    lines.push({ text: '전투 패배... 💀', type: 'defeat' });
  }

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
