// Single source for the CV and the dossier terminal. Updated from the October 2026 PDF CV.

export interface Link {
  label: string;
  href: string;
  handle: string;
}

export interface Job {
  /** Short id used for file names in the dossier terminal. */
  slug: string;
  company: string;
  role: string;
  /** ISO month, e.g. '2018-08'. */
  start: string;
  /** ISO month, or null for the current position. */
  end: string | null;
  missions: string[];
}

export interface Education {
  slug: string;
  school: string;
  title: string;
  start: string;
  end: string;
  details: string[];
}

export interface SkillGroup {
  name: string;
  skills: string[];
}

export interface Article {
  title: string;
  href: string;
  /** ISO date. */
  date: string;
}

export interface Series {
  slug: string;
  title: string;
  platform: 'Medium' | 'dev.to';
  language: 'English' | 'French';
  articles: Article[];
}

export interface SideOp {
  slug: string;
  name: string;
  role: string;
  since: string;
  description: string;
}

export const profile = {
  name: 'Sami Chibani',
  title: 'Senior Site Reliability Engineer',
  aliases: ['SRE', 'Sysadmin', 'DevOps', 'Coffee Lover'],
  location: 'Toulouse, France',
  languages: ['French (native)', 'English (fluent technical)'],
  email: 'sami.chibani.pro@gmail.com',
  /** The PDF version of this CV, exported by hand into public/: update it with this file. */
  pdf: '/sami-chibani-cv.pdf',
  summary:
    'Site Reliability Engineer with hands-on expertise across cloud-native and bare-metal infrastructure, networking, observability and automation. Builds reliable, scalable systems, troubleshoots production incidents, and improves tooling in Python and Go.',
  bio: [
    'I have loved computers since I built my first one at the age of 12, in the early 2000s. But it was only in 2016 that I started to make a living from my passion and became a professional sysadmin.',
    'I have no formal IT education and learned most of my skills from scratch. I might not know everything, but I know how to RTFM and have always found what I needed to complete my missions.',
  ],
  softSkills: [
    'Leadership',
    'Team Coordination',
    'Knowledge Sharing & Mentorship',
    'Passion',
    'Communication',
    'Public Speaking',
    'Initiative & Innovation',
    'Cool Under Pressure',
  ],
  hobbies: ['Open Source', 'Sci-Fi', 'Martial Arts', 'Coffee'],
};

/** Contact channels and public profiles (with the email, in the dossier's contact.txt). */
export const links: Link[] = [
  { label: 'GitHub', href: 'https://github.com/telchak', handle: 'telchak' },
  { label: 'Medium', href: 'https://medium.com/@scanachib', handle: '@scanachib' },
  { label: 'dev.to', href: 'https://dev.to/sami_chibani', handle: 'sami_chibani' },
];

/** Where to hire: job and freelance platforms (the dossier's fixers.txt). */
export const fixers: Link[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sami-chibani/', handle: 'sami-chibani' },
  { label: 'Malt', href: 'https://www.malt.fr/profile/samichibani', handle: 'samichibani' },
];

export const experience: Job[] = [
  {
    slug: 'openairlines',
    company: 'OpenAirlines',
    role: 'Tech Lead SRE',
    start: '2023-06',
    end: null,
    missions: [
      'Built observability with OpenTelemetry, Prometheus, Grafana',
      'Architected GCP networking: HA VPN, Cilium BGP/eBPF, multi-region EU/US/Asia',
      'Built the whole security plane around the HashiCorp Vault platform',
      'Ran GKE, Cloud Run & Compute Engine as code (Terraform)',
      'Maintained CI/CD pipelines; incident management & on-call',
      'Deployed AI agent fleet on Gemini Enterprise Agent Platform',
    ],
  },
  {
    slug: 'safti',
    company: 'SAFTI',
    role: 'System & DevOps Engineer',
    start: '2021-05',
    end: '2023-06',
    missions: [
      'Orchestrated private & AWS cloud infrastructure',
      'Implemented Infrastructure as Code practices',
      'Built GitLab CI/CD workflows',
      'Led incident management',
    ],
  },
  {
    slug: 'byg4lab',
    company: 'BYG4Lab',
    role: 'System Engineer',
    start: '2018-08',
    end: '2021-05',
    missions: [
      'Administered heterogeneous server infrastructure',
      'Executed hybrid cloud migration',
      'Developed internal tools (Angular/.NET frameworks)',
      'Built virtualization cluster and network architecture',
      'Led incident management',
    ],
  },
  {
    slug: 'apaxe',
    company: 'Apaxe',
    role: 'Network and Systems Administrator',
    start: '2017-12',
    end: '2018-08',
    missions: [
      'Administered heterogeneous server infrastructure',
      'Executed hybrid cloud migration',
      'Deployed SharePoint platforms',
      'Managed incident resolution',
      'Conducted user training sessions',
    ],
  },
  {
    slug: 'ensfea',
    company: 'ENSFEA',
    role: 'Network and Systems Administrator',
    start: '2017-07',
    end: '2017-12',
    missions: [
      'Led domain controller migration project',
      'Administered Linux infrastructure',
      'Built virtualization cluster and network architecture',
      'Established data protection strategy',
    ],
  },
];

export const education: Education[] = [
  {
    slug: 'ldnr',
    school: 'LDNR',
    title: 'Linux & Windows System Administrator Training (TSGERI)',
    start: '2016-10',
    end: '2017-07',
    details: [
      'Linux and Windows systems administration',
      'Network infrastructure management',
      'Security and data integrity',
      'Open source advocacy and training',
    ],
  },
  {
    slug: 'paris2',
    school: 'Paris II Panthéon-Assas University',
    title: "Master's degree, Private Law",
    start: '2007-09',
    end: '2012-07',
    details: ["Master's degree in Private Law", "Bachelor's degree"],
  },
];

export const skillGroups: SkillGroup[] = [
  { name: 'Public cloud', skills: ['GCP', 'AWS', 'Scaleway'] },
  { name: 'Linux', skills: ['Ubuntu', 'RHEL'] },
  {
    name: 'Networking',
    skills: ['TCP/IP', 'DNS', 'BGP', 'IPv6', 'Load-balancing', 'Network virtualization (Cilium/eBPF)'],
  },
  { name: 'IaC', skills: ['Terraform/OpenTofu', 'Crossplane'] },
  { name: 'Automation', skills: ['Ansible', 'Bash', 'PowerShell'] },
  { name: 'Orchestration', skills: ['Docker', 'Kubernetes'] },
  { name: 'Programming', skills: ['Python', 'Go', 'TypeScript'] },
  { name: 'Databases', skills: ['PostgreSQL', 'MySQL', 'ClickHouse'] },
  {
    name: 'Observability',
    skills: ['OpenTelemetry', 'Prometheus', 'Grafana', 'New Relic', 'Coralogix', 'Elasticsearch/Kibana'],
  },
  { name: 'CI/CD', skills: ['Jenkins', 'GitHub Actions', 'GitLab CI', 'ArgoCD', 'Dagger CI'] },
  { name: 'AI / Agents', skills: ['Google ADK', 'Gemini Agent Platform', 'LangGraph', 'MCP/A2A'] },
  { name: 'Security', skills: ['Vault/OpenBao'] },
  { name: 'IAM', skills: ['Azure AD', 'Keycloak'] },
];

export const publications: Series[] = [
  {
    slug: 'dagger-ci',
    title: 'CI/CD in the Era of AI and Platform Engineering: A Deep Dive into Dagger CI',
    platform: 'dev.to',
    language: 'English',
    articles: [
      {
        title: 'Part 1: The CI/CD Bottleneck Nobody Talks About',
        href: 'https://dev.to/sami_chibani/cicd-in-the-era-of-ai-and-platform-engineering-a-deep-dive-into-dagger-ci-part-1-58pi',
        date: '2026-03-27',
      },
      {
        title: 'Part 2: Decoupling Pipelines from Infrastructure',
        href: 'https://dev.to/sami_chibani/cicd-in-the-era-of-ai-and-platform-engineering-a-deep-dive-into-dagger-ci-part-2-3e75',
        date: '2026-03-27',
      },
      {
        title: 'Part 3: From Scripts to a Platform: Your CI/CD Module Library',
        href: 'https://dev.to/sami_chibani/cicd-in-the-era-of-ai-and-platform-engineering-a-deep-dive-into-dagger-ci-part-3-9ge',
        date: '2026-03-27',
      },
      {
        title: 'Part 4: The AI-Native CI/CD Stack: Agents, Modules, and Spec-Driven Development',
        href: 'https://dev.to/sami_chibani/cicd-in-the-era-of-ai-and-platform-engineering-a-deep-dive-into-dagger-ci-part-4-4323',
        date: '2026-03-27',
      },
    ],
  },
  {
    slug: 'adk-agents',
    title: 'Building AI agents with Google ADK',
    platform: 'Medium',
    language: 'English',
    articles: [
      {
        title: 'Build Your First Agent with ADK and agents-cli',
        href: 'https://medium.com/@scanachib/build-your-first-agent-with-adk-and-agents-cli-7461f4fd9e04',
        date: '2026-09-25',
      },
      {
        title: 'Give Your Agent Tools: MCP Servers and Function Tools in ADK',
        href: 'https://medium.com/@scanachib/give-your-agent-tools-mcp-servers-and-function-tools-in-adk-37b049f19f6a',
        date: '2026-09-25',
      },
      {
        title: 'Deploy Your First Agent on Vertex AI Agent Runtime',
        href: 'https://medium.com/@scanachib/deploy-your-first-agent-on-vertex-ai-agent-runtime-14d97cd48035',
        date: '2026-09-25',
      },
      {
        title: 'OpenTelemetry Observability of ADK Agents',
        href: 'https://medium.com/@scanachib/opentelemetry-observability-of-adk-agents-b957342380bb',
        date: '2026-09-25',
      },
    ],
  },
  {
    slug: 'agents-adk-fr',
    title: 'Construire des agents IA avec Google ADK',
    platform: 'Medium',
    language: 'French',
    articles: [
      {
        title: 'Créez votre premier agent avec ADK et agents-cli',
        href: 'https://medium.com/@scanachib/cr%C3%A9ez-votre-premier-agent-avec-adk-et-agents-cli-2572cc3c476e',
        date: '2026-09-26',
      },
      {
        title: 'Donnez des outils à votre agent : serveurs MCP et outils dans ADK',
        href: 'https://medium.com/@scanachib/donnez-des-outils-%C3%A0-votre-agent-serveurs-mcp-et-outils-dans-adk-85339f425b08',
        date: '2026-09-27',
      },
      {
        title: 'Déployez votre premier agent sur Vertex AI Agent Runtime',
        href: 'https://medium.com/@scanachib/d%C3%A9ployez-votre-premier-agent-sur-vertex-ai-agent-runtime-e9faaff28d12',
        date: '2026-09-27',
      },
      {
        title: 'Observabilité OpenTelemetry des agents ADK',
        href: 'https://medium.com/@scanachib/observabilit%C3%A9-opentelemetry-des-agents-adk-6db8c4966ff2',
        date: '2026-09-27',
      },
    ],
  },
];

export const sideOps: SideOp[] = [
  {
    slug: 'south_side_tech',
    name: 'South Side Tech',
    role: 'Founder',
    since: '2022',
    description:
      'Non-profit association sharing technical and professional skills to improve inclusion and diversity in the IT field.',
  },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2018-08' -> 'Aug 2018'; null -> 'Present'. */
export function formatMonth(month: string | null): string {
  if (!month) return 'Present';
  const [year, m] = month.split('-');
  return `${MONTHS[Number(m) - 1]} ${year}`;
}
