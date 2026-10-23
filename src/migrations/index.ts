import * as migration_20261023_172405_initial from './20261023_172405_initial';

export const migrations = [
  {
    up: migration_20261023_172405_initial.up,
    down: migration_20261023_172405_initial.down,
    name: '20261023_172405_initial'
  },
];
