// Legal pages (PLAN.md §4, FR-PG-15, ADR-022, Q-18). The disclaimer is the old site's text
// (disclaimer.html, read 2026-10-30; French is our translation). The old site linked a privacy
// policy and terms of service that both returned 404, so these two are drafts written from what
// this website actually does (forms, retention, hosting, cookies): owner/legal review before
// launch (Q-18). Nothing here describes the app's own terms, which this site cannot state.
import type { Localized } from './data'

export type LegalBlock = { h: string } | { p: string } | { ul: string[] }
export type LegalKey = 'privacy' | 'terms' | 'disclaimer'

// Date the text was last changed (the page shows it).
export const legalUpdated: Record<LegalKey, string> = {
  privacy: '2026-10-30',
  terms: '2026-10-30',
  disclaimer: '2026-10-30',
}

const contact = {
  en: 'HandyMan Do IT Services, Mile 16 Shopping Mall, Buea, Cameroon · handymanservicesdoit@gmail.com · +237 652 767 674 (call or WhatsApp)',
  fr: 'HandyMan Do IT Services, Mile 16 Shopping Mall, Buea, Cameroun · handymanservicesdoit@gmail.com · +237 652 767 674 (appel ou WhatsApp)',
}

export const legalContent: Record<LegalKey, Localized<LegalBlock[]>> = {
  privacy: {
    en: [
      {
        p: 'This policy explains what personal data the HandyMan Do IT website (handymandoit.com) collects, why, and what you can ask us. Bookings, payments and accounts happen in the HandyMan Do IT app, not on this website.',
      },
      { h: 'Who is responsible' },
      { p: contact.en },
      { h: 'What we collect' },
      {
        p: 'Only what you send us through a form on this website (contact, quote, partnership, pro application or job application):',
      },
      {
        ul: [
          'your name, email address and phone number',
          'your town or city, company or organisation, and the service you are interested in',
          'your message, your skills (pro applications) and your CV and cover letter (job applications)',
          'the language of the page and the campaign tags of the link that brought you (for example utm_source)',
        ],
      },
      {
        p: 'To limit spam, the website keeps your IP address in its memory for a few minutes when you send a form. It is not stored with your message.',
      },
      { h: 'Why we use it' },
      {
        ul: [
          'to answer your question and prepare quotes',
          'to process your application as a pro or for a job',
          'to understand which campaigns bring visitors',
        ],
      },
      {
        p: 'We use your data because you ask us to (you tick the consent box on each form) and because we need it to answer you. We do not sell it and we do not use it for advertising.',
      },
      { h: 'Where it is kept and who can see it' },
      {
        p: 'Form entries are stored in our content management system, in a Postgres database run by Neon (Amazon Web Services, United States), and attachments such as CVs are kept privately with our hosting providers. The website runs on Hostinger behind Cloudflare. A copy of each entry is emailed to our team inbox. Only HandyMan Do IT staff with an account can read entries and CVs.',
      },
      { h: 'How long we keep it' },
      {
        p: 'Entries and their attachments are deleted automatically 24 months after they are sent. You can ask us to delete them sooner.',
      },
      { h: 'Cookies' },
      {
        p: 'The website sets one cookie to remember the language you chose. If we measure audiences (for example with Google Analytics), it only starts after you accept it in the cookie banner, and you can change your choice at any time.',
      },
      { h: 'Your rights' },
      {
        p: 'You can ask to see, correct or delete the data we hold about you, or withdraw your consent, by writing to handymanservicesdoit@gmail.com. We answer within 30 days.',
      },
      { h: 'Changes' },
      {
        p: 'We may update this policy when the website changes. The date at the top shows the last update.',
      },
    ],
    fr: [
      {
        p: 'Cette politique explique quelles données personnelles le site HandyMan Do IT (handymandoit.com) collecte, pourquoi, et ce que vous pouvez nous demander. Les réservations, paiements et comptes se font dans l’appli HandyMan Do IT, pas sur ce site.',
      },
      { h: 'Qui est responsable' },
      { p: contact.fr },
      { h: 'Ce que nous collectons' },
      {
        p: 'Uniquement ce que vous nous envoyez avec un formulaire de ce site (contact, devis, partenariat, candidature pro ou candidature à un poste) :',
      },
      {
        ul: [
          'votre nom, votre adresse e-mail et votre numéro de téléphone',
          'votre ville, votre entreprise ou organisation, et le service qui vous intéresse',
          'votre message, vos compétences (candidatures pro) ainsi que votre CV et votre lettre de motivation (candidatures à un poste)',
          'la langue de la page et les balises de campagne du lien qui vous a amené (par exemple utm_source)',
        ],
      },
      {
        p: 'Pour limiter le spam, le site garde votre adresse IP en mémoire quelques minutes quand vous envoyez un formulaire. Elle n’est pas enregistrée avec votre message.',
      },
      { h: 'Pourquoi nous les utilisons' },
      {
        ul: [
          'pour répondre à votre question et préparer des devis',
          'pour traiter votre candidature comme pro ou à un poste',
          'pour savoir quelles campagnes amènent des visiteurs',
        ],
      },
      {
        p: 'Nous utilisons vos données parce que vous nous le demandez (vous cochez la case de consentement de chaque formulaire) et parce que nous en avons besoin pour vous répondre. Nous ne les vendons pas et ne les utilisons pas pour de la publicité.',
      },
      { h: 'Où elles sont conservées et qui peut les voir' },
      {
        p: 'Les messages sont enregistrés dans notre outil de gestion de contenu, dans une base de données Postgres exploitée par Neon (Amazon Web Services, États-Unis), et les pièces jointes comme les CV sont conservées de façon privée chez nos hébergeurs. Le site est hébergé par Hostinger, derrière Cloudflare. Une copie de chaque message est envoyée par e-mail à notre équipe. Seul le personnel de HandyMan Do IT disposant d’un compte peut lire les messages et les CV.',
      },
      { h: 'Combien de temps nous les gardons' },
      {
        p: 'Les messages et leurs pièces jointes sont supprimés automatiquement 24 mois après leur envoi. Vous pouvez nous demander de les supprimer plus tôt.',
      },
      { h: 'Cookies' },
      {
        p: 'Le site dépose un cookie pour retenir la langue choisie. Si nous mesurons l’audience (par exemple avec Google Analytics), cette mesure ne démarre qu’après votre accord dans le bandeau cookies, et vous pouvez changer d’avis à tout moment.',
      },
      { h: 'Vos droits' },
      {
        p: 'Vous pouvez demander à consulter, corriger ou supprimer les données que nous détenons sur vous, ou retirer votre consentement, en écrivant à handymanservicesdoit@gmail.com. Nous répondons sous 30 jours.',
      },
      { h: 'Modifications' },
      {
        p: 'Nous pouvons mettre à jour cette politique quand le site évolue. La date en haut de page indique la dernière mise à jour.',
      },
    ],
  },
  terms: {
    en: [
      {
        p: 'These terms apply to your use of the HandyMan Do IT website (handymandoit.com). By using the website you accept them.',
      },
      { h: 'Who we are' },
      { p: contact.en },
      { h: 'What the website is for' },
      {
        p: 'The website presents HandyMan Do IT, our services and the HandyMan Do IT app, and lets you contact us. Bookings, prices and payments are made in the app, where the price of a job is shown before you book. The conditions shown in the app apply to them.',
      },
      { h: 'Information on the website' },
      {
        p: 'We do our best to keep the information accurate and up to date, but it is general information. Please read our disclaimer.',
      },
      { h: 'Forms' },
      {
        p: 'When you send a form, give accurate information and only send what is needed. Do not use the forms to send advertising, abusive content or files that are not yours to share. We may ignore or delete such messages.',
      },
      { h: 'Intellectual property' },
      {
        p: 'The HandyMan Do IT name and logo, the texts, photos and videos on the website belong to HandyMan Do IT or to their owners, such as our partners and clients. Do not copy or reuse them without our written permission.',
      },
      { h: 'Links to other websites' },
      {
        p: 'The website links to other websites, such as app stores, our partners and social networks. We are not responsible for their content or their privacy practices.',
      },
      { h: 'Liability' },
      {
        p: 'We are not liable for losses caused by the use of this website or by a temporary unavailability of it, as far as the law allows.',
      },
      { h: 'Changes and applicable law' },
      {
        p: 'We may change these terms; the date at the top shows the last update. These terms are governed by the law of Cameroon.',
      },
    ],
    fr: [
      {
        p: 'Ces conditions s’appliquent à votre utilisation du site HandyMan Do IT (handymandoit.com). En utilisant le site, vous les acceptez.',
      },
      { h: 'Qui sommes-nous' },
      { p: contact.fr },
      { h: 'À quoi sert le site' },
      {
        p: 'Le site présente HandyMan Do IT, nos services et l’appli HandyMan Do IT, et vous permet de nous contacter. Les réservations, les prix et les paiements se font dans l’appli, où le prix d’un travail s’affiche avant la réservation. Les conditions affichées dans l’appli s’y appliquent.',
      },
      { h: 'Informations du site' },
      {
        p: 'Nous faisons de notre mieux pour que les informations soient exactes et à jour, mais elles restent générales. Merci de lire notre avertissement.',
      },
      { h: 'Formulaires' },
      {
        p: 'Quand vous envoyez un formulaire, donnez des informations exactes et uniquement ce qui est utile. N’utilisez pas les formulaires pour envoyer de la publicité, des contenus abusifs ou des fichiers que vous n’avez pas le droit de partager. Nous pouvons ignorer ou supprimer ces messages.',
      },
      { h: 'Propriété intellectuelle' },
      {
        p: 'Le nom et le logo HandyMan Do IT, les textes, photos et vidéos du site appartiennent à HandyMan Do IT ou à leurs propriétaires, comme nos partenaires et clients. Ne les copiez pas et ne les réutilisez pas sans notre autorisation écrite.',
      },
      { h: 'Liens vers d’autres sites' },
      {
        p: 'Le site renvoie vers d’autres sites, comme les magasins d’applications, nos partenaires et les réseaux sociaux. Nous ne sommes pas responsables de leur contenu ni de leurs pratiques de confidentialité.',
      },
      { h: 'Responsabilité' },
      {
        p: 'Dans les limites prévues par la loi, nous ne sommes pas responsables des pertes liées à l’utilisation du site ou à son indisponibilité temporaire.',
      },
      { h: 'Modifications et droit applicable' },
      {
        p: 'Nous pouvons modifier ces conditions ; la date en haut de page indique la dernière mise à jour. Ces conditions sont régies par le droit camerounais.',
      },
    ],
  },
  disclaimer: {
    en: [
      {
        p: 'The information provided by Handyman Do It Services Company (“we,” “us,” “our”) on our website, promotional materials, and service agreements is for general informational purposes only. While we strive to keep the information accurate and up-to-date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the website or the information, products, services, or related graphics contained on the website for any purpose. Any reliance you place on such information is therefore strictly at your own risk.',
      },
      { h: 'Service Performance' },
      {
        p: 'Handyman Do It Services Company endeavors to provide the highest quality services. However, we do not guarantee that our services will meet your expectations or requirements. Our services are provided “as is” and “as available” without any warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      },
      { h: 'Third-Party Products and Services' },
      {
        p: 'Our website and promotional materials may contain references to third-party products and services. Handyman Do It Services Company does not endorse, guarantee, or assume responsibility for any such third-party products or services. Any use of third-party products or services is at your own risk and discretion.',
      },
      { h: 'Liability Limitation' },
      {
        p: 'In no event will Handyman Do It Services Company be liable for any loss or damage, including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this website or our services.',
      },
      { h: 'Changes to Services and Information' },
      {
        p: 'Handyman Do It Services Company reserves the right to modify, suspend, or discontinue any aspect of the services or information provided at any time without notice. We also reserve the right to make changes to this disclaimer at any time, and your continued use of our website or services signifies your acceptance of any such changes.',
      },
      { h: 'Professional Advice' },
      {
        p: 'The information provided by Handyman Do It Services Company is not intended to replace professional advice. We recommend consulting with appropriate professionals before taking any action based on the information provided by our company. Handyman Do It Services Company shall not be held responsible for any decisions made based on the information provided by our website, promotional materials, or service agreements.',
      },
      { h: 'Contact Us' },
      {
        p: 'If you have any questions about this disclaimer or our services, please contact us at: handymanservicesdoit@gmail.com',
      },
      {
        p: 'By using our services or accessing our website, you agree to this disclaimer and our terms and conditions. Thank you for choosing Handyman Do It Services Company.',
      },
    ],
    fr: [
      {
        p: 'Les informations fournies par Handyman Do It Services Company (« nous », « notre ») sur notre site, nos supports promotionnels et nos contrats de service sont données à titre d’information générale uniquement. Bien que nous nous efforcions de les garder exactes et à jour, nous ne faisons aucune déclaration ni ne donnons aucune garantie, expresse ou implicite, quant à l’exhaustivité, l’exactitude, la fiabilité, l’adéquation ou la disponibilité du site ou des informations, produits, services ou visuels qu’il contient, pour quelque usage que ce soit. Toute confiance que vous accordez à ces informations relève donc strictement de votre responsabilité.',
      },
      { h: 'Exécution des services' },
      {
        p: 'Handyman Do It Services Company s’efforce de fournir des services de la meilleure qualité. Nous ne garantissons cependant pas que nos services répondront à vos attentes ou exigences. Nos services sont fournis « en l’état » et « selon disponibilité », sans garantie d’aucune sorte, expresse ou implicite, y compris, sans s’y limiter, les garanties de qualité marchande, d’adéquation à un usage particulier ou d’absence de contrefaçon.',
      },
      { h: 'Produits et services de tiers' },
      {
        p: 'Notre site et nos supports promotionnels peuvent mentionner des produits et services de tiers. Handyman Do It Services Company ne cautionne pas, ne garantit pas et n’assume aucune responsabilité pour ces produits ou services. Leur utilisation se fait à vos propres risques et à votre discrétion.',
      },
      { h: 'Limitation de responsabilité' },
      {
        p: 'Handyman Do It Services Company ne pourra en aucun cas être tenue responsable de toute perte ou de tout dommage, y compris, sans s’y limiter, les pertes ou dommages indirects ou consécutifs, ni de toute perte ou de tout dommage résultant d’une perte de données ou de bénéfices découlant de l’utilisation de ce site ou de nos services, ou en lien avec celle-ci.',
      },
      { h: 'Modification des services et des informations' },
      {
        p: 'Handyman Do It Services Company se réserve le droit de modifier, suspendre ou interrompre tout aspect des services ou des informations fournis, à tout moment et sans préavis. Nous nous réservons également le droit de modifier cet avertissement à tout moment ; votre utilisation continue de notre site ou de nos services vaut acceptation de ces modifications.',
      },
      { h: 'Conseil professionnel' },
      {
        p: 'Les informations fournies par Handyman Do It Services Company ne remplacent pas un conseil professionnel. Nous vous recommandons de consulter les professionnels compétents avant d’agir sur la base des informations fournies par notre entreprise. Handyman Do It Services Company ne saurait être tenue responsable des décisions prises sur la base des informations de notre site, de nos supports promotionnels ou de nos contrats de service.',
      },
      { h: 'Nous contacter' },
      {
        p: 'Pour toute question sur cet avertissement ou nos services, contactez-nous à : handymanservicesdoit@gmail.com',
      },
      {
        p: 'En utilisant nos services ou en accédant à notre site, vous acceptez cet avertissement et nos conditions générales. Merci d’avoir choisi Handyman Do It Services Company.',
      },
    ],
  },
}
