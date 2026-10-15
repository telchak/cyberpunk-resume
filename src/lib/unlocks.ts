// Dossier sections unlocked by past breaches, kept in localStorage.
const KEY = 'breach.unlocked';

export function loadUnlocks(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

/** Adds sections to the ones already unlocked by previous breaches. */
export function saveUnlocks(sections: Iterable<string>): void {
  const all = loadUnlocks();
  for (const s of sections) all.add(s);
  try {
    localStorage.setItem(KEY, JSON.stringify([...all]));
  } catch {
    // Private mode or storage disabled: unlocks only last for this page.
  }
}
