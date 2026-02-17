// ===== GAME DATA =====
const CLASSES={
거너:{color:'#22c55e',glow:'#22c55e',weapon:'🔫',bodyColor:'linear-gradient(180deg,#1a5c2a,#0f3d1a)',desc:'원거리 딜러. 총과 폭발물로 적을 섬멸한다.',baseHP:90,baseATK:18,baseDEF:6,
skills:[
{name:'샷건',icon:'💥',desc:'근거리 산탄 — 높은 데미지',dmg:30},
{name:'기관총',icon:'🔫',desc:'연사 공격 — 다중 타격',dmg:12,hits:3},
{name:'수류탄',icon:'💣',desc:'AoE 폭발 — 광역 데미지',dmg:22,aoe:true},
{name:'스팀팩',icon:'💉',desc:'공속 버프 — ATK +30%',buff:true,dmg:0},
{name:'러시안룰렛',icon:'🎰',desc:'HP 30% 이하 시 폭딜',dmg:50},
{name:'네이팜탄',icon:'🔥',desc:'지속 화염 — DoT 데미지',dmg:15,dot:true},
{name:'관통탄',icon:'🎯',desc:'관통 사격 — 방어 무시',dmg:28},
{name:'산탄폭풍',icon:'🌪️',desc:'360도 전체 공격',dmg:20,aoe:true},
{name:'드론포격',icon:'🤖',desc:'자동 드론 소환 공격',dmg:18},
{name:'저격',icon:'🔭',desc:'원거리 초고데미지 단일 타격',dmg:45}],
passives:[
{name:'치명타 +15%',icon:'💀',desc:'치명타 확률 15% 증가'},
{name:'쿨타임 -20%',icon:'⏱️',desc:'스킬 쿨타임 20% 감소'},
{name:'50% 두발 시전',icon:'🎲',desc:'50% 확률로 스킬 2회 시전'},
{name:'AoE +30%',icon:'💫',desc:'광역 스킬 범위 30% 증가'},
{name:'딸피 적 +50%',icon:'☠️',desc:'HP 낮은 적에게 50% 추가 데미지'},
{name:'5타 추가탄',icon:'🔄',desc:'5번째 공격마다 추가탄 발사'}]},
마법사:{color:'#4a9eff',glow:'#4a9eff',weapon:'🪄',bodyColor:'linear-gradient(180deg,#1a3a6c,#0f1f3d)',desc:'마법 딜러. 원소 마법으로 전장을 지배한다.',baseHP:80,baseATK:22,baseDEF:5,
skills:[
{name:'파이어볼',icon:'🔥',desc:'화염 폭발 — 단일 고데미지',dmg:28},
{name:'아이스노바',icon:'❄️',desc:'AoE 빙결 — 광역+둔화',dmg:20,aoe:true},
{name:'입자와 파동',icon:'⚛️',desc:'50/50 단일 또는 범위 공격',dmg:25},
{name:'블레이즈',icon:'🔥',desc:'화염 자취 — 지속 데미지',dmg:15,dot:true},
{name:'사건의 지평선',icon:'🌀',desc:'중력장 — 적 속박',dmg:18},
{name:'얼음방패',icon:'🧊',desc:'5초 무적 — 방어 스킬',buff:true,dmg:0},
{name:'체인라이트닝',icon:'⚡',desc:'5연쇄 번개 공격',dmg:14,hits:5},
{name:'메테오',icon:'☄️',desc:'대형 AoE — 최강 광역기',dmg:35,aoe:true},
{name:'텔레포트',icon:'✨',desc:'순간이동 + 데미지',dmg:20},
{name:'마나폭발',icon:'💜',desc:'HP 희생 폭딜 — 고위험 고보상',dmg:55}],
passives:[
{name:'빙결 얼음화살',icon:'🏹',desc:'빙결된 적에게 추가 얼음화살'},
{name:'쿨타임 -50%',icon:'⏱️',desc:'스킬 쿨타임 50% 대폭 감소'},
{name:'불타는 적 +30%',icon:'🔥',desc:'화상 상태 적에게 30% 추가 데미지'},
{name:'킬 후 무소비',icon:'💀',desc:'킬 후 3초간 마나 소비 없음'},
{name:'2속성 폭발',icon:'💥',desc:'2가지 속성 연속 히트 시 보너스 폭발'},
{name:'연쇄폭발 30%',icon:'🔗',desc:'AoE 킬 시 30% 확률 연쇄폭발'}]},
전사:{color:'#ef4444',glow:'#ef4444',weapon:'⚔️',bodyColor:'linear-gradient(180deg,#6c1a1a,#3d0f0f)',desc:'근접 탱커/딜러. 강인한 방어와 강력한 근접 공격.',baseHP:120,baseATK:15,baseDEF:10,
skills:[
{name:'검기',icon:'🗡️',desc:'원거리 검파 — 중거리 공격',dmg:24},
{name:'칼날 복제',icon:'👥',desc:'분신 공격 — 2회 타격',dmg:16,hits:2},
{name:'휠윈드',icon:'🌀',desc:'회전 공격 — 광역 데미지',dmg:22,aoe:true},
{name:'회전칼날',icon:'💫',desc:'궤도 칼날 — 지속 데미지',dmg:14,dot:true},
{name:'스톰프',icon:'🦶',desc:'스턴 — 적 행동 불가',dmg:18},
{name:'돌진',icon:'🏃',desc:'차지+넉백 — 돌격 공격',dmg:26},
{name:'방패올리기',icon:'🛡️',desc:'방어+반격 — 피해 감소',buff:true,dmg:0},
{name:'지진',icon:'🌋',desc:'직선 균열 — 범위 공격',dmg:28,aoe:true},
{name:'전투의 함성',icon:'📯',desc:'ATK +30% 버프',buff:true,dmg:0},
{name:'처형',icon:'⚰️',desc:'딸피 적 즉사급 — 마무리기',dmg:60}],
passives:[
{name:'피흡 20%',icon:'🩸',desc:'데미지의 20%를 HP로 회복'},
{name:'반사뎀 100%',icon:'🪞',desc:'받는 데미지 100% 반사'},
{name:'HP +40%',icon:'💪',desc:'최대 HP 40% 증가'},
{name:'딸피 DEF +50%',icon:'🛡️',desc:'HP 20% 이하 시 DEF 50% 증가'},
{name:'낮은HP=높은ATK',icon:'😤',desc:'HP가 낮을수록 ATK 증가 (최대 +50%)'},
{name:'10피격 완전방어',icon:'🔰',desc:'10번 피격마다 완전 방어'}]}
};

const HUNT_TEMPLATES=[
{name:'어두운 숲',intro:['울창한 숲 속으로 발걸음을 옮겼다...','나뭇가지 사이로 불길한 눈빛이 번뜩인다.'],enemies:['고블린','숲 늑대','독버섯 정령'],boss:'숲의 수호자 엔트',bossEmoji:'🌲'},
{name:'잊혀진 동굴',intro:['습기 찬 동굴 깊숙이 들어섰다...','벽면에서 기묘한 빛이 새어나온다.'],enemies:['박쥐 떼','동굴 트롤','크리스탈 골렘'],boss:'심연의 거미 여왕',bossEmoji:'🕷️'},
{name:'고대 유적',intro:['무너진 신전의 잔해를 넘었다...','공기 중에 마력이 감돈다.'],enemies:['스켈레톤 병사','저주받은 석상','유령 마법사'],boss:'불멸의 리치 왕',bossEmoji:'💀'},
{name:'화산 지대',intro:['발밑에서 용암이 부글거린다...','열기가 피부를 태울 듯하다.'],enemies:['화염 도마뱀','용암 슬라임','불의 정령'],boss:'화염군주 이프리트',bossEmoji:'🔥'},
{name:'얼어붙은 설원',intro:['매서운 눈보라가 시야를 가린다...','발자국이 순식간에 눈에 묻힌다.'],enemies:['얼음 늑대','프로스트 골렘','눈보라 유령'],boss:'겨울왕 프리즈번',bossEmoji:'❄️'},
{name:'독의 늪지대',intro:['질퍽한 늪을 조심스레 걷는다...','독기 어린 안개가 피어오른다.'],enemies:['독 개구리','늪지 히드라','부패 좀비'],boss:'독룡 베노사우르',bossEmoji:'🐉'},
{name:'하늘의 탑',intro:['구름을 뚫고 솟은 탑에 올랐다...','바람이 귓가에 속삭인다.'],enemies:['하피','천둥 매','바람의 정령'],boss:'폭풍의 지배자 라이쿠',bossEmoji:'⚡'},
{name:'지하 감옥',intro:['쇠사슬 끌리는 소리가 울려퍼진다...','어둠 속에서 신음이 들린다.'],enemies:['감옥 쥐인간','탈옥 골렘','어둠 기사'],boss:'고문관 블러드메인',bossEmoji:'⛓️'},
{name:'버려진 광산',intro:['광산 수레의 녹슨 바퀴가 삐걱인다...','곡괭이 소리가 깊은 곳에서 울린다.'],enemies:['광산 드워프','보석 거미','폭발 박쥐'],boss:'광산왕 두린의 망령',bossEmoji:'⛏️'},
{name:'달빛 묘지',intro:['보름달 아래 묘비들이 줄지어 서있다...','땅 속에서 무언가 꿈틀거린다.'],enemies:['해골 궁수','구울','밴시'],boss:'죽음의 기사 모르가나',bossEmoji:'🌙'},
{name:'사막 오아시스',intro:['끝없는 모래사막을 건넌다...','신기루 너머 오아시스가 보인다.'],enemies:['사막 전갈','모래 웜','미라'],boss:'사막의 파라오 아누비스',bossEmoji:'🏜️'},
{name:'수정 동굴',intro:['형형색색 수정이 빛을 발한다...','공명하는 수정 소리가 귀를 울린다.'],enemies:['수정 박쥐','프리즘 슬라임','마나 흡수체'],boss:'수정룡 크리스탈리아',bossEmoji:'💎'}
];

const ITEM_PREFIX=['고대의','불타는','얼어붙은','저주받은','축복받은','신비한','피묻은','영원의'];
const ITEM_MATERIAL=['강철','미스릴','흑요석','드래곤','오리할콘','아다만티움'];
const ITEM_SUFFIX={weapon:['검','지팡이','활','도끼','총'],armor:['갑옷','투구','장갑'],accessory:['목걸이','반지','부적']};
const ITEM_EMOJIS={weapon:['🗡️','🪄','🏹','🪓','🔫'],armor:['🛡️','⛑️','🧤'],accessory:['📿','💍','🔮']};
const GRADE_WEIGHTS=[{g:'일반',w:60},{g:'레어',w:25},{g:'유니크',w:12},{g:'에픽',w:3}];
const GRADE_COLORS={일반:'#999',레어:'var(--blue)',유니크:'var(--purple)',에픽:'var(--orange)'};
const FLAVOR_TEXTS=['이 장비에서 알 수 없는 힘이 느껴진다.','오래된 전장의 기억이 서려있다.','제작자의 혼이 담긴 명품이다.','어둠 속에서 희미하게 빛난다.','손에 쥐면 전율이 느껴진다.','수많은 전투를 겪은 흔적이 있다.','신비로운 문양이 새겨져 있다.','전설 속 장인이 만들었다고 전해진다.'];

const LEVELUP_BUFFS=[
{name:'HP +20',desc:'최대 체력 20 증가',apply:p=>{p.maxHP+=20;p.hp=Math.min(p.hp+20,p.maxHP)}},
{name:'ATK +5',desc:'공격력 5 증가',apply:p=>{p.atk+=5}},
{name:'DEF +3',desc:'방어력 3 증가',apply:p=>{p.def+=3}},
{name:'골드 +100',desc:'골드 100 획득',apply:p=>{p.gold+=100}},
{name:'HP 회복',desc:'HP 완전 회복',apply:p=>{p.hp=p.maxHP}},
{name:'배고픔 회복',desc:'배고픔 50 회복',apply:p=>{p.hunger=Math.min(100,p.hunger+50)}},
{name:'기분 UP',desc:'기분 30 증가',apply:p=>{p.mood=Math.min(100,p.mood+30)}},
{name:'크리티컬 +5%',desc:'치명타 확률 5% 증가',apply:p=>{p.critBonus=(p.critBonus||0)+5}},
];

const MISSIONS=[
{npc:'대장장이 모루스',avatar:'🔨',color:'#8B4513',dialogue:'용사여, 내 대장간에 쓸 재료가 부족하오. 모험 중에 광석을 찾아와 주시오!',reward:'💰 80 + 💎 5',gold:80,points:5},
{npc:'마법사 엘드린',avatar:'🧙',color:'#4B0082',dialogue:'고대 마법진의 잔재를 연구 중이오. 유적에서 마력 결정을 가져다 주시오.',reward:'💰 60 + 💎 8',gold:60,points:8},
{npc:'정찰병 카이',avatar:'🏹',color:'#2F4F4F',dialogue:'숲 외곽에 수상한 움직임이 포착됐습니다. 정찰을 부탁드립니다!',reward:'💰 50 + 💎 3',gold:50,points:3},
{npc:'주점주인 릴라',avatar:'🍺',color:'#8B008B',dialogue:'요즘 손님들이 이상한 소문을 퍼뜨리고 있어요. 진상을 알아봐 주세요~',reward:'💰 40 + 💎 10',gold:40,points:10}
];
