/**
 * Copilot RAG retrieval over the `order-processor-kb` Vectorize index. The chat
 * endpoint calls `retrieveAppKnowledge` best-effort per turn and folds the
 * result into the user message as "APP KNOWLEDGE" — a Vectorize/AI outage must
 * degrade silently to plain chat, never abort the turn (CLAUDE.md warning #16).
 */
import { embedQuery, type EmbeddingEnv } from "./embeddings";

export interface RagEnv extends EmbeddingEnv {
    VECTORIZE: VectorizeIndex;
}

export interface RagChunk {
    id: string;
    text: string;
    score: number;
}

const QUERY_INSTRUCTION =
    "Given a question about using the order processor (CSV order batches, courier mapping, validation), retrieve the most relevant help passages.";

// Drop matches below this cosine score — keeps off-topic chunks out of the
// prompt. Tuned against the static corpus; loosen only if recall suffers.
const MIN_SCORE = 0.4;

/** Embeds the query and returns top-K corpus chunks above MIN_SCORE. Empty chunk text is filtered (metadata may be absent). */
export const retrieveAppKnowledge = async (env: RagEnv, query: string, topK = 4): Promise<RagChunk[]> => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return [];
    const vector = await embedQuery(env, trimmed, QUERY_INSTRUCTION);
    const result = await env.VECTORIZE.query(vector, { topK, returnMetadata: "all" });
    return (result.matches ?? [])
        .filter((m) => typeof m.score === "number" && m.score >= MIN_SCORE)
        .map((m) => ({
            id: m.id,
            text: typeof m.metadata?.text === "string" ? m.metadata.text : "",
            score: m.score
        }))
        .filter((c) => c.text.length > 0);
};

export const formatKnowledge = (chunks: RagChunk[]): string => {
    if (chunks.length === 0) return "";
    return chunks.map((chunk, index) => `[${index + 1}] ${chunk.text}`).join("\n");
};
