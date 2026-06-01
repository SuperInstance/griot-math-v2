"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const index_js_1 = require("../src/index.js");
(0, node_test_1.describe)('Griot memory', () => {
    (0, node_test_1.it)('add and find story', () => {
        const g = new index_js_1.Griot(0.1);
        g.addStory('origin', 5.0, null);
        const s = g.findStory('origin');
        strict_1.default.ok(s);
        strict_1.default.equal(s.name, 'origin');
        strict_1.default.equal(s.weight, 5.0);
    });
    (0, node_test_1.it)('tell story increases count', () => {
        const g = new index_js_1.Griot(0.1);
        g.addStory('tale', 3.0, null);
        g.tellStory('tale');
        g.tellStory('tale');
        const s = g.findStory('tale');
        strict_1.default.equal(s.tellCount, 2);
    });
    (0, node_test_1.it)('tell story boosts weight', () => {
        const g = new index_js_1.Griot(0.1);
        g.addStory('tale', 3.0, null);
        const before = g.findStory('tale').weight;
        g.tellStory('tale');
        strict_1.default.ok(g.findStory('tale').weight > before);
    });
    (0, node_test_1.it)('decay reduces weights', () => {
        const g = new index_js_1.Griot(1.0);
        g.addStory('old', 10.0, null);
        g.applyDecay(2.0);
        strict_1.default.ok(g.findStory('old').weight < 10.0);
    });
    (0, node_test_1.it)('tradition score', () => {
        const g = new index_js_1.Griot(0.0);
        g.addStory('root1', 8.0, null);
        g.addStory('root2', 4.0, null);
        g.addStory('child', 3.0, 'root1');
        strict_1.default.ok(g.traditionScore() > 0);
    });
    (0, node_test_1.it)('memory strengths', () => {
        const g = new index_js_1.Griot(0.0);
        g.addStory('a', 5.0, null);
        g.tellStory('a');
        const strengths = g.memoryStrengths();
        strict_1.default.equal(strengths.length, 1);
        strict_1.default.ok(strengths[0] > 5.0);
    });
    (0, node_test_1.it)('genealogy', () => {
        const g = new index_js_1.Griot(0.0);
        g.addStory('grandparent', 5.0, null);
        g.addStory('parent', 4.0, 'grandparent');
        g.addStory('child', 3.0, 'parent');
        const path = g.genealogy('child');
        strict_1.default.equal(path.length, 3);
        strict_1.default.equal(path[0].name, 'grandparent');
        strict_1.default.equal(path[2].name, 'child');
    });
    (0, node_test_1.it)('descendants', () => {
        const g = new index_js_1.Griot(0.0);
        g.addStory('root', 5.0, null);
        g.addStory('child1', 4.0, 'root');
        g.addStory('child2', 3.0, 'root');
        g.addStory('grandchild', 2.0, 'child1');
        const descs = g.descendants('root');
        strict_1.default.equal(descs.length, 3);
    });
    (0, node_test_1.it)('find nonexistent returns undefined', () => {
        const g = new index_js_1.Griot(0.1);
        strict_1.default.equal(g.findStory('ghost'), undefined);
    });
});
(0, node_test_1.describe)('Praise names', () => {
    (0, node_test_1.it)('generate praise name', () => {
        const g = new index_js_1.Griot(0.0);
        g.addStory('a', 5.0, null);
        g.addStory('b', 4.0, null);
        const pn = (0, index_js_1.generatePraiseName)(g, ['a', 'b'], 'Great Tradition');
        strict_1.default.equal(pn.name, 'Great Tradition');
        strict_1.default.equal(pn.storyIds.length, 2);
        strict_1.default.ok(pn.density > 0);
    });
    (0, node_test_1.it)('compression ratio', () => {
        const g = new index_js_1.Griot(0.0);
        for (let i = 0; i < 10; i++)
            g.addStory(`s${i}`, 3.0, null);
        const pn = (0, index_js_1.generatePraiseName)(g, ['s0', 's1'], 'Short');
        strict_1.default.ok(pn.compressionRatio > 1);
    });
});
(0, node_test_1.describe)('Call and response', () => {
    (0, node_test_1.it)('exact match', () => {
        const g1 = new index_js_1.Griot(0.0);
        const g2 = new index_js_1.Griot(0.0);
        g1.addStory('shared', 5.0, null);
        g2.addStory('shared', 4.0, null);
        const cr = (0, index_js_1.callAndResponse)(g1, g2, 'shared');
        strict_1.default.equal(cr.similarity, 1.0);
    });
    (0, node_test_1.it)('fallback match', () => {
        const g1 = new index_js_1.Griot(0.0);
        const g2 = new index_js_1.Griot(0.0);
        g1.addStory('unique', 5.0, null);
        g2.addStory('other', 4.0, null);
        const cr = (0, index_js_1.callAndResponse)(g1, g2, 'unique');
        strict_1.default.ok(cr.similarity < 1.0);
    });
});
(0, node_test_1.describe)('Federation', () => {
    (0, node_test_1.it)('create federation', () => {
        const f = new index_js_1.Federation(3, 0.1);
        strict_1.default.equal(f.coverage(), 0);
    });
    (0, node_test_1.it)('sync story', () => {
        const f = new index_js_1.Federation(3, 0.0);
        f.griots[0].addStory('origin', 5.0, null);
        f.syncStory(0, 1, 'origin');
        strict_1.default.ok(f.griots[1].findStory('origin') !== undefined);
        strict_1.default.ok(f.coverage() > 0);
    });
    (0, node_test_1.it)('full sync coverage', () => {
        const f = new index_js_1.Federation(2, 0.0);
        f.griots[0].addStory('tale', 5.0, null);
        f.griots[1].addStory('saga', 4.0, null);
        f.syncStory(0, 1, 'tale');
        f.syncStory(1, 0, 'saga');
        strict_1.default.ok(f.coverage() >= 1.0);
    });
    (0, node_test_1.it)('merge memories', () => {
        const f = new index_js_1.Federation(2, 0.0);
        f.griots[0].addStory('a', 5.0, null);
        f.griots[1].addStory('b', 4.0, null);
        f.mergeMemories(0, 1);
        strict_1.default.ok(f.griots[0].findStory('b') !== undefined);
        strict_1.default.ok(f.griots[1].findStory('a') !== undefined);
    });
});
