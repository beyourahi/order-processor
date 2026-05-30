// Only the entry points consumed outside this folder are re-exported here.
// Internal pieces (header, welcome, message-list, composer, typing-indicator,
// image-upload) are imported directly via relative paths where used.
export { default as CopilotSidebar } from "./copilot-sidebar.svelte";
export { default as CopilotMobileFab } from "./copilot-mobile-fab.svelte";
export { default as CopilotMobileSheet } from "./copilot-mobile-sheet.svelte";
export { default as CopilotConfirmDialog } from "./copilot-confirm-dialog.svelte";
