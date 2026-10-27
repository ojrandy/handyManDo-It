import * as migration_20261023_172405_initial from './20261023_172405_initial';
import * as migration_20261027_135007_add_team_partners from './20261027_135007_add_team_partners';
import * as migration_20261027_140524_add_services from './20261027_140524_add_services';
import * as migration_20261027_141521_add_projects_testimonials from './20261027_141521_add_projects_testimonials';
import * as migration_20261027_143241_add_faqs from './20261027_143241_add_faqs';
import * as migration_20261027_151415_add_posts_categories from './20261027_151415_add_posts_categories';
import * as migration_20261027_154349_add_jobs_submissions from './20261027_154349_add_jobs_submissions';

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
    name: '20261027_141521_add_projects_testimonials',
  },
  {
    up: migration_20261027_143241_add_faqs.up,
    down: migration_20261027_143241_add_faqs.down,
    name: '20261027_143241_add_faqs',
  },
  {
    up: migration_20261027_151415_add_posts_categories.up,
    down: migration_20261027_151415_add_posts_categories.down,
    name: '20261027_151415_add_posts_categories',
  },
  {
    up: migration_20261027_154349_add_jobs_submissions.up,
    down: migration_20261027_154349_add_jobs_submissions.down,
    name: '20261027_154349_add_jobs_submissions'
  },
];
