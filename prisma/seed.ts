import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.review.deleteMany()
  await prisma.estimation.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.jewelry.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const [hashedAdminPwd, hashedSellerPwd, hashedJewelerPwd, hashedBuyerPwd] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('seller123', 10),
    bcrypt.hash('jeweler123', 10),
    bcrypt.hash('buyer123', 10),
  ])

  const [_admin, seller, jeweler, buyer] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@goldlink.com',
        hashedPassword: hashedAdminPwd,
        firstName: 'Admin',
        lastName: 'GoldLink',
        phone: '+33 1 23 45 67 89',
        role: 'ADMIN',
        verified: true,
        address: 'Paris, France',
        country: 'France',
        currency: 'EUR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'fatima@goldlink.com',
        hashedPassword: hashedSellerPwd,
        firstName: 'Fatima',
        lastName: 'Zahra',
        phone: '+33 6 11 11 11 11',
        role: 'SELLER',
        verified: true,
        address: 'Lyon, France',
        country: 'France',
        currency: 'EUR',
        rating: 4.8,
        cin: 'AB123456',
      },
    }),
    prisma.user.create({
      data: {
        email: 'karim@goldlink.com',
        hashedPassword: hashedJewelerPwd,
        firstName: 'Karim',
        lastName: 'Bennani',
        phone: '+33 6 22 22 22 22',
        role: 'JEWELER',
        verified: true,
        address: 'Marseille, France',
        country: 'France',
        currency: 'EUR',
        rating: 4.9,
        cin: 'CD789012',
      },
    }),
    prisma.user.create({
      data: {
        email: 'amina@goldlink.com',
        hashedPassword: hashedBuyerPwd,
        firstName: 'Amina',
        lastName: 'El Fassi',
        phone: '+33 6 33 33 33 33',
        role: 'BUYER',
        verified: true,
        address: 'Toulouse, France',
        country: 'France',
        currency: 'EUR',
        rating: 4.7,
        cin: 'EF345678',
      },
    }),
  ])

  // Create jewelry listings
  const jewelry1 = await prisma.jewelry.create({
    data: {
      ownerId: seller.id,
      title: 'Collier Traditionnel Or 18K',
      description: 'Magnifique collier traditionnel en or 18K, travail artisanal authentique.',
      images: ['/uploads/jewelry/necklace1.svg'],
      type: 'NECKLACE',
      weight: 45.5,
      purity: 'K18',
      estimatedValue: 8500,
      listingTypes: ['RENT', 'SALE'],
      rentPricePerDay: 120,
      salePrice: 8500,
      available: true,
      location: 'Paris',
      country: 'France',
      currency: 'EUR',
      views: 245,
      rating: 4.9,
      reviewCount: 3,
    },
  })

  await prisma.jewelry.createMany({
    data: [
      {
        ownerId: seller.id,
        title: 'Bracelet Or 22K',
        description: 'Bracelet élégant en or 22K avec finitions dorées.',
        images: ['/uploads/jewelry/bracelet1.svg'],
        type: 'BRACELET',
        weight: 28.3,
        purity: 'K22',
        estimatedValue: 5200,
        listingTypes: ['RENT', 'SALE'],
        rentPricePerDay: 80,
        salePrice: 5200,
        available: true,
        location: 'Lyon',
        country: 'France',
        currency: 'EUR',
        views: 156,
        rating: 4.7,
        reviewCount: 2,
      },
      {
        ownerId: jeweler.id,
        title: 'Boucles d\'oreilles Or 18K',
        description: "Paire de boucles d'oreilles en or 18K avec perles.",
        images: ['/uploads/jewelry/earrings1.svg'],
        type: 'EARRINGS',
        weight: 12.5,
        purity: 'K18',
        estimatedValue: 1850,
        listingTypes: ['RENT', 'SALE'],
        rentPricePerDay: 35,
        salePrice: 1850,
        available: true,
        location: 'Marseille',
        country: 'France',
        currency: 'EUR',
        views: 98,
        rating: 4.8,
        reviewCount: 1,
      },
      {
        ownerId: seller.id,
        title: 'Bague Fiançailles Or 24K',
        description: 'Bague de fiançailles luxe en or 24K pur.',
        images: ['/uploads/jewelry/ring1.svg'],
        type: 'RING',
        weight: 8.2,
        purity: 'K24',
        estimatedValue: 3500,
        listingTypes: ['SALE'],
        salePrice: 3500,
        available: true,
        location: 'Bordeaux',
        country: 'France',
        currency: 'EUR',
        views: 312,
        rating: 5.0,
        reviewCount: 5,
      },
      {
        ownerId: jeweler.id,
        title: 'Chaîne Or 22K',
        description: 'Chaîne fine en or 22K, travail délicat.',
        images: ['/uploads/jewelry/chain1.svg'],
        type: 'CHAIN',
        weight: 35.0,
        purity: 'K22',
        estimatedValue: 6200,
        listingTypes: ['RENT', 'SALE'],
        rentPricePerDay: 95,
        salePrice: 6200,
        available: true,
        location: 'Nice',
        country: 'France',
        currency: 'EUR',
        views: 178,
        rating: 4.6,
        reviewCount: 2,
      },
      {
        ownerId: seller.id,
        title: 'Pendentif Or 18K Émeraude',
        description: 'Pendentif élégant avec émeraude naturelle.',
        images: ['/uploads/jewelry/pendant1.svg'],
        type: 'PENDANT',
        weight: 15.8,
        purity: 'K18',
        estimatedValue: 2800,
        listingTypes: ['RENT', 'SALE'],
        rentPricePerDay: 45,
        salePrice: 2800,
        available: true,
        location: 'Toulouse',
        country: 'France',
        currency: 'EUR',
        views: 134,
        rating: 4.9,
        reviewCount: 2,
      },
    ],
  })

  // Create a booking
  const startDate = new Date(2026, 1, 28) // Feb 28, 2026
  const endDate = new Date(2026, 2, 7)    // Mar 7, 2026
  const days = 8
  const totalPrice = (jewelry1.rentPricePerDay || 0) * days

  const booking = await prisma.booking.create({
    data: {
      jewelryId: jewelry1.id,
      renterId: buyer.id,
      ownerId: seller.id,
      startDate,
      endDate,
      totalPrice,
      deposit: totalPrice * 0.2,
      status: 'CONFIRMED',
      insurance: true,
    },
  })

  await prisma.transaction.create({
    data: {
      bookingId: booking.id,
      buyerId: buyer.id,
      sellerId: seller.id,
      amount: totalPrice,
      commission: totalPrice * 0.05,
      status: 'COMPLETED',
      type: 'RENT',
    },
  })

  await Promise.all([
    prisma.review.create({
      data: {
        reviewerId: buyer.id,
        targetId: jewelry1.id,
        targetType: 'jewelry',
        jewelryId: jewelry1.id,
        bookingId: booking.id,
        rating: 5,
        comment: 'Magnifique collier ! Exactement comme décrit. Très satisfait !',
      },
    }),
    prisma.review.create({
      data: {
        reviewerId: buyer.id,
        targetId: seller.id,
        targetType: 'user',
        targetUserId: seller.id,
        bookingId: booking.id,
        rating: 5,
        comment: 'Excellente expérience avec Fatima. Très professionnelle et fiable.',
      },
    }),
  ])

  await prisma.estimation.create({
    data: {
      userId: buyer.id,
      images: ['/uploads/estimations/est1.svg'],
      weight: 25.5,
      purity: 'K18',
      estimatedGoldValue: 11475,
      estimatedCommercialValue: 22000,
      confidence: 0.92,
      certified: false,
    },
  })

  const conversation = await prisma.conversation.create({
    data: {
      user1Id: [seller.id, buyer.id].sort()[0],
      user2Id: [seller.id, buyer.id].sort()[1],
    },
  })

  const msg1 = await prisma.message.create({
    data: {
      senderId: buyer.id,
      receiverId: seller.id,
      conversationId: conversation.id,
      content: 'Bonjour, le collier est-il encore disponible?',
      status: 'READ',
    },
  })

  const msg2 = await prisma.message.create({
    data: {
      senderId: seller.id,
      receiverId: buyer.id,
      conversationId: conversation.id,
      content: "Oui, il est disponible! Voulez-vous le louer ou l'acheter?",
      status: 'READ',
    },
  })

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageId: msg2.id },
  })

  console.log('✅ Seeding completed!')
  console.log('📊 Created: 4 users, 6 jewelry, 1 booking, 1 transaction, 2 reviews, 1 estimation, 1 conversation (2 messages)')
  console.log('\n🔐 Test credentials:')
  console.log('   admin@goldlink.com   / admin123')
  console.log('   fatima@goldlink.com  / seller123')
  console.log('   karim@goldlink.com   / jeweler123')
  console.log('   amina@goldlink.com   / buyer123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
