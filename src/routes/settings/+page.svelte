<script lang="ts">
    import { onMount } from "svelte";
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import { browser } from "$app/environment";
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
        SettingsActions
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

    // ── Face ID / Touch ID (WebAuthn platform biometrics) ──────────
    type PasskeyRow = { id: string; name?: string | null; createdAt?: string | Date | null };
    let passkeys = $state<PasskeyRow[]>([]);
    let passkeysLoading = $state(true);
    let passkeyBusy = $state(false);
    let webauthnAvailable = $state(false);
    let passkeyError = $state<string | null>(null);

    // Friendly default name from the UA — stored as the passkey label.
    const deviceLabel = () => {
        const ua = browser ? navigator.userAgent : "";
        if (/iPhone|iPad|iPod/.test(ua)) return "iPhone (Face ID / Touch ID)";
        if (/Macintosh/.test(ua)) return "Mac (Touch ID)";
        if (/Android/.test(ua)) return "Android (fingerprint / face)";
        if (/Windows/.test(ua)) return "Windows Hello";
        return "This device";
    };

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

    onMount(() => {
        webauthnAvailable = typeof window !== "undefined" && !!window.PublicKeyCredential;
        if (webauthnAvailable) loadPasskeys();
        else passkeysLoading = false;
    });

    // Always registers a platform biometric (Face ID / Touch ID; also Windows Hello /
    // Android fingerprint) — roaming security keys are not offered.
    const addPasskey = async () => {
        passkeyBusy = true;
        passkeyError = null;
        try {
            const res = await authClient.passkey.addPasskey({
                name: deviceLabel(),
                authenticatorAttachment: "platform"
            });
            if (res?.error) passkeyError = res.error.message || "Couldn't set up Face ID / Touch ID.";
            else await loadPasskeys();
        } catch {
            passkeyError = "Setup was cancelled.";
        } finally {
            passkeyBusy = false;
        }
    };

    const removePasskey = async (id: string) => {
        if (!confirm("Remove Face ID / Touch ID? You won't be able to sign in with it anymore.")) return;
        passkeyBusy = true;
        passkeyError = null;
        try {
            const res = await authClient.passkey.deletePasskey({ id });
            if (res?.error) passkeyError = res.error.message || "Couldn't remove Face ID / Touch ID.";
            else await loadPasskeys();
        } catch {
            passkeyError = "Couldn't remove Face ID / Touch ID.";
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
    <header class="flex flex-col gap-5">
        <a
            href="/"
            class={cn(helperBase, "ease-[var(--ease)] hover:text-foreground inline-flex w-fit items-center gap-2 font-mono text-micro tracking-[0.22em] whitespace-nowrap uppercase transition-colors touch-manipulation")}
        >
            <ArrowLeft class="size-3.5" aria-hidden="true" />
            Back to app
        </a>
        <div class="flex flex-col gap-3">
            <Eyebrow>Settings</Eyebrow>
            <Heading as="h1" size="title-lg" weight={600}>Cloudflare account</Heading>
            <p class={cn(bodyBase, "max-w-prose")}>
                The Copilot runs on <span class="text-foreground">your own</span> Cloudflare account. Connecting an
                account is <span class="text-foreground">required</span> to use it.
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
    >
        <SettingsSection
            title="Cloudflare account"
            subtitle="Connect your account to power the Copilot"
            icon={Cloud}
        >
            {#snippet header()}
                <span class="text-ink-muted font-mono text-micro tracking-[0.22em] uppercase whitespace-nowrap">
                    {#if connected}
                        <span class="text-signal">●</span> Connected
                    {:else}
                        <span class="text-ink-muted">○</span> Not connected
                    {/if}
                </span>
            {/snippet}

            <SettingsRow
                label="API token"
                htmlFor="cf-token"
                stacked
                hint={connected
                    ? `Stored: ${data.maskedToken} — leave blank to keep.`
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
                hint="Right sidebar of any account page in the Cloudflare dashboard."
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
                label="Copilot model"
                htmlFor="cf-model"
                hint="Kimi K2.6 is recommended. Others are experimental and may be less reliable."
            >
                <div class="flex flex-col gap-2.5">
                    <Select
                        id="cf-model"
                        name="cloudflareModel"
                        bind:value={model}
                        options={selectModelOptions}
                        placeholder="Select a model"
                    />
                    <button
                        type="button"
                        onclick={refreshModels}
                        disabled={refreshing || !connected}
                        title="Refresh model list"
                        aria-label="Refresh models"
                        class="text-ink-muted ease-[var(--ease)] hover:text-foreground inline-flex w-fit items-center gap-1.5 font-mono text-micro tracking-[0.18em] whitespace-nowrap uppercase transition-colors touch-manipulation disabled:opacity-40"
                    >
                        <RefreshCw class={cn("size-3", refreshing && "animate-spin")} aria-hidden="true" />
                        Refresh
                    </button>
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
                            class="text-foreground underline decoration-hair underline-offset-2 wrap-break-word"
                        >
                            dash.cloudflare.com/profile/api-tokens
                        </a>
                        → Create Custom Token → permission
                        <span class="text-foreground font-mono">Account · Workers AI · Read</span>.
                    </p>
                {/snippet}
                <Cta type="submit" variant="primary" arrow={false} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                </Cta>
            </SettingsActions>
        </SettingsSection>
    </form>

    <SettingsSection
        title="Face ID / Touch ID"
        subtitle="Sign in with your device biometrics"
        icon={Fingerprint}
    >
        {#if !webauthnAvailable}
            <p class={cn(helperBase, "max-w-prose")}>
                This browser can't use Face ID / Touch ID. Open the app in Safari, Chrome, or Edge on a device with a
                biometric sensor.
            </p>
        {:else}
            {#if passkeysLoading}
                <p class={helperBase}>Loading…</p>
            {:else if passkeys.length === 0}
                <p class={cn(helperBase, "max-w-prose")}>
                    Nothing set up yet. Add Face ID / Touch ID to sign in with your device instead of Google.
                </p>
            {:else}
                <ul class="flex flex-col gap-2">
                    {#each passkeys as pk (pk.id)}
                        <li
                            class="border-hair bg-ink-2/40 flex items-center justify-between gap-3 rounded-sm border px-3 py-2.5"
                        >
                            <div class="flex min-w-0 items-center gap-2.5">
                                <Fingerprint class="text-signal size-4 shrink-0" aria-hidden="true" />
                                <div class="min-w-0">
                                    <p class="text-foreground truncate text-sm font-medium">
                                        {pk.name || "Face ID / Touch ID"}
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
                                aria-label="Remove Face ID / Touch ID"
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
                <Cta type="button" variant="primary" arrow={false} disabled={passkeyBusy} onclick={() => addPasskey()}>
                    <Fingerprint class="size-3.5" aria-hidden="true" /> Set up Face ID / Touch ID
                </Cta>
            </SettingsActions>
        {/if}
    </SettingsSection>

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
        >
            <SettingsSection title="Disconnect" subtitle="Remove your Cloudflare connection" icon={Trash2}>
                <p class={cn(helperBase, "max-w-prose")}>
                    Disconnecting removes your saved token and selected model. Your chat history is unaffected.
                </p>
                <SettingsActions>
                    <Cta type="submit" variant="secondary" arrow={false}>
                        <Trash2 class="size-3.5" aria-hidden="true" /> Disconnect
                    </Cta>
                </SettingsActions>
            </SettingsSection>
        </form>
    {/if}
</div>
