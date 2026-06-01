"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Federation = exports.Griot = void 0;
exports.generatePraiseName = generatePraiseName;
exports.callAndResponse = callAndResponse;
exports.genealogy = genealogy;
exports.descendants = descendants;
// ── Helpers ────────────────────────────────────────────────────────────
const now = () => Date.now();
// ── Griot (memory) ────────────────────────────────────────────────────
class Griot {
    constructor(decayRate = 0.01) {
        this.stories = new Map();
        this.decayRate = decayRate;
    }
    addStory(s) {
        const story = {
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
    findStory(name) {
        return this.stories.get(name);
    }
    tellStory(name) {
        const s = this.stories.get(name);
        if (!s)
            throw new Error(`Story not found: ${name}`);
        s.tellCount++;
        s.lastTold = now();
        s.weight += 0.1; // retelling strengthens
        return s.tellCount;
    }
    applyDecay(elapsedMs) {
        const factor = Math.exp(-this.decayRate * elapsedMs / 1000);
        for (const s of this.stories.values()) {
            s.weight *= factor;
        }
    }
    memoryStrengths() {
        return [...this.stories.values()].map((s) => s.weight);
    }
    traditionScore() {
        const arr = [...this.stories.values()];
        if (arr.length === 0)
            return 0;
        const totalTell = arr.reduce((a, s) => a + s.tellCount, 0);
        const totalWeight = arr.reduce((a, s) => a + s.weight, 0);
        // normalise to 0-1 range
        return Math.min(1, (totalTell * totalWeight) / (arr.length * arr.length * 10));
    }
}
exports.Griot = Griot;
// ── Praise ─────────────────────────────────────────────────────────────
function generatePraiseName(griot, storyIds, name) {
    const resolved = storyIds
        .map((id) => griot.findStory(id))
        .filter((s) => s !== undefined);
    const totalWeight = resolved.reduce((a, s) => a + s.weight, 0);
    const avgWeight = resolved.length ? totalWeight / resolved.length : 0;
    // compressionRatio: ratio of stories compressed into one name
    const compressionRatio = resolved.length ? totalWeight / resolved.length : 0;
    // density: how concentrated the weight is
    const density = resolved.length ? totalWeight / resolved.length : 0;
    return { storyIds, name, compressionRatio, density };
}
// ── Call & Response ────────────────────────────────────────────────────
function callAndResponse(caller, responder, storyName) {
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
    let strongest;
    for (const s of responder.stories.values()) {
        if (!strongest || s.weight > strongest.weight)
            strongest = s;
    }
    return {
        callerStory: storyName,
        responderStory: strongest?.name ?? "",
        similarity: strongest ? 0.5 : 0,
    };
}
// ── Genealogy ──────────────────────────────────────────────────────────
function genealogy(griot, storyName) {
    const chain = [];
    let cur = griot.findStory(storyName);
    while (cur) {
        chain.push(cur);
        if (!cur.parentId)
            break;
        cur = griot.findStory(cur.parentId);
    }
    return chain;
}
function descendants(griot, storyName) {
    const result = [];
    // direct children
    const children = [];
    for (const s of griot.stories.values()) {
        if (s.parentId === storyName)
            children.push(s);
    }
    for (const child of children) {
        result.push(child);
        result.push(...descendants(griot, child.name));
    }
    return result;
}
// ── Federation ─────────────────────────────────────────────────────────
class Federation {
    constructor() {
        this.griots = [];
        this.syncPairs = new Set(); // "i-j" for synced pair
    }
    addGriot(g) {
        this.griots.push(g);
        return this.griots.length - 1;
    }
    syncStory(fromIdx, toIdx, storyName) {
        const from = this.griots[fromIdx];
        const to = this.griots[toIdx];
        if (!from || !to)
            throw new Error("Invalid griot index");
        const src = from.findStory(storyName);
        if (!src)
            throw new Error(`Story not found in source griot: ${storyName}`);
        // copy story into target
        const copy = { ...src };
        to.stories.set(storyName, copy);
        this.syncPairs.add(`${Math.min(fromIdx, toIdx)}-${Math.max(fromIdx, toIdx)}`);
    }
    mergeMemories(idx1, idx2) {
        const g1 = this.griots[idx1];
        const g2 = this.griots[idx2];
        if (!g1 || !g2)
            throw new Error("Invalid griot index");
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
    coverage() {
        const n = this.griots.length;
        if (n < 2)
            return 0;
        const total = (n * (n - 1)) / 2;
        return this.syncPairs.size / total;
    }
}
exports.Federation = Federation;
