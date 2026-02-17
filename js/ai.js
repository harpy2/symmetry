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
  const fallbackItem = generateItem();

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
  ['weapon', 'armor', 'accessory'].forEach(slot => {
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

  const ctx = {
    class: G.className,
    level: G.level,
    floor: G.floor,
    hp: Math.floor(G.hp),
    maxHP: G.maxHP,
    atk: G.atk + (G.equipment.weapon ? (G.equipment.weapon.stats.ATK || 0) : 0),
    def: G.def + (G.equipment.armor ? (G.equipment.armor.stats.DEF || 0) : 0),
    critBonus: G.critBonus || 0,
    skills: hasSkills ? skills : [{ name: '평타', icon: '👊', desc: '기본 공격', dmg: 10, hits: 1, mods: [] }],
    passives: G.equippedPassives.map(p => ({ name: p.name, desc: p.desc })),
    skillMods: mods.map(m => ({ skillName: m.skillName, mod: m.mod, effect: m.effect, fromItem: m.fromItem })),
    equipment: {
      weapon: G.equipment.weapon ? { name: G.equipment.weapon.name, stats: G.equipment.weapon.stats } : null,
      armor: G.equipment.armor ? { name: G.equipment.armor.name, stats: G.equipment.armor.stats } : null,
      accessory: G.equipment.accessory ? { name: G.equipment.accessory.name, stats: G.equipment.accessory.stats } : null,
    },
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
function generateCombatLocal(enemy, enemyCount, isBoss) {
  const lines = [];
  const singleHP = isBoss ? (30 + G.floor * 8) : (10 + G.floor * 3);
  let enemies = []; // 각 적의 HP 추적
  for (let i = 0; i < enemyCount; i++) enemies.push({ hp: singleHP, alive: true });
  let totalDmg = 0, totalTaken = 0;
  const effectiveAtk = G.atk + (G.equipment.weapon ? (G.equipment.weapon.stats.ATK || 0) : 0);
  const effectiveDef = G.def + (G.equipment.armor ? (G.equipment.armor.stats.DEF || 0) : 0);
  const hasSkills = G.equippedSkills.length > 0;
  const maxRounds = isBoss ? 8 : 3 + enemyCount + Math.floor(Math.random() * 2);

  for (let r = 0; r < maxRounds; r++) {
    const aliveEnemies = enemies.filter(e => e.alive);
    if (aliveEnemies.length === 0) break;

    const skill = hasSkills ? G.equippedSkills[r % G.equippedSkills.length] : { name: '평타', icon: '👊', dmg: 10, aoe: false };
    let baseDmg = Math.floor((skill.dmg || 10) * (1 + effectiveAtk / 30));
    const roll = Math.random() * 100;
    const critChance = isBoss ? 15 : 10 + (G.critBonus || 0);
    let dmgMult = 1, tag = '';

    if (roll < critChance) {
      dmgMult = isBoss ? 2.5 : 1.5;
      tag = '💥크리티컬! ';
    } else if (isBoss && roll > 70) {
      dmgMult = 0.3;
      tag = '❌빗나감... ';
    } else {
      dmgMult = 0.8 + Math.random() * 0.4;
    }

    const isAoe = skill.aoe || false;
    const dmg = Math.floor(baseDmg * dmgMult);

    if (isAoe && aliveEnemies.length > 1) {
      // 광역 공격: 모든 적에게 데미지
      let killed = 0;
      aliveEnemies.forEach(e => { e.hp -= dmg; if (e.hp <= 0) { e.alive = false; killed++; } });
      totalDmg += dmg * aliveEnemies.length;
      const remaining = enemies.filter(e => e.alive).length;
      lines.push({ text: `${skill.icon} ${skill.name} — ${tag}전체 공격! ${aliveEnemies.length}마리에게 ${dmg} 데미지!${killed > 0 ? ` ${killed}마리 처치!` : ''}${remaining > 0 ? ` 남은 적: ${remaining}` : ''}`, type: tag.includes('크리티컬') ? 'critical' : 'action', dmg: dmg * aliveEnemies.length });
    } else {
      // 단일 공격: 첫 번째 살아있는 적
      const target = aliveEnemies[0];
      target.hp -= dmg;
      totalDmg += dmg;
      let killText = '';
      if (target.hp <= 0) {
        target.alive = false;
        const remaining = enemies.filter(e => e.alive).length;
        killText = enemyCount > 1 ? ` → 1마리 처치!${remaining > 0 ? ` 남은 적: ${remaining}` : ''}` : '';
      }
      lines.push({ text: `${skill.icon} ${skill.name} 시전! → ${tag}${dmg} 데미지${killText}`, type: tag.includes('크리티컬') ? 'critical' : tag.includes('빗나감') ? 'miss' : 'action', dmg });
    }

    // 적 반격 (살아있는 적 — 항상 반격, 턴제 느낌)
    const stillAlive = enemies.filter(e => e.alive);
    if (stillAlive.length > 0) {
      const attackers = isBoss ? stillAlive : stillAlive.filter(() => Math.random() < 0.7);
      const actualAttackers = attackers.length > 0 ? attackers : [stillAlive[0]];
      for (const attacker of actualAttackers) {
        const eRoll = Math.random();
        if (eRoll < 0.15) {
          lines.push({ text: `${enemy}의 공격이 빗나갔다!`, type: 'damage', dmg: 0 });
        } else {
          const eCrit = eRoll > 0.9;
          const eDmg = Math.max(1, Math.floor((isBoss ? (5 + G.floor * 2) : (3 + G.floor)) * (eCrit ? 1.8 : (0.6 + Math.random() * 0.4)) - effectiveDef / 3));
          totalTaken += eDmg;
          lines.push({ text: `${eCrit ? '💥 ' : ''}${enemy}의 공격! → -${eDmg} HP`, type: 'damage', dmg: eDmg });
        }
      }
    }
  }

  const won = enemies.every(e => !e.alive);
  const goldReward = won ? Math.floor((10 + G.floor * 5) * (isBoss ? 3 : 1) * enemyCount * (0.8 + Math.random() * 0.4)) : 0;
  const expReward = won ? Math.floor((15 + G.floor * 3) * (isBoss ? 2.5 : 1) * enemyCount) : 0;

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
