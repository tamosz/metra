import type { CgsValues } from '../utils/cgs.js';

export interface SavedCgsBuild {
  id: string;
  name: string;
  cgs: CgsValues;
}
