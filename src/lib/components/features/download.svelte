<!--
  Download Component
  Shows file preview after CSV is selected
  Displays filename and formatted file size with responsive sizing
-->
<script lang="ts">
    import downloadGif from "$lib/assets/download.gif";

    interface Props {
        fileName: string;
        fileSize: number;
    }

    let { fileName, fileSize }: Props = $props();

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };
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
