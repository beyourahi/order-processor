/**
 * Chat invocation goes through an AI Gateway dynamic route, never a bound model.
 * `openGatewayChat` calls the virtual route `dynamic/copilot-chain`; the gateway
 * cascades the model chain on failure. The actual routing config lives in the
 * Cloudflare AI Gateway dashboard keyed by `AI_GATEWAY_SLUG`, NOT here — editing
 * `MODEL_CHAIN` documents intent but does not change runtime behaviour unless the
 * dashboard route matches (CLAUDE.md warning #22).
 */

export const DYNAMIC_ROUTE = "dynamic/copilot-chain" as const;

// Fallback order the dashboard route is expected to mirror: kimi → gemma → scout.
export const MODEL_CHAIN = [
    "@cf/moonshotai/kimi-k2.6",
    "@cf/google/gemma-4-26b-a4b-it",
    "@cf/meta/llama-4-scout-17b-16e-instruct"
] as const;

export const FIRST_TOKEN_TIMEOUT_MS = 8000;

export interface GatewayEnv {
    AI: Ai;
    AI_GATEWAY_SLUG?: string;
}

export interface GatewayChatOptions {
    conversationId?: string;
    cacheKey?: string;
}

export interface GatewayChatResult {
    stream: ReadableStream<Uint8Array>;
    servedModel: string | null;
    servedProvider: string | null;
}

type AiRun = (
    model: string,
    input: Record<string, unknown>,
    opts?: { gateway?: { id: string; skipCache?: boolean; cacheKey?: string } }
) => Promise<unknown>;

export const openGatewayChat = async (
    env: GatewayEnv,
    input: Record<string, unknown>,
    options?: GatewayChatOptions
): Promise<GatewayChatResult> => {
    // Required: dynamic-route invocation has no model to fall back to without it.
    const slug = env.AI_GATEWAY_SLUG;
    if (!slug || slug.length === 0) {
        throw new Error("AI_GATEWAY_SLUG is not configured");
    }
    // Default to skipCache so live chat turns aren't served stale; a caller-
    // supplied cacheKey opts a turn into the gateway cache.
    const gateway = options?.cacheKey
        ? { id: slug, skipCache: false, cacheKey: options.cacheKey }
        : { id: slug, skipCache: true };
    const ai = env.AI as unknown as { run: AiRun };
    const stream = (await ai.run(DYNAMIC_ROUTE, input, { gateway })) as ReadableStream<Uint8Array>;
    // servedModel/servedProvider are reserved for surfacing which chain link
    // answered; the dynamic route does not expose it on the stream, so null.
    return { stream, servedModel: null, servedProvider: null };
};
