export interface KnowledgeChunk {
    id: string;
    text: string;
}

export const KNOWLEDGE_CORPUS: KnowledgeChunk[] = [
    {
        id: "kb-overview",
        text: "Order Processor converts Shopify order-export CSVs into courier-ready Excel (.xlsx) files for delivery in Bangladesh. You upload a CSV, the app auto-detects the Shopify format, extracts and normalizes order data (recipient names, addresses, phone numbers, amounts), and produces a downloadable spreadsheet that matches the courier's import schema. An AI Copilot can clean up the same batch through natural-language commands."
    },
    {
        id: "kb-batch",
        text: "A batch is the set of orders parsed from one uploaded CSV. It loads into an in-app output-editor grid where each row is one delivery: recipient name, full address, phone number, amount, and any notes. The grid is the source of truth — you can edit cells by hand or ask the Copilot to edit them, and the .xlsx export is generated from the current grid contents."
    },
    {
        id: "kb-couriers",
        text: "The currently supported courier is SteadFast, a Bangladesh delivery service. Each courier defines its own column schema for the exported Excel file, and orders are mapped to that schema before download. You select the active courier in the settings; the architecture is generic so additional couriers can be added later."
    },
    {
        id: "kb-column-mapping",
        text: "Column mapping is how raw CSV columns are matched to the courier's required fields (recipient name, address, phone, amount, notes). Shopify exports use known column positions, and the app concatenates separate address parts into a single delivery address. If columns are detected wrong, the Copilot can propose a corrected CSV column mapping for you to review before it is applied."
    },
    {
        id: "kb-phone-normalization",
        text: "Phone numbers are normalized to the Bangladesh mobile format: the +880 country code and any leading zeros are stripped, leaving exactly 10 digits that start with 1. This runs during processing and again on download. A landline or malformed number cannot be normalized into a valid mobile, so it is flagged as a delivery risk rather than silently altered."
    },
    {
        id: "kb-validation",
        text: "Validation checks each row for problems that would block or risk delivery — missing recipient name, empty or invalid phone number, missing address, or a missing amount. Rows with issues are surfaced as warnings in the grid. Warnings are non-blocking: you can still export, but flagged rows should be reviewed first."
    },
    {
        id: "kb-warnings-autofix",
        text: "The Copilot can auto-fix common validation warnings — trimming stray whitespace, reformatting phone numbers into the valid 10-digit mobile shape, and filling obviously derivable fields. It will not invent data: it never fabricates a name, address, phone number, or amount that is not already present or supplied by you. Numbers that cannot be safely repaired stay flagged."
    },
    {
        id: "kb-copilot-scope",
        text: "The AI Copilot accelerates batch cleanup only. It can edit cells, set batch-wide defaults, add or delete rows, auto-fix warnings, update brand settings, propose a CSV column mapping, summarize the batch, list rows, flag anomalies, and undo its last change. It does not write code, answer general questions, or do anything outside cleaning up the current courier batch and its settings."
    },
    {
        id: "kb-copilot-confirm",
        text: "Any Copilot change that touches more than one row is intercepted by the UI, which shows a diff and asks you to confirm before it applies. Single-row edits apply directly. Every Copilot mutation also pushes an undo snapshot, so an applied change can be reverted from the tool card or by asking the Copilot to undo its last change — this is separate from the grid's own Cmd+Z."
    },
    {
        id: "kb-anomalies",
        text: "The Copilot can flag anomalies: rows that look risky compared to the rest of the batch, such as an unusually high or low amount, a missing or non-mobile phone number, a missing address, or duplicate-looking entries. Flagging is informational and never changes the data on its own — you decide whether to edit, delete, or keep each flagged row."
    },
    {
        id: "kb-brand-settings",
        text: "Brand settings are per-user values stored server-side: contact name, contact phone, merchant ID, and the selected courier. The merchant ID and a selected courier are required before a batch can be processed and exported. You can edit these in the settings panel or ask the Copilot to update them. If no batch is loaded, pick a courier, set the Merchant ID, then upload a CSV."
    },
    {
        id: "kb-image-upload",
        text: "The Copilot accepts an image upload alongside a message. Attach a screenshot or photo — for example a pasted order, a receipt, or a messaging-app screenshot — and the image is transcribed so its order details (recipient name, address, phone, amount) can be folded into your request and turned into grid edits or new rows."
    },
    {
        id: "kb-language",
        text: "The Copilot understands and replies in both English and Bangla. If you write in Bangla — Bengali script or romanized — it answers entirely in Bangla, while keeping recipient names, amounts, phone numbers, addresses, and identifiers unchanged. Spreadsheet columns are referred to by their visible names such as Phone, Amount, and Address."
    }
];
