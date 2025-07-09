<script>
    import { syncedCurrentIndex, isPlaying, currentSpan, nextSpan, prevSpan, dataSet, entitiesLimit } from "$lib/stores/stores";
    import { randomImages } from "$lib/scripts/content";
    import { onMount, onDestroy } from "svelte";
    import Floater from "$lib/components/floater.svelte";

    let animationFrames = new Map();

    const setPosition = (index, containerWidth = 300, containerHeight = 230) => {
        const padding = 40;
        
        // Create a more distributed initial positioning using a grid-like approach
        const cols = Math.ceil(Math.sqrt(index + 1));
        const rows = Math.ceil((index + 1) / cols);
        
        const gridX = (index % cols) / Math.max(1, cols - 1);
        const gridY = Math.floor(index / cols) / Math.max(1, rows - 1);
        
        // Add some randomness to break the perfect grid
        const randomOffsetX = (Math.random() - 0.5) * 200;
        const randomOffsetY = (Math.random() - 0.5) * 200;
        
        const x = (gridX * (window.innerWidth - containerWidth - padding * 2)) + padding + randomOffsetX;
        const y = (gridY * (window.innerHeight - containerHeight - padding * 2)) + padding + randomOffsetY;
        
        // Ensure bounds
        const boundedX = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, x));
        const boundedY = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, y));
        
        // Set z-index based on index, ensuring index 0 has good visibility
        const z = index === 0 ? 50 : index + 1;

        // Adjust scale calculation to ensure good visibility for index 0
        const baseScale = 0.5;
        const scaleMultiplier = 0.8;
        const objectDistance = baseScale + (z/50) * scaleMultiplier;
        
        return { x: boundedX, y: boundedY, z, objectDistance };
    };

    const animatePosition = (index, thisFloater, isVisible) => {
        if (!isVisible) return;

        if (thisFloater && index !== $syncedCurrentIndex) {
            const time = performance.now() * 0.005;
            const uniqueOffset = index * 0.7;
            
            const baseAmplitudeX = window.innerWidth * 0.3;
            const baseAmplitudeY = window.innerHeight * 0.3;
            const baseAmplitudeZ = 30;
            
            const waveSpeedX = 0.001 * (1 + (index % 3) * 0.5);
            const waveSpeedY = 0.001 * (1 + (index % 4) * 0.3);
            const waveSpeedZ = 0.001 * (1 + (index % 5) * 0.2);
            
            const waveX = Math.sin(time * waveSpeedX + uniqueOffset) * baseAmplitudeX;
            const waveY = Math.cos(time * waveSpeedY + uniqueOffset * 1.3) * baseAmplitudeY;
            const waveZ = Math.sin(time * waveSpeedZ + uniqueOffset * 1.8) * baseAmplitudeZ;
            
            const centerOffsetX = ((index % 7) - 3) * 100;
            const centerOffsetY = ((index % 5) - 2) * 80;
            
            const centerX = window.innerWidth / 2 + centerOffsetX;
            const centerY = window.innerHeight / 2 + centerOffsetY;
            const centerZ = 50;
            
            const secondaryX = Math.sin(time * 0.15 + uniqueOffset * 0.8) * 80;
            const secondaryY = Math.cos(time * 0.12 + uniqueOffset * 1.2) * 60;
            
            const newX = centerX + waveX + secondaryX;
            const newY = centerY + waveY + secondaryY;
            const newZ = centerZ + waveZ + (Math.sin(time * 0.08 + uniqueOffset) * 25);
            
            const padding = 20;
            const containerWidth = 300;
            const containerHeight = 230;
            
            const x = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, newX));
            const y = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, newY));
            const z = Math.max(0, Math.min(100, newZ));
            
            const scale = 0.2 + (z / 100) * 0.8;
            
            thisFloater.style.left = x + "px";
            thisFloater.style.top = y + "px";
            thisFloater.style.zIndex = Math.floor(z);
            thisFloater.style.transform = `scale(${scale})`;
            thisFloater.style.filter = `blur(${Math.max(2, (100 - z) * 0.15 + 2)}px)`;
        }
        
        if (index === $syncedCurrentIndex && thisFloater) {
            const x = window.innerWidth/2 - 400;
            const y = window.innerHeight/2 - 325;
            const z = 100;
            thisFloater.style.left = x + "px";
            thisFloater.style.top = y + "px";
            thisFloater.style.zIndex = Math.floor(z);
            thisFloater.style.transform = `scale(1)`;
            thisFloater.style.filter = "blur(0px)";
        }
        
        animationFrames.set(index, requestAnimationFrame(() => animatePosition(index, thisFloater, isVisible)));
    }

    onDestroy(() => {
        animationFrames.forEach(frame => cancelAnimationFrame(frame));
        animationFrames.clear();
    });
</script>

{#each $dataSet as segment, index}
    <Floater {index} {animatePosition} {setPosition} />
{/each}

<style>
    :global(body) {
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: rgb(0, 0, 0);
        position: relative;
    }

    :global(*) {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: "Instrument Sans";
        user-select: none;
        -webkit-user-select: none;
        transition: all 0.5s ease-in-out;
    }
</style>
