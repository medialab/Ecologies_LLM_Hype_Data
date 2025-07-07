<script>
    import { syncedCurrentIndex, isPlaying, currentSpan, nextSpan, prevSpan, dataSet } from "$lib/stores/stores";
    import { randomImages } from "$lib/scripts/content";
    import { onMount } from "svelte";
    import Floater from "$lib/components/floater.svelte";

    onMount(() => {
        // console.log("randomImages", randomImages)
    })
</script>

{#each $dataSet as segment, index}
    <Floater {segment} {index} />
{/each}


<style>
    :global(body) {
        width: 100vw;
        height: 100vh;
        overflow: hidden;
        background-color: rgb(0, 0, 0);
    }

</style>
