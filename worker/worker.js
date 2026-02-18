const SYSTEM_PROMPTS = {
  item: `You are an RPG item generator for a Korean dungeon crawler game. Generate a unique item based on the player's class, level, floor, and available skills. Be creative with names and descriptions in Korean. Stats should scale with level and floor.
Respond with ONLY valid JSON, no markdown, no explanation:
{"name":"string","type":"helmet|chest|gloves|pants|boots|weapon|necklace|ring1|ring2|offhand","grade":"일반|매직|레어|유니크|에픽","emoji":"single emoji","stats":{"ATK":number,"DEF":number,"HP":number,"치명타":number},"durability":number,"desc":"string","skillMods":[{"skillName":"string","mod":"string","effect":{"type":"multiHit|aoe|dmgBoost|dot|lifesteal|chain","value":number}}]}
Grade probability: 일반 45%, 매직 30%, 레어 15%, 유니크 8%, 에픽 2%.
Stat options by grade: 일반=0 stats, 매직=2 stats, 레어=3 stats, 유니크=3 stats, 에픽=3 stats.
skillMods = SKILL UPGRADE customs. ONLY for 유니크(1) and 에픽(2). These MUST enhance the player's equipped skills specifically, e.g. "파이어볼 2연속 발사", "검기 3갈래로 분산(3타겟 동시 공격)", "샷건 관통 효과 추가". Must reference actual skill names from context.
For 일반/매직/레어: do NOT include skillMods.`,

  skill: `You are an RPG skill generator for a Korean dungeon crawler game. Generate a new unique skill for the player based on their class, level, and existing skills. Make it thematic and creative. Avoid duplicating existing skills.
Respond with ONLY valid JSON, no markdown, no explanation:
{"name":"string","icon":"single emoji","desc":"string in Korean","dmg":number,"aoe":boolean,"dot":boolean,"hits":number,"buff":{"stat":"string","value":number}}
Only include optional fields (aoe, dot, hits, buff) when relevant. Be creative with skill names in Korean.`,

  story: `You are a narrative writer for a Korean dungeon crawler game. Generate a short atmospheric hunt narrative (2-3 sentences each) in Korean. Be varied and dramatic. Different tone for different floors and enemies.
Respond with ONLY valid JSON, no markdown, no explanation:
{"intro":"string","victory":"string","defeat":"string"}
All strings in Korean. Make each narrative unique and atmospheric.`,

  npc: `You are an NPC dialogue writer for a Korean dungeon crawler game. Generate immersive, personality-driven dialogue in Korean. Each NPC should have a distinct voice and personality.
Respond with ONLY valid JSON, no markdown, no explanation:
{"dialogue":"string"}
The dialogue should be in Korean, feel natural, and match the NPC's personality and context.`,

  combat: `You are a combat narrator for a Korean dungeon crawler RPG. Generate a complete battle sequence based on the player's stats, skills, equipment, and enemy info. Consider all skill modifications from equipment (skillMods). Output dramatic, varied combat narration in Korean.

Respond with ONLY valid JSON:
{"lines":[{"text":"string","type":"action|damage|critical|miss|buff|story|victory|defeat","dmg":number,"heal":number}],"result":"win|lose","totalDmg":number,"totalTaken":number,"goldReward":number,"expReward":number}

Rules:
- type "action" = player attack (left-aligned), "damage" = enemy attack (right-aligned), "critical" = player crit, "miss" = player miss, "buff" = buff activation, "story" = narration, "victory"/"defeat" = outcome
- ABSOLUTE RULE: The context contains "battleSequence" — an array of {round, skillName, skillIcon}. You MUST follow this sequence EXACTLY. Each round, the player uses the skill specified in battleSequence for that round. Do NOT use any skill not in "equippedSkillNames". Do NOT invent new skills. NEVER use 검기, 칼날복제, 휠윈드 or any skill unless it appears in equippedSkillNames.
- After each player attack, the enemy MUST attack back (type "damage").
- IMPORTANT: When enemyCount > 1, non-AoE skills can only hit ONE enemy per attack. Player must attack each enemy separately. AoE skills (aoe:true) hit ALL enemies at once. Narrate this clearly (e.g., "고블린 1마리를 쓰러뜨렸다! 남은 적: 2마리", "휠윈드로 전체 공격! 3마리 모두에게 피해!")
- If 3 enemies and no AoE, player needs at least 3 attacks to clear all
- Balance: higher floor = harder enemies, but player stats should matter
- IMPORTANT: Combat MUST alternate between player and enemy turns! Player attacks (type "action"/"critical"/"miss"), then enemy attacks back (type "damage"). Every round should have BOTH a player action AND an enemy reaction. This is a turn-based RPG — no one-sided beatdowns!
- 4-6 lines for normal (2-3 exchanges), 6-10 lines for boss (3-5 exchanges)
- goldReward and expReward should scale with floor and boss status
- All text in Korean, dramatic and varied`,

  levelup: `You are a level-up buff designer for a Korean dungeon crawler game. Generate 3 unique and creative buff choices. Go beyond simple stat boosts - include interesting mechanics and creative effects.
Respond with ONLY valid JSON, no markdown, no explanation:
{"choices":[{"name":"string in Korean","desc":"string in Korean","effect":{"stat":"string","value":number}},{"name":"string","desc":"string","effect":{"stat":"string","value":number}},{"name":"string","desc":"string","effect":{"stat":"string","value":number}}]}
Be creative with effect stats - use things like ATK, DEF, HP, 치명타, 회피, 흡혈, 반사, 연속공격 etc.`
};

const MAX_TOKENS = { item: 300, skill: 300, story: 500, npc: 300, levelup: 300, combat: 2000 };

function corsHeaders(origin) {
  const allowed = origin && (origin === 'https://symmetry.salmonholic.com' || origin.startsWith('http://localhost'));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://symmetry.salmonholic.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/api/generate' || request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    try {
      const body = await request.json();
      const { type, context } = body;

      if (!SYSTEM_PROMPTS[type]) {
        return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: MAX_TOKENS[type] || 300,
          system: SYSTEM_PROMPTS[type],
          messages: [{ role: 'user', content: JSON.stringify(context) }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Claude API error', detail: data }), { status: 502, headers: { ...headers, 'Content-Type': 'application/json' } });
      }

      let text = data.content[0].text.trim();
      // Strip markdown code fences if present
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      const result = JSON.parse(text);

      return new Response(JSON.stringify(result), { headers: { ...headers, 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Internal error', message: e.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
    }
  },
};
