import type { BuildOverrides } from '../hooks/useBuildExplorer.js';

export interface SavedBuild {
  id: string;
  name: string;
  className: string;
  overrides: Partial<BuildOverrides>;
  savedAt: number;
}
