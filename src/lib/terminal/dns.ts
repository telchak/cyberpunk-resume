// `dig` in the dossier terminal: real DNS lookups, made from the visitor's browser through
// Cloudflare's public DNS-over-HTTPS JSON API, printed like dig's answer section.
import type { Line } from './fs';

export const DNS_TYPES: Record<string, number> = { A: 1, NS: 2, CNAME: 5, SOA: 6, MX: 15, TXT: 16, AAAA: 28 };
const TYPE_NAMES = Object.fromEntries(Object.entries(DNS_TYPES).map(([name, code]) => [code, name]));
const STATUS: Record<number, string> = { 0: 'NOERROR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 5: 'REFUSED' };

export interface DigQuery {
  name: string;
  type: string;
  /** `+short`: only the answers' data. */
  short: boolean;
}

/** dig's arguments: a name, a type (before or after it, or after -t, default A) and +short. */
export function parseDig(args: string[]): DigQuery | string {
  let name: string | undefined;
  let type = 'A';
  let short = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '+short') short = true;
    else if (arg === '-t') type = (args[++i] ?? '').toUpperCase();
    // dig's other options (+noall, -4...) change nothing here.
    else if (/^[+-]/.test(arg)) continue;
    else if (arg.toUpperCase() in DNS_TYPES) type = arg.toUpperCase();
    else name = arg;
  }
  if (!name) return 'dig: missing name, e.g. `dig example.com TXT`';
  if (!(type in DNS_TYPES)) return `dig: unsupported type ${type} (${Object.keys(DNS_TYPES).join(', ')})`;
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) return `dig: invalid name: ${name}`;
  return { name: name.replace(/\.$/, ''), type, short };
}

interface Answer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export async function dig({ name, type, short }: DigQuery, fetcher: typeof fetch = fetch): Promise<Line[]> {
  const response = await fetcher(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { Accept: 'application/dns-json' } },
  );
  if (!response.ok) throw new Error(`DNS over HTTPS: HTTP ${response.status}`);
  const result = (await response.json()) as { Status: number; Answer?: Answer[] };
  const answers = result.Answer ?? [];
  const text = (t: string): Line => ({ t: 'text', text: t });
  if (short) return answers.map((a) => text(a.data));
  return [
    text(`; <<>> DiG <<>> ${name} ${type}`),
    text(`;; status: ${STATUS[result.Status] ?? result.Status}, answers: ${answers.length}`),
    ...(answers.length
      ? [
          { t: 'blank' } as Line,
          text(';; ANSWER SECTION:'),
          ...answers.map((a) => text(`${a.name}.  ${a.TTL}  IN  ${TYPE_NAMES[a.type] ?? a.type}  ${a.data}`)),
        ]
      : []),
  ];
}
