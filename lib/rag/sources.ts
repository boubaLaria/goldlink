import { promises as fs } from "fs"
import path from "path"
import prisma from "@/lib/db"

export type KnowledgeSource = {
  slug: string
  title: string
  sourceType: string
  sourcePath?: string
  content: string
  metadata?: Record<string, unknown>
}

async function readKnowledgeFiles() {
  const knowledgeDir = path.join(process.cwd(), "knowledge")
  const entries = await fs.readdir(knowledgeDir, { withFileTypes: true })
  const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"))

  return Promise.all(
    markdownFiles.map(async (file) => {
      const filePath = path.join(knowledgeDir, file.name)
      const content = await fs.readFile(filePath, "utf8")
      const title = file.name.replace(/\.md$/, "").replace(/-/g, " ")
      return {
        slug: `doc:${file.name.replace(/\.md$/, "")}`,
        title,
        sourceType: "document",
        sourcePath: `knowledge/${file.name}`,
        content,
        metadata: { kind: "markdown" },
      } satisfies KnowledgeSource
    })
  )
}

async function buildSellerSources() {
  const sellers = await prisma.user.findMany({
    where: {
      role: { in: ["SELLER", "JEWELER"] },
      verified: true,
    },
    include: {
      _count: {
        select: { ownedJewelry: true },
      },
    },
    orderBy: { rating: "desc" },
  })

  return sellers.map((seller) => ({
    slug: `seller:${seller.id}`,
    title: `Profil vendeur ${seller.firstName} ${seller.lastName}`,
    sourceType: "seller",
    content: [
      `Nom: ${seller.firstName} ${seller.lastName}`,
      `Role: ${seller.role}`,
      `Verifie: ${seller.verified ? "oui" : "non"}`,
      `Adresse: ${seller.address || "non renseignee"}`,
      `Pays: ${seller.country}`,
      `Devise: ${seller.currency}`,
      `Note moyenne: ${seller.rating}`,
      `Nombre de bijoux: ${seller._count.ownedJewelry}`,
    ].join("\n"),
    metadata: {
      sellerId: seller.id,
      role: seller.role,
      rating: seller.rating,
    },
  })) satisfies KnowledgeSource[]
}

async function buildJewelrySources() {
  const jewelry = await prisma.jewelry.findMany({
    where: { available: true },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          verified: true,
          rating: true,
          address: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return jewelry.map((item) => ({
    slug: `jewelry:${item.id}`,
    title: item.title,
    sourceType: "jewelry",
    content: [
      `Titre: ${item.title}`,
      `Description: ${item.description}`,
      `Type: ${item.type}`,
      `Purete: ${item.purity}`,
      `Poids: ${item.weight} grammes`,
      `Valeur estimee: ${item.estimatedValue} ${item.currency}`,
      `Prix location journalier: ${item.rentPricePerDay ?? "non disponible"} ${item.currency}`,
      `Prix vente: ${item.salePrice ?? "non disponible"} ${item.currency}`,
      `Disponible: ${item.available ? "oui" : "non"}`,
      `Localisation: ${item.location}, ${item.country}`,
      `Types d'annonce: ${item.listingTypes.join(", ")}`,
      `Vendeur: ${item.owner.firstName} ${item.owner.lastName}`,
      `Role vendeur: ${item.owner.role}`,
      `Vendeur verifie: ${item.owner.verified ? "oui" : "non"}`,
      `Note vendeur: ${item.owner.rating}`,
      `Adresse vendeur: ${item.owner.address || "non renseignee"}`,
    ].join("\n"),
    metadata: {
      jewelryId: item.id,
      ownerId: item.ownerId,
      type: item.type,
      purity: item.purity,
      currency: item.currency,
      location: item.location,
    },
  })) satisfies KnowledgeSource[]
}

export async function loadKnowledgeSources() {
  const [documents, sellers, jewelry] = await Promise.all([
    readKnowledgeFiles(),
    buildSellerSources(),
    buildJewelrySources(),
  ])

  return [...documents, ...sellers, ...jewelry]
}
