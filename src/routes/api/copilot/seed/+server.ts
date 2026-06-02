import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { KNOWLEDGE_CORPUS } from "$lib/ai/knowledge";
import { embedDocuments } from "$lib/ai/embeddings";

export const POST: RequestHandler = async ({ platform, request }) => {
    const env = platform?.env;
    if (!env?.AI || !env.VECTORIZE) {
        error(503, { message: "AI or Vectorize binding unavailable" });
    }
    const secret = env.SEED_SECRET;
    if (!secret || request.headers.get("x-seed-secret") !== secret) {
        error(401, { message: "Unauthorized" });
    }

    const texts = KNOWLEDGE_CORPUS.map((chunk) => chunk.text);
    const vectors = await embedDocuments(env, texts);
    const records = KNOWLEDGE_CORPUS.map((chunk, index) => {
        const values = vectors[index];
        if (!values) {
            throw new Error("qwen3 embedding count did not match the knowledge corpus");
        }
        return {
            id: chunk.id,
            values,
            metadata: { text: chunk.text }
        };
    });
    await env.VECTORIZE.upsert(records);

    return json({ seeded: records.length });
};
