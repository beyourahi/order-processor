/**
 * Inline markdown segmentation ported from the canonical chat reference.
 * Linear `Segment[]` token stream: text, bold, italic, break, bullet, link,
 * email. The reference's "let's talk" action-trigger branch is intentionally
 * omitted — that hook does not apply here.
 *
 * The block-level model below (`parseMarkdown`, `MdBlock`, `MdInline`) keeps
 * the prior public surface working — assistant messages still render
 * paragraphs, headings, bullet lists and fenced code blocks via the same
 * inline rules.
 */

export type Segment =
    | { type: "text"; value: string }
    | { type: "bold"; value: string }
    | { type: "italic"; value: string }
    | { type: "break" }
    | { type: "bullet"; value: string }
    | { type: "link"; value: string; href: string }
    | { type: "email"; value: string; href: string };

const LINK_PATTERN =
    /(https?:\/\/[^\s),\]]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\b[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.(?:com|org|net|io|app|co|dev|shop|store|ai|xyz|tech|me|info|biz|design|agency|site|online|world)(?:\/[^\s),\]]*)?)/g;

const TRAILING_PUNCT = /[.,;:!?)]+$/;

/** Strip trailing punctuation that should not be part of a clickable URL. */
export const cleanUrl = (raw: string): string => raw.replace(TRAILING_PUNCT, "");

const parseInlineLinks = (text: string): Segment[] => {
    const result: Segment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    LINK_PATTERN.lastIndex = 0;
    while ((match = LINK_PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
            result.push({ type: "text", value: text.slice(lastIndex, match.index) });
        }
        const matched = match[0];
        if (matched.includes("@")) {
            result.push({ type: "email", value: matched, href: `mailto:${matched}` });
        } else {
            const cleaned = cleanUrl(matched);
            const href = /^https?:\/\//.test(cleaned) ? cleaned : `https://${cleaned}`;
            result.push({ type: "link", value: cleaned, href });
            const trailingLen = matched.length - cleaned.length;
            if (trailingLen > 0) {
                LINK_PATTERN.lastIndex -= trailingLen;
            }
        }
        lastIndex = LINK_PATTERN.lastIndex;
    }
    if (lastIndex < text.length) {
        result.push({ type: "text", value: text.slice(lastIndex) });
    }
    return result;
};

/**
 * Parse a chat-style message into a flat segment stream.
 * Recognises: bullets (`- `), bold (`**…**`), italic (`_…_`), URLs, emails,
 * and per-line breaks. Order matters — bold splits first, italic inside
 * non-bold runs, then linkification on remaining text.
 */
export const parseInlineMarkdown = (text: string): Segment[] => {
    const segments: Segment[] = [];
    const lines = text.split("\n");
    for (let li = 0; li < lines.length; li++) {
        const line = lines[li] ?? "";
        if (line.startsWith("- ")) {
            segments.push({ type: "bullet", value: line.slice(2) });
        } else {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            for (let pi = 0; pi < parts.length; pi++) {
                const part = parts[pi];
                if (!part) continue;
                if (pi % 2 === 1) {
                    segments.push({ type: "bold", value: part });
                } else {
                    const italicParts = part.split(/(?:^|(?<=\s))_([^_\n]+?)_(?=\s|$)/g);
                    for (let ii = 0; ii < italicParts.length; ii++) {
                        const piece = italicParts[ii];
                        if (!piece) continue;
                        if (ii % 2 === 1) {
                            segments.push({ type: "italic", value: piece });
                        } else {
                            segments.push(...parseInlineLinks(piece));
                        }
                    }
                }
            }
        }
        if (li < lines.length - 1 && !line.startsWith("- ")) {
            segments.push({ type: "break" });
        }
    }
    return segments;
};

/* ── Block-level model (kept for the existing message renderer) ───────────── */

export interface MdText {
    type: "text";
    value: string;
}
export interface MdBold {
    type: "bold";
    value: string;
}
export interface MdItalic {
    type: "italic";
    value: string;
}
export interface MdCode {
    type: "code";
    value: string;
}
export interface MdLink {
    type: "link";
    href: string;
    label: string;
}

export type MdInline = MdText | MdBold | MdItalic | MdCode | MdLink;

export interface MdParagraph {
    type: "paragraph";
    lines: MdInline[][];
}
export interface MdHeading {
    type: "heading";
    nodes: MdInline[];
}
export interface MdList {
    type: "list";
    ordered: boolean;
    items: MdInline[][];
}
export interface MdCodeBlock {
    type: "codeblock";
    value: string;
}

export type MdBlock = MdParagraph | MdHeading | MdList | MdCodeBlock;

const segmentsToInline = (segments: Segment[]): MdInline[] => {
    const nodes: MdInline[] = [];
    for (const seg of segments) {
        if (seg.type === "text") nodes.push({ type: "text", value: seg.value });
        else if (seg.type === "bold") nodes.push({ type: "bold", value: seg.value });
        else if (seg.type === "italic") nodes.push({ type: "italic", value: seg.value });
        else if (seg.type === "link") nodes.push({ type: "link", href: seg.href, label: seg.value });
        else if (seg.type === "email") nodes.push({ type: "link", href: seg.href, label: seg.value });
    }
    return nodes;
};

const parseLineInline = (line: string): MdInline[] => segmentsToInline(parseInlineMarkdown(line));

const BULLET_RE = /^\s*[-*]\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const HEADING_RE = /^\s*#{1,6}\s+(.*)$/;
const FENCE_RE = /^\s*```/;

export const parseMarkdown = (raw: string): MdBlock[] => {
    const blocks: MdBlock[] = [];
    const lines = raw.replace(/\r\n/g, "\n").split("\n");
    let para: MdInline[][] = [];
    let i = 0;

    const flushPara = () => {
        if (para.length) {
            blocks.push({ type: "paragraph", lines: para });
            para = [];
        }
    };

    while (i < lines.length) {
        const line = lines[i] ?? "";

        if (FENCE_RE.test(line)) {
            flushPara();
            const body: string[] = [];
            i++;
            while (i < lines.length && !FENCE_RE.test(lines[i] ?? "")) {
                body.push(lines[i] ?? "");
                i++;
            }
            i++;
            blocks.push({ type: "codeblock", value: body.join("\n") });
            continue;
        }

        if (line.trim() === "") {
            flushPara();
            i++;
            continue;
        }

        const heading = line.match(HEADING_RE);
        if (heading) {
            flushPara();
            blocks.push({ type: "heading", nodes: parseLineInline(heading[1] ?? "") });
            i++;
            continue;
        }

        if (BULLET_RE.test(line)) {
            flushPara();
            const items: MdInline[][] = [];
            while (i < lines.length) {
                const match = (lines[i] ?? "").match(BULLET_RE);
                if (!match) break;
                items.push(parseLineInline(match[1] ?? ""));
                i++;
            }
            blocks.push({ type: "list", ordered: false, items });
            continue;
        }

        if (ORDERED_RE.test(line)) {
            flushPara();
            const items: MdInline[][] = [];
            while (i < lines.length) {
                const match = (lines[i] ?? "").match(ORDERED_RE);
                if (!match) break;
                items.push(parseLineInline(match[1] ?? ""));
                i++;
            }
            blocks.push({ type: "list", ordered: true, items });
            continue;
        }

        para.push(parseLineInline(line));
        i++;
    }

    flushPara();
    return blocks;
};
