// Downloads the official build planner's skill tree artwork (cyberpunk.net) into public/skilltree/.
// Artwork © CD PROJEKT RED, used as non-commercial fan content under their fan content guidelines:
// https://www.cdprojektred.com/en/fan-content
//
// The hashed file names come from cyberpunk.net's build at the time of writing; if a download
// fails, open the build planner, find the new name in the network tab and update it here.
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://www.cyberpunk.net/build/images/';
const FILES = {
  'perks.png': 'maxed-9a8780b7.png', // perk icons, maxed state
  'cables.png': 'maxed-ab33beb4.png', // perk-to-milestone cables, maxed state
  'bg.webp': 'bg-70388ab4.webp',
  'tile-master.png': 'tile-master-maxed-472133c0.png',
  'tile-master-glow.png': 'tile-master-maxed-glow-3449f49c.png',
  'tile-milestone.png': 'tile-milestone-maxed-edc31f05.png',
  'tile-milestone-glow.png': 'tile-milestone-maxed-glow-f59aa444.png',
  'tile-perk.png': 'tile-perk-maxed-2ca6eb4f.png',
  'target.svg': 'target-c10dde9d.svg',
  // Skills not acquired yet: locked tile, "not connected" icons and cables, partly invested perks.
  'perks-locked.png': 'not_connected-dff9bee3.png',
  'cables-locked.png': 'not_connected-71149b76.png',
  'tile-perk-locked.png': 'tile-perk-locked-9e403d87.png',
  'tile-milestone-invested.png': 'tile-milestone-invested-f0e6d754.png',
};

const dir = new URL('../public/skilltree/', import.meta.url);
await mkdir(dir, { recursive: true });

for (const [name, remote] of Object.entries(FILES)) {
  const response = await fetch(BASE + remote);
  if (!response.ok) throw new Error(`${remote}: HTTP ${response.status}`);
  await writeFile(new URL(name, dir), Buffer.from(await response.arrayBuffer()));
  console.log(`public/skilltree/${name}`);
}
console.log('Artwork © CD PROJEKT RED. Keep the fan content notice visible on the site.');
