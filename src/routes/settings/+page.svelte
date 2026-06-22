<script lang="ts">
    import { onMount } from "svelte";
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import { authClient } from "$lib/auth-client";
    import { ArrowLeft, Cloud, RefreshCw, Check, Trash2, Fingerprint } from "@lucide/svelte";
    import {
        Heading,
        Eyebrow,
        Input,
        Cta,
        cn,
        bodyBase,
        helperBase,
        metaBase,
        SettingsSection,
        SettingsRow,
        SettingsActions,
        isPlatformAuthenticatorAvailable,
        detectPlatform,
        biometricLabel
    } from "$lib/ds";
    import { Select, type SelectOption } from "$lib/components/ui";
    import type { PageData, ActionData } from "./$types";

    let { data, form }: { data: PageData; form: ActionData } = $props();

    const DEFAULT_MODEL = "@cf/moonshotai/kimi-k2.6";

    let token = $state("");
    let accountId = $state("");
    let model = $state(DEFAULT_MODEL);
    let saving = $state(false);
    let refreshing = $state(false);

    const connected = $derived(data.connected);

    // ── Platform biometrics (WebAuthn) ─────────────────────────────
    // Device-accurate label from the SSR platform hint (no flash of the wrong name).
    const biometricName = $derived(biometricLabel(detectPlatform(data.platformHint)));

    type PasskeyRow = { id: string; name?: string | null; createdAt?: string | Date | null };
    let passkeys = $state<PasskeyRow[]>([]);
    let passkeysLoading = $state(true);
    let passkeyBusy = $state(false);
    let bioSupported = $state(false);
    let passkeyError = $state<string | null>(null);

    const formatDate = (d: string | Date) => {
        const date = typeof d === "string" ? new Date(d) : d;
        return Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    };

    const loadPasskeys = async () => {
        passkeysLoading = true;
        try {
            const res = await authClient.passkey.listUserPasskeys();
            passkeys = (res?.data ?? []) as PasskeyRow[];
        } catch {
            passkeys = [];
        } finally {
            passkeysLoading = false;
        }
    };

    onMount(async () => {
        bioSupported = await isPlatformAuthenticatorAvailable();
        if (bioSupported) loadPasskeys();
        else passkeysLoading = false;
    });

    // Always registers a platform biometric (Face ID / Touch ID; also Windows Hello /
    // Android fingerprint) — roaming security keys are not offered.
    const addPasskey = async () => {
        passkeyBusy = true;
        passkeyError = null;
        try {
            const res = await authClient.passkey.addPasskey({
                name: biometricName,
                authenticatorAttachment: "platform"
            });
            if (res?.error) passkeyError = res.error.message || `Couldn't set up ${biometricName}.`;
            else await loadPasskeys();
        } catch {
            passkeyError = "Setup was cancelled.";
        } finally {
            passkeyBusy = false;
        }
    };

    const removePasskey = async (id: string) => {
        if (!confirm(`Remove ${biometricName}? You won't be able to sign in with it anymore.`)) return;
        passkeyBusy = true;
        passkeyError = null;
        try {
            const res = await authClient.passkey.deletePasskey({ id });
            if (res?.error) passkeyError = res.error.message || `Couldn't remove ${biometricName}.`;
            else await loadPasskeys();
        } catch {
            passkeyError = `Couldn't remove ${biometricName}.`;
        } finally {
            passkeyBusy = false;
        }
    };

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

    // Map the picker options to the Select's {value,label} contract. The id
    // becomes the option value (and the hidden input value), preserving the
    // `cloudflareModel` form field exactly as the native <select> submitted it.
    const selectModelOptions = $derived<SelectOption[]>(
        modelOptions.map((opt) => ({ value: opt.id, label: opt.label }))
    );

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

<div
    class="mx-auto flex w-full max-w-[var(--settings-max)] grow flex-col gap-10 px-[var(--content-x)] py-10 outline-none sm:py-14"
>
    <div class="flex justify-end">
        <Cta href="/" variant="secondary" size="sm" arrow={false} class="bg-card">
            <span class="inline-flex items-center gap-2">
                <ArrowLeft class="size-4" aria-hidden="true" /> Back to app
            </span>
        </Cta>
    </div>

    <header class="flex flex-col gap-2.5">
        <Eyebrow>Settings</Eyebrow>
        <Heading as="h1" size="title-lg" weight={600} class="whitespace-nowrap lg:text-title">
            Settings
        </Heading>
        <p class={cn(bodyBase, "max-w-prose")}>
            The Copilot runs on <span class="text-foreground">your own</span> Cloudflare account. Connecting an account
            is <span class="text-foreground">required</span> to use it.
        </p>
    </header>

    <SettingsSection
        title="Cloudflare account"
        subtitle="Bring your own Cloudflare account to power the AI features."
        icon={Cloud}
    >
        {#snippet header()}
            <span
                class={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-micro tracking-[0.14em] whitespace-nowrap uppercase",
                    connected ? "border-signal/40 text-foreground" : "border-hair text-ink-muted"
                )}
            >
                <span class={cn("size-1.5 rounded-full", connected ? "bg-signal" : "bg-ink-muted")}></span>
                {connected ? "Connected" : "Not connected"}
            </span>
        {/snippet}

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
            class="flex flex-col gap-6"
        >
            <SettingsRow
                label="API token"
                htmlFor="cf-token"
                stacked
                hint={connected
                    ? `Stored: ${data.maskedToken} — leave blank to keep it.`
                    : "An API token with the Account · Workers AI · Read permission. Stored securely. You won't see it again after saving."}
            >
                <Input
                    id="cf-token"
                    name="cloudflareToken"
                    type="password"
                    bind:value={token}
                    placeholder={data.maskedToken || "v1.0-…"}
                    autocomplete="off"
                    class="w-full"
                />
            </SettingsRow>

            <SettingsRow
                label="Account ID"
                htmlFor="cf-account"
                stacked
                hint="Found in the right sidebar of any account page in the Cloudflare dashboard."
            >
                <Input
                    id="cf-account"
                    name="cloudflareAccountId"
                    bind:value={accountId}
                    placeholder="0123456789abcdef…"
                    autocomplete="off"
                    class="w-full"
                />
            </SettingsRow>

            <SettingsRow
                label="Model"
                htmlFor="cf-model"
                hint="Kimi K2.6 is recommended. Others are experimental and may be less reliable."
            >
                <div class="flex items-center gap-2.5">
                    <button
                        type="button"
                        onclick={refreshModels}
                        disabled={refreshing || !connected}
                        title="Refresh model list"
                        aria-label="Refresh models"
                        class="text-ink-muted ease-[var(--ease)] hover:text-foreground inline-flex shrink-0 items-center gap-1.5 font-mono text-micro tracking-[0.18em] whitespace-nowrap uppercase transition-colors touch-manipulation disabled:opacity-40"
                    >
                        <RefreshCw class={cn("size-3", refreshing && "animate-spin")} aria-hidden="true" />
                        Refresh
                    </button>
                    <Select
                        id="cf-model"
                        name="cloudflareModel"
                        bind:value={model}
                        options={selectModelOptions}
                        placeholder="Select a model"
                    />
                </div>
            </SettingsRow>

            {#if form?.error}
                <p class="text-destructive text-caption text-pretty" role="alert">{form.error}</p>
            {:else if form?.success && !form?.reset}
                <p class="text-signal inline-flex items-center gap-1.5 text-caption" role="status">
                    <Check class="size-3.5" aria-hidden="true" /> Saved.
                </p>
            {/if}

            <SettingsActions>
                {#snippet status()}
                    <p class={cn(helperBase, "max-w-prose")}>
                        Create a token at
                        <a
                            href="https://dash.cloudflare.com/profile/api-tokens"
                            target="_blank"
                            rel="noreferrer"
                            class="text-foreground underline underline-offset-2 wrap-break-word"
                        >
                            dash.cloudflare.com/profile/api-tokens
                        </a>
                        -> Create Custom Token -> permission
                        <span class="text-foreground font-mono">Account · Workers AI · Read</span>.
                    </p>
                {/snippet}
                <Cta type="submit" size="sm" variant="primary" arrow={false} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                </Cta>
            </SettingsActions>
        </form>

        {#if connected}
            <div class="border-hair flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                    <p class={cn(bodyBase, "font-medium")}>Disconnect</p>
                    <p class={cn(helperBase, "mt-1 max-w-prose")}>
                        Removes your saved token and account ID. The AI features stay off until you reconnect.
                    </p>
                </div>
                <form
                    method="POST"
                    action="?/reset"
                    class="shrink-0"
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
                            !confirm(
                                "Disconnect your Cloudflare account? The AI features will stop working until you reconnect."
                            )
                        ) {
                            e.preventDefault();
                        }
                    }}
                >
                    <Cta
                        type="submit"
                        size="sm"
                        variant="secondary"
                        arrow={false}
                        class="text-destructive hover:border-destructive"
                    >
                        <span class="inline-flex items-center gap-2">
                            <Trash2 class="size-3.5" aria-hidden="true" /> Disconnect
                        </span>
                    </Cta>
                </form>
            </div>
        {/if}
    </SettingsSection>

    {#if bioSupported}
        <SettingsSection
            title={biometricName}
            subtitle={`Sign in with ${biometricName} instead of Google.`}
            icon={Fingerprint}
        >
            {#if passkeysLoading}
                <p class={helperBase}>Loading…</p>
            {:else if passkeys.length === 0}
                <p class={cn(helperBase, "max-w-prose")}>
                    Nothing set up yet. Add {biometricName} to sign in with your device instead of Google.
                </p>
            {:else}
                <ul class="flex flex-col gap-2">
                    {#each passkeys as pk (pk.id)}
                        <li
                            class="border-hair bg-ink-2/40 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                        >
                            <div class="flex min-w-0 items-center gap-2.5">
                                <Fingerprint class="text-signal size-4 shrink-0" aria-hidden="true" />
                                <div class="min-w-0">
                                    <p class="text-foreground truncate text-sm font-medium">
                                        {pk.name || biometricName}
                                    </p>
                                    {#if pk.createdAt && formatDate(pk.createdAt)}
                                        <p class={cn(metaBase, "text-micro")}>
                                            Added {formatDate(pk.createdAt)}
                                        </p>
                                    {/if}
                                </div>
                            </div>
                            <button
                                type="button"
                                onclick={() => removePasskey(pk.id)}
                                disabled={passkeyBusy}
                                aria-label={`Remove ${biometricName}`}
                                class="text-ink-muted ease-[var(--ease)] hover:text-destructive shrink-0 transition-colors touch-manipulation disabled:opacity-40"
                            >
                                <Trash2 class="size-4" aria-hidden="true" />
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}

            {#if passkeyError}
                <p class="text-destructive text-caption text-pretty" role="alert">{passkeyError}</p>
            {/if}

            <SettingsActions>
                <Cta
                    type="button"
                    size="sm"
                    variant="primary"
                    arrow={false}
                    disabled={passkeyBusy}
                    onclick={() => addPasskey()}
                >
                    <Fingerprint class="size-3.5" aria-hidden="true" /> Set up {biometricName}
                </Cta>
            </SettingsActions>
        </SettingsSection>
    {/if}
</div>
