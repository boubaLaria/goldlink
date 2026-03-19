import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ── Unsplash product images (for catalog display) ────────────────────────────
const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&auto=format&q=80`

const PHOTOS = {
  necklace1:  IMG('1599643478518-a784e5dc4c8f'),
  necklace2:  IMG('1617038260897-41a1f14a8ca0'),
  necklace3:  IMG('1573408301185-9519f94815f1'),
  bracelet1:  IMG('1611591437281-460bfbe1220a'),
  bracelet2:  IMG('1576022162802-2ef1f5b3bdb2'),
  bracelet3:  IMG('1583147610148-1c5e8cf00fb6'),
  ring1:      IMG('1605100804763-247f67b3557e'),
  ring2:      IMG('1551717743-bde7de89de5a'),
  ring3:      IMG('1614786269829-d24616faf56d'),
  earrings1:  IMG('1589118949245-7d38baf380d6'),
  earrings2:  IMG('1543294001-f7cd5d7fb516'),
  chain1:     IMG('1608042314453-ae338d9c6762'),
  chain2:     IMG('1624020823569-1ab2cd74b9bf'),
  pendant1:   IMG('1588776814546-1ffbb36cf1c4'),
  pendant2:   IMG('1506630448388-4e683c67ddb0'),
  set1:       IMG('1601121141461-9d6647bef0a1'),
}

// ── Helper dates ─────────────────────────────────────────────────────────────
function monthsAgo(n: number, day = 15) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(day)
  d.setHours(10, 0, 0, 0)
  return d
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seeding database...')

  // ── Nettoyage ──────────────────────────────────────────────────────────────
  await prisma.review.deleteMany()
  await prisma.estimation.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.jewelry.deleteMany()
  await prisma.user.deleteMany()

  // ── Utilisateurs ───────────────────────────────────────────────────────────
  const passwords = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('seller123', 10),
    bcrypt.hash('jeweler123', 10),
    bcrypt.hash('seller2', 10),
    bcrypt.hash('jeweler2', 10),
    bcrypt.hash('buyer123', 10),
  ])

  const [admin, fatima, karim, sophie, pierre, amina] = await Promise.all([
    prisma.user.create({ data: {
      email: 'admin@goldlink.com', hashedPassword: passwords[0],
      firstName: 'Admin', lastName: 'GoldLink',
      phone: '+33 1 23 45 67 89', role: 'ADMIN', verified: true,
      address: 'Paris, France', country: 'France', currency: 'EUR',
    }}),
    prisma.user.create({ data: {
      email: 'fatima@goldlink.com', hashedPassword: passwords[1],
      firstName: 'Fatima', lastName: 'Zahra',
      phone: '+33 6 11 11 11 11', role: 'SELLER', verified: true,
      address: 'Paris, France', country: 'France', currency: 'EUR',
      rating: 4.8, cin: 'AB123456',
    }}),
    prisma.user.create({ data: {
      email: 'karim@goldlink.com', hashedPassword: passwords[2],
      firstName: 'Karim', lastName: 'Bennani',
      phone: '+33 6 22 22 22 22', role: 'JEWELER', verified: true,
      address: 'Marseille, France', country: 'France', currency: 'EUR',
      rating: 4.9, cin: 'CD789012',
    }}),
    prisma.user.create({ data: {
      email: 'sophie@goldlink.com', hashedPassword: passwords[3],
      firstName: 'Sophie', lastName: 'Laurent',
      phone: '+33 6 33 33 33 33', role: 'SELLER', verified: true,
      address: 'Lyon, France', country: 'France', currency: 'EUR',
      rating: 4.7, cin: 'EF111222',
    }}),
    prisma.user.create({ data: {
      email: 'pierre@goldlink.com', hashedPassword: passwords[4],
      firstName: 'Pierre', lastName: 'Dubois',
      phone: '+33 6 44 44 44 44', role: 'JEWELER', verified: true,
      address: 'Bordeaux, France', country: 'France', currency: 'EUR',
      rating: 5.0, cin: 'GH333444',
    }}),
    prisma.user.create({ data: {
      email: 'amina@goldlink.com', hashedPassword: passwords[5],
      firstName: 'Amina', lastName: 'El Fassi',
      phone: '+33 6 55 55 55 55', role: 'BUYER', verified: true,
      address: 'Toulouse, France', country: 'France', currency: 'EUR',
      rating: 4.7, cin: 'IJ555666',
    }}),
  ])

  // ── Bijoux — Fatima (Paris) ────────────────────────────────────────────────
  // model3dUrl : renseigné = essayage 3D activé. null = pas d'essayage.
  const [j1, j2, j3, j4, j5] = await Promise.all([

    // j1 — Collier Berbère (pas de modèle 3D pour l'instant)
    prisma.jewelry.create({ data: {
      ownerId: fatima.id,
      title: 'Collier Berbère Or 18K', type: 'NECKLACE', purity: 'K18',
      weight: 48.5, estimatedValue: 9200,
      description: "Superbe collier berbère traditionnel en or 18K. Pièce artisanale unique ornée de gravures géométriques ancestrales. Idéal pour les grandes occasions et cérémonies. Livré avec certificat d'authenticité.",
      images: [PHOTOS.necklace1, PHOTOS.necklace3],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 130, salePrice: 9200,
      available: true, location: 'Paris', country: 'France', currency: 'EUR',
      views: 342, rating: 4.9, reviewCount: 5,
    }}),

    // j2 — Parure Mariage (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: fatima.id,
      title: 'Parure Mariage Complète Or 22K', type: 'BRACELET', purity: 'K22',
      weight: 85.0, estimatedValue: 16500,
      description: 'Parure nuptiale complète (collier + bracelet + boucles) en or 22K massif. Travail de finesse exceptionnelle. Coffret de présentation inclus. Disponible à la location pour événements.',
      images: [PHOTOS.bracelet1, PHOTOS.set1],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 220, salePrice: 16500,
      available: true, location: 'Paris', country: 'France', currency: 'EUR',
      views: 215, rating: 5.0, reviewCount: 3,
    }}),

    // j3 — Boucles d'oreilles ✨ ESSAYAGE 3D
    prisma.jewelry.create({ data: {
      ownerId: fatima.id,
      title: "Boucles d'Oreilles Tradition Or 18K", type: 'EARRINGS', purity: 'K18',
      weight: 14.2, estimatedValue: 2650,
      description: "Boucles d'oreilles traditionnelles en or 18K avec motifs floraux ciselés à la main. Fermeture sécurisée. Design intemporel qui traverse les générations.",
      images: [PHOTOS.earrings1, PHOTOS.earrings2],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 40, salePrice: 2650,
      available: true, location: 'Paris', country: 'France', currency: 'EUR',
      views: 178, rating: 4.8, reviewCount: 4,
      model3dUrl: '/models/earrings-gold.glb',
    }}),

    // j4 — Pendentif (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: fatima.id,
      title: 'Pendentif Symboles Or 14K', type: 'PENDANT', purity: 'K14',
      weight: 8.5, estimatedValue: 1100,
      description: 'Pendentif en or 14K orné de symboles de protection et de chance. Chaîne incluse. Pièce légère et élégante pour le quotidien.',
      images: [PHOTOS.pendant1],
      listingTypes: ['RENT'], rentPricePerDay: 18,
      available: true, location: 'Paris', country: 'France', currency: 'EUR',
      views: 94, rating: 4.6, reviewCount: 2,
    }}),

    // j5 — Chaîne Tissée (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: fatima.id,
      title: 'Chaîne Tissée Or 22K', type: 'CHAIN', purity: 'K22',
      weight: 38.0, estimatedValue: 7100,
      description: 'Chaîne en or 22K au tissage traditionnel à la main. Longueur 60cm, largeur 8mm. Fermoir baïonnette en or massif. Pièce de collection.',
      images: [PHOTOS.chain1],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 100, salePrice: 7100,
      available: true, location: 'Paris', country: 'France', currency: 'EUR',
      views: 156, rating: 4.7, reviewCount: 2,
    }}),
  ])

  // ── Bijoux — Karim (Marseille) ────────────────────────────────────────────
  const [j6, j7, j8, j9, j10] = await Promise.all([

    // j6 — Chevalière (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: karim.id,
      title: 'Chevalière Artisan Or 18K', type: 'RING', purity: 'K18',
      weight: 18.5, estimatedValue: 3400,
      description: "Chevalière d'exception taillée dans un bloc d'or 18K. Personnalisable avec vos initiales (délai 10 jours). Finition satin mat ou brillant au choix.",
      images: [PHOTOS.ring1, PHOTOS.ring3],
      listingTypes: ['SALE'], salePrice: 3400,
      available: true, location: 'Marseille', country: 'France', currency: 'EUR',
      views: 267, rating: 4.9, reviewCount: 6,
    }}),

    // j7 — Collier Maille Royale (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: karim.id,
      title: 'Collier Maille Royale Or 18K', type: 'NECKLACE', purity: 'K18',
      weight: 42.0, estimatedValue: 7800,
      description: "Collier maille royale en or 18K, longueur 50cm. Chaque maillon forgé individuellement puis assemblé à la main. Poids et éclat incomparables.",
      images: [PHOTOS.necklace2, PHOTOS.chain2],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 110, salePrice: 7800,
      available: true, location: 'Marseille', country: 'France', currency: 'EUR',
      views: 198, rating: 4.8, reviewCount: 4,
    }}),

    // j8 — Bracelet Jonc (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: karim.id,
      title: 'Bracelet Jonc Massif Or 22K', type: 'BRACELET', purity: 'K22',
      weight: 35.0, estimatedValue: 6500,
      description: "Jonc bracelet en or 22K massif. Design épuré d'inspiration contemporaine. Bord biseauté pour un port confortable. Taille ajustable.",
      images: [PHOTOS.bracelet2],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 90, salePrice: 6500,
      available: true, location: 'Marseille', country: 'France', currency: 'EUR',
      views: 145, rating: 4.9, reviewCount: 3,
    }}),

    // j9 — Bague Solitaire (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: karim.id,
      title: 'Bague Solitaire Or 24K', type: 'RING', purity: 'K24',
      weight: 5.8, estimatedValue: 2200,
      description: "Bague solitaire en or 24K pur. Monture minimaliste qui met en valeur la pureté de l'or. Idéale pour une demande en mariage authentique ou comme bijou de collection.",
      images: [PHOTOS.ring2],
      listingTypes: ['SALE'], salePrice: 2200,
      available: true, location: 'Marseille', country: 'France', currency: 'EUR',
      views: 312, rating: 5.0, reviewCount: 8,
    }}),

    // j10 — Pendentif Croissant (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: karim.id,
      title: 'Pendentif Croissant Or 18K', type: 'PENDANT', purity: 'K18',
      weight: 6.2, estimatedValue: 950,
      description: 'Pendentif croissant lisse en or 18K. Finition haute brillance. Chaîne vénitienne incluse. Port quotidien recommandé.',
      images: [PHOTOS.pendant2],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 15, salePrice: 950,
      available: true, location: 'Marseille', country: 'France', currency: 'EUR',
      views: 88, rating: 4.7, reviewCount: 2,
    }}),
  ])

  // ── Bijoux — Sophie (Lyon) ────────────────────────────────────────────────
  const [j11, j12, j13, j14] = await Promise.all([

    // j11 — Collier Minimal (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: sophie.id,
      title: 'Collier Minimal Or 14K', type: 'NECKLACE', purity: 'K14',
      weight: 12.5, estimatedValue: 1850,
      description: "Collier fin et minimaliste en or 14K pour femme moderne. Design scandinave épuré. Longueur réglable de 40 à 50cm. Parfait pour un style quotidien élégant.",
      images: [PHOTOS.necklace3, PHOTOS.pendant1],
      listingTypes: ['SALE'], salePrice: 1850,
      available: true, location: 'Lyon', country: 'France', currency: 'EUR',
      views: 423, rating: 4.7, reviewCount: 9,
    }}),

    // j12 — Créoles Géométriques (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: sophie.id,
      title: 'Créoles Géométriques Or 18K', type: 'EARRINGS', purity: 'K18',
      weight: 9.8, estimatedValue: 1650,
      description: "Grandes créoles géométriques hexagonales en or 18K. Design avant-gardiste entre tradition et modernité. Légères malgré leur taille grâce à un or creux de qualité.",
      images: [PHOTOS.earrings2, PHOTOS.earrings1],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 28, salePrice: 1650,
      available: true, location: 'Lyon', country: 'France', currency: 'EUR',
      views: 287, rating: 4.8, reviewCount: 7,
    }}),

    // j13 — Bracelet Chaîne Étoiles (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: sophie.id,
      title: 'Bracelet Chaîne Étoiles Or 18K', type: 'BRACELET', purity: 'K18',
      weight: 8.2, estimatedValue: 1200,
      description: "Bracelet chaîne délicat avec maillons étoilés en or 18K. Collection été. Superposable avec d'autres bracelets. Fermoir mosqueton sécurisé.",
      images: [PHOTOS.bracelet3, PHOTOS.bracelet1],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 20, salePrice: 1200,
      available: true, location: 'Lyon', country: 'France', currency: 'EUR',
      views: 334, rating: 4.6, reviewCount: 11,
    }}),

    // j14 — Pendentif Géométrique (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: sophie.id,
      title: 'Pendentif Géométrique Or 14K', type: 'PENDANT', purity: 'K14',
      weight: 4.5, estimatedValue: 680,
      description: 'Pendentif losange creux en or 14K. Edition limitée. Chaîne fine incluse. Symbole de la géométrie sacrée modernisé pour la femme contemporaine.',
      images: [PHOTOS.pendant2],
      listingTypes: ['SALE'], salePrice: 680,
      available: true, location: 'Lyon', country: 'France', currency: 'EUR',
      views: 156, rating: 4.5, reviewCount: 5,
    }}),
  ])

  // ── Bijoux — Pierre (Bordeaux — Haute Joaillerie) ─────────────────────────
  const [j15, j16, j17, j18] = await Promise.all([

    // j15 — Collier Rivière Diamants (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: pierre.id,
      title: 'Collier Rivière Or 18K Diamants', type: 'NECKLACE', purity: 'K18',
      weight: 32.0, estimatedValue: 28000,
      description: "Collier rivière serti de 24 diamants VSI en or blanc 18K. Chaque diamant sélectionné à la main. Certification GIA disponible. Pièce maîtresse de haute joaillerie.",
      images: [PHOTOS.necklace1, PHOTOS.set1],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 350, salePrice: 28000,
      available: true, location: 'Bordeaux', country: 'France', currency: 'EUR',
      views: 512, rating: 5.0, reviewCount: 4,
    }}),

    // j16 — Bague Saphir Royal ✨ ESSAYAGE 3D
    prisma.jewelry.create({ data: {
      ownerId: pierre.id,
      title: 'Bague Saphir Royal Or 18K', type: 'RING', purity: 'K18',
      weight: 7.5, estimatedValue: 12500,
      description: "Bague en or 18K sertie d'un saphir bleu royal de 3 carats entouré de diamants. Monture pavée à la main. Inspiration royale britannique. Certificat gemmologique inclus.",
      images: [PHOTOS.ring1, PHOTOS.ring3],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 180, salePrice: 12500,
      available: true, location: 'Bordeaux', country: 'France', currency: 'EUR',
      views: 389, rating: 5.0, reviewCount: 6,
      model3dUrl: '/models/ring-sapphire.glb',
    }}),

    // j17 — Bracelet Tennis ✨ ESSAYAGE 3D
    prisma.jewelry.create({ data: {
      ownerId: pierre.id,
      title: 'Bracelet Tennis Or 18K', type: 'BRACELET', purity: 'K18',
      weight: 22.0, estimatedValue: 18500,
      description: "Bracelet tennis classique serti de 28 diamants ronds brillants en or blanc 18K. Clarté VS2, couleur F. Fermoir sécurité double. La pièce iconique de toute grande collection.",
      images: [PHOTOS.bracelet2, PHOTOS.bracelet3],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 260, salePrice: 18500,
      available: true, location: 'Bordeaux', country: 'France', currency: 'EUR',
      views: 445, rating: 5.0, reviewCount: 7,
      model3dUrl: '/models/bracelet-tennis.glb',
    }}),

    // j18 — Pendentif Croix (pas de modèle 3D)
    prisma.jewelry.create({ data: {
      ownerId: pierre.id,
      title: 'Pendentif Croix Or 24K', type: 'PENDANT', purity: 'K24',
      weight: 18.5, estimatedValue: 6800,
      description: "Croix en or 24K pur, finition satinée avec contour brillant. Poids impressionnant pour un bijou spirituel de haute valeur. Chaîne en or 18K 60cm incluse.",
      images: [PHOTOS.pendant1, PHOTOS.chain1],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 95, salePrice: 6800,
      available: true, location: 'Bordeaux', country: 'France', currency: 'EUR',
      views: 198, rating: 4.9, reviewCount: 3,
    }}),
  ])

  // ── Réservations (6 mois d'historique) ───────────────────────────────────
  const bookingData = [
    { jewelry: j1,  price: 1040, deposit: 208, months: 5, status: 'COMPLETED' as const },
    { jewelry: j6,  price: 3400, deposit: 680, months: 5, status: 'COMPLETED' as const },
    { jewelry: j2,  price: 1760, deposit: 352, months: 4, status: 'COMPLETED' as const },
    { jewelry: j11, price: 1850, deposit: 370, months: 4, status: 'COMPLETED' as const },
    { jewelry: j7,  price:  880, deposit: 176, months: 3, status: 'COMPLETED' as const },
    { jewelry: j15, price: 2800, deposit: 560, months: 3, status: 'COMPLETED' as const },
    { jewelry: j3,  price:  320, deposit:  64, months: 3, status: 'COMPLETED' as const },
    { jewelry: j12, price:  224, deposit:  45, months: 2, status: 'COMPLETED' as const },
    { jewelry: j16, price: 1440, deposit: 288, months: 2, status: 'COMPLETED' as const },
    { jewelry: j8,  price:  720, deposit: 144, months: 2, status: 'COMPLETED' as const },
    { jewelry: j17, price: 2080, deposit: 416, months: 1, status: 'CONFIRMED' as const },
    { jewelry: j13, price:  160, deposit:  32, months: 1, status: 'CONFIRMED' as const },
    { jewelry: j4,  price:  144, deposit:  29, months: 1, status: 'CONFIRMED' as const },
    { jewelry: j18, price:  760, deposit: 152, months: 0, status: 'PENDING'   as const },
    { jewelry: j9,  price: 2200, deposit: 440, months: 0, status: 'PENDING'   as const },
  ]

  const bookings = []
  for (const b of bookingData) {
    const start = monthsAgo(b.months, 10)
    const end = monthsAgo(b.months, 18)
    const booking = await prisma.booking.create({
      data: {
        jewelryId: b.jewelry.id,
        renterId: amina.id,
        ownerId: b.jewelry.ownerId,
        startDate: start,
        endDate: end,
        totalPrice: b.price,
        deposit: b.deposit,
        status: b.status,
        insurance: b.months % 2 === 0,
      }
    })
    bookings.push(booking)
  }

  // ── Reviews ───────────────────────────────────────────────────────────────
  const reviewData = [
    { jewelry: j1,  booking: bookings[0], rating: 5, comment: "Magnifique collier, authentique et bien entretenu. La livraison était rapide et l'emballage soigné." },
    { jewelry: j3,  booking: bookings[6], rating: 5, comment: "Des boucles d'oreilles superbes ! Exactement comme sur les photos. Très satisfaite de ma location." },
    { jewelry: j7,  booking: bookings[4], rating: 4, comment: "Beau collier, qualité au rendez-vous. Quelques légères égratignures mais rien de gênant." },
    { jewelry: j15, booking: bookings[5], rating: 5, comment: "Une pièce exceptionnelle ! Les diamants sont éblouissants. Service impeccable de Pierre." },
    { jewelry: j16, booking: bookings[8], rating: 5, comment: "Bague de rêve ! Le saphir est d'une beauté rare. Je recommande vivement." },
  ]

  for (const r of reviewData) {
    await prisma.review.create({
      data: {
        reviewerId: amina.id,
        targetId: r.jewelry.id,
        targetType: 'jewelry',
        jewelryId: r.jewelry.id,
        bookingId: r.booking.id,
        rating: r.rating,
        comment: r.comment,
      }
    })
  }

  // ── Conversations & messages ───────────────────────────────────────────────
  const conversations = await Promise.all([
    prisma.conversation.create({ data: { user1Id: amina.id, user2Id: fatima.id } }),
    prisma.conversation.create({ data: { user1Id: amina.id, user2Id: karim.id } }),
    prisma.conversation.create({ data: { user1Id: amina.id, user2Id: pierre.id } }),
  ])

  const messageData = [
    { conv: conversations[0], sender: amina,  receiver: fatima,  text: "Bonjour ! Je suis intéressée par votre collier berbère. Est-il disponible pour le 15 mars ?" },
    { conv: conversations[0], sender: fatima, receiver: amina,   text: "Bonjour Amina ! Oui, il est disponible. Souhaitez-vous voir plus de photos ?" },
    { conv: conversations[0], sender: amina,  receiver: fatima,  text: "Oui s'il vous plaît, et pourriez-vous m'expliquer les conditions de location ?" },
    { conv: conversations[1], sender: amina,  receiver: karim,   text: "Bonjour Karim, votre chevalière m'intéresse beaucoup. Faites-vous des réductions pour les achats directs ?" },
    { conv: conversations[1], sender: karim,  receiver: amina,   text: "Bonjour ! Je peux vous proposer une remise de 5% si vous passez par la messagerie. Qu'en pensez-vous ?" },
    { conv: conversations[1], sender: amina,  receiver: karim,   text: "C'est très intéressant ! Je vais y réfléchir et vous recontacter rapidement." },
    { conv: conversations[2], sender: amina,  receiver: pierre,  text: "Bonjour Pierre, le collier rivière diamants est somptueux. Est-il possible de le voir en boutique ?" },
    { conv: conversations[2], sender: pierre, receiver: amina,   text: "Absolument ! Je vous accueille à Bordeaux sur rendez-vous. Quand êtes-vous disponible ?" },
    { conv: conversations[2], sender: amina,  receiver: pierre,  text: "Je pourrai être là le weekend du 20. Je vous envoie un message pour confirmer." },
  ]

  for (const m of messageData) {
    await prisma.message.create({
      data: {
        senderId: m.sender.id,
        receiverId: m.receiver.id,
        conversationId: m.conv.id,
        content: m.text,
      }
    })
  }

  // ── Estimation ─────────────────────────────────────────────────────────────
  await prisma.estimation.create({
    data: {
      userId: amina.id,
      images: [PHOTOS.ring1],
      weight: 12.5,
      purity: 'K18',
      estimatedGoldValue: 750,
      estimatedCommercialValue: 1200,
      confidence: 0.92,
      certified: false,
    }
  })

  console.log('✅ Seed terminé !')
  console.log('   👤 6 utilisateurs créés')
  console.log('   💍 18 bijoux créés (3 avec essayage 3D : j3, j16, j17)')
  console.log('   📅 15 réservations créées')
  console.log('   ⭐ 5 avis créés')
  console.log('   💬 3 conversations, 9 messages créés')
  console.log('   🔬 1 estimation créée')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
