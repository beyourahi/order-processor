<!--
  Upload Component
  Displays the drag-and-drop upload zone or disabled state
  Uses the upload.gif animation
-->
<script lang="ts">
    import uploadGif from "$lib/assets/upload.gif";

    interface Props {
        disabled?: boolean;
    }

    let { disabled = false }: Props = $props();
</script>

<div
    class="flex flex-col items-center justify-center gap-6"
    class:opacity-50={disabled}
    class:cursor-not-allowed={disabled}
>
    <img src={uploadGif} alt="Upload animation" class="h-24 w-24 object-contain" class:grayscale={disabled} />
    <div class="flex flex-col items-center gap-2">
        <p class="text-lg font-medium text-zinc-300">
            {disabled ? "Select a courier first" : "Drop your CSV file here"}
        </p>
        <p class="text-sm text-zinc-500">
            {disabled ? "Choose a courier service to enable upload" : "or click to browse"}
        </p>
    </div>
</div>
