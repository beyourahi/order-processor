<script lang="ts">
    import downloadGif from "$lib/assets/download.gif";
    import { formatFileSize } from "$lib/utils";

    interface Props {
        fileName: string;
        fileSize: number;
    }

    let { fileName, fileSize }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center gap-4 px-4 sm:gap-6">
    <img src={downloadGif} alt="Download animation" class="h-16 w-16 object-contain sm:h-20 sm:w-20 md:h-24 md:w-24" />
    <div class="flex flex-col items-center gap-1.5 text-center sm:gap-2">
        <p class="max-w-50 truncate text-base font-medium text-zinc-300 sm:max-w-xs sm:text-lg">
            {fileName}
        </p>
        <p class="text-xs text-zinc-500 sm:text-sm">
            {formatFileSize(fileSize)}
        </p>
    </div>
</div>
