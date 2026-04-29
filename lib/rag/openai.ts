const OPENAI_API_URL = "https://api.openai.com/v1"
const OLLAMA_API_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434"
const RAG_PROVIDER = (process.env.RAG_PROVIDER || "ollama").toLowerCase()

function getOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing")
  }
  return apiKey
}

function getTextFromResponsePayload(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  const outputs = Array.isArray(payload?.output) ? payload.output : []
  const parts: string[] = []

  for (const output of outputs) {
    const content = Array.isArray(output?.content) ? output.content : []
    for (const item of content) {
      if (item?.type === "output_text" && typeof item.text === "string") {
        parts.push(item.text)
      }
    }
  }

  return parts.join("\n").trim()
}

export async function createEmbeddings(inputs: string[]) {
  if (!inputs.length) return []

  if (RAG_PROVIDER === "ollama") {
    const response = await fetch(`${OLLAMA_API_URL}/api/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_EMBED_MODEL || "embeddinggemma",
        input: inputs,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama embeddings request failed: ${error}`)
    }

    const payload = await response.json()
    return (payload.embeddings || []) as number[][]
  }

  const response = await fetch(`${OPENAI_API_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAIKey()}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
      input: inputs,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI embeddings request failed: ${error}`)
  }

  const payload = await response.json()
  return (payload.data || []).map((item: any) => item.embedding as number[])
}

export async function createChatCompletion(params: {
  question: string
  context: string
  conversation?: Array<{ role: "user" | "assistant"; content: string }>
}) {
  const conversationText = (params.conversation || [])
    .slice(-6)
    .map((message) => `${message.role === "assistant" ? "Assistant" : "Utilisateur"}: ${message.content}`)
    .join("\n")

  const input = [
    conversationText ? `Historique recent:\n${conversationText}` : null,
    `Question actuelle:\n${params.question}`,
    `Contexte retrouve:\n${params.context}`,
  ]
    .filter(Boolean)
    .join("\n\n")

  const instructions = [
    "Tu es l'assistant RAG de GoldLink.",
    "Reponds en francais.",
    "Base-toi d'abord sur le contexte fourni.",
    "Si le contexte est insuffisant, dis-le clairement.",
    "N'invente ni politiques, ni disponibilites, ni donnees privees.",
    "Quand tu cites des faits, reste proche du contexte retrouve.",
    "Si des resultats bijoux structures sont presents dans le contexte, ne liste pas chaque bijou en detail dans le texte.",
    "Dans ce cas, fais une courte introduction et laisse l'interface afficher les cartes produits.",
    "N'invente jamais de liens externes ou d'URLs fictives.",
  ].join(" ")

  if (RAG_PROVIDER === "ollama") {
    const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_CHAT_MODEL || "gemma3",
        stream: false,
        messages: [
          {
            role: "system",
            content: instructions,
          },
          {
            role: "user",
            content: input,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama chat request failed: ${error}`)
    }

    const payload = await response.json()
    const content = payload?.message?.content
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Ollama chat response did not contain message content")
    }

    return content.trim()
  }

  const response = await fetch(`${OPENAI_API_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAIKey()}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      instructions,
      input,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI responses request failed: ${error}`)
  }

  const payload = await response.json()
  return getTextFromResponsePayload(payload)
}
