// Projects from the old site's "Our Works" gallery (handymandoit.com/our-works.html, read
// 2026-10-29): nine photo groups under a heading each, no client, city or date. Six photos per
// group (four for Dash Media) were saved to public/images/projects/<slug>/ as WebP; the old files
// are 500–750 px wide (Q-12). Titles follow the old headings (typos fixed); the one-line stories
// and alt texts describe what the photos show. Cities and dates were assigned by the owner
// (2026-10-30), except Crystal Hair Challenge (its banner: Stade de Soppo, Buea, 3 Dec 2022) and
// W.A.F. (its photos: Bonassama health district, Douala).
// French is our translation (R-08 review).
import type { Localized } from './data'
import type { ServiceKey } from '@/lib/service-keys'

export type ProjectContent = {
  slug: Localized<string>
  title: Localized<string>
  service: ServiceKey
  client: string | null
  city: string | null
  // First day of the month (the field shows month and year).
  date: string
  featured: boolean
  story: Localized<string>
  // One alt per photo, in file order (<slug>-1.webp, <slug>-2.webp, …).
  photos: Localized<string>[]
  // File number of the cover photo; the old gallery's first photo isn't always the best one.
  cover?: number
}

const alt = (en: string, fr: string): Localized<string> => ({ en, fr })

export const projectContent: ProjectContent[] = [
  {
    slug: { en: 'crystal-hair-challenge-2022', fr: 'crystal-hair-challenge-2022' },
    title: { en: 'Crystal Hair Challenge 2022', fr: 'Crystal Hair Challenge 2022' },
    service: 'events',
    client: 'Crystal Hair Challenge · Webspectron · Solpia Cameroon',
    city: 'Buea',
    date: '2022-12-03',
    featured: true,
    story: {
      en: 'Branding and set-up for the Crystal Hair Challenge 2022: stage banner, sponsor photo wall, tents and product stands.',
      fr: 'Habillage et installation du Crystal Hair Challenge 2022 : bannière de scène, mur photo des sponsors, tentes et stands produits.',
    },
    photos: [
      alt(
        'Crystal Hair Challenge 2022 stage banner',
        'Bannière de scène du Crystal Hair Challenge 2022',
      ),
      alt(
        'Team member in front of the sponsor photo wall',
        'Membre de l’équipe devant le mur photo des sponsors',
      ),
      alt(
        'Sponsor photo wall with Crystal, Mama Africa and OLA logos',
        'Mur photo des sponsors avec les logos Crystal, Mama Africa et OLA',
      ),
      alt('White event tents with roll-up banners', 'Tentes d’événement blanches et kakémonos'),
      alt(
        'Hair product display stands under a tent',
        'Présentoirs de produits capillaires sous une tente',
      ),
      alt(
        'Guests at the product tables under the tent',
        'Invités aux tables de produits sous la tente',
      ),
    ],
  },
  {
    slug: { en: 'cupboards-wardrobes-tv-stands', fr: 'placards-armoires-meubles-tv' },
    title: {
      en: 'Cupboards, wardrobes, dining and TV stands',
      fr: 'Placards, armoires, salles à manger et meubles TV',
    },
    service: 'upholsteryFurniture',
    client: null,
    city: 'Yaoundé',
    date: '2024-03-01',
    featured: true,
    story: {
      en: 'Made-to-measure furniture from our workshop: TV wall units, wardrobes and storage, built and fitted in clients’ homes and offices.',
      fr: 'Mobilier sur mesure de notre atelier : meubles TV muraux, armoires et rangements, fabriqués et posés chez nos clients, à la maison comme au bureau.',
    },
    photos: [
      alt(
        'White TV wall unit with shelves and drawers',
        'Meuble TV mural blanc avec étagères et tiroirs',
      ),
      alt('Black wardrobe with a built-in TV niche', 'Armoire noire avec niche TV intégrée'),
      alt(
        'Fitted storage unit before the doors are installed',
        'Rangement intégré avant la pose des portes',
      ),
      alt(
        'Office corner with fitted blinds and furniture',
        'Coin bureau avec stores et mobilier installés',
      ),
      alt(
        'Grey and white TV wall unit with blue lighting',
        'Meuble TV mural gris et blanc avec éclairage bleu',
      ),
      alt(
        'Living room wall unit with open shelves',
        'Meuble mural de séjour avec étagères ouvertes',
      ),
    ],
  },
  {
    slug: { en: 'corporate-women-in-leadership', fr: 'corporate-women-in-leadership' },
    title: {
      en: 'Corporate Women in Leadership event · Fabz Magazine',
      fr: 'Événement Corporate Women in Leadership · Fabz Magazine',
    },
    service: 'events',
    client: 'CWIL · Fabz Magazine',
    city: 'Douala',
    date: '2023-03-01',
    featured: true,
    story: {
      en: 'Stage, backdrops, live TV set and a branded reception desk for the Corporate Women in Leadership event.',
      fr: 'Scène, toiles de fond, plateau TV en direct et comptoir d’accueil personnalisé pour l’événement Corporate Women in Leadership.',
    },
    photos: [
      alt(
        'Live TV set with a branded backdrop on the lawn',
        'Plateau TV en direct avec toile de fond personnalisée sur la pelouse',
      ),
      alt(
        'Conference stage with white armchairs and screens',
        'Scène de conférence avec fauteuils blancs et écrans',
      ),
      alt(
        'Outdoor stage with red carpet and backdrops',
        'Scène extérieure avec tapis rouge et toiles de fond',
      ),
      alt(
        'Two team members in safety vests at the venue',
        'Deux membres de l’équipe en gilet de sécurité sur le site',
      ),
      alt(
        'Women in Leadership branded reception desk',
        'Comptoir d’accueil aux couleurs de Women in Leadership',
      ),
      alt(
        'Speakers on stage in front of the event backdrop',
        'Intervenantes sur scène devant la toile de fond de l’événement',
      ),
    ],
  },
  {
    slug: { en: 'dash-media-news-studio', fr: 'studio-dash-media' },
    title: { en: 'Dash Media news studio', fr: 'Studio d’information Dash Media' },
    service: 'remodeling',
    client: 'Dash Media',
    city: 'Buea',
    date: '2023-08-01',
    featured: true,
    story: {
      en: 'Design illustrations of the Dash TV news studio: news desk, screens, interview corner and lighting.',
      fr: 'Illustrations du studio d’information de Dash TV : desk de présentation, écrans, coin interview et éclairage.',
    },
    photos: [
      alt(
        'Dash TV news desk with breaking-news screens',
        'Desk de Dash TV avec écrans « breaking news »',
      ),
      alt(
        'Dash Media studio with blue lighting and screens',
        'Studio Dash Media avec éclairage bleu et écrans',
      ),
      alt(
        'Dash TV interview table with red chairs',
        'Table d’interview de Dash TV avec chaises rouges',
      ),
      alt(
        'Red Dash TV studio set with a green armchair',
        'Plateau rouge de Dash TV avec un fauteuil vert',
      ),
    ],
  },
  {
    slug: { en: 'kitchen-cabinets-imported-doors', fr: 'cuisines-portes-importees' },
    title: { en: 'Kitchen cabinets and imported doors', fr: 'Cuisines et portes importées' },
    service: 'remodeling',
    client: null,
    city: 'Limbe',
    date: '2025-02-01',
    featured: false,
    story: {
      en: 'Wooden entrance doors supplied and fitted, and kitchens built with new cabinets and worktops.',
      fr: 'Portes d’entrée en bois fournies et posées, et cuisines réalisées avec meubles et plans de travail neufs.',
    },
    photos: [
      alt('Wooden door with metal inlay lines', 'Porte en bois avec incrustations métalliques'),
      alt('Dark wooden double door', 'Porte double en bois foncé'),
      alt('Choice of imported wooden doors', 'Choix de portes en bois importées'),
      alt('Tall wooden door with a vertical handle', 'Grande porte en bois avec poignée verticale'),
      alt('White kitchen cabinets during fitting', 'Meubles de cuisine blancs en cours de pose'),
      alt('Finished grey kitchen with an island', 'Cuisine grise terminée avec îlot'),
    ],
  },
  {
    slug: { en: 'soundz-cmr-cameroon-talent-show', fr: 'soundz-cmr-cameroon-talent-show' },
    cover: 2,
    title: {
      en: 'Soundz CMR · Cameroon Talent Show',
      fr: 'Soundz CMR · Cameroon Talent Show',
    },
    service: 'events',
    client: 'Soundz CMR',
    city: 'Douala',
    date: '2023-11-01',
    featured: false,
    story: {
      en: 'Set and furniture for the Cameroon Talent Show: branded cubes, studio seating and the stage build.',
      fr: 'Décor et mobilier du Cameroon Talent Show : cubes personnalisés, sièges de studio et construction de la scène.',
    },
    photos: [
      alt('Black studio armchairs', 'Fauteuils de studio noirs'),
      alt('Cameroon Talent Show branded cubes', 'Cubes aux couleurs du Cameroon Talent Show'),
      alt(
        'Team member on the lit Soundz City set',
        'Membre de l’équipe sur le plateau éclairé de Soundz City',
      ),
      alt(
        'Crew on the set under green and red lights',
        'Équipe sur le plateau sous des lumières vertes et rouges',
      ),
      alt('Cameroon Talent Show logo on a cube', 'Logo du Cameroon Talent Show sur un cube'),
      alt('Crew building the stage in a hall', 'Équipe construisant la scène dans une salle'),
    ],
  },
  {
    slug: { en: 'upholstered-beds', fr: 'lits-tapisses' },
    cover: 2,
    title: { en: 'Upholstered beds', fr: 'Lits tapissés' },
    service: 'upholsteryFurniture',
    client: null,
    city: 'Yaoundé',
    date: '2025-06-01',
    featured: true,
    story: {
      en: 'Beds and headboards made in our upholstery workshop, from a tufted baby cot to padded king-size headboards.',
      fr: 'Lits et têtes de lit réalisés dans notre atelier de tapisserie, du berceau capitonné aux grandes têtes de lit rembourrées.',
    },
    photos: [
      alt('Bed frame with a new mattress', 'Cadre de lit avec un matelas neuf'),
      alt('White bed with a geometric headboard', 'Lit blanc avec tête de lit géométrique'),
      alt('Grey tufted baby cot', 'Berceau capitonné gris'),
      alt('Grey padded bed with patterned bedding', 'Lit rembourré gris avec linge à motifs'),
      alt('Grey channel-tufted bed', 'Lit gris à capitonnage vertical'),
      alt('Blue padded headboard during fitting', 'Tête de lit bleue rembourrée en cours de pose'),
    ],
  },
  {
    slug: { en: 'upholstered-chairs-sofas', fr: 'fauteuils-canapes-tapisses' },
    title: { en: 'Upholstered chairs and sofas', fr: 'Fauteuils et canapés tapissés' },
    service: 'upholsteryFurniture',
    client: null,
    city: 'Buea',
    date: '2024-10-01',
    featured: false,
    story: {
      en: 'Chairs and sofas reupholstered or made new: leather armchairs, fabric sofas and corner units.',
      fr: 'Fauteuils et canapés retapissés ou fabriqués : fauteuils en cuir, canapés en tissu et angles.',
    },
    photos: [
      alt('Black leather office chairs', 'Fauteuils de bureau en cuir noir'),
      alt('Yellow leather armchair', 'Fauteuil en cuir jaune'),
      alt('Yellow leather two-seat sofa', 'Canapé deux places en cuir jaune'),
      alt('Grey fabric sofa', 'Canapé en tissu gris'),
      alt('Grey fabric armchair', 'Fauteuil en tissu gris'),
      alt('Blue velvet corner sofa', 'Canapé d’angle en velours bleu'),
    ],
  },
  {
    slug: { en: 'welfare-aid-future-donation', fr: 'don-welfare-aid-future' },
    title: { en: 'Welfare Aid Future (W.A.F) donation', fr: 'Don Welfare Aid Future (W.A.F)' },
    service: 'events',
    client: 'Welfare Aid Future · Web Spectron',
    city: 'Douala',
    date: '2024-05-01',
    featured: false,
    story: {
      en: 'Community donation with Welfare Aid Future and Web Spectron at the Bonassama district medical centre, around the UN Sustainable Development Goals.',
      fr: 'Don communautaire avec Welfare Aid Future et Web Spectron au centre médical d’arrondissement de Bonassama, autour des Objectifs de développement durable de l’ONU.',
    },
    photos: [
      alt(
        'Volunteers holding Sustainable Development Goal signs',
        'Bénévoles tenant des panneaux des Objectifs de développement durable',
      ),
      alt(
        'Volunteers with Goal 3 and Goal 4 signs',
        'Bénévoles avec les panneaux des objectifs 3 et 4',
      ),
      alt(
        'Volunteer in front of the Bonassama health district sign',
        'Bénévole devant le panneau du district de santé de Bonassama',
      ),
      alt('Donated goods in front of the medical centre', 'Dons devant le centre médical'),
      alt('Boxes of donations being unpacked', 'Cartons de dons en cours de déballage'),
      alt('Volunteers handing over donations', 'Bénévoles remettant les dons'),
    ],
  },
]
