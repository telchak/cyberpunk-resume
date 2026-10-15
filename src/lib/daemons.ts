import type { GenerateOptions } from './breach/generator';

/**
 * Dossier directories, in display order. Each one is decrypted by uploading its daemon in the
 * breach; the daemon's id is the directory id, so an installed daemon unlocks `~/<id>`.
 */
export const SECTIONS = [
  {
    id: 'identity',
    title: 'IDENTITY',
    daemon: 'DATAMINE_V1',
    description: 'Extracts identity records and contact channels',
    length: 2,
  },
  {
    id: 'career',
    title: 'CAREER RECORDS',
    daemon: 'DATAMINE_V2',
    description: 'Extracts employment history, education and skill matrix',
    length: 3,
  },
  {
    id: 'projects',
    title: 'PROJECT ARCHIVES',
    daemon: 'DATAMINE_V3',
    description: 'Extracts project archives and publications',
    length: 4,
  },
] as const;

export const BREACH_OPTIONS: GenerateOptions = {
  size: 6,
  bufferSize: 8,
  timeLimit: 30,
  daemons: SECTIONS.map(({ id, daemon, description, length }) => ({ id, name: daemon, description, length })),
};
