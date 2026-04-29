const DEFAULT_CHUNK_SIZE = 1200
const DEFAULT_OVERLAP = 200

export type TextChunk = {
  index: number
  content: string
}

function normalizeWhitespace(input: string) {
  return input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
}

export function chunkText(
  input: string,
  chunkSize = DEFAULT_CHUNK_SIZE,
  overlap = DEFAULT_OVERLAP
): TextChunk[] {
  const text = normalizeWhitespace(input)
  if (!text) return []

  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean)
  const chunks: TextChunk[] = []
  let current = ""
  let index = 0

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph

    if (candidate.length <= chunkSize) {
      current = candidate
      continue
    }

    if (current) {
      chunks.push({ index, content: current })
      index += 1

      const tail = current.slice(Math.max(0, current.length - overlap)).trim()
      current = tail ? `${tail}\n\n${paragraph}` : paragraph
    } else {
      let cursor = 0
      while (cursor < paragraph.length) {
        const slice = paragraph.slice(cursor, cursor + chunkSize).trim()
        if (slice) {
          chunks.push({ index, content: slice })
          index += 1
        }
        cursor += Math.max(1, chunkSize - overlap)
      }
      current = ""
    }
  }

  if (current.trim()) {
    chunks.push({ index, content: current.trim() })
  }

  return chunks
}
