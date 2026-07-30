import { db } from '@/lib/db';

const CATEGORIES = [
  { name: 'Véhicules', nameWolof: 'Moto ak Waa', slug: 'vehicules', icon: 'Car', order: 0 },
  { name: 'Immobilier', nameWolof: 'Ay Xay', slug: 'immobilier', icon: 'Building2', order: 1 },
  { name: 'Électronique', nameWolof: 'Elektroniq', slug: 'electronique', icon: 'Smartphone', order: 2 },
  { name: 'Mode & Beauté', nameWolof: 'Sëriñ ak Jëmm', slug: 'mode-beaute', icon: 'Shirt', order: 3 },
  { name: 'Maison & Jardin', nameWolof: 'Kër', slug: 'maison-jardin', icon: 'Home', order: 4 },
  { name: 'Emploi & Services', nameWolof: 'Liggéey', slug: 'emploi-services', icon: 'Briefcase', order: 5 },
  { name: 'Loisirs & Sport', nameWolof: 'Sport ak Ndaxë', slug: 'loisirs-sport', icon: 'Dumbbell', order: 6 },
  { name: 'Alimentation', nameWolof: 'Ndog', slug: 'alimentation', icon: 'ShoppingBasket', order: 7 },
];

const CITIES = [
  'Dakar', 'Almadies', 'Plateau', 'Médina', 'Fann', 'Mermoz', 'Sacré-Cœur',
  'Ouakam', 'Ngor', 'Yoff', 'Parcelles Assainies', 'Grand Yoff', 'Pikine',
  'Guédiawaye', 'Rufisque', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack'
];

const SAMPLE_LISTINGS = [
  { title: 'Toyota Corolla 2019 - Excellent état', description: 'Vends Toyota Corolla 2019, climatisation, direction assistée, airbag. Kilométrage: 45 000 km. Contrôle technique à jour. Première main.', price: 8500000, categoryId: 'vehicules', city: 'Dakar', condition: 'usage', location: 'Mermoz Sacré-Cœur', images: [] },
  { title: 'Appartement F2 à Plateau - Vue Mer', description: 'Bel appartement F2 de 65m² au Plateau, 4ème étage avec ascenseur. Vue mer imprenable. Meublé et climatisé. Proche des ambassades et banques.', price: 350000, categoryId: 'immobilier', city: 'Dakar', condition: 'neuf', location: 'Plateau', images: [] },
  { title: 'iPhone 14 Pro Max 256Go', description: 'iPhone 14 Pro Max couleur Noir Titane, 256Go, état impeccable. Inclus boîte d\'origine, chargeur et coque. Batterie santé 94%.', price: 450000, categoryId: 'electronique', city: 'Dakar', condition: 'usage', location: 'Almadies', images: [] },
  { title: 'Boubou brodé taille S/M/L/XL', description: 'Boubou brodé à la main, tissu bazin riche de haute qualité. Disponible en plusieurs tailles. Idéal pour fêtes et cérémonies. Livraison possible.', price: 25000, categoryId: 'mode-beaute', city: 'Dakar', condition: 'neuf', location: 'Médina', images: [] },
  { title: 'Canapé 3 places en cuir', description: 'Canapé 3 places en cuir véritable, couleur marron. Très confortable, état neuf. Dimensions: 200x90x85cm. Livraison et montage inclus.', price: 180000, categoryId: 'maison-jardin', city: 'Dakar', condition: 'usage', location: 'Sacré-Cœur', images: [] },
  { title: 'Développeur Web Senior - Freelance', description: 'Développeur web avec 5 ans d\'expérience en React, Next.js, Node.js. Création de sites web, applications web, e-commerce. Tarif compétitif, travail de qualité garantie.', price: 0, categoryId: 'emploi-services', city: 'Dakar', condition: 'neuf', location: 'Almadies', images: [] },
  { title: 'Vélo de route Btwin 520', description: 'Vélo de route Btwin 520, taille M, idéal pour les trajets quotidiens et les sorties sportives. 18 vitesses, freins V-brake. Entretien récent fait.', price: 85000, categoryId: 'loisirs-sport', city: 'Dakar', condition: 'usage', location: 'Ouakam', images: [] },
  { title: 'Sacosse de riz 25kg - Qualité premium', description: 'Riz parfumé de qualité supérieure, importé. Sacosse de 25kg. Livraison disponible à Dakar et banlieue. Prix de gros pour commande de 5 sacosses et plus.', price: 17500, categoryId: 'alimentation', city: 'Dakar', condition: 'neuf', location: 'Grand Yoff', images: [] },
  { title: 'Samsung Galaxy S23 Ultra', description: 'Samsung Galaxy S23 Ultra, 256Go, couleur Vert. S-Pen inclus, écran en parfait état. Double SIM. Batterie santé 96%. Garantie shop encore valide 3 mois.', price: 380000, categoryId: 'electronique', city: 'Dakar', condition: 'reconditionne', location: 'Pikine', images: [] },
  { title: 'Terrain 150m² à Diamniadio', description: 'Terrain viabilisé de 150m² à Diamniadio, près de l\'autoroute. Titre foncier en cours. Quartier résidentiel calme et sécurisé. Prix légèrement négociable.', price: 3500000, categoryId: 'immobilier', city: 'Dakar', condition: 'neuf', location: 'Diamniadio', images: [] },
  { title: 'Machine à coudre Singer Tradition', description: 'Machine à coudre Singer Tradition 2250, peu utilisée. 10 points de couture, pédale incluse. Idéale pour débuter ou pour des travaux de couture légère.', price: 65000, categoryId: 'maison-jardin', city: 'Thiès', condition: 'usage', location: 'Thiès', images: [] },
  { title: 'Mercedes Classe C 220 CDI 2017', description: 'Mercedes Classe C 220 CDI AMG Line, 2017. Diesel, boîte automatique 7G-Tronic. Intérieur cuir noir, toit ouvrant panoramique. 78 000 km.', price: 12500000, categoryId: 'vehicules', city: 'Dakar', condition: 'usage', location: 'Ngor', images: [] },
];

export async function seedDatabase() {
  console.log('Seeding database...');

  // Check if already seeded
  const existingCats = await db.category.count();
  if (existingCats > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // Create categories
  for (const cat of CATEGORIES) {
    await db.category.create({ data: cat });
  }

  // Create demo users
  const user1 = await db.user.create({
    data: {
      phone: '+221770000001',
      name: 'Aminata Diallo',
      role: 'user',
      subscriptionTier: 'premium',
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isVerifiedSeller: true,
      bio: 'Vendeuse vérifiée sur Ma Jaay. Livraison rapide à Dakar.',
      location: 'Dakar',
    },
  });

  const user2 = await db.user.create({
    data: {
      phone: '+221770000002',
      name: 'Moussa Ndiaye',
      role: 'user',
      subscriptionTier: 'standard',
      subscriptionExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      isVerifiedSeller: true,
      bio: 'Spécialiste électronique. Produits garantis.',
      location: 'Pikine',
    },
  });

  const admin = await db.user.create({
    data: {
      phone: '+221770000000',
      name: 'Admin Ma Jaay',
      role: 'admin',
      subscriptionTier: 'premium_plus',
    },
  });

  // Create sample listings
  const categories = await db.category.findMany();
  const catMap: Record<string, string> = {};
  for (const c of categories) catMap[c.slug] = c.id;

  for (let i = 0; i < SAMPLE_LISTINGS.length; i++) {
    const l = SAMPLE_LISTINGS[i];
    const seller = i % 2 === 0 ? user1 : user2;
    await db.listing.create({
      data: {
        title: l.title,
        description: l.description,
        price: l.price,
        condition: l.condition,
        categoryId: catMap[l.categoryId] || categories[0].id,
        city: l.city,
        location: l.location,
        status: 'active',
        sellerId: seller.id,
        isBoosted: i < 3,
        boostExpiresAt: i < 3 ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null,
        featured: i < 2,
        views: Math.floor(Math.random() * 500) + 50,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('Database seeded successfully!');
}

export { CITIES };
