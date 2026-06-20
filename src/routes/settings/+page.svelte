<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import { ArrowLeft, Cloud, RefreshCw, Check, Trash2 } from "@lucide/svelte";
    import { Heading, Eyebrow, Input, Cta, cn, inputBase, labelBase } from "$lib/ds";
    import type { PageData, ActionData } from "./$types";

    let { data, form }: { data: PageData; form: ActionData } = $props();

    const DEFAULT_MODEL = "@cf/moonshotai/kimi-k2.6";

    let token = $state("");
    let accountId = $state("");
    let model = $state(DEFAULT_MODEL);
    let saving = $state(false);
    let refreshing = $state(false);

    const connected = $derived(data.connected);

    // Seed (and re-seed) the editable fields from the loaded server row — runs on
    // mount and whenever `data` changes (e.g. after a save + invalidate, or a
    // model-list refresh) so the inputs reflect the persisted values.
    $effect(() => {
        accountId = data.accountId;
        model = data.model;
    });

    // Picker options from the account's live chat models. Always surfaces the
    // recommended default first and the currently-selected id, even when the live
    // list omits it (offline / not yet refreshed).
    const modelOptions = $derived.by(() => {
        const list = data.models ?? [];
        const ids = new Set(list.map((m) => m.id));
        const opts = list.map((m) => ({
            id: m.id,
            label:
                m.id === DEFAULT_MODEL
                    ? `${m.label} · recommended`
                    : `${m.label} · experimental${m.deprecated ? " (deprecated)" : ""}`
        }));
        if (!ids.has(DEFAULT_MODEL)) {
            opts.unshift({ id: DEFAULT_MODEL, label: "moonshotai/kimi-k2.6 · recommended" });
        }
        if (model && model !== DEFAULT_MODEL && !ids.has(model)) {
            opts.push({ id: model, label: `${model.replace(/^@cf\//, "")} · experimental` });
        }
        return opts;
    });

    const refreshModels = async () => {
        refreshing = true;
        try {
            await fetch("/api/cf/models?refresh=1");
            await invalidateAll();
        } finally {
            refreshing = false;
        }
    };
</script>

<svelte:head>
    <title>Settings · Order Processor</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-2xl grow flex-col gap-10 px-[var(--content-x)] py-10 sm:py-14">
    <header class="flex flex-col gap-5">
        <a
            href="/"
            class="text-ink-muted ease-[var(--ease)] hover:text-foreground inline-flex w-fit items-center gap-2 font-mono text-micro tracking-[0.22em] uppercase transition-colors"
        >
            <ArrowLeft class="size-3.5" aria-hidden="true" />
            Back to app
        </a>
        <div class="flex flex-col gap-3">
            <Eyebrow>Settings</Eyebrow>
            <Heading as="h1" size="title-lg">Copilot account</Heading>
            <p class="text-ink-muted max-w-prose text-body text-pretty">
                The Copilot runs inference on <span class="text-foreground">your own</span> Cloudflare account, billed
                to you. Connecting an account is <span class="text-foreground">required</span> to use the assistant.
            </p>
        </div>
    </header>

    <form
        method="POST"
        action="?/save"
        use:enhance={() => {
            saving = true;
            return async ({ update }) => {
                await update({ reset: false });
                token = "";
                saving = false;
            };
        }}
        class="border-hair bg-card flex flex-col gap-6 rounded-[18px] border p-5 sm:p-7"
    >
        <div class="flex items-center gap-3">
            <span class="border-hair bg-ink-2 flex size-8 items-center justify-center rounded-[10px] border">
                <Cloud class="text-ink-muted size-4" aria-hidden="true" />
            </span>
            <div class="flex flex-col gap-1">
                <Heading as="h2" size="title-sm">Cloudflare account</Heading>
                <span class="text-ink-muted font-mono text-micro tracking-[0.22em] uppercase">
                    {#if connected}
                        <span class="text-signal">●</span> Connected
                    {:else}
                        <span class="text-ink-muted">○</span> Not connected
                    {/if}
                </span>
            </div>
        </div>

        <div class="flex flex-col gap-5">
            <div>
                <label for="cf-token" class={labelBase}>API token</label>
                <Input
                    id="cf-token"
                    name="cloudflareToken"
                    type="password"
                    bind:value={token}
                    placeholder={data.maskedToken || "v1.0-…"}
                    autocomplete="off"
                />
                <p class="text-ink-muted mt-2 text-caption text-pretty">
                    {#if connected}
                        Stored: <span class="text-foreground font-mono">{data.maskedToken}</span> — leave blank to keep.
                    {:else}
                        Scoped token with the <span class="text-foreground">Account · Workers AI · Read</span>
                        permission. Encrypted at rest.
                    {/if}
                </p>
            </div>

            <div>
                <label for="cf-account" class={labelBase}>Account ID</label>
                <Input
                    id="cf-account"
                    name="cloudflareAccountId"
                    bind:value={accountId}
                    placeholder="0123456789abcdef…"
                    autocomplete="off"
                />
                <p class="text-ink-muted mt-2 text-caption text-pretty">
                    Right sidebar of any account page in the Cloudflare dashboard.
                </p>
            </div>

            <div>
                <div class="mb-2.5 flex items-center justify-between gap-3">
                    <label for="cf-model" class={cn(labelBase, "mb-0")}>Copilot model</label>
                    <button
                        type="button"
                        onclick={refreshModels}
                        disabled={refreshing || !connected}
                        title="Refresh model list"
                        aria-label="Refresh models"
                        class="text-ink-muted ease-[var(--ease)] hover:text-foreground inline-flex items-center gap-1.5 font-mono text-micro tracking-[0.18em] uppercase transition-colors disabled:opacity-40"
                    >
                        <RefreshCw class={cn("size-3", refreshing && "animate-spin")} aria-hidden="true" />
                        Refresh
                    </button>
                </div>
                <select
                    id="cf-model"
                    name="cloudflareModel"
                    bind:value={model}
                    class={cn(inputBase, "appearance-none")}
                >
                    {#each modelOptions as opt (opt.id)}
                        <option value={opt.id}>{opt.label}</option>
                    {/each}
                </select>
                <p class="text-ink-muted mt-2 text-caption text-pretty">
                    Kimi K2.6 is the recommended default. Others are experimental — quality and tool-calling vary.
                </p>
            </div>
        </div>

        {#if form?.error}
            <p class="text-destructive text-caption text-pretty" role="alert">{form.error}</p>
        {:else if form?.success && !form?.reset}
            <p class="text-signal inline-flex items-center gap-1.5 text-caption" role="status">
                <Check class="size-3.5" aria-hidden="true" /> Saved.
            </p>
        {/if}

        <div class="border-hair flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            <p class="text-ink-muted max-w-prose text-caption text-pretty">
                Create a token at
                <a
                    href="https://dash.cloudflare.com/profile/api-tokens"
                    target="_blank"
                    rel="noreferrer"
                    class="text-foreground underline decoration-hair underline-offset-2"
                >
                    dash.cloudflare.com/profile/api-tokens
                </a>
                → Create Custom Token → permission
                <span class="text-foreground font-mono">Account · Workers AI · Read</span>.
            </p>
            <Cta type="submit" variant="primary" arrow={false} disabled={saving}>
                {saving ? "Saving…" : "Save"}
            </Cta>
        </div>
    </form>

    {#if connected}
        <form
            method="POST"
            action="?/reset"
            use:enhance={() => {
                return async ({ update }) => {
                    await update({ reset: false });
                    token = "";
                    accountId = "";
                    model = DEFAULT_MODEL;
                };
            }}
            onsubmit={(e) => {
                if (
                    !confirm("Disconnect your Cloudflare account? The Copilot will stop working until you reconnect.")
                ) {
                    e.preventDefault();
                }
            }}
            class="flex flex-wrap items-center justify-between gap-3"
        >
            <p class="text-ink-muted max-w-prose text-caption text-pretty">
                Disconnecting wipes your encrypted token + selected model. Your chat history is unaffected.
            </p>
            <Cta type="submit" variant="secondary" arrow={false}>
                <Trash2 class="size-3.5" aria-hidden="true" /> Disconnect
            </Cta>
        </form>
    {/if}
</div>
