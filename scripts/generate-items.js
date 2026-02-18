#!/usr/bin/env node
// Generate 1000 RPG items (500 weapons + 500 armors) with SVG icons
// Then upload to Cloudflare KV

const ACCOUNT_ID = '0615b044e69314023d8bdbc8516c704b';
const API_TOKEN = 'bFvMd4SkcbG2L8nBxhtKT93SHOvTBX2NiVq-73hK';
const KV_NAMESPACE_ID = '4d5915ca086341d982a00ed137633f80';

// ===== NAME GENERATION =====
const PREFIXES = [
  '불꽃의','얼음의','번개의','암흑의','신성한','저주받은','고대의','잊혀진','피의','영혼의',
  '바람의','대지의','별빛의','달빛의','태양의','심연의','천상의','마왕의','용의','악마의',
  '정령의','수정의','혼돈의','질서의','파멸의','창조의','시간의','공간의','생명의','죽음의',
  '전설의','신비한','광휘의','칠흑의','순백의','황금의','은빛의','붉은','푸른','검은',
  '하얀','초록의','보라빛','주홍의','비취의','호박의','진홍의','심홍의','옥빛의','강철의'
];
const MATERIALS = [
  '미스릴','아다만티움','오리하르콘','다마스커스','드래곤본','데몬','엘프','드워프','티타늄','흑철',
  '백금','룬','마나','에테르','크리스탈','다이아','사파이어','루비','에메랄드','오닉스',
  '강철','청동','백은','적동','흑요석','월장석','태양석','별의돌','영혼석','마력석'
];

// ===== WEAPON DEFINITIONS =====
const WEAPON_CATEGORIES = [
  // [subType, baseName[], type, classes[], count, svgGenerator]
  { subType:'sword', names:['장검','검','세검','레이피어','브로드소드'], type:'weapon', classes:['전사','성기사','다크나이트'], count:35 },
  { subType:'greatsword', names:['대검','참마도','클레이모어','쯔바이핸더'], type:'weapon', classes:['전사','바이킹','다크나이트'], count:25 },
  { subType:'axe', names:['전투도끼','양손도끼','투척도끼','배틀액스'], type:'weapon', classes:['전사','바이킹','버서커'], count:25 },
  { subType:'hammer', names:['워해머','묵직한 망치','그레이트해머'], type:'weapon', classes:['전사','바이킹','성기사'], count:15 },
  { subType:'spear', names:['창','장창','할버드','미늘창','트라이던트'], type:'weapon', classes:['전사','발키리','드래곤나이트'], count:30 },
  { subType:'dagger', names:['단검','비수','쿠나이','카타르','스틸레토'], type:'weapon', classes:['도적','어쌔신','닌자'], count:30 },
  { subType:'throwable', names:['표창','투척나이프','차크람','부메랑'], type:'offhand', classes:['도적','닌자','레인저'], count:20 },
  { subType:'pistol', names:['권총','리볼버','매그넘','데린저'], type:'weapon', classes:['거너','건슬링어','메카닉'], count:25 },
  { subType:'rifle', names:['라이플','저격총','볼트액션','머스킷'], type:'weapon', classes:['거너','스나이퍼','레인저'], count:25 },
  { subType:'shotgun', names:['샷건','더블배럴','펌프액션'], type:'weapon', classes:['거너','건슬링어','버서커'], count:15 },
  { subType:'smg', names:['기관단총','서브머신건','오토매틱'], type:'weapon', classes:['거너','건슬링어','메카닉'], count:15 },
  { subType:'staff', names:['스태프','지팡이','마법봉','요술봉'], type:'weapon', classes:['마법사','원소술사','네크로맨서'], count:35 },
  { subType:'wand', names:['완드','마력봉','지휘봉'], type:'weapon', classes:['마법사','원소술사','힐러'], count:25 },
  { subType:'tome', names:['마법서','그리모어','고서','금서'], type:'offhand', classes:['마법사','네크로맨서','소환사'], count:20 },
  { subType:'orb', names:['오브','수정구','마력구','영혼구'], type:'offhand', classes:['마법사','소환사','원소술사'], count:20 },
  { subType:'bow', names:['활','장궁','단궁','합성궁','전투활'], type:'weapon', classes:['궁수','레인저','스나이퍼'], count:30 },
  { subType:'crossbow', names:['석궁','연노','중석궁','반복석궁'], type:'weapon', classes:['궁수','레인저','거너'], count:20 },
  { subType:'mace', names:['철퇴','메이스','모닝스타','플레일'], type:'weapon', classes:['성기사','사제','전사'], count:30 },
  { subType:'healstaff', names:['힐링스태프','치유의 지팡이','축복봉'], type:'weapon', classes:['힐러','사제','성기사'], count:15 },
  { subType:'holybook', names:['성서','기도서','축복의 서','신성경전'], type:'offhand', classes:['힐러','사제','성기사'], count:15 },
  { subType:'wrench', names:['렌치','스패너','공구세트','만능공구'], type:'weapon', classes:['메카닉','엔지니어'], count:10 },
  { subType:'turretgun', names:['터렛건','포탑총','기계총','코일건'], type:'weapon', classes:['메카닉','엔지니어','거너'], count:10 },
  { subType:'scythe', names:['낫','대낫','사신의 낫','전투낫'], type:'weapon', classes:['드루이드','네크로맨서','다크나이트'], count:10 },
];

// ===== ARMOR DEFINITIONS =====
const ARMOR_CATEGORIES = [
  { type:'helmet', names:['투구','헬름','관','왕관','면갑','두건','마법모자','서클릿','티아라','전투모'], count:80, subTypes:['plate_helm','leather_helm','cloth_helm','crown','circlet'] },
  { type:'chest', names:['흉갑','갑옷','로브','코트','조끼','흉갑','판금갑','가죽갑','전투복','망토'], count:80, subTypes:['plate_chest','leather_chest','cloth_chest','robe','coat'] },
  { type:'pants', names:['각반','바지','레깅스','태슬','전투치마','하의','판금각반','가죽바지','로브하의'], count:75, subTypes:['plate_legs','leather_legs','cloth_legs'] },
  { type:'gloves', names:['장갑','건틀릿','핸드가드','팔찌','완갑','전투장갑','가죽장갑','마법장갑'], count:75, subTypes:['plate_gloves','leather_gloves','cloth_gloves'] },
  { type:'boots', names:['부츠','장화','그리브','샌들','전투화','철제부츠','가죽부츠','마법신발'], count:75, subTypes:['plate_boots','leather_boots','cloth_boots'] },
  { type:'necklace', names:['목걸이','펜던트','아뮬렛','초커','체인','탈리스만','로켓','브로치'], count:55, subTypes:['necklace','pendant','amulet','choker'] },
  { type:'ring1', names:['반지','링','시그넷','밴드','서클','룬링'], count:30, subTypes:['ring','signet','band'] },
  { type:'ring2', names:['반지','링','시그넷','밴드','서클','룬링'], count:30, subTypes:['ring','signet','band'] },
];

const ALL_CLASSES = ['전사','마법사','도적','궁수','성기사','힐러','사제','버서커','바이킹','다크나이트',
  '어쌔신','닌자','거너','건슬링어','스나이퍼','레인저','원소술사','소환사','네크로맨서','드루이드',
  '메카닉','엔지니어','발키리','드래곤나이트'];

const ARMOR_CLASSES_MAP = {
  plate_helm: ['전사','성기사','바이킹','다크나이트','버서커','드래곤나이트','발키리'],
  leather_helm: ['도적','어쌔신','닌자','궁수','레인저','거너','건슬링어','스나이퍼'],
  cloth_helm: ['마법사','힐러','사제','원소술사','소환사','네크로맨서','드루이드'],
  crown: ['성기사','사제','힐러'],
  circlet: ['마법사','원소술사','힐러'],
  plate_chest: ['전사','성기사','바이킹','다크나이트','버서커','드래곤나이트','발키리'],
  leather_chest: ['도적','어쌔신','닌자','궁수','레인저','거너','건슬링어','스나이퍼','메카닉','엔지니어'],
  cloth_chest: ['마법사','힐러','사제','원소술사','소환사','네크로맨서','드루이드'],
  robe: ['마법사','사제','힐러','소환사','네크로맨서'],
  coat: ['도적','거너','건슬링어','레인저'],
  plate_legs: ['전사','성기사','바이킹','다크나이트','버서커','드래곤나이트','발키리'],
  leather_legs: ['도적','어쌔신','닌자','궁수','레인저','거너','건슬링어','스나이퍼','메카닉','엔지니어'],
  cloth_legs: ['마법사','힐러','사제','원소술사','소환사','네크로맨서','드루이드'],
  plate_gloves: ['전사','성기사','바이킹','다크나이트','버서커','드래곤나이트','발키리'],
  leather_gloves: ['도적','어쌔신','닌자','궁수','레인저','거너','건슬링어','스나이퍼','메카닉','엔지니어'],
  cloth_gloves: ['마법사','힐러','사제','원소술사','소환사','네크로맨서','드루이드'],
  plate_boots: ['전사','성기사','바이킹','다크나이트','버서커','드래곤나이트','발키리'],
  leather_boots: ['도적','어쌔신','닌자','궁수','레인저','거너','건슬링어','스나이퍼','메카닉','엔지니어'],
  cloth_boots: ['마법사','힐러','사제','원소술사','소환사','네크로맨서','드루이드'],
  necklace: ALL_CLASSES, pendant: ALL_CLASSES, amulet: ALL_CLASSES, choker: ALL_CLASSES,
  ring: ALL_CLASSES, signet: ALL_CLASSES, band: ALL_CLASSES,
};

// ===== COLOR PALETTES =====
const PALETTES = {
  metal: ['#8a8a8a','#a8a8a8','#c0c0c0','#d4d4d4','#6b6b6b','#9e9e9e'],
  gold: ['#ffd700','#daa520','#b8860b','#cd853f','#f0c040'],
  fire: ['#ff4500','#ff6347','#ff8c00','#dc143c','#b22222','#ff2400'],
  ice: ['#00bfff','#87ceeb','#4682b4','#5f9ea0','#b0e0e6','#00ced1'],
  nature: ['#228b22','#32cd32','#006400','#2e8b57','#3cb371','#66cdaa'],
  dark: ['#2c003e','#4a0e5c','#1a1a2e','#16213e','#0f3460','#533483'],
  holy: ['#fff8dc','#fffacd','#fafad2','#ffefd5','#ffe4b5','#ffdab9'],
  arcane: ['#8a2be2','#9400d3','#9932cc','#ba55d3','#da70d6','#7b68ee'],
  blood: ['#8b0000','#a52a2a','#800000','#b22222','#dc143c'],
  leather: ['#8b4513','#a0522d','#d2691e','#cd853f','#deb887','#bc8f8f'],
  cloth: ['#483d8b','#6a5acd','#7b68ee','#9370db','#8470ff'],
  gem: ['#e0115f','#50c878','#0f52ba','#e6e200','#ff6f00'],
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randFloat(a, b) { return a + Math.random() * (b - a); }
function hex(c) { return c; }
function darken(color, amt=30) {
  let c = parseInt(color.slice(1), 16);
  let r = Math.max(0, (c >> 16) - amt);
  let g = Math.max(0, ((c >> 8) & 0xff) - amt);
  let b = Math.max(0, (c & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
function lighten(color, amt=30) {
  let c = parseInt(color.slice(1), 16);
  let r = Math.min(255, (c >> 16) + amt);
  let g = Math.min(255, ((c >> 8) & 0xff) + amt);
  let b = Math.min(255, (c & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ===== SVG GENERATORS =====
function svgWrap(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">${inner}</svg>`;
}

const SVG_GENERATORS = {
  sword(pal) {
    const blade = pick(pal); const guard = pick(PALETTES.gold);
    const hilt = pick(PALETTES.leather);
    const w = randInt(3,5); const tip = randInt(6,10);
    return svgWrap(`<rect x="${23-w/2}" y="${tip}" width="${w}" height="${28-tip}" fill="${blade}" rx="1"/><polygon points="24,${tip} ${21-w/2},${tip+4} ${27+w/2},${tip+4}" fill="${blade}"/><rect x="18" y="30" width="12" height="3" fill="${guard}" rx="1"/><rect x="22" y="33" width="4" height="8" fill="${hilt}" rx="1"/><circle cx="24" cy="41" r="2" fill="${guard}"/>`);
  },
  greatsword(pal) {
    const blade = pick(pal); const guard = pick(PALETTES.gold); const hilt = pick(PALETTES.leather);
    return svgWrap(`<rect x="21" y="4" width="6" height="30" fill="${blade}" rx="1"/><polygon points="24,3 20,8 28,8" fill="${blade}"/><rect x="16" y="34" width="16" height="3" fill="${guard}" rx="1"/><rect x="22" y="37" width="4" height="7" fill="${hilt}" rx="1"/><line x1="24" y1="8" x2="24" y2="32" stroke="${lighten(blade)}" stroke-width="1" opacity="0.4"/>`);
  },
  axe(pal) {
    const head = pick(pal); const handle = pick(PALETTES.leather);
    return svgWrap(`<rect x="23" y="8" width="3" height="34" fill="${handle}" rx="1"/><path d="M14,12 Q10,18 14,26 L26,26 L26,12 Z" fill="${head}"/><path d="M14,12 Q10,18 14,26" stroke="${darken(head)}" fill="none" stroke-width="1"/>`);
  },
  hammer(pal) {
    const head = pick(pal); const handle = pick(PALETTES.leather);
    return svgWrap(`<rect x="22" y="20" width="4" height="24" fill="${handle}" rx="1"/><rect x="12" y="8" width="24" height="14" fill="${head}" rx="3"/><rect x="12" y="8" width="24" height="3" fill="${lighten(head)}" rx="1"/>`);
  },
  spear(pal) {
    const tip = pick(pal); const shaft = pick(PALETTES.leather);
    return svgWrap(`<rect x="23" y="12" width="2" height="34" fill="${shaft}"/><polygon points="24,2 19,14 29,14" fill="${tip}"/><line x1="24" y1="5" x2="24" y2="12" stroke="${lighten(tip)}" stroke-width="1" opacity="0.5"/>`);
  },
  dagger(pal) {
    const blade = pick(pal); const guard = pick(PALETTES.gold); const hilt = pick(PALETTES.leather);
    return svgWrap(`<polygon points="24,8 21,26 27,26" fill="${blade}"/><rect x="19" y="26" width="10" height="2" fill="${guard}" rx="1"/><rect x="22" y="28" width="4" height="8" fill="${hilt}" rx="1"/><line x1="24" y1="10" x2="24" y2="25" stroke="${lighten(blade)}" stroke-width="0.5" opacity="0.5"/>`);
  },
  throwable(pal) {
    const c = pick(pal);
    return svgWrap(`<polygon points="24,6 28,20 24,16 20,20" fill="${c}"/><polygon points="24,6 20,20 24,16 28,20" fill="${c}" transform="rotate(90,24,24)"/><polygon points="24,6 28,20 24,16 20,20" fill="${c}" transform="rotate(180,24,24)"/><polygon points="24,6 20,20 24,16 28,20" fill="${c}" transform="rotate(270,24,24)"/><circle cx="24" cy="24" r="3" fill="${darken(c)}"/>`);
  },
  pistol(pal) {
    const body = pick(pal); const grip = pick(PALETTES.leather);
    return svgWrap(`<rect x="12" y="18" width="26" height="6" fill="${body}" rx="2"/><rect x="18" y="24" width="6" height="10" fill="${grip}" rx="1"/><rect x="10" y="19" width="4" height="4" fill="${darken(body)}" rx="1"/><circle cx="14" cy="21" r="1.5" fill="#333"/>`);
  },
  rifle(pal) {
    const body = pick(pal); const stock = pick(PALETTES.leather);
    return svgWrap(`<rect x="4" y="20" width="38" height="5" fill="${body}" rx="2"/><rect x="4" y="25" width="12" height="6" fill="${stock}" rx="1"/><rect x="2" y="21" width="4" height="3" fill="${darken(body)}" rx="1"/><rect x="30" y="17" width="3" height="3" fill="${darken(body)}"/>`);
  },
  shotgun(pal) {
    const body = pick(pal); const stock = pick(PALETTES.leather);
    return svgWrap(`<rect x="4" y="19" width="38" height="4" fill="${body}" rx="1"/><rect x="4" y="23" width="38" height="4" fill="${darken(body)}" rx="1"/><rect x="4" y="27" width="12" height="6" fill="${stock}" rx="1"/>`);
  },
  smg(pal) {
    const body = pick(pal); const grip = pick(PALETTES.leather);
    return svgWrap(`<rect x="8" y="18" width="30" height="5" fill="${body}" rx="2"/><rect x="16" y="23" width="5" height="10" fill="${grip}" rx="1"/><rect x="28" y="23" width="4" height="4" fill="${darken(body)}" rx="1"/><rect x="6" y="19" width="4" height="3" fill="${darken(body)}" rx="1"/>`);
  },
  staff(pal) {
    const shaft = pick(PALETTES.leather); const gem = pick(pal); const cap = pick(PALETTES.gold);
    return svgWrap(`<rect x="22" y="10" width="4" height="34" fill="${shaft}" rx="1"/><circle cx="24" cy="8" r="6" fill="${cap}" opacity="0.7"/><circle cx="24" cy="8" r="4" fill="${gem}"/><circle cx="24" cy="8" r="2" fill="${lighten(gem)}" opacity="0.6"/>`);
  },
  wand(pal) {
    const body = pick(pal); const tip = pick(PALETTES.gem);
    return svgWrap(`<rect x="22" y="14" width="3" height="28" fill="${body}" rx="1" transform="rotate(-10,24,24)"/><polygon points="24,6 20,14 28,14" fill="${tip}"/><circle cx="24" cy="10" r="2" fill="${lighten(tip)}" opacity="0.7"/>`);
  },
  tome(pal) {
    const cover = pick(pal); const pages = '#f5f0e0';
    return svgWrap(`<rect x="10" y="8" width="28" height="34" fill="${cover}" rx="3"/><rect x="13" y="10" width="22" height="30" fill="${pages}" rx="1"/><rect x="10" y="8" width="4" height="34" fill="${darken(cover)}" rx="1"/><circle cx="24" cy="24" r="5" fill="${cover}" opacity="0.5"/><text x="24" y="27" text-anchor="middle" fill="${darken(cover)}" font-size="8">✦</text>`);
  },
  orb(pal) {
    const c1 = pick(pal); const c2 = lighten(c1, 50);
    return svgWrap(`<circle cx="24" cy="24" r="14" fill="${c1}"/><circle cx="24" cy="24" r="10" fill="${c2}" opacity="0.3"/><circle cx="20" cy="18" r="4" fill="white" opacity="0.3"/><circle cx="24" cy="24" r="14" fill="none" stroke="${darken(c1)}" stroke-width="1.5"/>`);
  },
  bow(pal) {
    const body = pick(pal); const string = '#ddd';
    return svgWrap(`<path d="M16,6 Q6,24 16,42" fill="none" stroke="${body}" stroke-width="3" stroke-linecap="round"/><line x1="16" y1="6" x2="16" y2="42" stroke="${string}" stroke-width="1"/><line x1="16" y1="24" x2="36" y2="24" stroke="${body}" stroke-width="2"/><polygon points="36,24 32,21 32,27" fill="${pick(PALETTES.metal)}"/>`);
  },
  crossbow(pal) {
    const body = pick(pal); const bow = pick(PALETTES.metal);
    return svgWrap(`<rect x="14" y="22" width="24" height="4" fill="${body}" rx="1"/><path d="M8,14 Q14,22 8,30" fill="none" stroke="${bow}" stroke-width="2.5"/><line x1="8" y1="14" x2="8" y2="30" stroke="#ccc" stroke-width="0.8"/><rect x="20" y="20" width="4" height="3" fill="${darken(body)}"/>`);
  },
  mace(pal) {
    const head = pick(pal); const handle = pick(PALETTES.leather);
    return svgWrap(`<rect x="22" y="22" width="4" height="22" fill="${handle}" rx="1"/><circle cx="24" cy="16" r="10" fill="${head}"/><circle cx="24" cy="16" r="6" fill="${lighten(head)}" opacity="0.3"/><circle cx="18" cy="10" r="2.5" fill="${darken(head)}"/><circle cx="30" cy="10" r="2.5" fill="${darken(head)}"/><circle cx="18" cy="22" r="2.5" fill="${darken(head)}"/><circle cx="30" cy="22" r="2.5" fill="${darken(head)}"/>`);
  },
  healstaff(pal) {
    const shaft = '#f5f0e0'; const gem = pick(pal); const top = pick(PALETTES.gold);
    return svgWrap(`<rect x="22" y="14" width="4" height="30" fill="${shaft}" rx="1"/><rect x="16" y="6" width="16" height="4" fill="${top}" rx="2"/><rect x="22" y="4" width="4" height="14" fill="${top}" rx="1"/><circle cx="24" cy="10" r="3" fill="${gem}"/>`);
  },
  holybook(pal) {
    const cover = pick(PALETTES.holy); const cross = pick(PALETTES.gold);
    return svgWrap(`<rect x="10" y="8" width="28" height="34" fill="${cover}" rx="3"/><rect x="10" y="8" width="4" height="34" fill="${darken(cover,15)}" rx="1"/><rect x="22" y="14" width="2" height="16" fill="${cross}"/><rect x="16" y="20" width="14" height="2" fill="${cross}"/>`);
  },
  wrench(pal) {
    const c = pick(pal);
    return svgWrap(`<rect x="22" y="16" width="4" height="28" fill="${c}" rx="1"/><path d="M16,8 Q16,16 24,16 Q32,16 32,8 Q28,12 24,8 Q20,12 16,8Z" fill="${c}"/>`);
  },
  turretgun(pal) {
    const body = pick(pal); const barrel = pick(PALETTES.metal);
    return svgWrap(`<rect x="14" y="24" width="20" height="12" fill="${body}" rx="2"/><rect x="10" y="18" width="8" height="8" fill="${barrel}" rx="1"/><rect x="4" y="20" width="8" height="3" fill="${barrel}" rx="1"/><rect x="30" y="18" width="8" height="8" fill="${barrel}" rx="1"/><circle cx="24" cy="30" r="3" fill="${darken(body)}"/>`);
  },
  scythe(pal) {
    const blade = pick(pal); const handle = pick(PALETTES.leather);
    return svgWrap(`<rect x="23" y="10" width="3" height="36" fill="${handle}" rx="1"/><path d="M24,4 Q10,4 8,16 L24,12 Z" fill="${blade}"/><path d="M24,4 Q10,4 8,16" stroke="${darken(blade)}" fill="none" stroke-width="0.8"/>`);
  },
  // ARMOR
  plate_helm(pal) {
    const c = pick(pal);
    return svgWrap(`<path d="M12,30 L12,18 Q12,6 24,6 Q36,6 36,18 L36,30 Z" fill="${c}"/><rect x="12" y="26" width="24" height="4" fill="${darken(c)}" rx="1"/><rect x="16" y="20" width="16" height="6" fill="${darken(c,40)}" rx="1" opacity="0.5"/>`);
  },
  leather_helm(pal) {
    const c = pick(pal);
    return svgWrap(`<path d="M14,32 L14,16 Q14,6 24,6 Q34,6 34,16 L34,32 Z" fill="${c}"/><path d="M14,20 L34,20" stroke="${darken(c)}" stroke-width="1.5"/><circle cx="24" cy="14" r="2" fill="${darken(c)}"/>`);
  },
  cloth_helm(pal) {
    const c = pick(pal); const brim = pick(PALETTES.gold);
    return svgWrap(`<ellipse cx="24" cy="30" rx="16" ry="4" fill="${darken(c)}"/><path d="M10,30 Q10,10 24,4 Q38,10 38,30 Z" fill="${c}"/><ellipse cx="24" cy="30" rx="16" ry="4" fill="${brim}" opacity="0.4"/>`);
  },
  crown(pal) {
    const c = pick(PALETTES.gold); const gem = pick(pal);
    return svgWrap(`<rect x="10" y="22" width="28" height="10" fill="${c}" rx="2"/><polygon points="10,22 14,10 18,18 22,8 26,18 30,10 34,18 38,10 38,22" fill="${c}"/><circle cx="18" cy="26" r="2" fill="${gem}"/><circle cx="24" cy="26" r="2" fill="${gem}"/><circle cx="30" cy="26" r="2" fill="${gem}"/>`);
  },
  circlet(pal) {
    const c = pick(PALETTES.gold); const gem = pick(pal);
    return svgWrap(`<path d="M8,28 Q8,14 24,10 Q40,14 40,28" fill="none" stroke="${c}" stroke-width="3"/><circle cx="24" cy="12" r="4" fill="${gem}"/><circle cx="24" cy="12" r="2" fill="${lighten(gem)}" opacity="0.6"/>`);
  },
  plate_chest(pal) {
    const c = pick(pal);
    return svgWrap(`<path d="M12,10 L10,38 L24,42 L38,38 L36,10 Z" fill="${c}"/><line x1="24" y1="12" x2="24" y2="40" stroke="${darken(c)}" stroke-width="1"/><path d="M12,10 L24,14 L36,10" fill="none" stroke="${darken(c)}" stroke-width="1.5"/><rect x="18" y="22" width="12" height="4" fill="${darken(c,20)}" rx="1" opacity="0.3"/>`);
  },
  leather_chest(pal) {
    const c = pick(pal);
    return svgWrap(`<path d="M14,8 L10,40 L38,40 L34,8 Z" fill="${c}" rx="2"/><line x1="24" y1="10" x2="24" y2="38" stroke="${darken(c)}" stroke-width="0.8"/><rect x="16" y="14" width="16" height="2" fill="${darken(c)}" rx="1"/><rect x="16" y="20" width="16" height="2" fill="${darken(c)}" rx="1"/>`);
  },
  cloth_chest(pal) {
    const c = pick(pal);
    return svgWrap(`<path d="M12,6 L8,42 L40,42 L36,6 Z" fill="${c}"/><path d="M12,6 L18,10 L24,6 L30,10 L36,6" fill="none" stroke="${darken(c)}" stroke-width="1"/><rect x="20" y="16" width="8" height="10" fill="${darken(c)}" rx="1" opacity="0.3"/>`);
  },
  robe(pal) {
    const c = pick(pal); const trim = pick(PALETTES.gold);
    return svgWrap(`<path d="M14,6 L6,44 L42,44 L34,6 Z" fill="${c}"/><line x1="24" y1="8" x2="24" y2="42" stroke="${trim}" stroke-width="1.5"/><path d="M14,6 L24,10 L34,6" fill="none" stroke="${trim}" stroke-width="1"/>`);
  },
  coat(pal) {
    const c = pick(pal);
    return svgWrap(`<path d="M14,8 L10,42 L22,42 L22,20 L26,20 L26,42 L38,42 L34,8 Z" fill="${c}"/><rect x="14" y="8" width="20" height="3" fill="${darken(c)}" rx="1"/>`);
  },
  plate_legs(pal) {
    const c = pick(pal);
    return svgWrap(`<rect x="12" y="6" width="10" height="36" fill="${c}" rx="2"/><rect x="26" y="6" width="10" height="36" fill="${c}" rx="2"/><rect x="12" y="6" width="24" height="8" fill="${c}" rx="2"/><rect x="12" y="18" width="10" height="3" fill="${darken(c)}" rx="1"/><rect x="26" y="18" width="10" height="3" fill="${darken(c)}" rx="1"/>`);
  },
  leather_legs(pal) {
    const c = pick(pal);
    return svgWrap(`<rect x="13" y="6" width="9" height="36" fill="${c}" rx="2"/><rect x="26" y="6" width="9" height="36" fill="${c}" rx="2"/><rect x="13" y="6" width="22" height="6" fill="${c}" rx="2"/><path d="M15,16 L20,16" stroke="${darken(c)}" stroke-width="1.5"/><path d="M28,16 L33,16" stroke="${darken(c)}" stroke-width="1.5"/>`);
  },
  cloth_legs(pal) {
    const c = pick(pal);
    return svgWrap(`<path d="M12,6 L10,42 L22,42 L20,6 Z" fill="${c}"/><path d="M28,6 L26,42 L38,42 L36,6 Z" fill="${c}"/><rect x="12" y="6" width="24" height="6" fill="${c}" rx="2"/>`);
  },
  plate_gloves(pal) {
    const c = pick(pal);
    return svgWrap(`<rect x="8" y="14" width="14" height="22" fill="${c}" rx="3"/><rect x="26" y="14" width="14" height="22" fill="${c}" rx="3"/><rect x="8" y="14" width="14" height="4" fill="${darken(c)}" rx="2"/><rect x="26" y="14" width="14" height="4" fill="${darken(c)}" rx="2"/><rect x="10" y="32" width="3" height="6" fill="${c}" rx="1"/><rect x="14" y="30" width="3" height="8" fill="${c}" rx="1"/><rect x="18" y="30" width="3" height="7" fill="${c}" rx="1"/><rect x="28" y="32" width="3" height="6" fill="${c}" rx="1"/><rect x="32" y="30" width="3" height="8" fill="${c}" rx="1"/><rect x="36" y="30" width="3" height="7" fill="${c}" rx="1"/>`);
  },
  leather_gloves(pal) {
    const c = pick(pal);
    return svgWrap(`<rect x="8" y="16" width="13" height="18" fill="${c}" rx="3"/><rect x="27" y="16" width="13" height="18" fill="${c}" rx="3"/><rect x="10" y="30" width="3" height="7" fill="${c}" rx="1"/><rect x="14" y="29" width="3" height="8" fill="${c}" rx="1"/><rect x="18" y="30" width="2" height="6" fill="${c}" rx="1"/><rect x="29" y="30" width="3" height="7" fill="${c}" rx="1"/><rect x="33" y="29" width="3" height="8" fill="${c}" rx="1"/><rect x="37" y="30" width="2" height="6" fill="${c}" rx="1"/>`);
  },
  cloth_gloves(pal) {
    const c = pick(pal); const trim = pick(PALETTES.arcane);
    return svgWrap(`<rect x="8" y="16" width="13" height="18" fill="${c}" rx="4"/><rect x="27" y="16" width="13" height="18" fill="${c}" rx="4"/><rect x="10" y="30" width="3" height="7" fill="${c}" rx="1"/><rect x="14" y="29" width="3" height="8" fill="${c}" rx="1"/><rect x="29" y="30" width="3" height="7" fill="${c}" rx="1"/><rect x="33" y="29" width="3" height="8" fill="${c}" rx="1"/><circle cx="15" cy="24" r="2" fill="${trim}" opacity="0.6"/><circle cx="34" cy="24" r="2" fill="${trim}" opacity="0.6"/>`);
  },
  plate_boots(pal) {
    const c = pick(pal);
    return svgWrap(`<path d="M8,12 L8,34 L4,38 L4,42 L20,42 L20,34 L20,12 Z" fill="${c}" /><path d="M28,12 L28,34 L24,38 L24,42 L40,42 L40,34 L40,12 Z" fill="${c}" /><rect x="8" y="12" width="12" height="4" fill="${darken(c)}" rx="1"/><rect x="28" y="12" width="12" height="4" fill="${darken(c)}" rx="1"/>`);
  },
  leather_boots(pal) {
    const c = pick(pal);
    return svgWrap(`<path d="M10,14 L10,34 L6,38 L6,42 L20,42 L20,14 Z" fill="${c}" rx="2"/><path d="M28,14 L28,34 L24,38 L24,42 L38,42 L38,14 Z" fill="${c}" rx="2"/><path d="M10,28 L20,28" stroke="${darken(c)}" stroke-width="1.5"/><path d="M28,28 L38,28" stroke="${darken(c)}" stroke-width="1.5"/>`);
  },
  cloth_boots(pal) {
    const c = pick(pal); const sole = pick(PALETTES.leather);
    return svgWrap(`<path d="M10,16 L10,38 L20,38 L20,16 Z" fill="${c}" rx="2"/><path d="M28,16 L28,38 L38,38 L38,16 Z" fill="${c}" rx="2"/><rect x="8" y="38" width="14" height="4" fill="${sole}" rx="2"/><rect x="26" y="38" width="14" height="4" fill="${sole}" rx="2"/>`);
  },
  necklace(pal) {
    const chain = pick(PALETTES.gold); const gem = pick(pal);
    return svgWrap(`<path d="M12,8 Q12,28 24,32 Q36,28 36,8" fill="none" stroke="${chain}" stroke-width="2"/><circle cx="24" cy="32" r="5" fill="${gem}"/><circle cx="24" cy="32" r="3" fill="${lighten(gem)}" opacity="0.4"/>`);
  },
  pendant(pal) {
    const chain = pick(PALETTES.gold); const gem = pick(pal);
    return svgWrap(`<path d="M14,6 Q14,24 24,30 Q34,24 34,6" fill="none" stroke="${chain}" stroke-width="1.5"/><polygon points="24,26 18,34 24,42 30,34" fill="${gem}"/><polygon points="24,28 20,34 24,38 28,34" fill="${lighten(gem)}" opacity="0.3"/>`);
  },
  amulet(pal) {
    const chain = pick(PALETTES.gold); const c = pick(pal);
    return svgWrap(`<path d="M14,6 Q14,22 24,28 Q34,22 34,6" fill="none" stroke="${chain}" stroke-width="1.5"/><circle cx="24" cy="30" r="8" fill="${c}"/><path d="M20,30 L24,22 L28,30 L24,38 Z" fill="${lighten(c)}" opacity="0.5"/>`);
  },
  choker(pal) {
    const c = pick(pal); const gem = pick(PALETTES.gem);
    return svgWrap(`<path d="M8,20 Q8,32 24,34 Q40,32 40,20" fill="none" stroke="${c}" stroke-width="4"/><circle cx="24" cy="34" r="4" fill="${gem}"/>`);
  },
  ring(pal) {
    const c = pick(pal); const gem = pick(PALETTES.gem);
    return svgWrap(`<circle cx="24" cy="24" r="12" fill="none" stroke="${c}" stroke-width="5"/><circle cx="24" cy="12" r="4" fill="${gem}"/><circle cx="24" cy="12" r="2" fill="${lighten(gem)}" opacity="0.5"/>`);
  },
  signet(pal) {
    const c = pick(pal);
    return svgWrap(`<circle cx="24" cy="24" r="12" fill="none" stroke="${c}" stroke-width="4"/><rect x="18" y="10" width="12" height="8" fill="${c}" rx="2"/><text x="24" y="17" text-anchor="middle" fill="${darken(c,60)}" font-size="7">⚜</text>`);
  },
  band(pal) {
    const c = pick(pal);
    return svgWrap(`<circle cx="24" cy="24" r="12" fill="none" stroke="${c}" stroke-width="6"/><circle cx="24" cy="24" r="12" fill="none" stroke="${lighten(c)}" stroke-width="2" opacity="0.4"/>`);
  },
};

// Map palette choices per weapon subtype
function getPalette(subType) {
  const map = {
    sword: [PALETTES.metal, PALETTES.ice, PALETTES.fire, PALETTES.dark],
    greatsword: [PALETTES.metal, PALETTES.fire, PALETTES.blood, PALETTES.dark],
    axe: [PALETTES.metal, PALETTES.fire, PALETTES.blood],
    hammer: [PALETTES.metal, PALETTES.gold, PALETTES.fire],
    spear: [PALETTES.metal, PALETTES.ice, PALETTES.nature],
    dagger: [PALETTES.metal, PALETTES.dark, PALETTES.blood],
    throwable: [PALETTES.metal, PALETTES.dark, PALETTES.fire],
    pistol: [PALETTES.metal, PALETTES.dark, PALETTES.gold],
    rifle: [PALETTES.metal, PALETTES.dark, PALETTES.nature],
    shotgun: [PALETTES.metal, PALETTES.dark, PALETTES.blood],
    smg: [PALETTES.metal, PALETTES.dark, PALETTES.gold],
    staff: [PALETTES.arcane, PALETTES.ice, PALETTES.fire, PALETTES.nature, PALETTES.dark],
    wand: [PALETTES.arcane, PALETTES.gem, PALETTES.ice, PALETTES.fire],
    tome: [PALETTES.dark, PALETTES.arcane, PALETTES.blood, PALETTES.nature],
    orb: [PALETTES.arcane, PALETTES.ice, PALETTES.fire, PALETTES.nature, PALETTES.gem],
    bow: [PALETTES.leather, PALETTES.nature, PALETTES.dark],
    crossbow: [PALETTES.metal, PALETTES.leather, PALETTES.dark],
    mace: [PALETTES.metal, PALETTES.gold, PALETTES.holy],
    healstaff: [PALETTES.holy, PALETTES.nature, PALETTES.ice],
    holybook: [PALETTES.holy, PALETTES.gold],
    wrench: [PALETTES.metal, PALETTES.gold],
    turretgun: [PALETTES.metal, PALETTES.dark],
    scythe: [PALETTES.dark, PALETTES.blood, PALETTES.nature],
    // armor
    plate_helm: [PALETTES.metal, PALETTES.gold, PALETTES.dark],
    leather_helm: [PALETTES.leather, PALETTES.dark, PALETTES.nature],
    cloth_helm: [PALETTES.cloth, PALETTES.arcane, PALETTES.dark],
    crown: [PALETTES.gem, PALETTES.arcane],
    circlet: [PALETTES.arcane, PALETTES.ice, PALETTES.nature],
    plate_chest: [PALETTES.metal, PALETTES.gold, PALETTES.dark],
    leather_chest: [PALETTES.leather, PALETTES.dark, PALETTES.nature],
    cloth_chest: [PALETTES.cloth, PALETTES.arcane],
    robe: [PALETTES.cloth, PALETTES.arcane, PALETTES.dark],
    coat: [PALETTES.leather, PALETTES.dark],
    plate_legs: [PALETTES.metal, PALETTES.gold, PALETTES.dark],
    leather_legs: [PALETTES.leather, PALETTES.dark],
    cloth_legs: [PALETTES.cloth, PALETTES.arcane],
    plate_gloves: [PALETTES.metal, PALETTES.gold],
    leather_gloves: [PALETTES.leather, PALETTES.dark],
    cloth_gloves: [PALETTES.cloth, PALETTES.arcane],
    plate_boots: [PALETTES.metal, PALETTES.gold, PALETTES.dark],
    leather_boots: [PALETTES.leather, PALETTES.dark],
    cloth_boots: [PALETTES.cloth, PALETTES.arcane],
    necklace: [PALETTES.gem, PALETTES.arcane, PALETTES.gold],
    pendant: [PALETTES.gem, PALETTES.arcane, PALETTES.ice],
    amulet: [PALETTES.arcane, PALETTES.dark, PALETTES.gem],
    choker: [PALETTES.gem, PALETTES.dark, PALETTES.gold],
    ring: [PALETTES.gem, PALETTES.gold, PALETTES.arcane],
    signet: [PALETTES.gold, PALETTES.metal],
    band: [PALETTES.metal, PALETTES.gold, PALETTES.arcane],
  };
  return pick(map[subType] || [PALETTES.metal]);
}

// ===== GENERATE =====
function generateWeapons() {
  const items = [];
  let idx = 1;
  for (const cat of WEAPON_CATEGORIES) {
    for (let i = 0; i < cat.count; i++) {
      const id = `w${String(idx).padStart(3, '0')}`;
      const baseName = pick(cat.names);
      const prefix = pick(PREFIXES);
      const material = pick(MATERIALS);
      const name = `${prefix} ${material} ${baseName}`;
      const pal = getPalette(cat.subType);
      const gen = SVG_GENERATORS[cat.subType];
      const svg = gen ? gen(pal) : svgWrap(`<circle cx="24" cy="24" r="10" fill="#888"/>`);
      items.push({ id, name, type: cat.type, subType: cat.subType, svg, classes: cat.classes });
      idx++;
    }
  }
  return items;
}

function generateArmors() {
  const items = [];
  let idx = 1;
  for (const cat of ARMOR_CATEGORIES) {
    for (let i = 0; i < cat.count; i++) {
      const id = `a${String(idx).padStart(3, '0')}`;
      const baseName = pick(cat.names);
      const prefix = pick(PREFIXES);
      const material = pick(MATERIALS);
      const name = `${prefix} ${material} ${baseName}`;
      const st = pick(cat.subTypes);
      const pal = getPalette(st);
      const gen = SVG_GENERATORS[st];
      const svg = gen ? gen(pal) : svgWrap(`<rect x="10" y="10" width="28" height="28" fill="#888" rx="4"/>`);
      const classes = ARMOR_CLASSES_MAP[st] || ALL_CLASSES;
      items.push({ id, name, type: cat.type, subType: st, svg, classes });
      idx++;
    }
  }
  return items;
}

// ===== UPLOAD TO KV =====
async function uploadToKV(items) {
  const BULK_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/bulk`;
  
  // Upload in batches of 100 (CF limit is 10000 but let's be safe)
  const allKVPairs = items.map(item => ({
    key: item.id,
    value: JSON.stringify(item)
  }));

  // Build indexes
  const weapons = items.filter(i => i.id.startsWith('w')).map(i => i.id);
  const armors = items.filter(i => i.id.startsWith('a')).map(i => i.id);
  const typeIndex = {};
  for (const item of items) {
    if (!typeIndex[item.type]) typeIndex[item.type] = [];
    typeIndex[item.type].push(item.id);
  }

  allKVPairs.push({ key: 'index:weapons', value: JSON.stringify(weapons) });
  allKVPairs.push({ key: 'index:armors', value: JSON.stringify(armors) });
  for (const [type, ids] of Object.entries(typeIndex)) {
    allKVPairs.push({ key: `index:type:${type}`, value: JSON.stringify(ids) });
  }

  console.log(`Total KV pairs to upload: ${allKVPairs.length}`);
  
  // Upload in chunks of 100
  for (let i = 0; i < allKVPairs.length; i += 100) {
    const chunk = allKVPairs.slice(i, i + 100);
    const res = await fetch(BULK_URL, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chunk)
    });
    const data = await res.json();
    if (!data.success) {
      console.error(`Failed at chunk ${i}:`, data.errors);
      throw new Error('KV upload failed');
    }
    console.log(`Uploaded ${Math.min(i + 100, allKVPairs.length)}/${allKVPairs.length}`);
  }
  console.log('All items uploaded to KV!');
  
  // Print index summary
  console.log('\nIndex summary:');
  console.log(`  weapons: ${weapons.length}`);
  console.log(`  armors: ${armors.length}`);
  for (const [type, ids] of Object.entries(typeIndex)) {
    console.log(`  type:${type}: ${ids.length}`);
  }
}

// ===== MAIN =====
async function main() {
  console.log('Generating weapons...');
  const weapons = generateWeapons();
  console.log(`Generated ${weapons.length} weapons`);
  
  console.log('Generating armors...');
  const armors = generateArmors();
  console.log(`Generated ${armors.length} armors`);
  
  const allItems = [...weapons, ...armors];
  console.log(`Total: ${allItems.length} items`);
  
  // Check SVG sizes
  const sizes = allItems.map(i => i.svg.length);
  console.log(`SVG size: min=${Math.min(...sizes)}, max=${Math.max(...sizes)}, avg=${Math.floor(sizes.reduce((a,b)=>a+b)/sizes.length)}`);
  
  // Upload
  console.log('\nUploading to Cloudflare KV...');
  await uploadToKV(allItems);
}

main().catch(console.error);
