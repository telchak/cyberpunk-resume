// Line-art pictograms (24x24, stroked) for the attribute rail of the skill tree.

/** Closed cog outline centered on (12, 12): `teeth` flat teeth between radii `outer` and `inner`. */
function cog(teeth: number, outer: number, inner: number): string {
  const points: string[] = [];
  const step = (Math.PI * 2) / teeth;
  const at = (r: number, a: number) =>
    `${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    points.push(
      at(inner, a - step * 0.3),
      at(outer, a - step * 0.18),
      at(outer, a + step * 0.18),
      at(inner, a + step * 0.3),
    );
  }
  return `M${points.join('L')}z`;
}

export const ICONS: Record<string, string> = {
  server: 'M4 3h16v5H4zM4 10h16v5H4zM4 17h16v4H4zM7 5.5h3M7 12.5h3M7 19h3M16 5.5h1M16 12.5h1',
  globe:
    'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM3 12h18M12 3c3.5 3.5 3.5 14.5 0 18M12 3c-3.5 3.5-3.5 14.5 0 18M5 7.5h14M5 16.5h14',
  gear: `${cog(8, 9.5, 7)}M12 8.8a3.2 3.2 0 1 0 0 6.4a3.2 3.2 0 1 0 0-6.4z`,
  eye: 'M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM12 2v2M4.5 4.5l1.4 1.4M19.5 4.5l-1.4 1.4',
  chip: 'M7 7h10v10H7zM10 10h4v4h-4zM9.5 3v4M14.5 3v4M9.5 17v4M14.5 17v4M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4',
  people:
    'M9 4.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a2.6 2.6 0 0 1 0 5.2M17.5 14.2c2.1.6 3.5 2.9 3.5 5.8',
};
