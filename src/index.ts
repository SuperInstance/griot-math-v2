// ── Types ──────────────────────────────────────────────────────────────
export interface Story {
  name: string;
  weight: number;
  tellCount: number;
  lastTold: number; // unix-ms
  parentId: string | null;
  tags: string[];
}

export interface PraiseName {
  storyIds: string[];
  name: string;
  compressionRatio: number;
  density: number;
}

export interface CallResponse {
  callerStory: string;
  responderStory: string;
  similarity: number;
}

// ── Helpers ────────────────────────────────────────────────────────────
const now = (): number => Date.now();

// ── Griot (memory) ────────────────────────────────────────────────────
export class Griot {
  stories: Map<string, Story> = new Map();
  decayRate: number;

  constructor(decayRate = 0.01) {
    this.decayRate = decayRate;
  }

  addStory(s: Omit<Story, "tellCount" | "lastTold"> & { tellCount?: number; lastTold?: number }): Story {
    const story: Story = {
      name: s.name,
      weight: s.weight,
      tellCount: s.tellCount ?? 0,
      lastTold: s.lastTold ?? 0,
      parentId: s.parentId ?? null,
      tags: s.tags ?? [],
    };
    this.stories.set(s.name, story);
    return story;
  }

  findStory(name: string): Story | undefined {
    return this.stories.get(name);
  }

  tellStory(name: string): number {
    const s = this.stories.get(name);
    if (!s) throw new Error(`Story not found: ${name}`);
    s.tellCount++;
    s.lastTold = now();
    s.weight += 0.1; // retelling strengthens
    return s.tellCount;
  }

  applyDecay(elapsedMs: number): void {
    const factor = Math.exp(-this.decayRate * elapsedMs / 1000);
    for (const s of this.stories.values()) {
      s.weight *= factor;
    }
  }

  memoryStrengths(): number[] {
    return [...this.stories.values()].map((s) => s.weight);
  }

  traditionScore(): number {
    const arr = [...this.stories.values()];
    if (arr.length === 0) return 0;
    const totalTell = arr.reduce((a, s) => a + s.tellCount, 0);
    const totalWeight = arr.reduce((a, s) => a + s.weight, 0);
    // normalise to 0-1 range
    return Math.min(1, (totalTell * totalWeight) / (arr.length * arr.length * 10));
  }
}

// ── Praise ─────────────────────────────────────────────────────────────
export function generatePraiseName(
  griot: Griot,
  storyIds: string[],
  name: string
): PraiseName {
  const resolved = storyIds
    .map((id) => griot.findStory(id))
    .filter((s): s is Story => s !== undefined);

  const totalWeight = resolved.reduce((a, s) => a + s.weight, 0);
  const avgWeight = resolved.length ? totalWeight / resolved.length : 0;

  // compressionRatio: ratio of stories compressed into one name
  const compressionRatio = resolved.length ? totalWeight / resolved.length : 0;
  // density: how concentrated the weight is
  const density = resolved.length ? totalWeight / resolved.length : 0;

  return { storyIds, name, compressionRatio, density };
}

// ── Call & Response ────────────────────────────────────────────────────
export function callAndResponse(
  caller: Griot,
  responder: Griot,
  storyName: string
): CallResponse {
  const c = caller.findStory(storyName);
  const r = responder.findStory(storyName);

  if (c && r) {
    return {
      callerStory: storyName,
      responderStory: storyName,
      similarity: 1,
    };
  }

  // fallback: strongest story in responder
  let strongest: Story | undefined;
  for (const s of responder.stories.values()) {
    if (!strongest || s.weight > strongest.weight) strongest = s;
  }

  return {
    callerStory: storyName,
    responderStory: strongest?.name ?? "",
    similarity: strongest ? 0.5 : 0,
  };
}

// ── Genealogy ──────────────────────────────────────────────────────────
export function genealogy(griot: Griot, storyName: string): Story[] {
  const chain: Story[] = [];
  let cur = griot.findStory(storyName);
  while (cur) {
    chain.push(cur);
    if (!cur.parentId) break;
    cur = griot.findStory(cur.parentId);
  }
  return chain;
}

export function descendants(griot: Griot, storyName: string): Story[] {
  const result: Story[] = [];
  // direct children
  const children: Story[] = [];
  for (const s of griot.stories.values()) {
    if (s.parentId === storyName) children.push(s);
  }
  for (const child of children) {
    result.push(child);
    result.push(...descendants(griot, child.name));
  }
  return result;
}

// ── Federation ─────────────────────────────────────────────────────────
export class Federation {
  griots: Griot[] = [];
  private syncPairs: Set<string> = new Set(); // "i-j" for synced pair

  addGriot(g: Griot): number {
    this.griots.push(g);
    return this.griots.length - 1;
  }

  syncStory(fromIdx: number, toIdx: number, storyName: string): void {
    const from = this.griots[fromIdx];
    const to = this.griots[toIdx];
    if (!from || !to) throw new Error("Invalid griot index");
    const src = from.findStory(storyName);
    if (!src) throw new Error(`Story not found in source griot: ${storyName}`);
    // copy story into target
    const copy: Story = { ...src };
    to.stories.set(storyName, copy);
    this.syncPairs.add(`${Math.min(fromIdx, toIdx)}-${Math.max(fromIdx, toIdx)}`);
  }

  mergeMemories(idx1: number, idx2: number): void {
    const g1 = this.griots[idx1];
    const g2 = this.griots[idx2];
    if (!g1 || !g2) throw new Error("Invalid griot index");
    for (const [name, story] of g1.stories) {
      if (!g2.stories.has(name)) {
        g2.stories.set(name, { ...story });
      }
    }
    for (const [name, story] of g2.stories) {
      if (!g1.stories.has(name)) {
        g1.stories.set(name, { ...story });
      }
    }
    this.syncPairs.add(`${Math.min(idx1, idx2)}-${Math.max(idx1, idx2)}`);
  }

  coverage(): number {
    const n = this.griots.length;
    if (n < 2) return 0;
    const total = (n * (n - 1)) / 2;
    return this.syncPairs.size / total;
  }
}
