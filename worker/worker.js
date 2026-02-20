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
Be creative with effect stats - use things like ATK, DEF, HP, 치명타, 회피, 흡혈, 반사, 연속공격 etc.`,

  skillcustom: `You are a skill upgrade designer for a Korean dungeon crawler RPG. The player has equipped skills, and you must generate custom upgrade options that enhance specific skills.

IMPORTANT: Each mod MUST start with the exact skill name from the context, followed by the effect description.
The mod text must be parseable by these patterns:
- "[스킬명] 2연속 발사" or "3연속 발사" → multi-hit
- "[스킬명] 데미지 +30%" or "+50%" → damage boost
- "[스킬명] 범위 2배 확대" → becomes AoE
- "[스킬명] 3갈래로 분산 (3타겟 동시 공격)" → multi-target
- "[스킬명] 시전 시 HP 5% 회복" or "8% 회복" → heal on cast
- "[스킬명] 적중 시 50% 확률 추가 시전" → chance extra cast
- "[스킬명] 치명타 데미지 +50%" → crit damage boost
- "[스킬명] 시전 시 방어력 +20%" → def buff
- "[스킬명] 관통 효과 추가" → ignore defense
- "[스킬명] 적중 시 출혈 부여 (지속 피해)" → DoT (출혈/화상/중독)

Be creative but ALWAYS follow one of the above patterns so the game engine can parse and apply the effect.
Generate exactly the number requested in context.count.

Respond with ONLY valid JSON:
{"mods":[{"skillName":"exact skill name","mod":"[스킬명] effect description"}]}`
};

const MAX_TOKENS = { item: 500, skill: 500, story: 500, npc: 300, levelup: 600, combat: 2000, skillcustom: 500 };

function corsHeaders(origin) {
  const allowed = origin && (origin === 'https://symmetry.salmonholic.com' || origin.startsWith('http://localhost'));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://symmetry.salmonholic.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  // Cron Trigger: 1분마다 adbc 캠페인 리스트 캐싱
  async scheduled(event, env, ctx) {
    try {
      const res = await fetch('https://api.adbc.io/api/v3/reward/campaigns?token=' + env.ADBC_TOKEN + '&level=2');
      if (!res.ok) return;
      const data = await res.json();
      const camps = data.camp || [];
      await env.CPQ_KV.put('cached_campaigns', JSON.stringify(camps), { expirationTtl: 300 });
    } catch (e) {
      console.error('Cron campaign cache error:', e.message);
    }
  },

  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);

    // GET /api/items/random?type=weapon
    if (url.pathname === '/api/items/random' && request.method === 'GET') {
      try {
        const type = url.searchParams.get('type') || 'weapon';
        const indexKey = `index:type:${type}`;
        const indexData = await env.ITEMS_KV.get(indexKey);
        if (!indexData) return new Response(JSON.stringify({ error: 'No items for type' }), { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } });
        const ids = JSON.parse(indexData);
        const randomId = ids[Math.floor(Math.random() * ids.length)];
        const itemData = await env.ITEMS_KV.get(randomId);
        if (!itemData) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } });
        return new Response(itemData, { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
      }
    }

    // POST /api/save — 클라우드 세이브
    if (url.pathname === '/api/save' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { user_id, data } = body;
        if (!user_id || !data) return new Response(JSON.stringify({ error: 'user_id and data required' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
        await env.CPQ_KV.put('save:' + user_id, JSON.stringify(data));
        return new Response(JSON.stringify({ ok: true }), { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
      }
    }

    // GET /api/save?user_id= — 클라우드 로드
    if (url.pathname === '/api/save' && request.method === 'GET') {
      try {
        const user_id = url.searchParams.get('user_id');
        if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
        const raw = await env.CPQ_KV.get('save:' + user_id);
        if (!raw) return new Response(JSON.stringify({ data: null }), { headers: { ...headers, 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ data: JSON.parse(raw) }), { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
      }
    }

    // GET /api/items/:id
    const itemMatch = url.pathname.match(/^\/api\/items\/([aw]\d{3})$/);
    if (itemMatch && request.method === 'GET') {
      try {
        const itemData = await env.ITEMS_KV.get(itemMatch[1]);
        if (!itemData) return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } });
        return new Response(itemData, { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
      }
    }

    // GET /api/cpq/campaigns — adbc API에서 캠페인 목록 조회 (non-incent만)
    if (url.pathname === '/api/cpq/campaigns' && request.method === 'GET') {
      try {
        const count = parseInt(url.searchParams.get('count') || '4');
        // KV 캐시에서 읽기 (Cron이 1분마다 갱신)
        let allCampaigns = [];
        const cached = await env.CPQ_KV.get('cached_campaigns');
        if (cached) {
          allCampaigns = JSON.parse(cached);
        } else {
          // 캐시 miss 시 직접 호출 + 캐싱
          const adbcRes = await fetch('https://api.adbc.io/api/v3/reward/campaigns?token=' + env.ADBC_TOKEN + '&level=2');
          if (adbcRes.ok) {
            const adbcData = await adbcRes.json();
            allCampaigns = adbcData.camp || [];
            await env.CPQ_KV.put('cached_campaigns', JSON.stringify(allCampaigns), { expirationTtl: 300 });
          }
        }
        // 랜덤 셔플 후 count개
        const shuffled = allCampaigns.sort(() => Math.random() - 0.5).slice(0, count);
        const missions = shuffled.map(c => ({
          id: c.campid,
          type: c.detail_type || 'cpc_detail_place',
          name: c.name || '',
          icon: c.iconurl || '',
          images: (c.ctv || []).map(ct => ct.url),
          join_desc: c.joindesc || '',
          reward_desc: c.rewarddesc || '',
          price: c.price || 0,
        }));
        return new Response(JSON.stringify({ missions }), { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message, missions: [] }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
      }
    }

    // POST /api/cpq/join — 미션 참여: adbc join API 호출 → lurl에 cbparam 붙여서 반환
    if (url.pathname === '/api/cpq/join' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { user_id, campaign_id, ip } = body;
        if (!user_id || !campaign_id) {
          return new Response(JSON.stringify({ error: 'user_id, campaign_id required' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
        }
        // cbparam용 click_id 생성 (UUID)
        const click_id = crypto.randomUUID();
        // KV에 저장 (TTL 24시간)
        await env.CPQ_KV.put('cb:' + click_id, JSON.stringify({ user_id, campaign_id, ts: Date.now() }), { expirationTtl: 86400 });
        // adbc 참여 API 호출
        const clientIp = ip || request.headers.get('CF-Connecting-IP') || '0.0.0.0';
        const joinUrl = `https://adbc.io/reward/v3/join?token=${env.ADBC_TOKEN}&userid=${encodeURIComponent(user_id)}&campid=${campaign_id}&cbparam=${click_id}&ip=${encodeURIComponent(clientIp)}&adid=${encodeURIComponent(user_id)}`;
        const joinRes = await fetch(joinUrl);
        const joinData = await joinRes.json();
        if (joinData.result !== 200 || !joinData.lurl) {
          return new Response(JSON.stringify({ error: 'adbc join failed', detail: joinData }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
        }
        // lurl에 sub1=click_id 파라미터 추가
        const lurl = joinData.lurl;
        const separator = lurl.includes('?') ? '&' : '?';
        const finalUrl = lurl + separator + 'sub1=' + encodeURIComponent(click_id);
        return new Response(JSON.stringify({ click_id, redirect_url: finalUrl, click_id_adbc: joinData.click_id }), { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
      }
    }

    // GET /postback — adbc 포스트백 수신
    if (url.pathname === '/postback' && request.method === 'GET') {
      try {
        const cbparam = url.searchParams.get('cbparam');
        const userid = url.searchParams.get('userid');
        // 포스트백 로그 저장
        const logEntry = { cbparam, userid, params: Object.fromEntries(url.searchParams), ts: Date.now(), ip: request.headers.get('cf-connecting-ip') };
        const logRaw = await env.CPQ_KV.get('postback_log');
        const logs = logRaw ? JSON.parse(logRaw) : [];
        logs.push(logEntry);
        if (logs.length > 200) logs.splice(0, logs.length - 200); // 최근 200개만
        await env.CPQ_KV.put('postback_log', JSON.stringify(logs));

        if (!cbparam) return new Response('missing cbparam', { status: 400 });
        // KV에서 click_id 조회
        const raw = await env.CPQ_KV.get('cb:' + cbparam);
        if (!raw) return new Response('unknown cbparam', { status: 404 });
        const data = JSON.parse(raw);
        // 보상 기록 저장 (유저가 다음 접속 시 수령)
        // reward:{user_id} 키에 보상 목록 append
        const rewardKey = 'reward:' + data.user_id;
        const existingRewards = await env.CPQ_KV.get(rewardKey);
        const rewards = existingRewards ? JSON.parse(existingRewards) : [];
        rewards.push({ campaign_id: data.campaign_id, cbparam, userid, ts: Date.now(), claimed: false });
        await env.CPQ_KV.put(rewardKey, JSON.stringify(rewards), { expirationTtl: 604800 }); // 7일 TTL
        // cb 키 삭제 (1회성)
        await env.CPQ_KV.delete('cb:' + cbparam);
        return new Response('OK', { status: 200 });
      } catch (e) {
        return new Response('error: ' + e.message, { status: 500 });
      }
    }

    // GET /api/postback-log — 포스트백 로그 조회
    if (url.pathname === '/api/postback-log' && request.method === 'GET') {
      const raw = await env.CPQ_KV.get('postback_log');
      return new Response(raw || '[]', { headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    // GET /api/cpq/rewards — 미수령 보상 조회
    if (url.pathname === '/api/cpq/rewards' && request.method === 'GET') {
      try {
        const user_id = url.searchParams.get('user_id');
        if (!user_id) return new Response(JSON.stringify({ rewards: [] }), { headers: { ...headers, 'Content-Type': 'application/json' } });
        const raw = await env.CPQ_KV.get('reward:' + user_id);
        const rewards = raw ? JSON.parse(raw) : [];
        const unclaimed = rewards.filter(r => !r.claimed);
        return new Response(JSON.stringify({ rewards: unclaimed }), { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message, rewards: [] }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
      }
    }

    // POST /api/cpq/claim — 보상 수령 처리
    if (url.pathname === '/api/cpq/claim' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { user_id } = body;
        if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
        const rewardKey = 'reward:' + user_id;
        const raw = await env.CPQ_KV.get(rewardKey);
        const rewards = raw ? JSON.parse(raw) : [];
        const unclaimed = rewards.filter(r => !r.claimed);
        if (unclaimed.length === 0) return new Response(JSON.stringify({ claimed: 0 }), { headers: { ...headers, 'Content-Type': 'application/json' } });
        // 모두 claimed 처리
        rewards.forEach(r => r.claimed = true);
        await env.CPQ_KV.put(rewardKey, JSON.stringify(rewards), { expirationTtl: 604800 });
        return new Response(JSON.stringify({ claimed: unclaimed.length, rewards: unclaimed }), { headers: { ...headers, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
      }
    }

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
