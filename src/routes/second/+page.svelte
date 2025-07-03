<script>
    import { syncedCurrentIndex, isPlaying, currentSpan, nextSpan, prevSpan, subComplete } from "$lib/stores/stores";
</script>


<div style="display: flex; flex-direction: column; gap: 10px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
    <p style="font-size: 6rem;">This is current index: {$syncedCurrentIndex}</p>
</div>