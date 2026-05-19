<script lang="ts">
    import type { SteadFastOrder } from "$lib/types";
    import { CourierService } from "$lib/services";
    import { generateFileName } from "$lib/constants";
    import { brandSettings, hasMerchantId } from "$lib/stores";
    import { Courier } from "$lib/types";
    import type { CurrentUser } from "$lib/types";
    import { cn, parseCSV } from "$lib/utils";
    import { LoadingSpinner } from "$lib/components";
    import { OutputEditor, type BatchDefaults } from "./output-editor";
    import Upload from "./upload.svelte";

    interface Props {
        currentUser: CurrentUser;
        selectedCourier: string;
        editorOpen?: boolean;
    }

    // eslint-disable-next-line no-useless-assignment -- $bindable's default is a runtime initializer, not a useless assignment.
    let { currentUser, selectedCourier, editorOpen = $bindable(false) }: Props = $props();

    let zoneHover = $state(false);
    let isProcessing = $state(false);
    let error = $state<string | null>(null);
    let fileInputRef = $state<HTMLInputElement | null>(null);

    // editor state — non-null means the editor is mounted in place of the dropzone
    let editorRows = $state<SteadFastOrder[] | null>(null);
    let editorDefaults = $state<BatchDefaults | null>(null);
    let editorFileName = $state<string>("");

    const isSteadFast = $derived(selectedCourier === Courier.SteadFast);
    const needsMerchantId = $derived(isSteadFast && !hasMerchantId());
    const isDisabled = $derived(selectedCourier === "" || needsMerchantId);
    const isEditorOpen = $derived(editorRows !== null);

    // Sync the local editor-open flag to the parent so it can switch its
    // outer layout (stack vs side-by-side) and give the editor room to grow.
    $effect(() => {
        editorOpen = isEditorOpen;
    });

    const handleFileSelect = async (file: File) => {
        if (isDisabled) return;

        isProcessing = true;
        error = null;

        try {
            const result = await parseCSV(file);
            if (result.errors.length > 0) {
                console.warn("CSV parsing warnings:", result.errors);
            }

            const settings = brandSettings.value;
            const contactName = settings.contactName ?? currentUser.name;
            const contactPhone = settings.contactPhone ?? "";
            const merchantId = settings.merchantId ?? "";

            const processedOrders = CourierService.processOrders(selectedCourier as Courier, result.data, {
                name: contactName,
                phone: contactPhone,
                merchantId
            }) as SteadFastOrder[];

            // FR-3: zero-row results still mount the editor with an empty grid
            // and a populated defaults strip — the user can add rows manually.
            editorRows = processedOrders;
            editorDefaults = {
                Invoice: merchantId,
                "Contact Name": contactName,
                "Contact Phone": contactPhone,
                "Delivery Type": "Home",
                Lot: ""
            };
            editorFileName = generateFileName(selectedCourier);
        } catch (e) {
            console.error("Processing error:", e);
            error = e instanceof Error ? e.message : "Failed to process file";
        } finally {
            isProcessing = false;
        }
    };

    const handleEditorDiscard = () => {
        editorRows = null;
        editorDefaults = null;
        editorFileName = "";
        zoneHover = false;
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!isDisabled && !isEditorOpen) zoneHover = true;
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        zoneHover = false;
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        zoneHover = false;
        if (isDisabled || isEditorOpen) return;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
                handleFileSelect(file);
            } else {
                error = "Please upload a CSV file";
            }
        }
    };

    const handleClick = () => {
        if (!isDisabled && !isEditorOpen && fileInputRef) {
            fileInputRef.click();
        }
    };

    const handleInputChange = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const files = input.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file) handleFileSelect(file);
        }
        // Reset so the same file can be selected again
        input.value = "";
    };
</script>

{#if isEditorOpen && editorRows && editorDefaults}
    <div class="w-full max-w-full xl:max-w-5xl">
        <OutputEditor
            initialRows={editorRows}
            initialDefaults={editorDefaults}
            fileName={editorFileName}
            onDiscard={handleEditorDiscard}
        />
    </div>
{:else}
    <div
        role="button"
        tabindex={isDisabled ? -1 : 0}
        class={cn(
            "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200",
            "h-56 sm:h-64 md:h-72 lg:h-80",
            "lg:w-full lg:max-w-md xl:max-w-lg",
            "ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2",
            isDisabled
                ? "border-surface-raised cursor-not-allowed opacity-50"
                : "border-border-strong hover:bg-surface/30 hover:border-border-strong/80 cursor-pointer",
            zoneHover && "bg-surface/50 border-courier-accent/60",
            error && "border-destructive/50"
        )}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        onclick={handleClick}
        onkeydown={(e) => e.key === "Enter" && handleClick()}
    >
        <input
            bind:this={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            class="hidden"
            onchange={handleInputChange}
            disabled={isDisabled}
        />

        {#if error}
            <div class="flex flex-col items-center gap-3 px-4 text-center sm:gap-4">
                <p class="text-destructive text-sm sm:text-base">{error}</p>
                <button
                    onclick={(e) => {
                        e.stopPropagation();
                        error = null;
                    }}
                    class="sleek hover:bg-surface-raised rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-95"
                >
                    Try again
                </button>
            </div>
        {:else if isProcessing}
            <div class="flex flex-col items-center gap-3 sm:gap-4">
                <LoadingSpinner size="lg" colorClass="border-t-white" />
                <p class="text-sm text-zinc-400 sm:text-base">Processing...</p>
            </div>
        {:else}
            <Upload disabled={isDisabled} {needsMerchantId} />
        {/if}
    </div>
{/if}
