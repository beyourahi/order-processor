<!--
  OrderProcessor Component
  Main CSV upload and Excel generation component
  Handles file input, parsing, processing, and download with error states
-->
<script lang="ts">
    import { CourierService } from "$lib/services";
    import { generateFileName } from "$lib/constants";
    import { Courier } from "$lib/types";
    import type { CurrentUser } from "$lib/types";
    import { cn, parseCSV, generateExcel } from "$lib/utils";
    import Upload from "./upload.svelte";
    import Download from "./download.svelte";

    interface Props {
        currentUser: CurrentUser;
        selectedCourier: string;
    }

    let { currentUser, selectedCourier }: Props = $props();

    // Component state
    let zoneHover = $state(false);
    let acceptedFile = $state<File | null>(null);
    let isProcessing = $state(false);
    let error = $state<string | null>(null);
    let fileInputRef = $state<HTMLInputElement | null>(null);

    // Computed: is upload disabled?
    const isDisabled = $derived(selectedCourier === "" || currentUser.courier !== selectedCourier);

    // Handle file selection
    const handleFileSelect = async (file: File) => {
        if (isDisabled || !currentUser.courier) return;

        acceptedFile = file;
        isProcessing = true;
        error = null;

        try {
            // Parse CSV
            const result = await parseCSV(file);

            if (result.errors.length > 0) {
                console.warn("CSV parsing warnings:", result.errors);
            }

            // Process orders through courier service
            const processedOrders = CourierService.processOrders(currentUser.courier as Courier, result.data, {
                name: currentUser.name,
                phone: currentUser.phone || "",
                merchant_id: currentUser.merchant_id || ""
            });

            // Generate and download Excel file
            const fileName = generateFileName(currentUser.courier as string);
            generateExcel(processedOrders, fileName, "Sheet1");

            // Reset state after short delay (so user sees the download preview)
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

    // Handle drag events
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        if (!isDisabled) {
            zoneHover = true;
        }
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

    // Handle click to browse
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
            if (file) {
                handleFileSelect(file);
            }
        }
        // Reset input so same file can be selected again
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
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]",
        isDisabled
            ? "cursor-not-allowed border-zinc-800 opacity-50"
            : "cursor-pointer border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/30",
        zoneHover && "border-zinc-400 bg-zinc-900/50",
        error && "border-red-500/50"
    )}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    onclick={handleClick}
    onkeydown={(e) => e.key === "Enter" && handleClick()}
>
    <!-- Hidden file input -->
    <input
        bind:this={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        class="hidden"
        onchange={handleInputChange}
        disabled={isDisabled}
    />

    <!-- Error display -->
    {#if error}
        <div class="flex flex-col items-center gap-3 px-4 text-center sm:gap-4">
            <p class="text-sm text-red-400 sm:text-base">{error}</p>
            <button
                onclick={() => (error = null)}
                class="sleek rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white active:scale-95"
            >
                Try again
            </button>
        </div>
        <!-- Processing state -->
    {:else if isProcessing}
        <div class="flex flex-col items-center gap-3 sm:gap-4">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-8 sm:w-8"></div>
            <p class="text-sm text-zinc-400 sm:text-base">Processing...</p>
        </div>
        <!-- File accepted -->
    {:else if acceptedFile}
        <Download fileName={acceptedFile.name} fileSize={acceptedFile.size} />
        <!-- Upload prompt -->
    {:else}
        <Upload disabled={isDisabled} />
    {/if}
</div>
