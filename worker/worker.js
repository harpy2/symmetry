const SYSTEM_PROMPTS = {
  item: `You are an RPG item generator for a Korean dungeon crawler game. Generate a unique item based on the player's class, level, and current floor. Be creative with names and descriptions in Korean. Stats should scale with level and floor.
Respond with ONLY valid JSON, no markdown, no explanation:
{"name":"string","type":"weapon|armor|accessory","grade":"일반|레어|유니크|에픽","emoji":"single emoji","stats":{"ATK":number,"DEF":number,"HP":number,"치명타":number},"durability":number,"desc":"string"}
Only include relevant stats (omit zero values). Grade probability: 일반 50%, 레어 30%, 유니크 15%, 에픽 5%. Higher floors increase chance of better grades.`,

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

  levelup: `You are a level-up buff designer for a Korean dungeon crawler game. Generate 3 unique and creative buff choices. Go beyond simple stat boosts - include interesting mechanics and creative effects.
Respond with ONLY valid JSON, no markdown, no explanation:
{"choices":[{"name":"string in Korean","desc":"string in Korean","effect":{"stat":"string","value":number}},{"name":"string","desc":"string","effect":{"stat":"string","value":number}},{"name":"string","desc":"string","effect":{"stat":"string","value":number}}]}
Be creative with effect stats - use things like ATK, DEF, HP, 치명타, 회피, 흡혈, 반사, 연속공격 etc.`
};

const MAX_TOKENS = { item: 300, skill: 300, story: 500, npc: 300, levelup: 300 };

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
          model: 'claude-3-5-haiku-20241022',
          max_tokens: MAX_TOKENS[type] || 300,
          system: SYSTEM_PROMPTS[type],
          messages: [{ role: 'user', content: JSON.stringify(context) }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: 'Claude API error', detail: data }), { status: 502, headers: { ...headers, 'Content-Type': 'application/json' } });
      }

      const text = data.content[0].text;
      const result = JSON.parse(text);

      return new Response(JSON.stringify(result), { headers: { ...headers, 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Internal error', message: e.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
    }
  },
};
