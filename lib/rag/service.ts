import prisma from "@/lib/db"
import { cosineSimilarity } from "@/lib/rag/cosine"
import { searchJewelryForChat } from "@/lib/rag/jewelry-search"
import { createChatCompletion, createEmbeddings } from "@/lib/rag/openai"

type ChatMessageInput = {
  role: "user" | "assistant"
  content: string
}

export async function retrieveRelevantChunks(question: string, topK?: number) {
  const [queryEmbedding] = await createEmbeddings([question])
  if (!queryEmbedding) {
    return []
  }

  const chunks = await prisma.knowledgeChunk.findMany({
    include: {
      document: {
        select: {
          id: true,
          slug: true,
          title: true,
          sourceType: true,
          sourcePath: true,
        },
      },
    },
  })

  const scored = chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK ?? Number(process.env.RAG_TOP_K || 6))

  return scored
}

export async function answerWithRag(params: {
  question: string
  conversation?: ChatMessageInput[]
}) {
  const [matches, jewelrySearch] = await Promise.all([
    retrieveRelevantChunks(params.question),
    searchJewelryForChat(params.question),
  ])
  const context = matches
    .map((match, index) => {
      return [
        `[Source ${index + 1}]`,
        `Titre: ${match.document.title}`,
        `Type: ${match.document.sourceType}`,
        `Chemin: ${match.document.sourcePath || "donnee interne"}`,
        `Pertinence: ${match.score.toFixed(4)}`,
        match.content,
      ].join("\n")
    })
    .join("\n\n")

  const jewelryContext = jewelrySearch.results.length
    ? [
        "Resultats bijoux structures trouves pour cette demande:",
        ...jewelrySearch.results.map((item, index) =>
          [
            `Bijou ${index + 1}: ${item.title}`,
            `Type: ${item.type}`,
            `Purete: ${item.purity}K`,
            `Location: ${item.location}`,
            `Prix location journalier: ${item.rentPricePerDay ?? "non disponible"}`,
            `Prix vente: ${item.salePrice ?? "non disponible"}`,
            `Vendeur: ${item.owner.firstName} ${item.owner.lastName}`,
            `Lien interne: /jewelry/${item.id}`,
          ].join("\n")
        ),
      ].join("\n\n")
    : ""

  const answer = await createChatCompletion({
    question: params.question,
    context: [context, jewelryContext].filter(Boolean).join("\n\n") || "Aucun contexte pertinent n'a ete retrouve.",
    conversation: params.conversation,
  })

  const normalizedAnswer = jewelrySearch.results.length
    ? `J'ai trouve ${jewelrySearch.results.length} bijou${jewelrySearch.results.length > 1 ? "x" : ""} correspondant a votre recherche. Vous pouvez consulter directement les cartes ci-dessous pour voir l'image, le prix, les details et ouvrir la fiche du bijou.`
    : jewelrySearch.filters
      ? "Je n'ai trouve aucun bijou correspondant exactement a votre recherche dans les donnees indexees. Vous pouvez elargir la ville, le budget ou le type de bijou pour voir plus de resultats."
      : answer

  return {
    answer: normalizedAnswer,
    jewelryResults: jewelrySearch.results,
    sources: matches.map((match) => ({
      documentId: match.document.id,
      title: match.document.title,
      sourceType: match.document.sourceType,
      sourcePath: match.document.sourcePath,
      score: Number(match.score.toFixed(4)),
      excerpt: match.content.slice(0, 280),
    })),
  }
}
