import * as migration_20261023_172405_initial from './20261023_172405_initial';
import * as migration_20261027_135007_add_team_partners from './20261027_135007_add_team_partners';
import * as migration_20261027_140524_add_services from './20261027_140524_add_services';
import * as migration_20261027_141521_add_projects_testimonials from './20261027_141521_add_projects_testimonials';

export const migrations = [
  {
    up: migration_20261023_172405_initial.up,
    down: migration_20261023_172405_initial.down,
    name: '20261023_172405_initial',
  },
  {
    up: migration_20261027_135007_add_team_partners.up,
    down: migration_20261027_135007_add_team_partners.down,
    name: '20261027_135007_add_team_partners',
  },
  {
    up: migration_20261027_140524_add_services.up,
    down: migration_20261027_140524_add_services.down,
    name: '20261027_140524_add_services',
  },
  {
    up: migration_20261027_141521_add_projects_testimonials.up,
    down: migration_20261027_141521_add_projects_testimonials.down,
    name: '20261027_141521_add_projects_testimonials'
  },
];
