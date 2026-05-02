<script lang="ts">
    import { CourierService } from "$lib/services";
    import { generateFileName } from "$lib/constants";
    import { brandSettings, hasMerchantId } from "$lib/stores";
    import { Courier } from "$lib/types";
    import type { CurrentUser } from "$lib/types";
    import { cn, parseCSV, generateExcel } from "$lib/utils";
    import { LoadingSpinner } from "$lib/components";
    import Upload from "./upload.svelte";
    import Download from "./download.svelte";

    interface Props {
        currentUser: CurrentUser;
        selectedCourier: string;
    }

    let { currentUser, selectedCourier }: Props = $props();

    let zoneHover = $state(false);
    let acceptedFile = $state<File | null>(null);
    let isProcessing = $state(false);
    let error = $state<string | null>(null);
    let fileInputRef = $state<HTMLInputElement | null>(null);

    const isSteadFast = $derived(selectedCourier === Courier.SteadFast);
    const needsMerchantId = $derived(isSteadFast && !$hasMerchantId);
    const isDisabled = $derived(selectedCourier === "" || needsMerchantId);

    const handleFileSelect = async (file: File) => {
        if (isDisabled) return;

        acceptedFile = file;
        isProcessing = true;
        error = null;

        try {
            const result = await parseCSV(file);
            if (result.errors.length > 0) {
                console.warn("CSV parsing warnings:", result.errors);
            }

            const settings = $brandSettings;
            const processedOrders = CourierService.processOrders(selectedCourier as Courier, result.data, {
                name: settings.contactName ?? currentUser.name,
                phone: settings.contactPhone ?? "",
                merchantId: settings.merchantId ?? ""
            });

            const fileName = generateFileName(selectedCourier);
            generateExcel(processedOrders, fileName, "Sheet1");

            setTimeout(() => {
                acceptedFile = null;
                zoneHover = false;
            }, 2000);
        } catch (e) {
            console.error("Processing error:", e);
            error = e instanceof Error ? e.message : "Failed to process file";
            acceptedFile = null;
        } finally {
            isProcessing = false;
        }
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!isDisabled) zoneHover = true;
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        zoneHover = false;
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        zoneHover = false;
        if (isDisabled) return;

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
        if (!isDisabled && fileInputRef) {
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
                onclick={() => (error = null)}
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
    {:else if acceptedFile}
        <Download fileName={acceptedFile.name} fileSize={acceptedFile.size} />
    {:else}
        <Upload disabled={isDisabled} {needsMerchantId} />
    {/if}
</div>
