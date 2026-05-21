/**
 * Public surface of the AI Copilot module. UI components import from here;
 * the server endpoint imports server-only modules (`client`, `streaming`,
 * `prompts`, `schemas`, `tools-catalog`) directly.
 */
export * from "./types";
export { sendMessage, createNewConversation, respondToConfirmation, undoAction } from "./chat-client";
export { detectAnomalies } from "./safety";
export { projectBatchState } from "./context";
export { parseMarkdown } from "./markdown";
export type { MdBlock, MdInline } from "./markdown";
