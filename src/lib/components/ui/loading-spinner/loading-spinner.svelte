<!--
  LoadingSpinner Component
  Displays an animated loading indicator using CSS keyframe animations
  The .loader class is defined in app.css with rotation and scale animations
-->
<script lang="ts">
    interface Props {
        class?: string;
    }

    let { class: className = "" }: Props = $props();
</script>

<span class={["loader", className]} role="status" aria-label="Loading">
    <span class="sr-only">Loading...</span>
</span>

<style>
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }
</style>
