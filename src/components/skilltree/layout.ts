import type { Perk, Tool, Tree } from '../../data/skilltree';

/*
 * Geometry of the official build planner (cyberpunk.net), in its native canvas units: an
 * attribute ("master" tile) on top, perks ("milestone" tiles) on a vertical spine, and tools
 * ("perk" tiles) at the four corners of their perk, linked by the planner's own cable pieces.
 */

/** Tile sizes, and the icon box inside each tile. */
export const TILE = {
  attribute: { w: 380, h: 336, icon: [252, 256] },
  perk: { w: 236, h: 236, icon: [180, 180] },
  tool: { w: 140, h: 148, icon: [126, 116] },
} as const;

/** Glow images drawn behind the large tiles. */
export const GLOW = { attribute: 564, perk: 616 } as const;

/** Distance from a perk to its tools, and to the second ring used when a perk has more than four. */
const SIDE = 260;
const SIDE_OUTER = 520;
const RISE = 96;
const FIRST_ROW = 450;
const ROW = 396;
const TOP = 56;
const MARGIN = 40;

export interface Cable {
  /** Top-left corner and size, in tree coordinates. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Position of the piece in the cable sprite sheets. */
  sx: number;
  sy: number;
  /** Leads to a skill not acquired yet: drawn with the planner's "not connected" cables. */
  locked: boolean;
}

/** Cable pieces of the planner's sprite, with their offset from the perk center when relevant. */
const PIECES = {
  topLeft: { dx: -199, dy: -138, w: 124, h: 64, sx: 919, sy: 470 },
  topRight: { dx: 77, dy: -138, w: 124, h: 64, sx: 919, sy: 570 },
  bottomLeft: { dx: -199, dy: 76, w: 124, h: 64, sx: 0, sy: 908 },
  bottomRight: { dx: 77, dy: 76, w: 124, h: 64, sx: 124, sy: 908 },
  spine: { dx: -18, w: 38, h: 188, sx: 1132, sy: 246 },
  linkLeft: { w: 112, h: 32, sx: 919, sy: 634 },
  linkRight: { w: 112, h: 32, sx: 919, sy: 534 },
} as const;

export type Selection =
  | { kind: 'attribute'; tree: Tree }
  | { kind: 'perk'; tree: Tree; perk: Perk }
  | { kind: 'tool'; tree: Tree; perk: Perk; tool: Tool };

export const labelOf = (node: Selection) =>
  node.kind === 'attribute' ? node.tree.name : node.kind === 'perk' ? node.perk.name : node.tool.name;

/** Name of the build planner perk whose icon illustrates the node. */
export const artOf = (node: Selection) =>
  node.kind === 'attribute' ? node.tree.art : node.kind === 'perk' ? node.perk.art : node.tool.art;

export type PlacedNode = Selection & {
  key: string;
  /** Center, in tree coordinates. */
  x: number;
  y: number;
  /** Reveal order, used to stagger the power-up animation. */
  order: number;
};

export interface TreeLayout {
  width: number;
  height: number;
  nodes: PlacedNode[];
  cables: Cable[];
}

type Slot = { side: -1 | 1; rise: -1 | 1; outer: boolean };

/** Tool slots in filling order: bottom corners first, as the planner does, then top, then the outer ring. */
const SLOTS: Slot[] = [false, true].flatMap((outer) => [
  { side: -1 as const, rise: 1 as const, outer },
  { side: 1 as const, rise: 1 as const, outer },
  { side: -1 as const, rise: -1 as const, outer },
  { side: 1 as const, rise: -1 as const, outer },
]);

export function layoutTree(tree: Tree): TreeLayout {
  const outer = tree.perks.some((p) => p.tools.length > 4);
  const reach = (outer ? SIDE_OUTER : SIDE) + TILE.tool.w / 2;
  const width = 2 * (reach + MARGIN);
  const cx = width / 2;
  const nodes: PlacedNode[] = [];
  const cables: Cable[] = [];
  const piece = (p: { w: number; h: number; sx: number; sy: number }, x: number, y: number, locked = false) =>
    cables.push({ x, y, w: p.w, h: p.h, sx: p.sx, sy: p.sy, locked });
  let order = 0;

  const attributeY = TOP + TILE.attribute.h / 2;
  nodes.push({ kind: 'attribute', tree, key: tree.id, x: cx, y: attributeY, order: order++ });

  tree.perks.forEach((perk, row) => {
    const y = attributeY + FIRST_ROW + row * ROW;
    if (perk.tools.length > SLOTS.length) throw new Error(`${perk.id}: at most ${SLOTS.length} tools`);

    piece(PIECES.spine, cx + PIECES.spine.dx, y - (row === 0 ? 300 : 291));
    nodes.push({ kind: 'perk', tree, perk, key: `${tree.id}/${perk.id}`, x: cx, y, order: order++ });

    perk.tools.forEach((tool, i) => {
      const { side, rise, outer: far } = SLOTS[i];
      const tx = cx + side * (far ? SIDE_OUTER : SIDE);
      const ty = y + rise * RISE;
      if (far) {
        // Chained from the inner tool on the same corner.
        const link = side < 0 ? PIECES.linkLeft : PIECES.linkRight;
        const gapStart = cx + side * (SIDE + TILE.tool.w / 2);
        const gapEnd = cx + side * (SIDE_OUTER - TILE.tool.w / 2);
        piece(link, (gapStart + gapEnd) / 2 - link.w / 2, ty - 9, !tool.owned);
      } else {
        const corner =
          rise < 0
            ? side < 0
              ? PIECES.topLeft
              : PIECES.topRight
            : side < 0
              ? PIECES.bottomLeft
              : PIECES.bottomRight;
        piece(corner, cx + corner.dx, y + corner.dy, !tool.owned);
      }
      nodes.push({
        kind: 'tool',
        tree,
        perk,
        tool,
        key: `${tree.id}/${perk.id}/${tool.code}`,
        x: tx,
        y: ty,
        order: order++,
      });
    });
  });

  const last = attributeY + FIRST_ROW + (tree.perks.length - 1) * ROW;
  return { width, height: last + RISE + TILE.tool.h / 2 + MARGIN, nodes, cables };
}
