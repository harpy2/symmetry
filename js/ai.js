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
  const ctx = { class: G.className, level: G.level, floor: G.floor };
  const fallbackItem = generateItem(); // 기존 랜덤 생성 폴백
  
  const result = await aiGenerate('item', ctx, fallbackItem);
  
  // AI 결과 유효성 검증
  if (result && result.name && result.type && result.grade && result.stats) {
    // 필수 필드 보정
    if (!result.id) result.id = Date.now() + Math.random();
    if (!result.emoji) result.emoji = result.type === 'weapon' ? '🗡️' : result.type === 'armor' ? '🛡️' : '📿';
    if (!result.durability) {
      const baseDur = { 일반: 50, 레어: 80, 유니크: 120, 에픽: 180 }[result.grade] || 60;
      result.durability = Math.floor(baseDur * (0.8 + Math.random() * 0.4));
    }
    if (!result.maxDurability) result.maxDurability = result.durability;
    if (!result.desc) result.desc = FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)];
    return result;
  }
  return fallbackItem;
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

// ===== AI HUNT STORY =====
async function generateHuntStoryAI(enemy, isBoss, floor) {
  const ctx = { class: G.className, enemy, isBoss, floor };
  const fallbackTmpl = HUNT_TEMPLATES[Math.floor(Math.random() * HUNT_TEMPLATES.length)];
  
  const result = await aiGenerate('story', ctx, {
    intro: fallbackTmpl.intro[Math.floor(Math.random() * fallbackTmpl.intro.length)],
    victory: '전투 승리! 🎉',
    defeat: '전투 패배... 💀'
  });
  
  return result;
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
    // AI 결과를 게임 시스템과 호환되게 변환
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
