import "dotenv/config"
import prisma from "../lib/db"
import { chunkText } from "../lib/rag/chunk"
import { createEmbeddings } from "../lib/rag/openai"
import { loadKnowledgeSources } from "../lib/rag/sources"

async function main() {
  const provider = (process.env.RAG_PROVIDER || "ollama").toLowerCase()
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required when RAG_PROVIDER=openai")
  }

  console.log("Loading knowledge sources...")
  const sources = await loadKnowledgeSources()
  console.log(`Found ${sources.length} source documents`)

  console.log("Clearing previous RAG knowledge...")
  await prisma.knowledgeChunk.deleteMany()
  await prisma.knowledgeDocument.deleteMany()

  for (const source of sources) {
    const chunks = chunkText(source.content)
    if (!chunks.length) continue

    console.log(`Indexing ${source.slug} (${chunks.length} chunks)`)

    const embeddings = await createEmbeddings(chunks.map((chunk) => chunk.content))
    const document = await prisma.knowledgeDocument.create({
      data: {
        slug: source.slug,
        title: source.title,
        sourceType: source.sourceType,
        sourcePath: source.sourcePath,
        content: source.content,
        metadata: source.metadata,
      },
    })

    await prisma.knowledgeChunk.createMany({
      data: chunks.map((chunk, index) => ({
        documentId: document.id,
        chunkIndex: chunk.index,
        content: chunk.content,
        embedding: embeddings[index] || [],
        metadata: {
          ...source.metadata,
          sourceSlug: source.slug,
        },
      })),
    })
  }

  const chunkCount = await prisma.knowledgeChunk.count()
  console.log(`RAG ingestion complete: ${chunkCount} chunks indexed`)
}

main()
  .catch((error) => {
    console.error("RAG ingestion failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
