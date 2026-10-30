import * as migration_20261023_172405_initial from './20261023_172405_initial'
import * as migration_20261027_135007_add_team_partners from './20261027_135007_add_team_partners'
import * as migration_20261027_140524_add_services from './20261027_140524_add_services'
import * as migration_20261027_141521_add_projects_testimonials from './20261027_141521_add_projects_testimonials'
import * as migration_20261027_143241_add_faqs from './20261027_143241_add_faqs'
import * as migration_20261027_151415_add_posts_categories from './20261027_151415_add_posts_categories'
import * as migration_20261027_154349_add_jobs_submissions from './20261027_154349_add_jobs_submissions'
import * as migration_20261027_165018_add_app_screens from './20261027_165018_add_app_screens'
import * as migration_20261027_170611_add_navigation_seo_globals from './20261027_170611_add_navigation_seo_globals'
import * as migration_20261027_214123_add_home_global from './20261027_214123_add_home_global'
import * as migration_20261027_221436_add_redirects from './20261027_221436_add_redirects'
import * as migration_20261028_230912_hero_video_sizes from './20261028_230912_hero_video_sizes'
import * as migration_20261029_084922_phone_size_pro_screen from './20261029_084922_phone_size_pro_screen'
import * as migration_20261029_225000_service_category from './20261029_225000_service_category'
import * as migration_20261030_083110_project_city_optional from './20261030_083110_project_city_optional'
import * as migration_20261030_110258_hero_slides from './20261030_110258_hero_slides'

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
    name: '20261027_154349_add_jobs_submissions',
  },
  {
    up: migration_20261027_165018_add_app_screens.up,
    down: migration_20261027_165018_add_app_screens.down,
    name: '20261027_165018_add_app_screens',
  },
  {
    up: migration_20261027_170611_add_navigation_seo_globals.up,
    down: migration_20261027_170611_add_navigation_seo_globals.down,
    name: '20261027_170611_add_navigation_seo_globals',
  },
  {
    up: migration_20261027_214123_add_home_global.up,
    down: migration_20261027_214123_add_home_global.down,
    name: '20261027_214123_add_home_global',
  },
  {
    up: migration_20261027_221436_add_redirects.up,
    down: migration_20261027_221436_add_redirects.down,
    name: '20261027_221436_add_redirects',
  },
  {
    up: migration_20261028_230912_hero_video_sizes.up,
    down: migration_20261028_230912_hero_video_sizes.down,
    name: '20261028_230912_hero_video_sizes',
  },
  {
    up: migration_20261029_084922_phone_size_pro_screen.up,
    down: migration_20261029_084922_phone_size_pro_screen.down,
    name: '20261029_084922_phone_size_pro_screen',
  },
  {
    up: migration_20261029_225000_service_category.up,
    down: migration_20261029_225000_service_category.down,
    name: '20261029_225000_service_category',
  },
  {
    up: migration_20261030_083110_project_city_optional.up,
    down: migration_20261030_083110_project_city_optional.down,
    name: '20261030_083110_project_city_optional',
  },
  {
    up: migration_20261030_110258_hero_slides.up,
    down: migration_20261030_110258_hero_slides.down,
    name: '20261030_110258_hero_slides',
  },
]
