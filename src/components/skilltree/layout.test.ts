import { describe, expect, it } from 'vitest';
import { profile, skillGroups } from '../../data/resume';
import { trees } from '../../data/skilltree';
import { ICONS } from './icons';
import { artOf, layoutTree, TILE } from './layout';
import { SPRITE_SIZE, SPRITES } from './sprites';

const allNodes = trees.flatMap((tree) => layoutTree(tree).nodes);

describe('skill tree data', () => {
  const tools = trees.flatMap((t) => t.perks.flatMap((p) => p.tools));
  const cvSkills = [...skillGroups.flatMap((g) => g.skills), ...profile.softSkills];

  it('places every CV skill and soft skill exactly once', () => {
    const perks = trees.flatMap((t) => t.perks.map((p) => p.name));
    const names = tools.map((t) => t.name);
    for (const skill of skillGroups.flatMap((g) => g.skills)) expect(names).toContain(skill);
    for (const skill of profile.softSkills) expect([...names, ...perks]).toContain(skill);
    expect(new Set(names).size).toBe(names.length);
  });

  it('only marks CV skills as acquired', () => {
    for (const tool of tools) expect(cvSkills.includes(tool.name), tool.name).toBe(tool.owned);
  });

  it('illustrates every node with a distinct planner icon that exists in the sprite sheet', () => {
    const arts = allNodes.map(artOf);
    expect(new Set(arts).size).toBe(arts.length);
    for (const art of arts) {
      const sprite = SPRITES[art];
      expect(sprite, art).toBeDefined();
      const [x, y, w, h] = sprite;
      expect(x + w).toBeLessThanOrEqual(SPRITE_SIZE[0]);
      expect(y + h).toBeLessThanOrEqual(SPRITE_SIZE[1]);
    }
  });

  it('has a rail icon for every tree', () => {
    for (const tree of trees) expect(ICONS[tree.icon], tree.icon).toBeDefined();
  });

  it('gives every node a unique key', () => {
    const keys = allNodes.map((n) => n.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('layoutTree', () => {
  it('keeps every tile inside the tree and without overlaps', () => {
    for (const tree of trees) {
      const { width, height, nodes } = layoutTree(tree);
      const box = (n: (typeof nodes)[number]) => {
        const { w, h } = TILE[n.kind];
        return { l: n.x - w / 2, r: n.x + w / 2, t: n.y - h / 2, b: n.y + h / 2 };
      };
      for (const n of nodes) {
        const b = box(n);
        expect(b.l).toBeGreaterThanOrEqual(0);
        expect(b.r).toBeLessThanOrEqual(width);
        expect(b.t).toBeGreaterThanOrEqual(0);
        expect(b.b).toBeLessThanOrEqual(height);
      }
      for (const a of nodes) {
        for (const c of nodes) {
          if (a === c) continue;
          const [p, q] = [box(a), box(c)];
          const apart = p.r <= q.l || q.r <= p.l || p.b <= q.t || q.b <= p.t;
          expect(apart, `${a.key} overlaps ${c.key}`).toBe(true);
        }
      }
    }
  });

  it('lays one cable per link', () => {
    for (const tree of trees) {
      const { nodes, cables } = layoutTree(tree);
      expect(cables).toHaveLength(nodes.length - 1);
    }
  });

  it('draws locked cables exactly to the skills not acquired yet', () => {
    for (const tree of trees) {
      const { cables } = layoutTree(tree);
      const locked = tree.perks.flatMap((p) => p.tools).filter((t) => !t.owned).length;
      expect(cables.filter((c) => c.locked)).toHaveLength(locked);
    }
  });

  it('reuses the planner spacing: tools 260 units from their perk, rows 396 apart', () => {
    const { nodes } = layoutTree(trees[0]);
    const perks = nodes.filter((n) => n.kind === 'perk');
    expect(perks[1].y - perks[0].y).toBe(396);
    const tool = nodes.find((n) => n.kind === 'tool')!;
    expect(Math.abs(tool.x - perks[0].x)).toBe(260);
    expect(Math.abs(tool.y - perks[0].y)).toBe(96);
  });
});
