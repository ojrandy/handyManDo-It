import * as migration_20261023_172405_initial from './20261023_172405_initial';
import * as migration_20261027_135007_add_team_partners from './20261027_135007_add_team_partners';

export const migrations = [
  {
    up: migration_20261023_172405_initial.up,
    down: migration_20261023_172405_initial.down,
    name: '20261023_172405_initial',
  },
  {
    up: migration_20261027_135007_add_team_partners.up,
    down: migration_20261027_135007_add_team_partners.down,
    name: '20261027_135007_add_team_partners'
  },
];
