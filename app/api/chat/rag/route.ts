import { NextRequest } from "next/server"
import { answerWithRag } from "@/lib/rag/service"
import { parseJSON, sendError, sendJSON } from "@/lib/middleware"
import { z } from "zod"

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await parseJSON(request)
    if (!body) {
      return sendError("Invalid request body", 400)
    }

    const result = chatSchema.safeParse(body)
    if (!result.success) {
      return sendError(result.error.errors[0].message, 400)
    }

    const messages = result.data.messages
    const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")

    if (!latestUserMessage) {
      return sendError("A user message is required", 400)
    }

    const response = await answerWithRag({
      question: latestUserMessage.content,
      conversation: messages,
    })

    return sendJSON(response)
  } catch (error) {
    console.error("RAG chat error:", error)
    return sendError(
      error instanceof Error ? error.message : "Failed to answer with RAG",
      500
    )
  }
}
