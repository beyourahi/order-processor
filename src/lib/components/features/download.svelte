<!--
  Download Component
  Shows file preview after CSV is selected
  Displays filename and formatted file size
-->
<script lang="ts">
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

<div class="flex flex-col items-center justify-center gap-6">
    <img src="/download.gif" alt="Download animation" class="h-24 w-24 object-contain" />
    <div class="flex flex-col items-center gap-2">
        <p class="max-w-xs truncate text-lg font-medium text-zinc-300">
            {fileName}
        </p>
        <p class="text-sm text-zinc-500">
            {formatFileSize(fileSize)}
        </p>
    </div>
</div>
