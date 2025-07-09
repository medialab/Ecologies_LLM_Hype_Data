<script>
    import { syncedCurrentIndex, isPlaying, currentSpan, nextSpan, prevSpan, dataSet } from "$lib/stores/stores";
    import { randomImages, randomVideos } from "$lib/scripts/content";
    import { onMount, tick } from "svelte";
    import { writable } from "svelte/store";

    export let segment;
    export let index;

    let x = 0;
    let y = 0;
    let z = 0;
    let thisFloater; 
    let objectDistance = 0;
    let showFloater = writable(false);
    let floaterType = null;
    
    const setPosition = (index) => {
        const padding = 40;
        const containerWidth = 300;
        const containerHeight = 230;
        
        // Create a more distributed initial positioning using a grid-like approach
        const cols = Math.ceil(Math.sqrt(index + 1));
        const rows = Math.ceil((index + 1) / cols);
        
        const gridX = (index % cols) / Math.max(1, cols - 1);
        const gridY = Math.floor(index / cols) / Math.max(1, rows - 1);
        
        // Add some randomness to break the perfect grid
        const randomOffsetX = (Math.random() - 0.5) * 200;
        const randomOffsetY = (Math.random() - 0.5) * 200;
        
        x = (gridX * (window.innerWidth - containerWidth - padding * 2)) + padding + randomOffsetX;
        y = (gridY * (window.innerHeight - containerHeight - padding * 2)) + padding + randomOffsetY;
        
        // Ensure bounds
        x = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, x));
        y = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, y));
        
        z = index + 1;

        const scale = 0.5 + (z) * 0.8;
        objectDistance = scale;

        setTimeout(() => {
            setTimeout(() => {
            showFloater.set(true);
        }, 100 * index);
        }, 1000)
        
    };

    const animatePosition = () => {
        if (thisFloater && index !== $syncedCurrentIndex) {
            const time = performance.now() * 0.005;
            const uniqueOffset = index * 0.7;
            
            // Reduce amplitudes to prevent clustering
            const baseAmplitudeX = window.innerWidth * 0.3;
            const baseAmplitudeY = window.innerHeight * 0.3;
            const baseAmplitudeZ = 30;
            
            // Vary wave speeds more to create different movement patterns
            const waveSpeedX = 0.001 * (1 + (index % 3) * 0.5);
            const waveSpeedY = 0.001 * (1 + (index % 4) * 0.3);
            const waveSpeedZ = 0.001 * (1 + (index % 5) * 0.2);
            
            const waveX = Math.sin(time * waveSpeedX + uniqueOffset) * baseAmplitudeX;
            const waveY = Math.cos(time * waveSpeedY + uniqueOffset * 1.3) * baseAmplitudeY;
            const waveZ = Math.sin(time * waveSpeedZ + uniqueOffset * 1.8) * baseAmplitudeZ;
            
            // Use different center points for different floaters to spread them out
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
            
            x = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, newX));
            y = Math.max(padding, Math.min(window.innerHeight - containerHeight - padding, newY));
            z = Math.max(0, Math.min(100, newZ));
            
            const scale = 0.2 + (z / 100) * 0.8;
            const blur = Math.max(2, (100 - z) * 0.15 + 2);
            
            objectDistance = scale;
        }
        
        if (index === $syncedCurrentIndex && thisFloater) {
            x = window.innerWidth/2 - 400;
            y = window.innerHeight/2 - 325;
            z = 100;
            objectDistance = 1;
            thisFloater.style.left = x + "px";
            thisFloater.style.top = y + "px";
        }
        
        requestAnimationFrame(animatePosition);
    }

    onMount( async () => {
        floaterType = Math.random() > 0.5 ? 'image' : 'video';
        setTimeout(async () => {
            await randomImages;
            await randomVideos;
        }, 50);

        setPosition(index);
        tick().then(() => {
            animatePosition();
        });
    })

</script>

<div
    class="floater_container"
    data-index={index}
    style="left: {x}px;
    top: {y}px;
    opacity: {$showFloater ? 1 : 0};
    z-index: {Math.floor(z)};
    transform: scale({(index === $syncedCurrentIndex) ? 1 : objectDistance});
    filter: blur({Math.max(2, (100 - z) * 0.2 + 2)}px);
    transition: {(index === $syncedCurrentIndex || index === $syncedCurrentIndex + 1 || index === $syncedCurrentIndex - 1) ? 'all 2s ease-in-out' : 'none'};"
    class:showcase={index === $syncedCurrentIndex}
    bind:this={thisFloater}
    data-type={$dataSet[index].type}
    >

    <div class="floater_header">
        <p class="floater_header_text">{segment.text}</p>
    </div>

    <div class="floater_media">
        {#if $dataSet[index].type === 'quote'}
            <video src={$dataSet[index].media} autoplay muted loop data-sveltekit-preload-data="eager"></video>
        {:else if floaterType === 'image'} 
            <enhanced:img src={Object.values(randomImages)[index % Object.keys(randomImages).length].default}
            alt="Image_{index}" data-sveltekit-preload-data="eager" loading="lazy"></enhanced:img>
        {:else if floaterType === 'video'}
            <video src={Object.values(randomVideos)[index % Object.keys(randomVideos).length].default} autoplay muted loop data-sveltekit-preload-data="eager"></video>
        {/if}
    </div>
</div>

<style>

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: "Instrument Sans";
        transition: all 0.5s ease-in-out;
    }

    :root {
        --dominant-color: rgb(255, 183, 183);
    }

    .floater_container {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        gap: 0px;
        width: 300px;
        height: 230px;
        overflow: hidden;
        transform-origin: top left !important;
        transform: "";
        opacity: 0;
        transition: opacity 1s ease-in-out, filter 1s ease-in-out;
        will-change: top, left, transform, filter;
        border: 1px solid var(--dominant-color);
    }

    .floater_container.showcase {
        width: 800px;
        height: 650px;
        z-index: 9999 !important;
        filter: blur(0px) !important;
    }

    .floater_header {
        position: relative;
        width: 100%;
        height: 20%;
        height: fit-content;
        padding: 5px;
        background-color: var(--dominant-color);
        color: rgb(0, 0, 0);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .floater_header_text {
        font-size: 1rem;
        font-weight: 400;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
    }

    .floater_media {
        width: 100%;
        height: 90%;
        object-fit: cover;
        object-position: center;
        border-top: 1px solid white;
        z-index: 1;
        background-color: rgb(255, 255, 255);
    }

    :global(.floater_media video) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
    }

    :global(.floater_media img, picture) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
    }
</style>
