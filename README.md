# griot-math-v2

> Living memory mathematics v2 for JavaScript — enhanced griot oral tradition with tradition scores, federation, and lossy compression.

## What This Does

`griot-math-v2` is the second edition of the griot memory system for JavaScript. It adds tradition scores (measuring depth and breadth of story genealogy), enhanced federation with coverage tracking, and improved praise name compression. Use it when you need a richer griot model than v1.

## The Cultural Root

Same tradition as `griot-math` — West African griots maintaining oral history through weighted memory with exponential decay and reinforcement through retelling.

## Install

```bash
npm install griot-math-v2
```

## Quick Start

```typescript
import { Griot, generatePraiseName, callAndResponse, genealogy, descendants, Federation } from "griot-math-v2";

const griot = new Griot(0.01);  // decay rate
const s1 = griot.addStory({ name: "Origin", weight: 1.0, tags: ["history"] });
const s2 = griot.addStory({ name: "Migration", weight: 0.9, parentId: "Origin", tags: ["journey"] });

griot.tellStory("Origin");
griot.tellStory("Origin");

console.log(griot.traditionScore());
console.log(griot.memoryStrengths());

// Genealogy
const path = genealogy(griot, "Migration");
const kids = descendants(griot, "Origin");

// Federation
const g2 = new Griot();
const fed = new Federation([griot, g2]);
fed.syncStory(0, 1, "Origin");
console.log(fed.coverage());
```

## API Reference

### `Griot(decayRate?)`
- `addStory({ name, weight, parentId?, tags? }) → Story`
- `findStory(name) → Story | undefined`
- `tellStory(name) → number`
- `applyDecay(elapsedMs) → void`
- `memoryStrengths() → number[]`
- `traditionScore() → number`

### `generatePraiseName(griot, storyIds, name) → PraiseName`
### `callAndResponse(caller, responder, callerStoryName) → CallResponse`
### `genealogy(griot, storyName) → Story[]`
### `descendants(griot, storyName) → Story[]`

### `Federation(griots)`
- `syncStory(fromIdx, toIdx, storyName) → SyncResult`
- `mergeMemories(fromIdx, toIdx) → MergeResult`
- `coverage() → number` — Fraction of stories shared across griots

## License

MIT
