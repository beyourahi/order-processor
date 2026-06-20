// Barrel for the Copilot UI. Only the entry points the rest of the app mounts
// directly are re-exported here (the rail, the mobile launcher/sheet, the global
// confirm dialog, and the chat-shell children the sidebar composes). Leaf pieces
// wired purely through their parent — tool-badge, anomaly-warning, message,
// conversations-panel, launcher-icon — are imported by relative path, not via this barrel.
export { default as CopilotSidebar } from "./copilot-sidebar.svelte";
export { default as CopilotMobileFab } from "./copilot-mobile-fab.svelte";
export { default as CopilotDesktopLauncher } from "./copilot-desktop-launcher.svelte";
export { default as CopilotMobileSheet } from "./copilot-mobile-sheet.svelte";
export { default as CopilotConfirmDialog } from "./copilot-confirm-dialog.svelte";
export { default as CopilotHeader } from "./copilot-header.svelte";
export { default as CopilotWelcome } from "./copilot-welcome.svelte";
export { default as CopilotMessageList } from "./copilot-message-list.svelte";
export { default as CopilotComposer } from "./copilot-composer.svelte";
export { default as CopilotTypingIndicator } from "./copilot-typing-indicator.svelte";
export { default as CopilotImageUpload } from "./copilot-image-upload.svelte";
