// Skill tree shown by the dossier's `skills` command. Tools come from skillGroups in resume.ts.
// `art` names a perk of the official Cyberpunk 2077 build planner whose icon illustrates the node
// (see components/skilltree/sprites.ts).
import { profile, skillGroups } from './resume';

export interface Tool {
  name: string;
  /** Short unique id. */
  code: string;
  art: string;
  /** False for skills not acquired yet: shown locked, like an unbought perk. */
  owned: boolean;
}

export interface Perk {
  id: string;
  name: string;
  art: string;
  description: string;
  tools: Tool[];
}

export interface Tree {
  id: string;
  name: string;
  /** Line icon for the attribute rail (components/skilltree/icons.ts). */
  icon: string;
  art: string;
  description: string;
  perks: Perk[];
}

/** Tool name -> [short unique id, build planner perk illustrating it]. */
const TOOLS: Record<string, readonly [string, string]> = {
  GCP: ['GCP', 'FEEDBACK LOOP'],
  AWS: ['AWS', 'POWER SURGE'],
  Scaleway: ['SCW', 'LIKE A FEATHER'],
  Ubuntu: ['UBU', 'TARGETING PRISM'],
  RHEL: ['RHEL', 'CHROME CONSTITUTION'],
  'TCP/IP': ['TCP', 'COPY-PASTE'],
  DNS: ['DNS', 'PROXIMATE PROPAGATION'],
  BGP: ['BGP', 'TERMINAL VELOCITY'],
  IPv6: ['IPv6', 'BLOOD DAEMON'],
  'Load-balancing': ['LB', 'AMBIDEXTROUS'],
  'Network virtualization (Cilium/eBPF)': ['eBPF', 'SYSTEM OVERWHELM'],
  'Terraform/OpenTofu': ['TF', 'QUAKE'],
  Crossplane: ['XP', 'AIR DASH'],
  Ansible: ['ANS', 'PRECISION SUBROUTINES'],
  Bash: ['SH', 'SKULLCRACKER'],
  PowerShell: ['PS', 'LIGHTNING STORM'],
  Docker: ['DKR', 'SPECULATION'],
  Kubernetes: ['K8S', 'EMBEDDED EXPLOIT'],
  Python: ['PY', 'ACCELERATED TOXIN ABSORPTION'],
  Go: ['GO', 'SHINOBI SPRINT'],
  TypeScript: ['TS', 'RACE AGAINST MIND'],
  PostgreSQL: ['PG', 'JUGGERNAUT'],
  MySQL: ['SQL', 'DEEP BREATH'],
  ClickHouse: ['CH', 'UNEXPOSED'],
  OpenTelemetry: ['OTEL', 'BLIND SPOT'],
  Prometheus: ['PROM', 'BURN THIS CITY'],
  Grafana: ['GRF', 'EXTENDED WARRANTY'],
  'New Relic': ['NR', 'TRANSFUSION'],
  Coralogix: ['CRX', 'PARASITE'],
  'Elasticsearch/Kibana': ['ELK', 'PULL!'],
  Jenkins: ['JNK', 'INTERNAL CLOCK'],
  'GitHub Actions': ['GHA', 'QUEUE PRIORITIZATION'],
  'GitLab CI': ['GLC', 'SMALL TARGET'],
  ArgoCD: ['ARGO', 'CORROSION'],
  'Dagger CI': ['DGR', 'FINISHER: LIVE WIRE'],
  'Google ADK': ['ADK', 'BUILT DIFFERENT'],
  'Gemini Agent Platform': ['GEM', 'SEEING DOUBLE'],
  LangGraph: ['LG', 'RECIRCULATION'],
  'MCP/A2A': ['MCP', 'DRIVER UPDATE'],
  'Vault/OpenBao': ['VLT', 'ENCRYPTION'],
  'Azure AD': ['AAD', 'SUBORDINATION'],
  Keycloak: ['KC', 'VANISHING ACT'],
  'Team Coordination': ['TEAM', 'ARMY OF ONE'],
  'Initiative & Innovation': ['INIT', 'BREAKTHROUGH'],
  Communication: ['COMM', 'PRACTICE MAKES PERFECT'],
  'Public Speaking': ['SPK', 'FIRST AID'],
};

function tool(name: string): Tool {
  const entry = TOOLS[name];
  if (!entry) throw new Error(`Unknown tool: ${name}`);
  return { name, code: entry[0], art: entry[1], owned: true };
}

/** A skill not acquired yet, so not on the CV. */
const next = (name: string, code: string, art: string): Tool => ({ name, code, art, owned: false });

/** Tools of a CV skill group, so the tree stays in sync with resume.ts. */
function group(name: string): Tool[] {
  const found = skillGroups.find((g) => g.name === name);
  if (!found) throw new Error(`Unknown skill group: ${name}`);
  return found.skills.map(tool);
}

function soft(name: string): string {
  if (!profile.softSkills.includes(name)) throw new Error(`Unknown soft skill: ${name}`);
  return name;
}

export const trees: Tree[] = [
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    icon: 'server',
    art: 'EDGERUNNER',
    description: 'Cloud-native and bare-metal platforms, built to stay up.',
    perks: [
      {
        id: 'cloud',
        name: 'Public cloud',
        art: 'SUBLIMATION',
        description:
          'Production across GCP, AWS and Scaleway, including a multi-region EU/US/Asia footprint.',
        tools: [...group('Public cloud'), next('Azure', 'AZ', 'AERIAL ACROBAT')],
      },
      {
        id: 'orchestration',
        name: 'Orchestration',
        art: 'ALL THINGS CYBER',
        description: 'Workloads shipped as containers and run on Kubernetes, GKE in production.',
        tools: [...group('Orchestration'), next('Nomad', 'NMD', 'ROAD WARRIOR')],
      },
      {
        id: 'iac',
        name: 'Infrastructure as Code',
        art: 'ACQUISITION SPECIALIST',
        description: 'GKE, Cloud Run and Compute Engine declared as code. Introduced IaC practices at SAFTI.',
        tools: [...group('IaC'), next('Pulumi', 'PLM', 'MUSCLE MEMORY')],
      },
      {
        id: 'linux',
        name: 'Linux',
        art: 'HACK QUEUE',
        description: 'Heterogeneous server fleets administered since 2016.',
        tools: [...group('Linux'), next('NixOS', 'NIX', 'SHOOT TO CHILL')],
      },
    ],
  },
  {
    id: 'network',
    name: 'Network & Security',
    icon: 'globe',
    art: 'CHAIN LIGHTNING',
    description: 'Packets, routes and the doors in front of them.',
    perks: [
      {
        id: 'networking',
        name: 'Networking',
        art: 'TARGET LOCK TRANSFER',
        description: 'Architected GCP networking: HA VPN, Cilium BGP/eBPF, multi-region EU/US/Asia.',
        tools: [...group('Networking'), next('Istio', 'IST', 'TUNNEL VISION')],
      },
      {
        id: 'iam',
        name: 'Identity',
        art: 'LICENSE TO CHROME',
        description: 'Identity and access management, from Active Directory migrations to Keycloak.',
        tools: [...group('IAM'), next('SPIFFE/SPIRE', 'SPFE', 'HEAD TO HEAD')],
      },
      {
        id: 'security',
        name: 'Secrets',
        art: 'NO ESCAPE',
        description: 'Secrets kept out of code and out of reach.',
        tools: [...group('Security'), next('Infisical', 'INF', 'DEADEYE')],
      },
    ],
  },
  {
    id: 'delivery',
    name: 'Automation & Delivery',
    icon: 'gear',
    art: 'TAILWIND',
    description: 'Removing toil, one pipeline at a time.',
    perks: [
      {
        id: 'cicd',
        name: 'CI/CD',
        art: 'DASH',
        description:
          'Pipelines built and maintained across five platforms. Wrote a four-part series on Dagger CI.',
        tools: [...group('CI/CD'), next('Tekton', 'TKN', 'BOLT')],
      },
      {
        id: 'automation',
        name: 'Automation',
        art: 'GEARHEAD',
        description: 'Configuration management and scripting for Linux and Windows estates.',
        tools: [...group('Automation'), next('Puppet', 'PPT', 'SLEIGHT OF HAND')],
      },
      {
        id: 'programming',
        name: 'Programming',
        art: 'OPTIMIZATION',
        description: 'Improves tooling in Python and Go. TypeScript too: this site is one.',
        tools: [...group('Programming'), next('Rust', 'RS', 'WRECKING BALL')],
      },
    ],
  },
  {
    id: 'observability',
    name: 'Observability & Data',
    icon: 'eye',
    art: 'SMART SYNERGY',
    description: 'See everything, store what matters.',
    perks: [
      {
        id: 'telemetry',
        name: 'Observability',
        art: 'EYE IN THE SKY',
        description:
          'Built observability with OpenTelemetry, Prometheus and Grafana. Troubleshoots production incidents.',
        tools: [...group('Observability'), next('Pyroscope', 'PYRO', 'FRIENDLIER FIRE')],
      },
      {
        id: 'databases',
        name: 'Databases',
        art: 'QUEUE HACK_ROOT',
        description: 'Relational and analytical stores in production.',
        tools: [...group('Databases'), next('Redis', 'RDS', 'DATA RECYCLER')],
      },
    ],
  },
  {
    id: 'ai',
    name: 'AI / Agents',
    icon: 'chip',
    art: 'QUEUE MASTERY',
    description: 'Agents in production, with the same rigor as any other service.',
    perks: [
      {
        id: 'agents',
        name: 'Agent platforms',
        art: 'OVERCLOCK',
        description:
          'Deployed an AI agent fleet on Gemini Enterprise Agent Platform. Writes about ADK agents on Medium.',
        tools: [...group('AI / Agents'), next('vLLM', 'VLLM', 'SIPHON')],
      },
    ],
  },
  {
    id: 'soft',
    name: 'Soft Skills',
    icon: 'people',
    art: 'NERVES OF TUNGSTEN-STEEL',
    description: 'Leading people and keeping a cool head when production is not.',
    perks: [
      {
        id: 'leadership',
        name: soft('Leadership'),
        art: 'JUGGLER',
        description: 'Tech Lead SRE at OpenAirlines. Leads incident management and on-call.',
        tools: [soft('Team Coordination'), soft('Initiative & Innovation')].map(tool),
      },
      {
        id: 'mentorship',
        name: soft('Knowledge Sharing & Mentorship'),
        art: 'PAY IT FORWARD',
        description: 'Founded South Side Tech and publishes on Medium and dev.to.',
        tools: [
          ...[soft('Communication'), soft('Public Speaking')].map(tool),
          next('Conference Speaking', 'CONF', 'IN CHARGE'),
        ],
      },
      {
        id: 'cool',
        name: soft('Cool Under Pressure'),
        art: 'CALM MIND',
        description: 'Keeps a steady hand during production incidents and on-call nights.',
        tools: [],
      },
      {
        id: 'passion',
        name: soft('Passion'),
        art: 'PYROMANIA',
        description: 'Built a first computer at the age of 12. Still at it.',
        tools: [],
      },
    ],
  },
];

/** Acquired tools of a perk; skills not acquired yet are shown but not counted. */
const ownedTools = (perk: Perk) => perk.tools.filter((t) => t.owned).length;

/** Acquired tools of a tree. */
export const treeToolCount = (tree: Tree) => tree.perks.reduce((n, p) => n + ownedTools(p), 0);

/** A perk is complete once every tool is acquired (the planner's "maxed" state). */
export const isComplete = (perk: Perk) => ownedTools(perk) === perk.tools.length;

/** Perk level badge: acquired over total tools, e.g. 3/4 (1/1 for perks without tools). */
export const perkLevel = (perk: Perk) =>
  perk.tools.length ? `${ownedTools(perk)}/${perk.tools.length}` : '1/1';
