/* ═══════════════════════════════════════════════════════════════
   EMERGENT CIVILIZATION SANDBOX
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 0 — CONSTANTS & CONFIG
   ═══════════════════════════════════════════════════════════════ */

const CFG = {
  WORLD_W: 40,
  WORLD_H: 30,
  TILE_SIZE: 20,

  // Tick speeds (ms per tick)
  TICK_MS: { 0: Infinity, 1: 1000, 5: 200, 10: 100 },

  // Tile generation densities
  DENSITY: { MOUNTAIN: 0.15, FOREST: 0.15, WATER: 0.10 },
  FARMLAND_INIT_RATIO: 0.20,   // 20% of grass tiles start as farmland
  FARMLAND_CAP: 0.40,          // max 40% of (grass+farmland) can be farmland

  // Tile resource amounts
  RESOURCE_AMOUNT: { forest: 50, mountain: 120 },

  // Forest / farmland dynamics
  REGEN: {
    forest:   { interval: 50,  chance: 0.05 },
    farmland: { interval: 100, chance: 0.01 }
  },

  // Clan starting resources
  START_RESOURCES: { food: 120, wood: 40, stone: 20, gold: 10 },

  // Economy: consumption & upkeep so resources oscillate (visible up/down)
  FOOD_PER_POP_PER_TICK: 1.15,
  WOOD_UPKEEP_PER_POP: 0.15,
  STONE_UPKEEP_PER_POP: 0.04,
  STORAGE_BASE_CAP: 200,

  // Minimum fraction of population always assigned to farming (labor demand floor)
  MIN_FARMING_FRACTION: 0.20,

  // Agent count per clan (Phase 1: 1 clan)
  AGENTS_PER_CLAN: 10,

  // Task lock duration (ticks before re-evaluate)
  TASK_LOCK_TICKS: 10,

  // Memory size per agent
  MEMORY_SIZE: 20,

  // Max log entries shown
  LOG_MAX: 80,

  // Political simulation — ideology evolution (resource deltas, EMA)
  IDEOLOGY_EVOLVE_RATE: 0.02,
  IDEOLOGY_SMOOTHING_ALPHA: 0.1,
  IDEOLOGY_MIN_WEIGHT: 0.05,

  // Leader = agent with highest influence; reassign every N ticks
  LEADER_REASSIGN_INTERVAL: 50,

  // Influence & wealth: small gains on success so inequality/loyalty are gradual
  INFLUENCE_GAIN_ON_SUCCESS: 0.1,
  WEALTH_SHARE_ON_GATHER: 0.05,

  // Loyalty from inequality: k very small so drop is gradual (no revolution spiral)
  LOYALTY_INEQUALITY_RATE: 0.02,
};

const TILE_COLORS = {
  grass:    '#2d5a1b',
  forest:   '#1a3d0f',
  mountain: '#5a5248',
  water:    '#1a3a5c',
  farmland: '#6b8c3a',
};

const TILE_COLORS_LIGHT = {
  grass:    '#3a7a24',
  forest:   '#255c18',
  mountain: '#7a6e68',
  water:    '#2a5c8c',
  farmland: '#8ab84e',
};

const BUILDING_TYPES = {
  TOWN_HALL: {
    name: 'Town Hall', icon: '🏛️',
    cost:    { wood: 30, stone: 20 },
    upkeep:  {},
    provides: { admin: 10, housing: 5 },
    workerSlots: 2,
    tileReq: 'grass',
    unique: true
  },
  HOUSE: {
    name: 'House', icon: '🏠',
    cost:    { wood: 10, stone: 5 },
    upkeep:  {},
    provides: { housing: 3 },
    workerSlots: 0,
    tileReq: 'grass'
  },
  FARM: {
    name: 'Farm', icon: '🌾',
    cost:    { wood: 5 },
    upkeep:  {},
    produces: { food: 2 },
    workerSlots: 3,
    tileReq: 'farmland'
  },
  LUMBER_CAMP: {
    name: 'Lumber Camp', icon: '🪓',
    cost:    { wood: 8, stone: 5 },
    upkeep:  { food: 1 },
    produces: { wood: 2 },
    workerSlots: 3,
    tileReq: 'forest'
  },
  MINE: {
    name: 'Mine', icon: '⛏️',
    cost:    { wood: 15, stone: 10 },
    upkeep:  { food: 1 },
    produces: { stone: 2, gold: 1 },
    workerSlots: 3,
    tileReq: 'mountain'
  },
  BARRACKS: {
    name: 'Barracks', icon: '🏰',
    cost:    { wood: 20, stone: 15, gold: 10 },
    upkeep:  { food: 2 },
    provides: { military: 5 },
    workerSlots: 4,
    tileReq: 'grass'
  },
  MARKET: {
    name: 'Market', icon: '🏪',
    cost:    { wood: 15, stone: 10, gold: 5 },
    upkeep:  { food: 1 },
    provides: { trade: 5 },
    produces: { gold: 1 },
    workerSlots: 2,
    tileReq: 'grass'
  },
  WATCHTOWER: {
    name: 'Watchtower', icon: '🗼',
    cost:    { wood: 12, stone: 8 },
    upkeep:  { food: 1 },
    provides: { visionRadius: 5, defense: 3 },
    workerSlots: 1,
    tileReq: 'grass'
  },
  STOREHOUSE: {
    name: 'Storehouse', icon: '🏗️',
    cost:    { wood: 10, stone: 10 },
    upkeep:  {},
    provides: { storageBonus: 100 },
    workerSlots: 1,
    tileReq: 'grass'
  },
  FORGE: {
    name: 'Forge', icon: '🔥',
    cost:    { wood: 20, stone: 25, gold: 15 },
    upkeep:  { food: 1, wood: 1 },
    provides: { techBonus: 0.2 },
    workerSlots: 2,
    tileReq: 'grass',
    requires: { MINE: 1 }
  },
  TEMPLE: {
    name: 'Temple', icon: '⛩️',
    cost:    { wood: 15, stone: 20, gold: 10 },
    upkeep:  { food: 1 },
    provides: { loyaltyAura: 15, influenceRadius: 3 },
    workerSlots: 2,
    tileReq: 'grass'
  },
  WALL: {
    name: 'Wall', icon: '🧱',
    cost:    { stone: 10 },
    upkeep:  {},
    provides: { defense: 5 },
    workerSlots: 0,
    tileReq: 'any'
  }
};

const ACTIONS = ['gather_food','gather_wood','gather_stone','gather_gold',
                  'build','fight','trade','rest','patrol'];

const IDEOLOGY_COLORS = {
  expansion: '#d94a4a',
  defense:   '#4a90d9',
  economy:   '#d9a04a',
  tech:      '#9b4ad9',
};

const CLAN_COLORS = ['#e05252','#52a0e0','#52e07a','#e0a052','#a052e0','#e0e052'];

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 1 — UTILITIES
   ═══════════════════════════════════════════════════════════════ */

// Seeded LCG RNG — deterministic, no external deps
function makeRNG(seed) {
  let s = seed >>> 0;
  return {
    next() {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 4294967296;
    },
    range(min, max) { return min + this.next() * (max - min); },
    int(min, max)   { return Math.floor(this.range(min, max + 1)); },
    pick(arr)       { return arr[Math.floor(this.next() * arr.length)]; },
    bool(p = 0.5)   { return this.next() < p; },
    getState()      { return s >>> 0; },
    setState(nextState) { s = (nextState >>> 0); },
  };
}

// Simple 2D value noise (smooth, no deps)
function makeNoise2D(seed) {
  const rng = makeRNG(seed);
  const PERM_SIZE = 256;
  const perm = new Uint8Array(PERM_SIZE);
  for (let i = 0; i < PERM_SIZE; i++) perm[i] = i;
  for (let i = PERM_SIZE - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const grad = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  function dot(g, x, y) { return g[0]*x + g[1]*y; }
  function fade(t) { return t*t*t*(t*(t*6-15)+10); }
  function lerp(a, b, t) { return a + t*(b-a); }
  return function(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[(perm[X]+Y)&255] & 7;
    const ab = perm[(perm[X]+Y+1)&255] & 7;
    const ba = perm[(perm[X+1]+Y)&255] & 7;
    const bb = perm[(perm[X+1]+Y+1)&255] & 7;
    return (lerp(lerp(dot(grad[aa],xf,yf), dot(grad[ba],xf-1,yf),u),
                 lerp(dot(grad[ab],xf,yf-1),dot(grad[bb],xf-1,yf-1),u), v) + 1) / 2;
  };
}

// Sigmoid curve — S-shaped, 0→1 as ratio goes 0→2
function sigmoid(ratio, steepness = 5, center = 0.5) {
  return 1 / (1 + Math.exp(steepness * (ratio - center)));
}

// Clamp
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Manhattan distance
function dist(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

// Hex to rgba
function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Get 4 orthogonal neighbors within bounds
function neighbors4(x, y, w, h) {
  const out = [];
  if (x > 0)   out.push({x: x-1, y});
  if (x < w-1) out.push({x: x+1, y});
  if (y > 0)   out.push({x, y: y-1});
  if (y < h-1) out.push({x, y: y+1});
  return out;
}

// Unique ID generator
let _uid = 0;
function uid() { return ++_uid; }

const SAVE_STORAGE_KEY = 'emergent-civilization-save-v1';
const SAVE_VERSION = 1;
const SAVE_EVERY_TICKS = 5;
const DEFAULT_IDEOLOGY = { expansion: 0.25, defense: 0.25, economy: 0.25, tech: 0.25 };

function normalizeIdeologyWeights(input) {
  const base = { ...DEFAULT_IDEOLOGY };
  if (input && typeof input === 'object') {
    for (const key of Object.keys(base)) {
      const v = Number(input[key]);
      if (Number.isFinite(v)) base[key] = Math.max(0, v);
    }
  }
  const total = Object.values(base).reduce((a, b) => a + b, 0);
  if (total <= 0) return { ...DEFAULT_IDEOLOGY };
  for (const key of Object.keys(base)) base[key] /= total;
  return base;
}

function serializeWorld(world, meta = {}) {
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    uidCounter: _uid,
    meta: {
      speedKey: Number.isFinite(meta.speedKey) ? meta.speedKey : 1,
      camera: meta.camera ? {
        x: Number(meta.camera.x) || 0,
        y: Number(meta.camera.y) || 0,
        scale: Number(meta.camera.scale) || 1
      } : null,
    },
    world: {
      width: world.width,
      height: world.height,
      seed: world.seed,
      tick: world.tick,
      taxRate: world.taxRate,
      productionBonus: world.productionBonus,
      mode: world.mode,
      events: world.events,
      rngState: typeof world.rng?.getState === 'function' ? world.rng.getState() : null,
      tiles: world.tiles.map(row => row.map(tile => ({
        type: tile.type,
        fertility: tile.fertility ?? 0,
        resource: {
          type: tile.resource?.type ?? null,
          amount: tile.resource?.amount ?? 0,
        },
        influence: { ...(tile.influence ?? {}) },
        buildingId: tile.building?.id ?? null,
      }))),
      buildings: [...world.buildings.values()].map(b => ({
        id: b.id,
        type: b.type,
        clanId: b.clanId,
        level: b.level,
        pos: { x: b.pos?.x ?? 0, y: b.pos?.y ?? 0 },
        hp: b.hp,
        maxHp: b.maxHp,
        workerSlots: b.workerSlots,
        workers: [...(b.workers ?? [])],
      })),
      clans: [...world.clans.values()].map(clan => ({
        id: clan.id,
        name: clan.name,
        color: clan.color,
        ideology: { ...clan.ideology },
        resources: { ...clan.resources },
        resourcesAtTickStart: clan.resourcesAtTickStart ? { ...clan.resourcesAtTickStart } : null,
        ideologySuccessSmoothed: { ...(clan.ideologySuccessSmoothed ?? clan.ideology) },
        resourceTarget: { ...clan.resourceTarget },
        territory: [...(clan.territory ?? [])],
        techTree: {
          unlocked: [...(clan.techTree?.unlocked ?? [])],
          research: clan.techTree?.research ?? null,
        },
        influenceMap: clan.influenceMap instanceof Map ? [...clan.influenceMap.entries()] : [],
        leader: clan.leader ?? null,
        leaderId: clan.leaderId ?? null,
        allies: [...(clan.allies ?? [])],
        reputation: clan.reputation ?? 50,
        agentIds: [...(clan.agentIds ?? [])],
        buildQueue: (clan.buildQueue ?? []).map(job => ({
          type: job.type,
          pos: { x: job.pos?.x ?? 0, y: job.pos?.y ?? 0 },
        })),
        laborDemand: { ...(clan.laborDemand ?? {}) },
        assignedCount: { ...(clan.assignedCount ?? {}) },
        storageBonus: clan.storageBonus ?? 0,
        territorySizeAtTickStart: clan.territorySizeAtTickStart ?? null,
      })),
      agents: [...world.agents.values()].map(agent => ({
        id: agent.id,
        clanId: agent.clanId,
        pos: { x: agent.pos?.x ?? 0, y: agent.pos?.y ?? 0 },
        targetPos: agent.targetPos ? { x: agent.targetPos.x, y: agent.targetPos.y } : null,
        skills: { ...(agent.skills ?? {}) },
        personality: { ...(agent.personality ?? {}) },
        loyalty: agent.loyalty ?? 50,
        wealth: agent.wealth ?? 0,
        fatigue: agent.fatigue ?? 0,
        influence: agent.influence ?? 0,
        memory: (agent.memory ?? []).map(m => ({
          action: m.action,
          success: !!m.success,
          tick: m.tick ?? 0,
        })),
        state: agent.state ?? 'idle',
        currentAction: agent.currentAction ?? null,
        taskLock: agent.taskLock ? {
          action: agent.taskLock.action,
          lockedUntilTick: agent.taskLock.lockedUntilTick,
        } : null,
        path: (agent.path ?? []).map(p => ({ x: p.x, y: p.y })),
      })),
    },
  };
}

function deserializeWorld(payload) {
  if (!payload || payload.version !== SAVE_VERSION || !payload.world) return null;

  const raw = payload.world;
  const width = Number(raw.width);
  const height = Number(raw.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return null;
  if (!Array.isArray(raw.tiles) || raw.tiles.length !== height) return null;

  const seed = Number.isFinite(Number(raw.seed)) ? Number(raw.seed) : 42;
  const world = {
    width,
    height,
    tiles: [],
    clans: new Map(),
    agents: new Map(),
    buildings: new Map(),
    tick: Number.isFinite(Number(raw.tick)) ? Number(raw.tick) : 0,
    events: Array.isArray(raw.events) ? raw.events : [],
    rng: makeRNG(seed + 1),
    seed,
    taxRate: Number.isFinite(Number(raw.taxRate)) ? Number(raw.taxRate) : 0.10,
    productionBonus: Number.isFinite(Number(raw.productionBonus)) ? Number(raw.productionBonus) : 0,
    mode: raw.mode === 'intervene' ? 'intervene' : 'observer',
  };
  if (Number.isInteger(raw.rngState) && typeof world.rng.setState === 'function') {
    world.rng.setState(raw.rngState);
  }

  const validTileTypes = new Set(['grass', 'forest', 'mountain', 'water', 'farmland']);
  for (let y = 0; y < height; y++) {
    const row = raw.tiles[y];
    if (!Array.isArray(row) || row.length !== width) return null;
    world.tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const savedTile = row[x] ?? {};
      const type = validTileTypes.has(savedTile.type) ? savedTile.type : 'grass';
      const tile = createTile(x, y, type);
      tile.fertility = Number.isFinite(Number(savedTile.fertility)) ? Number(savedTile.fertility) : tile.fertility;
      const amount = Number(savedTile.resource?.amount);
      tile.resource = {
        type: savedTile.resource?.type ?? tile.resource.type,
        amount: Number.isFinite(amount) ? amount : tile.resource.amount,
      };
      tile.influence = savedTile.influence && typeof savedTile.influence === 'object' ? { ...savedTile.influence } : {};
      tile.building = null;
      tile.occupants = [];
      world.tiles[y][x] = tile;
    }
  }

  if (Array.isArray(raw.buildings)) {
    for (const savedB of raw.buildings) {
      if (!savedB || !BUILDING_TYPES[savedB.type]) continue;
      const id = Number(savedB.id);
      const clanId = Number(savedB.clanId);
      const posX = Number(savedB.pos?.x);
      const posY = Number(savedB.pos?.y);
      if (!Number.isFinite(id) || !Number.isFinite(clanId) || !Number.isFinite(posX) || !Number.isFinite(posY)) continue;
      const b = {
        id,
        type: savedB.type,
        clanId,
        level: Number.isFinite(Number(savedB.level)) ? Number(savedB.level) : 1,
        pos: { x: posX, y: posY },
        hp: Number.isFinite(Number(savedB.hp)) ? Number(savedB.hp) : 100,
        maxHp: Number.isFinite(Number(savedB.maxHp)) ? Number(savedB.maxHp) : 100,
        workerSlots: Number.isFinite(Number(savedB.workerSlots)) ? Number(savedB.workerSlots) : (BUILDING_TYPES[savedB.type].workerSlots ?? 0),
        workers: Array.isArray(savedB.workers) ? [...savedB.workers] : [],
      };
      world.buildings.set(b.id, b);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const savedTile = raw.tiles[y][x];
      const bId = Number(savedTile?.buildingId);
      if (!Number.isFinite(bId)) continue;
      const building = world.buildings.get(bId);
      if (building) world.tiles[y][x].building = building;
    }
  }
  for (const b of world.buildings.values()) {
    const tile = world.tiles[b.pos.y]?.[b.pos.x];
    if (tile) tile.building = b;
  }

  const numOr = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  if (Array.isArray(raw.clans)) {
    for (const savedClan of raw.clans) {
      const clanId = Number(savedClan?.id);
      if (!Number.isFinite(clanId)) continue;
      const ideology = normalizeIdeologyWeights(savedClan.ideology);
      const smoothed = normalizeIdeologyWeights(savedClan.ideologySuccessSmoothed ?? ideology);
      const clan = {
        id: clanId,
        name: typeof savedClan.name === 'string' ? savedClan.name : `Clan ${clanId}`,
        color: typeof savedClan.color === 'string' ? savedClan.color : CLAN_COLORS[0],
        ideology,
        resources: {
          food:  numOr(savedClan.resources?.food, CFG.START_RESOURCES.food),
          wood:  numOr(savedClan.resources?.wood, CFG.START_RESOURCES.wood),
          stone: numOr(savedClan.resources?.stone, CFG.START_RESOURCES.stone),
          gold:  numOr(savedClan.resources?.gold, CFG.START_RESOURCES.gold),
        },
        resourcesAtTickStart: savedClan.resourcesAtTickStart ? {
          food:  numOr(savedClan.resourcesAtTickStart.food, 0),
          wood:  numOr(savedClan.resourcesAtTickStart.wood, 0),
          stone: numOr(savedClan.resourcesAtTickStart.stone, 0),
          gold:  numOr(savedClan.resourcesAtTickStart.gold, 0),
        } : null,
        ideologySuccessSmoothed: smoothed,
        resourceTarget: {
          food:  numOr(savedClan.resourceTarget?.food, 60),
          wood:  numOr(savedClan.resourceTarget?.wood, 50),
          stone: numOr(savedClan.resourceTarget?.stone, 40),
          gold:  numOr(savedClan.resourceTarget?.gold, 30),
        },
        territory: new Set(Array.isArray(savedClan.territory) ? savedClan.territory : []),
        techTree: {
          unlocked: new Set(Array.isArray(savedClan.techTree?.unlocked) ? savedClan.techTree.unlocked : []),
          research: savedClan.techTree?.research ?? null,
        },
        influenceMap: new Map(Array.isArray(savedClan.influenceMap) ? savedClan.influenceMap : []),
        leader: savedClan.leader ?? null,
        leaderId: savedClan.leaderId ?? null,
        allies: new Set(Array.isArray(savedClan.allies) ? savedClan.allies : []),
        reputation: numOr(savedClan.reputation, 50),
        agentIds: Array.isArray(savedClan.agentIds) ? [...savedClan.agentIds] : [],
        buildQueue: Array.isArray(savedClan.buildQueue) ? savedClan.buildQueue.map(job => ({
          type: job?.type,
          pos: { x: numOr(job?.pos?.x, 0), y: numOr(job?.pos?.y, 0) },
        })) : [],
        laborDemand: savedClan.laborDemand && typeof savedClan.laborDemand === 'object' ? { ...savedClan.laborDemand } : {},
        assignedCount: savedClan.assignedCount && typeof savedClan.assignedCount === 'object' ? { ...savedClan.assignedCount } : {},
        storageBonus: numOr(savedClan.storageBonus, 0),
        territorySizeAtTickStart: savedClan.territorySizeAtTickStart == null ? null : numOr(savedClan.territorySizeAtTickStart, null),
      };
      world.clans.set(clan.id, clan);
    }
  }

  if (Array.isArray(raw.agents)) {
    for (const savedAgent of raw.agents) {
      const id = Number(savedAgent?.id);
      const clanId = Number(savedAgent?.clanId);
      if (!Number.isFinite(id) || !Number.isFinite(clanId)) continue;
      const agent = {
        id,
        clanId,
        pos: {
          x: numOr(savedAgent.pos?.x, 0),
          y: numOr(savedAgent.pos?.y, 0),
        },
        targetPos: savedAgent.targetPos ? {
          x: numOr(savedAgent.targetPos.x, 0),
          y: numOr(savedAgent.targetPos.y, 0),
        } : null,
        skills: {
          build:  numOr(savedAgent.skills?.build, 30),
          gather: numOr(savedAgent.skills?.gather, 30),
          fight:  numOr(savedAgent.skills?.fight, 30),
          trade:  numOr(savedAgent.skills?.trade, 30),
        },
        personality: {
          aggressive:  numOr(savedAgent.personality?.aggressive, 0.5),
          cooperative: numOr(savedAgent.personality?.cooperative, 0.5),
          greedy:      numOr(savedAgent.personality?.greedy, 0.5),
          adaptive:    numOr(savedAgent.personality?.adaptive, 0.5),
        },
        loyalty: numOr(savedAgent.loyalty, 50),
        wealth: numOr(savedAgent.wealth, 0),
        fatigue: numOr(savedAgent.fatigue, 0),
        influence: numOr(savedAgent.influence, 0),
        memory: Array.isArray(savedAgent.memory) ? savedAgent.memory.map(m => ({
          action: m.action,
          success: !!m.success,
          tick: numOr(m.tick, 0),
        })) : [],
        state: typeof savedAgent.state === 'string' ? savedAgent.state : 'idle',
        currentAction: savedAgent.currentAction ?? null,
        taskLock: savedAgent.taskLock ? {
          action: savedAgent.taskLock.action,
          lockedUntilTick: numOr(savedAgent.taskLock.lockedUntilTick, world.tick),
        } : null,
        path: Array.isArray(savedAgent.path) ? savedAgent.path.map(p => ({
          x: numOr(p.x, 0),
          y: numOr(p.y, 0),
        })) : [],
      };
      world.agents.set(agent.id, agent);
    }
  }

  for (const clan of world.clans.values()) {
    clan.agentIds = (clan.agentIds ?? []).filter(agentId => world.agents.has(agentId));
  }
  for (const agent of world.agents.values()) {
    const clan = world.clans.get(agent.clanId);
    if (clan && !clan.agentIds.includes(agent.id)) clan.agentIds.push(agent.id);
  }
  for (const clan of world.clans.values()) {
    if (!world.agents.has(clan.leaderId)) assignLeader(clan, world);
  }

  let maxId = 0;
  for (const id of world.clans.keys()) maxId = Math.max(maxId, id);
  for (const id of world.agents.keys()) maxId = Math.max(maxId, id);
  for (const id of world.buildings.keys()) maxId = Math.max(maxId, id);
  _uid = Math.max(_uid, Number(payload.uidCounter) || 0, maxId);

  return {
    world,
    meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : {},
  };
}

function saveWorldToStorage(world, meta = {}) {
  try {
    const payload = serializeWorld(world, meta);
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('Failed to save world state:', err);
    return false;
  }
}

function loadWorldFromStorage() {
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return deserializeWorld(parsed);
  } catch (err) {
    console.warn('Failed to load world state:', err);
    return null;
  }
}

function clearSavedWorld() {
  try {
    localStorage.removeItem(SAVE_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear saved world state:', err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 2 — WORLD DATA LAYER
   ═══════════════════════════════════════════════════════════════ */

function createTile(x, y, type) {
  const resourceAmounts = {
    forest:   CFG.RESOURCE_AMOUNT.forest,
    mountain: CFG.RESOURCE_AMOUNT.mountain,
    farmland: 9999,   // renewable — never truly depletes
  };
  return {
    x, y,
    type,
    fertility: 0,     // set during world gen for farmland tiles (1.5–3.5)
    resource: {
      type:   type === 'forest'   ? 'wood'  :
              type === 'mountain' ? 'stone' :
              type === 'farmland' ? 'food'  : null,
      amount: resourceAmounts[type] ?? 0
    },
    building: null,
    occupants: [],
    influence: {},   // { [clanId]: 0-1 }
  };
}

function generateWorld(seed) {
  const W = CFG.WORLD_W, H = CFG.WORLD_H;
  const noise = makeNoise2D(seed);
  const rng   = makeRNG(seed + 1);
  const tiles = [];

  // Pass 1: assign tile types via noise
  for (let y = 0; y < H; y++) {
    tiles[y] = [];
    for (let x = 0; x < W; x++) {
      const scale = 0.15;
      const n = noise(x * scale, y * scale);
      // Second octave for detail
      const n2 = noise(x * scale * 3, y * scale * 3) * 0.3;
      const v = clamp(n + n2, 0, 1);

      let type;
      if      (v > 0.72) type = 'mountain';
      else if (v > 0.57) type = 'forest';
      else if (v < 0.22) type = 'water';
      else               type = 'grass';

      tiles[y][x] = createTile(x, y, type);
    }
  }

  // Pass 2: scatter farmland on ~20% of grass tiles
  const grassTiles = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (tiles[y][x].type === 'grass') grassTiles.push(tiles[y][x]);

  const farmCount = Math.floor(grassTiles.length * CFG.FARMLAND_INIT_RATIO);
  // Shuffle and pick first N
  for (let i = grassTiles.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [grassTiles[i], grassTiles[j]] = [grassTiles[j], grassTiles[i]];
  }
  for (let i = 0; i < farmCount; i++) {
    const t = grassTiles[i];
    t.type = 'farmland';
    t.resource.type   = 'food';
    t.resource.amount = 9999;
    // Fertility varies 1.5–3.5 per tile — makes some farmland strategically valuable
    t.fertility = Math.round((1.5 + rng.next() * 2.0) * 10) / 10;
  }

  return {
    width: W,
    height: H,
    tiles,
    clans:     new Map(),
    agents:    new Map(),
    buildings: new Map(),
    tick:      0,
    events:    [],
    rng,
    seed,
    // Intervention settings
    taxRate:        0.10,
    productionBonus: 0,
    mode: 'observer',
  };
}

function getWorldTile(world, x, y) {
  if (x < 0 || y < 0 || x >= world.width || y >= world.height) return null;
  return world.tiles[y][x];
}

function tileKey(x, y) { return `${x},${y}`; }

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 3 — AGENT SYSTEM
   ═══════════════════════════════════════════════════════════════ */

function createVillager(clanId, startPos, rng) {
  return {
    id:      uid(),
    clanId,
    pos:     { x: startPos.x, y: startPos.y },
    targetPos: null,
    // Skills 0-100
    skills: {
      build:  rng.int(10, 80),
      gather: rng.int(10, 80),
      fight:  rng.int(10, 80),
      trade:  rng.int(10, 80),
    },
    // Personality traits 0-1
    personality: {
      aggressive:  rng.range(0, 1),
      cooperative: rng.range(0, 1),
      greedy:      rng.range(0, 1),
      adaptive:    rng.range(0, 1),
    },
    loyalty:   rng.range(50, 100),
    wealth:    rng.range(0, 20),
    fatigue:   0,
    influence: rng.range(0, 10),
    memory:    [],        // { action, outcome, tick }
    state:     'idle',    // idle|moving|gathering|building|fighting|trading|resting
    currentAction: null,
    taskLock: null,       // { action, lockedUntilTick }
    path: [],             // queued movement steps
  };
}

// Add outcome to agent memory (capped at MEMORY_SIZE)
function rememberOutcome(agent, action, success) {
  agent.memory.push({ action, success, tick: 0 });
  if (agent.memory.length > CFG.MEMORY_SIZE) agent.memory.shift();
}

// Memory weight: success rate for this action (0-1), default 0.5 if no data
function memoryWeight(agent, action) {
  const relevant = agent.memory.filter(m => m.action === action);
  if (relevant.length === 0) return 0.5;
  return relevant.filter(m => m.success).length / relevant.length;
}

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 4 — CLAN SYSTEM
   ═══════════════════════════════════════════════════════════════ */

function createClan(name, color, ideologyWeights) {
  // Normalize ideology so it sums to 1
  const total = Object.values(ideologyWeights).reduce((a,b) => a+b, 0);
  const ideology = {};
  for (const k in ideologyWeights) ideology[k] = ideologyWeights[k] / total;

  const res = { ...CFG.START_RESOURCES };

  return {
    id:    uid(),
    name,
    color,
    ideology,
    resources:  { ...res },
    // Snapshot at tick start for resource-delta ideology (set each tick)
    resourcesAtTickStart: null,
    // Smoothed success signal per dimension (EMA of positive resource deltas)
    ideologySuccessSmoothed: { ...ideology },
    // How much the clan "wants" of each resource — scales with population
    resourceTarget: { food: 60, wood: 50, stone: 40, gold: 30 },
    territory:  new Set(),
    techTree:   { unlocked: new Set(), research: null },
    influenceMap: new Map(),
    leader:     null,
    leaderId:   null,
    allies:     new Set(),
    reputation: 50,
    agentIds:   [],
    buildQueue: [],        // [{ type, pos }]
    laborDemand:    {},    // recalculated each tick
    assignedCount:  {},    // reset each tick before agent loop
  };
}

// Recalculate how many workers the clan wants per task
function calcLaborDemand(clan) {
  const res = clan.resources;
  const tgt = clan.resourceTarget;
  const demand = {
    gather_food:  Math.max(CFG.MIN_FARMING_FRACTION, sigmoid(res.food  / tgt.food)),
    gather_wood:  sigmoid(res.wood  / tgt.wood),
    gather_stone: sigmoid(res.stone / tgt.stone),
    gather_gold:  sigmoid(res.gold  / tgt.gold) * 0.5,  // gold less urgent
    build:   clan.buildQueue.length > 0 ? 0.25 : 0.05,
    fight:   clan.ideology.expansion * 0.25,
    trade:   clan.ideology.economy   * 0.15,
    rest:    0.05,
    patrol:  0.05,
  };
  clan.laborDemand = demand;
  // Reset assignment counts
  for (const a of ACTIONS) clan.assignedCount[a] = 0;
}

// Saturation multiplier — penalizes over-assigned actions
function saturationMultiplier(action, clan) {
  const assigned = clan.assignedCount[action] ?? 0;
  const pop      = clan.agentIds.length || 1;
  const wanted   = (clan.laborDemand[action] ?? 0) * pop;
  if (wanted <= 0) return 0.05;
  if (assigned >= wanted * 1.5) return 0.10;
  if (assigned >= wanted)       return 0.50;
  if (assigned >= wanted * 0.8) return 0.80;
  return 1.0;
}

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 5 — DECISION ENGINE
   ═══════════════════════════════════════════════════════════════ */

// How well does this action align with clan ideology?
function ideologyAlignment(action, ideology) {
  const map = {
    gather_food:  ideology.economy   * 0.5 + ideology.defense * 0.3,
    gather_wood:  ideology.economy   * 0.4 + ideology.tech    * 0.3,
    gather_stone: ideology.defense   * 0.4 + ideology.tech    * 0.4,
    gather_gold:  ideology.economy   * 0.7,
    build:        ideology.defense   * 0.5 + ideology.tech    * 0.4,
    fight:        ideology.expansion * 0.8 + ideology.defense * 0.2,
    trade:        ideology.economy   * 0.8,
    rest:         0.2,
    patrol:       ideology.defense   * 0.6 + ideology.expansion * 0.3,
  };
  return clamp(map[action] ?? 0.1, 0, 1);
}

// How does personality bias this action?
function personalityBias(action, p) {
  const map = {
    gather_food:  p.cooperative * 0.5 + (1 - p.greedy) * 0.3,
    gather_wood:  p.cooperative * 0.4,
    gather_stone: p.cooperative * 0.3,
    gather_gold:  p.greedy      * 0.8,
    build:        p.cooperative * 0.6 + p.adaptive * 0.3,
    fight:        p.aggressive  * 0.9,
    trade:        p.greedy      * 0.5 + p.adaptive  * 0.4,
    rest:         p.adaptive    * 0.3,
    patrol:       p.aggressive  * 0.5 + (1 - p.greedy) * 0.2,
  };
  return clamp(map[action] ?? 0.1, 0, 1);
}

// Clan-level pressure (e.g. under attack → fight scores higher)
function clanPressure(action, clan) {
  const r = clan.resources;
  const critical = (r.food < 10 || r.wood < 5) ? 0.8 : 0;
  const map = {
    gather_food:  r.food  < 15 ? 0.9 : 0.1,
    gather_wood:  r.wood  < 10 ? 0.7 : 0.1,
    gather_stone: r.stone < 10 ? 0.5 : 0.1,
    gather_gold:  r.gold  < 5  ? 0.4 : 0.1,
    build:   clan.buildQueue.length > 0 ? 0.6 : 0.05,
    fight:   0.2,
    trade:   r.gold > 20 ? 0.5 : 0.1,
    rest:    0.1,
    patrol:  0.15,
  };
  return clamp((map[action] ?? 0.1) + critical * 0.1, 0, 1);
}

// Seeded per-agent noise — small random perturbation
function agentNoise(agentId, tick) {
  const s = ((agentId * 2654435769) ^ (tick * 40503)) >>> 0;
  return ((s * 1664525 + 1013904223) >>> 0) / 4294967296 * 0.10;
}

// Master scoring function
function scoreAction(action, villager, clan, world) {
  const need     = sigmoid(clan.resources[action.replace('gather_','')] / (clan.resourceTarget[action.replace('gather_','')] || 1));
  const ideol    = ideologyAlignment(action, clan.ideology);
  const personal = personalityBias(action, villager.personality);
  const pressure = clanPressure(action, clan);
  const mem      = memoryWeight(villager, action);
  const noise    = agentNoise(villager.id, world.tick);
  const sat      = saturationMultiplier(action, clan);

  return sat * (
    need     * 0.25 +
    ideol    * 0.20 +
    personal * 0.20 +
    pressure * 0.15 +
    mem      * 0.10 +
    noise
  );
}

// Pick best action for a villager
function decideAction(villager, clan, world) {
  let bestAction = 'rest', bestScore = -1;
  for (const action of ACTIONS) {
    const s = scoreAction(action, villager, clan, world);
    if (s > bestScore) { bestScore = s; bestAction = action; }
  }
  return bestAction;
}

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 6 — TICK ENGINE
   ═══════════════════════════════════════════════════════════════ */

// Find nearest tile of a given type reachable by agent
function findNearestTile(pos, type, world) {
  let best = null, bestD = Infinity;
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const t = world.tiles[y][x];
      // Farmland is walkable even with a Farm building on it
      const buildingOk = type === 'farmland' ? true : !t.building;
      if (t.type === type && t.resource.amount > 0 && buildingOk) {
        const d = dist(pos, {x, y});
        if (d < bestD) { bestD = d; best = t; }
      }
    }
  }
  return best;
}

// Move agent one step toward target
function stepToward(agent, target) {
  if (!target) return;
  const dx = target.x - agent.pos.x;
  const dy = target.y - agent.pos.y;
  if (dx === 0 && dy === 0) return;
  if (Math.abs(dx) >= Math.abs(dy)) {
    agent.pos.x += Math.sign(dx);
  } else {
    agent.pos.y += Math.sign(dy);
  }
}

// Execute a single agent's turn
function processAgent(agent, world) {
  const clan = world.clans.get(agent.clanId);
  if (!clan) return;

  // Fatigue recovery when resting
  if (agent.state === 'resting') {
    agent.fatigue = Math.max(0, agent.fatigue - 5);
  }

  // Check task lock
  if (agent.taskLock && world.tick < agent.taskLock.lockedUntilTick) {
    // Continue current task
    executeTask(agent, agent.taskLock.action, clan, world);
    return;
  }

  // Re-evaluate: pick new action (labor demand already set at tick start)
  const action = decideAction(agent, clan, world);
  agent.currentAction = action;
  clan.assignedCount[action] = (clan.assignedCount[action] ?? 0) + 1;

  agent.taskLock = { action, lockedUntilTick: world.tick + CFG.TASK_LOCK_TICKS };
  executeTask(agent, action, clan, world);
}

function executeTask(agent, action, clan, world) {
  agent.fatigue = Math.min(100, agent.fatigue + 0.5);

  if (action === 'rest') {
    agent.state = 'resting';
    return;
  }

  if (action === 'patrol') {
    agent.state = 'moving';
    // Random walk within territory
    const keys = [...clan.territory];
    if (keys.length) {
      const [tx, ty] = (world.rng.pick(keys) || '0,0').split(',').map(Number);
      stepToward(agent, { x: tx, y: ty });
    }
    return;
  }

  // Gather actions
  const gatherMap = {
    gather_food:  'farmland',
    gather_wood:  'forest',
    gather_stone: 'mountain',
    gather_gold:  'mountain',
  };
  if (gatherMap[action]) {
    const tileType = gatherMap[action];
    const tile = world.tiles[agent.pos.y]?.[agent.pos.x];

    // Already on a valid resource tile
    if (tile && tile.type === tileType && tile.resource.amount > 0) {
      agent.state = 'gathering';
      // Food uses tile fertility; gold/stone/wood use fixed amounts
      const amount = action === 'gather_food'  ? (tile.fertility || 2.5) :
                     action === 'gather_gold'  ? 0.5 : 1;
      const resKey = action.replace('gather_', '');
      // Farmland is renewable — never deplete it
      if (action !== 'gather_food') {
        tile.resource.amount = Math.max(0, tile.resource.amount - amount);
      }
      clan.resources[resKey] = (clan.resources[resKey] ?? 0) + amount;
      rememberOutcome(agent, action, true);
      // Political: influence gain and wealth share on success (small to avoid extreme inequality)
      agent.influence = Math.min(100, (agent.influence ?? 0) + CFG.INFLUENCE_GAIN_ON_SUCCESS);
      agent.wealth = (agent.wealth ?? 0) + amount * CFG.WEALTH_SHARE_ON_GATHER;
      // Claim territory
      clan.territory.add(tileKey(tile.x, tile.y));
      tile.influence[clan.id] = (tile.influence[clan.id] ?? 0) + 0.05;
    } else {
      // Move toward nearest valid tile
      agent.state = 'moving';
      const target = findNearestTile(agent.pos, tileType, world);
      if (target) stepToward(agent, target);
      else rememberOutcome(agent, action, false);
    }
    return;
  }

  // Build action
  if (action === 'build' && clan.buildQueue.length > 0) {
    agent.state = 'building';
    const job = clan.buildQueue[0];
    if (dist(agent.pos, job.pos) > 1) {
      stepToward(agent, job.pos);
    } else {
      // Place building if resources available
      const def = BUILDING_TYPES[job.type];
      if (canAfford(clan.resources, def.cost)) {
        spendResources(clan.resources, def.cost);
        placeBuilding(world, job.type, job.pos, clan.id);
        clan.buildQueue.shift();
        emitEvent(world, 'info', `${clan.name} built a ${def.name}`);
        rememberOutcome(agent, action, true);
        agent.influence = Math.min(100, (agent.influence ?? 0) + CFG.INFLUENCE_GAIN_ON_SUCCESS);
      }
    }
    return;
  }

  // Default
  agent.state = 'idle';
}

function canAfford(resources, cost) {
  if (!cost) return true;
  for (const [k, v] of Object.entries(cost)) {
    if ((resources[k] ?? 0) < v) return false;
  }
  return true;
}

function spendResources(resources, cost) {
  if (!cost) return;
  for (const [k, v] of Object.entries(cost)) resources[k] -= v;
}

function placeBuilding(world, type, pos, clanId) {
  const b = {
    id: uid(), type, clanId, level: 1,
    pos: { ...pos },
    hp: 100, maxHp: 100,
    workerSlots: BUILDING_TYPES[type].workerSlots,
    workers: [],
  };
  world.buildings.set(b.id, b);
  world.tiles[pos.y][pos.x].building = b;
  return b;
}

// Process all clans (resource upkeep, building production)
function processClans(world) {
  for (const clan of world.clans.values()) {
    // Building production
    for (const b of world.buildings.values()) {
      if (b.clanId !== clan.id) continue;
      const def = BUILDING_TYPES[b.type];
      if (def.produces) {
        const workerCount = b.workers.length || 1;
        for (const [res, rate] of Object.entries(def.produces)) {
          const bonus = 1 + world.productionBonus;
          clan.resources[res] = (clan.resources[res] ?? 0) + rate * workerCount * bonus;
        }
      }
      // Upkeep cost
      if (def.upkeep) {
        for (const [res, cost] of Object.entries(def.upkeep)) {
          clan.resources[res] = Math.max(0, (clan.resources[res] ?? 0) - cost);
        }
      }
    }

    // Food consumption per agent
    const pop = clan.agentIds.length;
    clan.resources.food = Math.max(0, clan.resources.food - pop * CFG.FOOD_PER_POP_PER_TICK);

    // Passive upkeep so wood/stone oscillate too (repairs, tools, maintenance)
    clan.resources.wood  = Math.max(0, (clan.resources.wood  ?? 0) - pop * CFG.WOOD_UPKEEP_PER_POP);
    clan.resources.stone = Math.max(0, (clan.resources.stone ?? 0) - pop * CFG.STONE_UPKEEP_PER_POP);

    // Tax: gold drain
    if (world.taxRate > 0) {
      clan.resources.gold = Math.max(0, clan.resources.gold - clan.resources.gold * world.taxRate * 0.01);
    }

    // Cap resources at storage limit
    const storageCap = CFG.STORAGE_BASE_CAP + (clan.storageBonus ?? 0);
    for (const k of ['food','wood','stone','gold']) {
      clan.resources[k] = clamp(clan.resources[k] ?? 0, 0, storageCap);
    }

    // Update resource targets dynamically with population
    clan.resourceTarget.food  = 30 + pop * 5;
    clan.resourceTarget.wood  = 20 + pop * 3;
    clan.resourceTarget.stone = 15 + pop * 2;
    clan.resourceTarget.gold  = 10 + pop * 2;
  }
}

// Tile dynamics: forest regen + farmland spread
function updateTileDynamics(world) {
  const tick = world.tick;
  const W = world.width, H = world.height;

  // Forest regeneration every 50 ticks
  if (tick % CFG.REGEN.forest.interval === 0) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (world.tiles[y][x].type !== 'grass') continue;
        const nbrs = neighbors4(x, y, W, H);
        const hasForestNeighbor = nbrs.some(n => world.tiles[n.y][n.x].type === 'forest');
        if (hasForestNeighbor && world.rng.next() < CFG.REGEN.forest.chance) {
          world.tiles[y][x].type = 'forest';
          world.tiles[y][x].resource = { type: 'wood', amount: CFG.RESOURCE_AMOUNT.forest };
        }
      }
    }
  }

  // Farmland spread every 100 ticks
  if (tick % CFG.REGEN.farmland.interval === 0) {
    let grassCount = 0, farmCount = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (world.tiles[y][x].type === 'grass')    grassCount++;
        if (world.tiles[y][x].type === 'farmland') farmCount++;
      }
    const ratio = farmCount / (grassCount + farmCount || 1);
    if (ratio < CFG.FARMLAND_CAP) {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (world.tiles[y][x].type !== 'grass') continue;
          const nbrs = neighbors4(x, y, W, H);
          const hasFarmNeighbor = nbrs.some(n => world.tiles[n.y][n.x].type === 'farmland');
          if (hasFarmNeighbor && world.rng.next() < CFG.REGEN.farmland.chance) {
            const t = world.tiles[y][x];
            t.type = 'farmland';
            t.resource = { type: 'food', amount: 9999 };
            t.fertility = Math.round((1.5 + world.rng.next() * 2.0) * 10) / 10;
          }
        }
      }
    }
  }
}

// Narrative event checks
function checkNarrativeEvents(world) {
  for (const clan of world.clans.values()) {
    if (clan.resources.food < 5)
      emitEvent(world, 'alert', `${clan.name} is facing famine!`);
    else if (clan.resources.food < 15)
      emitEvent(world, 'warn', `${clan.name} food supply running low`);
  }
  for (const agent of world.agents.values()) {
    if (agent.loyalty < 30 && world.rng.next() < 0.01)
      emitEvent(world, 'warn', `Villager ${agent.id} is doubting their clan`);
  }
}

function emitEvent(world, level, text) {
  world.events.unshift({ tick: world.tick, level, text });
  if (world.events.length > CFG.LOG_MAX) world.events.pop();
}

// Apply intervention events
function applyEvent(world, eventType) {
  switch (eventType) {
    case 'famine':
      for (const c of world.clans.values()) c.resources.food = 0;
      emitEvent(world, 'alert', 'INTERVENTION: Famine struck all clans!');
      break;
    case 'abundance':
      for (const c of world.clans.values()) {
        c.resources.food  += 50;
        c.resources.wood  += 30;
        c.resources.stone += 20;
      }
      emitEvent(world, 'info', 'INTERVENTION: Season of abundance!');
      break;
    case 'earthquake':
      for (const b of world.buildings.values()) {
        b.hp -= world.rng.int(20, 60);
        if (b.hp <= 0) {
          world.tiles[b.pos.y][b.pos.x].building = null;
          world.buildings.delete(b.id);
        }
      }
      emitEvent(world, 'alert', 'INTERVENTION: Earthquake destroyed buildings!');
      break;
    case 'plague':
      for (const a of world.agents.values()) {
        a.fatigue = Math.min(100, a.fatigue + 40);
        a.loyalty = Math.max(0, a.loyalty - 15);
      }
      emitEvent(world, 'alert', 'INTERVENTION: Plague swept through the population!');
      break;
  }
}

// Leader = agent with highest influence in the clan
function assignLeader(clan, world) {
  let bestId = null;
  let bestInfluence = -1;
  for (const agentId of clan.agentIds) {
    const agent = world.agents.get(agentId);
    if (!agent) continue;
    if (agent.influence > bestInfluence) {
      bestInfluence = agent.influence;
      bestId = agentId;
    }
  }
  clan.leaderId = bestId;
  clan.leader = bestId;
}

// Gini-like inequality from agent wealth (0 = equal, 1 = max inequality)
function computeInequality(clan, world) {
  const wealths = [];
  for (const agentId of clan.agentIds) {
    const agent = world.agents.get(agentId);
    if (agent) wealths.push(agent.wealth ?? 0);
  }
  if (wealths.length === 0) return 0;
  const mean = wealths.reduce((a, b) => a + b, 0) / wealths.length;
  if (mean <= 0) return 0;
  const n = wealths.length;
  let sumAbs = 0;
  for (const w of wealths) sumAbs += Math.abs(w - mean);
  return Math.min(1, sumAbs / (n * mean * 2));
}

// Loyalty: gradual drop when inequality is high (k small to avoid revolution spiral)
function updateLoyaltyFromInequality(clan, world) {
  const inequality = computeInequality(clan, world);
  const k = CFG.LOYALTY_INEQUALITY_RATE;
  const delta = -k * inequality;
  for (const agentId of clan.agentIds) {
    const agent = world.agents.get(agentId);
    if (!agent) continue;
    agent.loyalty = clamp((agent.loyalty ?? 50) + delta, 0, 100);
  }
}

// Ideology evolution: raw signal = positive resource deltas only; EMA; then nudge ideology
function evolveIdeology(clan, world) {
  const prev = clan.resourcesAtTickStart;
  if (!prev) return;

  const r = clan.resources;
  const df = Math.max(0, (r.food ?? 0) - prev.food);
  const dw = Math.max(0, (r.wood ?? 0) - prev.wood);
  const dg = Math.max(0, (r.gold ?? 0) - prev.gold);
  const ds = Math.max(0, (r.stone ?? 0) - prev.stone);
  const territoryNow = clan.territory.size;
  const territoryStart = clan.territorySizeAtTickStart ?? territoryNow;
  const expansion = Math.max(0, territoryNow - territoryStart);

  const economy = df + dw + dg;
  const defense = ds * 0.5;
  const tech = ds * 0.5;

  let rawDelta = {
    economy:  economy,
    defense:  defense,
    expansion: expansion,
    tech:     tech,
  };
  const sum = rawDelta.economy + rawDelta.defense + rawDelta.expansion + rawDelta.tech;
  if (sum <= 0) {
    rawDelta = { ...clan.ideologySuccessSmoothed };
  } else {
    rawDelta.economy   /= sum;
    rawDelta.defense   /= sum;
    rawDelta.expansion /= sum;
    rawDelta.tech      /= sum;
  }

  const alpha = CFG.IDEOLOGY_SMOOTHING_ALPHA;
  const sm = clan.ideologySuccessSmoothed;
  sm.economy   = (1 - alpha) * sm.economy   + alpha * rawDelta.economy;
  sm.defense   = (1 - alpha) * sm.defense   + alpha * rawDelta.defense;
  sm.expansion = (1 - alpha) * sm.expansion + alpha * rawDelta.expansion;
  sm.tech      = (1 - alpha) * sm.tech      + alpha * rawDelta.tech;

  const rate = CFG.IDEOLOGY_EVOLVE_RATE;
  const ideo = clan.ideology;
  const minW = CFG.IDEOLOGY_MIN_WEIGHT;
  ideo.economy   = clamp((1 - rate) * ideo.economy   + rate * sm.economy,   minW, 1);
  ideo.defense   = clamp((1 - rate) * ideo.defense   + rate * sm.defense,   minW, 1);
  ideo.expansion = clamp((1 - rate) * ideo.expansion + rate * sm.expansion, minW, 1);
  ideo.tech      = clamp((1 - rate) * ideo.tech      + rate * sm.tech,      minW, 1);
  const total = ideo.economy + ideo.defense + ideo.expansion + ideo.tech;
  ideo.economy   /= total;
  ideo.defense   /= total;
  ideo.expansion /= total;
  ideo.tech      /= total;
}

// Master tick function
function tick(world) {
  world.tick++;

  // Snapshot clan resources (and territory size) for ideology delta calculation after processClans
  for (const clan of world.clans.values()) {
    clan.resourcesAtTickStart = {
      food:  clan.resources.food,
      wood:  clan.resources.wood,
      stone: clan.resources.stone,
      gold:  clan.resources.gold,
    };
    clan.territorySizeAtTickStart = clan.territory.size;
  }

  // Reset assignment counts for all clans before agent loop
  for (const clan of world.clans.values()) {
    calcLaborDemand(clan);
  }

  // Process each agent
  for (const agent of world.agents.values()) {
    processAgent(agent, world);
  }

  processClans(world);

  // Political layer: ideology from resource deltas, leader reassign (every N ticks), loyalty from inequality
  for (const clan of world.clans.values()) {
    evolveIdeology(clan, world);
  }
  if (world.tick % CFG.LEADER_REASSIGN_INTERVAL === 0) {
    for (const clan of world.clans.values()) {
      assignLeader(clan, world);
    }
  }
  for (const clan of world.clans.values()) {
    updateLoyaltyFromInequality(clan, world);
  }

  updateTileDynamics(world);

  if (world.tick % 5 === 0) checkNarrativeEvents(world);
}

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 7 — RENDERER
   ═══════════════════════════════════════════════════════════════ */

const Renderer = (() => {
  const S = CFG.TILE_SIZE;
  let camera = { x: 0, y: 0, scale: 1 };
  let dragging = false, dragStart = null;

  function init(canvas, world) {
    const onResize = () => {
      canvas.width  = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
    }
    onResize();

    // Pan
    canvas.addEventListener('mousedown', e => {
      dragging = true;
      dragStart = { x: e.clientX - camera.x, y: e.clientY - camera.y };
    });
    canvas.addEventListener('mousemove', e => {
      if (dragging) {
        camera.x = e.clientX - dragStart.x;
        camera.y = e.clientY - dragStart.y;
      }
      handleHover(e, canvas, world);
    });
    canvas.addEventListener('mouseup', () => dragging = false);
    canvas.addEventListener('mouseleave', () => dragging = false);

    // Zoom
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      camera.x = mx - (mx - camera.x) * factor;
      camera.y = my - (my - camera.y) * factor;
      camera.scale = clamp(camera.scale * factor, 0.3, 3);
    }, { passive: false });

    // Center camera on world
    camera.x = (canvas.width  - world.width  * S) / 2;
    camera.y = (canvas.height - world.height * S) / 2;
  }

  function screenToWorld(sx, sy) {
    return {
      x: Math.floor((sx - camera.x) / (S * camera.scale)),
      y: Math.floor((sy - camera.y) / (S * camera.scale)),
    };
  }

  let hoveredTile = null;
  function handleHover(e, canvas, world) {
    const rect = canvas.getBoundingClientRect();
    const w = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    hoveredTile = getWorldTile(world, w.x, w.y);
  }

  function render(canvas, world) {
    const ctx = canvas.getContext('2d');
    const tileS = S * camera.scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const startX = Math.max(0, Math.floor(-camera.x / tileS));
    const startY = Math.max(0, Math.floor(-camera.y / tileS));
    const endX   = Math.min(world.width,  Math.ceil((canvas.width  - camera.x) / tileS));
    const endY   = Math.min(world.height, Math.ceil((canvas.height - camera.y) / tileS));

    // Draw tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = world.tiles[y][x];
        const sx = camera.x + x * tileS;
        const sy = camera.y + y * tileS;

        ctx.fillStyle = TILE_COLORS[tile.type] ?? '#333';
        ctx.fillRect(sx, sy, tileS + 0.5, tileS + 0.5);

        // Resource depletion overlay (mountains go darker as resources run out)
        if (tile.type === 'mountain' && tile.resource.amount < CFG.RESOURCE_AMOUNT.mountain) {
          const ratio = tile.resource.amount / CFG.RESOURCE_AMOUNT.mountain;
          ctx.fillStyle = `rgba(0,0,0,${(1 - ratio) * 0.5})`;
          ctx.fillRect(sx, sy, tileS + 0.5, tileS + 0.5);
        }

        // Influence overlay
        for (const [clanId, strength] of Object.entries(tile.influence)) {
          const clan = world.clans.get(Number(clanId));
          if (clan && strength > 0.1) {
            ctx.fillStyle = hexAlpha(clan.color, Math.min(0.25, strength * 0.3));
            ctx.fillRect(sx, sy, tileS + 0.5, tileS + 0.5);
          }
        }

        // Grid lines (only when zoomed in)
        if (camera.scale > 0.6) {
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(sx, sy, tileS, tileS);
        }

        // Building
        if (tile.building && tileS >= 6) {
          const def = BUILDING_TYPES[tile.building.type];
          const clan = world.clans.get(tile.building.clanId);
          ctx.fillStyle = clan ? hexAlpha(clan.color, 0.85) : '#888';
          const bx = sx + tileS * 0.15, by = sy + tileS * 0.15;
          const bw = tileS * 0.7;
          ctx.fillRect(bx, by, bw, bw);
          if (tileS >= 14 && def) {
            ctx.font = `${tileS * 0.45}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(def.icon, sx + tileS / 2, sy + tileS / 2);
          }
        }
      }
    }

    // Draw agents
    for (const agent of world.agents.values()) {
      const clan = world.clans.get(agent.clanId);
      if (!clan) continue;
      const sx = camera.x + (agent.pos.x + 0.5) * tileS;
      const sy = camera.y + (agent.pos.y + 0.5) * tileS;
      const r  = Math.max(2, tileS * 0.18);

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = clan.color;
      ctx.fill();

      // State indicator ring
      const stateColor = {
        gathering: '#4ad97a', building: '#d9a04a',
        fighting:  '#d94a4a', trading:  '#a04ad9',
        moving:    '#4a90d9', resting:  '#888',
      }[agent.state] ?? '#555';
      ctx.strokeStyle = stateColor;
      ctx.lineWidth = Math.max(1, r * 0.4);
      ctx.stroke();
    }

    // Hovered tile highlight
    if (hoveredTile) {
      const sx = camera.x + hoveredTile.x * tileS;
      const sy = camera.y + hoveredTile.y * tileS;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx + 1, sy + 1, tileS - 2, tileS - 2);
    }
  }

  function setCamera(next) {
    if (!next || typeof next !== 'object') return;
    if (Number.isFinite(Number(next.x))) camera.x = Number(next.x);
    if (Number.isFinite(Number(next.y))) camera.y = Number(next.y);
    if (Number.isFinite(Number(next.scale))) camera.scale = clamp(Number(next.scale), 0.3, 3);
  }

  return { init, render, getCamera: () => camera, setCamera };
})();

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 8 — UI
   ═══════════════════════════════════════════════════════════════ */

const UI = (() => {
  function updateClanPanel(world) {
    const clan = world.clans.values().next().value;
    if (!clan) return;

    document.getElementById('clan-title').textContent = `Clan ${clan.name}`;
    document.getElementById('res-food').textContent   = Math.floor(clan.resources.food);
    document.getElementById('res-wood').textContent   = Math.floor(clan.resources.wood);
    document.getElementById('res-stone').textContent  = Math.floor(clan.resources.stone);
    document.getElementById('res-gold').textContent   = Math.floor(clan.resources.gold);
    document.getElementById('pop-count').textContent  = clan.agentIds.length;
    document.getElementById('territory-count').textContent = clan.territory.size;
    document.getElementById('tick-count').textContent = world.tick;

    // Ideology bars
    const container = document.getElementById('ideology-bars');
    container.innerHTML = '';
    for (const [key, val] of Object.entries(clan.ideology)) {
      const row = document.createElement('div');
      row.className = 'ideology-row';
      row.innerHTML = `
        <span class="ideology-name">${key}</span>
        <div class="ideology-bar-bg">
          <div class="ideology-bar-fill" style="width:${(val*100).toFixed(0)}%;background:${IDEOLOGY_COLORS[key]??'#888'}"></div>
        </div>`;
      container.appendChild(row);
    }
  }

  function updateEventLog(world) {
    if (!world?.events) return;
    const log = document.getElementById('event-log');
    if (!log) return;

    log.innerHTML = '';
    for (const e of world.events.slice(0, 40)) {
      const div = document.createElement('div');
      div.className = `log-entry ${e.level}`;
      div.innerHTML = `<span class="log-tick">[${e.tick}]</span>${e.text}`;
      log.appendChild(div);
    }
  }

  function updateCivilizationModal(world) {
    const modal = document.getElementById('civilization-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    const clan = world.clans.values().next().value;
    if (!clan) return;

    const container = document.getElementById('civilization-ideology-bars');
    container.innerHTML = '';
    for (const [key, val] of Object.entries(clan.ideology)) {
      const row = document.createElement('div');
      row.className = 'ideology-row';
      row.innerHTML = `
        <span class="ideology-name">${key}</span>
        <div class="ideology-bar-bg">
          <div class="ideology-bar-fill" style="width:${(val*100).toFixed(0)}%;background:${IDEOLOGY_COLORS[key]??'#888'}"></div>
        </div>`;
      container.appendChild(row);
    }

    const leaderEl = document.getElementById('civilization-leader');
    if (clan.leaderId != null) {
      const leader = world.agents.get(clan.leaderId);
      leaderEl.textContent = leader ? `Agent #${leader.id} (Influence: ${(leader.influence ?? 0).toFixed(1)})` : 'No leader';
    } else {
      leaderEl.textContent = 'No leader';
    }

    let avgLoyalty = 0;
    let count = 0;
    for (const agentId of clan.agentIds) {
      const a = world.agents.get(agentId);
      if (a) { avgLoyalty += a.loyalty ?? 50; count++; }
    }
    document.getElementById('civilization-loyalty').textContent = count ? `Average: ${(avgLoyalty / count).toFixed(1)}` : '—';

    const ineq = computeInequality(clan, world);
    document.getElementById('civilization-inequality').textContent = (ineq * 100).toFixed(1) + '%';
  }

  function setActiveSpeedButton(speed) {
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.speed) === Number(speed));
    });
  }

  function setActiveModeButton(mode) {
    document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  function init(world, initialSpeed = 1) {
    setActiveSpeedButton(initialSpeed);
    setActiveModeButton(world.mode);
    document.getElementById('intervention-panel').classList.toggle('hidden', world.mode !== 'intervene');

    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveSpeedButton(btn.dataset.speed);
        Engine.setSpeed(Number(btn.dataset.speed));
      });
    });

    document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveModeButton(btn.dataset.mode);
        world.mode = btn.dataset.mode;
        document.getElementById('intervention-panel').classList.toggle('hidden', world.mode !== 'intervene');
      });
    });

    document.getElementById('btn-civilization').addEventListener('click', () => {
      document.getElementById('civilization-modal').classList.remove('hidden');
    });
    document.getElementById('civilization-modal-close').addEventListener('click', () => {
      document.getElementById('civilization-modal').classList.add('hidden');
    });

    const taxSlider = document.getElementById('tax-slider');
    taxSlider.value = String(Math.round((world.taxRate ?? 0.10) * 100));
    document.getElementById('tax-val').textContent = taxSlider.value;
    taxSlider.addEventListener('input', e => {
      world.taxRate = Number(e.target.value) / 100;
      document.getElementById('tax-val').textContent = e.target.value;
    });

    const prodSlider = document.getElementById('prod-slider');
    prodSlider.value = String(Math.round((world.productionBonus ?? 0) * 100));
    document.getElementById('prod-val').textContent = prodSlider.value;
    prodSlider.addEventListener('input', e => {
      world.productionBonus = Number(e.target.value) / 100;
      document.getElementById('prod-val').textContent = e.target.value;
    });

    document.getElementById('btn-new-cycle').addEventListener('click', () => {
      Engine.startNewCycle();
    });

    document.querySelectorAll('.event-btn').forEach(btn => {
      btn.addEventListener('click', () => applyEvent(world, btn.dataset.event));
    });
  }

  return { init, updateClanPanel, updateEventLog, updateCivilizationModal };
})();

/* ═══════════════════════════════════════════════════════════════
   CHAPTER 9 — BOOTSTRAP
   ═══════════════════════════════════════════════════════════════ */

const Engine = (() => {
  let world = null;
  let speedKey = 1;
  let lastTime = 0;
  let accumulator = 0;
  let lastSavedTick = -1;
  let loopStarted = false;
  let persistenceListenersBound = false;
  let isResettingCycle = false;
  function setSpeed(s) { speedKey = s; }

  function persistWorld(force = false) {
    if (!world || isResettingCycle) return;
    if (!force && world.tick - lastSavedTick < SAVE_EVERY_TICKS) return;
    const camera = Renderer.getCamera();
    const ok = saveWorldToStorage(world, {
      speedKey,
      camera: camera ? { x: camera.x, y: camera.y, scale: camera.scale } : null,
    });
    if (ok) lastSavedTick = world.tick;
  }

  function bindPersistenceListeners() {
    if (persistenceListenersBound) return;
    window.addEventListener('beforeunload', () => persistWorld(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') persistWorld(true);
    });
    persistenceListenersBound = true;
  }

  function createFreshWorld(seed) {
    _uid = 0;
    const newWorld = generateWorld(seed);

    // Create 1 clan
    const clan = createClan('Alpha', CLAN_COLORS[0], {
      expansion: 0.3, defense: 0.2, economy: 0.35, tech: 0.15
    });
    newWorld.clans.set(clan.id, clan);

    // Place Town Hall roughly in center
    const cx = Math.floor(newWorld.width / 2);
    const cy = Math.floor(newWorld.height / 2);
    // Find nearest grass tile to center
    let hallPos = { x: cx, y: cy };
    outer: for (let r = 0; r < 10; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = cx + dx, ty = cy + dy;
          const t = getWorldTile(newWorld, tx, ty);
          if (t && t.type === 'grass' && !t.building) { hallPos = { x: tx, y: ty }; break outer; }
        }
      }
    }
    placeBuilding(newWorld, 'TOWN_HALL', hallPos, clan.id);
    clan.territory.add(tileKey(hallPos.x, hallPos.y));
    emitEvent(newWorld, 'info', `Clan ${clan.name} founded their settlement`);

    // Spawn villagers around Town Hall
    for (let i = 0; i < CFG.AGENTS_PER_CLAN; i++) {
      const offsetX = newWorld.rng.int(-3, 3);
      const offsetY = newWorld.rng.int(-3, 3);
      const tx = clamp(hallPos.x + offsetX, 0, newWorld.width - 1);
      const ty = clamp(hallPos.y + offsetY, 0, newWorld.height - 1);
      const v = createVillager(clan.id, { x: tx, y: ty }, newWorld.rng);
      newWorld.agents.set(v.id, v);
      clan.agentIds.push(v.id);
    }
    emitEvent(newWorld, 'info', `${CFG.AGENTS_PER_CLAN} villagers ready`);

    assignLeader(clan, newWorld);

    // Queue initial builds — find nearest valid tiles for each
    let farmPos = null, lumberPos = null, minFarm = Infinity, minLumber = Infinity;
    for (let y = 0; y < newWorld.height; y++) {
      for (let x = 0; x < newWorld.width; x++) {
        const t = newWorld.tiles[y][x];
        const d = dist(hallPos, {x, y});
        if (t.type === 'farmland' && !t.building && d < minFarm)  { minFarm = d;   farmPos   = {x, y}; }
        if (t.type === 'forest'   && !t.building && d < minLumber){ minLumber = d; lumberPos = {x, y}; }
      }
    }
    if (farmPos)   clan.buildQueue.push({ type: 'FARM',        pos: farmPos });
    if (lumberPos) clan.buildQueue.push({ type: 'LUMBER_CAMP', pos: lumberPos });

    return newWorld;
  }

  function loop(timestamp) {
    requestAnimationFrame(loop);
    if (!world) return;

    const dt = timestamp - lastTime;
    lastTime = timestamp;

    const canvas = document.getElementById('world-canvas');
    const intervalMs = CFG.TICK_MS[speedKey] ?? Infinity;

    let advanced = false;
    if (speedKey > 0) {
      accumulator += dt;
      while (accumulator >= intervalMs) {
        tick(world);
        accumulator -= intervalMs;
        advanced = true;
      }
    }
    if (advanced) persistWorld(false);

    Renderer.render(canvas, world);
    UI.updateClanPanel(world);
    UI.updateEventLog(world);
    UI.updateCivilizationModal(world);
  }

  function start() {
    const SEED = 42;

    const savedState = loadWorldFromStorage();
    let cameraToRestore = null;
    if (savedState?.world) {
      world = savedState.world;
      const savedSpeed = Number(savedState.meta?.speedKey);
      speedKey = Number.isFinite(savedSpeed) ? savedSpeed : 1;
      cameraToRestore = savedState.meta?.camera ?? null;
    } else {
      world = createFreshWorld(SEED);
      speedKey = 1;
    }

    // Init renderer
    const canvas = document.getElementById('world-canvas');
    Renderer.init(canvas, world);
    if (cameraToRestore) Renderer.setCamera(cameraToRestore);

    // Init UI
    UI.init(world, speedKey);

    // Add tooltip div once
    if (!document.getElementById('tile-tooltip')) {
      const tooltip = document.createElement('div');
      tooltip.id = 'tile-tooltip';
      document.getElementById('world-container').appendChild(tooltip);
    }

    bindPersistenceListeners();
    persistWorld(true);

    // Start loop
    accumulator = 0;
    lastTime = performance.now();
    if (!loopStarted) {
      loopStarted = true;
      requestAnimationFrame(loop);
    }
  }

  function startNewCycle() {
    isResettingCycle = true;
    clearSavedWorld();
    window.location.reload();
  }

  return { start, setSpeed, startNewCycle };
})();

window.addEventListener('DOMContentLoaded', () => Engine.start());
