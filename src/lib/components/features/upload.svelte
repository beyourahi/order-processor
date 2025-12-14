<!--
  Upload Component
  Displays the drag-and-drop upload zone or disabled state
  Uses the upload.gif animation with responsive sizing
-->
<script lang="ts">
    import uploadGif from "$lib/assets/upload.gif";

    interface Props {
        disabled?: boolean;
    }

    let { disabled = false }: Props = $props();
</script>

<div
    class="flex flex-col items-center justify-center gap-4 px-4 sm:gap-6"
    class:opacity-50={disabled}
    class:cursor-not-allowed={disabled}
>
    <img
        src={uploadGif}
        alt="Upload animation"
        class="h-16 w-16 object-contain sm:h-20 sm:w-20 md:h-24 md:w-24"
        class:grayscale={disabled}
    />
    <div class="flex flex-col items-center gap-1.5 text-center sm:gap-2">
        <p class="text-base font-medium text-zinc-300 sm:text-lg">
            {disabled ? "Select a courier first" : "Drop your CSV file here"}
        </p>
        <p class="text-xs text-zinc-500 sm:text-sm">
            {disabled ? "Choose a courier service to enable upload" : "or click to browse"}
        </p>
    </div>
</div>
