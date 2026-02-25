import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ── Unsplash jewelry images ──────────────────────────────────────────────────
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

// Helper: date N months ago
function monthsAgo(n: number, day = 15) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  d.setDate(day)
  d.setHours(10, 0, 0, 0)
  return d
}

async function main() {
  console.log('🌱 Seeding database...')

  // ── Clear ──────────────────────────────────────────────────────────────────
  await prisma.review.deleteMany()
  await prisma.estimation.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.jewelry.deleteMany()
  await prisma.user.deleteMany()

  // ── Users ──────────────────────────────────────────────────────────────────
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

  // ── Jewelry ────────────────────────────────────────────────────────────────

  // Fatima — Bijoux Traditionnels (Paris)
  const [j1, j2, j3, j4, j5] = await Promise.all([
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
    prisma.jewelry.create({ data: {
      ownerId: fatima.id,
      title: "Boucles d'Oreilles Tradition Or 18K", type: 'EARRINGS', purity: 'K18',
      weight: 14.2, estimatedValue: 2650,
      description: "Boucles d'oreilles traditionnelles en or 18K avec motifs floraux ciselés à la main. Fermeture sécurisée. Design intemporel qui traverse les générations.",
      images: [PHOTOS.earrings1, PHOTOS.earrings2],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 40, salePrice: 2650,
      available: true, location: 'Paris', country: 'France', currency: 'EUR',
      views: 178, rating: 4.8, reviewCount: 4,
    }}),
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

  // Karim — Bijoutier Artisan (Marseille)
  const [j6, j7, j8, j9, j10] = await Promise.all([
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

  // Sophie — Bijoux Modernes (Lyon)
  const [j11, j12, j13, j14] = await Promise.all([
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
    prisma.jewelry.create({ data: {
      ownerId: sophie.id,
      title: "Créoles Géométriques Or 18K", type: 'EARRINGS', purity: 'K18',
      weight: 9.8, estimatedValue: 1650,
      description: "Grandes créoles géométriques hexagonales en or 18K. Design avant-gardiste entre tradition et modernité. Légères malgré leur taille grâce à un or creux de qualité.",
      images: [PHOTOS.earrings2, PHOTOS.earrings1],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 28, salePrice: 1650,
      available: true, location: 'Lyon', country: 'France', currency: 'EUR',
      views: 287, rating: 4.8, reviewCount: 7,
    }}),
    prisma.jewelry.create({ data: {
      ownerId: sophie.id,
      title: 'Bracelet Chaîne Étoiles Or 18K', type: 'BRACELET', purity: 'K18',
      weight: 8.2, estimatedValue: 1200,
      description: 'Bracelet chaîne délicat avec maillons étoilés en or 18K. Collection été. Superposable avec d\'autres bracelets. Fermoir mosqueton sécurisé.',
      images: [PHOTOS.bracelet3, PHOTOS.bracelet1],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 20, salePrice: 1200,
      available: true, location: 'Lyon', country: 'France', currency: 'EUR',
      views: 334, rating: 4.6, reviewCount: 11,
    }}),
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

  // Pierre — Haute Joaillerie (Bordeaux)
  const [j15, j16, j17, j18] = await Promise.all([
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
    prisma.jewelry.create({ data: {
      ownerId: pierre.id,
      title: 'Bague Saphir Royal Or 18K', type: 'RING', purity: 'K18',
      weight: 7.5, estimatedValue: 12500,
      description: 'Bague en or 18K serties d\'un saphir bleu royal de 3 carats entouré de diamants. Monture pavée à la main. Inspiration royale britannique. Certificat gemmologique inclus.',
      images: [PHOTOS.ring1, PHOTOS.ring3],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 180, salePrice: 12500,
      available: true, location: 'Bordeaux', country: 'France', currency: 'EUR',
      views: 389, rating: 5.0, reviewCount: 6,
    }}),
    prisma.jewelry.create({ data: {
      ownerId: pierre.id,
      title: 'Bracelet Tennis Or 18K', type: 'BRACELET', purity: 'K18',
      weight: 22.0, estimatedValue: 18500,
      description: "Bracelet tennis classique serti de 28 diamants ronds brillants en or blanc 18K. Clarté VS2, couleur F. Fermoir sécurité double. La pièce iconique de toute grande collection.",
      images: [PHOTOS.bracelet2, PHOTOS.bracelet3],
      listingTypes: ['RENT', 'SALE'], rentPricePerDay: 260, salePrice: 18500,
      available: true, location: 'Bordeaux', country: 'France', currency: 'EUR',
      views: 445, rating: 5.0, reviewCount: 7,
    }}),
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

  // ── Bookings spread over 6 months ─────────────────────────────────────────

  const bookingData = [
    // 5 months ago
    { jewelry: j1, price: 1040, deposit: 208, months: 5, status: 'COMPLETED' as const },
    { jewelry: j6, price: 3400, deposit: 680, months: 5, status: 'COMPLETED' as const },
    // 4 months ago
    { jewelry: j2, price: 1760, deposit: 352, months: 4, status: 'COMPLETED' as const },
    { jewelry: j11, price: 1850, deposit: 370, months: 4, status: 'COMPLETED' as const },
    // 3 months ago
    { jewelry: j7, price: 880, deposit: 176, months: 3, status: 'COMPLETED' as const },
    { jewelry: j15, price: 2800, deposit: 560, months: 3, status: 'COMPLETED' as const },
    { jewelry: j3, price: 320, deposit: 64, months: 3, status: 'COMPLETED' as const },
    // 2 months ago
    { jewelry: j12, price: 224, deposit: 45, months: 2, status: 'COMPLETED' as const },
    { jewelry: j16, price: 1440, deposit: 288, months: 2, status: 'COMPLETED' as const },
    { jewelry: j8, price: 720, deposit: 144, months: 2, status: 'COMPLETED' as const },
    // 1 month ago
    { jewelry: j17, price: 2080, deposit: 416, months: 1, status: 'CONFIRMED' as const },
    { jewelry: j13, price: 160, deposit: 32, months: 1, status: 'CONFIRMED' as const },
    { jewelry: j4, price: 144, deposit: 29, months: 1, status: 'CONFIRMED' as const },
    // This month
    { jewelry: j18, price: 760, deposit: 152, months: 0, status: 'PENDING' as const },
    { jewelry: j9, price: 2200, deposit: 440, months: 0, status: 'PENDING' as const },
  ]

  const bookings = []
  for (const b of bookingData) {
    const start = monthsAgo(b.months, 5)
    const end = new Date(start)
    end.setDate(end.getDate() + Math.floor(b.price / (b.jewelry.rentPricePerDay || 100)))

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
        insurance: Math.random() > 0.5,
        createdAt: start,
      },
    })
    bookings.push({ booking, jewelry: b.jewelry, status: b.status })
  }

  // ── Transactions (for completed bookings) ─────────────────────────────────
  for (const { booking, status } of bookings) {
    if (status === 'COMPLETED') {
      await prisma.transaction.create({
        data: {
          bookingId: booking.id,
          buyerId: amina.id,
          sellerId: booking.ownerId,
          jewelryId: booking.jewelryId,
          amount: booking.totalPrice,
          commission: booking.totalPrice * 0.05,
          status: 'COMPLETED',
          type: 'RENT',
        },
      })
    }
  }

  // ── Reviews ────────────────────────────────────────────────────────────────
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').slice(0, 5)
  await Promise.all(completedBookings.map(({ booking, jewelry }) =>
    prisma.review.create({
      data: {
        reviewerId: amina.id,
        targetId: jewelry.id,
        targetType: 'jewelry',
        jewelryId: jewelry.id,
        bookingId: booking.id,
        rating: Math.random() > 0.3 ? 5 : 4,
        comment: [
          'Bijou magnifique, conforme à la description. Très satisfait !',
          'Excellente qualité, vendeur très professionnel.',
          'Superbe pièce, livraison soignée. Je recommande vivement.',
          'Bijou exceptionnel pour mon mariage. Merci !',
          'Parfait en tout point, je reviendrai.',
        ][Math.floor(Math.random() * 5)],
      },
    })
  ))

  // ── Estimation ────────────────────────────────────────────────────────────
  await prisma.estimation.create({
    data: {
      userId: amina.id,
      images: [PHOTOS.necklace1],
      weight: 25.5, purity: 'K18',
      estimatedGoldValue: 11475,
      estimatedCommercialValue: 22000,
      confidence: 0.92,
      certified: false,
    },
  })

  // ── Conversations & Messages ───────────────────────────────────────────────
  const convPairs = [
    { u1: fatima, u2: amina, msgs: [
      { from: amina, to: fatima, text: 'Bonjour, le collier berbère est-il encore disponible pour le 15 mars ?' },
      { from: fatima, to: amina, text: 'Bonjour Amina ! Oui, il est disponible. Quelle est la durée souhaitée ?' },
      { from: amina, to: fatima, text: 'Une semaine pour un mariage. Quel est le tarif ?' },
      { from: fatima, to: amina, text: 'C\'est 130€/jour soit 910€ pour 7 jours, avec un dépôt de caution de 20%. Je vous envoie le contrat.' },
    ]},
    { u1: karim, u2: amina, msgs: [
      { from: amina, to: karim, text: 'Bonjour Karim, la chevalière peut-elle être personnalisée avec mes initiales ?' },
      { from: karim, to: amina, text: 'Absolument ! Comptez 10 jours supplémentaires. Un supplément de 150€ pour la gravure.' },
      { from: amina, to: karim, text: 'Parfait, je suis intéressée. Comment procède-t-on ?' },
    ]},
    { u1: pierre, u2: amina, msgs: [
      { from: amina, to: pierre, text: 'Bonjour, je souhaite louer le collier rivière pour une soirée de gala.' },
      { from: pierre, to: amina, text: 'Bonjour ! Bien sûr. La location inclut une assurance tous risques et un transport sécurisé.' },
    ]},
  ]

  for (const pair of convPairs) {
    const [id1, id2] = [pair.u1.id, pair.u2.id].sort()
    const conv = await prisma.conversation.create({
      data: { user1Id: id1, user2Id: id2 },
    })

    let lastMsg
    for (const m of pair.msgs) {
      lastMsg = await prisma.message.create({
        data: {
          senderId: m.from.id,
          receiverId: m.to.id,
          conversationId: conv.id,
          content: m.text,
          status: 'READ',
        },
      })
    }
    if (lastMsg) {
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { lastMessageId: lastMsg.id },
      })
    }
  }

  console.log('✅ Seeding completed!')
  console.log('📊 Created: 6 users, 18 jewelry, 15 bookings, reviews, 3 conversations')
  console.log('\n🔐 Credentials:')
  console.log('  admin@goldlink.com   / admin123  (ADMIN)')
  console.log('  fatima@goldlink.com  / seller123 (SELLER - Paris)')
  console.log('  karim@goldlink.com   / jeweler123(JEWELER - Marseille)')
  console.log('  sophie@goldlink.com  / seller2   (SELLER - Lyon)')
  console.log('  pierre@goldlink.com  / jeweler2  (JEWELER - Bordeaux)')
  console.log('  amina@goldlink.com   / buyer123  (BUYER)')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
