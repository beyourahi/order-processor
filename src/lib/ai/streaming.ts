/**
 * SSE framing shared by the chat endpoint and the chat client.
 * `sseStream` builds the server `Response`; `streamFrames` parses it client-side.
 */
import type { Frame } from "./types";

export const encodeFrame = (frame: Frame): string => `data: ${JSON.stringify(frame)}\n\n`;

export const decodeFrame = (raw: string): Frame | null => {
    const trimmed = raw.startsWith("data: ") ? raw.slice(6).trim() : raw.trim();
    if (!trimmed) return null;
    try {
        return JSON.parse(trimmed) as Frame;
    } catch {
        return null;
    }
};

/** Server: builds a `text/event-stream` Response driven by a `push` callback. */
export const sseStream = (produce: (push: (frame: Frame) => void) => Promise<void>): Response => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            const push = (frame: Frame) => {
                try {
                    controller.enqueue(encoder.encode(encodeFrame(frame)));
                } catch {
                    /* stream already closed by the client */
                }
            };
            try {
                await produce(push);
            } catch (err) {
                push({
                    t: "error",
                    message: err instanceof Error ? err.message : "Unknown stream error"
                });
            } finally {
                try {
                    controller.close();
                } catch {
                    /* already closed */
                }
            }
        }
    });
    return new Response(stream, {
        status: 200,
        headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            "x-accel-buffering": "no"
        }
    });
};

/** Client: async-iterates decoded frames from a streamed response body. */
export const streamFrames = async function* (stream: ReadableStream<Uint8Array>): AsyncIterable<Frame> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let separatorIdx = buffer.indexOf("\n\n");
            while (separatorIdx !== -1) {
                const rawEvent = buffer.slice(0, separatorIdx);
                buffer = buffer.slice(separatorIdx + 2);
                const frame = decodeFrame(rawEvent);
                if (frame) yield frame;
                separatorIdx = buffer.indexOf("\n\n");
            }
        }
    } finally {
        reader.releaseLock();
    }
};
