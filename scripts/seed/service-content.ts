// Service detail copy from the old site's six service pages (handymandoit.com/*.html, read
// 2026-10-29): the intro becomes `body`, the "Our … services include" lists become `inclusions`.
// English is the old site's text, tightened; French is our translation (native review, R-08).
// Moving, packing, transport, building and lighting had no page on the old site, so they get no
// body or inclusions here: their pages show the summary, the booking steps and FAQs only.
import type { Localized } from './data'
import type { ServiceKey } from '@/lib/service-keys'

export type ServiceContent = { body: Localized<string>; inclusions: Localized<string[]> }

export const serviceContent: Partial<Record<ServiceKey, ServiceContent>> = {
  interiorExteriorDesign: {
    body: {
      en: 'Our team combines creativity with technical expertise to design personal, functional spaces that look good. Whether you want to modernise your home, renovate your office or improve your outdoor areas, we tailor the design to your style and needs.',
      fr: 'Notre équipe allie créativité et savoir-faire technique pour concevoir des espaces personnels, fonctionnels et beaux. Que vous souhaitiez moderniser votre maison, rénover vos bureaux ou embellir vos extérieurs, nous adaptons le projet à votre style et à vos besoins.',
    },
    inclusions: {
      en: [
        'Space planning',
        'Concept development',
        'Material and colour selection',
        'Furniture and fixture selection',
        'Interior lighting design',
        'Landscape and hardscape design (patios, walkways, retaining walls)',
        'Exterior lighting',
        'Outdoor living spaces: decks, pergolas, outdoor kitchens',
        'Curb appeal improvements',
      ],
      fr: [
        'Aménagement de l’espace',
        'Création du concept',
        'Choix des matériaux et des couleurs',
        'Choix du mobilier et des équipements',
        'Conception de l’éclairage intérieur',
        'Aménagement paysager et minéral (terrasses, allées, murets)',
        'Éclairage extérieur',
        'Espaces de vie extérieurs : terrasses en bois, pergolas, cuisines d’été',
        'Mise en valeur de la façade',
      ],
    },
  },
  upholsteryFurniture: {
    body: {
      en: 'Our craftsmen reupholster, restore and build furniture that combines comfort, style and function. Give a favourite piece a new life, or have one made to fit your space exactly.',
      fr: 'Nos artisans retapissent, restaurent et fabriquent des meubles qui allient confort, style et fonctionnalité. Donnez une seconde vie à une pièce que vous aimez, ou faites-en fabriquer une sur mesure pour votre espace.',
    },
    inclusions: {
      en: [
        'Reupholstering, with a wide choice of fabrics',
        'Cushion replacement for sofas, chairs and outdoor furniture',
        'Repairs and refinishing: worn fabric, broken springs, faded finishes',
        'Custom furniture design',
        'Built-in furniture: bookcases, cabinetry, storage',
        'Statement pieces made to your dimensions',
        'Antique restoration',
        'Modernising older furniture',
        'Protective treatments against wear and stains',
      ],
      fr: [
        'Retapissage, avec un large choix de tissus',
        'Remplacement des coussins de canapés, chaises et meubles de jardin',
        'Réparations et rénovation : tissu usé, ressorts cassés, finitions ternies',
        'Conception de meubles sur mesure',
        'Mobilier intégré : bibliothèques, placards, rangements',
        'Pièces uniques à vos dimensions',
        'Restauration de meubles anciens',
        'Modernisation de meubles anciens',
        'Traitements protecteurs contre l’usure et les taches',
      ],
    },
  },
  repairsInstallations: {
    body: {
      en: 'From minor fixes to major installations, our technicians keep your home or office in good working order. Urgent repair or new installation, the work is done promptly and properly.',
      fr: 'Des petites réparations aux grandes installations, nos techniciens gardent votre maison ou votre bureau en bon état de marche. Réparation urgente ou nouvelle installation, le travail est fait vite et bien.',
    },
    inclusions: {
      en: [
        'General repairs: taps, door hinges, locks',
        'Electrical repairs: wiring, sockets, light fittings',
        'Plumbing repairs: blocked drains, leaking pipes, toilets',
        'Carpentry repairs: furniture, cabinets, trim',
        'Appliance installation: kitchen and laundry',
        'Lighting installation: ceiling lights, wall lights, chandeliers, outdoor lights',
        'Fixture installation: taps, sinks, showerheads',
        'Shelving and storage installation',
      ],
      fr: [
        'Réparations courantes : robinets, charnières, serrures',
        'Électricité : câblage, prises, luminaires',
        'Plomberie : canalisations bouchées, fuites, WC',
        'Menuiserie : meubles, placards, moulures',
        'Installation d’électroménager : cuisine et buanderie',
        'Installation d’éclairage : plafonniers, appliques, lustres, éclairage extérieur',
        'Installation de sanitaires : robinets, éviers, pommeaux de douche',
        'Installation d’étagères et de rangements',
      ],
    },
  },
  remodeling: {
    body: {
      en: 'We modernise interiors and exteriors so they work better and look better. Update a single room or renovate a whole property: the plan follows your vision and your budget.',
      fr: 'Nous modernisons intérieurs et extérieurs pour qu’ils soient plus pratiques et plus beaux. Une seule pièce ou tout un bâtiment : le projet suit votre vision et votre budget.',
    },
    inclusions: {
      en: [
        'Kitchens: cabinets, worktops, appliances, layout',
        'Bathrooms: fixtures, vanities, storage, tiling',
        'Living rooms and bedrooms: flooring, lighting, built-ins',
        'Exteriors: cladding, windows, doors, outdoor spaces',
        'Office layouts and workstations',
        'Meeting rooms',
        'Reception areas',
        'Break rooms',
        'Office storage and filing',
      ],
      fr: [
        'Cuisines : meubles, plans de travail, électroménager, agencement',
        'Salles de bain : sanitaires, meubles vasques, rangements, carrelage',
        'Séjours et chambres : sols, éclairage, mobilier intégré',
        'Extérieurs : bardage, fenêtres, portes, espaces extérieurs',
        'Aménagement de bureaux et postes de travail',
        'Salles de réunion',
        'Espaces d’accueil',
        'Salles de pause',
        'Rangement et archivage de bureau',
      ],
    },
  },
  signage: {
    body: {
      en: 'Custom signs that make your business stand out and say who you are. Our designers and technicians handle the design and the installation, so your sign is striking and built to last.',
      fr: 'Des enseignes sur mesure qui font remarquer votre entreprise et disent qui vous êtes. Nos graphistes et techniciens s’occupent de la conception et de la pose, pour une enseigne qui frappe et qui dure.',
    },
    inclusions: {
      en: [
        'LED signs',
        'Neon signs',
        'Flex banners and large-format prints',
        'Acrylic signs',
        'PVC signs',
        '3D letters',
        'Outdoor and indoor signboards',
        'Illuminated signboards',
        'Custom design',
        'Professional installation',
      ],
      fr: [
        'Enseignes LED',
        'Enseignes néon',
        'Bâches et impressions grand format',
        'Panneaux en acrylique',
        'Panneaux en PVC',
        'Lettres 3D',
        'Panneaux extérieurs et intérieurs',
        'Panneaux lumineux',
        'Conception sur mesure',
        'Pose professionnelle',
      ],
    },
  },
  events: {
    body: {
      en: 'We bring your event to life, from the first idea to the last guest leaving. Corporate event, wedding or private party: the set-up is handled, so the day runs smoothly.',
      fr: 'Nous donnons vie à votre événement, de la première idée au départ du dernier invité. Événement d’entreprise, mariage ou fête privée : l’installation est prise en charge, pour une journée sans accroc.',
    },
    inclusions: {
      en: [
        'Event concept',
        'Venue choice and layout',
        'Themed decoration: centrepieces, backdrops, table settings',
        'Lighting and sound',
        'Flower arrangements',
        'Logistics: transport, set-up and teardown',
        'Equipment: tents, stages, seating, audiovisual',
        'On-site coordination',
        'Coordination with caterers, photographers and other vendors',
        'Custom builds: photo booths, bars, displays',
      ],
      fr: [
        'Concept de l’événement',
        'Choix et agencement du lieu',
        'Décoration à thème : centres de table, toiles de fond, arts de la table',
        'Éclairage et sonorisation',
        'Compositions florales',
        'Logistique : transport, montage et démontage',
        'Matériel : tentes, scènes, sièges, audiovisuel',
        'Coordination sur place',
        'Coordination avec traiteurs, photographes et autres prestataires',
        'Réalisations sur mesure : photobooths, bars, présentoirs',
      ],
    },
  },
}
