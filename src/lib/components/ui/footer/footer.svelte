<!--
  Footer Component
  Displays developer attribution with link
  Positioned at bottom with consistent padding
-->
<script lang="ts">
    import { APP_CONFIG } from "$lib/config";
</script>

<footer
    class="flex items-center justify-center px-4 pt-12 pb-6 text-center text-sm text-zinc-400 xl:px-8 xl:pt-2 xl:pb-6"
>
    <p>
        <a href={APP_CONFIG.author.url} target="_blank" rel="noopener noreferrer" class="group sleek">
            Designed by
            <span class="underline-offset-4 group-hover:text-white group-hover:underline">
                {APP_CONFIG.author.name}
            </span>
        </a>
    </p>
</footer>
