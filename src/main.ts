/// <reference types="vite/client" />
import './style.css';
import * as pc from 'playcanvas';

// STEP 30: progression UX + stage select + milestone clear/overshoot feedback.
// STEP 29's 0-5000m Tokyo prototype remains the playable MVP stage.
// Merge, variable sell value, and continuous keyboard launch aiming remain enabled.
// Keep PlayCanvas 2.22.1 / Vite 7. No additional dependencies.
// Perfect timing gives a clean launch; severe misses create intentionally comic launch failures.
// Landing does NOT end the run: the player slides until fully stopped.
// Contact API: https://developer.playcanvas.com/user-manual/physics/collision-events/
const CONFIG = {
  radius: 0.6,
  launchClearance: 1.2,
  gravity: -5.2,
  minimumLaunchSpeed: 24,
  maximumLaunchSpeed: 72,
  perfectLaunchElevationDegrees: 12,
  goodLaunchElevationDegrees: 10,
  okayLaunchElevationDegrees: 8,
  pitchResponse: 7.0,
  jetElevationDegrees: 9,
  jetPitchSeconds: 0.7,
  jetForwardBoost: 18,
  jetMaximumSpeedZ: 82,
  jetFuelSeconds: 1.8,
  tapMaximumMilliseconds: 260,
  tapMaximumPixels: 18,
  maximumYawDegrees: 30,
  maximumPullPixels: 200,
  swingPeriodSeconds: 1.35,
  perfectDashMultiplier: 1.7,
  perfectDashSeconds: 0.72,
  perfectDashScore: 0.985,
  keyboardAimDegreesPerSecond: 46,
  ballRestitution: 0.08,
  groundRestitution: 0.04,
  linearDamping: 0.006,
  angularDamping: 0.55,
  stopSpeed: 0.55,
  stopDuration: 0.8,
  groundSlideDeceleration: 4.2,
  airControlMaximumSpeedX: 22,
  airControlAcceleration: 20,
  courseLength: 5200,
  courseWidth: 170,
  ringRadius: 9.5,
  ringThickness: 0.45,
  ringBoostZ: 10,
  ringMinimumSpeedZ: 56,
  ringMaximumSpeedZ: 76,
  launchFuelSeconds: 3.0,
  ringFuelSeconds: 3.2,
  fueledForwardDeceleration: 1.6,
  coastForwardDeceleration: 6.5,
  minimumAirForwardSpeed: 16,
  corridorHalfWidth: 34,
  maxCorridorHalfWidth: 80,
  corridorWidenStartZ: 520,
  corridorWidenEndZ: 3000,
  buildingRestitution: 0.9,
  coinRadius: 0.72,
  coinPickupRadius: 1.55,
  coinValue: 1,
  ringCoinBonus: 10,
  distanceCoinStep: 100,
  distanceCoinValue: 5,
  goalCoinBonus: 200,
  inventoryCapacity: 100,
  goalZ: 5000,
  goalHalfWidth: 42,
  goalHeight: 32,
  rivalCollisionRadius: 1.55,
  rivalCollisionCooldown: 0.75,
  breakableHitRadius: 5.2,
  breakableCoinBonus: 3,
  movingWindowCoinBonus: 5,
  movingWindowHitRadius: 5.2,
  movingBodyHitRadius: 4.6,
  movingBodyCooldown: 0.45,
  safetySeconds: 240,
};

const RING_LAYOUT = [
  // Ring 1 is still the calibration target for a PERFECT straight launch.
  // The longer stage keeps alternating height/side choices through the city.
  { x: 0,   z: 120,  height: 10.5, liftY: 1 },
  { x: -14, z: 245,  height: 15,   liftY: 2 },
  { x: 17,  z: 365,  height: 11,   liftY: 1 },
  { x: -23, z: 490,  height: 17,   liftY: 3 },
  { x: 23,  z: 610,  height: 12,   liftY: 1 },
  { x: -18, z: 740,  height: 18,   liftY: 3 },
  { x: 16,  z: 875,  height: 13,   liftY: 0 },
  { x: -20, z: 1015, height: 16,   liftY: 2 },
  { x: 20,  z: 1150, height: 12,   liftY: 1 },
  { x: -16, z: 1290, height: 19,   liftY: 3 },
  { x: 10,  z: 1430, height: 13,   liftY: 0 },
  // 1500-3000m: denser city-chain section. Missing one ring is recoverable, but clean chaining is faster.
  { x: -18, z: 1660, height: 14, liftY: 1 },
  { x: 18,  z: 1840, height: 18, liftY: 2 },
  { x: -24, z: 2020, height: 22, liftY: 3 },
  { x: 22,  z: 2200, height: 17, liftY: 1 },
  { x: -16, z: 2380, height: 24, liftY: 3 },
  { x: 20,  z: 2570, height: 19, liftY: 2 },
  { x: -12, z: 2770, height: 25, liftY: 3 },
  { x: 8,   z: 2940, height: 20, liftY: 1 },
  // 3000-5000m: height-management / fountain / JET synthesis section.
  { x: -20, z: 3180, height: 20, liftY: 2 },
  { x: -34, z: 3400, height: 27, liftY: 4 },
  { x: -28, z: 3630, height: 40, liftY: 5 },
  { x: 10,  z: 3860, height: 34, liftY: 3 },
  { x: 28,  z: 4100, height: 42, liftY: 5 },
  { x: -18, z: 4350, height: 31, liftY: 3 },
  { x: 16,  z: 4600, height: 38, liftY: 4 },
  { x: 0,   z: 4850, height: 26, liftY: 2 },
] as const;

const BUILDING_LAYOUT = [
  // side: -1 = left, 1 = right. inner is the distance from center to the facade.
  // Different facade depths create a city canyon and usable rebound surfaces.
  { side: -1, z: 55,  depth: 100, inner: 27, width: 12, height: 34 },
  { side:  1, z: 55,  depth: 100, inner: 29, width: 10, height: 46 },
  { side: -1, z: 165, depth: 100, inner: 22, width: 16, height: 58 },
  { side:  1, z: 165, depth: 100, inner: 27, width: 12, height: 38 },
  { side: -1, z: 275, depth: 100, inner: 28, width: 10, height: 42 },
  { side:  1, z: 275, depth: 100, inner: 21, width: 17, height: 60 },
  { side: -1, z: 385, depth: 100, inner: 21, width: 17, height: 62 },
  { side:  1, z: 385, depth: 100, inner: 29, width: 10, height: 40 },
  { side: -1, z: 495, depth: 100, inner: 28, width: 11, height: 44 },
  { side:  1, z: 495, depth: 100, inner: 20, width: 18, height: 64 },
  { side: -1, z: 605, depth: 100, inner: 20, width: 18, height: 66 },
  { side:  1, z: 605, depth: 100, inner: 28, width: 11, height: 46 },
  { side: -1, z: 715, depth: 100, inner: 27, width: 12, height: 48 },
  { side:  1, z: 715, depth: 100, inner: 21, width: 17, height: 62 },
  { side: -1, z: 825, depth: 100, inner: 21, width: 17, height: 60 },
  { side:  1, z: 825, depth: 100, inner: 27, width: 12, height: 44 },
  { side: -1, z: 935, depth: 100, inner: 27, width: 12, height: 40 },
  { side:  1, z: 935, depth: 100, inner: 27, width: 12, height: 52 },

  { side: -1, z: 1045, depth: 100, inner: 20, width: 18, height: 64 },
  { side:  1, z: 1045, depth: 100, inner: 28, width: 11, height: 46 },
  { side: -1, z: 1155, depth: 100, inner: 27, width: 12, height: 52 },
  { side:  1, z: 1155, depth: 100, inner: 21, width: 17, height: 66 },
  { side: -1, z: 1265, depth: 100, inner: 21, width: 17, height: 62 },
  { side:  1, z: 1265, depth: 100, inner: 29, width: 10, height: 44 },
  { side: -1, z: 1375, depth: 100, inner: 28, width: 11, height: 48 },
  { side:  1, z: 1375, depth: 100, inner: 20, width: 18, height: 68 },
  { side: -1, z: 1485, depth: 100, inner: 24, width: 14, height: 52 },
  { side:  1, z: 1485, depth: 100, inner: 25, width: 13, height: 58 },] as const;

type RingGate = {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  used: boolean;
  parts: pc.Entity[];
  effectTime: number;
};

type CoinPickup = {
  id: number;
  position: pc.Vec3;
  entity: pc.Entity;
  collected: boolean;
  value: number;
  spinDegrees: number;
  pickupEffectTime: number;
};

type RivalRunner = {
  id: number;
  entity: pc.Entity;
  z: number;
  speed: number;
  lateralOffset: number;
  phase: number;
  bumpOffset: number;
  bumpVelocity: number;
  collisionCooldown: number;
};

type BreakPiece = {
  entity: pc.Entity;
  home: pc.Vec3;
  velocity: pc.Vec3;
  spin: pc.Vec3;
};

type BreakableProp = {
  id: number;
  x: number;
  y: number;
  z: number;
  root: pc.Entity;
  pieces: BreakPiece[];
  broken: boolean;
  effectTime: number;
  value: number;
};

type MovingWindow = {
  entity: pc.Entity;
  local: pc.Vec3;
  broken: boolean;
  effectTime: number;
  velocity: pc.Vec3;
  spin: pc.Vec3;
};

type MovingObstacle = {
  id: number;
  kind: 'car' | 'train' | 'plane' | 'monorail';
  root: pc.Entity;
  z: number;
  y: number;
  halfWidth: number;
  halfHeight: number;
  travel: number;
  speed: number;
  phase: number;
  windows: MovingWindow[];
  collisionCooldown: number;
};

type SurfaceContact = {
  other: pc.Entity;
  contacts: { normal: pc.Vec3; pointOther: pc.Vec3 }[];
};

type Phase = 'loading' | 'ready' | 'aiming' | 'flying' | 'finished' | 'error';
type Drag = {
  id: number;
  startX: number;
  startY: number;
  yawPixels: number;
};

type AirDrag = {
  id: number;
  startX: number;
  startY: number;
  startedAt: number;
  controlPixels: number;
  maximumMovement: number;
  dragging: boolean;
};


type EquipmentSlot = 'shoes' | 'suit' | 'backpack';
type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
type AbilityId =
  | 'launchSpeed' | 'groundGlide' | 'smashReward' | 'rebound' | 'perfectWindow' | 'smashRange'
  | 'fuelCapacity' | 'airControl' | 'coinMagnet' | 'ringBoost' | 'ringRange' | 'fountainBoost' | 'impactStability'
  | 'jetClimb' | 'jetForward' | 'jetFuel' | 'ringLift' | 'jetDuration' | 'ringFuelRecovery' | 'jetTopSpeed';

type EquipmentAbility = { id: AbilityId; value: number };
type EquipmentItem = {
  id: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  abilities: EquipmentAbility[];
  locked: boolean;
  acquiredAt: number;
};
type GameSave = {
  version: 1;
  coins: number;
  inventory: EquipmentItem[];
  equipped: Partial<Record<EquipmentSlot, string>>;
  adGachaDate: string;
  adGachaUses: number;
  tokyoUnlockedDistance: 1500 | 3000 | 5000 | 10000;
  stage2Unlocked: boolean;
  stage3Unlocked: boolean;
  claimedMilestones: string[];
};

const SAVE_KEY = 'sabori-return-step25-v1';
const SLOT_META: Record<EquipmentSlot, { label: string; icon: string }> = {
  shoes: { label: '靴', icon: '👟' },
  suit: { label: 'スーツ', icon: '🧥' },
  backpack: { label: 'バックパック', icon: '🎒' },
};
const RARITY_META: Record<Rarity, { label: string; order: number; min: number; max: number }> = {
  // Kept deliberately modest so equipment supports skill instead of overpowering the flight model.
  common: { label: 'COMMON', order: 0, min: 0.5, max: 1.5 },
  rare: { label: 'RARE', order: 1, min: 1.5, max: 3.0 },
  epic: { label: 'EPIC', order: 2, min: 3.0, max: 5.0 },
  legendary: { label: 'LEGENDARY', order: 3, min: 5.0, max: 7.5 },
  mythic: { label: 'MYTHIC', order: 4, min: 7.5, max: 10.0 },
};
const SELL_RANGE: Record<Rarity, { min: number; max: number }> = {
  common: { min: 6, max: 16 },
  rare: { min: 18, max: 38 },
  epic: { min: 45, max: 90 },
  legendary: { min: 110, max: 230 },
  mythic: { min: 280, max: 560 },
};
const NEXT_RARITY: Partial<Record<Rarity, Rarity>> = {
  common: 'rare', rare: 'epic', epic: 'legendary', legendary: 'mythic',
};

type GachaKind = 'standard' | 'premium' | 'ad';
const STAGE_DROP_RATES: Record<Rarity, number> = {
  common: 68, rare: 24, epic: 6.5, legendary: 1.4, mythic: 0.1,
};
const GACHA_CONFIG: Record<GachaKind, {
  label: string;
  price: number;
  rates: Record<Rarity, number>;
  dailyLimit?: number;
}> = {
  standard: {
    label: 'STANDARD', price: 500,
    rates: { common: 80, rare: 18, epic: 2, legendary: 0, mythic: 0 },
  },
  premium: {
    label: 'PREMIUM', price: 2000,
    rates: { common: 35, rare: 50, epic: 15, legendary: 0, mythic: 0 },
  },
  ad: {
    label: 'AD', price: 0, dailyLimit: 3,
    rates: { common: 60, rare: 35, epic: 5, legendary: 0, mythic: 0 },
  },
};
const ABILITY_META: Record<AbilityId, { label: string; unit: string }> = {
  launchSpeed: { label: '初速UP', unit: '%' },
  groundGlide: { label: '地上滑走UP', unit: '%' },
  smashReward: { label: '破壊報酬UP', unit: '%' },
  rebound: { label: '反発力UP', unit: '%' },
  perfectWindow: { label: 'PERFECT判定幅UP', unit: '%' },
  smashRange: { label: '看板破壊判定UP', unit: '%' },
  fuelCapacity: { label: '燃料容量UP', unit: '%' },
  airControl: { label: '空中操作UP', unit: '%' },
  coinMagnet: { label: 'コイン吸引UP', unit: '%' },
  ringBoost: { label: 'リング加速UP', unit: '%' },
  ringRange: { label: 'リング判定範囲UP', unit: '%' },
  fountainBoost: { label: '噴水上昇力UP', unit: '%' },
  impactStability: { label: '接触ブレ軽減', unit: '%' },
  jetClimb: { label: 'JET上昇UP', unit: '%' },
  jetForward: { label: 'JET前進UP', unit: '%' },
  jetFuel: { label: 'JET燃料UP', unit: '%' },
  ringLift: { label: 'リング上昇UP', unit: '%' },
  jetDuration: { label: 'JET上昇維持UP', unit: '%' },
  ringFuelRecovery: { label: 'リング燃料回復UP', unit: '%' },
  jetTopSpeed: { label: 'JET最高速UP', unit: '%' },
};
const ABILITY_POOL: Record<EquipmentSlot, AbilityId[]> = {
  shoes: ['launchSpeed', 'groundGlide', 'smashReward', 'rebound', 'perfectWindow', 'smashRange'],
  suit: ['fuelCapacity', 'airControl', 'coinMagnet', 'ringBoost', 'ringRange', 'fountainBoost', 'impactStability'],
  backpack: ['jetClimb', 'jetForward', 'jetFuel', 'ringLift', 'jetDuration', 'ringFuelRecovery', 'jetTopSpeed'],
};

function localDayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
function defaultSave(): GameSave {
  return { version: 1, coins: 0, inventory: [], equipped: {}, adGachaDate: localDayKey(), adGachaUses: 0, tokyoUnlockedDistance: 1500, stage2Unlocked: false, stage3Unlocked: false, claimedMilestones: [] };
}
function loadSave(): GameSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as GameSave;
    if (parsed.version !== 1 || !Array.isArray(parsed.inventory)) return defaultSave();
    parsed.coins = Number.isFinite(parsed.coins) ? Math.max(0, Math.floor(parsed.coins)) : 0;
    parsed.inventory = parsed.inventory.slice(0, CONFIG.inventoryCapacity);
    parsed.equipped ||= {};
    const today = localDayKey();
    if (parsed.adGachaDate !== today) {
      parsed.adGachaDate = today;
      parsed.adGachaUses = 0;
    }
    parsed.adGachaDate ||= today;
    parsed.adGachaUses = Number.isFinite(parsed.adGachaUses) ? Math.max(0, Math.floor(parsed.adGachaUses)) : 0;
    parsed.tokyoUnlockedDistance = ([1500, 3000, 5000, 10000] as number[]).includes(parsed.tokyoUnlockedDistance) ? parsed.tokyoUnlockedDistance : 1500;
    parsed.stage2Unlocked = Boolean(parsed.stage2Unlocked);
    parsed.stage3Unlocked = Boolean(parsed.stage3Unlocked);
    parsed.claimedMilestones = Array.isArray(parsed.claimedMilestones) ? parsed.claimedMilestones : [];
    return parsed;
  } catch {
    return defaultSave();
  }
}
function saveGame(save: GameSave): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
function equipmentId(): string {
  return `eq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function rollRarityFromRates(rates: Record<Rarity, number>, maxRarity: Rarity): Rarity {
  const maxOrder = RARITY_META[maxRarity].order;
  const eligible = (Object.keys(RARITY_META) as Rarity[])
    .filter((rarity) => RARITY_META[rarity].order <= maxOrder && rates[rarity] > 0);
  const total = eligible.reduce((sum, rarity) => sum + rates[rarity], 0);
  if (total <= 0) return 'common';
  let roll = Math.random() * total;
  for (const rarity of eligible) {
    roll -= rates[rarity];
    if (roll <= 0) return rarity;
  }
  return eligible[eligible.length - 1] ?? 'common';
}
function currentMaxRarity(): Rarity {
  if (gameSave?.stage3Unlocked) return 'mythic';
  if (gameSave?.stage2Unlocked) return 'legendary';
  return 'epic';
}
function unlockedGachaRates(kind: GachaKind): Record<Rarity, number> {
  const base = { ...GACHA_CONFIG[kind].rates };
  if (gameSave?.stage2Unlocked) {
    const legendary = kind === 'premium' ? 3 : 1;
    base.legendary = legendary;
    base.common = Math.max(0, base.common - legendary);
  }
  if (gameSave?.stage3Unlocked) {
    const mythic = kind === 'premium' ? 1 : 0.25;
    base.mythic = mythic;
    base.common = Math.max(0, base.common - mythic);
  }
  return base;
}
function randomRarityForStageDrop(): Rarity {
  return rollRarityFromRates(STAGE_DROP_RATES, currentMaxRarity());
}
function rollAbilityValue(rarity: Rarity): number {
  const meta = RARITY_META[rarity];
  return Math.round((meta.min + Math.random() * (meta.max - meta.min)) * 10) / 10;
}
function generateEquipment(rarity: Rarity = randomRarityForStageDrop(), forcedSlot?: EquipmentSlot): EquipmentItem {
  const slots: EquipmentSlot[] = ['shoes', 'suit', 'backpack'];
  const slot = forcedSlot ?? slots[Math.floor(Math.random() * slots.length)];
  const pool = [...ABILITY_POOL[slot]];
  const abilities: EquipmentAbility[] = [];
  while (abilities.length < 2 && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    const id = pool.splice(index, 1)[0];
    abilities.push({ id, value: rollAbilityValue(rarity) });
  }
  return { id: equipmentId(), slot, rarity, abilities, locked: false, acquiredAt: Date.now() };
}

function itemAbilityTotal(item: EquipmentItem): number {
  return item.abilities.reduce((sum, ability) => sum + ability.value, 0);
}
function sellValueForItem(item: EquipmentItem): number {
  const meta = RARITY_META[item.rarity];
  const range = SELL_RANGE[item.rarity];
  const minTotal = meta.min * Math.max(1, item.abilities.length);
  const maxTotal = meta.max * Math.max(1, item.abilities.length);
  const quality = maxTotal <= minTotal ? 0.5 : clamp((itemAbilityTotal(item) - minTotal) / (maxTotal - minTotal), 0, 1);
  return Math.round(range.min + (range.max - range.min) * quality);
}
function weightedInheritedAbilityIds(items: EquipmentItem[], count = 2): AbilityId[] {
  const weights = new Map<AbilityId, number>();
  for (const item of items) for (const ability of item.abilities) weights.set(ability.id, (weights.get(ability.id) ?? 0) + 1);
  const selected: AbilityId[] = [];
  while (selected.length < count && weights.size > 0) {
    const total = [...weights.values()].reduce((sum, weight) => sum + weight, 0);
    let roll = Math.random() * total;
    let picked: AbilityId | undefined;
    for (const [id, weight] of weights) {
      roll -= weight;
      if (roll <= 0) { picked = id; break; }
    }
    picked ??= [...weights.keys()][0];
    selected.push(picked);
    weights.delete(picked);
  }
  return selected;
}

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('index.html に <div id="app"></div> が必要です。');
// STEP 29 FIX: initialize the save before the shop markup calls currentMaxRarity().
// Without this, module evaluation stops with "Cannot access 'gameSave' before initialization".
const gameSave = loadSave();
document.documentElement.lang = 'ja';
document.title = 'サボりリーマンの帰宅｜ビル街ルートテスト';
root.dataset.phase = 'loading';
root.innerHTML = `
  <canvas id="game-canvas" tabindex="0" aria-label="引っ張って発射する3Dテスト"></canvas>
  <section class="top-panel game-ui">
    <p class="eyebrow">STEP 29 / 5000m STAGE PROTOTYPE</p>
    <h1>サボりリーマンの帰宅</h1>
    <div class="readouts">
      <div><span>飛距離</span><strong><b id="distance">0000m</b></strong></div>
      <div><span>地面からの高さ</span><strong><b id="height">1.2</b><small>m</small></strong></div>
      <div><span>状態</span><strong id="state">準備中</strong></div>
    </div>
    <div class="target-progress"><span>リング <b id="hit-count">0 / ${RING_LAYOUT.length}</b></span><span>コイン <b id="coin-count">0</b></span><span id="target-status">燃料 100%</span></div>
  </section>
  <div class="idle-hint game-ui" aria-hidden="true">左右に引いて発射方向を決める<span>中央で離すほど初速アップ</span></div>
  <section class="bottom-panel game-ui">
    <div class="aim-readouts">
      <span>発射判定 <b id="power">GOOD</b></span>
      <span>発射方向 <b id="direction">正面</b></span>
    </div>
    <div class="flight-readouts">
      <span>横操作 <b id="steer-state">中立</b></span>
      <span>ジェット <b id="dive-state">1 / 1</b></span>
    </div>
    <div class="power-track" aria-hidden="true"><span class="meter-center"></span><div id="power-fill"></div></div>
    <p id="message" role="status">物理エンジンを読み込んでいます…</p>
    <button id="retry-button" type="button" aria-label="最初に戻す" title="最初に戻す" disabled>↺</button>
    <p class="footnote">左右ドラッグ：移動　JET：加速</p>
  </section>
  <button id="jet-button" class="jet-button game-ui" type="button" disabled>JET <span>×1</span></button>
  <div id="player-hud" class="player-hud game-ui" aria-hidden="true">
    <div id="player-fuel-ring" class="player-fuel-ring">
      <div class="player-hud-core"><span id="player-jet">JET ×1</span></div>
    </div>
  </div>
  <div id="feedback-layer" class="feedback-layer" aria-hidden="true"></div>
  <div id="milestone-banner" class="milestone-banner" aria-live="assertive" aria-hidden="true">
    <strong id="milestone-banner-title">MISSION COMPLETE</strong>
    <span id="milestone-banner-subtitle">1500m APARTMENT</span>
  </div>

  <section id="stage-unlock-overlay" class="stage-unlock-overlay" aria-live="assertive" aria-hidden="true">
    <div class="stage-unlock-card">
      <p>MISSION COMPLETE</p>
      <div class="stage-unlock-art resort-art" aria-hidden="true">
        <span class="resort-sun"></span><span class="resort-sea"></span><span class="resort-island"></span><span class="resort-palm trunk"></span><span class="resort-palm leaf-a"></span><span class="resort-palm leaf-b"></span>
      </div>
      <span class="stage-unlock-label">NEW STAGE UNLOCKED</span>
      <h2>STAGE 2<br><b>RESORT</b></h2>
      <div class="stage-unlock-rarity"><span>RARITY UNLOCKED</span><strong>LEGENDARY</strong><small>既存のガチャ・ドロップに追加</small></div>
      <div id="stage-unlock-reward" class="stage-unlock-reward"></div>
      <button id="stage-unlock-close" type="button">RESULTへ</button>
    </div>
  </section>

  <section id="home-panel" class="menu-overlay show" aria-label="ホーム">
    <div class="home-shell">
      <div class="home-topline"><span>所持コイン</span><strong>🪙 <b id="home-coins">0</b></strong></div>
      <div class="home-character" aria-hidden="true"><div class="home-head"></div><div class="home-body"></div><div class="home-bag"></div></div>
      <h2>サボりリーマンの帰宅</h2>
      <p>装備を整えて、今日も最速で帰宅。</p>
      <button id="home-play" class="home-play" type="button">PLAY</button>
      <button id="home-stage" class="home-stage" type="button">STAGE SELECT <span id="home-stage-progress">TOKYO / 1500m</span></button>
      <div class="home-icons">
        <button id="home-shop" type="button"><span>🛒</span><b>ショップ</b></button>
        <button id="home-inventory" type="button"><span>🎒</span><b>インベントリ</b></button>
      </div>
      <button id="test-data-reset" class="test-data-reset" type="button">TEST DATA RESET</button>
    </div>
  </section>

  <section id="stage-panel" class="menu-overlay" aria-label="ステージ選択">
    <div class="menu-shell stage-shell">
      <div class="menu-header"><button id="stage-back" type="button">← HOME</button><h2>STAGE SELECT</h2><strong id="stage-progress-label">TOKYO 1500m</strong></div>
      <p class="menu-lead">5000mの家に直接ぶつかると次のステージが解放。10000mはEXTRA CHALLENGE。</p>
      <div class="stage-grid">
        <article class="stage-card unlocked current" id="stage-tokyo">
          <span>STAGE 1</span>
          <div class="stage-visual tokyo-visual" aria-hidden="true"><i class="t-building t1"></i><i class="t-building t2"></i><i class="t-building t3"></i><i class="t-tower"></i></div>
          <h3 id="stage-tokyo-name">TOKYO</h3><p id="stage-tokyo-status">NEXT GOAL 1500m</p><button id="stage-tokyo-play" type="button">PLAY TOKYO</button>
        </article>
        <article class="stage-card locked" id="stage-resort">
          <span>STAGE 2</span>
          <div class="stage-visual resort-visual" aria-hidden="true"><div class="locked-question">?</div><div class="resort-scene"><i class="sun"></i><i class="sea"></i><i class="island"></i><i class="palm"></i></div></div>
          <h3 id="stage-resort-name">UNKNOWN</h3><p id="stage-resort-status">TOKYO 5000m CLEARで解放</p><button id="stage-resort-button" type="button" disabled>LOCKED</button>
        </article>
        <article class="stage-card locked" id="stage-future">
          <span>STAGE 3</span>
          <div class="stage-visual future-visual" aria-hidden="true"><div class="locked-question">?</div><div class="future-scene"><i class="future-road"></i><i class="future-tower f1"></i><i class="future-tower f2"></i><i class="future-orb"></i></div></div>
          <h3 id="stage-future-name">UNKNOWN</h3><p id="stage-future-status">STAGE 2 5000m CLEARで解放</p><button id="stage-future-button" type="button" disabled>LOCKED</button>
        </article>
      </div>
    </div>
  </section>

  <section id="shop-panel" class="menu-overlay" aria-label="ショップ">
    <div class="menu-shell">
      <div class="menu-header"><button id="shop-back" type="button">← HOME</button><h2>SHOP</h2><strong>🪙 <b id="shop-coins">0</b></strong></div>
      <div class="shop-stage-note"><b>GACHA</b><span>現在の排出上限：<b id="shop-max-rarity">${RARITY_META[currentMaxRarity()].label}</b></span><span>INVENTORY <b id="shop-inventory-count">0</b> / ${CONFIG.inventoryCapacity}</span></div>
      <p id="shop-rarity-note" class="menu-lead">5000mクリアで、既存ガチャに次のレアリティが追加されます。</p>
      <div class="shop-grid">
        <article class="gacha-card">
          <span>STANDARD</span><h3>500 COIN</h3><p>低価格で回せる基本ガチャ。</p>
          <div class="gacha-rates"><span>COMMON <b id="rate-standard-common">80%</b></span><span>RARE <b id="rate-standard-rare">18%</b></span><span>EPIC <b id="rate-standard-epic">2%</b></span><span class="rate-legendary" hidden>LEGENDARY <b id="rate-standard-legendary">0%</b></span><span class="rate-mythic" hidden>MYTHIC <b id="rate-standard-mythic">0%</b></span></div>
          <button id="shop-standard" type="button">500コインで回す</button>
        </article>
        <article class="gacha-card premium">
          <span>PREMIUM</span><h3>2,000 COIN</h3><p>Rare以上を狙いやすい高価格ガチャ。</p>
          <div class="gacha-rates"><span>COMMON <b id="rate-premium-common">35%</b></span><span>RARE <b id="rate-premium-rare">50%</b></span><span>EPIC <b id="rate-premium-epic">15%</b></span><span class="rate-legendary" hidden>LEGENDARY <b id="rate-premium-legendary">0%</b></span><span class="rate-mythic" hidden>MYTHIC <b id="rate-premium-mythic">0%</b></span></div>
          <button id="shop-premium" type="button">2,000コインで回す</button>
        </article>
        <article class="gacha-card ad">
          <span>AD</span><h3>FREE</h3><p>広告視聴完了後に1回。1日3回まで。</p>
          <div class="gacha-rates"><span>COMMON <b id="rate-ad-common">60%</b></span><span>RARE <b id="rate-ad-rare">35%</b></span><span>EPIC <b id="rate-ad-epic">5%</b></span><span class="rate-legendary" hidden>LEGENDARY <b id="rate-ad-legendary">0%</b></span><span class="rate-mythic" hidden>MYTHIC <b id="rate-ad-mythic">0%</b></span></div>
          <button id="shop-ad" type="button">広告を見て回す</button><small id="shop-ad-status">残り3回</small>
        </article>
      </div>
    </div>
  </section>

  <section id="gacha-result-overlay" class="gacha-result-overlay" aria-live="polite">
    <div id="gacha-result-card" class="gacha-result-card">
      <p id="gacha-result-kicker">GACHA RESULT</p>
      <div id="gacha-result-icon" class="gacha-result-icon">👟</div>
      <h3 id="gacha-result-title">COMMON 靴</h3>
      <div id="gacha-result-abilities" class="gacha-result-abilities"></div>
      <button id="gacha-result-close" type="button">OK</button>
    </div>
  </section>

  <section id="inventory-panel" class="menu-overlay" aria-label="インベントリ">
    <div class="menu-shell inventory-shell">
      <div class="menu-header"><button id="inventory-back" type="button">← HOME</button><h2>INVENTORY</h2><strong><b id="inventory-count">0</b> / ${CONFIG.inventoryCapacity}</strong></div>
      <div class="inventory-layout">
        <aside class="character-card">
          <div class="inventory-character" aria-hidden="true"><div class="home-head"></div><div class="home-body"></div><div class="home-bag"></div></div>
          <div class="equipped-summary">
            <span>靴 <b id="equipped-shoes">なし</b></span>
            <span>スーツ <b id="equipped-suit">なし</b></span>
            <span>バックパック <b id="equipped-backpack">なし</b></span>
          </div>
        </aside>
        <div class="inventory-main">
          <div class="inventory-toolbar">
            <div class="inventory-tabs">
              <button class="inventory-tab active" data-slot="shoes" type="button">靴</button>
              <button class="inventory-tab" data-slot="suit" type="button">スーツ</button>
              <button class="inventory-tab" data-slot="backpack" type="button">バックパック</button>
            </div>
            <select id="inventory-sort" aria-label="並び順"><option value="newest">入手順</option><option value="rarity">レアリティ順</option><option value="locked">ロック中のみ</option></select>
          </div>
          <section class="merge-panel" aria-label="装備マージ">
            <div class="merge-heading"><div><b>MERGE</b><small>同じ部位・同じレアリティを5個</small></div><button id="merge-clear" type="button">クリア</button></div>
            <div id="merge-area" class="merge-area" aria-label="マージエリア">
              <button class="merge-slot" data-merge-index="0" type="button">1</button><button class="merge-slot" data-merge-index="1" type="button">2</button><button class="merge-slot" data-merge-index="2" type="button">3</button><button class="merge-slot" data-merge-index="3" type="button">4</button><button class="merge-slot" data-merge-index="4" type="button">5</button>
            </div>
            <div id="merge-candidates" class="merge-candidates">装備をドラッグ＆ドロップすると継承候補を表示します。</div>
            <button id="merge-button" class="merge-button" type="button" disabled>5個セットしてください</button>
            <small id="merge-message" class="merge-message">ロック中・装備中・MYTHICは素材にできません。</small>
          </section>
          <div id="inventory-grid" class="inventory-grid"></div>
        </div>
      </div>
    </div>
  </section>

  <section id="item-detail" class="item-detail" aria-live="polite">
    <div class="item-detail-card">
      <button id="item-detail-close" class="detail-close" type="button">×</button>
      <p id="item-detail-rarity">COMMON</p><div id="item-detail-icon" class="detail-icon">👟</div>
      <h3 id="item-detail-title">装備</h3><div id="item-detail-abilities" class="detail-abilities"></div>
      <button id="item-equip" type="button">装備する</button><button id="item-lock" type="button">🔒 ロック</button><button id="item-sell" type="button">売却</button>
    </div>
  </section>

  <section id="merge-result-overlay" class="merge-result-overlay" aria-live="polite">
    <div id="merge-result-card" class="merge-result-card">
      <p>MERGE COMPLETE</p><div id="merge-result-icon" class="merge-result-icon">👟</div>
      <h3 id="merge-result-title">RARE 靴</h3><div id="merge-result-abilities" class="merge-result-abilities"></div>
      <button id="merge-result-close" type="button">OK</button>
    </div>
  </section>

  <section id="result-panel" class="result-panel" aria-live="polite">
    <p class="result-kicker" id="result-kicker">RESULT</p>
    <h2 id="result-title">帰宅結果</h2>
    <div class="result-grid">
      <span>飛距離</span><b id="result-distance">0000m</b>
      <span>空中コイン</span><b id="result-air-coins">0</b>
      <span>リングボーナス</span><b id="result-ring-coins">0</b>
      <span>飛距離ボーナス</span><b id="result-distance-coins">0</b>
      <span>帰宅ボーナス</span><b id="result-goal-coins">0</b>
      <span>通過リング</span><b id="result-rings">0 / ${RING_LAYOUT.length}</b>
    </div>
    <div class="result-drop">
      <div><span>装備抽選率</span><strong id="drop-chance">0%</strong></div>
      <small id="drop-breakdown">テクニックで抽選率UP</small>
      <button id="drop-roll-button" type="button" hidden>自動抽選</button>
      <div id="drop-result" class="drop-result"></div>
    </div>
    <div class="result-total"><span>獲得コイン</span><strong id="result-total">0</strong></div>
    <button id="reward-double-button" type="button" disabled>広告を見てコイン2倍（準備中）</button>
    <button id="result-retry-button" type="button">もう一度</button>
    <button id="result-home-button" class="result-home-button" type="button">ホームへ</button>
  </section>
`;

function element<T extends HTMLElement>(selector: string): T {
  const node = root!.querySelector<T>(selector);
  if (!node) throw new Error(`Missing UI element: ${selector}`);
  return node;
}

const canvas = element<HTMLCanvasElement>('#game-canvas');
const button = element<HTMLButtonElement>('#retry-button');
const distanceText = element<HTMLElement>('#distance');
const heightText = element<HTMLElement>('#height');
const stateText = element<HTMLElement>('#state');
const powerText = element<HTMLElement>('#power');
const directionText = element<HTMLElement>('#direction');
const powerFill = element<HTMLElement>('#power-fill');
const message = element<HTMLElement>('#message');
const steerText = element<HTMLElement>('#steer-state');
const diveText = element<HTMLElement>('#dive-state');
const hitCountText = element<HTMLElement>('#hit-count');
const targetStatusText = element<HTMLElement>('#target-status');
const coinCountText = element<HTMLElement>('#coin-count');
const playerHud = element<HTMLElement>('#player-hud');
const playerFuelRing = element<HTMLElement>('#player-fuel-ring');
const playerJetText = element<HTMLElement>('#player-jet');
const feedbackLayer = element<HTMLElement>('#feedback-layer');
const milestoneBanner = element<HTMLElement>('#milestone-banner');
const milestoneBannerTitle = element<HTMLElement>('#milestone-banner-title');
const milestoneBannerSubtitle = element<HTMLElement>('#milestone-banner-subtitle');
const stageUnlockOverlay = element<HTMLElement>('#stage-unlock-overlay');
const stageUnlockClose = element<HTMLButtonElement>('#stage-unlock-close');
const stageUnlockReward = element<HTMLElement>('#stage-unlock-reward');
const resultPanel = element<HTMLElement>('#result-panel');
const resultKicker = element<HTMLElement>('#result-kicker');
const resultTitle = element<HTMLElement>('#result-title');
const resultDistance = element<HTMLElement>('#result-distance');
const resultAirCoins = element<HTMLElement>('#result-air-coins');
const resultRingCoins = element<HTMLElement>('#result-ring-coins');
const resultDistanceCoins = element<HTMLElement>('#result-distance-coins');
const resultRings = element<HTMLElement>('#result-rings');
const resultTotal = element<HTMLElement>('#result-total');
const rewardDoubleButton = element<HTMLButtonElement>('#reward-double-button');
const resultRetryButton = element<HTMLButtonElement>('#result-retry-button');
const jetButton = element<HTMLButtonElement>('#jet-button');
const homePanel = element<HTMLElement>('#home-panel');
const stagePanel = element<HTMLElement>('#stage-panel');
const shopPanel = element<HTMLElement>('#shop-panel');
const inventoryPanel = element<HTMLElement>('#inventory-panel');
const homeCoins = element<HTMLElement>('#home-coins');
const shopCoins = element<HTMLElement>('#shop-coins');
const inventoryCount = element<HTMLElement>('#inventory-count');
const homePlay = element<HTMLButtonElement>('#home-play');
const homeStage = element<HTMLButtonElement>('#home-stage');
const homeStageProgress = element<HTMLElement>('#home-stage-progress');
const stageBack = element<HTMLButtonElement>('#stage-back');
const stageProgressLabel = element<HTMLElement>('#stage-progress-label');
const stageTokyoPlay = element<HTMLButtonElement>('#stage-tokyo-play');
const stageTokyoStatus = element<HTMLElement>('#stage-tokyo-status');
const stageResort = element<HTMLElement>('#stage-resort');
const stageResortName = element<HTMLElement>('#stage-resort-name');
const stageResortStatus = element<HTMLElement>('#stage-resort-status');
const stageResortButton = element<HTMLButtonElement>('#stage-resort-button');
const stageFuture = element<HTMLElement>('#stage-future');
const stageFutureName = element<HTMLElement>('#stage-future-name');
const stageFutureStatus = element<HTMLElement>('#stage-future-status');
const stageFutureButton = element<HTMLButtonElement>('#stage-future-button');
const homeShop = element<HTMLButtonElement>('#home-shop');
const homeInventory = element<HTMLButtonElement>('#home-inventory');
const testDataReset = element<HTMLButtonElement>('#test-data-reset');
const shopBack = element<HTMLButtonElement>('#shop-back');
const shopInventoryCount = element<HTMLElement>('#shop-inventory-count');
const shopMaxRarity = element<HTMLElement>('#shop-max-rarity');
const shopRarityNote = element<HTMLElement>('#shop-rarity-note');
const shopStandard = element<HTMLButtonElement>('#shop-standard');
const shopPremium = element<HTMLButtonElement>('#shop-premium');
const shopAd = element<HTMLButtonElement>('#shop-ad');
const shopAdStatus = element<HTMLElement>('#shop-ad-status');
const gachaResultOverlay = element<HTMLElement>('#gacha-result-overlay');
const gachaResultCard = element<HTMLElement>('#gacha-result-card');
const gachaResultKicker = element<HTMLElement>('#gacha-result-kicker');
const gachaResultIcon = element<HTMLElement>('#gacha-result-icon');
const gachaResultTitle = element<HTMLElement>('#gacha-result-title');
const gachaResultAbilities = element<HTMLElement>('#gacha-result-abilities');
const gachaResultClose = element<HTMLButtonElement>('#gacha-result-close');
const inventoryBack = element<HTMLButtonElement>('#inventory-back');
const inventoryGrid = element<HTMLElement>('#inventory-grid');
const inventorySort = element<HTMLSelectElement>('#inventory-sort');
const equippedShoes = element<HTMLElement>('#equipped-shoes');
const equippedSuit = element<HTMLElement>('#equipped-suit');
const equippedBackpack = element<HTMLElement>('#equipped-backpack');
const itemDetail = element<HTMLElement>('#item-detail');
const itemDetailClose = element<HTMLButtonElement>('#item-detail-close');
const itemDetailRarity = element<HTMLElement>('#item-detail-rarity');
const itemDetailIcon = element<HTMLElement>('#item-detail-icon');
const itemDetailTitle = element<HTMLElement>('#item-detail-title');
const itemDetailAbilities = element<HTMLElement>('#item-detail-abilities');
const itemEquip = element<HTMLButtonElement>('#item-equip');
const itemLock = element<HTMLButtonElement>('#item-lock');
const itemSell = element<HTMLButtonElement>('#item-sell');
const mergeArea = element<HTMLElement>('#merge-area');
const mergeSlots = Array.from(root!.querySelectorAll<HTMLButtonElement>('.merge-slot'));
const mergeCandidates = element<HTMLElement>('#merge-candidates');
const mergeButton = element<HTMLButtonElement>('#merge-button');
const mergeClear = element<HTMLButtonElement>('#merge-clear');
const mergeMessage = element<HTMLElement>('#merge-message');
const mergeResultOverlay = element<HTMLElement>('#merge-result-overlay');
const mergeResultCard = element<HTMLElement>('#merge-result-card');
const mergeResultIcon = element<HTMLElement>('#merge-result-icon');
const mergeResultTitle = element<HTMLElement>('#merge-result-title');
const mergeResultAbilities = element<HTMLElement>('#merge-result-abilities');
const mergeResultClose = element<HTMLButtonElement>('#merge-result-close');
const resultGoalCoins = element<HTMLElement>('#result-goal-coins');
const dropChanceText = element<HTMLElement>('#drop-chance');
const dropBreakdown = element<HTMLElement>('#drop-breakdown');
const dropRollButton = element<HTMLButtonElement>('#drop-roll-button');
const dropResult = element<HTMLElement>('#drop-result');
const resultHomeButton = element<HTMLButtonElement>('#result-home-button');
const inventoryTabs = Array.from(root!.querySelectorAll<HTMLButtonElement>('.inventory-tab'));
let activeInventorySlot: EquipmentSlot = 'shoes';
let selectedItemId: string | null = null;
let mergeItemIds: string[] = [];
let application: pc.Application | undefined;
let disposeListeners: (() => void) | undefined;
let disposed = false;

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value));
}

function formatDistance(value: number): string {
  return `${Math.max(0, Math.floor(value)).toString().padStart(4, '0')}m`;
}

function itemById(id: string | undefined): EquipmentItem | undefined {
  return id ? gameSave.inventory.find((item) => item.id === id) : undefined;
}
function equippedAbilityTotal(id: AbilityId): number {
  let total = 0;
  for (const slot of ['shoes', 'suit', 'backpack'] as EquipmentSlot[]) {
    const item = itemById(gameSave.equipped[slot]);
    if (!item) continue;
    for (const ability of item.abilities) if (ability.id === id) total += ability.value;
  }
  return total;
}
function updateWalletUi(): void {
  homeCoins.textContent = String(gameSave.coins);
  shopCoins.textContent = String(gameSave.coins);
  inventoryCount.textContent = String(gameSave.inventory.length);
}
function rarityClass(rarity: Rarity): string { return `rarity-${rarity}`; }
function itemDisplayName(item: EquipmentItem): string {
  return `${RARITY_META[item.rarity].label} ${SLOT_META[item.slot].label}`;
}
function hideMenus(): void {
  homePanel.classList.remove('show'); stagePanel.classList.remove('show'); shopPanel.classList.remove('show'); inventoryPanel.classList.remove('show');
  itemDetail.classList.remove('show');
  mergeResultOverlay.classList.remove('show');
  gachaResultOverlay.classList.remove('show');
}
function updateStageSelectUi(): void {
  const nextGoal = gameSave.tokyoUnlockedDistance >= 10000 ? 'EXTRA 10000m' : `${gameSave.tokyoUnlockedDistance}m`;
  homeStageProgress.textContent = `TOKYO / ${nextGoal}`;
  stageProgressLabel.textContent = `TOKYO ${nextGoal}`;
  stageTokyoStatus.textContent = gameSave.tokyoUnlockedDistance >= 10000 ? '5000m CLEAR / EXTRA 10000m' : `NEXT GOAL ${gameSave.tokyoUnlockedDistance}m`;
  stageResort.classList.toggle('locked', !gameSave.stage2Unlocked);
  stageResort.classList.toggle('unlocked', gameSave.stage2Unlocked);
  stageResortName.textContent = gameSave.stage2Unlocked ? 'RESORT' : 'UNKNOWN';
  stageResortStatus.textContent = gameSave.stage2Unlocked ? 'UNLOCKED / 本制作で追加' : 'TOKYO 5000m CLEARで解放';
  stageResortButton.textContent = gameSave.stage2Unlocked ? 'MVPでは未実装' : 'LOCKED';
  stageFuture.classList.toggle('locked', !gameSave.stage3Unlocked);
  stageFuture.classList.toggle('unlocked', gameSave.stage3Unlocked);
  stageFutureName.textContent = gameSave.stage3Unlocked ? 'FUTURE' : 'UNKNOWN';
  stageFutureStatus.textContent = gameSave.stage3Unlocked ? 'UNLOCKED / 本制作で追加' : 'STAGE 2 5000m CLEARで解放';
  stageFutureButton.textContent = gameSave.stage3Unlocked ? 'MVPでは未実装' : 'LOCKED';
}
function showHome(): void {
  hideMenus(); homePanel.classList.add('show'); updateWalletUi(); updateStageSelectUi();
}
function showStageSelect(): void {
  hideMenus(); stagePanel.classList.add('show'); updateStageSelectUi();
}
function remainingAdGachaUses(): number {
  const today = localDayKey();
  if (gameSave.adGachaDate !== today) {
    gameSave.adGachaDate = today;
    gameSave.adGachaUses = 0;
    saveGame(gameSave);
  }
  const config = GACHA_CONFIG.ad;
  return Math.max(0, (config.dailyLimit ?? 0) - gameSave.adGachaUses);
}
function updateShopUi(): void {
  const full = gameSave.inventory.length >= CONFIG.inventoryCapacity;
  shopInventoryCount.textContent = String(gameSave.inventory.length);
  shopMaxRarity.textContent = RARITY_META[currentMaxRarity()].label;
  shopRarityNote.textContent = gameSave.stage3Unlocked
    ? 'MYTHICまで解放済み。既存の3種類のガチャから排出されます。'
    : gameSave.stage2Unlocked
      ? 'LEGENDARY解放済み。STAGE 3解放でMYTHICが既存ガチャに追加されます。'
      : 'TOKYO 5000mクリアでLEGENDARYが既存ガチャに追加されます。';
  for (const kind of ['standard', 'premium', 'ad'] as GachaKind[]) {
    const rates = unlockedGachaRates(kind);
    for (const rarity of ['common', 'rare', 'epic', 'legendary', 'mythic'] as Rarity[]) {
      const rateNode = root!.querySelector<HTMLElement>(`#rate-${kind}-${rarity}`);
      if (rateNode) rateNode.textContent = `${rates[rarity]}%`;
    }
  }
  root!.querySelectorAll<HTMLElement>('.rate-legendary').forEach((node) => { node.hidden = !gameSave.stage2Unlocked; });
  root!.querySelectorAll<HTMLElement>('.rate-mythic').forEach((node) => { node.hidden = !gameSave.stage3Unlocked; });
  shopStandard.disabled = full || gameSave.coins < GACHA_CONFIG.standard.price;
  shopPremium.disabled = full || gameSave.coins < GACHA_CONFIG.premium.price;
  const adRemaining = remainingAdGachaUses();
  shopAd.disabled = full || adRemaining <= 0;
  shopAdStatus.textContent = full ? 'インベントリ満杯' : adRemaining > 0 ? `本日残り${adRemaining}回` : '本日分終了';
}
function showShop(): void {
  hideMenus(); shopPanel.classList.add('show'); updateWalletUi(); updateShopUi();
}
function showGachaResult(item: EquipmentItem, kind: GachaKind): void {
  gachaResultCard.className = `gacha-result-card ${rarityClass(item.rarity)}`;
  gachaResultCard.dataset.rarity = item.rarity;
  gachaResultKicker.textContent = `${GACHA_CONFIG[kind].label} / GACHA RESULT`;
  gachaResultIcon.textContent = SLOT_META[item.slot].icon;
  gachaResultTitle.textContent = itemDisplayName(item);
  gachaResultAbilities.innerHTML = item.abilities.map((a) => `<span>${ABILITY_META[a.id].label}<b>+${a.value}%</b></span>`).join('');
  gachaResultOverlay.classList.add('show');
}
function rollShopGacha(kind: GachaKind): void {
  const config = GACHA_CONFIG[kind];
  if (gameSave.inventory.length >= CONFIG.inventoryCapacity) { updateShopUi(); return; }
  if (kind === 'ad') {
    if (remainingAdGachaUses() <= 0) { updateShopUi(); return; }
  } else if (gameSave.coins < config.price) {
    updateShopUi(); return;
  }
  const rarity = rollRarityFromRates(unlockedGachaRates(kind), currentMaxRarity());
  const item = generateEquipment(rarity);
  if (kind === 'ad') gameSave.adGachaUses += 1;
  else gameSave.coins -= config.price;
  if (!addEquipmentToInventory(item)) return;
  saveGame(gameSave);
  updateWalletUi();
  updateShopUi();
  showGachaResult(item, kind);
}
function completeRewardedGacha(): void {
  // Replace the temporary test confirmation with rewarded-ad SDK success callback later.
  rollShopGacha('ad');
}
function renderInventory(): void {
  updateWalletUi();
  for (const tab of inventoryTabs) tab.classList.toggle('active', tab.dataset.slot === activeInventorySlot);
  const items = gameSave.inventory.filter((item) =>
    item.slot === activeInventorySlot && (inventorySort.value !== 'locked' || item.locked));
  const sorted = [...items].sort((a, b) => inventorySort.value === 'rarity'
    ? RARITY_META[b.rarity].order - RARITY_META[a.rarity].order || b.acquiredAt - a.acquiredAt
    : b.acquiredAt - a.acquiredAt);
  inventoryGrid.replaceChildren();
  const equippedIds = new Set(Object.values(gameSave.equipped).filter(Boolean));
  for (const item of sorted) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `inventory-item ${rarityClass(item.rarity)}${equippedIds.has(item.id) ? ' equipped' : ''}`;
    card.dataset.itemId = item.id;
    card.draggable = !item.locked && !equippedIds.has(item.id) && item.rarity !== 'mythic';
    if (mergeItemIds.includes(item.id)) card.classList.add('merge-selected');
    card.innerHTML = `<span class="item-icon">${SLOT_META[item.slot].icon}</span><b>${RARITY_META[item.rarity].label}</b><small>${item.locked ? '🔒' : equippedIds.has(item.id) ? '装備中' : ''}</small>`;
    inventoryGrid.appendChild(card);
  }
  const empties = Math.min(12, Math.max(0, CONFIG.inventoryCapacity - gameSave.inventory.length));
  for (let i = 0; i < empties; i++) {
    const empty = document.createElement('div'); empty.className = 'inventory-empty'; inventoryGrid.appendChild(empty);
  }
  const names: Record<EquipmentSlot, HTMLElement> = { shoes: equippedShoes, suit: equippedSuit, backpack: equippedBackpack };
  for (const slot of ['shoes', 'suit', 'backpack'] as EquipmentSlot[]) {
    const item = itemById(gameSave.equipped[slot]);
    names[slot].textContent = item ? RARITY_META[item.rarity].label : 'なし';
  }
  renderMergeArea();
}
function showInventory(): void { hideMenus(); inventoryPanel.classList.add('show'); renderInventory(); }
function showItemDetail(item: EquipmentItem): void {
  selectedItemId = item.id;
  itemDetailRarity.textContent = RARITY_META[item.rarity].label;
  itemDetailRarity.className = rarityClass(item.rarity);
  itemDetailIcon.textContent = SLOT_META[item.slot].icon;
  itemDetailTitle.textContent = itemDisplayName(item);
  itemDetailAbilities.innerHTML = item.abilities.map((a) => `<span>${ABILITY_META[a.id].label}<b>+${a.value}${ABILITY_META[a.id].unit}</b></span>`).join('');
  const equipped = gameSave.equipped[item.slot] === item.id;
  itemEquip.textContent = equipped ? '装備中' : '装備する';
  itemEquip.disabled = equipped;
  itemLock.textContent = item.locked ? '🔓 ロック解除' : '🔒 ロック';
  const sellValue = sellValueForItem(item);
  itemSell.disabled = item.locked || equipped;
  itemSell.textContent = item.locked ? 'ロック中は売却不可' : equipped ? '装備中は売却不可' : `売却 +${sellValue}コイン`;
  itemDetail.classList.add('show');
}
function addEquipmentToInventory(item: EquipmentItem): boolean {
  if (gameSave.inventory.length >= CONFIG.inventoryCapacity) return false;
  gameSave.inventory.push(item); saveGame(gameSave); updateWalletUi(); return true;
}

function mergeItems(): EquipmentItem[] {
  return mergeItemIds.map((id) => itemById(id)).filter((item): item is EquipmentItem => Boolean(item));
}
function mergeCandidateCounts(items: EquipmentItem[]): Map<AbilityId, number> {
  const counts = new Map<AbilityId, number>();
  for (const item of items) for (const ability of item.abilities) counts.set(ability.id, (counts.get(ability.id) ?? 0) + 1);
  return counts;
}
function renderMergeArea(): void {
  mergeItemIds = mergeItemIds.filter((id) => {
    const item = itemById(id);
    return Boolean(item && !item.locked && gameSave.equipped[item.slot] !== item.id && item.rarity !== 'mythic');
  });
  const items = mergeItems();
  for (let i = 0; i < mergeSlots.length; i++) {
    const slot = mergeSlots[i];
    const item = items[i];
    slot.className = 'merge-slot' + (item ? ` filled ${rarityClass(item.rarity)}` : '');
    slot.innerHTML = item ? `<span>${SLOT_META[item.slot].icon}</span><small>${RARITY_META[item.rarity].label}</small>` : String(i + 1);
    slot.dataset.itemId = item?.id ?? '';
  }
  if (!items.length) {
    mergeCandidates.textContent = '装備をドラッグ＆ドロップすると継承候補を表示します。';
    mergeButton.disabled = true;
    mergeButton.textContent = '5個セットしてください';
    mergeMessage.textContent = 'ロック中・装備中・MYTHICは素材にできません。';
    return;
  }
  const counts = mergeCandidateCounts(items);
  mergeCandidates.innerHTML = `<b>継承候補</b>${[...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([id,count]) => `<span>${ABILITY_META[id].label}<em>×${count}</em></span>`).join('')}`;
  const base = items[0];
  const next = NEXT_RARITY[base.rarity];
  const valid = items.length === 5 && Boolean(next) && items.every((item) => item.slot === base.slot && item.rarity === base.rarity && !item.locked && gameSave.equipped[item.slot] !== item.id);
  mergeButton.disabled = !valid;
  mergeButton.textContent = valid ? `${RARITY_META[base.rarity].label} → ${RARITY_META[next!].label} にマージ` : `${items.length} / 5`;
  mergeMessage.textContent = items.length < 5 ? '同じ部位・同じレアリティを5個セットしてください。' : valid ? '候補プールから重複しない2種を抽選し、上位レアリティの数値で再抽選します。' : '部位・レアリティが一致しているか確認してください。';
}
function addMergeItem(id: string): void {
  const item = itemById(id);
  if (!item || mergeItemIds.includes(id) || mergeItemIds.length >= 5) return;
  if (item.locked || gameSave.equipped[item.slot] === item.id || item.rarity === 'mythic') {
    mergeMessage.textContent = item.rarity === 'mythic' ? 'MYTHICはこれ以上マージできません。' : 'ロック中・装備中の装備は素材にできません。';
    return;
  }
  const first = mergeItems()[0];
  if (first && (item.slot !== first.slot || item.rarity !== first.rarity)) {
    mergeMessage.textContent = '最初の素材と同じ部位・同じレアリティだけ追加できます。';
    return;
  }
  mergeItemIds.push(id);
  renderInventory();
}
function performMerge(): void {
  const items = mergeItems();
  if (items.length !== 5) return;
  const base = items[0];
  const next = NEXT_RARITY[base.rarity];
  if (!next || items.some((item) => item.slot !== base.slot || item.rarity !== base.rarity || item.locked || gameSave.equipped[item.slot] === item.id)) return;
  const inheritedIds = weightedInheritedAbilityIds(items, 2);
  const result: EquipmentItem = {
    id: equipmentId(), slot: base.slot, rarity: next, locked: false, acquiredAt: Date.now(),
    abilities: inheritedIds.map((id) => ({ id, value: rollAbilityValue(next) })),
  };
  const consumed = new Set(items.map((item) => item.id));
  gameSave.inventory = gameSave.inventory.filter((item) => !consumed.has(item.id));
  gameSave.inventory.push(result);
  saveGame(gameSave);
  mergeItemIds = [];
  mergeResultCard.className = `merge-result-card ${rarityClass(result.rarity)}`;
  mergeResultCard.dataset.rarity = result.rarity;
  mergeResultIcon.textContent = SLOT_META[result.slot].icon;
  mergeResultTitle.textContent = itemDisplayName(result);
  mergeResultAbilities.innerHTML = result.abilities.map((a) => `<span>${ABILITY_META[a.id].label}<b>+${a.value}%</b></span>`).join('');
  mergeResultOverlay.classList.add('show');
  updateWalletUi();
  renderInventory();
}

function groundSurfaceYAt(_z: number): number {
  return 0;
}

function corridorHalfWidthAt(z: number): number {
  const t = clamp((z - CONFIG.corridorWidenStartZ) /
    Math.max(1, CONFIG.corridorWidenEndZ - CONFIG.corridorWidenStartZ), 0, 1);
  // Smooth widening keeps the opening gradual instead of feeling like a sudden arena change.
  const eased = t * t * (3 - 2 * t);
  return CONFIG.corridorHalfWidth + (CONFIG.maxCorridorHalfWidth - CONFIG.corridorHalfWidth) * eased;
}

// The camera looks along +Z. Screen-right is therefore world -X.
// Positive yaw means SCREEN-RIGHT, not positive world-X.
type LaunchProfile = {
  speed: number;
  elevationDegrees: number;
  grade: 'PERFECT' | 'GOOD' | 'OK' | 'MISS';
  failure?: 'dud' | 'ground' | 'sky';
};

function launchCenterScore(meter01: number): number {
  return 1 - Math.abs(clamp(meter01, 0, 1) * 2 - 1);
}

function previewLaunchProfile(meter01: number): LaunchProfile {
  const score = launchCenterScore(meter01);
  const perfectWidth = 0.12 * (1 + equippedAbilityTotal('perfectWindow') / 100);
  const perfectThreshold = clamp(1 - perfectWidth, 0.78, 0.88);
  if (score >= perfectThreshold) return { speed: CONFIG.maximumLaunchSpeed, elevationDegrees: CONFIG.perfectLaunchElevationDegrees, grade: 'PERFECT' };
  if (score >= 0.65) {
    const t = (score - 0.65) / 0.23;
    return { speed: 58 + 10 * t, elevationDegrees: CONFIG.goodLaunchElevationDegrees + 1.5 * t, grade: 'GOOD' };
  }
  if (score >= 0.36) {
    const t = (score - 0.36) / 0.29;
    return { speed: 42 + 14 * t, elevationDegrees: CONFIG.okayLaunchElevationDegrees + t, grade: 'OK' };
  }
  return { speed: CONFIG.minimumLaunchSpeed, elevationDegrees: 0, grade: 'MISS' };
}

function resolveLaunchProfile(meter01: number): LaunchProfile {
  const preview = previewLaunchProfile(meter01);
  if (preview.grade !== 'MISS') return preview;
  const failures: LaunchProfile[] = [
    { speed: 18 + Math.random() * 7, elevationDegrees: 4, grade: 'MISS', failure: 'dud' },
    { speed: 40 + Math.random() * 6, elevationDegrees: -14 - Math.random() * 5, grade: 'MISS', failure: 'ground' },
    { speed: 34 + Math.random() * 8, elevationDegrees: 34 + Math.random() * 10, grade: 'MISS', failure: 'sky' },
  ];
  return failures[Math.floor(Math.random() * failures.length)];
}

function launchComponents(speed: number, elevationDegrees: number, yawDegrees: number) {
  const yaw = clamp(yawDegrees, -CONFIG.maximumYawDegrees, CONFIG.maximumYawDegrees) * Math.PI / 180;
  const elevation = elevationDegrees * Math.PI / 180;
  const horizontal = speed * Math.cos(elevation);
  return {
    x: -horizontal * Math.sin(yaw),
    y: speed * Math.sin(elevation),
    z: horizontal * Math.cos(yaw),
  };
}

// Preserve the working Ammo initialization from STEP 02.
function loadPhysics(): Promise<void> {
  return new Promise((resolve, reject) => {
    let completed = false;
    const finish = (error?: Error) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    };

    const timeout = window.setTimeout(() => {
      finish(new Error('物理エンジンの読み込みが時間切れになりました。通信を確認してプレビューを再読み込みしてください。'));
    }, 45000);

    const base = 'https://developer.playcanvas.com/assets/modules/ammo';
    try {
      pc.WasmModule.setConfig('Ammo', {
        glueUrl: `${base}/ammo.wasm.js`,
        wasmUrl: `${base}/ammo.wasm.wasm`,
        fallbackUrl: `${base}/ammo.js`,
        errorHandler: (error: unknown) => {
          finish(new Error(`物理エンジンを読み込めませんでした: ${String(error)}`));
        },
      });
      pc.WasmModule.getInstance('Ammo', (instance: unknown) => {
        if (completed) return;
        if (!instance || typeof instance !== 'object' ||
            !('btVector3' in instance) || typeof instance.btVector3 !== 'function') {
          finish(new Error('物理エンジンの読み込み結果が不正です。プレビューを再読み込みしてください。'));
          return;
        }
        // The standalone Ammo backend reads the initialized global module.
        // Loading WasmModule alone does not guarantee that binding exists.
        (globalThis as typeof globalThis & { Ammo?: unknown }).Ammo = instance;
        finish();
      });
    } catch (error) {
      finish(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

function material(color: pc.Color): pc.StandardMaterial {
  const result = new pc.StandardMaterial();
  result.diffuse = color;
  result.gloss = 24;
  result.update();
  return result;
}


async function start(): Promise<void> {
  await loadPhysics();
  if (disposed) return;

  const app = new pc.Application(canvas, {
    graphicsDeviceOptions: { alpha: false, antialias: true },
  });
  application = app;
  app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  app.setCanvasFillMode(pc.FILLMODE_NONE);
  app.setCanvasResolution(pc.RESOLUTION_AUTO);
  app.maxDeltaTime = 1 / 30;
  app.timeScale = 0;
  app.scene.ambientLight = new pc.Color(0.52, 0.57, 0.65);

  // IMPORTANT: initialize the physics world before adding rigid bodies.
  app.start();
  const physics = app.systems.rigidbody;
  if (!physics || !physics.physicsWorld) {
    throw new Error('物理エンジンを有効化できません。プレビューを再読み込みしてください。');
  }
  physics.gravity.set(0, CONFIG.gravity, 0);

  const camera = new pc.Entity('Camera');
  camera.addComponent('camera', {
    clearColor: new pc.Color(0.88, 0.93, 0.97),
    fov: 52, nearClip: 0.1, farClip: 850,
  });
  app.root.addChild(camera);
  const light = new pc.Entity('DirectionalLight');
  light.addComponent('light', {
    type: 'directional', color: new pc.Color(1, 0.96, 0.9), intensity: 1.25,
    castShadows: true, shadowResolution: 1024, shadowDistance: 65,
    normalOffsetBias: 0.05, shadowBias: 0.15,
  });
  light.setEulerAngles(50, -30, 0);
  app.root.addChild(light);

  const groundMaterial = material(new pc.Color(0.34, 0.43, 0.50));
  const ballMaterial = material(new pc.Color(1, 0.39, 0.13));
  const lineMaterial = material(new pc.Color(0.58, 0.65, 0.69));
  const markerMaterial = material(new pc.Color(0.80, 0.87, 0.89));
  const arrowMaterial = material(new pc.Color(1, 0.56, 0.18));
  arrowMaterial.emissive = new pc.Color(0.25, 0.10, 0.01);
  arrowMaterial.update();

  // Fake player-only shadow: always directly below the player so altitude is easy to read.
  const playerShadowMaterial = material(new pc.Color(0.06, 0.08, 0.10));
  playerShadowMaterial.opacity = 0.34;
  playerShadowMaterial.blendType = pc.BLEND_NORMAL;
  playerShadowMaterial.depthWrite = false;
  playerShadowMaterial.update();

  function box(name: string, size: pc.Vec3, position: pc.Vec3,
               mat: pc.StandardMaterial, parent: pc.Entity = app.root): pc.Entity {
    const item = new pc.Entity(name);
    item.addComponent('render', { type: 'box', material: mat, castShadows: false });
    item.setLocalScale(size);
    item.setLocalPosition(position);
    parent.addChild(item);
    return item;
  }

  // Flat test course. This makes vertical motion easy to judge before terrain returns.
  const ground = new pc.Entity('Ground');
  ground.setPosition(0, -0.5, CONFIG.courseLength * 0.5);
  ground.addComponent('collision', {
    type: 'box',
    halfExtents: new pc.Vec3(CONFIG.courseWidth * 0.5, 0.5, CONFIG.courseLength * 0.5),
  });
  ground.addComponent('rigidbody', {
    type: 'static', friction: 0.9, restitution: CONFIG.groundRestitution,
  });
  box('GroundVisual', new pc.Vec3(CONFIG.courseWidth, 1, CONFIG.courseLength),
    new pc.Vec3(), groundMaterial, ground);
  app.root.addChild(ground);
  const groundEntities = new Set<pc.Entity>([ground]);

  // Milestone homes. The player must hit the visible home target; flying over it continues the run.
  const goalMaterial = material(new pc.Color(1.0, 0.75, 0.12));
  goalMaterial.emissive = new pc.Color(0.28, 0.13, 0.01); goalMaterial.update();
  const homeMaterial = material(new pc.Color(0.92, 0.49, 0.28));
  const doorMaterial = material(new pc.Color(0.24, 0.19, 0.17));
  type MilestoneGoal = { z: number; label: string; halfWidth: number; height: number; reward: number };
  const milestoneGoals: MilestoneGoal[] = [
    { z: 1500, label: 'APARTMENT', halfWidth: 12, height: 18, reward: 200 },
    { z: 3000, label: 'MANSION', halfWidth: 14, height: 23, reward: 300 },
    { z: 5000, label: 'TOWER MANSION', halfWidth: 18, height: 34, reward: 500 },
  ];
  for (const goal of milestoneGoals) {
    const bodyW = goal.halfWidth * 1.7;
    box(`${goal.label}-Body`, new pc.Vec3(bodyW, goal.height, 12), new pc.Vec3(0, goal.height * 0.5, goal.z + 7), homeMaterial);
    box(`${goal.label}-Roof`, new pc.Vec3(bodyW + 3, 2.2, 14), new pc.Vec3(0, goal.height + 1.1, goal.z + 7), goalMaterial);
    box(`${goal.label}-Door`, new pc.Vec3(4.2, 7, 0.6), new pc.Vec3(0, 3.5, goal.z + 0.7), doorMaterial);
    // Bright approach frame communicates the forgiving collision target without becoming an invisible wall.
    box(`${goal.label}-GuideL`, new pc.Vec3(0.45, goal.height, 0.45), new pc.Vec3(-goal.halfWidth, goal.height/2, goal.z), goalMaterial);
    box(`${goal.label}-GuideR`, new pc.Vec3(0.45, goal.height, 0.45), new pc.Vec3(goal.halfWidth, goal.height/2, goal.z), goalMaterial);
    box(`${goal.label}-GuideTop`, new pc.Vec3(goal.halfWidth*2, 0.45, 0.45), new pc.Vec3(0, goal.height, goal.z), goalMaterial);
  }

  // Visible KEEP OUT gates sit just beyond the currently locked goal. They are enabled dynamically.
  const keepOutMaterial = material(new pc.Color(0.88, 0.12, 0.08));
  keepOutMaterial.emissive = new pc.Color(0.20, 0.02, 0.01); keepOutMaterial.update();
  const keepOutLightMaterial = material(new pc.Color(0.95, 0.92, 0.78));
  const keepOutTextCanvas = document.createElement('canvas');
  keepOutTextCanvas.width = 512; keepOutTextCanvas.height = 160;
  const keepCtx = keepOutTextCanvas.getContext('2d');
  if (keepCtx) {
    keepCtx.fillStyle = '#e3261c'; keepCtx.fillRect(0, 0, 512, 160);
    keepCtx.fillStyle = '#fff7dc'; keepCtx.font = '900 82px sans-serif'; keepCtx.textAlign = 'center'; keepCtx.textBaseline = 'middle';
    keepCtx.fillText('KEEP OUT', 256, 80);
  }
  const keepTexture = new pc.Texture(app.graphicsDevice, { width: 512, height: 160, mipmaps: false });
  keepTexture.setSource(keepOutTextCanvas);
  const keepOutTextMaterial = new pc.StandardMaterial();
  keepOutTextMaterial.diffuseMap = keepTexture;
  keepOutTextMaterial.emissiveMap = keepTexture;
  keepOutTextMaterial.emissive = new pc.Color(1, 1, 1);
  keepOutTextMaterial.useLighting = false;
  keepOutTextMaterial.update();
  type KeepOutGate = { goalZ: number; root: pc.Entity };
  const keepOutGates: KeepOutGate[] = [];
  for (const goal of milestoneGoals) {
    const gate = new pc.Entity(`KEEP-OUT-${goal.z}`);
    gate.setPosition(0, 0, goal.z + 36);
    const half = Math.min(corridorHalfWidthAt(goal.z + 36) - 3, 32);
    box('PostL', new pc.Vec3(0.7, 8, 0.7), new pc.Vec3(-half, 4, 0), keepOutMaterial, gate);
    box('PostR', new pc.Vec3(0.7, 8, 0.7), new pc.Vec3(half, 4, 0), keepOutMaterial, gate);
    // Crossed zig-zag KEEP OUT tape: repeated X-shapes are easier to read at speed than one flat stripe.
    const cellCount = 6;
    const cellW = (half * 2) / cellCount;
    const lowY = 4.6;
    const highY = 7.6;
    const diagLength = Math.hypot(cellW, highY - lowY);
    const diagAngle = Math.atan2(highY - lowY, cellW) * 180 / Math.PI;
    for (let i = 0; i < cellCount; i++) {
      const cx = -half + cellW * (i + 0.5);
      const cy = (lowY + highY) * 0.5;
      const a = box(`Tape-XA-${i}`, new pc.Vec3(diagLength, 0.72, 0.35), new pc.Vec3(cx, cy, 0), i % 2 === 0 ? keepOutMaterial : keepOutLightMaterial, gate);
      a.setLocalEulerAngles(0, 0, diagAngle);
      const b = box(`Tape-XB-${i}`, new pc.Vec3(diagLength, 0.72, 0.35), new pc.Vec3(cx, cy, 0.04), i % 2 === 0 ? keepOutLightMaterial : keepOutMaterial, gate);
      b.setLocalEulerAngles(0, 0, -diagAngle);
    }
    // Large backboard makes the boundary readable even before the text can be resolved.
    box('KeepOutBoard', new pc.Vec3(16, 5.0, 0.45), new pc.Vec3(0, 10.5, 0), keepOutTextMaterial, gate);
    app.root.addChild(gate);
    keepOutGates.push({ goalZ: goal.z, root: gate });
  }
  function updateKeepOutGates(): void {
    for (const gate of keepOutGates) gate.root.enabled = gate.goalZ === gameSave.tokyoUnlockedDistance && gameSave.tokyoUnlockedDistance <= 5000;
  }

  function segmentIntersectsGoal(goal: MilestoneGoal, a: pc.Vec3, b: pc.Vec3): boolean {
    // Treat the whole house, including its roof, as the goal target. Expand by player radius for forgiving contact.
    const bodyW = goal.halfWidth * 1.7;
    const minX = -(bodyW * 0.5 + 1.5 + CONFIG.radius);
    const maxX = -minX;
    const minY = -CONFIG.radius;
    const maxY = goal.height + 2.2 + CONFIG.radius;
    const minZ = goal.z - CONFIG.radius;
    const maxZ = goal.z + 14 + CONFIG.radius;
    let t0 = 0, t1 = 1;
    const axes: Array<[number, number, number, number]> = [
      [a.x, b.x - a.x, minX, maxX], [a.y, b.y - a.y, minY, maxY], [a.z, b.z - a.z, minZ, maxZ],
    ];
    for (const [start, delta, min, max] of axes) {
      if (Math.abs(delta) < 1e-8) { if (start < min || start > max) return false; continue; }
      let enter = (min - start) / delta, exit = (max - start) / delta;
      if (enter > exit) [enter, exit] = [exit, enter];
      t0 = Math.max(t0, enter); t1 = Math.min(t1, exit);
      if (t0 > t1) return false;
    }
    return t1 >= 0 && t0 <= 1;
  }

  // City canyon: separate static building blocks replace the old continuous side walls.
  // Their inner facades are intentionally staggered so the player can bank off them.
  const buildingMaterialA = material(new pc.Color(0.20, 0.25, 0.31));
  const buildingMaterialB = material(new pc.Color(0.27, 0.32, 0.38));
  const windowMaterial = material(new pc.Color(0.62, 0.76, 0.82));
  windowMaterial.emissive = new pc.Color(0.08, 0.12, 0.14);
  windowMaterial.update();
  const roofMaterial = material(new pc.Color(0.16, 0.19, 0.23));

  function staticCityBuilding(name: string, centerX: number, z: number, width: number, height: number, depth: number, mat: pc.StandardMaterial): void {
    const e = new pc.Entity(name); e.setPosition(centerX, height * 0.5, z);
    e.addComponent('collision', { type: 'box', halfExtents: new pc.Vec3(width*0.5, height*0.5, depth*0.5) });
    e.addComponent('rigidbody', { type: 'static', friction: 0.025, restitution: CONFIG.buildingRestitution });
    box(`${name}-Visual`, new pc.Vec3(width, height, depth), new pc.Vec3(), mat, e); app.root.addChild(e);
  }

  for (let i = 0; i < BUILDING_LAYOUT.length; i++) {
    const layout = BUILDING_LAYOUT[i];
    const side = layout.side;
    const widen = Math.max(0, corridorHalfWidthAt(layout.z) - CONFIG.corridorHalfWidth);
    const widenedInner = layout.inner + widen * 0.92;
    const centerX = side * (widenedInner + layout.width * 0.5);
    const building = new pc.Entity(`Building-${i + 1}`);
    building.setPosition(centerX, layout.height * 0.5, layout.z);
    building.addComponent('collision', {
      type: 'box',
      halfExtents: new pc.Vec3(layout.width * 0.5, layout.height * 0.5, layout.depth * 0.5),
    });
    building.addComponent('rigidbody', {
      type: 'static', friction: 0.025, restitution: CONFIG.buildingRestitution,
    });
    box('BuildingVisual', new pc.Vec3(layout.width, layout.height, layout.depth),
      new pc.Vec3(), i % 2 === 0 ? buildingMaterialA : buildingMaterialB, building);

    // A slightly visible roof helps the player read building height in 3D.
    box('Roof', new pc.Vec3(layout.width + 0.35, 0.35, layout.depth + 0.35),
      new pc.Vec3(0, layout.height * 0.5 + 0.18, 0), roofMaterial, building);

    // Window bands are visual only; they make the collision blocks read as buildings.
    const facadeX = -side * (layout.width * 0.5 + 0.015);
    for (let wy = -layout.height * 0.30; wy <= layout.height * 0.30; wy += 7) {
      for (let wz = -layout.depth * 0.35; wz <= layout.depth * 0.35; wz += 12) {
        box(`Window-${wy}-${wz}`, new pc.Vec3(0.035, 2.0, 5.0),
          new pc.Vec3(facadeX, wy, wz), windowMaterial, building);
      }
    }
    app.root.addChild(building);
  }

  // STEP29 prototype extension: procedural city blocks keep 1500-5000m readable without art-polish work.
  for (let z = 1600, i = 0; z < 4920; z += 120, i++) {
    for (const side of [-1, 1] as const) {
      const section = z < 3000 ? 1 : 2;
      const inner = section === 1 ? 25 + (i % 3) * 4 : 31 + (i % 4) * 4;
      const width = 13 + ((i + (side > 0 ? 1 : 0)) % 3) * 3;
      const height = section === 1 ? 48 + (i % 4) * 9 : 58 + (i % 5) * 11;
      const centerX = side * (inner + width * 0.5);
      staticCityBuilding(`LongCity-${z}-${side}`, centerX, z, width, height, 105, (i + (side > 0 ? 1 : 0)) % 2 === 0 ? buildingMaterialA : buildingMaterialB);
    }
  }

  // Visual distance grid stays on the flat street between the buildings.
  for (let z = 20; z <= CONFIG.courseLength; z += 20) {
    box(`Z-${z}`, new pc.Vec3(corridorHalfWidthAt(z) * 2, 0.02, 0.09),
      new pc.Vec3(0, groundSurfaceYAt(z) + 0.035, z), lineMaterial);
  }
  for (const x of [-20, 0, 20]) {
    for (let z = 10; z <= CONFIG.courseLength; z += 40) {
      box(`Marker-${x}-${z}`, new pc.Vec3(0.12, 0.03, 18),
        new pc.Vec3(x, groundSurfaceYAt(z) + 0.04, z), markerMaterial);
    }
  }

  // Ring visuals: 16 short bars form a circle in the XY plane. No collider; crossing is swept in game code.
  const ringAvailableMaterial = material(new pc.Color(1.0, 0.72, 0.08));
  ringAvailableMaterial.emissive = new pc.Color(0.35, 0.16, 0.01);
  ringAvailableMaterial.update();
  const ringUsedMaterial = material(new pc.Color(0.42, 0.48, 0.52));
  const rings: RingGate[] = [];
  for (let i = 0; i < RING_LAYOUT.length; i++) {
    const layout = RING_LAYOUT[i];
    const y = groundSurfaceYAt(layout.z) + layout.height;
    const parts: pc.Entity[] = [];
    const segments = 16;
    for (let s = 0; s < segments; s++) {
      const a = s / segments * Math.PI * 2;
      const x = layout.x + Math.cos(a) * CONFIG.ringRadius;
      const py = y + Math.sin(a) * CONFIG.ringRadius;
      const part = box(`Ring-${i + 1}-${s}`,
        new pc.Vec3(CONFIG.ringThickness * 2, CONFIG.ringThickness * 2, 4.0),
        new pc.Vec3(x, py, layout.z), ringAvailableMaterial);
      parts.push(part);
    }
    rings.push({ id: i + 1, x: layout.x, y, z: layout.z, radius: CONFIG.ringRadius, used: false, parts, effectTime: -1 });
  }

  // Coins double as route guidance. Main trails interpolate between ring centers, with small reachable side detours.
  const coinMaterial = material(new pc.Color(1.0, 0.82, 0.12));
  coinMaterial.emissive = new pc.Color(0.42, 0.22, 0.01);
  coinMaterial.update();
  const coins: CoinPickup[] = [];
  let nextCoinId = 1;
  function addCoin(x: number, y: number, z: number, value = CONFIG.coinValue): void {
    const entity = new pc.Entity(`Coin-${nextCoinId}`);
    entity.addComponent('render', { type: 'cylinder', material: coinMaterial, castShadows: false });
    entity.setLocalScale(CONFIG.coinRadius * 1.5, 0.16, CONFIG.coinRadius * 1.5);
    entity.setEulerAngles(90, 0, 0);
    entity.setPosition(x, y, z);
    app.root.addChild(entity);
    coins.push({ id: nextCoinId++, position: new pc.Vec3(x, y, z), entity, collected: false, value, spinDegrees: 0, pickupEffectTime: -1 });
  }

  const routePoints = [
    { x: 0, y: 6.5, z: 35 },
    ...rings.map((ring) => ({ x: ring.x, y: ring.y, z: ring.z })),
    { x: 0, y: 8, z: CONFIG.goalZ },
  ];
  for (let i = 0; i < routePoints.length - 1; i++) {
    const a = routePoints[i];
    const b = routePoints[i + 1];
    const count = i == 0 ? 7 : 6;
    for (let j = 1; j <= count; j++) {
      const t = j / (count + 1);
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const z = a.z + (b.z - a.z) * t;
      addCoin(x, y, z);
    }
  }
  // Reachable bonus arcs: slightly off the main line, never outside the existing corridor.
  const bonusOffsets = [
    { ring: 1, side: 1, dx: 7, dy: 2.0 },
    { ring: 2, side: -1, dx: 8, dy: -1.5 },
    { ring: 3, side: 1, dx: 7, dy: 2.5 },
    { ring: 4, side: -1, dx: 6, dy: -2.0 },
    { ring: 5, side: 1, dx: 7, dy: 2.0 },
  ];
  for (const bonus of bonusOffsets) {
    const ring = rings[bonus.ring];
    if (!ring) continue;
    for (let j = 1; j <= 3; j++) {
      const t = j / 4;
      addCoin(
        clamp(ring.x + bonus.side * bonus.dx * t, -corridorHalfWidthAt(ring.z) + 4, corridorHalfWidthAt(ring.z) - 4),
        Math.max(2.5, ring.y + bonus.dy * Math.sin(t * Math.PI)),
        ring.z + 12 + j * 9,
        1,
      );
    }
  }

  // Soft alternate-route guides. These do not replace the main ring line; they hint that the widened city can be explored.
  function addCoinTrail(points: { x: number; y: number; z: number }[], coinsPerSegment = 5): void {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      for (let j = 1; j <= coinsPerSegment; j++) {
        const t = j / (coinsPerSegment + 1);
        addCoin(
          a.x + (b.x - a.x) * t,
          a.y + (b.y - a.y) * t,
          a.z + (b.z - a.z) * t,
        );
      }
    }
  }

  // Rooftop route: climb over low buildings on the right.
  addCoinTrail([
    { x: 10, y: 11, z: 820 },
    { x: 35, y: 13, z: 965 },
    { x: 43, y: 15, z: 1075 },
    { x: 20, y: 14, z: 1160 },
  ], 5);
  // Fountain route: visible from the main line, then a strong water boost reconnects at high altitude.
  addCoinTrail([
    { x: -8, y: 9, z: 900 },
    { x: -24, y: 8, z: 1030 },
    { x: -28, y: 10, z: 1080 },
    { x: -30, y: 24, z: 1140 },
    { x: -20, y: 23, z: 1220 },
  ], 5);
  // Landmark route: a readable line through the tower legs before returning to the final ring path.
  addCoinTrail([
    { x: 0, y: 14, z: 1160 },
    { x: 42, y: 11, z: 1285 },
    { x: 48, y: 16, z: 1350 },
    { x: 10, y: 13, z: 1430 },
  ], 6);

  function routePositionAtZ(z: number): pc.Vec3 {
    if (z <= routePoints[0].z) return new pc.Vec3(routePoints[0].x, routePoints[0].y, z);
    for (let i = 0; i < routePoints.length - 1; i++) {
      const a = routePoints[i];
      const b = routePoints[i + 1];
      if (z > b.z) continue;
      const t = clamp((z - a.z) / Math.max(0.001, b.z - a.z), 0, 1);
      return new pc.Vec3(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t,
        z,
      );
    }
    const last = routePoints[routePoints.length - 1];
    return new pc.Vec3(last.x, last.y, z);
  }

  // Rival salarymen are visual/gameplay guides. They fly the same intended route and can bump the player,
  // but contact never removes forward speed.
  const rivalSuitMaterials = [
    material(new pc.Color(0.16, 0.27, 0.46)),
    material(new pc.Color(0.34, 0.22, 0.42)),
    material(new pc.Color(0.20, 0.38, 0.31)),
  ];
  const rivalSkinMaterial = material(new pc.Color(0.94, 0.72, 0.56));
  const rivals: RivalRunner[] = [];
  const rivalSpecs = [
    { z: 28, speed: 53, lateral: -2.4, phase: 0.2 },
    { z: 46, speed: 58, lateral: 2.7, phase: 2.1 },
    { z: 68, speed: 61, lateral: -0.5, phase: 4.2 },
  ];
  for (let i = 0; i < rivalSpecs.length; i++) {
    const spec = rivalSpecs[i];
    const rootRival = new pc.Entity(`Rival-${i + 1}`);
    const torso = box('Torso', new pc.Vec3(0.95, 1.45, 0.55), new pc.Vec3(0, 0, 0), rivalSuitMaterials[i], rootRival);
    torso.setLocalEulerAngles(8, 0, 0);
    const head = new pc.Entity('Head');
    head.addComponent('render', { type: 'sphere', material: rivalSkinMaterial, castShadows: false });
    head.setLocalScale(0.62, 0.62, 0.62);
    head.setLocalPosition(0, 1.02, 0.02);
    rootRival.addChild(head);
    box('LegL', new pc.Vec3(0.26, 0.85, 0.28), new pc.Vec3(-0.23, -1.0, 0.05), rivalSuitMaterials[i], rootRival);
    box('LegR', new pc.Vec3(0.26, 0.85, 0.28), new pc.Vec3(0.23, -1.0, 0.05), rivalSuitMaterials[i], rootRival);
    box('ArmL', new pc.Vec3(0.22, 1.0, 0.24), new pc.Vec3(-0.62, 0.05, 0), rivalSuitMaterials[i], rootRival);
    box('ArmR', new pc.Vec3(0.22, 1.0, 0.24), new pc.Vec3(0.62, 0.05, 0), rivalSuitMaterials[i], rootRival);
    rootRival.setLocalScale(0.9, 0.9, 0.9);
    app.root.addChild(rootRival);
    rivals.push({
      id: i + 1, entity: rootRival, z: spec.z, speed: spec.speed, lateralOffset: spec.lateral,
      phase: spec.phase, bumpOffset: 0, bumpVelocity: 0, collisionCooldown: 0,
    });
  }

  // Breakable signs now look placed in the city rather than floating on one gameplay plane.
  // Wall signs sit near building facades, rooftop signs sit high, and ground signs have visible posts.
  // They are still game-side hit tests so smashing them never reduces forward speed.
  const signMaterial = material(new pc.Color(0.95, 0.30, 0.12));
  signMaterial.emissive = new pc.Color(0.18, 0.035, 0.01);
  signMaterial.update();
  const signAltMaterial = material(new pc.Color(0.16, 0.65, 0.88));
  signAltMaterial.emissive = new pc.Color(0.02, 0.12, 0.18);
  signAltMaterial.update();
  const signPostMaterial = material(new pc.Color(0.72, 0.76, 0.78));
  const breakables: BreakableProp[] = [];
  const breakableSpecs = [
    { kind: 'wallVertical', x: 24.0, y: 13.0, z: 190 },
    { kind: 'wallRound',    x: -22.5, y: 20.0, z: 335 },
    { kind: 'groundTall',   x: 8.0, y: 4.6, z: 455 },
    { kind: 'roofWide',     x: -20.0, y: 28.0, z: 585 },
    { kind: 'wallWide',     x: 21.5, y: 9.0, z: 705 },
    { kind: 'groundRound',  x: -8.0, y: 3.4, z: 845 },
    { kind: 'wallVertical', x: 23.0, y: 23.0, z: 1000 },
    { kind: 'groundTall',   x: 6.0, y: 5.0, z: 1165 },
    { kind: 'wallRound',    x: -22.0, y: 15.0, z: 1325 },
    { kind: 'roofWide',     x: 20.0, y: 31.0, z: 1460 },
  ] as const;

  for (let i = 0; i < breakableSpecs.length; i++) {
    const spec = breakableSpecs[i];
    const rootProp = new pc.Entity(`BreakableSign-${i + 1}`);
    const groundMounted = spec.kind === 'groundTall' || spec.kind === 'groundRound';
    const scaledY = groundMounted ? spec.y + 3.8 : spec.y;
    rootProp.setPosition(spec.x, scaledY, spec.z);
    rootProp.setLocalScale(2.0, 2.0, 2.0);
    app.root.addChild(rootProp);
    const pieces: BreakPiece[] = [];
    const addPiece = (name: string, size: pc.Vec3, home: pc.Vec3, mat: pc.StandardMaterial, euler?: pc.Vec3) => {
      const e = box(name, size, home.clone(), mat, rootProp);
      if (euler) e.setLocalEulerAngles(euler);
      pieces.push({ entity: e, home: home.clone(), velocity: new pc.Vec3(), spin: new pc.Vec3() });
    };
    const panelMat = i % 2 === 0 ? signMaterial : signAltMaterial;
    if (spec.kind === 'wallVertical') {
      addPiece('PanelTop', new pc.Vec3(2.2, 3.0, 0.28), new pc.Vec3(0, 1.5, 0), panelMat);
      addPiece('PanelBottom', new pc.Vec3(2.2, 3.0, 0.28), new pc.Vec3(0, -1.5, 0), panelMat);
      addPiece('WallArm', new pc.Vec3(2.0, 0.22, 0.22), new pc.Vec3(spec.x > 0 ? 1.0 : -1.0, 0, 0), signPostMaterial);
    } else if (spec.kind === 'wallWide' || spec.kind === 'roofWide') {
      addPiece('PanelLeft', new pc.Vec3(3.0, 2.0, 0.28), new pc.Vec3(-1.5, 0.7, 0), panelMat);
      addPiece('PanelRight', new pc.Vec3(3.0, 2.0, 0.28), new pc.Vec3(1.5, 0.7, 0), panelMat);
      addPiece('BraceLeft', new pc.Vec3(0.18, 2.4, 0.18), new pc.Vec3(-1.8, -1.5, 0), signPostMaterial);
      addPiece('BraceRight', new pc.Vec3(0.18, 2.4, 0.18), new pc.Vec3(1.8, -1.5, 0), signPostMaterial);
    } else if (spec.kind === 'wallRound' || spec.kind === 'groundRound') {
      const segments = 8;
      for (let s = 0; s < segments; s++) {
        const a = s / segments * Math.PI * 2;
        addPiece(`Round-${s}`, new pc.Vec3(1.35, 0.65, 0.28),
          new pc.Vec3(Math.cos(a) * 1.7, Math.sin(a) * 1.7 + 0.7, 0), panelMat,
          new pc.Vec3(0, 0, a * 180 / Math.PI + 90));
      }
      addPiece('RoundPost', new pc.Vec3(0.22, 3.3, 0.22), new pc.Vec3(0, -1.8, 0), signPostMaterial);
    } else {
      addPiece('TallTop', new pc.Vec3(2.4, 2.6, 0.28), new pc.Vec3(0, 1.6, 0), panelMat);
      addPiece('TallBottom', new pc.Vec3(2.4, 2.6, 0.28), new pc.Vec3(0, -1.0, 0), panelMat);
      addPiece('GroundPost', new pc.Vec3(0.24, 3.0, 0.24), new pc.Vec3(0, -3.7, 0), signPostMaterial);
    }
    breakables.push({
      id: i + 1, x: spec.x, y: scaledY, z: spec.z, root: rootProp, pieces, broken: false, effectTime: -1, value: CONFIG.breakableCoinBonus,
    });
  }

  // Broad-area route landmarks. Their purpose is to make the widening stage readable rather than merely empty.
  const landmarkOrange = material(new pc.Color(0.92, 0.24, 0.10));
  landmarkOrange.emissive = new pc.Color(0.09, 0.015, 0.005);
  landmarkOrange.update();
  const fountainWater = material(new pc.Color(0.32, 0.72, 0.96));
  fountainWater.opacity = 0.50;
  fountainWater.blendType = pc.BLEND_NORMAL;
  fountainWater.depthWrite = false;
  fountainWater.emissive = new pc.Color(0.04, 0.13, 0.18);
  fountainWater.update();
  const fountainStone = material(new pc.Color(0.58, 0.62, 0.64));

  function staticLandmarkBox(name: string, size: pc.Vec3, position: pc.Vec3, mat: pc.StandardMaterial, restitution = 0.35): pc.Entity {
    const e = new pc.Entity(name);
    e.setPosition(position);
    e.addComponent('collision', { type: 'box', halfExtents: new pc.Vec3(size.x * 0.5, size.y * 0.5, size.z * 0.5) });
    e.addComponent('rigidbody', { type: 'static', friction: 0.05, restitution });
    box(`${name}-Visual`, size, new pc.Vec3(), mat, e);
    app.root.addChild(e);
    return e;
  }

  // Low buildings create an over-the-rooftop route instead of another wall corridor.
  staticLandmarkBox('LowBuilding-A', new pc.Vec3(22, 8, 28), new pc.Vec3(35, 4, 965), buildingMaterialB, 0.6);
  staticLandmarkBox('LowBuilding-B', new pc.Vec3(24, 10, 30), new pc.Vec3(43, 5, 1075), buildingMaterialA, 0.6);
  staticLandmarkBox('LowBuilding-C', new pc.Vec3(20, 7, 24), new pc.Vec3(-48, 3.5, 1360), buildingMaterialB, 0.6);
  box('LowBuilding-A-RoofSign', new pc.Vec3(12, 4.5, 0.6), new pc.Vec3(35, 11.0, 965), signMaterial);
  box('LowBuilding-B-RoofSign', new pc.Vec3(10, 5.0, 0.6), new pc.Vec3(43, 13.0, 1075), signAltMaterial);
  box('LowBuilding-C-RoofSign', new pc.Vec3(11, 4.0, 0.6), new pc.Vec3(-48, 9.5, 1360), signMaterial);

  // Tokyo-Tower-like landmark: four physical legs with a large central gap players can thread through.
  const towerX = 42;
  const towerZ = 1285;
  const towerLegOffsets = [
    [-6.5, -5.0], [6.5, -5.0], [-4.0, 5.0], [4.0, 5.0],
  ] as const;
  for (let i = 0; i < towerLegOffsets.length; i++) {
    const [ox, oz] = towerLegOffsets[i];
    const leg = staticLandmarkBox(`TowerLeg-${i + 1}`, new pc.Vec3(2.2, 30, 2.2),
      new pc.Vec3(towerX + ox, 15, towerZ + oz), landmarkOrange, 0.8);
    leg.setEulerAngles(0, 0, ox < 0 ? -8 : 8);
  }
  box('TowerDeck', new pc.Vec3(17, 1.2, 12), new pc.Vec3(towerX, 20, towerZ), landmarkOrange);
  box('TowerTop', new pc.Vec3(1.6, 20, 1.6), new pc.Vec3(towerX, 35, towerZ), landmarkOrange);
  box('TowerCrossbarLow', new pc.Vec3(15, 0.8, 1.0), new pc.Vec3(towerX, 9, towerZ), landmarkOrange);

  type FountainZone = { x: number; z: number; radius: number; maxY: number; pushY: number };
  const fountains: FountainZone[] = [{ x: -28, z: 1080, radius: 11.5, maxY: 27, pushY: 24 }, { x: -34, z: 3420, radius: 15, maxY: 46, pushY: 34 }];
  for (const fountain of fountains) {
    const basin = new pc.Entity('FountainBasin');
    basin.addComponent('render', { type: 'cylinder', material: fountainStone, castShadows: false });
    basin.setLocalScale(fountain.radius * 2.2, 0.7, fountain.radius * 2.2);
    basin.setPosition(fountain.x, 0.35, fountain.z);
    app.root.addChild(basin);
    const water = new pc.Entity('FountainWater');
    water.addComponent('render', { type: 'cylinder', material: fountainWater, castShadows: false });
    water.setLocalScale(fountain.radius * 1.15, fountain.maxY, fountain.radius * 1.15);
    water.setPosition(fountain.x, fountain.maxY * 0.5, fountain.z);
    app.root.addChild(water);
  }

  // 3000-5000m prototype challenge: fountain launches the player above a tall wall; side gaps remain recovery routes.
  staticLandmarkBox('FountainChallengeWall', new pc.Vec3(70, 44, 8), new pc.Vec3(0, 22, 3560), buildingMaterialA, 0.55);
  addCoinTrail([
    { x: -20, y: 12, z: 3260 }, { x: -34, y: 10, z: 3420 }, { x: -30, y: 42, z: 3580 },
    { x: 8, y: 38, z: 3820 }, { x: 28, y: 43, z: 4100 }, { x: 0, y: 28, z: 4860 },
  ], 6);

  // Moving obstacles cross the route from left to right. Their windows are the rewarding weak points.
  // Missing a window can knock the player sideways/upward, but never removes forward speed.
  const vehicleBodyMaterial = material(new pc.Color(0.16, 0.30, 0.46));
  const trainBodyMaterial = material(new pc.Color(0.62, 0.18, 0.15));
  const planeBodyMaterial = material(new pc.Color(0.78, 0.82, 0.86));
  const monorailBodyMaterial = material(new pc.Color(0.88, 0.89, 0.92));
  const windowMaterialMoving = material(new pc.Color(0.38, 0.78, 0.96));
  windowMaterialMoving.emissive = new pc.Color(0.06, 0.20, 0.28);
  windowMaterialMoving.update();
  const movingObstacles: MovingObstacle[] = [];

  function createMovingObstacle(kind: 'car' | 'train' | 'plane' | 'monorail', z: number, y: number, phaseValue: number, speed: number): void {
    const rootMoving = new pc.Entity(`${kind}-${movingObstacles.length + 1}`);
    app.root.addChild(rootMoving);
    const windows: MovingWindow[] = [];
    const addWindow = (name: string, local: pc.Vec3, size: pc.Vec3) => {
      const e = box(name, size, local.clone(), windowMaterialMoving, rootMoving);
      windows.push({ entity: e, local: local.clone(), broken: false, effectTime: -1, velocity: new pc.Vec3(), spin: new pc.Vec3() });
    };
    let halfWidth = 7.0;
    let halfHeight = 2.8;
    let travel = corridorHalfWidthAt(z) + 18;
    if (kind === 'car') {
      // Cars are pure ground obstacles now: no smash-through windows.
      box('CarBody', new pc.Vec3(7.0, 1.7, 3.2), new pc.Vec3(0, 0, 0), vehicleBodyMaterial, rootMoving);
      box('CarRoof', new pc.Vec3(4.2, 1.0, 2.7), new pc.Vec3(0, 1.15, 0), vehicleBodyMaterial, rootMoving);
      rootMoving.setLocalScale(2.0, 2.0, 2.0);
      halfWidth = 7.0;
      halfHeight = 3.6;
      travel = corridorHalfWidthAt(z) + 22;
    } else if (kind === 'train') {
      box('TrainBody', new pc.Vec3(18, 4.2, 3.5), new pc.Vec3(0, 0, 0), trainBodyMaterial, rootMoving);
      for (let i = -3; i <= 3; i++) addWindow(`TrainWindow-${i}`, new pc.Vec3(i * 2.1, 0.6, -1.82), new pc.Vec3(2.5, 1.75, 0.18));
      rootMoving.setLocalScale(2.0, 2.0, 2.0);
      halfWidth = 18;
      halfHeight = 4.6;
      travel = corridorHalfWidthAt(z) + 30;
    } else if (kind === 'monorail') {
      box('MonorailBody', new pc.Vec3(18, 4.0, 3.8), new pc.Vec3(0, 0, 0), monorailBodyMaterial, rootMoving);
      box('MonorailLower', new pc.Vec3(16, 1.0, 2.6), new pc.Vec3(0, -2.0, 0), trainBodyMaterial, rootMoving);
      for (let i = -3; i <= 3; i++) addWindow(`MonorailWindow-${i}`, new pc.Vec3(i * 2.1, 0.55, -1.97), new pc.Vec3(2.6, 1.85, 0.18));
      rootMoving.setLocalScale(2.0, 2.0, 2.0);
      halfWidth = 18;
      halfHeight = 4.8;
      travel = corridorHalfWidthAt(z) + 30;
    } else {
      box('PlaneBody', new pc.Vec3(15, 3.0, 4.0), new pc.Vec3(0, 0, 0), planeBodyMaterial, rootMoving);
      box('Wing', new pc.Vec3(24, 0.45, 3.0), new pc.Vec3(0, -0.3, 0), planeBodyMaterial, rootMoving);
      box('Tail', new pc.Vec3(4.0, 3.2, 1.2), new pc.Vec3(-6.0, 1.8, 0), planeBodyMaterial, rootMoving);
      for (let i = -3; i <= 3; i++) addWindow(`PlaneWindow-${i}`, new pc.Vec3(i * 1.65, 0.45, -2.08), new pc.Vec3(1.8, 1.3, 0.16));
      rootMoving.setLocalScale(3.0, 3.0, 3.0);
      halfWidth = 22.5;
      halfHeight = 5.4;
      travel = corridorHalfWidthAt(z) + 48;
    }
    const obstacle: MovingObstacle = {
      id: movingObstacles.length + 1, kind, root: rootMoving, z, y, halfWidth, halfHeight, travel, speed, phase: phaseValue, windows, collisionCooldown: 0,
    };
    movingObstacles.push(obstacle);
    // Place it at its actual route position immediately. Without this, timeScale=0 leaves new vehicles at world origin and hides the launch arrow.
    const initialRaw = ((phaseValue % 2) + 2) % 2;
    const initialPingPong = initialRaw <= 1 ? initialRaw : 2 - initialRaw;
    if (kind === 'plane') {
      const t = ((phaseValue % 1) + 1) % 1;
      rootMoving.setPosition(-travel + t * travel * 2, y + t * 38, z + t * 22);
    } else {
      rootMoving.setPosition(-travel + initialPingPong * travel * 2, y, z);
    }
  }

  // Elevated monorail guideways make the high train readable before the vehicle crosses.
  box('MonorailGuide-A', new pc.Vec3(corridorHalfWidthAt(1210) * 2 + 24, 0.8, 1.4), new pc.Vec3(0, 11.0, 1210), signPostMaterial);
  box('MonorailGuide-B', new pc.Vec3(corridorHalfWidthAt(1440) * 2 + 24, 0.8, 1.4), new pc.Vec3(0, 14.0, 1440), signPostMaterial);

  createMovingObstacle('plane',    1015, 18.0, 0.10, 0.20);
  createMovingObstacle('car',      1100, 2.9,  0.55, 0.38);
  createMovingObstacle('monorail', 1210, 14.2, 0.18, 0.22);
  createMovingObstacle('train',    1310, 4.7,  0.25, 0.22);
  createMovingObstacle('plane',    1410, 22.0, 0.62, 0.21);
  createMovingObstacle('monorail', 1440, 17.2, 0.74, 0.25);
  createMovingObstacle('car',      1500, 2.9,  0.05, 0.42);

  const origin = new pc.Vec3(0, groundSurfaceYAt(0) + CONFIG.radius + CONFIG.launchClearance, 0);
  const ball = new pc.Entity('Player');
  ball.setPosition(origin);
  ball.addComponent('collision', { type: 'sphere', radius: CONFIG.radius });
  ball.addComponent('rigidbody', {
    type: 'dynamic', mass: 1, friction: 0.5,
    restitution: CONFIG.ballRestitution, linearDamping: CONFIG.linearDamping,
    angularDamping: CONFIG.angularDamping,
  });
  const visual = new pc.Entity('PlayerVisual');
  // Disable the physical light shadow. We use a gameplay shadow directly below instead.
  visual.addComponent('render', { type: 'sphere', material: ballMaterial, castShadows: false });
  visual.setLocalScale(CONFIG.radius * 2, CONFIG.radius * 2, CONFIG.radius * 2);
  ball.addChild(visual);
  app.root.addChild(ball);

  const playerShadow = new pc.Entity('PlayerGroundShadow');
  playerShadow.addComponent('render', {
    type: 'cylinder', material: playerShadowMaterial, castShadows: false, receiveShadows: false,
  });
  playerShadow.setPosition(origin.x, 0.035, origin.z);
  playerShadow.setLocalScale(1.45, 0.025, 1.45);
  app.root.addChild(playerShadow);

  const body = ball.rigidbody;
  const collision = ball.collision;
  if (!body || !collision || !body.body || !ground.rigidbody?.body) {
    throw new Error('球体または地面の物理設定に失敗しました。');
  }
  // Optional Ammo CCD protects against tunnelling on fast launches.
  const ammoBody = body.body as {
    setCcdMotionThreshold?: (value: number) => void;
    setCcdSweptSphereRadius?: (value: number) => void;
  };
  ammoBody.setCcdMotionThreshold?.(CONFIG.radius * 0.5);
  ammoBody.setCcdSweptSphereRadius?.(CONFIG.radius * 0.8);

  // Ground arrow indicates heading only; it is not a landing prediction.
  const arrow = new pc.Entity('LaunchArrow');
  arrow.setPosition(0, 0.06, 0);
  box('ArrowShaft', new pc.Vec3(0.18, 0.04, 4.5), new pc.Vec3(0, 0, 3.0), arrowMaterial, arrow);
  const left = box('ArrowLeft', new pc.Vec3(0.18, 0.04, 1.5), new pc.Vec3(-0.46, 0, 5.0), arrowMaterial, arrow);
  left.setLocalEulerAngles(0, 40, 0);
  const right = box('ArrowRight', new pc.Vec3(0.18, 0.04, 1.5), new pc.Vec3(0.46, 0, 5.0), arrowMaterial, arrow);
  right.setLocalEulerAngles(0, -40, 0);
  app.root.addChild(arrow);

  let phase: Phase = 'loading';
  let drag: Drag | null = null;
  let airDrag: AirDrag | null = null;
  let airInputX = 0;           // Screen axis: right is positive.
  let touchingGround = false;
  let hitCount = 0;
  let playCoins = 0;
  let airCoinValue = 0;
  let ringCoinValue = 0;
  let finalDistanceBonus = 0;
  let finalGoalBonus = 0;
  let resultShown = false;
  let resultDropRolled = false;
  let pendingStageUnlockFinish: (() => void) | null = null;
  let techniqueSigns = 0;
  let techniqueWindows = 0;
  let techniqueFountains = 0;
  let techniqueTower = 0;
  let towerPassRegistered = false;
  const activeFountainZones = new Set<number>();
  let keyboardLaunchHeld = false;
  let keyboardAimPreviousTime = performance.now();
  let jetAvailable = true;
  let jetActiveSeconds = 0;
  let perfectDashSeconds = 0;
  let perfectDashBaseHorizontal = 0;
  let perfectDashDecayPerSecond = 0;
  const pressedKeys = new Set<string>();
  const velocityBuffer = new pc.Vec3();
  let swingMeter = 0.5;
  let swingStartedAt = 0;
  let yaw = 0;
  let distance = 0;
  let touchedGround = false;
  let stillTime = 0;
  let elapsed = 0;
  let fountainFeedbackCooldown = 0;
  let uiElapsed = 0;
  let fuelSeconds = CONFIG.launchFuelSeconds;
  const cameraAnchor = origin.clone();
  const previousPosition = origin.clone();
  const listeners = new AbortController();
  const eventOptions = { signal: listeners.signal };

  const percent = (id: AbilityId) => 1 + equippedAbilityTotal(id) / 100;
  const effectiveLaunchFuel = () => CONFIG.launchFuelSeconds * percent('fuelCapacity');
  const effectiveRingFuel = () => CONFIG.ringFuelSeconds * percent('fuelCapacity') * percent('ringFuelRecovery');
  const effectiveJetFuel = () => CONFIG.jetFuelSeconds * percent('jetFuel');
  const effectiveCoinPickupRadius = () => CONFIG.coinPickupRadius * percent('coinMagnet');
  const effectiveGroundDeceleration = () => CONFIG.groundSlideDeceleration / percent('groundGlide');

  function setPhase(next: Phase): void {
    phase = next;
    root!.dataset.phase = next;
  }

  function updateCamera(dt: number, snap = false): void {
    const position = ball.getPosition();
    const alpha = snap ? 1 : 1 - Math.exp(-10 * dt);
    cameraAnchor.lerp(cameraAnchor, position, alpha);
    camera.setPosition(cameraAnchor.x, cameraAnchor.y + 9, cameraAnchor.z - 19);
    camera.lookAt(cameraAnchor.x, cameraAnchor.y - 1, cameraAnchor.z + 9);
  }

  function updateAimReadouts(): void {
    const profile = previewLaunchProfile(swingMeter);
    powerText.textContent = profile.grade;
    powerFill.style.left = `${swingMeter * 100}%`;
    root!.dataset.launchGrade = profile.grade.toLowerCase();
    const angle = Math.round(Math.abs(yaw));
    directionText.textContent = angle < 1 ? '正面' : `${yaw > 0 ? '右' : '左'} ${angle}°`;
    arrow.setEulerAngles(0, -yaw, 0);
    arrow.setLocalScale(1, 1, 1);
  }

  function updateSwingMeter(): void {
    if (phase !== 'aiming') return;
    const elapsedSeconds = Math.max(0, performance.now() - swingStartedAt) / 1000;
    const cycle = (elapsedSeconds % CONFIG.swingPeriodSeconds) / CONFIG.swingPeriodSeconds;
    swingMeter = cycle < 0.5 ? cycle * 2 : (1 - cycle) * 2;
    updateAimReadouts();
  }

  function releasePointer(): void {
    const id = drag?.id ?? airDrag?.id;
    // Clear BEFORE releasing capture: lostpointercapture can fire synchronously.
    drag = null;
    airDrag = null;
    airInputX = 0;
    if (id !== undefined && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }

  function cancelAim(): void {
    keyboardLaunchHeld = false;
    releasePointer();
    pressedKeys.clear();
    if (phase !== 'aiming') return;
    setPhase('ready');
    swingMeter = 0.5;
    yaw = 0;
    updateAimReadouts();
    stateText.textContent = '待機中';
    message.textContent = '左右に引いて方向を決め、メーターが中央で離すと高速発射です。';
  }

  const hudScreen = new pc.Vec3();

  function playerScreenPosition(yOffset = 0): { x: number; y: number } | null {
    if (!camera.camera) return null;
    const p = ball.getPosition().clone();
    p.y += yOffset;
    camera.camera.worldToScreen(p, hudScreen);
    const rect = canvas.getBoundingClientRect();
    // PlayCanvas worldToScreen() already returns canvas CSS-pixel coordinates.
    // Do not rescale by graphicsDevice size (which includes devicePixelRatio),
    // otherwise Chromium moves the HUD toward the top-left on HiDPI displays.
    return {
      x: rect.left + hudScreen.x,
      y: rect.top + hudScreen.y,
    };
  }

  function updatePlayerHud(): void {
    const visible = phase === 'flying' && !resultShown;
    playerHud.style.display = visible ? 'block' : 'none';
    if (!visible) return;
    // Center the ring on the player, but keep the ring interior fully transparent.
    const screen = playerScreenPosition(0.1);
    if (!screen) return;
    playerHud.style.left = `${screen.x}px`;
    playerHud.style.top = `${screen.y}px`;
    const fuelRatio = clamp(fuelSeconds / effectiveRingFuel(), 0, 1);
    playerFuelRing.style.setProperty('--fuel', `${fuelRatio * 360}deg`);
    playerJetText.textContent = jetAvailable ? 'JET ×1' : 'JET ×0';
    jetButton.disabled = !jetAvailable || touchingGround;
    jetButton.innerHTML = `JET <span>×${jetAvailable ? 1 : 0}</span>`;
  }

  function updatePlayerShadow(): void {
    const p = ball.getPosition();
    const clearance = Math.max(0, p.y - CONFIG.radius - groundSurfaceYAt(p.z));
    // Directly below the player. A slightly larger shadow at altitude makes height easier to judge.
    const scale = 1.25 + Math.min(clearance, 24) * 0.045;
    playerShadow.setPosition(p.x, groundSurfaceYAt(p.z) + 0.035, p.z);
    playerShadow.setLocalScale(scale, 0.025, scale);
    playerShadow.enabled = phase === 'flying' || phase === 'aiming' || phase === 'ready';
  }

  function showPickupFeedback(text: string, kind: 'coin' | 'ring' | 'breakable' | 'rival' | 'obstacle'): void {
    // Feedback appears immediately above the player-centered HUD so collection is unmistakable.
    const screen = playerScreenPosition(kind === 'ring' ? 0.9 : kind === 'breakable' ? 0.75 : 0.65);
    if (!screen) return;
    const node = document.createElement('div');
    node.className = `pickup-pop ${kind}`;
    node.textContent = text;
    node.style.left = `${screen.x}px`;
    node.style.top = `${screen.y}px`;
    feedbackLayer.appendChild(node);
    window.setTimeout(() => node.remove(), 720);
  }

  // Rewarded-ad integration point for a later AdMob/Web rewarded implementation.
  // Call this ONLY after the ad SDK reports a completed rewarded view.
  function applyRewardedCoinDouble(): void {
    if (!resultShown) return;
    const base = airCoinValue + ringCoinValue + finalDistanceBonus + finalGoalBonus;
    resultTotal.textContent = String(base * 2);
    rewardDoubleButton.disabled = true;
    rewardDoubleButton.textContent = '2倍ボーナス適用済み';
  }
  void applyRewardedCoinDouble;

  function reset(): void {
    releasePointer();
    pressedKeys.clear();
    touchingGround = false;
    hitCount = 0;
    playCoins = 0;
    airCoinValue = 0;
    ringCoinValue = 0;
    finalDistanceBonus = 0;
    finalGoalBonus = 0;
    resultShown = false;
    resultDropRolled = false;
    techniqueSigns = techniqueWindows = techniqueFountains = techniqueTower = 0;
    towerPassRegistered = false;
    activeFountainZones.clear();
    keyboardLaunchHeld = false;
    dropResult.textContent = '';
    dropRollButton.disabled = false;
    coinCountText.textContent = '0';
    for (const coin of coins) {
      coin.collected = false;
      coin.spinDegrees = 0;
      coin.pickupEffectTime = -1;
      coin.entity.enabled = true;
      coin.entity.setLocalScale(CONFIG.coinRadius * 1.5, 0.16, CONFIG.coinRadius * 1.5);
      coin.entity.setEulerAngles(90, 0, 0);
    }
    for (const ring of rings) {
      ring.used = false;
      ring.effectTime = -1;
      for (let i = 0; i < ring.parts.length; i++) {
        const part = ring.parts[i];
        const a = i / ring.parts.length * Math.PI * 2;
        part.enabled = true;
        part.setPosition(
          ring.x + Math.cos(a) * ring.radius,
          ring.y + Math.sin(a) * ring.radius,
          ring.z,
        );
        part.setLocalScale(CONFIG.ringThickness * 2, CONFIG.ringThickness * 2, 4.0);
        if (part.render) part.render.material = ringAvailableMaterial;
      }
    }
    for (let i = 0; i < rivals.length; i++) {
      const spec = rivalSpecs[i];
      const rival = rivals[i];
      rival.z = spec.z;
      rival.bumpOffset = 0;
      rival.bumpVelocity = 0;
      rival.collisionCooldown = 0;
      rival.entity.enabled = true;
      const rp = routePositionAtZ(rival.z);
      rival.entity.setPosition(rp.x + rival.lateralOffset, rp.y, rival.z);
    }
    for (const prop of breakables) {
      prop.broken = false;
      prop.effectTime = -1;
      prop.root.enabled = true;
      for (const piece of prop.pieces) {
        piece.entity.enabled = true;
        piece.entity.setLocalPosition(piece.home);
        piece.entity.setLocalEulerAngles(0, 0, 0);
        piece.velocity.set(0, 0, 0);
        piece.spin.set(0, 0, 0);
      }
    }
    updateKeepOutGates();
    for (const obstacle of movingObstacles) {
      obstacle.collisionCooldown = 0;
      obstacle.root.enabled = true;
      const raw = ((obstacle.phase % 2) + 2) % 2;
      const ping = raw <= 1 ? raw : 2 - raw;
      if (obstacle.kind === 'plane') {
        const t = ((obstacle.phase % 1) + 1) % 1;
        obstacle.root.setPosition(-obstacle.travel + t * obstacle.travel * 2, obstacle.y + t * 38, obstacle.z + t * 22);
      } else {
        obstacle.root.setPosition(-obstacle.travel + ping * obstacle.travel * 2, obstacle.y, obstacle.z);
      }
      for (const window of obstacle.windows) {
        window.broken = false;
        window.effectTime = -1;
        window.entity.enabled = true;
        window.entity.setLocalPosition(window.local);
        window.entity.setLocalEulerAngles(0, 0, 0);
        const isRail = obstacle.kind === 'train' || obstacle.kind === 'monorail';
        window.entity.setLocalScale(
          isRail ? (obstacle.kind === 'monorail' ? 2.6 : 2.5) : obstacle.kind === 'plane' ? 1.8 : 2.5,
          isRail ? (obstacle.kind === 'monorail' ? 1.85 : 1.75) : obstacle.kind === 'plane' ? 1.3 : 1.25,
          obstacle.kind === 'plane' ? 0.16 : 0.18,
        );
        window.velocity.set(0, 0, 0);
        window.spin.set(0, 0, 0);
      }
    }
    hitCountText.textContent = `0 / ${rings.length}`;
    fuelSeconds = effectiveLaunchFuel();
    targetStatusText.textContent = '燃料 100%';
    jetAvailable = true;
    jetActiveSeconds = 0;
    perfectDashSeconds = 0;
    perfectDashBaseHorizontal = 0;
    perfectDashDecayPerSecond = 0;
    steerText.textContent = '中立';
    diveText.textContent = '1 / 1';
    jetButton.disabled = false;
    jetButton.innerHTML = 'JET <span>×1</span>';
    root!.dataset.jet = 'ready';
    app.timeScale = 0;
    body!.teleport(origin, pc.Vec3.ZERO);
    previousPosition.copy(origin);
    body!.linearVelocity = new pc.Vec3();
    body!.angularVelocity = new pc.Vec3();
    body!.activate();
    swingMeter = 0.5;
    yaw = distance = stillTime = elapsed = uiElapsed = 0;
    fountainFeedbackCooldown = 0;
    touchedGround = false;
    setPhase('ready');
    delete root!.dataset.result;
    resultPanel.classList.remove('show');
    milestoneBanner.classList.remove('show', 'complete', 'overshoot');
    milestoneBanner.setAttribute('aria-hidden', 'true');
    feedbackLayer.replaceChildren();
    playerHud.style.display = 'none';
    playerShadow.setPosition(origin.x, groundSurfaceYAt(origin.z) + 0.035, origin.z);
    playerShadow.setLocalScale(1.25, 0.025, 1.25);
    playerShadow.enabled = true;
    rewardDoubleButton.disabled = true;
    rewardDoubleButton.textContent = '広告を見てコイン2倍（準備中）';
    arrow.enabled = true;
    updateAimReadouts();
    updateCamera(0, true);
    distanceText.textContent = '0000m';
    heightText.textContent = CONFIG.launchClearance.toFixed(1);
    stateText.textContent = '待機中';
    message.textContent = '左右に狙いをつけ、メーター中央のPERFECTで離してください。';
    button.disabled = true;
  }

  function launch(): void {
    const centerScore = launchCenterScore(swingMeter);
    const profile = resolveLaunchProfile(swingMeter);
    const normalLaunchSpeed = profile.speed * percent('launchSpeed');
    const isTruePerfect = profile.grade === 'PERFECT' && centerScore >= CONFIG.perfectDashScore;
    const launchSpeed = isTruePerfect ? normalLaunchSpeed * CONFIG.perfectDashMultiplier : normalLaunchSpeed;
    const velocity = launchComponents(launchSpeed, profile.elevationDegrees, yaw);
    body!.linearVelocity = new pc.Vec3(velocity.x, velocity.y, velocity.z);
    if (isTruePerfect) {
      const base = launchComponents(normalLaunchSpeed, profile.elevationDegrees, yaw);
      perfectDashSeconds = CONFIG.perfectDashSeconds;
      perfectDashBaseHorizontal = Math.hypot(base.x, base.z);
      perfectDashDecayPerSecond = Math.max(0, Math.hypot(velocity.x, velocity.z) - perfectDashBaseHorizontal) / CONFIG.perfectDashSeconds;
      const node = document.createElement('div');
      node.className = 'launch-perfect';
      node.textContent = 'PERFECT!';
      feedbackLayer.appendChild(node);
      window.setTimeout(() => node.remove(), 900);
    } else {
      perfectDashSeconds = 0;
      perfectDashBaseHorizontal = 0;
      perfectDashDecayPerSecond = 0;
    }
    body!.angularVelocity = new pc.Vec3();
    body!.activate();
    setPhase('flying');
    arrow.enabled = false;
    fuelSeconds = effectiveLaunchFuel();
    jetAvailable = true;
    jetActiveSeconds = 0;
    diveText.textContent = '1 / 1';
    root!.dataset.jet = 'ready';
    if (profile.grade === 'MISS') {
      const text = profile.failure === 'dud'
        ? 'スカッ！ほとんど飛ばない大失敗。'
        : profile.failure === 'ground'
          ? '地面へ一直線！刺さるような大失敗。'
          : '上空へすっぽ抜け！大失敗。';
      stateText.textContent = 'MISS!';
      message.textContent = text;
    } else {
      stateText.textContent = profile.grade === 'PERFECT' ? 'PERFECT!' : `${profile.grade}!`;
      message.textContent = isTruePerfect
        ? `PERFECT! 100%スタートダッシュ ${Math.round(launchSpeed)}m/s！一気に加速してから通常速度へ戻ります。`
        : `${profile.grade}発射 ${Math.round(launchSpeed)}m/s。リングを狙い、JETボタンで再加速。`;
    }
    updateFlightReadouts();
    button.disabled = false;
    app.timeScale = document.hidden ? 0 : 1;
  }

  function updateDrag(event: PointerEvent): void {
    if (!drag || event.pointerId !== drag.id) return;
    yaw = clamp(-(event.clientX - drag.startX) / drag.yawPixels, -1, 1) * CONFIG.maximumYawDegrees;
    updateAimReadouts();
    message.textContent = '左右で方向調整。メーターが中央に来た瞬間に離すと最大初速です。';
  }


  function steeringInput(): number {
    const leftHeld = pressedKeys.has('ArrowLeft') || pressedKeys.has('KeyA');
    const rightHeld = pressedKeys.has('ArrowRight') || pressedKeys.has('KeyD');
    return leftHeld || rightHeld ? Number(rightHeld) - Number(leftHeld) : airInputX;
  }

  function heightAboveSurface(): number {
    const p = ball.getPosition();
    return Math.max(0, p.y - CONFIG.radius - groundSurfaceYAt(p.z));
  }

  function refreshSupport(): void {
    const p = ball.getPosition();
    const bottomY = p.y - CONFIG.radius;
    const surfaceY = groundSurfaceYAt(p.z);
    const descendingOrSliding = body!.linearVelocity.y <= 1.2;
    touchingGround = descendingOrSliding && Math.abs(bottomY - surfaceY) <= 0.22;
    if (touchingGround) touchedGround = true;
  }

  function updateFlightReadouts(): void {
    const input = steeringInput();
    const vx = body?.linearVelocity.x ?? 0;
    steerText.textContent = Math.abs(input) >= 0.01
      ? (input > 0 ? '右へ操作' : '左へ操作')
      : Math.abs(vx) < 0.5 ? '直進' : (vx < 0 ? '右へ慣性' : '左へ慣性');
    diveText.textContent = touchingGround ? '着地中' : jetAvailable ? '1 / 1' : '0 / 1';
    jetButton.disabled = touchingGround || !jetAvailable;
    jetButton.innerHTML = `JET <span>×${jetAvailable ? 1 : 0}</span>`;
    root!.dataset.jet = jetAvailable ? 'ready' : 'used';
  }

  function updateAirSteering(dt: number): void {
    const clearance = heightAboveSurface();
    if (touchingGround || clearance <= 0.12) return;

    const input = steeringInput();
    // Releasing the pointer does not steer back toward center.
    // X velocity changes only while the player is actively steering.
    if (Math.abs(input) < 0.01) return;

    const v = body!.linearVelocity;
    const controlScale = percent('airControl');
    const accelerationWorldX = -input * CONFIG.airControlAcceleration * controlScale; // Screen-right = world -X.
    const nextX = clamp(v.x + accelerationWorldX * dt,
      -CONFIG.airControlMaximumSpeedX * controlScale, CONFIG.airControlMaximumSpeedX * controlScale);
    velocityBuffer.set(nextX, v.y, v.z);
    body!.linearVelocity = velocityBuffer;
    body!.activate();
  }

  function updateRivals(dt: number): void {
    const playerPos = ball.getPosition();
    for (const rival of rivals) {
      rival.collisionCooldown = Math.max(0, rival.collisionCooldown - dt);
      rival.z += rival.speed * dt;
      if (rival.z > CONFIG.goalZ + 35) {
        rival.entity.enabled = false;
        continue;
      }
      const route = routePositionAtZ(rival.z);
      const weave = Math.sin(elapsed * 1.15 + rival.phase) * 1.1;
      rival.bumpVelocity *= Math.exp(-5.5 * dt);
      rival.bumpOffset += rival.bumpVelocity * dt;
      rival.bumpOffset *= Math.exp(-3.2 * dt);
      const routeHalfWidth = corridorHalfWidthAt(rival.z);
      const x = clamp(route.x + rival.lateralOffset + weave + rival.bumpOffset, -routeHalfWidth + 3, routeHalfWidth - 3);
      const y = Math.max(2.2, route.y + 0.2 + Math.sin(elapsed * 2.0 + rival.phase) * 0.35);
      rival.entity.setPosition(x, y, rival.z);
      rival.entity.setEulerAngles(0, Math.sin(elapsed * 1.3 + rival.phase) * 6, 8);

      if (rival.collisionCooldown > 0 || touchingGround) continue;
      const dx = playerPos.x - x;
      const dy = playerPos.y - y;
      const dz = playerPos.z - rival.z;
      const distanceToRival = Math.hypot(dx, dy, dz);
      if (distanceToRival > CONFIG.rivalCollisionRadius) continue;

      const v = body!.linearVelocity;
      const side = Math.abs(dx) > 0.08 ? Math.sign(dx) : (rival.id % 2 === 0 ? 1 : -1);
      const stability = percent('impactStability');
      const deflectX = clamp(v.x + side * (7.5 / stability), -CONFIG.airControlMaximumSpeedX, CONFIG.airControlMaximumSpeedX);
      // Keep or slightly increase forward speed: rivals are playful bumpers, never brakes.
      velocityBuffer.set(deflectX, Math.max(v.y, 2.5 * percent('rebound')), Math.max(v.z, 24));
      body!.linearVelocity = velocityBuffer;
      body!.activate();
      rival.bumpVelocity = -side * 9;
      rival.collisionCooldown = CONFIG.rivalCollisionCooldown;
      showPickupFeedback('BUMP!', 'rival');
      message.textContent = '同僚と接触！速度は落ちず、横へ弾かれます。';
    }
  }

  function updateBreakables(dt: number): void {
    const p = ball.getPosition();
    const ax = previousPosition.x, ay = previousPosition.y, az = previousPosition.z;
    const bx = p.x, by = p.y, bz = p.z;
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const ab2 = abx * abx + aby * aby + abz * abz;

    for (const prop of breakables) {
      if (!prop.broken) {
        let t = 0;
        if (ab2 > 1e-6) {
          t = clamp(((prop.x - ax) * abx + (prop.y - ay) * aby + (prop.z - az) * abz) / ab2, 0, 1);
        }
        const cx = ax + abx * t;
        const cy = ay + aby * t;
        const cz = az + abz * t;
        const d = Math.hypot(prop.x - cx, prop.y - cy, prop.z - cz);
        if (d <= CONFIG.breakableHitRadius * percent('smashRange')) {
          prop.broken = true;
          prop.effectTime = 0;
          techniqueSigns += 1;
          const smashValue = Math.max(prop.value, Math.round(prop.value * percent('smashReward')));
          playCoins += smashValue;
          airCoinValue += smashValue;
          coinCountText.textContent = String(playCoins);
          showPickupFeedback(`+${smashValue}`, 'breakable');
          message.textContent = `看板破壊！+${smashValue}コイン。速度はそのまま！`;
          const v = body!.linearVelocity;
          // Explicitly restore the same velocity so the smash never causes a hidden slowdown.
          velocityBuffer.set(v.x, v.y, v.z);
          body!.linearVelocity = velocityBuffer;
          for (let i = 0; i < prop.pieces.length; i++) {
            const piece = prop.pieces[i];
            const side = i % 2 === 0 ? -1 : 1;
            piece.velocity.set(side * (4.5 + i), 5.5 + i * 0.7, 4 + i * 1.2);
            piece.spin.set(180 + i * 70, side * (260 + i * 55), 130 + i * 45);
          }
        }
      }

      if (!prop.broken || prop.effectTime < 0) continue;
      prop.effectTime += dt;
      for (const piece of prop.pieces) {
        const lp = piece.entity.getLocalPosition();
        piece.velocity.y -= 9.8 * dt;
        piece.entity.setLocalPosition(
          lp.x + piece.velocity.x * dt,
          lp.y + piece.velocity.y * dt,
          lp.z + piece.velocity.z * dt,
        );
        const euler = piece.entity.getLocalEulerAngles();
        piece.entity.setLocalEulerAngles(
          euler.x + piece.spin.x * dt,
          euler.y + piece.spin.y * dt,
          euler.z + piece.spin.z * dt,
        );
      }
      if (prop.effectTime >= 0.75) prop.root.enabled = false;
    }
  }

  function updateFountains(): void {
    fountainFeedbackCooldown = Math.max(0, fountainFeedbackCooldown - app.maxDeltaTime);
    if (touchingGround && phase !== 'flying') return;
    const p = ball.getPosition();
    for (let fountainIndex = 0; fountainIndex < fountains.length; fountainIndex++) {
      const fountain = fountains[fountainIndex];
      const horizontal = Math.hypot(p.x - fountain.x, p.z - fountain.z);
      const inside = horizontal <= fountain.radius && p.y <= fountain.maxY + 2 && p.y >= -1;
      if (!inside) {
        activeFountainZones.delete(fountainIndex);
        continue;
      }
      // Count entering the water column once, even if the player is already rising faster than the fountain push.
      if (!activeFountainZones.has(fountainIndex)) {
        activeFountainZones.add(fountainIndex);
        techniqueFountains += 1;
        showPickupFeedback('FOUNTAIN!', 'ring');
      }
      const v = body!.linearVelocity;
      const boostedPushY = fountain.pushY * percent('fountainBoost');
      if (v.y < boostedPushY) {
        velocityBuffer.set(v.x, boostedPushY, Math.max(v.z, 24));
        body!.linearVelocity = velocityBuffer;
        body!.activate();
      }
      touchingGround = false;
      stillTime = 0;
      if (fountainFeedbackCooldown <= 0) {
        message.textContent = '噴水の水圧で上空ルートへ押し上げられた！';
        fountainFeedbackCooldown = 0.65;
      }
    }
  }

  function updateTowerPass(): void {
    if (towerPassRegistered || phase !== 'flying') return;
    const p = ball.getPosition();
    const dz = p.z - previousPosition.z;
    if (Math.abs(dz) < 1e-6) return;
    const t = (towerZ - previousPosition.z) / dz;
    if (t < 0 || t > 1) return;
    const crossX = previousPosition.x + (p.x - previousPosition.x) * t;
    const crossY = previousPosition.y + (p.y - previousPosition.y) * t;
    // Count only a deliberate pass through the central opening between the four legs.
    if (Math.abs(crossX - towerX) > 5.2 || crossY < 1.0 || crossY > 19.0) return;
    towerPassRegistered = true;
    techniqueTower = 1;
    showPickupFeedback('TOWER +35%', 'ring');
    message.textContent = 'タワーの脚の間を通過！装備抽選率 +35%。';
  }

  function updateMovingObstacles(dt: number): void {
    const player = ball.getPosition();
    const ax = previousPosition.x, ay = previousPosition.y, az = previousPosition.z;
    const bx = player.x, by = player.y, bz = player.z;
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const ab2 = abx * abx + aby * aby + abz * abz;

    for (const obstacle of movingObstacles) {
      obstacle.collisionCooldown = Math.max(0, obstacle.collisionCooldown - dt);
      const rawCycle = ((elapsed * obstacle.speed + obstacle.phase) % 2 + 2) % 2;
      const pingPong = rawCycle <= 1 ? rawCycle : 2 - rawCycle;
      let x = -obstacle.travel + pingPong * obstacle.travel * 2;
      let obstacleY = obstacle.y;
      let obstacleZ = obstacle.z;
      if (obstacle.kind === 'plane') {
        // True takeoff path: the aircraft changes X, Y and Z together instead of merely being tilted.
        // It enters low on the left and physically climbs toward the upper-right while moving forward.
        const takeoffT = ((elapsed * obstacle.speed + obstacle.phase) % 1 + 1) % 1;
        x = -obstacle.travel + takeoffT * obstacle.travel * 2;
        obstacleY = obstacle.y + takeoffT * 38.0;
        obstacleZ = obstacle.z + takeoffT * 22.0;
        // The aircraft model's nose points along local +X. Match its attitude to the actual
        // takeoff tangent instead of using an arbitrary visual tilt.
        const pathX = obstacle.travel * 2;
        const pathY = 38.0;
        const pathZ = 22.0;
        const climbDegrees = Math.atan2(pathY, Math.hypot(pathX, pathZ)) * 180 / Math.PI;
        const forwardDegrees = Math.atan2(pathZ, pathX) * 180 / Math.PI;
        obstacle.root.setEulerAngles(0, -forwardDegrees, -climbDegrees);
      } else {
        obstacle.root.setEulerAngles(0, 0, 0);
      }
      obstacle.root.setPosition(x, obstacleY, obstacleZ);

      let smashedWindow = false;
      for (let i = 0; i < obstacle.windows.length; i++) {
        const window = obstacle.windows[i];
        if (!window.broken) {
          const wp = window.entity.getPosition();
          let t = 0;
          if (ab2 > 1e-6) t = clamp(((wp.x - ax) * abx + (wp.y - ay) * aby + (wp.z - az) * abz) / ab2, 0, 1);
          const cx = ax + abx * t, cy = ay + aby * t, cz = az + abz * t;
          if (Math.hypot(wp.x - cx, wp.y - cy, wp.z - cz) <= CONFIG.movingWindowHitRadius) {
            window.broken = true;
            window.effectTime = 0;
            smashedWindow = true;
            techniqueWindows += 1;
            playCoins += CONFIG.movingWindowCoinBonus;
            airCoinValue += CONFIG.movingWindowCoinBonus;
            coinCountText.textContent = String(playCoins);
            showPickupFeedback(`WINDOW +${CONFIG.movingWindowCoinBonus}`, 'obstacle');
            message.textContent = `${obstacle.kind === 'plane' ? '飛行機' : obstacle.kind === 'monorail' ? 'モノレール' : obstacle.kind === 'train' ? '電車' : '車'}の窓をぶち抜いた！速度はそのまま。`;
            const side = i % 2 === 0 ? -1 : 1;
            window.velocity.set(side * 4.5, 4.5 + i * 0.12, 3.5);
            window.spin.set(260, side * 420, 180);
          }
        }

        if (!window.broken || window.effectTime < 0) continue;
        window.effectTime += dt;
        const lp = window.entity.getLocalPosition();
        window.velocity.y -= 9.8 * dt;
        window.entity.setLocalPosition(lp.x + window.velocity.x * dt, lp.y + window.velocity.y * dt, lp.z + window.velocity.z * dt);
        const er = window.entity.getLocalEulerAngles();
        window.entity.setLocalEulerAngles(er.x + window.spin.x * dt, er.y + window.spin.y * dt, er.z + window.spin.z * dt);
        const s = Math.max(0.05, 1 - window.effectTime / 0.36);
        window.entity.setLocalScale(window.entity.getLocalScale().x * s, window.entity.getLocalScale().y * s, window.entity.getLocalScale().z * s);
        if (window.effectTime >= 0.36) window.entity.enabled = false;
      }

      // Body contact is a playful deflection only. Keep forward velocity so obstacles never feel like brakes.
      if (!smashedWindow && obstacle.collisionCooldown <= 0) {
        const dx = player.x - x;
        const dy = player.y - obstacleY;
        const dz = player.z - obstacleZ;
        if (Math.abs(dx) <= obstacle.halfWidth + CONFIG.movingBodyHitRadius &&
            Math.abs(dy) <= obstacle.halfHeight + CONFIG.movingBodyHitRadius &&
            Math.abs(dz) <= CONFIG.movingBodyHitRadius) {
          const v = body!.linearVelocity;
          const push = (dx >= 0 ? 8 : -8) / percent('impactStability');
          velocityBuffer.set(clamp(v.x + push, -CONFIG.airControlMaximumSpeedX, CONFIG.airControlMaximumSpeedX), Math.max(v.y, 2.2 * percent('rebound')), Math.max(v.z, 20));
          body!.linearVelocity = velocityBuffer;
          body!.activate();
          obstacle.collisionCooldown = CONFIG.movingBodyCooldown;
          showPickupFeedback('BUMP!', 'rival');
        }
      }
    }
  }

  function updateRings(): void {
    const p = ball.getPosition();
    const dz = p.z - previousPosition.z;
    if (Math.abs(dz) < 1e-6) return;
    for (const ring of rings) {
      if (ring.used) continue;
      const t = (ring.z - previousPosition.z) / dz;
      if (t < 0 || t > 1) continue;
      const crossX = previousPosition.x + (p.x - previousPosition.x) * t;
      const crossY = previousPosition.y + (p.y - previousPosition.y) * t;
      const radial = Math.hypot(crossX - ring.x, crossY - ring.y);
      const effectiveRingRadius = (ring.radius - CONFIG.ringThickness * 0.3) * percent('ringRange');
      if (radial > effectiveRingRadius) continue;

      ring.used = true;
      hitCount += 1;
      playCoins += CONFIG.ringCoinBonus;
      ringCoinValue += CONFIG.ringCoinBonus;
      coinCountText.textContent = String(playCoins);
      showPickupFeedback(`+${CONFIG.ringCoinBonus}`, 'ring');
      ring.effectTime = 0;
      const v = body!.linearVelocity;
      const ringLift = RING_LAYOUT[ring.id - 1].liftY * percent('ringLift');
      const ringBoost = CONFIG.ringBoostZ * percent('ringBoost');
      velocityBuffer.set(
        v.x,
        // Ring lift is always additive to the current vertical velocity.
        v.y + ringLift,
        Math.min(CONFIG.ringMaximumSpeedZ * percent('ringBoost'), Math.max(v.z, CONFIG.ringMinimumSpeedZ) + ringBoost),
      );
      body!.linearVelocity = velocityBuffer;
      body!.activate();
      fuelSeconds = effectiveRingFuel();
      jetAvailable = true;
      // Do not cancel a JET climb when a ring is crossed. Keep a short vertical-boost hold
      // so the ring lift is genuinely added on top of the current JET momentum.
      jetActiveSeconds = Math.max(jetActiveSeconds, 0.35 * percent('jetDuration'));
      touchingGround = false;
      stillTime = 0;
      hitCountText.textContent = `${hitCount} / ${rings.length}`;
      targetStatusText.textContent = `リング ${ring.id} / ジェット回復`;
      diveText.textContent = '1 / 1';
      message.textContent = `リング通過！+${CONFIG.ringCoinBonus}コイン。燃料とジェットが回復。`;
      stateText.textContent = 'ブースト！';
    }
  }

  function updateCoins(): void {
    const p = ball.getPosition();
    const ax = previousPosition.x, ay = previousPosition.y, az = previousPosition.z;
    const bx = p.x, by = p.y, bz = p.z;
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const ab2 = abx * abx + aby * aby + abz * abz;
    for (const coin of coins) {
      if (coin.collected) continue;
      let t = 0;
      if (ab2 > 1e-6) {
        t = clamp(((coin.position.x - ax) * abx + (coin.position.y - ay) * aby + (coin.position.z - az) * abz) / ab2, 0, 1);
      }
      const cx = ax + abx * t;
      const cy = ay + aby * t;
      const cz = az + abz * t;
      const distanceToPath = Math.hypot(coin.position.x - cx, coin.position.y - cy, coin.position.z - cz);
      if (distanceToPath > effectiveCoinPickupRadius()) continue;
      coin.collected = true;
      playCoins += coin.value;
      airCoinValue += coin.value;
      coinCountText.textContent = String(playCoins);
      showPickupFeedback(`+${coin.value}`, 'coin');
      // Keep the coin visible briefly and spin it rapidly; no ambiguous grow-pop.
      coin.pickupEffectTime = 0;
      message.textContent = `コインGET！ 現在 ${playCoins} コイン。`;
    }
  }

  function updateCoinEffects(dt: number): void {
    for (const coin of coins) {
      if (!coin.entity.enabled) continue;
      const spinSpeed = coin.collected ? 1800 : 240;
      coin.spinDegrees = (coin.spinDegrees + spinSpeed * dt) % 360;
      coin.entity.setEulerAngles(90, coin.spinDegrees, 0);
      if (!coin.collected || coin.pickupEffectTime < 0) continue;
      coin.pickupEffectTime += dt;
      const duration = 0.34;
      const t = clamp(coin.pickupEffectTime / duration, 0, 1);
      // Rapid spin + shrink + slight rise makes the pickup readable without looking like it spawned larger.
      const scale = Math.max(0.04, 1 - t);
      coin.entity.setLocalScale(
        CONFIG.coinRadius * 1.5 * scale,
        0.16 * scale,
        CONFIG.coinRadius * 1.5 * scale,
      );
      coin.entity.setPosition(coin.position.x, coin.position.y + t * 1.2, coin.position.z);
      if (t >= 1) coin.entity.enabled = false;
    }
  }

  function updateRingEffects(dt: number): void {
    for (const ring of rings) {
      if (ring.effectTime < 0) continue;
      ring.effectTime += dt;
      const shrinkEnd = 0.12;
      const burstEnd = 0.38;
      let radiusScale = 1;
      let pieceScale = 1;
      if (ring.effectTime <= shrinkEnd) {
        const t = ring.effectTime / shrinkEnd;
        radiusScale = 1 - 0.48 * t;
        pieceScale = 1 - 0.30 * t;
      } else {
        const t = clamp((ring.effectTime - shrinkEnd) / (burstEnd - shrinkEnd), 0, 1);
        radiusScale = 0.52 + 1.15 * t;
        pieceScale = 0.70 * (1 - t);
      }
      for (let i = 0; i < ring.parts.length; i++) {
        const part = ring.parts[i];
        const a = i / ring.parts.length * Math.PI * 2;
        part.setPosition(
          ring.x + Math.cos(a) * ring.radius * radiusScale,
          ring.y + Math.sin(a) * ring.radius * radiusScale,
          ring.z,
        );
        const s = Math.max(0.02, pieceScale);
        part.setLocalScale(CONFIG.ringThickness * 2 * s, CONFIG.ringThickness * 2 * s, 4.0 * s);
        if (part.render) part.render.material = ringUsedMaterial;
      }
      if (ring.effectTime >= burstEnd) {
        for (const part of ring.parts) part.enabled = false;
        ring.effectTime = -1;
      }
    }
  }

  function updateFuelAndForwardSpeed(dt: number): void {
    if (touchingGround) return;
    fuelSeconds = Math.max(0, fuelSeconds - dt);
    const v = body!.linearVelocity;

    // A true 100% PERFECT gets a deliberately exaggerated launch burst,
    // then sheds only that bonus very quickly back to the normal PERFECT speed.
    if (perfectDashSeconds > 0) {
      const horizontal = Math.hypot(v.x, v.z);
      const nextHorizontal = Math.max(perfectDashBaseHorizontal, horizontal - perfectDashDecayPerSecond * dt);
      const scale = horizontal > 1e-6 ? nextHorizontal / horizontal : 1;
      velocityBuffer.set(v.x * scale, v.y, v.z * scale);
      body!.linearVelocity = velocityBuffer;
      perfectDashSeconds = Math.max(0, perfectDashSeconds - dt);
      if (perfectDashSeconds <= 0) {
        perfectDashBaseHorizontal = 0;
        perfectDashDecayPerSecond = 0;
      }
      return;
    }

    if (v.z <= CONFIG.minimumAirForwardSpeed) return;
    const decel = fuelSeconds > 0
      ? CONFIG.fueledForwardDeceleration
      : CONFIG.coastForwardDeceleration;
    const nextZ = Math.max(CONFIG.minimumAirForwardSpeed, v.z - decel * dt);
    velocityBuffer.set(v.x, v.y, nextZ);
    body!.linearVelocity = velocityBuffer;
  }

  function updateGroundSlide(dt: number): void {
    if (!touchingGround) return;
    const v = body!.linearVelocity;
    const horizontal = Math.hypot(v.x, v.z);
    if (horizontal <= 0.001) return;
    const next = Math.max(0, horizontal - effectiveGroundDeceleration() * dt);
    const scale = next / horizontal;
    // Human-like slide on flat ground: lose speed and do not keep rolling forever.
    velocityBuffer.set(v.x * scale, Math.min(v.y, 0), v.z * scale);
    body!.linearVelocity = velocityBuffer;
    body!.angularVelocity = pc.Vec3.ZERO;
  }

  function requestJet(): void {
    if (phase !== 'flying' || document.hidden) return;
    refreshSupport();
    if (touchingGround || heightAboveSurface() < 0.15) {
      message.textContent = '着地中はジェットを使えません。';
      return;
    }
    if (!jetAvailable) {
      message.textContent = 'ジェットは使用済み。リングをくぐると1回復します。';
      return;
    }
    const v = body!.linearVelocity;
    const boostedZ = Math.min(CONFIG.jetMaximumSpeedZ * percent('jetTopSpeed'), Math.max(v.z, 0) + CONFIG.jetForwardBoost * percent('jetForward'));
    const jetElevation = CONFIG.jetElevationDegrees * percent('jetClimb');
    const targetY = boostedZ * Math.tan(jetElevation * Math.PI / 180);
    velocityBuffer.set(v.x, Math.max(v.y, targetY), boostedZ);
    body!.linearVelocity = velocityBuffer;
    body!.activate();
    jetAvailable = false;
    jetActiveSeconds = CONFIG.jetPitchSeconds * percent('jetDuration');
    fuelSeconds = Math.max(fuelSeconds, effectiveJetFuel());
    stateText.textContent = 'JET!';
    message.textContent = 'ジェット！前方へ再加速し、少し上向きに立て直します。';
    updateFlightReadouts();
  }

  function updateRocketPitch(dt: number): void {
    if (touchingGround) {
      jetActiveSeconds = 0;
      return;
    }
    const v = body!.linearVelocity;
    if (jetActiveSeconds > 0) {
      jetActiveSeconds = Math.max(0, jetActiveSeconds - dt);
      const targetY = Math.max(0.01, Math.abs(v.z)) * Math.tan(CONFIG.jetElevationDegrees * Math.PI / 180);
      const alpha = 1 - Math.exp(-CONFIG.pitchResponse * dt);
      // JET pitch control may raise a shallow climb, but it must never pull down a stronger
      // upward velocity created by JET + ring stacking.
      const assistedY = v.y + (targetY - v.y) * alpha;
      velocityBuffer.set(v.x, Math.max(v.y, assistedY), v.z);
      body!.linearVelocity = velocityBuffer;
      return;
    }
    // With fuel, gently stabilize toward level flight. After burnout, gravity is unopposed.
    const fuelRatio = clamp(fuelSeconds / effectiveRingFuel(), 0, 1);
    if (fuelRatio <= 0.001) return;
    const response = CONFIG.pitchResponse * 0.55 * fuelRatio;
    const alpha = 1 - Math.exp(-response * dt);
    velocityBuffer.set(v.x, v.y + (0 - v.y) * alpha, v.z);
    body!.linearVelocity = velocityBuffer;
  }

  function updateAirDrag(event: PointerEvent): void {
    if (!airDrag || event.pointerId !== airDrag.id) return;
    const dx = event.clientX - airDrag.startX;
    const dy = event.clientY - airDrag.startY;
    airDrag.maximumMovement = Math.max(airDrag.maximumMovement, Math.hypot(dx, dy));
    if (airDrag.maximumMovement > CONFIG.tapMaximumPixels) airDrag.dragging = true;
    const deadzone = 10;
    const beyondDeadzone = Math.sign(dx) * Math.max(0, Math.abs(dx) - deadzone);
    airInputX = clamp(beyondDeadzone / airDrag.controlPixels, -1, 1);
  }

  function updateKeyboardLaunchAim(): void {
    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0, (now - keyboardAimPreviousTime) / 1000));
    keyboardAimPreviousTime = now;
    if (phase !== 'ready' && phase !== 'aiming') return;
    const left = pressedKeys.has('ArrowLeft') || pressedKeys.has('KeyA');
    const right = pressedKeys.has('ArrowRight') || pressedKeys.has('KeyD');
    const input = Number(right) - Number(left);
    if (input === 0) return;
    yaw = clamp(yaw + input * CONFIG.keyboardAimDegreesPerSecond * dt, -CONFIG.maximumYawDegrees, CONFIG.maximumYawDegrees);
    updateAimReadouts();
    message.textContent = `発射方向 ${Math.round(yaw)}°。キーを離すと角度を保持します。`;
  }

  canvas.addEventListener('pointerdown', (event: PointerEvent) => {
    if (drag || airDrag || !event.isPrimary || event.button !== 0 || document.hidden) return;
    if (phase !== 'ready' && phase !== 'flying') return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    const rect = canvas.getBoundingClientRect();
    if (phase === 'ready') {
      drag = {
        id: event.pointerId, startX: event.clientX, startY: event.clientY,
        yawPixels: Math.min(170, rect.width * 0.34),
      };
      canvas.setPointerCapture(event.pointerId);
      setPhase('aiming');
      stateText.textContent = '狙い調整中';
      swingStartedAt = performance.now();
      swingMeter = 0;
      updateDrag(event);
    } else {
      airDrag = {
        id: event.pointerId, startX: event.clientX, startY: event.clientY,
        startedAt: event.timeStamp, controlPixels: Math.max(40, Math.min(100, rect.width * 0.22)),
        maximumMovement: 0, dragging: false,
      };
      canvas.setPointerCapture(event.pointerId);
    }
  }, eventOptions);

  canvas.addEventListener('pointermove', (event: PointerEvent) => {
    const id = drag?.id ?? airDrag?.id;
    if (event.pointerId !== id) return;
    event.preventDefault();
    if (event.pointerType === 'mouse' && (event.buttons & 1) === 0) {
      cancelAim();
      return;
    }
    if (phase === 'aiming') updateDrag(event);
    else if (phase === 'flying') updateAirDrag(event);
  }, eventOptions);

  canvas.addEventListener('pointerup', (event: PointerEvent) => {
    if (phase === 'aiming' && drag?.id === event.pointerId) {
      event.preventDefault();
      updateDrag(event);
      // Pointer capture means release may occur outside the canvas after a deep pull.
      // Treat the release as a launch regardless of final pointer position.
      if (document.hidden) {
        cancelAim();
        return;
      }
      releasePointer();
      launch();
      return; // Launch release MUST NOT also trigger a dive.
    }
    if (phase !== 'flying' || !airDrag || airDrag.id !== event.pointerId) return;
    event.preventDefault();
    updateAirDrag(event);
    releasePointer();
  }, eventOptions);

  function cancelMatchingPointer(event: PointerEvent): void {
    if (drag?.id === event.pointerId || airDrag?.id === event.pointerId) cancelAim();
  }
  canvas.addEventListener('pointercancel', cancelMatchingPointer, eventOptions);
  canvas.addEventListener('lostpointercapture', cancelMatchingPointer, eventOptions);
  canvas.addEventListener('contextmenu', (event) => event.preventDefault(), eventOptions);
  window.addEventListener('blur', cancelAim, eventOptions);
  window.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') { cancelAim(); return; }
    const target = event.target;
    if (target instanceof HTMLElement &&
        (target.isContentEditable || target.closest('button, input, textarea, select, a'))) return;
    if (document.hidden) return;

    const directionKey = event.code === 'ArrowLeft' || event.code === 'ArrowRight' || event.code === 'KeyA' || event.code === 'KeyD';
    if (directionKey && (phase === 'ready' || phase === 'aiming')) {
      event.preventDefault();
      pressedKeys.add(event.code);
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      if (event.repeat) return;
      if (phase === 'ready') {
        keyboardLaunchHeld = true;
        setPhase('aiming');
        swingStartedAt = performance.now();
        swingMeter = 0;
        // Keep the keyboard-selected launch angle instead of resetting it to center.
        updateAimReadouts();
        stateText.textContent = '発射タイミング';
        message.textContent = 'A/D・←/→で角度調整。SPACEを離した瞬間のメーター位置で発射します。';
      } else if (phase === 'flying') {
        requestJet();
      }
      return;
    }

    if (phase !== 'flying') return;
    if (directionKey) {
      event.preventDefault();
      pressedKeys.add(event.code);
    }
  }, eventOptions);
  window.addEventListener('keyup', (event: KeyboardEvent) => {
    if (event.code === 'Space' && keyboardLaunchHeld && phase === 'aiming') {
      event.preventDefault();
      keyboardLaunchHeld = false;
      launch();
      return;
    }
    if (pressedKeys.delete(event.code)) event.preventDefault();
  }, eventOptions);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAim();
    app.timeScale = phase === 'flying' && !document.hidden ? 1 : 0;
  }, eventOptions);
  jetButton.addEventListener('click', () => requestJet(), eventOptions);
  const playTokyo = () => { hideMenus(); reset(); canvas.focus({ preventScroll: true }); };
  homePlay.addEventListener('click', playTokyo, eventOptions);
  homeStage.addEventListener('click', showStageSelect, eventOptions);
  stageBack.addEventListener('click', showHome, eventOptions);
  stageTokyoPlay.addEventListener('click', playTokyo, eventOptions);
  homeShop.addEventListener('click', showShop, eventOptions);
  testDataReset.addEventListener('click', () => {
    const ok = window.confirm('テストデータをすべて初期化します。\n\n所持コイン・装備・アンロック状況・ガチャ回数などが消えます。実行しますか？');
    if (!ok) return;
    localStorage.removeItem(SAVE_KEY);
    window.location.reload();
  }, eventOptions);
  homeInventory.addEventListener('click', showInventory, eventOptions);
  shopBack.addEventListener('click', showHome, eventOptions);
  shopStandard.addEventListener('click', () => rollShopGacha('standard'), eventOptions);
  shopPremium.addEventListener('click', () => rollShopGacha('premium'), eventOptions);
  shopAd.addEventListener('click', () => {
    // TEST ONLY: treat confirmation as a completed rewarded ad until an SDK is connected.
    if (window.confirm('テスト環境：広告視聴が完了したものとして無料ガチャを回しますか？')) completeRewardedGacha();
  }, eventOptions);
  gachaResultClose.addEventListener('click', () => gachaResultOverlay.classList.remove('show'), eventOptions);
  inventoryBack.addEventListener('click', showHome, eventOptions);
  inventorySort.addEventListener('change', renderInventory, eventOptions);
  for (const tab of inventoryTabs) tab.addEventListener('click', () => {
    activeInventorySlot = tab.dataset.slot as EquipmentSlot; mergeItemIds = []; renderInventory();
  }, eventOptions);
  inventoryGrid.addEventListener('click', (event) => {
    const buttonNode = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-item-id]');
    if (!buttonNode?.dataset.itemId) return;
    const item = itemById(buttonNode.dataset.itemId); if (item) showItemDetail(item);
  }, eventOptions);
  inventoryGrid.addEventListener('dragstart', (event: DragEvent) => {
    const card = (event.target as HTMLElement).closest<HTMLElement>('[data-item-id]');
    const id = card?.dataset.itemId;
    if (!id || !event.dataTransfer) return;
    const item = itemById(id);
    if (!item || item.locked || gameSave.equipped[item.slot] === item.id || item.rarity === 'mythic') { event.preventDefault(); return; }
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  }, eventOptions);
  mergeArea.addEventListener('dragover', (event: DragEvent) => { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'; }, eventOptions);
  mergeArea.addEventListener('drop', (event: DragEvent) => {
    event.preventDefault();
    const id = event.dataTransfer?.getData('text/plain');
    if (id) addMergeItem(id);
  }, eventOptions);
  for (const slot of mergeSlots) slot.addEventListener('click', () => {
    const id = slot.dataset.itemId;
    if (!id) return;
    mergeItemIds = mergeItemIds.filter((candidate) => candidate !== id);
    renderInventory();
  }, eventOptions);
  mergeClear.addEventListener('click', () => { mergeItemIds = []; renderInventory(); }, eventOptions);
  mergeButton.addEventListener('click', performMerge, eventOptions);
  mergeResultClose.addEventListener('click', () => mergeResultOverlay.classList.remove('show'), eventOptions);
  itemDetailClose.addEventListener('click', () => itemDetail.classList.remove('show'), eventOptions);
  itemEquip.addEventListener('click', () => {
    const item = itemById(selectedItemId ?? undefined); if (!item) return;
    gameSave.equipped[item.slot] = item.id;
    saveGame(gameSave);
    renderInventory();
    itemDetail.classList.remove('show');
  }, eventOptions);
  itemLock.addEventListener('click', () => {
    const item = itemById(selectedItemId ?? undefined); if (!item) return;
    item.locked = !item.locked; saveGame(gameSave); showItemDetail(item); renderInventory();
  }, eventOptions);
  itemSell.addEventListener('click', () => {
    const item = itemById(selectedItemId ?? undefined);
    if (!item || item.locked || gameSave.equipped[item.slot] === item.id) return;
    const value = sellValueForItem(item);
    if (!window.confirm(`${itemDisplayName(item)}を${value}コインで売却しますか？`)) return;
    const index = gameSave.inventory.findIndex((candidate) => candidate.id === item.id);
    if (index < 0) return;
    gameSave.inventory.splice(index, 1);
    gameSave.coins += value;
    saveGame(gameSave);
    selectedItemId = null;
    itemDetail.classList.remove('show');
    updateWalletUi();
    renderInventory();
  }, eventOptions);
  button.addEventListener('click', reset, eventOptions);
  stageUnlockClose.addEventListener('click', () => {
    stageUnlockOverlay.classList.remove('show');
    stageUnlockOverlay.setAttribute('aria-hidden', 'true');
    const next = pendingStageUnlockFinish;
    pendingStageUnlockFinish = null;
    if (next) next();
  }, eventOptions);
  resultRetryButton.addEventListener('click', reset, eventOptions);
  resultHomeButton.addEventListener('click', () => { resultPanel.classList.remove('show'); showHome(); }, eventOptions);
  rewardDoubleButton.addEventListener('click', () => {
    // Placeholder only. Replace this body with rewarded-ad SDK launch, then call applyRewardedCoinDouble() on success.
  }, eventOptions);
  function rollResultDropAutomatically(): void {
    if (!resultShown || resultDropRolled) return;
    resultDropRolled = true;
    const chance = Math.max(0, currentDropChance());
    if (gameSave.inventory.length >= CONFIG.inventoryCapacity) {
      dropResult.className = 'drop-result no-drop';
      dropResult.textContent = 'インベントリが100 / 100です。装備抽選は保留されません。';
      return;
    }

    // No sub-100 threshold is guaranteed: 75% is exactly a 75% roll.
    // At 100%+ only whole 100% blocks are guaranteed; overflow remains an ordinary probability roll.
    const guaranteed = Math.floor(chance);
    const fractional = chance - guaranteed;
    let dropCount = guaranteed + (Math.random() < fractional ? 1 : 0);
    if (chance > 0 && chance < 1 && dropCount === 0) {
      dropResult.className = 'drop-result no-drop';
      dropResult.textContent = 'NO DROP';
      return;
    }
    dropCount = Math.min(dropCount, CONFIG.inventoryCapacity - gameSave.inventory.length);
    if (dropCount <= 0) {
      dropResult.className = 'drop-result no-drop';
      dropResult.textContent = chance <= 0 ? '抽選条件なし' : 'インベントリがいっぱいです。';
      return;
    }

    const drops: EquipmentItem[] = [];
    for (let i = 0; i < dropCount; i++) {
      const item = generateEquipment();
      if (!addEquipmentToInventory(item)) break;
      drops.push(item);
    }
    if (!drops.length) {
      dropResult.className = 'drop-result no-drop';
      dropResult.textContent = 'インベントリがいっぱいです。';
      return;
    }
    dropResult.className = 'drop-result got';
    dropResult.innerHTML = drops.map((item) =>
      `<div class="drop-item ${rarityClass(item.rarity)}"><span>${SLOT_META[item.slot].icon}</span><b>${itemDisplayName(item)}</b><small>${item.abilities.map((a) => `${ABILITY_META[a.id].label} +${a.value}%`).join(' / ')}</small></div>`
    ).join('');
  }

  function onSurfaceContact(result: SurfaceContact): void {
    if (phase !== 'flying' || !groundEntities.has(result.other)) return;
    const topContact = result.contacts.some((contact) => Math.abs(contact.normal.y) > 0.55);
    if (!topContact) return;
    touchingGround = true;
    touchedGround = true;
    jetActiveSeconds = 0;
  }
  collision.on('contact', onSurfaceContact);
  collision.on('collisionstart', onSurfaceContact);
  collision.on('collisionend', (other: pc.Entity) => {
    if (groundEntities.has(other)) touchingGround = false;
  });

  function currentDropChance(): number {
    // Contributions can exceed 100%, but there is no hidden guarantee below 100%.
    // Ring and sign play are the main paths; window-smashes are bonuses rather than requirements.
    return hitCount * 0.06 + techniqueSigns * 0.10 + techniqueWindows * 0.20 + techniqueFountains * 0.35 + techniqueTower * 0.35;
  }

  function showMilestoneBanner(kind: 'complete' | 'overshoot', goal: MilestoneGoal, unlockedNext = false): void {
    milestoneBanner.classList.remove('show', 'complete', 'overshoot');
    // Restart the CSS animation even if the player retries immediately.
    void milestoneBanner.offsetWidth;
    milestoneBanner.classList.add('show', kind);
    milestoneBannerTitle.textContent = kind === 'complete' ? 'MISSION COMPLETE' : 'OVER SHOOT';
    milestoneBannerSubtitle.textContent = kind === 'complete'
      ? `${goal.z}m ${goal.label}${unlockedNext ? ' / NEXT AREA UNLOCKED' : ' / GOAL HIT'}`
      : `${goal.z}m ${goal.label} に直接ぶつかれ！`;
    milestoneBanner.setAttribute('aria-hidden', 'false');
  }

  function grantFirstClearEquipment(goalZ: number): EquipmentItem | null {
    const milestoneKey = goalZ === 5000 ? 'tokyo-5000-legendary' : '';
    if (!milestoneKey || gameSave.claimedMilestones.includes(milestoneKey)) return null;
    if (gameSave.inventory.length >= CONFIG.inventoryCapacity) return null;
    const reward = generateEquipment('legendary');
    gameSave.inventory.push(reward);
    gameSave.claimedMilestones.push(milestoneKey);
    return reward;
  }

  function finish(label: string, text: string, success = false, goalBonus = CONFIG.goalCoinBonus): void {
    if (resultShown) return;
    resultShown = true;
    finalDistanceBonus = Math.floor(distance / CONFIG.distanceCoinStep) * CONFIG.distanceCoinValue;
    finalGoalBonus = success ? goalBonus : 0;
    playCoins += finalDistanceBonus + finalGoalBonus;
    gameSave.coins += playCoins;
    saveGame(gameSave);
    updateWalletUi();
    coinCountText.textContent = String(playCoins);
    releasePointer();
    pressedKeys.clear();
    steerText.textContent = '中立';
    jetActiveSeconds = 0;
    diveText.textContent = jetAvailable ? '1 / 1' : '0 / 1';
    jetButton.disabled = true;
    setPhase('finished');
    app.timeScale = 0;
    stateText.textContent = label;
    distanceText.textContent = formatDistance(distance);
    message.textContent = success ? `${text} 帰宅ボーナス +${goalBonus}！` : text;
    playerHud.style.display = 'none';
    if (success) root!.dataset.result = 'success';
    resultKicker.textContent = success ? 'GOAL' : 'RESULT';
    resultTitle.textContent = success ? '帰宅成功！' : '今回の記録';
    resultDistance.textContent = formatDistance(distance);
    resultAirCoins.textContent = String(airCoinValue);
    resultRingCoins.textContent = String(ringCoinValue);
    resultDistanceCoins.textContent = String(finalDistanceBonus);
    resultGoalCoins.textContent = String(finalGoalBonus);
    resultRings.textContent = `${hitCount} / ${rings.length}`;
    resultTotal.textContent = String(playCoins);
    const chance = currentDropChance();
    dropChanceText.textContent = `${Math.round(chance * 100)}%`;
    dropBreakdown.textContent = `リング ${hitCount}×6% / 看板 ${techniqueSigns}×10% / 窓抜け ${techniqueWindows}×20% / 噴水 ${techniqueFountains}×35% / タワー ${techniqueTower}×35%`;
    dropRollButton.disabled = true;
    dropResult.className = 'drop-result';
    dropResult.textContent = '自動抽選中…';
    resultPanel.classList.add('show');
    // Result drop is automatic. 75% remains a 75% roll; guarantees begin only at each full 100% block.
    rollResultDropAutomatically();
  }

  app.on('update', () => {
    updateKeyboardLaunchAim();
    if (phase === 'aiming') updateSwingMeter();
  });

  app.on('update', (dt: number) => {
    if (phase !== 'flying' || dt <= 0) return;
    refreshSupport();
    updateAirSteering(dt);
    updateRocketPitch(dt);
    updateRivals(dt);
    updateBreakables(dt);
    updateFountains();
    updateTowerPass();
    updateMovingObstacles(dt);
    updateRings();
    updateCoins();
    updateCoinEffects(dt);
    updateRingEffects(dt);
    updateFuelAndForwardSpeed(dt);
    updateGroundSlide(dt);
    updateCamera(dt);
    updatePlayerShadow();
    updatePlayerHud();
    elapsed += dt;

    const p = ball.getPosition();
    const clearance = heightAboveSurface();
    const velocity = body.linearVelocity;
    distance = Math.max(distance, p.z - origin.z, 0);
    uiElapsed += dt;
    if (uiElapsed >= 0.08) {
      distanceText.textContent = formatDistance(distance);
      heightText.textContent = clearance.toFixed(1);
      stateText.textContent = touchingGround ? '滑走中' : jetActiveSeconds > 0 ? 'JET!' : fuelSeconds > 0 ? '推進中' : '惰性飛行';
      const fuelPercent = Math.round(clamp(fuelSeconds / effectiveRingFuel(), 0, 1) * 100);
      targetStatusText.textContent = `燃料 ${fuelPercent}%`;
      updateFlightReadouts();
      uiElapsed = 0;
    }

    stillTime = touchedGround && touchingGround && velocity.length() < CONFIG.stopSpeed
      ? stillTime + dt : 0;

    let hitGoal: MilestoneGoal | null = null;
    for (const goal of milestoneGoals) {
      if (goal.z > gameSave.tokyoUnlockedDistance) continue;
      if (segmentIntersectsGoal(goal, previousPosition, p)) { hitGoal = goal; break; }
    }
    previousPosition.copy(p);

    if (hitGoal) {
      const wasCurrentLockedGoal = hitGoal.z === gameSave.tokyoUnlockedDistance;
      const wasStage2Unlocked = gameSave.stage2Unlocked;
      if (hitGoal.z === 1500 && gameSave.tokyoUnlockedDistance < 3000) gameSave.tokyoUnlockedDistance = 3000;
      if (hitGoal.z === 3000 && gameSave.tokyoUnlockedDistance < 5000) gameSave.tokyoUnlockedDistance = 5000;
      let milestoneReward: EquipmentItem | null = null;
      if (hitGoal.z === 5000) {
        gameSave.tokyoUnlockedDistance = 10000;
        gameSave.stage2Unlocked = true;
        milestoneReward = grantFirstClearEquipment(5000);
      }
      saveGame(gameSave);
      updateKeepOutGates();
      updateStageSelectUi();
      updateShopUi();
      targetStatusText.textContent = `${hitGoal.label} 到着！`;
      const rewardText = milestoneReward ? ` 初回報酬：${itemDisplayName(milestoneReward)}獲得！` : '';
      const unlockText = wasCurrentLockedGoal ? ' 次の区間を解放。' : '';
      const completeResult = () => finish('帰宅成功！', `${hitGoal.z}m ${hitGoal.label} に到着。${unlockText}${rewardText}`, true, hitGoal.reward);

      if (hitGoal.z === 5000 && !wasStage2Unlocked) {
        // Stage unlock is a major event: show it BEFORE the result screen, not after it.
        setPhase('finished');
        app.timeScale = 0;
        releasePointer();
        jetButton.disabled = true;
        playerHud.style.display = 'none';
        stageUnlockReward.textContent = milestoneReward ? `初回報酬：${itemDisplayName(milestoneReward)}` : '';
        stageUnlockOverlay.classList.add('show');
        stageUnlockOverlay.setAttribute('aria-hidden', 'false');
        pendingStageUnlockFinish = completeResult;
      } else {
        showMilestoneBanner('complete', hitGoal, wasCurrentLockedGoal);
        completeResult();
      }
    } else if (p.z > gameSave.tokyoUnlockedDistance + 45 && gameSave.tokyoUnlockedDistance <= 5000) {
      const missedGoal = milestoneGoals.find((goal) => goal.z === gameSave.tokyoUnlockedDistance);
      if (missedGoal) showMilestoneBanner('overshoot', missedGoal);
      finish('OVER SHOOT', `${gameSave.tokyoUnlockedDistance}mの家に直接ぶつかると次の区間が解放されます。`);
    } else if (stillTime >= CONFIG.stopDuration) {
      heightText.textContent = clearance.toFixed(1);
      targetStatusText.textContent = 'RESULT';
      finish('停止', `${formatDistance(distance)} 進みました。`);
    } else if (p.y < groundSurfaceYAt(p.z) - 15 || Math.abs(p.x) > corridorHalfWidthAt(p.z) + 10 || p.z < -35 || p.z > CONFIG.courseLength + 40) {
      finish('コース外', `${formatDistance(distance)} 進みました。`);
    } else if (elapsed >= CONFIG.safetySeconds) {
      finish('テスト終了', `${formatDistance(distance)} 進みました。`);
    }
  });

  function resize(): void {
    cancelAim();
    app.resizeCanvas(Math.max(1, root!.clientWidth), Math.max(1, root!.clientHeight));
  }
  const observer = new ResizeObserver(resize);
  observer.observe(root!);
  resize();
  disposeListeners = () => {
    listeners.abort();
    releasePointer();
    observer.disconnect();
    collision.off('contact');
    collision.off('collisionstart');
    collision.off('collisionend');
    pressedKeys.clear();
  };
  reset();
  updateWalletUi();
  showHome();
}

void start().catch((error: unknown) => {
  if (disposed) return;
  console.error(error);
  root!.dataset.phase = 'error';
  stateText.textContent = 'エラー';
  message.textContent = error instanceof Error ? error.message : String(error);
  message.classList.add('error');
  button.disabled = true;
  disposeListeners?.();
  application?.destroy();
  application = undefined;
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    disposed = true;
    disposeListeners?.();
    application?.destroy();
    application = undefined;
  });
}
