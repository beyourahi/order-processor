<script lang="ts">
    /** A single tool-call card inside an assistant message. */
    import type { CopilotToolCall, ToolName } from "$lib/ai/types";
    import { TOOL_LABELS } from "$lib/ai/tools-catalog";
    import { undoAction } from "$lib/ai/chat-client";
    import { CheckCircle2, CircleX, Loader2, ShieldAlert, Undo2 } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import CopilotAnomalyWarning from "./copilot-anomaly-warning.svelte";

    let { call }: { call: CopilotToolCall } = $props();

    // Human-readable card title — the raw tool name is never shown to the user.
    const label = $derived(TOOL_LABELS[call.name as ToolName] ?? "Copilot action");

    const statusLabel = $derived.by(() => {
        switch (call.status) {
            case "applied":
                return call.undone ? "Undone" : "Applied";
            case "rejected":
                return "Rejected";
            case "failed":
                return "Failed";
            case "pending_confirmation":
                return "Awaiting confirmation";
            default:
                return "Working…";
        }
    });

    const statusClasses = $derived.by(() => {
        if (call.undone) return "border-border bg-card text-muted-foreground";
        switch (call.status) {
            case "applied":
                return "border-courier-accent/30 bg-courier-accent/10 text-courier-accent";
            case "rejected":
                return "border-border bg-card text-muted-foreground";
            case "failed":
                return "border-destructive/40 bg-destructive/10 text-red-300";
            case "pending_confirmation":
                return "border-amber-400/30 bg-amber-400/10 text-amber-300";
            default:
                return "border-border bg-card text-muted-foreground";
        }
    });

    const canUndo = $derived(call.status === "applied" && !call.undone && !!call.undoId);
    let undoing = $state(false);

    const onUndo = () => {
        if (!call.undoId || undoing) return;
        undoing = true;
        undoAction(call.undoId);
        undoing = false;
    };
</script>

<div class="ai-enter flex w-full flex-col gap-1.5">
    <div
        class={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-solid px-2.5 py-2 text-xs",
            statusClasses
        )}
    >
        <span class="flex size-4 shrink-0 items-center justify-center">
            {#if call.status === "pending" || call.status === "pending_confirmation"}
                <Loader2 class="size-3.5 animate-spin" aria-hidden="true" />
            {:else if call.status === "applied" && !call.undone}
                <CheckCircle2 class="size-3.5" aria-hidden="true" />
            {:else if call.status === "failed"}
                <CircleX class="size-3.5" aria-hidden="true" />
            {:else}
                <ShieldAlert class="size-3.5" aria-hidden="true" />
            {/if}
        </span>
        <span class="font-medium break-words">{label}</span>
        <span class="tabular-nums">· {statusLabel}</span>
        {#if canUndo}
            <button
                type="button"
                onclick={onUndo}
                disabled={undoing}
                class={cn(
                    "text-muted-foreground hover:text-foreground hover:bg-muted border-border bg-card ml-auto inline-flex items-center gap-1 rounded-md border border-solid px-2 py-1 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    undoing && "cursor-wait"
                )}
            >
                <Undo2 class="size-3" aria-hidden="true" />
                Undo
            </button>
        {/if}
        {#if call.summary}
            <span class="w-full text-pretty">{call.summary}</span>
        {/if}
        {#if call.error}
            <span class="w-full break-words">{call.error}</span>
        {/if}
    </div>
    {#if call.anomalies.length > 0}
        <CopilotAnomalyWarning anomalies={call.anomalies} />
    {/if}
</div>
