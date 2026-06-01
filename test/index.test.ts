import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Griot, generatePraiseName, callAndResponse, Federation } from '../src/index.js';

describe('Griot memory', () => {
  it('add and find story', () => {
    const g = new Griot(0.1);
    g.addStory('origin', 5.0, null);
    const s = g.findStory('origin');
    assert.ok(s);
    assert.equal(s.name, 'origin');
    assert.equal(s.weight, 5.0);
  });

  it('tell story increases count', () => {
    const g = new Griot(0.1);
    g.addStory('tale', 3.0, null);
    g.tellStory('tale');
    g.tellStory('tale');
    const s = g.findStory('tale');
    assert.equal(s.tellCount, 2);
  });

  it('tell story boosts weight', () => {
    const g = new Griot(0.1);
    g.addStory('tale', 3.0, null);
    const before = g.findStory('tale').weight;
    g.tellStory('tale');
    assert.ok(g.findStory('tale').weight > before);
  });

  it('decay reduces weights', () => {
    const g = new Griot(1.0);
    g.addStory('old', 10.0, null);
    g.applyDecay(2.0);
    assert.ok(g.findStory('old').weight < 10.0);
  });

  it('tradition score', () => {
    const g = new Griot(0.0);
    g.addStory('root1', 8.0, null);
    g.addStory('root2', 4.0, null);
    g.addStory('child', 3.0, 'root1');
    assert.ok(g.traditionScore() > 0);
  });

  it('memory strengths', () => {
    const g = new Griot(0.0);
    g.addStory('a', 5.0, null);
    g.tellStory('a');
    const strengths = g.memoryStrengths();
    assert.equal(strengths.length, 1);
    assert.ok(strengths[0] > 5.0);
  });

  it('genealogy', () => {
    const g = new Griot(0.0);
    g.addStory('grandparent', 5.0, null);
    g.addStory('parent', 4.0, 'grandparent');
    g.addStory('child', 3.0, 'parent');
    const path = g.genealogy('child');
    assert.equal(path.length, 3);
    assert.equal(path[0].name, 'grandparent');
    assert.equal(path[2].name, 'child');
  });

  it('descendants', () => {
    const g = new Griot(0.0);
    g.addStory('root', 5.0, null);
    g.addStory('child1', 4.0, 'root');
    g.addStory('child2', 3.0, 'root');
    g.addStory('grandchild', 2.0, 'child1');
    const descs = g.descendants('root');
    assert.equal(descs.length, 3);
  });

  it('find nonexistent returns undefined', () => {
    const g = new Griot(0.1);
    assert.equal(g.findStory('ghost'), undefined);
  });
});

describe('Praise names', () => {
  it('generate praise name', () => {
    const g = new Griot(0.0);
    g.addStory('a', 5.0, null);
    g.addStory('b', 4.0, null);
    const pn = generatePraiseName(g, ['a', 'b'], 'Great Tradition');
    assert.equal(pn.name, 'Great Tradition');
    assert.equal(pn.storyIds.length, 2);
    assert.ok(pn.density > 0);
  });

  it('compression ratio', () => {
    const g = new Griot(0.0);
    for (let i = 0; i < 10; i++) g.addStory(`s${i}`, 3.0, null);
    const pn = generatePraiseName(g, ['s0', 's1'], 'Short');
    assert.ok(pn.compressionRatio > 1);
  });
});

describe('Call and response', () => {
  it('exact match', () => {
    const g1 = new Griot(0.0);
    const g2 = new Griot(0.0);
    g1.addStory('shared', 5.0, null);
    g2.addStory('shared', 4.0, null);
    const cr = callAndResponse(g1, g2, 'shared');
    assert.equal(cr.similarity, 1.0);
  });

  it('fallback match', () => {
    const g1 = new Griot(0.0);
    const g2 = new Griot(0.0);
    g1.addStory('unique', 5.0, null);
    g2.addStory('other', 4.0, null);
    const cr = callAndResponse(g1, g2, 'unique');
    assert.ok(cr.similarity < 1.0);
  });
});

describe('Federation', () => {
  it('create federation', () => {
    const f = new Federation(3, 0.1);
    assert.equal(f.coverage(), 0);
  });

  it('sync story', () => {
    const f = new Federation(3, 0.0);
    f.griots[0].addStory('origin', 5.0, null);
    f.syncStory(0, 1, 'origin');
    assert.ok(f.griots[1].findStory('origin') !== undefined);
    assert.ok(f.coverage() > 0);
  });

  it('full sync coverage', () => {
    const f = new Federation(2, 0.0);
    f.griots[0].addStory('tale', 5.0, null);
    f.griots[1].addStory('saga', 4.0, null);
    f.syncStory(0, 1, 'tale');
    f.syncStory(1, 0, 'saga');
    assert.ok(f.coverage() >= 1.0);
  });

  it('merge memories', () => {
    const f = new Federation(2, 0.0);
    f.griots[0].addStory('a', 5.0, null);
    f.griots[1].addStory('b', 4.0, null);
    f.mergeMemories(0, 1);
    assert.ok(f.griots[0].findStory('b') !== undefined);
    assert.ok(f.griots[1].findStory('a') !== undefined);
  });
});
