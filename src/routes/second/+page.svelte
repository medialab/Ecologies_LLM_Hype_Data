<script>
    import { syncedCurrentIndex, isPlaying, dataSet, entitiesLimit, syncedCurrentPeriod } from "$lib/stores/stores";
    import { septImages, septVideos, septConvs, octNovImages, octNovVideos, octNovConvs, decJanImages, decJanVideos, decJanConvs, febImages, febVideos, febConvs, marImages, marVideos, marConvs } from "$lib/scripts/content";
    import { onMount, onDestroy } from "svelte";
    import Floater from "$lib/components/floater.svelte";

    let animationFrames = new Map();
    let randomImages = [];
    let randomVideos = [];
    let randomConvs = [];

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

            const roundedZ = Math.round(z);
            
            const scale = 0.2 + (z / 100) * 0.8;
            
            thisFloater.style.left = x + "px";
            thisFloater.style.top = y + "px";
            thisFloater.style.zIndex = Math.floor(roundedZ);
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

    $: console.log("syncedCurrentPeriod,", $syncedCurrentPeriod);
    $: console.log(`${$syncedCurrentPeriod},`, randomImages, randomVideos, randomConvs);

    $: if ($syncedCurrentPeriod) {
        if ($syncedCurrentPeriod === "september") {
            randomImages = septImages;
            randomVideos = septVideos;
            randomConvs = septConvs;
            
        } else if ($syncedCurrentPeriod === "october_november") {
            randomImages = octNovImages;
            randomVideos = octNovVideos;
            randomConvs = octNovConvs;
            
        } else if ($syncedCurrentPeriod === "december_january") {
            randomImages = decJanImages;
            randomVideos = decJanVideos;
            randomConvs = decJanConvs;
            ;
        } else if ($syncedCurrentPeriod === "february") {
            randomImages = febImages;
            randomVideos = febVideos;
            randomConvs = febConvs;
            
        } else if ($syncedCurrentPeriod === "march") {
            randomImages = marImages;
            randomVideos = marVideos;
            randomConvs = marConvs;
            
        } else {
            
            randomImages = septImages;
            randomVideos = septVideos;
            randomConvs = septConvs;
        }
        
    }

    $: if ($dataSet[$syncedCurrentIndex]) {

        if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('september') === true) {
            syncedCurrentPeriod.set("september");
            document.documentElement.style.setProperty('--dominant-color', '#97d2fb');
        } else if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('october') === true) {
            syncedCurrentPeriod.set("october_november");
            document.documentElement.style.setProperty('--dominant-color', '#fb9799');
        } else if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('december') === true) {
            syncedCurrentPeriod.set("december_january");
            document.documentElement.style.setProperty('--dominant-color', '#a8e2b4');
        } else if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('february') === true) {
            syncedCurrentPeriod.set("february");
            document.documentElement.style.setProperty('--dominant-color', '#e8d1f2');
        } else if ($dataSet[$syncedCurrentIndex].text.toLowerCase().includes('march') === true) {
            syncedCurrentPeriod.set("march");
            document.documentElement.style.setProperty('--dominant-color', '#ffce93');
        } else {
            syncedCurrentPeriod.set("september");
        }
    }

    onDestroy(() => {
        animationFrames.forEach(frame => cancelAnimationFrame(frame));
        animationFrames.clear();
    });
</script>

{#each $dataSet as segment, index}
    <Floater {index} {animatePosition} {setPosition} {randomImages} {randomVideos} {randomConvs} />
{/each}

<style>
</style>
